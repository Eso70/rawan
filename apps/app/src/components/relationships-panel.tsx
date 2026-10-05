import Link from "next/link";
import type {
  ApiRelationship,
  ApiWorldEntity,
  WorldEntityReference,
  WorldEntityKind,
} from "@rawan/types";
import { readResource } from "@/lib/data";
import {
  entityCollections,
  entityPage,
  relationshipCollection,
} from "@/lib/relationship-paths";
import { worldCollection } from "@/lib/world-paths";
import { RelationshipForm, RelationshipDelete } from "./relationship-forms";
export async function RelationshipsPanel({
  projectId,
  entity,
}: {
  projectId: string;
  entity?: WorldEntityReference;
}) {
  const [relationships, ...groups] = await Promise.all([
    readResource<ApiRelationship[]>(relationshipCollection(projectId, entity)),
    ...Object.entries(entityCollections).map(async ([kind, collection]) =>
      (
        await readResource<ApiWorldEntity[]>(
          worldCollection(projectId, collection),
        )
      ).map((row) => ({
        kind: kind as WorldEntityKind,
        id: row.id,
        name: row.name,
      })),
    ),
  ]);
  const options = groups.flat();
  return (
    <section className="relationships-section" aria-label="Relationships">
      <div className="section-heading">
        <h2>Relationships</h2>
        <span>{relationships.length}</span>
      </div>
      <div className="content-columns">
        <div>
          {!relationships.length ? (
            <div className="empty-state">
              <h3>No relationships yet</h3>
              <p>
                Connect the people, places, factions and artifacts in this
                project.
              </p>
            </div>
          ) : (
            <ul className="resource-list">
              {relationships.map((link) => (
                <li key={link.id} className="relationship-card">
                  <p>
                    <Link
                      className="text-link"
                      href={entityPage(projectId, link.source)}
                    >
                      {link.source.name}
                    </Link>{" "}
                    <span dir="auto">{link.label}</span>{" "}
                    <span
                      aria-label={
                        link.direction === "SYMMETRIC"
                          ? "in both directions"
                          : "toward"
                      }
                    >
                      {link.direction === "SYMMETRIC" ? "↔" : "→"}
                    </span>{" "}
                    <Link
                      className="text-link"
                      href={entityPage(projectId, link.target)}
                    >
                      {link.target.name}
                    </Link>
                  </p>
                  <p className="metadata">
                    {link.typeKey} · {link.direction.toLowerCase()}
                  </p>
                  {link.description && (
                    <p className="world-description" dir="auto">
                      {link.description}
                    </p>
                  )}
                  <details>
                    <summary>Edit relationship</summary>
                    <RelationshipForm
                      key={link.updatedAt}
                      projectId={projectId}
                      options={options}
                      relationship={link}
                    />
                  </details>
                  <RelationshipDelete relationship={link} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          {options.length < 2 && (
            <p className="hint">
              Create at least two world entities before connecting them.
            </p>
          )}
          <RelationshipForm
            projectId={projectId}
            options={options}
            source={entity}
          />
        </div>
      </div>
    </section>
  );
}
