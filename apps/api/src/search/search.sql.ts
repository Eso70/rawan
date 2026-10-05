import { Prisma } from '@rawan/database';
import { BadRequestException } from '@nestjs/common';
import type { SearchResultKind } from '@rawan/types';
import { literalPattern, pagination } from '../query/query.js';
import type { SearchQueryDto } from './search.dto.js';

// These SQL identifiers/joins are static application code, never request values.
const sources: {
  kind: SearchResultKind;
  from: Prisma.Sql;
  title: Prisma.Sql;
  body: Prisma.Sql;
}[] = [
  {
    kind: 'PROJECT',
    from: Prisma.sql`owned r`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`coalesce(r.description,'')`,
  },
  {
    kind: 'BOOK',
    from: Prisma.sql`"Book" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`coalesce(r.description,'')`,
  },
  {
    kind: 'CHAPTER',
    from: Prisma.sql`"Chapter" r JOIN "Book" b ON b.id=r."bookId" JOIN owned p ON p.id=b."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`coalesce(r.description,'')`,
  },
  {
    kind: 'SCENE',
    from: Prisma.sql`"Scene" r JOIN "Chapter" c ON c.id=r."chapterId" JOIN "Book" b ON b.id=c."bookId" JOIN owned p ON p.id=b."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`concat_ws(' ',r.description,r.content)`,
  },
  {
    kind: 'CHARACTER',
    from: Prisma.sql`"Character" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.name`,
    body: Prisma.sql`concat_ws(' ',r.summary,r.description)`,
  },
  {
    kind: 'PLACE',
    from: Prisma.sql`"Place" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.name`,
    body: Prisma.sql`concat_ws(' ',r.summary,r.description)`,
  },
  {
    kind: 'FACTION',
    from: Prisma.sql`"Faction" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.name`,
    body: Prisma.sql`concat_ws(' ',r.summary,r.description)`,
  },
  {
    kind: 'ARTIFACT',
    from: Prisma.sql`"Artifact" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.name`,
    body: Prisma.sql`concat_ws(' ',r.summary,r.description)`,
  },
  {
    kind: 'TIMELINE_EVENT',
    from: Prisma.sql`"TimelineEvent" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`concat_ws(' ',r.summary,r.description)`,
  },
  {
    kind: 'PLOT',
    from: Prisma.sql`"Plot" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`coalesce(r.description,'')`,
  },
  {
    kind: 'PLOT_POINT',
    from: Prisma.sql`"PlotPoint" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`coalesce(r.description,'')`,
  },
  {
    kind: 'NOTE',
    from: Prisma.sql`"Note" r JOIN owned p ON p.id=r."projectId"`,
    title: Prisma.sql`r.title`,
    body: Prisma.sql`r.content`,
  },
];
export function searchSql(
  userId: string,
  projectId: string,
  query: SearchQueryDto,
): Prisma.Sql {
  const pattern = literalPattern(query.q);
  const selected = sources.filter(
    (source) => query.kind === undefined || query.kind === source.kind,
  );
  if (!selected.length)
    throw new BadRequestException('Unsupported search result kind');
  const branches = selected.map(
    (source) =>
      Prisma.sql`SELECT ${source.kind}::text AS kind,r.id,${source.title} AS title,${source.body} AS body,r."updatedAt" FROM ${source.from}`,
  );
  const { take, skip } = pagination(query);
  return Prisma.sql`WITH owned AS MATERIALIZED (
    SELECT p.* FROM "Project" p JOIN "Author" a ON a.id=p."authorId" WHERE p.id=${projectId} AND a."userId"=${userId}
  ), candidates AS (${Prisma.join(branches, ' UNION ALL ')}), matches AS (
    SELECT *, CASE WHEN lower(title)=lower(${query.q}) THEN 0 WHEN title ILIKE ${pattern + '%'} THEN 1 WHEN title ILIKE ${'%' + pattern + '%'} THEN 2 ELSE 3 END AS rank
    FROM candidates WHERE title ILIKE ${'%' + pattern + '%'} OR body ILIKE ${'%' + pattern + '%'}
  ) SELECT kind,id,${projectId}::text AS "projectId",title,
    substring(body FROM greatest(1,position(lower(${query.q}) IN lower(body))-60) FOR 240) AS snippet,"updatedAt"
    FROM matches ORDER BY rank ASC,"updatedAt" DESC,kind ASC,id ASC LIMIT ${take} OFFSET ${skip}`;
}
