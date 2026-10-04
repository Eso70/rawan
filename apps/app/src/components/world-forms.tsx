"use client";
import { useActionState } from "react";
import type {
  ApiWorldEntity,
  ApiCharacter,
  ApiPlace,
  WorldKind,
} from "@rawan/types";
import { saveWorld, deleteWorld } from "@/lib/world-actions";
import type { FormState } from "@/lib/form-state";
const initial: FormState = {};
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
export function WorldForm({
  projectId,
  kind,
  entity,
}: {
  projectId: string;
  kind: WorldKind;
  entity?: ApiWorldEntity;
}) {
  const [state, action, pending] = useActionState(
    saveWorld.bind(null, projectId, kind, entity?.id || null),
    initial,
  );
  const fields = [
    "name",
    "summary",
    "description",
    ...(kind === "characters" ? ["role", "status"] : ["type"]),
  ];
  const record = entity as (ApiCharacter & ApiPlace) | undefined;
  return (
    <section className="create-panel">
      <h2 id="create-heading">
        {entity ? "Edit details" : `Create ${kind.slice(0, -1)}`}
      </h2>
      <form action={action} className="form-stack" aria-busy={pending}>
        {fields.map((field) => {
          const limit =
            field === "description"
              ? 10000
              : field === "summary"
                ? 1000
                : field === "name"
                  ? 200
                  : 100;
          const value = record?.[field as keyof typeof record] || "";
          return (
            <label key={field} className="world-label">
              {field}{" "}
              {field !== "name" && <span className="optional">optional</span>}
              {["summary", "description"].includes(field) ? (
                <textarea
                  name={field}
                  defaultValue={value}
                  maxLength={limit}
                  rows={field === "description" ? 8 : 3}
                  dir="auto"
                />
              ) : (
                <input
                  name={field}
                  defaultValue={value}
                  required={field === "name"}
                  maxLength={limit}
                  dir="auto"
                />
              )}
            </label>
          );
        })}
        <Feedback state={state} />
        <button disabled={pending} type="submit">
          {pending
            ? "Saving…"
            : entity
              ? "Save changes"
              : `Create ${kind.slice(0, -1)}`}
        </button>
      </form>
    </section>
  );
}
export function WorldDelete({
  projectId,
  kind,
  entity,
}: {
  projectId: string;
  kind: WorldKind;
  entity: ApiWorldEntity;
}) {
  const [state, action, pending] = useActionState(
    deleteWorld.bind(null, projectId, kind, entity.id),
    initial,
  );
  return (
    <details className="delete-panel">
      <summary>Delete {kind.slice(0, -1)}</summary>
      <form action={action} className="form-stack" aria-busy={pending}>
        <p>
          Delete “{entity.name}”? This permanently removes it from your project.
        </p>
        <label className="delete-confirm">
          <input type="checkbox" name="confirm" value="delete" required /> I
          want to permanently delete this {kind.slice(0, -1)}.
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Deleting…" : "Confirm deletion"}
        </button>
        <Feedback state={state} />
      </form>
    </details>
  );
}
