// Explicit local integration test. Creates and removes only its own synthetic accounts.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
if (process.env.SETUP_LOCAL_HTTP_TEST !== 'true')
  throw Error(
    'Opt in with SETUP_LOCAL_HTTP_TEST=true; requires local API and website servers.',
  );
process.loadEnvFile(new URL('../.env.local', import.meta.url));
if (process.env.NODE_ENV === 'production')
  throw Error('Local tests are disabled in production');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw Error('Local database required');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const origin = 'http://localhost:3000';
const created = [];
let checks = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  checks++;
};
const page = (path, cookie = '') =>
  fetch(origin + path, {
    redirect: 'manual',
    headers: cookie ? { Cookie: cookie } : {},
  });
const product = (cookie) =>
  fetch('http://127.0.0.1:3002/api/v1/projects', {
    headers: {
      Authorization:
        'Bearer ' + decodeURIComponent(cookie.slice('rawan_session='.length)),
    },
  });
const patch = (cookie, body, extra = {}) =>
  fetch(origin + '/api/setup', {
    method: 'PATCH',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
async function fixture(required) {
  const email = 'setup-http-' + randomUUID() + '@example.invalid';
  const password = randomUUID() + 'aA!73';
  const user = await prisma.user.create({
    data: {
      email,
      password: await argon2.hash(password),
      name: 'Setup test account',
      author: { create: { displayName: 'Setup test account' } },
      ...(required ? { onboarding: { create: { setupRequired: true } } } : {}),
    },
  });
  created.push(user.id);
  return { ...(await login(email, password)), id: user.id, email, password };
}
async function login(email, password) {
  const login = await fetch(origin + '/auth/email', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  equal(login.status, 200);
  assert.deepEqual(await login.json(), { signedIn: true });
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(login.headers.get('set-cookie'), /SameSite=Lax/i);
  assert.match(login.headers.get('cache-control'), /no-store/);
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('rawan_session='));
  return { cookie };
}
try {
  for (const path of ['/onboarding', '/account', '/reader']) {
    const unsigned = await page(path);
    equal(unsigned.status, 307);
    assert.match(unsigned.headers.get('location'), /^\/login\?returnTo=/);
  }
  const fresh = await fixture(true);
  const expired = new JwtService({ secret: process.env.JWT_SECRET }).sign(
    { sub: fresh.id, email: fresh.email, role: 'AUTHOR' },
    { expiresIn: -1, algorithm: 'HS256' },
  );
  const expiredCookie = 'rawan_session=' + expired;
  equal((await page('/onboarding', expiredCookie)).status, 307);
  equal((await patch(expiredCookie, { expectedRevision: 0 })).status, 401);
  equal((await product(expiredCookie)).status, 401);
  equal((await product(fresh.cookie)).status, 403);
  const gate = await page('/reader', fresh.cookie);
  equal(gate.status, 307);
  equal(gate.headers.get('location'), '/onboarding?returnTo=%2Freader');
  let screen = await page(gate.headers.get('location'), fresh.cookie);
  equal(screen.status, 200);
  assert.match(await screen.text(), /Welcome to Rawan/);
  equal((await patch('', { expectedRevision: 0 })).status, 401);
  equal(
    (
      await patch(
        fresh.cookie,
        { expectedRevision: 0 },
        { Origin: 'https://untrusted.invalid' },
      )
    ).status,
    403,
  );
  equal((await patch(fresh.cookie, '{')).status, 400);
  equal((await patch(fresh.cookie, 'x'.repeat(8193))).status, 413);
  equal(
    (await patch(fresh.cookie, { expectedRevision: 0, userId: fresh.id }))
      .status,
    400,
  );
  equal(
    (
      await patch(fresh.cookie, {
        expectedRevision: 0,
        ageConfirmedAt: new Date().toISOString(),
      })
    ).status,
    400,
  );
  const saved = await patch(fresh.cookie, {
    expectedRevision: 0,
    preferredName: 'Test Pen Name',
    purpose: 'both',
    creativeInterests: ['novels'],
    readingFormats: ['comics'],
    step: 'interests',
  });
  equal(saved.status, 200);
  let partial = await saved.json();
  const incompleteLogin = await login(fresh.email, fresh.password);
  equal((await page('/account', incompleteLogin.cookie)).status, 307);
  assert.match(
    await (await page('/onboarding', incompleteLogin.cookie)).text(),
    /What stories feel like you/,
  );
  screen = await page('/onboarding', fresh.cookie);
  assert.match(await screen.text(), /What stories feel like you/);
  for (const purpose of ['create', 'read', 'both']) {
    const updated = await patch(fresh.cookie, {
      expectedRevision: partial.revision,
      purpose,
      step: 'interests',
    });
    equal(updated.status, 200);
    partial = await updated.json();
    assert.deepEqual(partial.draft.creativeInterests, ['novels']);
    assert.deepEqual(partial.draft.readingFormats, ['comics']);
    const html = await (await page('/onboarding', fresh.cookie)).text();
    equal(/<legend[^>]*>Creating<\/legend>/.test(html), purpose !== 'read');
    equal(/<legend[^>]*>Reading<\/legend>/.test(html), purpose !== 'create');
  }
  const starting = await patch(fresh.cookie, {
    expectedRevision: partial.revision,
    preferredStart: 'reader',
    step: 'begin',
  });
  equal(starting.status, 200);
  partial = await starting.json();
  equal(partial.draft.preferredStart, 'reader');
  const finalScreen = await (await page('/onboarding', fresh.cookie)).text();
  assert.match(finalScreen, /Make yourself at home/);
  assert.match(finalScreen, /Finish setup/);
  assert.doesNotMatch(
    finalScreen,
    /Where would you like to begin|Your preferred starting experience|preferred-start/,
  );
  assert.doesNotMatch(finalScreen, /I confirm that|18 years|age-explanation/);
  assert.doesNotMatch(finalScreen, /<input[^>]*type="checkbox"/);
  equal(
    (await patch(fresh.cookie, { expectedRevision: 0, purpose: 'create' }))
      .status,
    409,
  );
  equal((await page('/account', fresh.cookie)).status, 307);
  const finished = await patch(fresh.cookie, {
    expectedRevision: partial.revision,
    complete: true,
  });
  equal(finished.status, 200);
  const done = await finished.json();
  const repeated = await patch(fresh.cookie, {
    expectedRevision: partial.revision,
    complete: true,
  });
  equal((await repeated.json()).completedAt, done.completedAt);
  equal(
    (await page('/account', fresh.cookie)).headers.get('location'),
    '/studio',
  );
  equal((await page('/reader', fresh.cookie)).status, 200);
  equal(
    (await page('/workspace', fresh.cookie)).headers.get('location'),
    '/account',
  );
  equal(
    (await page('/workspace/reader', fresh.cookie)).headers.get('location'),
    '/reader',
  );
  equal((await product(fresh.cookie)).status, 200);
  const logout = await fetch(origin + '/auth/logout', {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: origin, Cookie: fresh.cookie },
  });
  equal(logout.status, 303);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  const nextLogin = await login(fresh.email, fresh.password);
  equal(
    (await page('/account', nextLogin.cookie)).headers.get('location'),
    '/studio',
  );
  equal(
    (await page('/onboarding', nextLogin.cookie)).headers.get('location'),
    '/studio',
  );
  const returning = await page('/onboarding?returnTo=%2Freader', fresh.cookie);
  equal(returning.status, 307);
  equal(returning.headers.get('location'), '/reader');
  const unsafe = await page(
    '/onboarding?returnTo=https%3A%2F%2Fevil.invalid',
    fresh.cookie,
  );
  equal(unsafe.headers.get('location'), '/studio');
  equal(
    (await page('/onboarding', 'rawan_session=expired-invalid-token')).status,
    307,
  );
  const legacy = await fixture(false);
  equal((await product(legacy.cookie)).status, 200);
  equal(
    (await page('/account', legacy.cookie)).headers.get('location'),
    '/studio',
  );
  const legacyRoute = await page('/onboarding', legacy.cookie);
  equal(legacyRoute.status, 307);
  equal(legacyRoute.headers.get('location'), '/studio');
  const author = await fixture(true);
  const authorSetup = await patch(author.cookie, {
    expectedRevision: 0,
    preferredName: 'Author test',
    purpose: 'create',
    preferredStart: 'reader',
    complete: true,
  });
  equal(authorSetup.status, 200);
  equal(
    (await page('/account', author.cookie)).headers.get('location'),
    '/studio',
  );
  equal(
    (await page('/onboarding', author.cookie)).headers.get('location'),
    '/studio',
  );
  equal((await page('/studio')).status, 200);
  const reader = await fixture(true);
  equal(
    (
      await patch(reader.cookie, {
        expectedRevision: 0,
        purpose: 'read',
        preferredStart: 'studio',
        complete: true,
      })
    ).status,
    200,
  );
  equal(
    (await page('/account', reader.cookie)).headers.get('location'),
    '/reader',
  );
  equal(
    (await page('/onboarding', reader.cookie)).headers.get('location'),
    '/reader',
  );
  equal(
    (await page('/onboarding?returnTo=%2Freader', author.cookie)).headers.get(
      'location',
    ),
    '/reader',
  );
  equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: legacy.id } })).name,
    'Setup test account',
  );
  console.log(
    `Local routing checks passed: ${checks} status/value checks plus rendered new/legacy/resume screens, cookie authentication, CSRF, bounds, validation, idempotency, expiry, safe deep links and redirect-loop prevention.`,
  );
} finally {
  for (const id of created) await prisma.user.delete({ where: { id } });
  await prisma.$disconnect();
}
