"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiRelationship } from "@rawan/types";
import { authenticatedRequest, clearSession } from "./session";
import { ApiError, errorMessage } from "./api-core";
import { parseEntity, relationshipCollection } from "./relationship-paths";
import type { FormState } from "./form-state";
async function failure(error: unknown): Promise<FormState> {
  if (error instanceof ApiError && error.status === 401) {
    await clearSession();
    redirect("/sign-in?expired=1");
  }
  return {
    error:
      error instanceof ApiError && error.status === 409
        ? "This relationship already exists. Edit the existing link or choose another type."
        : errorMessage(error),
  };
}
async function verify(projectId: string, id: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new ApiError(404);
  const current = await authenticatedRequest<ApiRelationship>(
    `/relationships/${id}`,
  );
  if (current.projectId !== projectId) throw new ApiError(404);
}
export async function saveRelationship(
  projectId: string,
  id: string | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const source = parseEntity(form.get("source"));
  const target = parseEntity(form.get("target"));
  const text = (key: string) =>
    typeof form.get(key) === "string" ? String(form.get(key)) : "";
  const typeKey = text("typeKey")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const label = text("label").trim();
  const description = text("description");
  const direction = text("direction");
  if (!source || !target)
    return { error: "Choose a source and target from this project." };
  if (source.kind === target.kind && source.id === target.id)
    return { error: "Choose two different entities." };
  if (
    !/^[A-Z][A-Z0-9_]{0,63}$/.test(typeKey) ||
    !label ||
    label.length > 100 ||
    description.length > 10000 ||
    !["DIRECTIONAL", "SYMMETRIC"].includes(direction)
  )
    return { error: "Check the type, label and description lengths." };
  try {
    if (id) await verify(projectId, id);
    await authenticatedRequest(
      id ? `/relationships/${id}` : relationshipCollection(projectId),
      {
        method: id ? "PATCH" : "POST",
        body: {
          source,
          target,
          typeKey,
          label,
          description: description || null,
          direction,
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/projects/${projectId}`, "layout");
  return { success: id ? "Relationship updated." : "Relationship created." };
}
export async function deleteRelationship(
  projectId: string,
  id: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (form.get("confirm") !== "delete")
    return { error: "Confirm deletion first." };
  try {
    await verify(projectId, id);
    await authenticatedRequest(`/relationships/${id}`, { method: "DELETE" });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/projects/${projectId}`, "layout");
  return { success: "Relationship deleted." };
}
