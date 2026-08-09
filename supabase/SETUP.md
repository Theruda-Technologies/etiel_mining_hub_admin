# Supabase setup

## 1. Catalog categories (required for product/service filters)

Run `supabase/migrations/007_catalog_categories_table.sql` in the
[SQL Editor](https://supabase.com/dashboard/project/ccompobtyzjanpcfmhxi/sql/new).

That creates `catalog_categories` (EN/AM labels), seeds the default options,
and drops the old hard-coded category CHECK constraints on `products` /
`services`.

Or with a Postgres URI:

```bash
DATABASE_URL="postgresql://..." npm run apply:categories
```

After the table exists, you can re-seed rows with:

```bash
curl -X POST http://localhost:3000/api/setup/catalog-categories \
  -H "x-setup-secret: $SUPER_ADMIN_SETUP_SECRET"
```

## 2. Optional: profile image column

Avatar URLs are stored in Auth `user_metadata.avatar_url` (works immediately).
To also persist on `profiles`, run `supabase/migrations/003_avatar_and_timeline.sql`
in the [SQL Editor](https://supabase.com/dashboard/project/ccompobtyzjanpcfmhxi/sql/new).

## 3. Bootstrap the Super Admin

Add these to `.env.local` (already templated in `.env.example`):

```bash
SUPER_ADMIN_SETUP_SECRET=etiel-setup-2024
SUPER_ADMIN_EMAIL=superadmin@etiel.mining
SUPER_ADMIN_PASSWORD=SuperAdmin!234
```

Then create/update the Super Admin in Supabase (idempotent):

```bash
npm run setup:superadmin
```

Or via API while the app is running:

```bash
curl -X POST http://localhost:3000/api/setup/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: etiel-setup-2024" \
  -d '{"email":"superadmin@etiel.mining","password":"SuperAdmin!234","fullName":"Super Admin"}'
```

`npm run deploy` also runs `setup:superadmin` after uploading to Cloudflare.

Sign in at `/login` with that email and password.

## 4. Seed demo catalog + orders

```bash
npm run seed
```

This loads products, services, sample orders, profile avatars, pending invites, and order timelines (stored in the private Supabase Storage bucket `order-timeline`).

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | `superadmin@etiel.mining` | `SuperAdmin!234` |
| Demo Admin (invited) | `admin.demo@etiel.mining` | `AdminDemo!234` |

## 5. Invite Admin users

Only the **Super Admin** can invite users (Settings → Administrative Access):

- Choose role: **Administrator** or **Super Admin**
- Account is created in Supabase Auth + `profiles`
- The app emails login **email + password** via Resend (password is not shown in the admin UI)

### Resend (required for invite emails)

Invites are sent with the Resend HTTP API (works on Cloudflare Workers; no SMTP sockets):

1. Sign up at [resend.com](https://resend.com) and create an API key
2. Add to `.env.local`:

```bash
SMTP_PASS=re_your_api_key
SMTP_FROM="Etiel Mining Hub <onboarding@resend.dev>"
```

3. Restart `npm run dev`

`onboarding@resend.dev` works for testing (sends to your Resend account email).
For production, verify your domain in Resend and use an address on that domain.

See [CLOUDFLARE.md](../CLOUDFLARE.md) for Worker secret names when deploying.

### Role differences

| Role | Access |
|------|--------|
| **Super Admin** | Everything + dispatch invitations / revoke pending invites + block Admins |
| **Admin** | Dashboard, Orders, Products, Settings. Can block/unblock other Admins. Cannot invite |

## 6. App URL for invite redirects

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production, set this to your deployed admin URL so invite links land correctly.
