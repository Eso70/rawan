import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { fileTypeFromBuffer } from 'file-type';
import { MEDIA_MIMES } from './media.dto.js';
export function safeFilename(name: string): string {
  if (name.length > 1024) throw new BadRequestException('Filename is too long');
  const leaf = name.replaceAll('\\', '/').split('/').pop() ?? '';
  const cleaned = leaf
    .replace(/[\p{Cc}\p{Cf}\uD800-\uDFFF]/gu, '')
    .trim()
    .normalize('NFC')
    .replace(/^[. ]+|[. ]+$/g, '');
  const filename = Array.from(cleaned).slice(0, 180).join('');
  if (!filename) throw new BadRequestException('Filename is required');
  return filename;
}
export function validatedContent(
  source: Readable,
  mimeType: string,
  maxBytes: number,
) {
  let sizeBytes = 0;
  const hash = createHash('sha256');
  let complete = false;
  const stream = Readable.from(
    (async function* () {
      const iterator = source[Symbol.asyncIterator]();
      const prefix: Buffer[] = [];
      let prefixSize = 0;
      try {
        while (prefixSize < 4100) {
          const next = await iterator.next();
          if (next.done) break;
          const chunk = Buffer.from(next.value as Uint8Array);
          prefix.push(chunk);
          prefixSize += chunk.length;
        }
        if (!prefixSize)
          throw new BadRequestException('Empty uploads are not allowed');
        if (!MEDIA_MIMES.some((type) => type === mimeType))
          throw new BadRequestException('Unsupported file type');
        let detected;
        try {
          detected = await fileTypeFromBuffer(
            Buffer.concat(prefix).subarray(0, 4100),
            { signal: AbortSignal.timeout(1000) },
          );
        } catch {
          throw new BadRequestException('Invalid file content');
        }
        if (
          (detected && detected.mime !== mimeType) ||
          (!detected && mimeType !== 'text/plain')
        )
          throw new BadRequestException(
            'File content does not match MIME type',
          );
        const decoder =
          mimeType === 'text/plain'
            ? new TextDecoder('utf-8', { fatal: true })
            : null;
        function inspect(chunk: Buffer) {
          sizeBytes += chunk.length;
          if (sizeBytes > maxBytes)
            throw new PayloadTooLargeException('File exceeds upload limit');
          hash.update(chunk);
          if (decoder) {
            let text;
            try {
              text = decoder.decode(chunk, { stream: true });
            } catch {
              throw new BadRequestException('Text files must be valid UTF-8');
            }
            if (/[\p{Cc}]/u.test(text.replace(/[\t\r\n]/g, '')))
              throw new BadRequestException(
                'Text file contains binary control characters',
              );
          }
        }
        for (const chunk of prefix) {
          inspect(chunk);
          yield chunk;
        }
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          const chunk = Buffer.from(next.value as Uint8Array);
          inspect(chunk);
          yield chunk;
        }
        if (decoder) {
          try {
            decoder.decode();
          } catch {
            throw new BadRequestException('Text files must be valid UTF-8');
          }
        }
        complete = true;
      } finally {
        source.destroy();
      }
    })(),
  );
  return {
    stream,
    metadata: () => {
      if (!complete) throw Error('Incomplete upload');
      return { sizeBytes, sha256: hash.digest('hex') };
    },
  };
}
