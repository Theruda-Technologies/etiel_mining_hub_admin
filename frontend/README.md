# Etiel Mining Hub Admin — Frontend

Next.js admin console with a feature-based architecture and Supabase auth.

## Getting started

```bash
cd frontend
cp .env.example .env.local   # if needed — .env.local is already set locally
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Folder structure

```
src/
├── app/                      # Next.js App Router (thin route shells)
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── dashboard/
│       └── users/
├── features/                 # Domain features (components, api, hooks, types)
│   ├── auth/
│   ├── dashboard/
│   └── users/
├── shared/                   # Cross-feature UI, hooks, utils, types
├── lib/supabase/             # Browser, server, and admin clients
└── types/
```

Each feature owns its own `components/`, `api/`, `hooks/`, and `types/`, and re-exports via `index.ts`.
Routes under `app/` only compose feature modules.
