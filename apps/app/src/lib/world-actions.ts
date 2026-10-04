"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiWorldEntity, WorldKind } from "@rawan/types";
import { authenticatedRequest, clearSession } from "./session";
import { ApiError, errorMessage } from "./api-core";
import { worldCollection, worldResource, worldPage } from "./world-paths";
import type { FormState } from "./form-state";

async function failure(error: unknown): Promise<FormState> {
  if (error instanceof ApiError && error.status === 401) {
    await clearSession();
    redirect("/sign-in?expired=1");
  }
  return { error: errorMessage(error) };
}
export async function saveWorld(
  projectId: string,
  kind: WorldKind,
  entityId: string | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const fields = [
    "name",
    "summary",
    "description",
    ...(kind === "characters" ? ["role", "status"] : ["type"]),
  ];
  const body: Record<string, string | null> = {};
  for (const field of fields) {
    const entry = form.get(field);
    const text = typeof entry === "string" ? entry : "";
    body[field] = field === "name" ? text.trim() : text || null;
    const limit =
      field === "description"
        ? 10000
        : field === "summary"
          ? 1000
          : field === "name"
            ? 200
            : 100;
    if (text.length > limit)
      return {
        error: `Please shorten ${field} to ${limit.toLocaleString()} characters.`,
      };
  }
  if (!body.name) return { error: "Enter a name." };
  let saved: ApiWorldEntity;
  try {
    // Verify the project context as well as the entity's immutable parent.
    await authenticatedRequest(`/projects/${projectId}`);
    if (entityId) {
      const current = await authenticatedRequest<ApiWorldEntity>(
        worldResource(kind, entityId),
      );
      if (current.projectId !== projectId) throw new ApiError(404);
    }
    saved = await authenticatedRequest<ApiWorldEntity>(
      entityId
        ? worldResource(kind, entityId)
        : worldCollection(projectId, kind),
      { method: entityId ? "PATCH" : "POST", body },
    );
  } catch (error) {
    return failure(error);
  }
  revalidatePath(worldCollection(projectId, kind));
  if (!entityId) redirect(worldPage(projectId, kind, saved.id));
  revalidatePath(worldPage(projectId, kind, saved.id));
  return { success: "Changes saved." };
}
export async function deleteWorld(
  projectId: string,
  kind: WorldKind,
  entityId: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (form.get("confirm") !== "delete")
    return { error: "Confirm deletion before continuing." };
  try {
    const current = await authenticatedRequest<ApiWorldEntity>(
      worldResource(kind, entityId),
    );
    if (current.projectId !== projectId) throw new ApiError(404);
    await authenticatedRequest(worldResource(kind, entityId), {
      method: "DELETE",
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(worldCollection(projectId, kind));
  redirect(worldCollection(projectId, kind));
}
