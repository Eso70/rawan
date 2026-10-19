"use client";
import Link from "next/link";
import {
  IconPin,
  IconDots,
  IconArrowUpRight,
  IconFeather,
} from "@tabler/icons-react";
import { useState } from "react";
import type { Project, WorkKind, Status } from "../data/models";
import { useStudio } from "../studio-provider";
import { projectPath, workWords } from "../data/repository";
import {
  Button,
  IconButton,
  StatusBadge,
  dateLabel,
  FormDialog,
  ConfirmDialog,
} from "./ui";
export function ProjectCard({
  project: p,
  list = false,
}: {
  project: Project;
  list?: boolean;
}) {
  const { data, patch, remove, notify } = useStudio();
  const [edit, setEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const words = data.works
    .filter((w) => w.projectId === p.id)
    .reduce((n, w) => n + workWords(data, w.id), 0);
  return (
    <article className={`s-project-card ${list ? "list" : ""}`}>
      <Link
        href={projectPath(p.id)}
        className="s-project-art"
        style={{ backgroundColor: `${p.color}12` }}
      >
        <img src={p.cover} alt={`${p.title} cover`} />
        <span className="s-cover-open">
          <IconArrowUpRight size={20} />
        </span>
      </Link>
      <div className="s-project-card-content">
        <div className="s-row">
          <span className="s-eyebrow">{p.kind}</span>
          <div className="s-actions">
            <IconButton
              label={p.pinned ? `Unpin ${p.title}` : `Pin ${p.title}`}
              aria-pressed={p.pinned}
              onClick={() => patch("projects", p.id, { pinned: !p.pinned })}
              className={`s-icon ${p.pinned ? "accent" : ""}`}
            >
              <IconPin size={16} />
            </IconButton>
            <details className="s-menu">
              <summary aria-label={`Actions for ${p.title}`}>
                <IconDots size={18} />
              </summary>
              <div>
                <Button onClick={() => setEdit(true)}>Edit project</Button>
                <Link href={projectPath(p.id, "settings")}>
                  Project settings
                </Link>
                <Button
                  className="s-danger-text"
                  onClick={() => setDeleting(true)}
                >
                  Delete project
                </Button>
              </div>
            </details>
          </div>
        </div>
        <h3>
          <Link href={projectPath(p.id)}>{p.title}</Link>
        </h3>
        <p className="s-card-description">{p.description}</p>
        <div className="s-row">
          <StatusBadge value={p.status} />
          <span className="s-meta">Edited {dateLabel(p.updatedAt)}</span>
        </div>
        <div className="s-project-card-footer">
          <span>
            <IconFeather size={13} />
            {p.kind === "Comic"
              ? "Visual concept"
              : `${words.toLocaleString()} words`}
          </span>
          <span>
            {data.works.filter((w) => w.projectId === p.id).length} works
          </span>
        </div>
      </div>
      {edit && (
        <FormDialog
          title="Edit project"
          onClose={() => setEdit(false)}
          fields={[
            { key: "title", label: "Title", value: p.title, required: true },
            {
              key: "description",
              label: "Description",
              type: "textarea",
              value: p.description,
            },
            {
              key: "kind",
              label: "Type",
              type: "select",
              options: [
                "Novel",
                "Non-fiction",
                "Short story",
                "Essay",
                "Comic",
              ],
              value: p.kind,
            },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Planning", "Drafting", "Revising", "Complete"],
              value: p.status,
            },
          ]}
          onSubmit={(v) => {
            patch("projects", p.id, {
              title: v.title.trim(),
              description: v.description,
              kind: v.kind as WorkKind,
              status: v.status as Status,
              updatedAt: new Date().toISOString(),
            });
            notify("Project updated locally.");
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${p.title}?`}
          description="This removes the project and all its demo content from this browser. You can restore the original demonstration in Preferences."
          onClose={() => setDeleting(false)}
          onConfirm={() => remove("projects", p.id)}
        />
      )}
    </article>
  );
}
