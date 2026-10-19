"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IconX,
  IconPlus,
  IconArrowUpRight,
  IconSearch,
  IconBook2,
} from "@tabler/icons-react";
import { Button, IconButton } from "../../../components/ui/controls";
import type { Status } from "../data/models";
export { Button, IconButton };
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="s-page-heading">
      <div>
        {eyebrow && <p className="s-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="s-description">{description}</p>}
      </div>
      {actions && <div className="s-actions">{actions}</div>}
    </header>
  );
}
export function SectionHeading({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: ReactNode;
}) {
  return (
    <div className="s-section-heading">
      <h2>{title}</h2>
      {href && (
        <Link href={href}>
          View all <IconArrowUpRight size={14} />
        </Link>
      )}
      {action}
    </div>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`s-badge ${tone}`}>{children}</span>;
}
export function StatusBadge({ value }: { value: Status }) {
  return (
    <Badge
      tone={value === "Complete" ? "sage" : value === "Revising" ? "blue" : ""}
    >
      {value}
    </Badge>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="s-empty">
      <IconBook2 size={30} stroke={1.2} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="s-search">
      <IconSearch size={17} />
      <span className="s-sr">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <Button aria-label="Clear search" onClick={() => onChange("")}>
          <IconX size={14} />
        </Button>
      )}
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const before = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`s-dialog ${wide ? "wide" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close.current();
        }
      }}
    >
      <div className="s-dialog-header">
        <h2 id={id}>{title}</h2>
        <IconButton label="Close dialog" onClick={onClose} className="s-icon">
          <IconX size={18} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
export type FormField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number";
  options?: string[];
  required?: boolean;
  value?: string;
  maxLength?: number;
};
export function FormDialog({
  title,
  fields,
  onClose,
  onSubmit,
  submitLabel = "Save changes",
  note,
}: {
  title: string;
  fields: FormField[];
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
  note?: string;
}) {
  const [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="s-form"
        onSubmit={(e) => {
          e.preventDefault();
          const values = Object.fromEntries(
            new FormData(e.currentTarget).entries(),
          ) as Record<string, string>;
          try {
            for (const f of fields)
              if (f.required && !values[f.key]?.trim())
                throw new Error(`${f.label} is required.`);
            onSubmit(values);
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Please try again.");
          }
        }}
      >
        {note && <p className="s-muted">{note}</p>}
        {fields.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                name={field.key}
                defaultValue={field.value}
                required={field.required}
                rows={5}
                maxLength={field.maxLength ?? 20000}
              />
            ) : field.type === "select" ? (
              <select
                name={field.key}
                defaultValue={field.value}
                required={field.required}
              >
                {field.options?.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                name={field.key}
                defaultValue={field.value}
                required={field.required}
                maxLength={field.maxLength ?? 200}
              />
            )}
          </label>
        ))}
        {error && (
          <p role="alert" className="s-error">
            {error}
          </p>
        )}
        <div className="s-dialog-actions">
          <Button className="s-button quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="s-button primary">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="s-description">{description}</p>
      <div className="s-dialog-actions">
        <Button autoFocus className="s-button quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="s-button danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
export function CreateButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button className="s-button primary" onClick={onClick}>
      <IconPlus size={16} />
      {children}
    </Button>
  );
}
export function CollectionTools({
  query,
  setQuery,
  children,
}: {
  query: string;
  setQuery: (s: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="s-collection-tools">
      <SearchField value={query} onChange={setQuery} />
      {children}
    </div>
  );
}
export function StatLine({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="s-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Baghdad",
  });
}
