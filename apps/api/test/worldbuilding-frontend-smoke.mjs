import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export async function verifyFrontend(base, password, project, alice, bob) {
  const reserve = createServer().listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  const origin = `http://localhost:${port}`;
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL('../../app/node_modules/next/dist/bin/next', import.meta.url),
      ),
      'start',
      '--port',
      String(port),
    ],
    {
      cwd: fileURLToPath(new URL('../../app/', import.meta.url)),
      env: { ...process.env, NODE_ENV: 'production', API_URL: base },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += data;
  });
  child.stderr.on('data', (data) => {
    output += data;
  });
  const get = (path, cookie) =>
    fetch(origin + path, {
      headers: cookie ? { Cookie: cookie } : {},
      signal: AbortSignal.timeout(10000),
    });
  const decode = (value) =>
    value
      .replaceAll('&quot;', '"')
      .replaceAll('&#x27;', "'")
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&');
  async function action(path, entries, cookie, marker) {
    const html = await (await get(path, cookie)).text();
    const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(
      (match) => match[0],
    );
    const form = forms.find((value) => value.includes(`name="${marker}"`));
    assert.ok(form, 'Expected form on ' + path);
    const body = new FormData();
    for (const input of form.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) {
      const name = input[0].match(/\bname="([^"]+)"/)?.[1];
      const value = input[0].match(/\bvalue="([^"]*)"/)?.[1] || '';
      if (name) body.append(decode(name), decode(value));
    }
    assert.ok([...body.keys()].some((key) => key.startsWith('$ACTION')));
    for (const [key, value] of Object.entries(entries)) body.set(key, value);
    return fetch(origin + path, {
      method: 'POST',
      headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
  }
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error('Next exited: ' + output);
      try {
        if ((await get('/sign-in')).ok) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (attempt === 99) throw new Error('Next failed to start: ' + output);
    }
    const login = await action(
      '/sign-in',
      { email: alice.user.email, password },
      undefined,
      'email',
    );
    assert.equal(login.status, 303);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    for (const kind of ['characters', 'places', 'factions', 'artifacts']) {
      const path = '/projects/' + project.id + '/' + kind;
      const list = await (await get(path, cookie)).text();
      assert.match(list, /Worldbuilding/);
      assert.ok(!list.includes(alice.accessToken));
      const created = await action(
        path,
        {
          name: 'Frontend ' + kind,
          summary: 'From the author workspace',
          description: 'Real PostgreSQL',
        },
        cookie,
        'name',
      );
      assert.equal(created.status, 303);
      const detailPath = created.headers.get('location');
      assert.ok(detailPath.startsWith(path + '/'));
      assert.match(
        await (await get(detailPath, cookie)).text(),
        /From the author workspace/,
      );
      const saved = await action(
        detailPath,
        {
          name: 'Edited in workspace',
          summary: 'Updated summary',
          description: 'Saved through the real API',
        },
        cookie,
        'name',
      );
      assert.equal(saved.status, 200);
      assert.match(
        await (await get(detailPath, cookie)).text(),
        /Saved through the real API/,
      );
      const foreign = await (
        await get(detailPath, '__Host-rawan-session=' + bob.accessToken)
      ).text();
      assert.match(foreign, /This page isn’t in your story/);
      const anonymous = await get(detailPath);
      assert.ok(
        anonymous.url.includes('/sign-in') ||
          (await anonymous.text()).includes('url=/sign-in'),
      );
      const rejected = await action(
        detailPath,
        { confirm: '' },
        cookie,
        'confirm',
      );
      assert.equal(rejected.status, 200);
      assert.match(
        await (await get(detailPath, cookie)).text(),
        /Saved through the real API/,
      );
      const deleted = await action(
        detailPath,
        { confirm: 'delete' },
        cookie,
        'confirm',
      );
      assert.equal(deleted.status, 303);
      assert.equal(deleted.headers.get('location'), path);
      assert.match(
        await (await get(detailPath, cookie)).text(),
        /This page isn’t in your story/,
      );
    }
    console.log(
      'Worldbuilding frontend passed: real login, all four create/detail/edit/confirmed-delete flows, private sessions and author isolation.',
    );
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
  }
}
