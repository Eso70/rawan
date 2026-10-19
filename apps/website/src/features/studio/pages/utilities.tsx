"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  IconUpload,
  IconArrowUpRight,
  IconTrash,
  IconPencil,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconHistory,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import { searchData, uid, encodeData } from "../data/repository";
import type { Status } from "../data/models";
import {
  PageHeading,
  Button,
  CollectionTools,
  Badge,
  Modal,
  FormDialog,
  ConfirmDialog,
  SectionHeading,
  EmptyState,
  dateLabel,
} from "../components/ui";

export function MediaPage({ projectId }: { projectId: string }) {
  const { data, insert, patch, remove, notify } = useStudio();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All assets");
  const [selected, setSelected] = useState("");
  const [edit, setEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const all = data.media.filter((m) => m.projectId === projectId);
  const media = all.filter(
    (m) =>
      (category === "All assets" || m.category === category) &&
      `${m.title} ${m.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const asset = all.find((m) => m.id === selected);
  const upload = async (files: FileList | null) => {
    const image = files?.[0];
    if (!image) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
      image.size > 1024 * 1024
    ) {
      setError(
        "Choose a PNG, JPEG or WebP image up to 1 MiB for this browser-only demo.",
      );
      return;
    }
    try {
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("The image could not be read."));
        reader.onerror = () =>
          reject(new Error("The image could not be read."));
        reader.readAsDataURL(image);
      });
      const id = uid("media");
      insert("media", {
        id,
        projectId,
        src,
        title: image.name.replace(/\.[^.]+$/, ""),
        category: "Uploads",
        description:
          "Uploaded to this browser only. No file was sent to a server.",
      });
      setSelected(id);
      notify("Image added to this browser's demo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image could not be read.");
    } finally {
      if (file.current) file.current.value = "";
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="A VISUAL NOTEBOOK"
        title="Media & assets"
        description="Reference images, visual studies, and things that set a scene."
        actions={
          <Button
            className="s-button primary"
            onClick={() => file.current?.click()}
          >
            <IconUpload size={16} />
            Add image
          </Button>
        }
      />
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="s-sr"
        aria-label="Upload an image to the local demo"
        onChange={(e) => {
          void upload(e.target.files);
        }}
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label>
          <span className="s-sr">Asset category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All assets", ...new Set(all.map((m) => m.category))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <span className="s-meta">
          {media.length} assets · stored on this device
        </span>
      </CollectionTools>
      {error && (
        <p role="alert" className="s-error">
          {error}
        </p>
      )}
      <div className="s-media-grid">
        {media.map((m) => (
          <Button
            className="s-media-card"
            key={m.id}
            onClick={() => setSelected(m.id)}
          >
            <img src={m.src} alt={m.title} />
            <span className="s-row">
              <strong>{m.title}</strong>
              <IconArrowUpRight size={15} />
            </span>
            <small>{m.category}</small>
          </Button>
        ))}
      </div>
      {!media.length && (
        <EmptyState
          title="A place for visual discoveries"
          description="Add an image, or try a different search."
          action={
            <Button
              className="s-button primary"
              onClick={() => file.current?.click()}
            >
              Add image
            </Button>
          }
        />
      )}
      <p className="s-local-note">
        Bundled studies are original Rawan SVG illustrations. Uploads stay in
        browser storage; large collections may exceed its capacity.
      </p>
      {asset && !edit && !deleting && (
        <Modal title={asset.title} onClose={() => setSelected("")} wide>
          <img className="s-media-full" src={asset.src} alt={asset.title} />
          <Badge>{asset.category}</Badge>
          <p className="s-description">{asset.description}</p>
          <form
            className="s-form s-attach-form"
            onSubmit={(e) => {
              e.preventDefault();
              const rawEntity = new FormData(e.currentTarget).get("entity");
              const entityId = typeof rawEntity === "string" ? rawEntity : "";
              if (
                !data.entities.some(
                  (v) => v.id === entityId && v.projectId === projectId,
                )
              )
                return;
              patch("entities", entityId, { image: asset.src });
              notify("Image attached to the entry locally.");
            }}
          >
            <label>
              Attach to an entry
              <select name="entity" required>
                <option value="">Choose an entry</option>
                {data.entities
                  .filter((e) => e.projectId === projectId)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit" className="s-button quiet">
              Attach image
            </Button>
          </form>
          <div className="s-dialog-actions">
            <Button className="s-button quiet" onClick={() => setEdit(true)}>
              <IconPencil size={14} />
              Edit details
            </Button>
            <Button
              className="s-button quiet s-danger-text"
              onClick={() => setDeleting(true)}
            >
              <IconTrash size={14} />
              Remove asset
            </Button>
          </div>
        </Modal>
      )}
      {asset && edit && (
        <FormDialog
          title="Asset details"
          onClose={() => setEdit(false)}
          fields={[
            {
              key: "title",
              label: "Title",
              required: true,
              value: asset.title,
            },
            {
              key: "category",
              label: "Category",
              required: true,
              value: asset.category,
            },
            {
              key: "description",
              label: "Description",
              type: "textarea",
              value: asset.description,
            },
          ]}
          onSubmit={(v) =>
            patch("media", asset.id, {
              title: v.title,
              category: v.category,
              description: v.description,
            })
          }
        />
      )}
      {asset && deleting && (
        <ConfirmDialog
          title="Remove this asset?"
          description="This removes the asset from the local library and clears matching demo image attachments."
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            remove("media", asset.id);
            setSelected("");
          }}
        />
      )}
    </>
  );
}
export function SearchPage() {
  const { data, update } = useStudio();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [kind, setKind] = useState("Everything");
  const [projectId, setProjectId] = useState("All projects");
  const results = searchData(
    data,
    query,
    projectId === "All projects" ? undefined : projectId,
  ).filter((r) => kind === "Everything" || kind === r.kind);
  const categories = [...new Set(results.map((r) => r.kind))];
  const remember = () => {
    if (query.trim())
      update((d) => ({
        ...d,
        recentSearches: [
          query.trim(),
          ...d.recentSearches.filter((v) => v !== query.trim()),
        ].slice(0, 6),
      }));
  };
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW THE THREAD"
        title="Search your studio"
        description="Find a phrase, a person, or the thought you left for later."
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label>
          <span className="s-sr">Search project scope</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option>All projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="s-sr">Search content type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {[
              "Everything",
              "Projects",
              "Works",
              "Chapters",
              "Characters",
              "Locations",
              "Factions",
              "Artifacts",
              "Events",
              "Notes",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </CollectionTools>
      {!query && (
        <section className="s-search-recent">
          <SectionHeading title="Recent searches" />
          {data.recentSearches.length ? (
            data.recentSearches.map((s) => (
              <Button
                className="s-related-row"
                key={s}
                onClick={() => setQuery(s)}
              >
                <IconHistory size={16} />
                {s}
                <IconArrowUpRight size={15} />
              </Button>
            ))
          ) : (
            <p className="s-muted">
              Try “Mira”, “memory”, or a phrase from a manuscript.
            </p>
          )}
        </section>
      )}
      {query && (
        <p className="s-result-count">
          {results.length} matches for “{query}”
        </p>
      )}
      {categories.map((c) => (
        <section className="s-search-group" key={c}>
          <SectionHeading title={c} />
          <div className="s-document-list">
            {results
              .filter((r) => r.kind === c)
              .map((r) => (
                <Link key={r.id} href={r.href} onClick={remember}>
                  <IconSearch size={17} />
                  <span>
                    <strong>{r.title}</strong>
                    <small>{r.context}</small>
                  </span>
                  <IconArrowUpRight size={15} />
                </Link>
              ))}
          </div>
        </section>
      ))}
      {query && !results.length && (
        <EmptyState
          title="No thread found just yet"
          description="Try a shorter phrase or search another project."
        />
      )}
    </>
  );
}
export function ActivityPage() {
  const { data } = useStudio();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All projects");
  const activity = data.activity
    .filter(
      (a) =>
        (filter === "All projects" || a.projectId === filter) &&
        a.label.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeading
        eyebrow="THE WORK LEAVES A TRACE"
        title="Recent activity"
        description="A small record of the pages you've returned to."
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label>
          <span className="s-sr">Activity project</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      </CollectionTools>
      <div className="s-activity-feed">
        {activity.map((a) => (
          <Link key={a.id} href={a.href}>
            <span className="s-activity-mark" />
            <span>
              <strong>{a.label}</strong>
              <small>
                {data.projects.find((p) => p.id === a.projectId)?.title}
              </small>
            </span>
            <time dateTime={a.at}>{dateLabel(a.at)}</time>
            <IconArrowUpRight size={15} />
          </Link>
        ))}
      </div>
      {!activity.length && (
        <EmptyState
          title="A quiet desk"
          description="Your local writing and document edits will appear here."
        />
      )}
    </>
  );
}
export function PreferencesPage() {
  const { data, update, reset, persistence, saveNow, notify } = useStudio();
  const [confirm, setConfirm] = useState(false);
  const p = data.preferences;
  const set = (values: Partial<typeof p>) =>
    update((d) => ({ ...d, preferences: { ...d.preferences, ...values } }));
  const exportData = () => {
    const blob = new Blob([encodeData(data)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "rawan-studio-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    notify("Local demo backup downloaded.");
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE ROOM FOR YOUR WAY OF WORKING"
        title="Preferences"
        description="Small adjustments for a space that feels like yours."
      />
      <div className="s-settings-layout">
        <div>
          <section className="s-settings-section">
            <h2>Appearance</h2>
            <p>Keep the interface quiet, in light or dark.</p>
            <div className="s-setting-row">
              <span>
                Studio theme<small>Applies throughout the Author Studio.</small>
              </span>
              <div className="s-segmented">
                <Button
                  aria-pressed={p.theme === "dark"}
                  onClick={() => set({ theme: "dark" })}
                >
                  Dark
                </Button>
                <Button
                  aria-pressed={p.theme === "light"}
                  onClick={() => set({ theme: "light" })}
                >
                  Light
                </Button>
              </div>
            </div>
            <label className="s-setting-row">
              <span>
                Compact navigation
                <small>Reduce the vertical space between sidebar items.</small>
              </span>
              <input
                type="checkbox"
                checked={p.compact}
                onChange={(e) => set({ compact: e.target.checked })}
              />
            </label>
            <label className="s-setting-row">
              <span>
                Reduce motion
                <small>Keep transitions immediate and decoration still.</small>
              </span>
              <input
                type="checkbox"
                checked={p.reducedMotion}
                onChange={(e) => set({ reducedMotion: e.target.checked })}
              />
            </label>
          </section>
          <section className="s-settings-section">
            <h2>Your writing page</h2>
            <p>These choices affect the manuscript editor.</p>
            <label className="s-setting-row">
              <span>Typeface</span>
              <select
                value={p.font}
                onChange={(e) =>
                  set({ font: e.target.value as "serif" | "sans" })
                }
              >
                <option value="serif">Lora · literary serif</option>
                <option value="sans">Inter · clear sans</option>
              </select>
            </label>
            <label className="s-setting-row">
              <span>
                Text size <output>{p.fontSize}px</output>
              </span>
              <input
                type="range"
                min={14}
                max={28}
                value={p.fontSize}
                onChange={(e) => set({ fontSize: Number(e.target.value) })}
              />
            </label>
            <label className="s-setting-row">
              <span>
                Line spacing <output>{p.lineHeight.toFixed(2)}</output>
              </span>
              <input
                type="range"
                min={1.3}
                max={2.4}
                step={0.05}
                value={p.lineHeight}
                onChange={(e) => set({ lineHeight: Number(e.target.value) })}
              />
            </label>
            <label className="s-setting-row">
              <span>
                Page width <output>{p.editorWidth}px</output>
              </span>
              <input
                type="range"
                min={480}
                max={1000}
                step={20}
                value={p.editorWidth}
                onChange={(e) => set({ editorWidth: Number(e.target.value) })}
              />
            </label>
          </section>
          <section className="s-settings-section">
            <h2>A familiar name</h2>
            <label className="s-setting-row">
              <span>
                Your name
                <small>
                  Local demo profile. This does not change a real account.
                </small>
              </span>
              <input
                value={p.authorName}
                maxLength={60}
                onChange={(e) => set({ authorName: e.target.value })}
              />
            </label>
          </section>
          <section className="s-settings-section">
            <h2>Demo data</h2>
            <p>
              Changes stay in this browser. Export a backup before resetting or
              clearing browser storage. Multiple tabs do not merge edits; use
              one studio tab at a time.
            </p>
            <div className="s-actions">
              <Button className="s-button quiet" onClick={exportData}>
                <IconDownload size={15} />
                Export backup
              </Button>
              <Button
                className="s-button quiet"
                onClick={() => setConfirm(true)}
              >
                <IconRefresh size={15} />
                Reset demo
              </Button>
              <Button className="s-button quiet" onClick={saveNow}>
                Save now
              </Button>
            </div>
            <p className="s-local-note" role="status">
              {persistence === "saved"
                ? "Saved on this device"
                : persistence === "saving"
                  ? "Saving…"
                  : "Browser save failed — export a backup to keep your work."}
            </p>
          </section>
        </div>
        <aside>
          <div className="s-typography-preview">
            <p className="s-eyebrow">A LITTLE PREVIEW</p>
            <h2>The city before waking</h2>
            <p className="s-writing-preview">
              By the time the bells began, Mira had already found the missing
              page. Nothing about the morning suggested that a history could
              disappear.
            </p>
            <span className="s-meta">Your page, your pace.</span>
          </div>
          <div className="s-shortcuts-card">
            <h3>A few shortcuts</h3>
            <p>
              <span>Find anything</span>
              <kbd>Ctrl / ⌘ K</kbd>
            </p>
            <p>
              <span>Save manuscript</span>
              <kbd>Ctrl / ⌘ S</kbd>
            </p>
            <p>
              <span>Bold / italic</span>
              <kbd>Ctrl / ⌘ B / I</kbd>
            </p>
            <p>
              <span>Leave focus mode</span>
              <kbd>Esc</kbd>
            </p>
          </div>
        </aside>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Start the demo again?"
          description="This replaces all local projects, manuscripts, uploads, feedback and preferences with the original demonstration. Download a backup first if you want to keep your edits."
          onClose={() => setConfirm(false)}
          onConfirm={reset}
        />
      )}
    </>
  );
}
export function ProjectSettingsPage({ projectId }: { projectId: string }) {
  const { data, patch, remove, notify } = useStudio();
  const p = data.projects.find((p) => p.id === projectId)!;
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="A PLACE FOR THE DETAILS"
        title="Project settings"
        description="Identity, intention, and a little room to change your mind."
      />
      <form
        className="s-project-settings-form s-form"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
            string,
            string
          >;
          const goal = Number(v.goal);
          if (!v.title.trim()) {
            notify("Give your project a title.");
            return;
          }
          if (!Number.isFinite(goal) || goal < 1 || goal > 10000000) return;
          patch("projects", projectId, {
            title: v.title.trim(),
            description: v.description,
            status: v.status as Status,
            goal,
            updatedAt: new Date().toISOString(),
          });
          notify("Project settings saved locally.");
        }}
      >
        <label>
          Project title
          <input name="title" required defaultValue={p.title} maxLength={200} />
        </label>
        <label>
          Description
          <textarea name="description" rows={5} defaultValue={p.description} />
        </label>
        <label>
          Project status
          <select name="status" defaultValue={p.status}>
            {["Planning", "Drafting", "Revising", "Complete"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Writing goal (words, or planning units for a comic)
          <input
            name="goal"
            type="number"
            required
            min={1}
            max={10000000}
            defaultValue={p.goal}
          />
        </label>
        <Button className="s-button primary" type="submit">
          Save project settings
        </Button>
      </form>
      <section className="s-settings-section">
        <h2>Remove this project</h2>
        <p>Delete the local project and its content. Other projects remain.</p>
        <Button
          className="s-button quiet s-danger-text"
          onClick={() => setDeleting(true)}
        >
          Delete project
        </Button>
      </section>
      {deleting && (
        <ConfirmDialog
          title={`Delete ${p.title}?`}
          description="This removes its manuscripts, worldbuilding, notes, timeline and canvas from this browser."
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            remove("projects", projectId);
            router.push("/studio/projects");
          }}
        />
      )}
    </>
  );
}
