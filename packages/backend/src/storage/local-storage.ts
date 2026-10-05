import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import {
  StorageObjectMissing,
  type StorageProvider,
} from "./storage-provider.js";
const KEY =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const missing = (error: unknown) =>
  (error as NodeJS.ErrnoException).code === "ENOENT";
export class LocalStorageProvider implements StorageProvider {
  readonly id = "local";
  private readonly root: string;
  constructor(directory: string) {
    this.root = resolve(directory);
  }
  private async path(key: string): Promise<string> {
    if (!KEY.test(key)) throw new Error("Invalid storage key");
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    if ((await lstat(this.root)).isSymbolicLink())
      throw new Error("Storage root must not be a symlink");
    return join(await realpath(this.root), key);
  }
  async put(key: string, source: Readable): Promise<void> {
    const path = await this.path(key);
    // Exclusive creation prevents replacement of an existing object or symlink.
    const file = await open(path, "wx", 0o600);
    try {
      await pipeline(
        source,
        file.createWriteStream({ autoClose: true, flush: true }),
        { signal: AbortSignal.timeout(25000) },
      );
    } catch (error) {
      await file.close();
      await unlink(path).catch(() => undefined);
      throw error;
    }
    await file.close();
  }
  async read(key: string) {
    const path = await this.path(key);
    try {
      if ((await lstat(path)).isSymbolicLink())
        throw new Error("Storage object must not be a symlink");
      const file = await open(
        path,
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      );
      try {
        const stat = await file.stat();
        if (!stat.isFile()) throw new Error("Invalid storage object");
        return { stream: file.createReadStream(), sizeBytes: stat.size };
      } catch (error) {
        await file.close();
        throw error;
      }
    } catch (error) {
      if (missing(error)) throw new StorageObjectMissing();
      throw error;
    }
  }
  async delete(key: string): Promise<void> {
    const path = await this.path(key);
    try {
      await unlink(path);
    } catch (error) {
      if (!missing(error)) throw error;
    }
  }
}
