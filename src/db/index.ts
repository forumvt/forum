import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não está definida. Defina no .env local ou nas variáveis de ambiente do deploy (incluindo a fase de build, ex.: Vercel).",
  );
}

const globalForDb = globalThis as unknown as { forumvtPgPool?: Pool };

const pool =
  process.env.NODE_ENV !== "production"
    ? (globalForDb.forumvtPgPool ??= new Pool({ connectionString }))
    : new Pool({ connectionString });

export const db = drizzle(pool, { schema });