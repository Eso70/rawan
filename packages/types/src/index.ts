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
