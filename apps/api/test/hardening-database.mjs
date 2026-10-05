import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { configureApp } from '../dist/config/configure-app.js';
import { searchSql } from '../dist/search/search.sql.js';
const schema = 'rawan_hardening_test_' + randomUUID().replaceAll('-', '');
const sql = new pg.Client({
  connectionString: process.env.TEST_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
let created = false,
  prisma,
  app;
try {
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await sql.query(`SET search_path TO "${schema}"`);
  const migrations = new URL(
    '../../../packages/database/prisma/migrations/',
    import.meta.url,
  );
  for (const entry of (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await sql.query(
      await readFile(
        new URL(entry.name + '/migration.sql', migrations),
        'utf8',
      ),
    );
  await sql.query(`INSERT INTO "User" (id,email,name,role,"updatedAt") VALUES ('u','hardening@example.invalid','Hardening','ADMIN',now());
    INSERT INTO "Author" (id,"userId","displayName","updatedAt") VALUES ('a','u','Author',now());
    INSERT INTO "Project" (id,"authorId",title,"updatedAt") VALUES ('p','a','Project',now());
    INSERT INTO "Book" (id,"projectId",title,position,"updatedAt") SELECT 'b'||n,'p','Book '||n,n,now() FROM generate_series(1,60) n;
    INSERT INTO "Chapter" (id,"bookId",title,position,"updatedAt") SELECT 'c'||n,'b1','Chapter '||n,n,now() FROM generate_series(1,60) n;
    INSERT INTO "Scene" (id,"chapterId",title,content,position,"updatedAt") SELECT 's'||n,'c1','Castle scene '||n,'Private story text',n,now() FROM generate_series(1,1000) n;
    INSERT INTO "Timeline" (id,"projectId",name,"updatedAt") SELECT 't'||n,'p','Timeline '||n,now() FROM generate_series(1,60) n;
    INSERT INTO "Era" (id,"timelineId",name,position,"updatedAt") SELECT 'e'||n,'t1','Era '||n,n,now() FROM generate_series(1,60) n;
    INSERT INTO "TimelineEvent" (id,"projectId","timelineId",title,start,position,"updatedAt") SELECT 'v'||n,'p','t1','Castle event '||n,n,n,now() FROM generate_series(1,1000) n;
    INSERT INTO "AiGeneration" (id,"projectId","requestedByUserId",task,instructions,"inputText",context,provider,model,"promptVersion","updatedAt") SELECT 'g'||n,'p','u','BRAINSTORM','Ideas','','[]'::jsonb,'fake','fake-v1','v1',now() FROM generate_series(1,1000) n;`);
  // ANALYZE only our isolated tables; no global statistics or real data are changed.
  for (const table of [
    'User',
    'Author',
    'Project',
    'Book',
    'Chapter',
    'Scene',
    'Timeline',
    'Era',
    'TimelineEvent',
    'AiGeneration',
  ])
    await sql.query(`ANALYZE "${table}"`);
  prisma = new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: process.env.TEST_DATABASE_URL,
        options: `-c search_path=${schema}`,
      },
      { schema },
    ),
  });
  await prisma.$connect();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const jwt = await import('@nestjs/jwt');
  const token = await app.get(jwt.JwtService).signAsync({ sub: 'u' });
  const base = await app.getUrl();
  let checks = 0;
  for (const route of [
    '/projects/p/books',
    '/projects/p/books/b1/chapters',
    '/projects/p/timelines',
    '/timelines/t1/eras',
  ]) {
    const get = async (query) => {
      const r = await fetch(base + '/api/v1' + route + query, {
        headers: { Authorization: 'Bearer ' + token },
      });
      assert.equal(r.status, 200);
      checks++;
      return r.json();
    };
    const defaultPage = await get('');
    assert.equal(defaultPage.length, 50);
    const full = await get('?limit=100');
    assert.equal(full.length, 60);
    assert.deepEqual(await get('?limit=2&offset=2'), full.slice(2, 4));
    const invalid = await fetch(base + '/api/v1' + route + '?limit=101', {
      headers: { Authorization: 'Bearer ' + token },
    });
    assert.equal(invalid.status, 400);
    checks++;
  }
  const observations = [];
  const search = searchSql('u', 'p', { q: 'castle', limit: 20 });
  for (const [name, query, values] of [
    ['project search', search.text, search.values],
    [
      'scene list',
      'SELECT id,title FROM "Scene" WHERE "chapterId"=$1 ORDER BY position,"createdAt",id LIMIT 51',
      ['c1'],
    ],
    [
      'event list',
      'SELECT id,title FROM "TimelineEvent" WHERE "timelineId"=$1 ORDER BY start,position,id LIMIT 51',
      ['t1'],
    ],
    [
      'AI summary list',
      'SELECT id,status,"createdAt" FROM "AiGeneration" WHERE "projectId"=$1 ORDER BY "createdAt" DESC,id LIMIT 51',
      ['p'],
    ],
    [
      'pending AI recovery',
      'SELECT id FROM "AiGeneration" WHERE status=$1 ORDER BY "createdAt" LIMIT 100',
      ['QUEUED'],
    ],
  ]) {
    const result = await sql.query(
      'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' + query,
      values,
    );
    const plan = result.rows[0]['QUERY PLAN'][0];
    observations.push({ name, plan });
  }
  const output = new URL('../.data/hardening/', import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(
    new URL('query-plans.json', output),
    JSON.stringify(observations, null, 2) + '\n',
  );
  console.log(
    `Hardening PostgreSQL passed: ${checks} real HTTP array pagination checks; five EXPLAIN ANALYZE plans saved using isolated 1,000-row data. No timing thresholds asserted.`,
  );
} finally {
  try {
    await app?.close();
  } finally {
    try {
      await prisma?.$disconnect();
    } finally {
      try {
        if (created && /^rawan_hardening_test_[a-f0-9]{32}$/.test(schema))
          await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await sql.end();
      }
    }
  }
}
