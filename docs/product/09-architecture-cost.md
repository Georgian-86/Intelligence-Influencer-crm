# 09 · Architecture & Cost (Cloudflare free tiers + Supabase)

> Supersedes the cost sections of `04-architecture-and-integrations.md` (keeps its decisions: D1, D7, D8, D9).
> Prices are list prices as understood in Nov 2026 and **must be re-checked** on each vendor's pricing page
> before budgeting. FX assumption: **$1 ≈ ₹88**.

## 1. Architecture

```
                         Cloudflare edge (DNS · CDN · WAF · Turnstile · Web Analytics)
                                              │
     ┌──────────────── Workers (Next.js via OpenNext, Static Assets) ────────────────┐
     │ public SSR/ISR pages · talent PWA · /crm · /admin · route handlers · webhooks │
     └───┬───────────────┬────────────────┬───────────────┬──────────────┬──────────┘
         │               │                │               │              │
   Supabase (Mumbai)   R2 buckets      Queues (+DLQ)     KV            Images
   Postgres + RLS      media, drafts,  ig-profile-hi/lo, sessions-lite, resize/AVIF
   Auth (Google, phone ISR cache,      ig-post, wa-send,  rate limits,  avatars,
   via Send-SMS hook)  sitemaps        media, ai          flags         thumbnails
         ▲               ▲                │
         │ Hyperdrive    │                ▼
         │ (pooled TCP   │         Queue consumer Workers ──► Apify (IG public)
         │ for jobs)     │                               ──► Instagram API (IG Login)
         │               │                               ──► WhatsApp Cloud API
   Cron Triggers ────────┘                               ──► LLM (brief parse, niche)
   (schedulers)              Email Routing ──► Email Worker (briefs@ inbound parse)
```

| Concern | Choice | Free tier (verify) | Why / notes |
|---|---|---|---|
| App runtime | **Workers + OpenNext** (`@opennextjs/cloudflare`), Static Assets for `/_next/static` | Free: 100K req/day, 10 ms CPU, 3 MB bundle. **Paid $5/mo**: 10M req + 30M CPU-ms incl., 10 MB bundle | Start on Paid: Next.js bundles and SSR CPU exceed free limits; still the cheapest commercial host (Vercel Hobby forbids commercial use — D1). |
| Pages | Only for preview of the static marketing/docs site if split out | Unlimited static requests, 500 builds/mo | Workers Static Assets is now the default for full-stack; Pages adds nothing for Next. |
| DB / Auth / RLS | **Supabase** Mumbai (`ap-south-1`) | Free 500 MB (pauses when idle — not for prod); **Pro $25** incl. 8 GB, 100K MAU, $10 compute credit | RLS is the tenancy boundary (D9). |
| DB access from Workers | `supabase-js` over HTTPS (user JWT → RLS) for request paths; **Hyperdrive** + `postgres` driver for queue consumers (service role) | Hyperdrive included in Workers plans | Avoids TCP connection storms; keeps RLS on user paths. |
| Media | **R2**: `media-public` (avatars, thumbnails), `media-private` (drafts, IDs, invoices), `cache` (ISR, sitemaps) | 10 GB-mo, 1M Class A, 10M Class B, **zero egress** | Drafts are large videos; egress-free is the decisive saving. Presigned multipart upload direct from the browser. |
| Images | **Cloudflare Images** transformations from R2 (fixed widths 96/320/640, AVIF/WebP) | 5,000 unique transformations/mo free; then ~$0.50 / 1K | IG CDN URLs expire → copy originals to R2 once; transform on view; cache at edge. |
| Video | R2 + browser playback (MP4/H.264); Stream later (D23) | — | Frame-accurate review needs a real `<video>` + known fps, not a transcoder. |
| Jobs | **Queues** + **Cron Triggers** | Queues on free plan with daily op limits; paid: 1M ops/mo incl., then ~$0.40/M | IG refresh, post tracking, WhatsApp sends, media ingest, AI classify. |
| Config / small state | **KV**: feature flags, template registry cache, rate-limit counters, college autocomplete top-500 per city | Free 100K reads/day, 1K writes/day | Read-heavy, eventually consistent is fine. |
| **D1** | **Not used for business data.** Only if OpenNext's tag cache (`revalidateTag`) needs it — prefer the Durable-Object tag cache | 5 GB, 5M rows read/day | Two databases = two sources of truth; RLS lives in Postgres (D19). |
| Bot protection | **Turnstile** on signup, OTP request, enquiry, public forms | Free | Also gate OTP sends to cap WhatsApp/SMS cost abuse. |
| Inbound email | **Email Routing** `briefs@` → Email Worker → parse → draft brief (BB-1) | Free | Outbound mail via Resend (3K/mo free → $20 for 50K). |
| Analytics | **Web Analytics** (RUM, Core Web Vitals) + PostHog free (funnels) | Free | Activation and funnel metrics from `08` §2.4. |
| Observability | Workers Logs + Sentry free tier | Free | Alert on DLQ depth, Apify failure rate, WA quality drops. |

