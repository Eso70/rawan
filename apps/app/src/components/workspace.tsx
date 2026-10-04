import Link from "next/link";
import type { ApiUser } from "@rawan/types";
import { logout } from "@/lib/actions";
export function AppShell({
  user,
  children,
}: {
  user: ApiUser;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <a href="#workspace" className="skip-link">
        Skip to workspace
      </a>
      <aside className="sidebar" aria-label="Workspace navigation">
        <Link href="/projects" className="wordmark">
          ✦ <span>Rawan</span>
        </Link>
        <p className="sidebar-caption">Your writing space</p>
        <nav aria-label="Main">
          <Link className="nav-link" href="/projects">
            Projects <span aria-hidden="true">↗</span>
          </Link>
        </nav>
        <div className="account">
          <p>{user.name}</p>
          <span>{user.email}</span>
          <form action={logout}>
            <button className="quiet-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="workspace" className="workspace" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { title: string; href: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={item.href}>
            {index === items.length - 1 ? (
              <span aria-current="page">{item.title}</span>
            ) : (
              <Link href={item.href}>{item.title}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
}) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="description">{description}</p>}
    </header>
  );
}
export function ResourceList({
  kind,
  resources,
  path,
}: {
  kind: string;
  resources: {
    id: string;
    title: string;
    description: string | null;
    updatedAt: string;
  }[];
  path: string;
}) {
  return (
    <section aria-labelledby="resources-heading">
      <div className="section-heading">
        <h2 id="resources-heading">{kind}s</h2>
        <span>{resources.length.toLocaleString()}</span>
      </div>
      {resources.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">✧</span>
          <h3>No {kind}s yet</h3>
          <p>
            Every story starts somewhere. Create your first {kind} to begin.
          </p>
          <a href="#create-heading" className="text-link">
            Create {kind} →
          </a>
        </div>
      ) : (
        <ul className="resource-list">
          {resources.map((resource) => (
            <li key={resource.id}>
              <Link
                className="resource-card"
                href={`${path}/${encodeURIComponent(resource.id)}`}
              >
                <div>
                  <h3>{resource.title}</h3>
                  {resource.description && <p>{resource.description}</p>}
                  <span className="hint">
                    Updated {formatDate(resource.updatedAt)}
                  </span>
                </div>
                <span className="open-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}
