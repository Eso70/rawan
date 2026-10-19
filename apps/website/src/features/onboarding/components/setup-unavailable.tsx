import styles from "../onboarding.module.css";
export function SetupUnavailable({
  retry = "/onboarding",
  account = false,
}: {
  retry?: string;
  account?: boolean;
}) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>
          {account
            ? "Your account is temporarily unavailable."
            : "Your setup couldn’t be loaded."}
        </h1>
        <p className={styles.description}>
          {account
            ? "We couldn’t reach the account service. Your session and saved choices haven’t been changed. Please try again."
            : "Your saved choices are safe. Please try again in a moment."}
        </p>
        <div className={styles.actions}>
          <a href={retry} className={styles.primary}>
            Try again
          </a>
          <a href="/" className={styles.secondary}>
            Back to Rawan
          </a>
        </div>
      </main>
    </div>
  );
}
