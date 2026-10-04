const collections = ["projects", "books", "chapters", "scenes"];

// Construct only known hierarchy paths; user input cannot select an arbitrary upstream URL.
export function resourcePath(ids: readonly string[]): string {
  if (ids.length > 4 || ids.some((id) => !/^[a-zA-Z0-9_-]{1,128}$/.test(id)))
    throw new Error("Invalid resource ID");
  return (
    ids
      .map((id, index) => `/${collections[index]}/${encodeURIComponent(id)}`)
      .join("") || "/projects"
  );
}

export function collectionPath(ids: readonly string[]): string {
  if (ids.length > 3) throw new Error("Invalid hierarchy");
  return ids.length
    ? `${resourcePath(ids)}/${collections[ids.length]}`
    : "/projects";
}
