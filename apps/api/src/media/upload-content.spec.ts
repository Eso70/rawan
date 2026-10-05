import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { safeFilename, validatedContent } from './upload-content.js';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nAAAAABJRU5ErkJggg==',
  'base64',
);
async function consume(content: Buffer, mime = 'text/plain', max = 1024) {
  const checked = validatedContent(Readable.from([content]), mime, max);
  for await (const _ of checked.stream) {
    /* drain */
  }
  return checked.metadata();
}
describe('upload content policy', () => {
  it('hashes exactly the validated bytes', async () => {
    const content = Buffer.from('مرحبا world');
    expect(await consume(content)).toEqual({
      sizeBytes: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  });
  it('detects PNG signatures', async () => {
    expect((await consume(png, 'image/png')).sizeBytes).toBe(png.length);
  });
  it.each([
    [Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]), 'image/jpeg'],
    [Buffer.from('RIFF0000WEBPVP8 '), 'image/webp'],
    [Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'), 'application/pdf'],
  ])('recognizes the allowed %s %s signature', async (content, mime) => {
    expect((await consume(content as Buffer, mime as string)).sizeBytes).toBe(
      content.length,
    );
  });
  it.each([
    [png, 'image/jpeg'],
    [Buffer.from('<svg/>'), 'image/png'],
    [Buffer.from('hello'), 'text/html'],
    [Buffer.alloc(0), 'text/plain'],
    [Buffer.from([0, 1, 2]), 'text/plain'],
    [Buffer.from([0xff, 0xff]), 'text/plain'],
  ])('rejects mismatched or unsupported %s %s', async (content, mime) => {
    await expect(consume(content as Buffer, mime as string)).rejects.toThrow();
  });
  it('enforces bytes independently of the multipart parser', async () => {
    await expect(
      consume(Buffer.from('12345'), 'text/plain', 4),
    ).rejects.toThrow('upload limit');
  });
  it.each([
    ['../../portrait.png', 'portrait.png'],
    ['..\\..\\portrait.png', 'portrait.png'],
    ['C:\\absolute\\photo.jpg', 'photo.jpg'],
    ['/absolute/name.pdf', 'name.pdf'],
    ['a\r\nInjected.txt', 'aInjected.txt'],
  ])('normalizes display name %s', (name, expected) => {
    expect(safeFilename(name)).toBe(expected);
  });
  it('bounds names and rejects unusable names', () => {
    expect(safeFilename('a'.repeat(200))).toHaveLength(180);
    expect(() => safeFilename('a'.repeat(1025))).toThrow();
    expect(() => safeFilename('../..')).toThrow();
  });
});
