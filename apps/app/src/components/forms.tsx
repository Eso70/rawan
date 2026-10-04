"use client";
import { useActionState, useState } from "react";
import { authenticate, createResource, saveScene } from "@/lib/actions";
import type { FormState } from "@/lib/form-state";
const initial: FormState = {};
function Feedback({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </div>
  );
}
export function AuthForm({ register = false }: { register?: boolean }) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, register ? "register" : "login"),
    initial,
    register ? "/register" : "/sign-in",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="form-stack" aria-busy={pending}>
      {register && (
        <label>
          Name
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 12 : 1}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={register ? "password-help" : undefined}
        />
      </label>
      {register && (
        <p className="hint" id="password-help">
          Use 12–128 characters. A long passphrase works well.
        </p>
      )}
      <Feedback state={state} />
      <button type="submit" disabled={pending}>
        {pending
          ? "Please wait…"
          : register
            ? "Create your account"
            : "Sign in"}
      </button>
    </form>
  );
}
export function CreateForm({ ids, kind }: { ids: string[]; kind: string }) {
  const [state, action, pending] = useActionState(
    createResource.bind(null, ids),
    initial,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <section className="create-panel" aria-labelledby="create-heading">
      <p className="eyebrow">A new beginning</p>
      <h2 id="create-heading">Create {kind}</h2>
      <form action={action} className="form-stack" aria-busy={pending}>
        <label>
          Title
          <input
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Your ${kind} title`}
          />
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            name="description"
            maxLength={10000}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <Feedback state={state} />
        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : `Create ${kind}`}
        </button>
      </form>
    </section>
  );
}
export function SceneForm({
  ids,
  content,
}: {
  ids: string[];
  content: string;
}) {
  const [state, action, pending] = useActionState(
    saveScene.bind(null, ids),
    initial,
  );
  const [draft, setDraft] = useState(content);
  const changed = draft !== content;
  return (
    <form action={action} className="scene-form" aria-busy={pending}>
      <label htmlFor="scene-content">Scene text</label>
      <p className="hint" id="scene-help">
        A simple text space for now. Save changes before leaving this page.
      </p>
      <textarea
        id="scene-content"
        name="content"
        aria-describedby="scene-help"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={50000}
        rows={18}
        dir="auto"
      />
      <div className="save-row">
        <button type="submit" disabled={pending || !changed}>
          {pending ? "Saving…" : "Save scene"}
        </button>
        <span className="hint">
          {draft.length.toLocaleString()} / 50,000 characters
          {changed ? " · Unsaved changes" : ""}
        </span>
      </div>
      <Feedback state={state} />
    </form>
  );
}
