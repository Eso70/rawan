import { Prisma, type PrismaClient } from "@rawan/database";
import type { AiContextReference } from "@rawan/types";
import { AiFailure } from "./provider.js";
import type { AiResolvedContext } from "./tasks.js";
type ContextDb = Pick<PrismaClient, "$queryRaw">;
export async function resolveAiContext(
  db: ContextDb,
  userId: string,
  projectId: string,
  refs: AiContextReference[],
): Promise<AiResolvedContext> {
  if (refs.length > 8) throw new AiFailure("INVALID_INPUT");
  const projects = await db.$queryRaw<
    { title: string; description: string; truncated: boolean }[]
  >(Prisma.sql`
    SELECT left(p."title", 200) AS title, left(coalesce(p."description", ''), 1000) AS description,
    (length(p."title") > 200 OR length(coalesce(p."description", '')) > 1000) AS truncated
    FROM "Project" p JOIN "Author" a ON a.id = p."authorId" WHERE p.id = ${projectId} AND a."userId" = ${userId}`);
  const project = projects[0];
  if (!project) throw new AiFailure("INVALID_CONTEXT");
  const resources: AiResolvedContext["resources"] = [];
  for (const ref of refs) {
    let query: Prisma.Sql;
    if (ref.kind === "SCENE")
      query = Prisma.sql`SELECT s.title, s.content AS text FROM "Scene" s JOIN "Chapter" c ON c.id=s."chapterId" JOIN "Book" b ON b.id=c."bookId" WHERE s.id=${ref.id} AND b."projectId"=${projectId}`;
    else if (ref.kind === "CHARACTER")
      query = Prisma.sql`SELECT name AS title, concat_ws(E'\n', summary, description, role, status) AS text FROM "Character" WHERE id=${ref.id} AND "projectId"=${projectId}`;
    else if (ref.kind === "TIMELINE_EVENT")
      query = Prisma.sql`SELECT title, concat_ws(E'\n', summary, description, "dateLabel", start::text, "end"::text) AS text FROM "TimelineEvent" WHERE id=${ref.id} AND "projectId"=${projectId}`;
    else if (ref.kind === "PLOT_POINT")
      query = Prisma.sql`SELECT title, coalesce(description, '') AS text FROM "PlotPoint" WHERE id=${ref.id} AND "projectId"=${projectId}`;
    else if (ref.kind === "NOTE")
      query = Prisma.sql`SELECT title, content AS text FROM "Note" WHERE id=${ref.id} AND "projectId"=${projectId}`;
    else throw new AiFailure("INVALID_INPUT");
    const rows = await db.$queryRaw<
      { title: string; text: string; truncated: boolean }[]
    >(
      Prisma.sql`SELECT left(title, 200) AS title, left(text, 3500) AS text, (length(title)>200 OR length(text)>3500) AS truncated FROM (${query}) selected`,
    );
    const row = rows[0];
    if (!row) throw new AiFailure("INVALID_CONTEXT");
    resources.push({ ...row, kind: ref.kind, id: ref.id });
  }
  // SQL char lengths can exceed JS lengths with supplementary Unicode. Enforce a JS budget too.
  for (const r of resources) {
    if (r.text.length > 3500) {
      r.text = r.text.slice(0, 3500);
      r.truncated = true;
    }
    if (r.title.length > 200) r.truncated = true;
    r.title = r.title.slice(0, 200);
  }
  const result: AiResolvedContext = {
    project: {
      title: project.title.slice(0, 200),
      description: project.description.slice(0, 1000),
    },
    resources,
    truncated:
      project.truncated ||
      project.title.length > 200 ||
      project.description.length > 1000 ||
      resources.some((r) => r.truncated),
  };
  // JSON escaping also consumes the prompt budget (e.g. control characters become six chars).
  for (const resource of [...resources].reverse()) {
    if (JSON.stringify(result).length <= 32000) break;
    const original = resource.text;
    resource.truncated = true;
    result.truncated = true;
    let low = 0,
      high = original.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      resource.text = original.slice(0, middle);
      if (JSON.stringify(result).length <= 32000) low = middle;
      else high = middle - 1;
    }
    resource.text = original.slice(0, low);
  }
  if (JSON.stringify(result).length > 32000)
    throw new AiFailure("INVALID_INPUT");
  return result;
}
