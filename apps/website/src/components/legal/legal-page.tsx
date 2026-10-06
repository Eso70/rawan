import type { ReactNode } from "react";
import { LandingNavigation } from "../landing-navigation";
import { LandingScroll } from "../landing-scroll";
import { SiteFooter } from "../site-footer";
import styles from "./legal.module.css";

export function LegalPage({
  title,
  current,
  children,
}: {
  title: string;
  current: "terms" | "privacy";
  children: ReactNode;
}) {
  return (
    <LandingScroll>
      <div className={`landing-surface ${styles.page}`}>
        <LandingNavigation />
        <main className={styles.main}>
          <div className={styles.heading}>
            <h1>{title}</h1>
            <p>Last updated: October 2026 · Preview draft</p>
          </div>
          <article className={styles.document} aria-label={title}>
            {children}
          </article>
        </main>
        <SiteFooter current={current} />
      </div>
    </LandingScroll>
  );
}
