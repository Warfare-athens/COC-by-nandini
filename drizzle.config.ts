import { defineConfig } from "drizzle-kit";
import * as nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres" },
  strict: true,
});
