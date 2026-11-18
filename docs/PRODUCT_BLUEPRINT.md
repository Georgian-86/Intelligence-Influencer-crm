# Vigor Talent Network — Product & Platform Blueprint

> Working name: **Vigor Talent Network** (alt: Vigor Talent Connect).
> Status: draft v0.1 — consolidates the business blueprint PDF, the Instagram-data
> research, and the founding team's direction.

---

## 1. Why we are building this

Vigor is a marketing agency running many influencer and on-ground campaigns at once.
Today every campaign starts with **scouting from scratch** (DMs, WhatsApp groups,
spreadsheets). There is no central record of who we've worked with, how they
performed, what they charge, or who is available.

**Vigor Talent Network** fixes this with a **centralised, verified talent pool** plus a
**campaign CRM**:

1. Talent (influencers *and* event talent) register once and keep their profile fresh.
2. Vigor posts a campaign brief.
3. Eligible registered talent see it and **express intent** ("I'm interested").
4. The Vigor team reviews intents, shortlists, contacts and confirms — no re-scouting.
5. Performance and ratings from each campaign flow back into the talent's profile/rank.

**Expansion path:** Vigor internal tool → multi-role platform with RBAC → **licensed to
other agencies**, who pay Vigor a royalty/subscription for access to the pool and the
CRM.

---

## 2. Who uses it (personas & surfaces)

| Surface | Users | Purpose |
|---|---|---|
| **Public site + Talent portal** | Influencers, event talent | Register, build profile, connect socials, browse open briefs, express intent, track applications |
| **Brand portal** (phase 2) | Brands / clients | Submit campaign requirements, view shortlists shared with them, approve talent |
| **Agency CRM** (separate app) | Vigor team; later partner agencies | Search the pool, post briefs, review intents, pipeline/outreach, campaign management, exports |
| **Platform Admin** (separate app) | Vigor platform staff | Approve/screen talent, ranks, categories, tenants (agencies), licences & royalties, audit |

### Entry flow (public)

```
Landing page
  ├── "I'm an Individual" ──► choose:
  │        ├── Influencer / Content Creator  ──► influencer registration
  │        └── Event Talent (Vigor Talent Network: promoters, hosts, artists, crew)
  │                                           ──► event-talent registration
  └── "I'm a Brand" ──► brand enquiry / brand account
```

CRM and Admin are **separate apps on separate subdomains** (e.g. `crm.` and `admin.`),
login-only, never linked from the public site.

---

## 3. Talent model

One shared **Talent** core with type-specific extensions, so one person can be both
(e.g. an anchor who is also a creator).

**Core (all talent):** name, photo, phone, email, city, languages, gender, DOB/age band,
categories, bio, portfolio/videos, rate card, availability, verification status, rank,
ratings, reliability score, consent flags.

**Influencer extension**
- Platforms: Instagram (MVP), YouTube, others later.
- Auto-fetched (Apify, from profile URL): username, full name, bio, profile picture,
  followers, following, post count, verified flag, business category, recent posts/Reels
  with likes, comments, views.
- Computed: avg likes, avg comments, avg Reel views,
  **Engagement rate** = (avg likes + avg comments) / followers × 100 (last 12 posts),
  **View rate** = avg Reel views / followers × 100, follower tier (nano/micro/mid/macro/mega).
- History: follower and ER snapshots over time.
- **Audience demographics** (age, gender, city/country) — *only* via the creator connecting
  their professional IG account through Meta OAuth (Graph API insights). Cannot be
  scraped; shown as a "Verified insights" badge.
- Contact: only what the creator provides at registration or publicly lists; record source.

**Event-talent extension** (from the PDF)
- Category groups: Event Manpower (promoters, hosts/emcees, anchors, supervisors,
  coordinators, registration desk, hospitality, activation staff, crowd mgmt, merch
  promoters), Technical Crew (sound, light, stage mgr, production asst, AV, video,
  camera, live-stream), Performing Artists (musicians, singers, bands, DJs, comics,
  magicians, beatboxers, dancers, crews, rappers, spoken word, instrumentalists, street
  performers, theatre, mimicry), Specialty (caricature, tattoo, illusionists, jugglers,
  fire, LED performers, event content creators).
- Skills (brand activations, college fests, corporate, stage hosting, product launch).
- Experience log (past events/campaigns), performance videos.
- Pricing: half-day / full-day / package.
- **Rank:** Bronze (Beginner) → Silver (Intermediate) → Gold (Experienced) →
  Platinum (Premium). Upgraded via videos, portfolio, client ratings, training
  attendance, reliability/attendance score.
- Onboarding: register → HR screening → virtual interview → approved with rank.

**Launch cities:** Mumbai, Pune, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Ahmedabad,
Chandigarh, Goa.

---

## 4. Core workflow: Brief → Intent → Pipeline

```
Agency creates Campaign ──► publishes one or more Briefs
   Brief: title, brand (optionally masked), talent type & categories, cities,
          follower/ER range, rank, dates, deliverables, budget range, deadline,
          visibility (all eligible / invited only)

Eligible talent see it in their portal ──► "Express interest"
   (optional: quoted rate, availability note, sample work)

Agency CRM: intents inbox per brief
   ──► pipeline stage per talent:
       Interested → Shortlisted → Contacted → Negotiating → Confirmed → Delivered
                                         ↘ Rejected / Dropped
   ──► notes, agreed rate, deliverables, links to posted content
   ──► after delivery: rating + reliability → feeds rank & profile
```

