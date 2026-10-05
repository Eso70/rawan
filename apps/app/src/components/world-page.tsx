import Link from "next/link";
import { notFound } from "next/navigation";
import type {
  ApiProject,
  ApiWorldEntity,
  ApiCharacter,
  ApiPlace,
} from "@rawan/types";
import { readResource } from "@/lib/data";
import {
  worldKind,
  worldCollection,
  worldResource,
  worldPage,
} from "@/lib/world-paths";
import { Breadcrumbs, PageHeader, formatDate } from "./workspace";
import { ProjectNav } from "./project-nav";
import { WorldForm, WorldDelete } from "./world-forms";
import { RelationshipsPanel } from "./relationships-panel";
import { entityCollections } from "@/lib/relationship-paths";
import type { WorldEntityKind } from "@rawan/types";
export async function WorldPage({
  projectId,
  collection,
  entityId,
}: {
  projectId: string;
  collection: string;
  entityId?: string;
}) {
  if (
    !/^[a-zA-Z0-9_-]{1,128}$/.test(projectId) ||
    (entityId && !/^[a-zA-Z0-9_-]{1,128}$/.test(entityId))
  )
    notFound();
  let kind;
  try {
    kind = worldKind(collection);
  } catch {
    notFound();
  }
  const project = await readResource<ApiProject>(`/projects/${projectId}`);
  const path = worldCollection(projectId, kind);
  const breadcrumbs = [
    { title: "Projects", href: "/projects" },
    { title: project.title, href: `/projects/${projectId}` },
    { title: kind[0].toUpperCase() + kind.slice(1), href: path },
  ];
  if (entityId) {
    const entity = await readResource<
      ApiWorldEntity & Partial<ApiCharacter & ApiPlace>
    >(worldResource(kind, entityId));
    if (entity.projectId !== projectId) notFound();
    return (
      <>
        <Breadcrumbs
          items={[
            ...breadcrumbs,
            { title: entity.name, href: worldPage(projectId, kind, entity.id) },
          ]}
        />
        <ProjectNav projectId={projectId} active={kind} />
        <PageHeader
          eyebrow={kind.slice(0, -1)}
          title={entity.name}
          description={entity.summary}
        />
        <p className="metadata">
          Updated {formatDate(entity.updatedAt)}
          {entity.role || entity.type ? ` · ${entity.role || entity.type}` : ""}
          {entity.status ? ` · ${entity.status}` : ""}
        </p>
        {entity.description && (
          <p className="world-description">{entity.description}</p>
        )}
        <WorldForm
          key={entity.updatedAt}
          projectId={projectId}
          kind={kind}
          entity={entity}
        />
        <WorldDelete projectId={projectId} kind={kind} entity={entity} />
        <RelationshipsPanel
          projectId={projectId}
          entity={{
            id: entity.id,
            kind: Object.entries(entityCollections).find(
              ([, collection]) => collection === kind,
            )![0] as WorldEntityKind,
          }}
        />
      </>
    );
  }
  const entities =
    await readResource<(ApiWorldEntity & Partial<ApiCharacter & ApiPlace>)[]>(
      path,
    );
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <ProjectNav projectId={projectId} active={kind} />
      <PageHeader
        eyebrow={project.title}
        title={kind[0].toUpperCase() + kind.slice(1)}
        description="Build the world shared by every book in this project."
      />
      <div className="content-columns">
        <section aria-labelledby="resources-heading">
          <div className="section-heading">
            <h2 id="resources-heading">{kind}</h2>
            <span>{entities.length}</span>
          </div>
          {!entities.length ? (
            <div className="empty-state">
              <h3>No {kind} yet</h3>
              <p>
                Create your first {kind.slice(0, -1)} to start shaping your
                world.
              </p>
              <a href="#create-heading" className="text-link">
                Create {kind.slice(0, -1)} →
              </a>
            </div>
          ) : (
            <ul className="resource-list">
              {entities.map((entity) => (
                <li key={entity.id}>
                  <Link
                    className="resource-card"
                    href={worldPage(projectId, kind, entity.id)}
                  >
                    <div>
                      <h3>{entity.name}</h3>
                      {(entity.role || entity.type) && (
                        <span className="hint">
                          {entity.role || entity.type}
                        </span>
                      )}
                      {entity.summary && <p>{entity.summary}</p>}
                    </div>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <WorldForm projectId={projectId} kind={kind} />
      </div>
    </>
  );
}
