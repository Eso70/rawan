"use client";
import { useActionState, useId } from "react";
import type { ApiRelationship, WorldEntityReference } from "@rawan/types";
import type { FormState } from "@/lib/form-state";
import {
  saveRelationship,
  deleteRelationship,
} from "@/lib/relationship-actions";
export type EntityOption = WorldEntityReference & { name: string };
const value = (entity?: WorldEntityReference) =>
  entity ? `${entity.kind}:${entity.id}` : "";
function Feedback({ state }: { state: FormState }) {
  return (
    <div aria-live="polite">
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
    </div>
  );
}
export function RelationshipForm({
  projectId,
  options,
  relationship,
  source,
}: {
  projectId: string;
  options: EntityOption[];
  relationship?: ApiRelationship;
  source?: WorldEntityReference;
}) {
  const [state, action, pending] = useActionState(
    saveRelationship.bind(null, projectId, relationship?.id || null),
    {},
  );
  const heading = useId();
  return (
    <section className="create-panel" aria-labelledby={heading}>
      <h3 id={heading}>
        {relationship ? "Edit relationship" : "Create relationship"}
      </h3>
      <form action={action} className="form-stack" aria-busy={pending}>
        {(["source", "target"] as const).map((side) => (
          <label key={side} className="world-label">
            {side}
            <select
              name={side}
              required
              defaultValue={value(
                relationship?.[side] ||
                  (side === "source" ? source : undefined),
              )}
            >
              <option value="">Choose an entity</option>
              {options.map((entity) => (
                <option key={value(entity)} value={value(entity)}>
                  {entity.name} · {entity.kind.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Type key{" "}
          <input
            name="typeKey"
            required
            maxLength={64}
            defaultValue={relationship?.typeKey || ""}
            placeholder="MEMBER_OF"
            aria-describedby={`${heading}-hint`}
          />
        </label>
        <p id={`${heading}-hint`} className="hint">
          A stable key for this connection, such as MEMBER_OF or ALLIED_WITH.
          Spaces become underscores.
        </p>
        <label>
          Display label{" "}
          <input
            name="label"
            required
            maxLength={100}
            defaultValue={relationship?.label || ""}
            placeholder="member of"
            dir="auto"
          />
        </label>
        <label>
          Direction{" "}
          <select
            name="direction"
            defaultValue={relationship?.direction || "DIRECTIONAL"}
          >
            <option value="DIRECTIONAL">Directional: source → target</option>
            <option value="SYMMETRIC">Symmetric: source ↔ target</option>
          </select>
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            name="description"
            maxLength={10000}
            rows={3}
            defaultValue={relationship?.description || ""}
            dir="auto"
          />
        </label>
        <Feedback state={state} />
        <button
          type="submit"
          name={relationship ? "updateRelationship" : "createRelationship"}
          disabled={pending || options.length < 2}
        >
          {pending
            ? "Saving…"
            : relationship
              ? "Save relationship"
              : "Create relationship"}
        </button>
      </form>
    </section>
  );
}
export function RelationshipDelete({
  relationship,
}: {
  relationship: ApiRelationship;
}) {
  const [state, action, pending] = useActionState(
    deleteRelationship.bind(null, relationship.projectId, relationship.id),
    {},
  );
  return (
    <details className="delete-panel">
      <summary>Delete relationship</summary>
      <form action={action} className="form-stack" aria-busy={pending}>
        <label className="delete-confirm">
          <input type="checkbox" required name="confirm" value="delete" />{" "}
          Permanently delete this link.
        </label>
        <button
          type="submit"
          name={`delete-${relationship.id}`}
          disabled={pending}
        >
          {pending ? "Deleting…" : "Confirm deletion"}
        </button>
        <Feedback state={state} />
      </form>
    </details>
  );
}
