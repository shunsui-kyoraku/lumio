import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env files itself once a prisma.config.ts exists.
// Reuse Next.js' loader so CLI commands (db push, migrate, studio) see the
// same .env.local / .env the app does.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Only migrate/db push/studio connect through this. Read lazily via
    // process.env — the strict env() helper would make even `prisma generate`
    // (which needs no database) fail when the variable is unset, breaking the
    // very first `npm install` before .env.local exists.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/skilltree",
  },
});
