import {
  PermanentCleanupFailure,
  UnrecoverableError,
  reconcileMediaCleanup,
  type CleanupRepository,
  type StorageProvider,
} from "@rawan/backend";
export function mediaCleanupProcessor(
  repository: CleanupRepository,
  storage: StorageProvider,
) {
  return async () => {
    try {
      return await reconcileMediaCleanup(repository, storage);
    } catch (error) {
      if (error instanceof PermanentCleanupFailure)
        throw new UnrecoverableError(
          "Unsafe or unsupported media cleanup record",
        );
      throw Error("Media cleanup temporarily unavailable");
    }
  };
}
