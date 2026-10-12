import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { PrismaService } from '../dist/database/prisma.service.js';
import { EmailMailer } from '../dist/mail/email-mailer.js';
import { configureApp } from '../dist/config/configure-app.js';
import { createOpenApiDocument } from '../dist/contracts/openapi.js';
import { assertActualResponse } from './assert-contract.mjs';

process.env.EMAIL_CODE_SECRET = 'test-only-pepper-with-more-than-32-characters';
process.env.EMAIL_SIGNUP_ENABLED = 'true';
process.env.GMAIL_APP_PASSWORD = 'abcdefghijklmnop';
const { AppModule } = await import('../dist/app.module.js');
const schema = 'rawan_email_test_' + randomUUID().replaceAll('-', '');
const databaseUrl = process.env.TEST_DATABASE_URL;
const sql = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});
let created = false,
  prisma,
  app;
const mailbox = [];
let failMail = false,
  checks = 0;
const mailer = {
  assertReady() {},
  async sendVerification(email, code) {
    if (failMail) throw Error('Simulated SMTP failure');
    mailbox.push({ email, code });
  },
};
try {
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await sql.query(`SET search_path TO "${schema}"`);
  const migrations = new URL(
    '../../../packages/database/prisma/migrations/',
    import.meta.url,
  );
  for (const folder of (await readdir(migrations, { withFileTypes: true }))
    .filter((f) => f.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await sql.query(
      await readFile(
        new URL(folder.name + '/migration.sql', migrations),
        'utf8',
      ),
    );
  prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: databaseUrl, options: `-c search_path=${schema}` },
      { schema },
    ),
  });
  await prisma.$connect();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(EmailMailer)
    .useValue(mailer)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const contract = createOpenApiDocument(app),
    base = (await app.getUrl()) + '/api/v1';
  async function post(path, body, status) {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    assert.equal(response.status, status, `${path}: unexpected status`);
    assertActualResponse(contract, path, 'POST', status, result);
    checks++;
    return result;
  }
  const credentials = {
    email: ' NEW@Gmail.com ',
    password: 'long-private-password',
    name: ' New Writer ',
  };
  await post('/auth/register', credentials, 410);
  assert.equal(await prisma.user.count(), 0);
  for (const password of [
    'sunlitwriter@gmail.com',
    'SUNLITWRITER@GMAIL.COM',
    'sunlitwriter123456789!',
    'Password123456789!',
    'aaaaaaaaaaaaaaaaaaaa',
    'short',
  ]) {
    await post(
      '/auth/email/signup',
      { email: 'sunlitwriter@gmail.com', password },
      400,
    );
  }
  assert.equal(await prisma.emailSignupVerification.count(), 0);
  assert.equal(mailbox.length, 0);
  for (const domain of [
    'mailinator.com',
    'gmail.com.evil.com',
    'yahoo.co.uk',
    'sub.gmail.com',
    'example.com',
  ])
    await post(
      '/auth/email/signup',
      { ...credentials, email: 'name@' + domain },
      400,
    );
  await post('/auth/email/signup', { ...credentials, role: 'ADMIN' }, 400);
  const challenge = await post('/auth/email/signup', credentials, 202);
  assert.equal(
    await prisma.user.count(),
    0,
    'Requesting a code never creates an account',
  );
  const row = await prisma.emailSignupVerification.findUniqueOrThrow({
    where: { id: challenge.verificationId },
  });
  assert.equal(row.email, 'new@gmail.com');
  assert.equal(row.name, 'New Writer');
  assert.ok(await argon2.verify(row.passwordHash, credentials.password));
  const firstCode = mailbox.at(-1).code;
  assert.match(firstCode, /^\d{8}$/);
  assert.notEqual(row.codeHash, firstCode);
  assert.ok(row.deliveredAt);
  assert.equal(challenge.accessToken, undefined);
  await post(
    '/auth/email/resend',
    { verificationId: challenge.verificationId },
    429,
  );
  const wrongCode = firstCode === '00000000' ? '11111111' : '00000000';
  await post(
    '/auth/email/verify',
    { verificationId: challenge.verificationId, code: wrongCode },
    400,
  );
  assert.equal(
    (
      await prisma.emailSignupVerification.findUniqueOrThrow({
        where: { id: row.id },
      })
    ).attempts,
    1,
    'Failed attempts commit',
  );
  await prisma.emailSignupVerification.update({
    where: { id: row.id },
    data: { lastSentAt: new Date(Date.now() - 31000) },
  });
  await post('/auth/email/resend', { verificationId: row.id }, 202);
  const code = mailbox.at(-1).code;
  if (code !== firstCode)
    await post(
      '/auth/email/verify',
      { verificationId: row.id, code: firstCode },
      400,
    );
  const race = await Promise.all([
    fetch(base + '/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: row.id, code }),
    }),
    fetch(base + '/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: row.id, code }),
    }),
  ]);
  assert.deepEqual(
    race.map((r) => r.status).sort((a, b) => a - b),
    [200, 400],
  );
  const verified = await race.find((r) => r.status === 200).json();
  assertActualResponse(contract, '/auth/email/verify', 'POST', 200, verified);
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: row.email },
  });
  assert.ok(user.emailVerifiedAt);
  assert.equal(user.role, 'AUTHOR');
  assert.ok(await prisma.author.findUnique({ where: { userId: user.id } }));
  const consumed = await prisma.emailSignupVerification.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert.ok(consumed.consumedAt);
  assert.equal(consumed.passwordHash, null);
  assert.equal(consumed.codeHash, null);
  await post('/auth/email/verify', { verificationId: row.id, code }, 400);
  await post(
    '/auth/login',
    { email: 'NEW@GMAIL.COM', password: credentials.password },
    200,
  );
  await post(
    '/auth/login',
    { email: row.email, password: 'wrong-password' },
    401,
  );
  const sent = mailbox.length;
  const duplicate = await post('/auth/email/signup', credentials, 202);
  assert.equal(mailbox.length, sent);
  await post(
    '/auth/email/verify',
    { verificationId: duplicate.verificationId, code },
    400,
  );
  const exhausted = await post(
    '/auth/email/signup',
    { email: 'attempts@outlook.com', password: 'long-private-password' },
    202,
  );
  const real = mailbox.at(-1).code;
  for (let i = 0; i < 5; i++)
    await post(
      '/auth/email/verify',
      {
        verificationId: exhausted.verificationId,
        code: real === '00000000' ? '11111111' : '00000000',
      },
      400,
    );
  await post(
    '/auth/email/verify',
    { verificationId: exhausted.verificationId, code: real },
    400,
  );
  assert.equal(
    await prisma.user.count({ where: { email: 'attempts@outlook.com' } }),
    0,
  );
  const expired = await post(
    '/auth/email/signup',
    { email: 'expired@yahoo.com', password: 'long-private-password' },
    202,
  );
  await prisma.emailSignupVerification.update({
    where: { id: expired.verificationId },
    data: { expiresAt: new Date(Date.now() - 1) },
  });
  await post(
    '/auth/email/verify',
    { verificationId: expired.verificationId, code: mailbox.at(-1).code },
    400,
  );
  failMail = true;
  await post(
    '/auth/email/signup',
    { email: 'failed@live.com', password: 'long-private-password' },
    503,
  );
  const failed = await prisma.emailSignupVerification.findUniqueOrThrow({
    where: { email: 'failed@live.com' },
  });
  assert.equal(failed.codeHash, null);
  assert.equal(failed.passwordHash, null);
  assert.equal(failed.deliveredAt, null);
  await post(
    '/auth/email/verify',
    { verificationId: failed.id, code: '12345678' },
    400,
  );
  failMail = false;
  const rollback = await post(
    '/auth/email/signup',
    {
      email: 'rollback@googlemail.com',
      password: 'long-private-password',
      name: 'Rollback Writer',
    },
    202,
  );
  const rollbackCode = mailbox.at(-1).code;
  await sql.query(
    `ALTER TABLE "Author" ADD CONSTRAINT "email_signup_test_rollback" CHECK ("displayName" <> 'Rollback Writer')`,
  );
  await post(
    '/auth/email/verify',
    { verificationId: rollback.verificationId, code: rollbackCode },
    500,
  );
  assert.equal(
    await prisma.user.count({ where: { email: 'rollback@googlemail.com' } }),
    0,
  );
  assert.equal(
    (
      await prisma.emailSignupVerification.findUniqueOrThrow({
        where: { id: rollback.verificationId },
      })
    ).consumedAt,
    null,
  );
  await sql.query(
    'ALTER TABLE "Author" DROP CONSTRAINT "email_signup_test_rollback"',
  );
  await post(
    '/auth/email/verify',
    { verificationId: rollback.verificationId, code: rollbackCode },
    200,
  );
  const quota = await post(
    '/auth/email/signup',
    { email: 'quota@hotmail.com', password: 'long-private-password' },
    202,
  );
  for (let i = 0; i < 4; i++) {
    await prisma.emailSignupVerification.update({
      where: { id: quota.verificationId },
      data: { lastSentAt: new Date(Date.now() - 31000) },
    });
    await post(
      '/auth/email/resend',
      { verificationId: quota.verificationId },
      202,
    );
  }
  await prisma.emailSignupVerification.update({
    where: { id: quota.verificationId },
    data: { lastSentAt: new Date(Date.now() - 31000) },
  });
  await post(
    '/auth/email/resend',
    { verificationId: quota.verificationId },
    429,
  );
  await prisma.emailDeliveryBudget.updateMany({ data: { sendCount: 200 } });
  await post(
    '/auth/email/signup',
    { email: 'daily@msn.com', password: 'long-private-password' },
    429,
  );
  // Stronger signup requirements must not lock out pre-existing passwords.
  await prisma.user.create({
    data: {
      email: 'legacy@outlook.com',
      name: 'Legacy Writer',
      role: 'AUTHOR',
      password: await argon2.hash('old-pass', { type: argon2.argon2id }),
      author: { create: { displayName: 'Legacy Writer' } },
    },
  });
  await post(
    '/auth/login',
    { email: 'legacy@outlook.com', password: 'old-pass' },
    200,
  );
  console.log(
    `Email signup PostgreSQL smoke passed: ${checks} contract-checked HTTP cases; account creation only after delivered code, hashing, replay/races, cooldowns/quotas, failures and legacy bypass prevention. No emails sent externally.`,
  );
} finally {
  if (app) await app.close();
  if (prisma) await prisma.$disconnect();
  if (created) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
  await sql.end();
}
