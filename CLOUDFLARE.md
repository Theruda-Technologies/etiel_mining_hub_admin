# Cloudflare Workers (OpenNext)

Deploy this Next.js admin app to Cloudflare Workers with OpenNext.

## Auth note

Next.js 16 `proxy.ts` (Node middleware) is not supported by OpenNext Cloudflare yet.
Auth redirects live in server layouts instead (`(dashboard)/layout.tsx`, login page, `/`).

## One-time setup

1. Install deps (already in package.json): `@opennextjs/cloudflare`, `wrangler`
2. Log in to Cloudflare:

```bash
npx wrangler login
```

3. Build and deploy:

```bash
npm run deploy
```

## Environment variables

Set these on the Worker (Dashboard → Workers → etiel-mining-hub-admin → Settings → Variables and Secrets).

**Variables** (plain text): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `SMTP_FROM`

**Secrets** (CLI examples):

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SUPER_ADMIN_SETUP_SECRET
npx wrangler secret put SMTP_PASS
```

Required:

| Name | Type |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable |
| `NEXT_PUBLIC_APP_URL` | Variable (e.g. `https://etiel-mining-hub-admin.<subdomain>.workers.dev`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret |
| `SUPER_ADMIN_SETUP_SECRET` | Secret |
| `SMTP_FROM` | Variable (e.g. `Etiel Mining Hub <onboarding@resend.dev>`) |
| `SMTP_PASS` or `RESEND_API_KEY` | Secret (Resend API key) |

After setting `NEXT_PUBLIC_*` vars, redeploy so they are baked into the client bundle:

```bash
npm run deploy
```

## Local Workers preview

```bash
npm run preview
```

Continue using `npm run dev` for day-to-day Next.js development.

## Post-deploy checks

1. Super Admin is ensured automatically at the end of `npm run deploy` (via `scripts/ensure-super-admin.mjs`).
   To run it alone: `npm run setup:superadmin`
2. Open the Workers URL `/login` with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env.local`
3. Add the Workers URL to Supabase Auth → URL configuration (Site URL + Redirect URLs)
4. Send a test invite (uses Resend HTTP API, not SMTP sockets)
5. Run `supabase/migrations/007_catalog_categories_table.sql` in the SQL Editor if categories are still on fallbacks

### Manual bootstrap via API (optional)

```bash
curl -X POST https://etiel-mining-hub-admin.herieshetu.workers.dev/api/setup/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: $SUPER_ADMIN_SETUP_SECRET" \
  -d '{}'
```

Requires Worker secrets: `SUPER_ADMIN_SETUP_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`.

## Workers Builds (Git, optional)

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`
- Configure the same env vars in the Cloudflare project settings