**Region note:** users and DB are both in India; Workers run in Indian PoPs (Mumbai, Delhi, Chennai, etc.).
Keep Smart Placement off for public pages (served from cache); consider it for CRM routes with many DB calls.

---

## 2. Monthly cost at 1K / 10K / 100K creators

### 2.1 Volume assumptions *(est.)*

| Driver | 1K | 10K | 100K |
|---|---|---|---|
| Campaigns / month | 8 | 30 | 150 (incl. partner agencies) |
| Briefs published / month | 12 | 45 | 220 |
| Web requests / month | 0.3M | 3M | 30M |
| IG profile fetches / month (tiered, §6) | 4.3K | 19K | ~110K (after 30% on Instagram Login) |
| IG post-tracking fetches / month (posts × 3 checkpoints) | 1K | 3.6K | 18K |
| WhatsApp marketing (brief alerts, capped top-N) | 4K | 9K | 75K |
| WhatsApp utility (outside free window) | 2K | 7K | 36K |
| WhatsApp authentication (OTP) | 0.3K | 3K | 20K |
| Media stored (rolling; drafts purged 90 d after campaign close) | 20 GB | 150 GB | 1 TB |
| Unique image transformations | 5K | 40K | 150K |
| Supabase MAU | < 2K | < 15K | ~60K |

### 2.2 Cost table (USD/month, approx.)

| Line | 1K | 10K | 100K | Notes |
|---|---|---|---|---|
| Workers Paid (req + CPU) | $5 | $5 | ~$20 | 30M req → ~$6 req overage + ~$9 CPU at ~15 ms avg |
| Queues, Cron, KV, Turnstile, Web Analytics, Email Routing | $0 | $0 | ~$1 | Within included allowances |
| R2 storage + ops | $0 | ~$3 | ~$16 | $0.015/GB-mo beyond 10 GB; egress $0 |
| Cloudflare Images | $0 | ~$18 | ~$73 | $0.50 / 1K unique transforms beyond 5K |
| Supabase | $25 | ~$35 | ~$110 | Pro + compute add-on (Small → Medium) + disk |
| Apify (IG) | ~$39 plan | ~$59 | ~$340 | ~$0.0026/profile, ~$0.003/post fetch; plan minimum at low volume |
| WhatsApp Cloud API | ~$43 (₹3.8K) | ~$100 (₹8.9K) | ~$810 (₹71K) | Marketing ~₹0.86, utility/auth ~₹0.115 |
| SMS OTP fallback (DLT route) | ~$1 | ~$5 | ~$25 | ~₹0.15–0.25/SMS; used only when WhatsApp fails |
| LLM (brief parse, niche tagging, gap questions) | ~$2 | ~$10 | ~$45 | Small model; classify only when new captions arrive; Workers AI free allowance first |
| Email (Resend) | $0 | $20 | $20 | Free tier ends at 3K/mo |
| Error tracking / product analytics | $0 | $0 | ~$50 | Sentry/PostHog free tiers likely exceeded at 100K |
| **Total** | **≈ $115 (₹10K)** | **≈ $255 (₹22K)** | **≈ $1,510 (₹1.33L)** | |
| **Per creator / month** | $0.115 | $0.026 | $0.015 | |

