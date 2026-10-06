import {
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandDiscordFilled,
} from "@tabler/icons-react";
import { BrandMark } from "./brand-mark";
import { DISCORD_INVITE } from "./site-links";
import styles from "./closing-section.module.css";

const social = [
  { name: "TikTok", icon: IconBrandTiktok },
  { name: "YouTube", icon: IconBrandYoutube },
  { name: "Instagram", icon: IconBrandInstagram },
];

export function SiteFooter({ current }: { current?: "terms" | "privacy" }) {
  return (
    <footer className={styles.footer}>
      <a href="/" className={styles.brand} aria-label="Rawan home">
        <BrandMark className={styles.footerMark} />
        <span>rawan</span>
      </a>
      <nav className={styles.footerNav} aria-label="Footer navigation">
        <details className={styles.resources}>
          <summary>Resources</summary>
          <ul>
            <li>
              <a href="/#toolkit">The toolkit</a>
            </li>
            <li>
              <a href="/#community">Creator community</a>
            </li>
            <li>
              <a href="/#creators">Build your world</a>
            </li>
          </ul>
        </details>
        {["What’s new", "Careers"].map((label) => (
          <span className={styles.footerItem} key={label}>
            <span aria-hidden="true">•</span>
            <button disabled title="Coming later">
              {label}
            </button>
          </span>
        ))}
        <span className={styles.footerItem}>
          <span aria-hidden="true">•</span>
          <a
            href="/terms"
            aria-current={current === "terms" ? "page" : undefined}
          >
            Terms
          </a>
        </span>
        <span className={styles.footerItem}>
          <span aria-hidden="true">•</span>
          <a
            href="/privacy"
            aria-current={current === "privacy" ? "page" : undefined}
          >
            Privacy
          </a>
        </span>
        <span className={styles.copyright}>
          <span aria-hidden="true">•</span>© 2026 rawan
        </span>
      </nav>
      <div className={styles.social} aria-label="Social channels">
        {social.map(({ name, icon: Icon }) => (
          <button
            key={name}
            disabled
            aria-label={`${name} — coming later`}
            title={`${name} — coming later`}
          >
            <Icon size={21} stroke={2} aria-hidden="true" />
          </button>
        ))}
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Rawan Discord community"
        >
          <IconBrandDiscordFilled size={21} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
