import { isAbsolute, parse, resolve } from "node:path";
export function validateStorageConfig(
  input: Record<string, unknown>,
  apiRoot: string,
) {
  if ((input.MEDIA_STORAGE_DRIVER ?? "local") !== "local")
    throw new Error("MEDIA_STORAGE_DRIVER must be local");
  const pathValue = input.MEDIA_LOCAL_PATH ?? ".data/media";
  const localPath =
    typeof pathValue === "string" && pathValue.trim()
      ? resolve(apiRoot, pathValue)
      : "";
  if (
    !localPath ||
    typeof pathValue !== "string" ||
    pathValue.includes("\u0000") ||
    localPath === parse(localPath).root ||
    localPath === resolve(apiRoot) ||
    pathValue
      .split(/[\\/]/)
      .some((part) => ["src", "dist", "node_modules", ".git"].includes(part))
  )
    throw new Error(
      "MEDIA_LOCAL_PATH must be a dedicated directory outside source/build directories",
    );
  if (
    input.NODE_ENV === "production" &&
    (input.MEDIA_LOCAL_PATH === undefined ||
      typeof pathValue !== "string" ||
      !isAbsolute(pathValue))
  )
    throw new Error(
      "Production local storage requires an explicit absolute MEDIA_LOCAL_PATH",
    );
  const sizeValue = input.MEDIA_MAX_FILE_SIZE ?? "10485760";
  const mediaMax = Number(sizeValue);
  if (
    (typeof sizeValue !== "string" && typeof sizeValue !== "number") ||
    !/^\d+$/.test(String(sizeValue)) ||
    !Number.isInteger(mediaMax) ||
    mediaMax < 1 ||
    mediaMax > 104857600
  )
    throw new Error(
      "MEDIA_MAX_FILE_SIZE must be an integer between 1 and 104857600",
    );
  return { driver: "local" as const, localPath, maxFileSize: mediaMax };
}
