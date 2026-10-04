"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiProject, AuthResponse } from "@rawan/types";
import { apiRequest } from "./api";
import { ApiError, errorMessage } from "./api-core";
import {
  authenticatedRequest,
  clearSession,
  establishSession,
} from "./session";
import { collectionPath, resourcePath } from "./paths";
import type { FormState } from "./form-state";

function value(form: FormData, key: string) {
  const entry = form.get(key);
  return typeof entry === "string" ? entry : "";
}

async function mutationError(error: unknown): Promise<FormState> {
  if (error instanceof ApiError && error.status === 401) {
    await clearSession();
    redirect("/sign-in?expired=1");
  }
  return { error: errorMessage(error) };
}

export async function authenticate(
  mode: "register" | "login",
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!["register", "login"].includes(mode))
    return { error: "Invalid form. Please reload." };
  const email = value(form, "email").trim();
  const password = value(form, "password");
  const name = value(form, "name").trim();
  if (
    !email ||
    email.length > 254 ||
    password.length < (mode === "register" ? 12 : 1) ||
    password.length > 128 ||
    (mode === "register" &&
      (!name || name.length > 100 || !/\S/.test(password)))
  )
    return {
      error:
        mode === "register"
          ? "Enter your name, email, and a password of 12–128 characters."
          : "Enter your email and password.",
    };
  try {
    const auth = await apiRequest<AuthResponse>(`/auth/${mode}`, {
      method: "POST",
      body: { email, password, ...(mode === "register" ? { name } : {}) },
    });
    await establishSession(auth);
  } catch (error) {
    return { error: errorMessage(error, true) };
  }
  redirect("/projects");
}

export async function logout() {
  await clearSession();
  redirect("/sign-in");
}

export async function createResource(
  ids: string[],
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const title = value(form, "title").trim();
  const description = value(form, "description");
  if (!title || title.length > 200 || description.length > 10000)
    return {
      error:
        "Use a title of 1–200 characters and a description of up to 10,000 characters.",
    };
  let destination: string;
  try {
    const path = collectionPath(ids);
    const created = await authenticatedRequest<Pick<ApiProject, "id">>(path, {
      method: "POST",
      body: { title, description: description || null },
    });
    destination = resourcePath([...ids, created.id]);
  } catch (error) {
    return mutationError(error);
  }
  revalidatePath(ids.length ? resourcePath(ids) : "/projects");
  redirect(destination);
}

export async function saveScene(
  ids: string[],
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const content = value(form, "content");
  if (content.length > 50000)
    return {
      error:
        "Keep scene content under 50,000 characters for this basic editor.",
    };
  try {
    if (ids.length !== 4) throw new ApiError(400);
    await authenticatedRequest(resourcePath(ids), {
      method: "PATCH",
      body: { content },
    });
  } catch (error) {
    return mutationError(error);
  }
  revalidatePath(resourcePath(ids));
  return { success: "Scene saved." };
}
