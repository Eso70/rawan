export * from "./ai.js";
export * from "./http.js";
export type UserRole = "ADMIN" | "AUTHOR";
export type SortOrder = "asc" | "desc";
export type MediaResourceKind =
  "PROJECT" | "NOTE" | "CHARACTER" | "PLACE" | "FACTION" | "ARTIFACT";
export interface ApiMedia {
  id: string;
  projectId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  updatedAt: string;
}
export interface ApiMediaAttachment {
  id: string;
  media: ApiMedia;
  resource: { kind: MediaResourceKind; id: string };
  role: string;
  createdAt: string;
}
export interface ApiPage<T> {
  items: T[];
  nextOffset: number | null;
}
export type ApiSceneSummary = Omit<ApiScene, "content">;
export type SearchResultKind =
  | "PROJECT"
  | "BOOK"
  | "CHAPTER"
  | "SCENE"
  | "CHARACTER"
  | "PLACE"
  | "FACTION"
  | "ARTIFACT"
  | "TIMELINE_EVENT"
  | "PLOT"
  | "PLOT_POINT"
  | "NOTE";
export interface ApiSearchResult {
  kind: SearchResultKind;
  id: string;
  projectId: string;
  title: string;
  snippet: string;
  updatedAt: string;
}

/** JSON representation of a public user; timestamps are ISO 8601 strings. */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: ApiUser;
}

/** JSON contracts for the manuscript hierarchy. Timestamps use ISO 8601 strings. */
export interface ApiProject {
  id: string;
  authorId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBook {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiChapter {
  id: string;
  bookId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiScene {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  position: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type WorldKind = "characters" | "places" | "factions" | "artifacts";
export interface ApiWorldEntity {
  id: string;
  projectId: string;
  name: string;
  summary: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ApiCharacter extends ApiWorldEntity {
  role: string | null;
  status: string | null;
}
export interface ApiPlace extends ApiWorldEntity {
  type: string | null;
}
export interface ApiFaction extends ApiWorldEntity {
  type: string | null;
}
export interface ApiArtifact extends ApiWorldEntity {
  type: string | null;
}

export type WorldEntityKind = "CHARACTER" | "PLACE" | "FACTION" | "ARTIFACT";
export type RelationshipDirection = "DIRECTIONAL" | "SYMMETRIC";
export interface WorldEntityReference {
  id: string;
  kind: WorldEntityKind;
}
export interface ApiRelationship {
  id: string;
  projectId: string;
  source: WorldEntityReference & { name: string };
  target: WorldEntityReference & { name: string };
  typeKey: string;
  label: string;
  description: string | null;
  direction: RelationshipDirection;
  createdAt: string;
  updatedAt: string;
}
export interface RelationshipInput {
  source: WorldEntityReference;
  target: WorldEntityReference;
  typeKey: string;
  label: string;
  direction?: RelationshipDirection;
  description?: string | null;
}

/** entityKind and entityId must be supplied together. */
export interface RelationshipFilters {
  entityKind?: WorldEntityKind;
  entityId?: string;
  typeKey?: string;
}
/** Fictional chronology is a precise decimal string, never a JS Date or number. */
export type Chronology = string;
export interface ApiTimeline {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ApiEra {
  id: string;
  timelineId: string;
  name: string;
  description: string | null;
  position: number;
  start: Chronology | null;
  end: Chronology | null;
  createdAt: string;
  updatedAt: string;
}
export interface ApiEventEntity {
  associationId: string;
  entity: WorldEntityReference & { name: string };
  role: string | null;
}
export interface ApiEventSummary {
  id: string;
  projectId: string;
  timelineId: string;
  title: string;
  summary: string | null;
  start: Chronology;
  end: Chronology | null;
  dateLabel: string | null;
  position: number;
  era: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}
export interface ApiTimelineEvent extends ApiEventSummary {
  description: string | null;
  entities: ApiEventEntity[];
}
export type ApiEventPage = ApiPage<ApiEventSummary>;

export type PlotPointStatus = "PLANNED" | "IN_PROGRESS" | "RESOLVED";
export interface ApiPlotSummary {
  id: string;
  projectId: string;
  title: string;
  category: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}
export interface ApiPlot extends ApiPlotSummary {
  description: string | null;
}
export interface ApiPlotPointSummary {
  id: string;
  projectId: string;
  plotId: string;
  title: string;
  position: number;
  status: PlotPointStatus;
  createdAt: string;
  updatedAt: string;
}
export interface ApiPlotPointScene {
  associationId: string;
  scene: {
    id: string;
    title: string;
    chapter: { id: string; title: string; book: { id: string; title: string } };
  };
}
export interface ApiPlotPointEvent {
  associationId: string;
  event: {
    id: string;
    title: string;
    timelineId: string;
    start: Chronology;
    end: Chronology | null;
    dateLabel: string | null;
  };
}
export interface ApiPlotPointEntity {
  associationId: string;
  entity: WorldEntityReference & { name: string };
  role: string | null;
}
export interface ApiPlotPoint extends ApiPlotPointSummary {
  description: string | null;
  scenes: ApiPlotPointScene[];
  events: ApiPlotPointEvent[];
  entities: ApiPlotPointEntity[];
}
export type ApiPlotPage = ApiPage<ApiPlotSummary>;
export type ApiPlotPointPage = ApiPage<ApiPlotPointSummary>;

export type TagResourceKind =
  | "NOTE"
  | "CHARACTER"
  | "PLACE"
  | "FACTION"
  | "ARTIFACT"
  | "SCENE"
  | "TIMELINE_EVENT"
  | "PLOT_POINT";
export interface ApiNoteSummary {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface ApiNote extends ApiNoteSummary {
  content: string;
}
export interface ApiTag {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface ApiTagAssignment {
  assignmentId: string;
  tag: { id: string; name: string };
  resource: { kind: TagResourceKind; id: string; label: string };
}
export type ApiNotePage = ApiPage<ApiNoteSummary>;
export type ApiTagPage = ApiPage<ApiTag>;
export type ApiTagAssignmentPage = ApiPage<ApiTagAssignment>;
