import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrate/CLI için DB url'i burada (dotenv ile .env yüklenir).
// Runtime client ise src/lib/prisma.ts'te driver adapter kullanır.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