Agencies can also **add talent to a brief directly** from pool search (invite), and
talent get notified.

---

## 5. Multi-tenancy, RBAC and licensing

### Tenants (Organizations)
| Org type | Example | Owns |
|---|---|---|
| `platform` | Vigor Talent Network | The talent pool, categories, ranks |
| `agency` | Vigor Marketing (first tenant), partner agencies | Campaigns, briefs, pipeline, private notes, negotiated rates |
| `brand` | Domino's, NUUK, Nua | Requirements, shared shortlists |

- **The talent pool is global** (owned by the platform). Agencies get *licensed access*.
- **Everything an agency creates is private to that agency** (`org_id` on every row,
  enforced at the database layer via row-level security).
- Talent consent at registration: profile may be shown to partner agencies; contact
  details revealed only when the talent expresses intent or accepts an invite
  (protects talent and makes contact "unlocks" meterable).

### Roles (initial)
| Scope | Role | Can |
|---|---|---|
| Platform | `super_admin` | Everything, incl. tenants and licences |
| Platform | `platform_ops` | Approve talent, manage ranks/categories, view all |
| Platform | `hr_screener` | Screen and interview talent, set rank |
| Agency | `org_owner` | Billing, members, all org data |
| Agency | `org_admin` | Members, campaigns, all org data |
| Agency | `campaign_manager` | Create campaigns/briefs, manage pipelines |
| Agency | `scout` / `viewer` | Search pool, add notes; no publishing |
| Brand | `brand_admin`, `brand_member` | Requirements, view shared shortlists, approve |
| Talent | `talent` | Own profile, intents, bookings |

Implemented as **role → permission** mappings (e.g. `brief.publish`, `talent.contact.view`,
`talent.approve`) so new roles can be added without code changes.

### Royalty / licensing (phase 3)
- `usage_events` ledger per org: briefs published, intents received, contacts unlocked,
  talent confirmed, metric refreshes.
- Plans: subscription and/or per-confirmed-booking commission/royalty to Vigor.
- Audit log of who viewed or exported talent data.

---

## 6. Data model (first cut)

`users`, `organizations`, `memberships(user, org, role)`, `roles`, `permissions`,
`talent_profiles`, `talent_categories`, `talent_media`, `talent_rate_cards`,
`talent_availability`, `social_accounts(platform, handle, url, oauth?)`,
`social_snapshots(followers, er, view_rate, fetched_at)`, `social_posts`,
`audience_insights`, `campaigns`, `briefs`, `brief_criteria`,
`intents(brief, talent, status, quote)`, `pipeline_events`, `notes`,
`ratings`, `rank_history`, `screenings/interviews`, `brands`, `notifications`,
`usage_events`, `audit_log`.

---

## 7. Data sources & cost

| Need | Source | Notes |
|---|---|---|
| Public IG profile + posts/Reels | **Apify** Instagram scraper actor | ~$0.50–$1.25 / 1k profiles; free plan $5/mo covers the MVP. Runs as a background job. |
| Audience demographics | **Meta Instagram Graph API** (creator OAuth) | No per-call fee; needs Meta app review + professional accounts |
| Event-talent data | Self-declared + HR screening | Verified by the Vigor team |
| Videos / images | Object storage | Size limits + transcoding later |

Scraped data refreshes on a schedule (e.g. weekly for active talent) and on demand.

---

## 8. Recommended stack

- **Next.js (TypeScript)** monorepo with three apps: `web` (public + talent + brand),
  `crm` (agency), `admin` (platform), plus shared `ui`, `db` and `auth` packages.
- **PostgreSQL** (Supabase: auth, row-level security for tenant isolation, storage for
  media). Relational data, cross-tenant metering and RLS make Postgres a better fit than
  MongoDB for a multi-tenant CRM.
- **ORM:** Drizzle or Prisma. **Background jobs:** Inngest / pg-boss for Apify fetches and
  refreshes. **Email/WhatsApp notifications** in phase 2.
- **Hosting:** Vercel (apps) + Supabase, or the existing AWS setup.

---

## 9. Phased roadmap

| Phase | Scope |
|---|---|
| **1 — Vigor MVP** | Landing + Individual/Brand split; influencer & event-talent registration; IG URL → Apify auto-fetch + ER/view-rate; admin approval/screening; Agency CRM for Vigor only: pool search & filters, campaigns, briefs, talent intents, pipeline, notes, CSV/Excel export |
| **2 — Quality & brands** | Ranks & ratings, reliability score, Meta OAuth audience insights, brand portal + shared shortlists, notifications, metric refresh history |
| **3 — Multi-agency** | Agency onboarding as tenants, full RBAC UI, licensing plans, usage metering, royalty reports, audit log |
| **4 — Scale** | Talent Academy (training sessions), availability calendar & bookings, payments/payouts, mobile app, more platforms (YouTube) |

---

## 10. Open decisions

1. Stack confirmation (Next.js + Postgres/Supabase recommended vs. MERN from earlier notes).
2. Should brands get a login in phase 1, or only an enquiry form?
3. Brief visibility default: all eligible talent, or invite-only?
4. Contact-reveal policy for partner agencies (on intent only vs. paid unlock).
5. Final brand name and domain; colour direction (Black + Orange vs. Dark Blue + Neon).
