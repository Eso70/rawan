import Link from "next/link";
import { AuthForm } from "@/components/forms";
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="wordmark" href="/">
          ✦ Rawan
        </Link>
        <p className="eyebrow">A quiet space for your story</p>
        <h1>Welcome back.</h1>
        <p className="auth-intro">Your words and your world are waiting.</p>
        {expired && (
          <p className="session-notice" role="status">
            Please sign in to continue. Your session may have expired.
          </p>
        )}
        <AuthForm />
        <p className="auth-switch">
          New to Rawan? <Link href="/register">Create an account</Link>
        </p>
      </div>
      <p className="auth-footnote">For the stories only you can tell.</p>
    </main>
  );
}
