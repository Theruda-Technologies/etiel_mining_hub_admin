#!/usr/bin/env node
/**
 * Apply catalog_categories migration.
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/apply-categories.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Set DATABASE_URL to your Supabase Postgres connection string, then re-run.",
  );
  console.error(
    "Dashboard → Project Settings → Database → Connection string (URI)",
  );
  process.exit(1);
}

const sql = readFileSync(
  path.join(__dirname, "../supabase/migrations/007_catalog_categories_table.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  const { rows } = await client.query(
    "select kind, value, label from catalog_categories order by kind, sort_order",
  );
  console.log("Applied catalog_categories. Rows:");
  console.table(rows);
} finally {
  await client.end();
}
