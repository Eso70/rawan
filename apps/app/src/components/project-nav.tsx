import Link from "next/link";
import { worldKinds, worldCollection } from "@/lib/world-paths";
export function ProjectNav({
  projectId,
  active = "manuscript",
}: {
  projectId: string;
  active?: string;
}) {
  return (
    <nav className="project-nav" aria-label="Project">
      <div>
        <span className="eyebrow">Manuscript</span>
        <Link
          aria-current={active === "manuscript" ? "page" : undefined}
          href={`/projects/${projectId}`}
        >
          Books
        </Link>
      </div>
      <div>
        <span className="eyebrow">Worldbuilding</span>
        {worldKinds.map((kind) => (
          <Link
            key={kind}
            aria-current={active === kind ? "page" : undefined}
            href={worldCollection(projectId, kind)}
          >
            {kind}
          </Link>
        ))}
      </div>
    </nav>
  );
}
