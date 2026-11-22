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
The live project `vigor-talent-network` (Mumbai) has `0001`–`0005` applied. Run
`0006_execution.sql` and `0007_instagram_cache.sql` there before deploying this version (see `supabase/README.md`).

### First admin

1. Sign up on the site (any flow) with your email.
2. Run `npm run make-admin -- you@yourdomain.com` — grants **Super admin** (platform) and
   **Agency owner** (Vigor Marketing). Add the rest of the team from **Admin → Team & roles**,
   and brand clients from **Admin → Brands**.

### Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client — use the **publishable** key (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, use the **secret** key (`sb_secret_…`): writes fetched Instagram metrics and sends email invites from Admin → Team and Admin → Brands |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for invite links (defaults to the Vercel URL) |
| `NEXT_PUBLIC_VIGOR_WHATSAPP` | Optional. Account manager WhatsApp number shown in the brand portal, digits only with country code |
| `COCKPIT_MONTHLY_TARGET` | Optional. Monthly revenue target in rupees for the founder cockpit chart |
| `APIFY_TOKEN` | Apify API token |
| `APIFY_INSTAGRAM_ACTOR` | Defaults to `apify~instagram-profile-scraper` (about $2.60 per 1,000 profiles on Apify's free plan) |
| `INSTAGRAM_REFETCH_HOURS` | Leave unset. Each handle is fetched from Apify once and stored (`instagram_cache`); refreshes reuse it. Set e.g. `168` to allow a fresh fetch once a week |
| `APIFY_SYNC_TEST_ACCOUNTS` | Leave unset. Seeded test creators (emails ending `.test`) are never sent to Apify; set `1` to fetch them anyway |

## Demo mode

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` the app runs on sample data.
`/login` then offers four demo people (creator, agency team, platform admin, brand client), and each one
only opens its own area, the same as a real account. On Vercel, add both keys to the **Preview**
environment as well as Production, or preview deployments fall back to demo mode.

## Before going live

- **Email:** Supabase's built-in mailer sends only ~2 emails/hour. Configure custom SMTP
  (Auth → SMTP) and set Site URL / redirect URLs to your domain, or sign-ups will stall on confirmation.
- Deploy on Vercel (or AWS) with the env vars above; `/crm` and `/admin` can be mapped to
  `crm.` / `admin.` subdomains via middleware later.
