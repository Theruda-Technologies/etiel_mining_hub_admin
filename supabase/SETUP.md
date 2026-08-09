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

This loads products, services, sample orders, profile avatars, pending invites, and order timelines (stored in the private Supabase Storage bucket `order-timeline`).

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | `superadmin@etiel.mining` | `SuperAdmin!234` |
| Demo Admin (invited) | `admin.demo@etiel.mining` | `AdminDemo!234` |

## 4. Invite Admin users

Only the **Super Admin** can invite users (Settings → Administrative Access):

- Choose role: **Administrator** or **Super Admin**
- Account is created in Supabase Auth + `profiles`
- The app emails login **email + password** via SMTP (password is not shown in the admin UI)

### SMTP (required for invite emails)

Supabase’s built-in mailer cannot reliably send customized invites with a
password. Configure SMTP in `.env.local` instead (Resend is simplest):

1. Sign up at [resend.com](https://resend.com) and create an API key
2. Add to `.env.local`:

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_api_key
SMTP_FROM="Etiel Mining Hub <onboarding@resend.dev>"
```

3. Restart `npm run dev`

`onboarding@resend.dev` works for testing (sends to your Resend account email).
For production, verify your domain in Resend and use an address on that domain.

If you prefer to configure SMTP inside the Supabase dashboard instead, use the
same Resend values under **Authentication → SMTP**:

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key (`re_…`) |
| Sender email | `onboarding@resend.dev` (or your verified domain) |

### Role differences

| Role | Access |
|------|--------|
| **Super Admin** | Everything + dispatch invitations / revoke pending invites + block Admins |
| **Admin** | Dashboard, Orders, Products, Settings. Can block/unblock other Admins. Cannot invite |

## 5. App URL for invite redirects

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production, set this to your deployed admin URL so invite links land correctly.
