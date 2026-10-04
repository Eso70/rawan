"use client";
import Link from "next/link";
import { logout } from "@/lib/actions";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="state-page">
      <p className="eyebrow">A brief pause</p>
      <h1>Your writing space is unavailable.</h1>
      <p>
        We couldn’t load this page. Check your connection and try again shortly.
      </p>
      <div className="save-row">
        <button type="button" onClick={reset}>
          Try again
        </button>
        <Link href="/projects" className="text-link">
          Back to projects
        </Link>
        <form action={logout}>
          <button className="quiet-button" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
