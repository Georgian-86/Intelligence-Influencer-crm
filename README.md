# Vigor Talent Network

Centralised influencer & event-talent pool with a campaign CRM for Vigor (and, later, partner agencies).
Product blueprint: [`docs/PRODUCT_BLUEPRINT.md`](docs/PRODUCT_BLUEPRINT.md).

## What's in Phase 1

| Area | Path | Who |
|---|---|---|
| Public site | `/`, `/join`, `/register`, `/brands` | Everyone — Individual (influencer / event talent) or Brand enquiry |
| Talent portal | `/onboarding`, `/dashboard/*` | Registered talent — profile, Instagram metrics, open briefs, express interest, applications |
| Agency CRM | `/crm/*` | Agency roles — talent pool search & CSV export, campaigns, briefs, pipeline, notes, brand enquiries |
| Admin panel | `/admin/*` | Platform roles — screening queue, approve/rank talent, team & roles |

- **Instagram auto-fetch:** a talent pastes their profile URL; the server calls the Apify
  `apify~instagram-profile-scraper` actor (~$0.0026/profile) and stores followers, posts,
  avg likes/comments, **engagement rate** = (avg likes + avg comments) / followers × 100 over the last
  12 non-pinned posts, plus snapshots and recent posts. Instagram images are served via `/api/img`.
- **Brief → intent → pipeline:** published briefs are visible to approved talent who match
  (type, city, category, rank, followers, engagement). Talent express interest; the CRM moves them
  through `interested → shortlisted → contacted → negotiating → confirmed → delivered` (or rejected/dropped).
- **RBAC & multi-tenancy** are enforced in Postgres row-level security
  (`supabase/migrations/0001_init.sql`): roles map to permissions in `role_permissions`; agency data is
  scoped by `org_id`; talent contact details unlock for an agency only once the talent responds to,
  or is added to, one of its briefs. `usage_events` logs briefs published, intents, confirmations and
  exports for future royalty reporting.

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS) · Apify.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL/keys and APIFY_TOKEN
npm run dev
```

Apply the SQL files in `supabase/migrations/` in order (Supabase SQL editor or `supabase db push`).
The live project `vigor-talent-network` (Mumbai) already has all migrations applied.

`0005_v2_onboarding.sql` adds the college directory (`colleges`, ~190 seeded Indian colleges) and
`talent_education`. The seed is generated from `lib/colleges-data.ts`: edit that file, then run
`node scripts/seed-colleges.mjs` to rewrite the seed block. Until 0005 is applied, `/api/colleges`
serves the same list from code, so onboarding never blocks.

### Google sign-in

`/login` and `/register` offer **Continue with Google** (Supabase OAuth, PKCE). The email flow stays as a fallback.

1. **Google Cloud Console** → APIs & Services → Credentials → *Create credentials → OAuth client ID*
   (type **Web application**). Configure the OAuth consent screen first if asked (app name, support email,
   scopes `email`, `profile`, `openid`).
   - **Authorized JavaScript origins:** your site URL, e.g. `https://vigor-talent-network.vercel.app`
     (and `http://localhost:3000` for local dev).
   - **Authorized redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback`
     (shown in Supabase under Auth → Sign In / Providers → Google as "Callback URL").
2. **Supabase dashboard** → Authentication → Sign In / Providers → **Google** → enable, paste the
   **Client ID** and **Client secret**, save.
3. **Supabase dashboard** → Authentication → URL Configuration:
   - **Site URL:** your production URL.
   - **Redirect URLs:** add `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback`
     (wildcards such as `https://*-yourteam.vercel.app/auth/callback` work for preview deploys).

The app sends users back to `/auth/callback`, which exchanges the code for a session and routes first-time
users (no talent profile, no team membership) to `/onboarding`. Google's `full_name` pre-fills the name step.

### Onboarding notes

- City is pre-filled from `x-vercel-ip-city` (Vercel) or `cf-ipcity` (Cloudflare) when present.
- The Instagram preview calls Apify via `/api/ig-preview` (signed-in users only, throttled per user,
  25 s timeout). If Apify is slow, the account is private or `APIFY_TOKEN` is missing, onboarding continues
  and the account syncs in the background after sign-up.

### First admin

1. Sign up on the site (any flow) with your email.
2. Run `npm run make-admin -- you@yourdomain.com` — grants **Super admin** (platform) and
   **Agency owner** (Vigor Marketing). Add the rest of the team from **Admin → Team & roles**.

### Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client — use the **publishable** key (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, use the **secret** key (`sb_secret_…`): writes fetched Instagram metrics |
| `APIFY_TOKEN` | Apify API token |
| `APIFY_INSTAGRAM_ACTOR` | Defaults to `apify~instagram-profile-scraper` |

## Before going live

- **Email:** Supabase's built-in mailer sends only ~2 emails/hour. Configure custom SMTP
  (Auth → SMTP) and set Site URL / redirect URLs to your domain, or sign-ups will stall on confirmation.
- Deploy on Vercel (or AWS) with the env vars above; `/crm` and `/admin` can be mapped to
  `crm.` / `admin.` subdomains via middleware later.
