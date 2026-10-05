import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export async function verifyFrontend(
  base,
  password,
  project,
  alice,
  bob,
  entities,
) {
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
    const path = '/projects/' + project.id + '/relationships';
    const collections = {
      CHARACTER: 'characters',
      PLACE: 'places',
      FACTION: 'factions',
      ARTIFACT: 'artifacts',
    };
    const source = entities[0],
      target = entities[2];
    let page = await (await get(path, cookie)).text();
    assert.match(page, /Connect the world shared/);
    assert.ok(!page.includes(alice.accessToken));
    for (const entity of entities.filter((_, i) => i % 2 === 0)) {
      const detail =
        '/projects/' +
        project.id +
        '/' +
        collections[entity.kind] +
        '/' +
        entity.id;
      const html = await (await get(detail, cookie)).text();
      assert.match(html, /Create relationship/);
      assert.ok(
        html.includes(
          'value="' + entity.kind + ':' + entity.id + '" selected=""',
        ),
      );
    }
    const fields = {
      source: source.kind + ':' + source.id,
      target: target.kind + ':' + target.id,
      typeKey: 'FRONTEND_LINK',
      label: 'connected through the workspace',
      direction: 'DIRECTIONAL',
      description: 'Real relationship data',
    };
    const created = await action(path, fields, cookie, 'createRelationship');
    assert.equal(created.status, 200);
    page = await (await get(path, cookie)).text();
    assert.match(page, /Real relationship data/);
    const apiRows = async () =>
      (
        await fetch(base + '/projects/' + project.id + '/relationships', {
          headers: { Authorization: 'Bearer ' + alice.accessToken },
        })
      ).json();
    let row = (await apiRows()).find(
      (link) => link.typeKey === 'FRONTEND_LINK',
    );
    assert.ok(row);
    // The newest relationship is the first editable form, matching backend order.
    const updated = await action(
      path,
      {
        ...fields,
        label: 'edited in workspace',
        description: 'Updated relationship description',
      },
      cookie,
      'updateRelationship',
    );
    assert.equal(updated.status, 200);
    row = (await apiRows()).find((link) => link.typeKey === 'FRONTEND_LINK');
    assert.equal(row.label, 'edited in workspace');
    const duplicate = await action(path, fields, cookie, 'createRelationship');
    assert.equal(duplicate.status, 200);
    assert.equal(
      (await apiRows()).filter((link) => link.typeKey === 'FRONTEND_LINK')
        .length,
      1,
    );
    const before = (await apiRows()).length;
    await action(
      path,
      { ...fields, target: fields.source },
      cookie,
      'createRelationship',
    );
    assert.equal((await apiRows()).length, before);
    const foreign = await (
      await get(path, '__Host-rawan-session=' + bob.accessToken)
    ).text();
    assert.match(foreign, /This page isn’t in your story/);
    const anonymous = await get(path);
    assert.ok(
      anonymous.url.includes('/sign-in') ||
        (await anonymous.text()).includes('url=/sign-in'),
    );
    const expired = await get(path, '__Host-rawan-session=invalid');
    assert.ok(
      expired.url.includes('/sign-in') ||
        (await expired.text()).includes('url=/sign-in'),
    );
    await action(path, { confirm: '' }, cookie, 'delete-' + row.id);
    assert.ok((await apiRows()).some((link) => link.id === row.id));
    const deleted = await action(
      path,
      { confirm: 'delete' },
      cookie,
      'delete-' + row.id,
    );
    assert.equal(deleted.status, 200);
    assert.ok(!(await apiRows()).some((link) => link.id === row.id));
    // Entity detail creation preselects the source and refreshes both views.
    const detail = '/projects/' + project.id + '/characters/' + source.id;
    await action(
      detail,
      { ...fields, typeKey: 'FROM_DETAIL', label: 'from entity detail' },
      cookie,
      'createRelationship',
    );
    assert.match(
      await (await get(detail, cookie)).text(),
      /from entity detail/,
    );
    assert.match(await (await get(path, cookie)).text(), /from entity detail/);
    console.log(
      'Relationships frontend passed: real login, list/create/edit/confirmed-delete, duplicate/self rejection, all four detail integrations, source preselection, cache refresh, private sessions and author isolation.',
    );
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
  }
}
