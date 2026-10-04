import "server-only";
import { notFound, redirect } from "next/navigation";
import { authenticatedRequest } from "./session";
import { ApiError } from "./api-core";

export async function readResource<T>(path: string): Promise<T> {
  try {
    return await authenticatedRequest<T>(path);
  } catch (error) {
    // Preserve Next.js redirect/dynamic-rendering signals instead of converting
    // framework control flow into an application error during prerendering.
    if (!(error instanceof ApiError)) throw error;
    if (error instanceof ApiError && error.status === 401)
      redirect("/sign-in?expired=1");
    if (error instanceof ApiError && error.status === 404) notFound();
    throw new Error("The writing service is unavailable. Please try again.");
  }
}
