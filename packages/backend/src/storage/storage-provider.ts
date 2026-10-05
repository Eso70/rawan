import type { Readable } from "node:stream";
export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");
export interface StorageProvider {
  readonly id: string;
  put(key: string, source: Readable): Promise<void>;
  read(key: string): Promise<{ stream: Readable; sizeBytes: number }>;
  delete(key: string): Promise<void>;
}
export class StorageObjectMissing extends Error {}