**Where the money goes at scale:** WhatsApp (≈54%) and Apify (≈23%). Levers, in order:

| Lever | Saving at 100K |
|---|---|
| Cap brief alerts to top-N matches and merge into weekly digests | 30–50% of WhatsApp |
| Send utility updates inside open 24h windows (after a creator replies) → free | 10–20% of utility |
| Push Instagram Login (free API) to active creators | each 10% connected ≈ −$30–45 Apify |
| Tiered refresh (§6) instead of weekly for all | ≈ −$800 vs weekly-for-all (~430K fetches ≈ $1,120) |
| Purge raw drafts 90 days after close, keep approved finals | caps R2 growth |

Compare: one AM-day saved per campaign (~₹3–4K) × 150 campaigns ≈ ₹5L/month — the stack pays for itself if it
removes even a fraction of manual work.

---

## 3. Auth & identity plumbing

| Flow | Implementation |
|---|---|
| Google one-tap | Google Identity Services one-tap → ID token → `supabase.auth.signInWithIdToken({ provider: 'google' })` |
| WhatsApp OTP | Supabase phone auth with **Send SMS hook** → Worker sends `otp_login` via WhatsApp Cloud API; SMS (DLT-registered sender) fallback after 30 s |
| Rate limits | Turnstile token required for OTP request; KV counter 3 OTP / phone / 15 min, 10 / IP / hour |
| Magic links (brands) | HMAC-signed token, SHA-256 hash stored in `review_links`, scope + expiry; served by an RLS-bypassing server route that checks scope explicitly |
| Sessions | Supabase cookies (SSR helpers); no session data in KV |

---

## 4. SEO plan

### 4.1 Rendering

| Page type | Rendering | Revalidate | Index? |
|---|---|---|---|
| Landing, for-brands, for-creators, pricing | SSG at build | on deploy | Yes |
| City / college / niche / role hubs (programmatic) | ISR via OpenNext R2 incremental cache | 24 h + on-demand `revalidateTag` when counts change | Only if ≥ 8 public profiles (else `noindex`, kept for users) |
| Public creator mini-profile (opt-in, D5) | ISR | 24 h; on refresh | Yes, if opted in and approved |
| Public gigs (event-talent briefs marked public) | SSR + `JobPosting` JSON-LD | on change; removed on close | Yes while open |
| Talent PWA, CRM, admin, magic-link pages | SSR, private | — | `noindex`, `Disallow` in robots, `X-Robots-Tag` header |

### 4.2 Programmatic page families

| Pattern | Example | Data | Unique content per page |
|---|---|---|---|
| `/creators/[city]` | `/creators/pune` | Public profiles in city | Counts by niche, top colleges, median ER by tier, recent campaigns (anonymised) |
| `/creators/[city]/[niche]` | `/creators/mumbai/food` | Same, filtered | Niche-specific stats, top public creators, FAQs |
| `/colleges/[college-slug]` | `/colleges/mithibai-college-mumbai` | College + verified students (counts only) | Fests, clubs, creator count by year, "run a campus campaign here" |
| `/campus-ambassadors/[city]` | `/campus-ambassadors/bangalore` | Ambassador programme | Colleges covered, how to join, leaderboard snapshot |
| `/event-talent/[city]/[role]` | `/event-talent/delhi/anchors` | Event talent public profiles | Rate bands by rank, availability, how booking works |
| `/gigs/[city]` and `/gigs/[id]` | `/gigs/mumbai` | Open public gigs | Real openings (Google for Jobs) |
| `/for-brands/[use-case]` | `/for-brands/college-fest-sponsorship` | Hand-written | Case studies, process, pricing bands |

**Thin-content guard:** a page is indexed only if it passes a minimum (≥ 8 profiles or ≥ 300 words of unique
data-driven copy); near-duplicate city × niche combos are canonicalised to the parent; no pages for empty
combinations. Start with 10 launch cities × 12 niches + top 500 colleges ≈ 620 pages, not 50K.

