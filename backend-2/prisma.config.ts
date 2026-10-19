import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("FATAL: DATABASE_URL environment variable is missing!");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx ./prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl, // Guaranteed to be a string now!
  },
});