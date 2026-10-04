import Link from "next/link";
import { AuthForm } from "@/components/forms";
export default function Register() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="wordmark" href="/">
          ✦ Rawan
        </Link>
        <p className="eyebrow">Make room for your imagination</p>
        <h1>Your story starts here.</h1>
        <p className="auth-intro">
          Create an account and give your next idea a home.
        </p>
        <AuthForm register />
        <p className="auth-switch">
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
      <p className="auth-footnote">One space for your words and your world.</p>
    </main>
  );
}