### 4.3 Structured data (JSON-LD)

| Page | Types |
|---|---|
| Home | `Organization` (logo, sameAs), `WebSite` + `SearchAction` |
| Hubs | `CollectionPage` + `ItemList` of `ProfilePage` links, `BreadcrumbList` |
| Creator profile | `ProfilePage` with `mainEntity: Person` (name, image, `sameAs` IG URL, `interactionStatistic` followers), no contacts/rates |
| College page | `CollegeOrUniversity` (name, address, url) as `about`, `BreadcrumbList` |
| Gig | `JobPosting` (title, description, datePosted, validThrough, employmentType `CONTRACTOR`/`TEMPORARY`, hiringOrganization, jobLocation, baseSalary) |
| For-brands | `Service` + `FAQPage` (FAQ rich results are limited; keep for content clarity) |

Validate every template in CI with a schema validator; Search Console for coverage.

### 4.4 Sitemaps, robots, metadata

| Item | Spec |
|---|---|
| Sitemap index | `/sitemap.xml` → `sitemap-static`, `sitemap-cities`, `sitemap-colleges`, `sitemap-profiles-[n]` (≤ 50K URLs each), `sitemap-gigs` |
| Generation | Cron (daily 03:00 IST) → query Supabase → write XML to R2 → served by Worker with `lastmod` from data |
| Robots | Allow public; disallow `/crm`, `/admin`, `/me`, `/b/`, `/api` |
| Metadata | Unique `title`/`description` per page from data; canonical URLs; `hreflang` en-IN (hi-IN later) |
| OG images | Generated per hub/profile at the edge (`next/og`), cached in R2 |
| Links | Hub ↔ sub-hub ↔ profile internal links; breadcrumbs; "nearby colleges" blocks |

---

## 5. Performance budget

| Metric (p75, field data, 4G mid-range Android) | Budget | How |
|---|---|---|
| LCP | **< 2.0 s** | Edge-cached HTML for public pages; hero image ≤ 60 KB AVIF with `fetchpriority=high`; fonts preloaded, subset |
| INP | **< 150 ms** | Server components by default; no heavy hydration on lists; optimistic updates; break long tasks (`scheduler.yield`) |
| CLS | **< 0.05** | Explicit media dimensions; skeletons match final layout; no late-injected banners |
| TTFB | < 600 ms (cached < 200 ms) | ISR/R2 cache; one DB round-trip per request where possible; Supabase in Mumbai |

**JS budget per route (gzip, first load, incl. framework):**

| Route | Budget | Notes |
|---|---|---|
| Public SEO pages (hubs, profiles, gigs) | 70 KB | Mostly static; no client data libs |
| Landing | 90 KB | Motion lazy-loaded after LCP |
| Signup | 110 KB | Google one-tap script loaded on interaction or idle |
| Creator home `/me`, brief page | 130 KB | — |
| Brand magic-link pages (shortlist, live page, report) | 140 KB | Charts lazy-loaded |
| CRM lists / pipeline / tracker | 180 KB | Virtualised tables; code-split per tab |
| Review room (video player + annotations) | 200 KB | Player chunk only on this route |
| Admin | 200 KB | Internal; lower priority |

Enforce with a bundle-size check in CI (fail on +10%) and Web Analytics RUM alerts on p75 regressions.

---

## 6. Job & queue design — Instagram refreshes

### 6.1 Refresh tiers

| Tier | Who | Cadence | Share at 100K *(est.)* |
|---|---|---|---|
| `signup` | New handle / claim | Immediately (priority queue), target preview ≤ 15 s | ~5K/mo |
| `hot` | In an open brief's long-list, shortlisted or booked | Every 3 days while active; on-demand before shortlist share (1/day cap) | ~5% |
| `active` | Applied/logged in within 30 days | Weekly | ~10% |
| `warm` | Active within 90 days | Monthly | ~50% |
| `cold` | Inactive > 90 days | Quarterly (or on next login) | ~35% |
| `ig_login` | Connected via Instagram Login | Daily via Graph API (free); Apify skipped | ~30% (overlaps tiers) |

