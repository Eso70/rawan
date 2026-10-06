import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, SESSION_COOKIE } from "../../lib/google-auth";
import { BrandMark } from "../../components/brand-mark";
import styles from "./account.module.css";

export const metadata = {
  title: "Your account — Rawan",
  robots: { index: false },
};
export default async function Page() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  let user: { name: string; email: string };
  try {
    const { api } = authConfig();
    const response = await fetch(`${api}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) redirect("/login?error=session");
    user = await response.json();
  } catch {
    redirect("/login?error=session");
  }
  return (
    <main className={`landing-surface ${styles.page}`}>
      <section className={styles.card}>
        <a href="/" aria-label="Rawan home">
          <BrandMark />
        </a>
        <h1>Welcome, {user.name}</h1>
        <p>You are signed in as {user.email}.</p>
        <p>
          Your Rawan author account is ready. The writing workspace will be
          added separately.
        </p>
        <form action="/auth/logout" method="post">
          <button type="submit">Sign out</button>
        </form>
      </section>
    </main>
  );
}
