"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeProps,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSettings2,
  IconArrowUpRight,
  IconLayoutGrid,
  IconList,
  IconLink,
  IconNotes,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import { projectPath, uid } from "../data/repository";
import type { CanvasNode } from "../data/models";
import {
  PageHeading,
  Button,
  IconButton,
  FormDialog,
  ConfirmDialog,
  CollectionTools,
  Badge,
  SectionHeading,
  EmptyState,
} from "../components/ui";
type PlanningNode = Node<
  {
    title: string;
    text: string;
    kind: string;
    image?: string;
    showLabel?: boolean;
  },
  "planning"
>;
function PlanningCard({ data, selected }: NodeProps<PlanningNode>) {
  return (
    <div className={`s-canvas-node ${data.kind} ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <span className="s-eyebrow">
        {data.kind === "entity"
          ? "World reference"
          : data.kind === "plot"
            ? "Story moment"
            : data.kind === "image"
              ? "Visual reference"
              : "A thought"}
      </span>
      {data.image && <img src={data.image} alt="" draggable={false} />}
      <h3>{data.title}</h3>
      <p>{data.text}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
function GraphCard({ data, selected }: NodeProps<PlanningNode>) {
  return (
    <div className={`s-graph-node ${selected ? "selected" : ""}`}>
      <div className={`s-graph-symbol ${data.kind.toLowerCase()}`}>
        <IconNotes size={22} stroke={1.4} />
      </div>
      {(data.showLabel || selected) && (
        <>
          <strong>{data.title}</strong>
          <small>{data.kind}</small>
        </>
      )}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
const canvasNodeTypes = { planning: PlanningCard };
const graphNodeTypes = { planning: GraphCard };
export function CanvasPage({ projectId }: { projectId: string }) {
  const { data, insert, patch, remove, notify } = useStudio();
  const source = data.nodes.filter((n) => n.projectId === projectId);
  const initial: PlanningNode[] = source.map((n) => ({
    id: n.id,
    ariaLabel: n.title,
    type: "planning",
    position: { x: n.x, y: n.y },
    data: { title: n.title, text: n.text, kind: n.kind, image: n.image },
  }));
  const [nodes, setNodes, onNodesChange] = useNodesState<PlanningNode>(initial);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    data.edges
      .filter((e) => e.projectId === projectId)
      .map((e) => ({ ...e, type: "smoothstep" })),
  );
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState<"new" | "edit" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [list, setList] = useState(false);
  const node = source.find((n) => n.id === selected);
  const entities = data.entities.filter((e) => e.projectId === projectId);
  const media = data.media.filter((m) => m.projectId === projectId);
  const connect = (c: Connection) => {
    if (
      c.source === c.target ||
      data.edges.some((e) => e.source === c.source && e.target === c.target)
    )
      return;
    const id = uid("edge");
    const edge = {
      id,
      projectId,
      source: c.source,
      target: c.target,
      label: "Connected",
    };
    insert("edges", edge);
    setEdges((v) => [...v, { ...edge, type: "smoothstep" }]);
    notify("Connection saved locally.");
  };
  const updateNode = (id: string, values: Partial<CanvasNode>) => {
    patch("nodes", id, values);
    setNodes((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              position: {
                x: values.x ?? n.position.x,
                y: values.y ?? n.position.y,
              },
              data: {
                ...n.data,
                title: values.title ?? n.data.title,
                text: values.text ?? n.data.text,
                kind: values.kind ?? n.data.kind,
                image: Object.hasOwn(values, "image")
                  ? values.image
                  : n.data.image,
              },
            }
          : n,
      ),
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="ROOM TO THINK SIDEWAYS"
        title="Creative canvas"
        description="Place a thought beside an image. See what connects."
        actions={
          <Button className="s-button primary" onClick={() => setForm("new")}>
            <IconPlus size={16} />
            Add to canvas
          </Button>
        }
      />
      <div className="s-visual-toolbar">
        <span className="s-meta">
          Drag to move · scroll to zoom · shift-drag to select · connect the
          handles
        </span>
        <div className="s-segmented">
          <Button aria-pressed={!list} onClick={() => setList(false)}>
            <IconLayoutGrid size={16} />
            Canvas
          </Button>
          <Button aria-pressed={list} onClick={() => setList(true)}>
            <IconList size={16} />
            Outline
          </Button>
        </div>
      </div>
      <div className="s-visual-layout">
        <section className="s-flow-space" aria-label="Creative planning canvas">
          {list ? (
            <div className="s-canvas-outline">
              {source.map((n) => (
                <Button
                  key={n.id}
                  className={selected === n.id ? "active" : ""}
                  onClick={() => setSelected(n.id)}
                >
                  <Badge>{n.kind}</Badge>
                  <h3>{n.title}</h3>
                  <p>{n.text}</p>
                  <small>
                    Position {Math.round(n.x)}, {Math.round(n.y)}
                  </small>
                </Button>
              ))}
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={canvasNodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connect}
              onNodeClick={(_, n) => setSelected(n.id)}
              onNodeDragStop={(_, n) =>
                patch("nodes", n.id, { x: n.position.x, y: n.position.y })
              }
              fitView
              minZoom={0.2}
              maxZoom={2}
              deleteKeyCode={null}
              selectionOnDrag
              selectionKeyCode="Shift"
              colorMode={data.preferences.theme}
              proOptions={{ hideAttribution: false }}
            >
              <Background gap={22} size={1} color="var(--s-line)" />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                nodeColor="var(--s-accent)"
                maskColor="transparent"
              />
            </ReactFlow>
          )}
        </section>
        <aside className="s-detail-panel s-canvas-inspector">
          {node ? (
            <>
              <Badge>{node.kind}</Badge>
              <h2>{node.title}</h2>
              <p className="s-detail-description">{node.text}</p>
              {node.image && (
                <img
                  src={node.image}
                  alt={node.title}
                  className="s-inspector-image"
                />
              )}
              <div className="s-actions">
                <Button
                  className="s-button quiet"
                  onClick={() => setForm("edit")}
                >
                  <IconPencil size={14} />
                  Edit card
                </Button>
                <IconButton
                  className="s-icon"
                  label="Delete selected card"
                  onClick={() => setDeleting(true)}
                >
                  <IconTrash size={16} />
                </IconButton>
              </div>
              {node.referenceId && (
                <Link
                  href={projectPath(projectId, `world/${node.referenceId}`)}
                  className="s-related-row"
                >
                  Open reference
                  <IconArrowUpRight size={14} />
                </Link>
              )}
              <SectionHeading title="Position" />
              <div className="s-coordinate-fields">
                <label>
                  X
                  <input
                    type="number"
                    value={Math.round(node.x)}
                    min={-100000}
                    max={100000}
                    onChange={(e) =>
                      updateNode(node.id, {
                        x: Math.max(
                          -100000,
                          Math.min(100000, Number(e.target.value)),
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Y
                  <input
                    type="number"
                    value={Math.round(node.y)}
                    min={-100000}
                    max={100000}
                    onChange={(e) =>
                      updateNode(node.id, {
                        y: Math.max(
                          -100000,
                          Math.min(100000, Number(e.target.value)),
                        ),
                      })
                    }
                  />
                </label>
              </div>
              <SectionHeading title="Connections" />
              {data.edges
                .filter((e) => e.source === node.id || e.target === node.id)
                .map((e) => (
                  <div className="s-row s-edge-row" key={e.id}>
                    <span>
                      {
                        source.find(
                          (n) =>
                            n.id ===
                            (e.source === node.id ? e.target : e.source),
                        )?.title
                      }
                    </span>
                    <IconButton
                      label="Remove connection"
                      className="s-icon"
                      onClick={() => {
                        remove("edges", e.id);
                        setEdges((v) => v.filter((r) => r.id !== e.id));
                      }}
                    >
                      <IconTrash size={13} />
                    </IconButton>
                  </div>
                ))}
              <details className="s-inline-disclosure">
                <summary>Add a connection without dragging</summary>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = new FormData(e.currentTarget).get(
                      "target",
                    ) as string;
                    if (target)
                      connect({
                        source: node.id,
                        target,
                        sourceHandle: null,
                        targetHandle: null,
                      });
                  }}
                >
                  <label>
                    <span className="s-sr">Connect to card</span>
                    <select name="target">
                      {source
                        .filter((n) => n.id !== node.id)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button type="submit" className="s-button quiet">
                    Connect
                  </Button>
                </form>
              </details>
            </>
          ) : (
            <>
              <IconNotes size={30} stroke={1.1} />
              <h2>Follow a thought.</h2>
              <p className="s-detail-description">
                Select a card to develop it, connect it, or open its reference.
                Your arrangement stays on this device.
              </p>
              <Button className="s-button quiet" onClick={() => setForm("new")}>
                Add your first thought
              </Button>
            </>
          )}
          <p className="s-local-note">
            Canvas plot cards and layout are mock-only representations. No live
            nested tools or persisted groups are implied.
          </p>
        </aside>
      </div>
      {form && (
        <FormDialog
          title={
            form === "edit"
              ? "Develop this thought"
              : "Add something to the canvas"
          }
          onClose={() => setForm(null)}
          fields={[
            {
              key: "title",
              label: "Title",
              value: form === "edit" ? node?.title : "",
              required: true,
            },
            {
              key: "kind",
              label: "Card type",
              type: "select",
              options: ["note", "image", "entity", "plot"],
              value: form === "edit" ? node?.kind : "note",
            },
            {
              key: "text",
              label: "A thought or description",
              type: "textarea",
              value: form === "edit" ? node?.text : "",
            },
            {
              key: "entity",
              label: "Linked entry, for reference cards",
              type: "select",
              options: ["None", ...entities.map((e) => e.name)],
              value:
                entities.find((e) => e.id === node?.referenceId)?.name ??
                "None",
            },
            {
              key: "image",
              label: "Image, for visual cards",
              type: "select",
              options: ["None", ...media.map((m) => m.title)],
              value: media.find((m) => m.src === node?.image)?.title ?? "None",
            },
          ]}
          onSubmit={(v) => {
            const entity = entities.find((e) => e.name === v.entity);
            const image = media.find((m) => m.title === v.image);
            if (v.kind === "entity" && !entity)
              throw new Error("Choose an entry for this reference card.");
            if (v.kind === "image" && !image)
              throw new Error("Choose an image from the media library.");
            const values = {
              title: v.title.trim(),
              text: v.text,
              kind: v.kind as CanvasNode["kind"],
              referenceId: v.kind === "entity" ? entity?.id : undefined,
              image: v.kind === "image" ? image?.src : undefined,
            };
            if (form === "edit" && node) updateNode(node.id, values);
            else {
              const id = uid("node");
              const value = {
                ...values,
                id,
                projectId,
                x: 100 + nodes.length * 25,
                y: 100 + nodes.length * 25,
              };
              insert("nodes", value);
              setNodes((n) => [
                ...n,
                {
                  id,
                  ariaLabel: values.title,
                  type: "planning",
                  position: { x: value.x, y: value.y },
                  data: values,
                },
              ]);
              setSelected(id);
            }
          }}
        />
      )}
      {deleting && node && (
        <ConfirmDialog
          title={`Remove “${node.title}”?`}
          description="Connections to this card will also be removed. Linked project entries stay intact."
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            remove("nodes", node.id);
            setNodes((v) => v.filter((n) => n.id !== node.id));
            setEdges((v) =>
              v.filter((e) => e.source !== node.id && e.target !== node.id),
            );
            setSelected("");
          }}
        />
      )}
    </>
  );
}
export function RelationshipsPage({ projectId }: { projectId: string }) {
  const { data, insert, remove } = useStudio();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All types");
  const [spacing, setSpacing] = useState(260);
  const [labels, setLabels] = useState("All");
  const [layout, setLayout] = useState("Circle");
  const [selected, setSelected] = useState("");
  const [list, setList] = useState(false);
  const [create, setCreate] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const entities = data.entities.filter((e) => e.projectId === projectId);
  const shown = entities.filter(
    (e) =>
      (kind === "All types" || e.kind === kind) &&
      `${e.name} ${e.summary}`.toLowerCase().includes(query.toLowerCase()),
  );
  const ids = new Set(shown.map((e) => e.id));
  const relationships = data.relationships.filter(
    (r) =>
      r.projectId === projectId && ids.has(r.sourceId) && ids.has(r.targetId),
  );
  const entity = entities.find((e) => e.id === selected);
  const nodes: PlanningNode[] = useMemo(
    () =>
      shown.map((e, n) => ({
        id: e.id,
        ariaLabel: e.name,
        type: "planning",
        position:
          layout === "Circle"
            ? {
                x:
                  Math.cos((n / Math.max(1, shown.length)) * Math.PI * 2) *
                    spacing +
                  spacing,
                y:
                  Math.sin((n / Math.max(1, shown.length)) * Math.PI * 2) *
                    spacing +
                  spacing,
              }
            : { x: (n % 3) * spacing, y: Math.floor(n / 3) * spacing * 0.75 },
        selected: e.id === selected,
        data: {
          title: e.name,
          text: e.summary,
          kind: e.kind,
          showLabel:
            labels === "All" ||
            (labels === "Key entries" && n < 3) ||
            e.id === selected,
        },
      })),
    [shown, layout, spacing, labels, selected],
  );
  const edges = relationships.map((r) => ({
    id: r.id,
    source: r.sourceId,
    target: r.targetId,
    label: r.label,
    type: "smoothstep",
    style: { stroke: "var(--s-muted)", strokeWidth: 1 },
    labelStyle: { fill: "var(--s-secondary)", fontSize: 10 },
    labelBgStyle: { fill: "var(--s-surface)" },
  }));
  return (
    <>
      <PageHeading
        eyebrow="NO ONE EXISTS ALONE"
        title="Relationships"
        description="The threads between people, places, and things."
        actions={
          <Button className="s-button primary" onClick={() => setCreate(true)}>
            <IconPlus size={15} />
            Link entries
          </Button>
        }
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label>
          <span className="s-sr">Filter entity type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["All types", "Character", "Location", "Faction", "Artifact"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
        <div className="s-segmented">
          <Button aria-pressed={!list} onClick={() => setList(false)}>
            Graph
          </Button>
          <Button aria-pressed={list} onClick={() => setList(true)}>
            List
          </Button>
        </div>
        <details className="s-graph-settings">
          <summary>
            <IconSettings2 size={17} />
            Graph settings
          </summary>
          <div>
            <h3>Graph settings</h3>
            <label>
              Names
              <select
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
              >
                <option>All</option>
                <option>Key entries</option>
                <option>On selection</option>
              </select>
            </label>
            <label>
              Spacing <output>{spacing}</output>
              <input
                type="range"
                min={160}
                max={420}
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
              />
            </label>
            <details>
              <summary>More</summary>
              <label>
                Layout
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value)}
                >
                  <option>Circle</option>
                  <option>Grid</option>
                </select>
              </label>
              <Button
                className="s-button quiet"
                onClick={() => {
                  setLabels("All");
                  setSpacing(260);
                  setLayout("Circle");
                }}
              >
                Reset view
              </Button>
              <p className="s-local-note">View settings apply to this visit.</p>
            </details>
          </div>
        </details>
      </CollectionTools>
      <div className="s-visual-layout">
        <section
          className="s-flow-space"
          aria-label="Entity relationship graph"
        >
          {list ? (
            <div className="s-relationship-table">
              {relationships.map((r) => (
                <div key={r.id}>
                  <Button onClick={() => setSelected(r.sourceId)}>
                    {entities.find((e) => e.id === r.sourceId)?.name}
                  </Button>
                  <span>{r.label} →</span>
                  <Button onClick={() => setSelected(r.targetId)}>
                    {entities.find((e) => e.id === r.targetId)?.name}
                  </Button>
                  <IconButton
                    className="s-icon"
                    label="Delete relationship"
                    onClick={() => setDeleteId(r.id)}
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </div>
              ))}
              {!relationships.length && (
                <p className="s-empty-inline">
                  No connections match these filters.
                </p>
              )}
              <SectionHeading title="Entries in this view" />
              {shown.map((e) => (
                <Button
                  className="s-related-row"
                  key={e.id}
                  onClick={() => setSelected(e.id)}
                >
                  {e.name}
                  <Badge>{e.kind}</Badge>
                </Button>
              ))}
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={graphNodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              onNodeClick={(_, n) => setSelected(n.id)}
              onEdgeClick={(_, e) => setSelected(e.source)}
              fitView
              key={`${kind}-${layout}-${spacing}`}
              minZoom={0.25}
              maxZoom={2}
              colorMode={data.preferences.theme}
              deleteKeyCode={null}
            >
              <Background gap={24} size={0.8} color="var(--s-line)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </section>
        <aside className="s-detail-panel">
          {entity ? (
            <>
              <Badge>{entity.kind}</Badge>
              <h2>{entity.name}</h2>
              <p className="s-detail-description">{entity.summary}</p>
              <Link
                href={projectPath(projectId, `world/${entity.id}`)}
                className="s-button quiet"
              >
                Open document
                <IconArrowUpRight size={14} />
              </Link>
              <SectionHeading title="Connections" />
              {data.relationships
                .filter(
                  (r) => r.sourceId === entity.id || r.targetId === entity.id,
                )
                .map((r) => {
                  const e = entities.find(
                    (e) =>
                      e.id ===
                      (r.sourceId === entity.id ? r.targetId : r.sourceId),
                  );
                  return (
                    <div className="s-row s-edge-row" key={r.id}>
                      <Button
                        className="s-text-button"
                        onClick={() => setSelected(e?.id ?? "")}
                      >
                        <IconLink size={14} />
                        <span>
                          {e?.name}
                          <small className="s-meta">{r.label}</small>
                        </span>
                      </Button>
                      <IconButton
                        className="s-icon"
                        label="Remove relationship"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <IconTrash size={13} />
                      </IconButton>
                    </div>
                  );
                })}
            </>
          ) : (
            <>
              <IconLink size={27} stroke={1.2} />
              <h2>Follow a connection.</h2>
              <p className="s-detail-description">
                Select an entry to explore the people and places around it.
                Switch to List for a text-based view.
              </p>
              <p className="s-meta">
                {shown.length} entries · {relationships.length} connections
              </p>
            </>
          )}
        </aside>
      </div>
      {create && (
        <FormDialog
          title="A connection worth exploring"
          onClose={() => setCreate(false)}
          fields={[
            {
              key: "source",
              label: "From entry",
              type: "select",
              options: entities.map((e) => e.name),
              required: true,
            },
            {
              key: "label",
              label: "Relationship",
              value: "Connected to",
              required: true,
            },
            {
              key: "target",
              label: "To entry",
              type: "select",
              options: entities.map((e) => e.name),
              required: true,
            },
          ]}
          onSubmit={(v) => {
            const source = entities.find((e) => e.name === v.source);
            const target = entities.find((e) => e.name === v.target);
            if (!source || !target || source.id === target.id)
              throw new Error("Choose two different entries.");
            insert("relationships", {
              id: uid("relationship"),
              projectId,
              sourceId: source.id,
              targetId: target.id,
              label: v.label.trim(),
            });
          }}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Remove this relationship?"
          description="Both entries will remain in your worldbuilding library."
          onClose={() => setDeleteId("")}
          onConfirm={() => remove("relationships", deleteId)}
        />
      )}
      {!entities.length && (
        <EmptyState
          title="Stories begin with someone"
          description="Create a worldbuilding entry before connecting it to another."
          action={
            <Link
              className="s-button primary"
              href={projectPath(projectId, "world")}
            >
              Open worldbuilding
            </Link>
          }
        />
      )}
    </>
  );
}
