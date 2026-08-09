#!/usr/bin/env node
/**
 * Ensure Super Admin exists in Supabase Auth (idempotent).
 * Runs against Supabase directly — safe after Cloudflare/Vercel deploy.
 *
 * Usage:
 *   npm run setup:superadmin
 *
 * Requires in .env.local (or process env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 *   SUPER_ADMIN_SETUP_SECRET (optional; unused here)
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Prefer .env.local over ambient shell env (e.g. stale SUPER_ADMIN_EMAIL).
    process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email =
  process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ||
  "etielmining@gmail.com";
const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin!234";
const fullName = process.env.SUPER_ADMIN_FULL_NAME?.trim() || "Super Admin";

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("SUPER_ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listError } = await admin.auth.admin.listUsers({
  perPage: 200,
});
if (listError) {
  console.error(listError.message);
  process.exit(1);
}

let user = listed.users.find((u) => u.email?.toLowerCase() === email);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "super_admin" },
    user_metadata: { full_name: fullName, status: "active" },
  });
  if (error || !data.user) {
    console.error("createUser failed:", error?.message);
    process.exit(1);
  }
  user = data.user;
  console.log("Created Super Admin:", email);
} else {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    app_metadata: { ...user.app_metadata, role: "super_admin" },
    user_metadata: {
      ...user.user_metadata,
      full_name: fullName,
      status: "active",
    },
  });
  if (error) {
    console.error("updateUser failed:", error.message);
    process.exit(1);
  }
  console.log("Updated Super Admin:", email);
}

const { error: profileError } = await admin.from("profiles").upsert({
  id: user.id,
  email,
  full_name: fullName,
  role: "admin",
  updated_at: new Date().toISOString(),
});

if (profileError) {
  console.warn("profiles upsert warning:", profileError.message);
}

// Keep a single Super Admin: demote anyone else with that role.
for (const other of listed.users) {
  if (other.id === user.id) continue;
  if (other.app_metadata?.role !== "super_admin") continue;

  const { error } = await admin.auth.admin.updateUserById(other.id, {
    app_metadata: { ...other.app_metadata, role: "admin" },
  });
  if (error) {
    console.warn(`Could not demote ${other.email}:`, error.message);
    continue;
  }
  await admin
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("id", other.id);
  console.log("Demoted former Super Admin:", other.email);
}

console.log("Super Admin ready:", {
  id: user.id,
  email,
  role: "super_admin",
});
