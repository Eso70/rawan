export type UserRole = "ADMIN" | "AUTHOR";

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
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
  direction: RelationshipDirection;
  description?: string | null;
}
