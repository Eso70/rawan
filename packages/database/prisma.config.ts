// CLI configuration only; the API validates and supplies its own connection URL.
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: fileURLToPath(new URL("./.env.local", import.meta.url)),
    quiet: true,
  });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
