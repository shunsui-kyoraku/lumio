import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Used by `prisma migrate` / `prisma db push` only.
    // The runtime client connects through the pg adapter in src/lib/db.ts.
    url: env("DATABASE_URL"),
  },
});
