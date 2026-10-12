/** Persist only validated own data properties, never DTO prototypes or methods. */
export function dtoValues<T extends object>(
  value: T,
): { [K in keyof T]: T[K] } {
  return Object.fromEntries(Object.entries(value)) as { [K in keyof T]: T[K] };
}
