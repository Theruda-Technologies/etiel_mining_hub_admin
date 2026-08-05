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
- Supabase Auth sends the invite email (`inviteUserByEmail`)
- The invite email includes the **temporary password** when the Invite template
  uses `{{ .Data.temporary_password }}` (copy from `supabase/email-templates/invite-user.html`)
- A temporary password is also shown once in the UI as a backup login

### Invite email template (required for password in email)

1. Open [Authentication → Emails → Invite user](https://supabase.com/dashboard/project/ccompobtyzjanpcfmhxi/auth/templates)
2. Set subject to: `Your Etiel Mining Hub access credentials`
3. Paste the HTML from `supabase/email-templates/invite-user.html`
4. Save

Key template variables:

- `{{ .Data.temporary_password }}` — temporary access code
- `{{ .Data.full_name }}` — invitee name
- `{{ .Data.role_label }}` — Admin / Super Admin
- `{{ .Data.login_url }}` — login page URL
- `{{ .ConfirmationURL }}` — accept-invite link
- `{{ .Email }}` — invitee email

Invite emails use your Supabase project email settings
(Authentication → Emails). On the free tier, Supabase’s built-in mailer works
with rate limits. For production, set custom SMTP under
Project Settings → Authentication → SMTP Settings.

### Role differences

| Role | Access |
|------|--------|
| **Super Admin** | Everything + dispatch invitations / revoke pending invites |
| **Admin** | Dashboard, Orders, Products, Settings (password). Cannot invite |

## 5. App URL for invite redirects

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production, set this to your deployed admin URL so invite links land correctly.
