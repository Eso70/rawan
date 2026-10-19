/** Mock domain only. These are not backend request/response contracts. */
export type EntityKind = "Character" | "Location" | "Faction" | "Artifact";
export type WorkKind =
  "Novel" | "Non-fiction" | "Short story" | "Essay" | "Comic";
export type Status = "Drafting" | "Planning" | "Revising" | "Complete";
export type Project = {
  id: string;
  title: string;
  description: string;
  kind: WorkKind;
  status: Status;
  cover: string;
  color: string;
  pinned: boolean;
  updatedAt: string;
  goal: number;
};
export type Work = {
  id: string;
  projectId: string;
  title: string;
  kind: WorkKind;
  description: string;
  status: Status;
  cover: string;
  updatedAt: string;
};
export type Chapter = {
  id: string;
  workId: string;
  title: string;
  position: number;
  status: Status;
};
export type Scene = {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  updatedAt: string;
};
export type Entity = {
  id: string;
  projectId: string;
  kind: EntityKind;
  name: string;
  summary: string;
  description: string;
  aliases: string[];
  tags: string[];
  properties: { id: string; label: string; value: string; entityId?: string }[];
  image: string;
  updatedAt: string;
};
export type Era = {
  id: string;
  projectId: string;
  title: string;
  description: string;
};
export type TimelineEvent = {
  id: string;
  projectId: string;
  eraId: string;
  title: string;
  order: number;
  date: string;
  category: string;
  description: string;
  entityIds: string[];
};
export type Relationship = {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  label: string;
};
export type PlotArc = {
  id: string;
  projectId: string;
  title: string;
  description: string;
};
export type PlotPoint = {
  id: string;
  projectId: string;
  arcId: string;
  title: string;
  description: string;
  position: number;
  status: Status;
  chapterId: string;
};
export type Note = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
  entityIds: string[];
};
export type Media = {
  id: string;
  projectId: string;
  title: string;
  src: string;
  category: string;
  description: string;
};
export type CanvasNode = {
  id: string;
  projectId: string;
  kind: "note" | "image" | "entity" | "plot";
  title: string;
  text: string;
  x: number;
  y: number;
  referenceId?: string;
  image?: string;
};
export type CanvasEdge = {
  id: string;
  projectId: string;
  source: string;
  target: string;
  label: string;
};
export type Activity = {
  id: string;
  projectId: string;
  label: string;
  href: string;
  at: string;
};
export type Preferences = {
  theme: "dark" | "light";
  font: "serif" | "sans";
  fontSize: number;
  lineHeight: number;
  editorWidth: number;
  reducedMotion: boolean;
  compact: boolean;
  authorName: string;
};
export type Feedback = {
  id: string;
  category: string;
  message: string;
  at: string;
};
export type StudioData = {
  version: 1;
  projects: Project[];
  works: Work[];
  chapters: Chapter[];
  scenes: Scene[];
  entities: Entity[];
  eras: Era[];
  events: TimelineEvent[];
  relationships: Relationship[];
  arcs: PlotArc[];
  points: PlotPoint[];
  notes: Note[];
  media: Media[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  activity: Activity[];
  feedback: Feedback[];
  preferences: Preferences;
  lastSceneId: string;
  recentSearches: string[];
  tourCompleted: boolean;
};
export type Table = {
  [K in keyof StudioData]: StudioData[K] extends { id: string }[] ? K : never;
}[keyof StudioData];
export type Row<K extends Table> = StudioData[K][number];
export type SearchResult = {
  id: string;
  title: string;
  kind: string;
  context: string;
  href: string;
};
