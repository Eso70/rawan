import Link from "next/link";
export default function NotFound() {
  return (
    <main className="state-page">
      <p className="eyebrow">Page not found</p>
      <h1>This page isn’t in your story.</h1>
      <p>It may have been removed, or you may not have access to it.</p>
      <Link className="button" href="/projects">
        Return to projects
      </Link>
    </main>
  );
}
