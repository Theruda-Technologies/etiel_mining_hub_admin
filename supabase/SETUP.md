# Supabase setup

## 1. Optional: profile image column

Avatar URLs are stored in Auth `user_metadata.avatar_url` (works immediately).
To also persist on `profiles`, run `supabase/migrations/003_avatar_and_timeline.sql`
in the [SQL Editor](https://supabase.com/dashboard/project/ccompobtyzjanpcfmhxi/sql/new).

## 2. Bootstrap the Super Admin

Add these to `.env.local` (already templated in `.env.example`):

```bash
SUPER_ADMIN_SETUP_SECRET=etiel-setup-2024
SUPER_ADMIN_EMAIL=superadmin@etiel.mining
SUPER_ADMIN_PASSWORD=SuperAdmin!234
```

Then call:

```bash
curl -X POST http://localhost:3000/api/setup/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: etiel-setup-2024" \
  -d '{"email":"superadmin@etiel.mining","password":"SuperAdmin!234","fullName":"Super Admin"}'
```

Sign in at `/login` with that email and password.

## 3. Seed demo catalog + orders

```bash
npm run seed
```

This loads products, services, sample orders, profile avatars, and a demo Admin invite:

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | `superadmin@etiel.mining` | `SuperAdmin!234` |
| Demo Admin (invited) | `admin.demo@etiel.mining` | `AdminDemo!234` |

## 4. Invite Admin users

Only the **Super Admin** can invite users (Settings → Administrative Access):

- Choose role: **Administrator** or **Super Admin**
- Set a temporary access code (or leave blank to auto-generate)
- Account is created in Supabase Auth + `profiles`
- If `RESEND_API_KEY` is set, an invite email is sent with the password
- If not, the temporary password is shown once in the UI

### Role differences

| Role | Access |
|------|--------|
| **Super Admin** | Everything + dispatch invitations / revoke pending invites |
| **Admin** | Dashboard, Orders, Products, Settings (password). Cannot invite |

## 5. Optional email delivery

```bash
RESEND_API_KEY=re_xxx
INVITE_FROM_EMAIL=Etiel Mining Hub <onboarding@resend.dev>
```