Columns: `social_accounts.refresh_tier`, `next_refresh_at`, `source`, `fetch_status`, `fetch_error`,
`last_fetched_at` (exists), `fail_count`.

### 6.2 Queues

| Queue | Producer | Consumer | Batch | Retries / DLQ |
|---|---|---|---|---|
| `ig-profile-hi` | Signup, claim, AM on-demand | Starts Apify run (sync for 1 handle; ≤ 60 s) | 1–5, timeout 1 s | 3 with backoff (30 s, 2 m, 10 m) → `ig-dlq` |
| `ig-profile-lo` | Scheduler cron | Starts one Apify run per batch of up to 50 handles (async, webhook) | 50, timeout 30 s, max concurrency 2 | 3 → `ig-dlq` |
| `ig-post` | Live URL submitted; checkpoint scheduler | Apify post scraper (or Graph API media insights if connected) | 25 | 3 → `ig-dlq` |
| `ig-login-refresh` | Daily cron | Graph API profile + insights; token refresh when < 10 days to expiry | 50 | 3 → mark `needs_reconnect`, notify creator |
| `media-ingest` | Fetch results | Copy avatar + top thumbnails to R2 (content-hash keys, skip if unchanged) | 20 | 5 |
| `ai-classify` | Fetch results with new captions | Niche, language, brand mentions; college inference on bio change | 20 | 3 |
| `wa-send` | Notifications service | WhatsApp Cloud API; respects caps, quiet hours, template category; logs cost | 50, concurrency tuned to messaging limit | 3; permanent errors (opt-out, invalid number) not retried |

### 6.3 Flow

```
Cron (every 15 min) ─► SELECT id FROM social_accounts
                       WHERE next_refresh_at <= now() AND fetch_status <> 'running'
                       ORDER BY tier_priority, next_refresh_at LIMIT 500
                       FOR UPDATE SKIP LOCKED  → set fetch_status='running'
                    ─► enqueue ig-profile-lo (batches of 50)
Consumer ─► POST Apify run (usernames[], webhook=/hooks/apify?batch=…, idempotency key = batch id)
Apify ─► webhook (HMAC-verified) ─► Worker reads dataset ─► upsert social_accounts, social_posts,
         insert social_snapshots ─► compute ER/view rate ─► set next_refresh_at by tier
       ─► enqueue media-ingest, ai-classify (only if changed)
Failure ─► fail_count++, exponential next_refresh_at; after 3 → fetch_status='error' + admin health panel;
           private/deleted account → tier 'cold', creator notified to fix
```

**Post-tracking checkpoints:** `post_tracking.next_checkpoint_at` set to posted_at + 24h / 72h / 7d / 30d; a cron
every 15 min enqueues due rows (Queue delivery delays cap at hours, so long waits live in Postgres, not in the queue).

**Guards:** global Apify spend cap per day (KV counter; pause `lo` queue when exceeded), per-creator
on-demand limit, idempotent upserts keyed by (`account_id`, `shortcode`) and (`account_id`, `fetched_at::date`),
DLQ replay tool in admin, metrics: queue depth, run success %, median preview latency, cost per fetch.

---

## 7. Security & compliance deltas

| Item | Spec |
|---|---|
| Secrets | Worker secrets for Apify, Meta, Supabase service role; service role only in queue consumers |
| Webhooks | Verify Meta `X-Hub-Signature-256` and Apify HMAC; replay window 5 min |
| PII | PAN/bank encrypted (Supabase Vault); student ID images auto-deleted after verification; private R2 bucket with short-lived signed URLs |
| DPDP | Consent ledger (purpose, timestamp, text version); export/delete self-serve; data retention per table |
| WhatsApp | Opt-in records, STOP handling, quality rating monitoring |
| Abuse | Turnstile + rate limits on OTP and fetch endpoints; daily spend caps on Apify and WhatsApp |
