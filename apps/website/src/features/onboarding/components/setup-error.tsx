"use client";
import styles from "../onboarding.module.css";
export function SetupError({ retry }: { retry: () => void }) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Your account couldn’t be checked.</h1>
        <p className={styles.description}>
          Please try again in a moment. Your saved choices are safe.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => retry()}>
            Try again
          </button>
          <a href="/" className={styles.secondary}>
            Back to Rawan
          </a>
        </div>
      </main>
    </div>
  );
}
