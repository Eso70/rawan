import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { LocalStorageProvider } from './local-storage.js';
import { StorageObjectMissing } from './storage-provider.js';
describe('private local storage', () => {
  let root: string;
  let storage: LocalStorageProvider;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'rawan-storage-test-'));
    storage = new LocalStorageProvider(root);
  });
  afterEach(async () => {
    if (!root.startsWith(join(tmpdir(), 'rawan-storage-test-')))
      throw Error('Unsafe test cleanup');
    await rm(root, { recursive: true, force: true });
  });
  it('streams correct bytes and supports idempotent deletion', async () => {
    const key = randomUUID();
    await storage.put(key, Readable.from(['hello', ' world']));
    const object = await storage.read(key);
    const chunks: Buffer[] = [];
    for await (const chunk of object.stream) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toBe('hello world');
    expect(object.sizeBytes).toBe(11);
    await storage.delete(key);
    await storage.delete(key);
    await expect(storage.read(key)).rejects.toBeInstanceOf(
      StorageObjectMissing,
    );
  });
  it.each([
    '../outside',
    '..\\outside',
    '/absolute',
    'C:\\outside',
    'filename.jpg',
    '',
    randomUUID() + '/../x',
  ])('rejects key %s for all operations', async (key) => {
    await expect(storage.put(key, Readable.from(['bad']))).rejects.toThrow(
      'Invalid storage key',
    );
    await expect(storage.read(key)).rejects.toThrow('Invalid storage key');
    await expect(storage.delete(key)).rejects.toThrow('Invalid storage key');
    expect(await readdir(root)).toEqual([]);
  });
  it('does not overwrite colliding objects', async () => {
    const key = randomUUID();
    await storage.put(key, Readable.from(['first']));
    await expect(storage.put(key, Readable.from(['second']))).rejects.toThrow();
    expect(await readFile(join(root, key), 'utf8')).toBe('first');
  });
  it('removes partially written files after stream failure', async () => {
    const key = randomUUID();
    const source = Readable.from(
      (async function* () {
        yield 'partial';
        throw Error('broken');
      })(),
    );
    await expect(storage.put(key, source)).rejects.toThrow('broken');
    expect(await readdir(root)).toEqual([]);
  });
  it('cannot overwrite or download a symlink', async () => {
    const key = randomUUID();
    const outside = join(root, 'outside.txt');
    await writeFile(outside, 'secret');
    try {
      await symlink(outside, join(root, key), 'file');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') return;
      throw error;
    }
    await expect(storage.read(key)).rejects.toThrow('symlink');
    await expect(
      storage.put(key, Readable.from(['changed'])),
    ).rejects.toThrow();
    await storage.delete(key);
    expect(await readFile(outside, 'utf8')).toBe('secret');
  });
});
