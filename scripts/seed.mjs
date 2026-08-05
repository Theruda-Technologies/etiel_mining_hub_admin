/**
 * Seed live Supabase with demo catalog + orders + profile avatars.
 * Usage: npm run seed
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
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SUPER_EMAIL =
  process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || "superadmin@etiel.mining";
const ADMIN_EMAIL = "admin.demo@etiel.mining";
const ADMIN_PASSWORD = "AdminDemo!234";

const AVATAR_SUPER =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face";
const AVATAR_ADMIN =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face";

const PRODUCTS = [
  {
    sku: "MD-X9-882",
    name: "MAGNETAR Pulse X9",
    slug: "magnetar-pulse-x9",
    description:
      "Heavy-duty pulse induction metal detector for deep mineral prospecting.",
    category: "metal_detectors",
    price: 0,
    specs: [
      { key: "Depth Rating", value: "12 m" },
      { key: "Frequency", value: "Multi-pulse" },
    ],
    image_paths: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=480&h=480&fit=crop",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    sku: "MD-TITAN-4",
    name: "Titan Coil Pro",
    slug: "titan-coil-pro",
    description: "Compact VLF detector optimized for gold nugget hunting.",
    category: "metal_detectors",
    price: 0,
    specs: [
      { key: "Coil Size", value: "11 in" },
      { key: "Weight", value: "1.4 kg" },
    ],
    image_paths: [
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    sku: "GS-3D-220",
    name: "StrataScan 3D",
    slug: "stratascan-3d",
    description: "Ground scanner for cavity and anomaly mapping.",
    category: "ground_scanners",
    price: 0,
    specs: [
      { key: "Scan Depth", value: "25 m" },
      { key: "Modes", value: "3D / Live" },
    ],
    image_paths: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=480&h=480&fit=crop",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 3,
  },
  {
    sku: "DR-CORE-12",
    name: "CoreDrill X12",
    slug: "coredrill-x12",
    description: "Portable core drilling unit for sample extraction.",
    category: "drilling",
    price: 0,
    specs: [
      { key: "Max Depth", value: "40 m" },
      { key: "Bit Size", value: "76 mm" },
    ],
    image_paths: [
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 4,
  },
  {
    sku: "EX-HAUL-90",
    name: "Hauler Excavator 90",
    slug: "hauler-excavator-90",
    description: "Mid-size excavator for site clearing and trench work.",
    category: "excavators",
    price: 0,
    specs: [{ key: "Bucket", value: "0.9 m³" }],
    image_paths: [
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 5,
  },
  {
    sku: "MS-KIT-01",
    name: "Field Supplies Kit",
    slug: "field-supplies-kit",
    description: "Consumables and tools for multi-day surveys.",
    category: "mining_supplies",
    price: 0,
    specs: [{ key: "Contents", value: "50 pcs" }],
    image_paths: [
      "https://images.unsplash.com/photo-1581093458791-9f3c3250a5b1?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 6,
  },
  {
    sku: "GS-DRAFT-01",
    name: "Echo Range Lite",
    slug: "echo-range-lite",
    description: "Entry ground scanner (draft catalog listing).",
    category: "ground_scanners",
    price: 0,
    specs: [{ key: "Status", value: "Draft" }],
    image_paths: [],
    is_active: false,
    sort_order: 7,
  },
];

const SERVICES = [
  {
    sku: "SVC-FIELD-24",
    name: "24/7 Field Support",
    slug: "field-support-247",
    description: "On-call technician support for active deployments.",
    category: "field_support",
    price: 0,
    specs: [{ key: "icon", value: "headset" }],
    image_paths: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    sku: "SVC-CERT-OP",
    name: "Operator Certification",
    slug: "operator-certification",
    description: "Three-day certification course for detector operators.",
    category: "training",
    price: 0,
    specs: [{ key: "icon", value: "gradcap" }],
    image_paths: [
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=480&h=480&fit=crop",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    sku: "SVC-ASM-ON",
    name: "On-Site Assembly",
    slug: "on-site-assembly",
    description: "Technician team for equipment assembly at the site.",
    category: "on_site_assembly",
    price: 0,
    specs: [{ key: "icon", value: "headset" }],
    image_paths: [
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=480&h=480&fit=crop",
    ],
    is_active: true,
    sort_order: 3,
  },
  {
    sku: "SVC-FIN-LEASE",
    name: "Equipment Financing",
    slug: "equipment-financing",
    description: "Lease and financing options for catalog equipment.",
    category: "financing",
    price: 0,
    specs: [{ key: "icon", value: "gradcap" }],
    image_paths: [],
    is_active: true,
    sort_order: 4,
  },
];

async function ensureUser({
  email,
  password,
  fullName,
  role,
  avatarUrl,
  status,
}) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = listed.users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: {
        full_name: fullName,
        avatar_url: avatarUrl,
        status,
      },
    });
    if (error || !data.user) {
      throw new Error(`createUser ${email}: ${error?.message}`);
    }
    user = data.user;
    console.log("created user", email, user.id);
  } else {
    await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: { ...user.app_metadata, role },
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        avatar_url: avatarUrl,
        status,
      },
    });
    console.log("updated user", email, user.id);
  }

  await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
    role: role === "super_admin" ? "admin" : role,
    updated_at: new Date().toISOString(),
  });

  await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

  return user;
}

async function upsertBySku(table, rows) {
  const ids = [];
  for (const row of rows) {
    const { data: existing } = await admin
      .from(table)
      .select("id")
      .or(`sku.eq.${row.sku},slug.eq.${row.slug}`)
      .maybeSingle();

    if (existing) {
      const { data, error } = await admin
        .from(table)
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw new Error(`${table} update ${row.sku}: ${error.message}`);
      ids.push(data.id);
      console.log("updated", table, row.sku);
    } else {
      const { data, error } = await admin
        .from(table)
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(`${table} insert ${row.sku}: ${error.message}`);
      ids.push(data.id);
      console.log("inserted", table, row.sku);
    }
  }
  return ids;
}

async function seedOrders(productIds, serviceIds) {
  const { data: old } = await admin
    .from("orders")
    .select("id, order_number")
    .like("order_number", "ORD-SEED-%");

  for (const order of old ?? []) {
    await admin.from("orders").delete().eq("id", order.id);
  }

  await admin.from("orders").delete().eq("order_number", "ORD-20260805-0001");

  const seeds = [
    {
      order_number: "ORD-SEED-9001",
      customer_name: "Marcus Vance",
      customer_phone: "+251911000001",
      customer_email: "m.vance@apexglobal.ext",
      shipping_address: "Apex Global Extraction — Site 4, Newman WA 6753",
      notes: "Priority shipment to Pilbara access road.",
      internal_notes: "VIP account",
      status: "confirmed",
      items: [
        {
          item_type: "product",
          product_id: productIds[0],
          name_snapshot: "MAGNETAR Pulse X9",
          sku_snapshot: "MD-X9-882",
          unit_price_snapshot: 84500,
          quantity: 1,
        },
        {
          item_type: "product",
          product_id: productIds[1],
          name_snapshot: "Titan Coil Pro",
          sku_snapshot: "MD-TITAN-4",
          unit_price_snapshot: 12800,
          quantity: 2,
        },
      ],
    },
    {
      order_number: "ORD-SEED-9002",
      customer_name: "Sara Bekele",
      customer_phone: "+251911000002",
      customer_email: "sara@northern.resources",
      shipping_address: "Northern Resources Depot, Addis Ababa Industrial Zone",
      notes: "Awaiting wire confirmation.",
      internal_notes: "",
      status: "pending",
      items: [
        {
          item_type: "product",
          product_id: productIds[2],
          name_snapshot: "StrataScan 3D",
          sku_snapshot: "GS-3D-220",
          unit_price_snapshot: 64200,
          quantity: 1,
        },
      ],
    },
    {
      order_number: "ORD-SEED-9003",
      customer_name: "Global Extractors Ltd",
      customer_phone: "+251911000003",
      customer_email: "ops@globalextractors.com",
      shipping_address: "Global Extractors Yard, Dire Dawa Logistics Hub",
      notes: "Include operator certification seats.",
      internal_notes: "Bundle deal",
      status: "processing",
      items: [
        {
          item_type: "product",
          product_id: productIds[0],
          name_snapshot: "MAGNETAR Pulse X9",
          sku_snapshot: "MD-X9-882",
          unit_price_snapshot: 84500,
          quantity: 1,
        },
        {
          item_type: "service",
          service_id: serviceIds[1],
          name_snapshot: "Operator Certification",
          sku_snapshot: "SVC-CERT-OP",
          unit_price_snapshot: 1500,
          quantity: 4,
        },
      ],
    },
    {
      order_number: "ORD-SEED-9004",
      customer_name: "Red Ridge Mining",
      customer_phone: "+251911000004",
      customer_email: "buyer@redridge.mine",
      shipping_address: "Red Ridge Camp, Oromia Exploration Block C",
      notes: "Customer cancelled after site survey delay.",
      internal_notes: "Refund pending",
      status: "cancelled",
      items: [
        {
          item_type: "service",
          service_id: serviceIds[0],
          name_snapshot: "24/7 Field Support",
          sku_snapshot: "SVC-FIELD-24",
          unit_price_snapshot: 250,
          quantity: 40,
        },
      ],
    },
  ];

  for (const seed of seeds) {
    const { items, ...order } = seed;
    const { data, error } = await admin
      .from("orders")
      .insert(order)
      .select("id, order_number, status, created_at")
      .single();
    if (error) throw new Error(`order ${order.order_number}: ${error.message}`);

    const rows = items.map((item) => ({
      order_id: data.id,
      item_type: item.item_type,
      product_id: item.product_id ?? null,
      service_id: item.service_id ?? null,
      name_snapshot: item.name_snapshot,
      sku_snapshot: item.sku_snapshot,
      unit_price_snapshot: item.unit_price_snapshot,
      quantity: item.quantity,
    }));

    const { error: itemError } = await admin.from("order_items").insert(rows);
    if (itemError) {
      throw new Error(`items ${order.order_number}: ${itemError.message}`);
    }

    console.log("seeded order", data.order_number);
  }
}

async function main() {
  console.log("Seeding Supabase…");

  await ensureUser({
    email: SUPER_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin!234",
    fullName: "Super Admin",
    role: "super_admin",
    avatarUrl: AVATAR_SUPER,
    status: "active",
  });

  await ensureUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: "Demo Admin",
    role: "admin",
    avatarUrl: AVATAR_ADMIN,
    status: "invited",
  });

  await ensureUser({
    email: "s.connor@etiel.com",
    password: "InviteTemp!234",
    fullName: "Sarah Connor",
    role: "admin",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face",
    status: "invited",
  });

  await ensureUser({
    email: "m.dyson@etiel.com",
    password: "InviteTemp!234",
    fullName: "Miles Dyson",
    role: "admin",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face",
    status: "invited",
  });

  const productIds = await upsertBySku("products", PRODUCTS);
  const serviceIds = await upsertBySku("services", SERVICES);
  await seedOrders(productIds, serviceIds);

  console.log("\nSeed complete.");
  console.log(
    "Super Admin:",
    SUPER_EMAIL,
    "/",
    process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin!234",
  );
  console.log("Demo Admin (invited):", ADMIN_EMAIL, "/", ADMIN_PASSWORD);
  console.log(
    "Optional: run supabase/migrations/003_avatar_and_timeline.sql for avatar_url column.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
