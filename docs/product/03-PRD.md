# 03 · PRD — Vigor Talent Network v2 ("Class apart")

## Problem statement

Vigor runs many youth and college campaigns at once, but every campaign restarts from scratch: scouting on
Instagram and WhatsApp, re-collecting rates, chasing approvals, drafts, links and invoices by hand. Brands lack
visibility, creators get ghosted, and the agency's knowledge never compounds. Competitors either stop at a
directory (HashFame, Qoruz) or are expensive global suites (GRIN, Upfluence) that ignore India's college graph,
on-ground talent and WhatsApp-first behaviour.

## Goals

| # | Goal | Measure | Target (90 days after v2 launch) |
|---|---|---|---|
| G1 | Make creator signup effortless | Median time from landing to completed profile; completion rate | ≤ 60 s; ≥ 70% of starters complete |
| G2 | Stop re-scouting | % of campaign talent sourced from the pool vs. outside | ≥ 80% |
| G3 | Faster shortlists | Brief published → first brand-approved shortlist | ≤ 24 h (from ~3–5 days) |
| G4 | Brand confidence | Shortlist approvals and content approvals done in the review room | ≥ 90% of approvals in-product |
| G5 | Reliable execution | Event no-show rate; on-time content delivery | < 5% no-shows; ≥ 90% on time |

## Non-goals (v2)

- **In-app payouts/escrow** — track payments now; money movement (RazorpayX/Cashfree payouts) after volumes justify compliance work.
- **Native mobile apps** — an installable PWA covers creators; native later if engagement demands it.
- **Scraping private data or audience demographics without consent** — only public data or creator-authorised Instagram insights.
- **Self-serve brand marketplace** — brands work through Vigor (enquiry + review rooms); self-serve brand accounts are P2.
- **Content creation tools** (editing, scheduling posts) — out of our core job.

## User stories (highest priority first)

**Creator**
- As a college creator, I want to sign up with Google and my Instagram handle so that my profile builds itself without typing.
- As a creator, I want to see only briefs that match me so that I don't waste time on irrelevant ones.
- As a creator, I want to say "I'm in" in one tap (on web or WhatsApp) so that I can respond while scrolling.
- As a creator, I want to see exactly where each application stands so that I'm never ghosted.
- As a creator, I want to submit drafts and live links in one place so that I don't resend files on WhatsApp.
- As a creator, I want to see when I'll be paid so that I can plan.

**Event talent**
- As a promoter, I want gigs in my city with clear pay so that I can pick work quickly.
- As an anchor, I want my rank and ratings to grow with good work so that I earn more.

**Brand**
- As a brand manager, I want to approve or reject proposed talent from my phone without creating an account so that approvals take minutes.
- As a brand manager, I want a live campaign page and a final report link so that I can show results internally.

**Agency (AM, scout, ops, reviewer, finance, founder)**
- As an AM, I want to paste a client's WhatsApp brief and get a structured brief so that I stop re-typing.
- As a scout, I want to filter by college, graduation year, city, niche, followers and ER so that I can build a shortlist in minutes.
- As an AM, I want reminders and deadline tracking for every deliverable so that nothing slips.
- As a reviewer, I want versioned drafts with a compliance checklist so that I catch missing tags before go-live.
- As ops, I want geo + selfie check-ins and auto replacements so that activations run fully staffed.
- As finance, I want each booking's fee, invoice and payout status so that payments are on time.
- As the founder, I want pipeline value, margin and team workload at a glance so that I can steer the business.
- As a partner agency, I want my own workspace on the shared pool so that I can run campaigns without building a database.

**Edge cases:** private Instagram account (ask to switch to public or connect via Instagram Login); handle already
claimed (claim dispute flow); creator without college; brand rejects all talent (re-suggest); creator withdraws
after confirmation (replacement flow); Apify failure (retry queue, show "syncing").

## Requirements

### P0 — must ship

| ID | Requirement | Acceptance criteria |
|---|---|---|
| A1 | **Auth**: Google sign-in + WhatsApp/SMS OTP + email fallback | Given a new visitor, when they choose Google, then an account is created and they reach step 2 without a password. |
| A2 | **60-second creator onboarding** with live auto-fill | IG handle → profile preview within 15 s (skeleton meanwhile); city prefilled from IP; college asked only if "in college = yes"; ≤ 4 required inputs. |
| A3 | **College graph** | `colleges` table seeded (name, city, state, type); autocomplete by city; `graduation_year`, `course`; optional college-email verification badge. |
| A4 | **Progressive profiling** | Profile strength meter; contextual asks (rate when applying, payout when confirmed). |
| A5 | **Matching briefs + one-tap interest** | Talent see only eligible open briefs; "I'm in" works from the web and from a WhatsApp button. |
| A6 | **Pipeline with deliverables** | Booking = talent × brief with fee, deliverables, due dates, status; kanban + table views; drag to change stage. |
| A7 | **Review room (magic link)** | Brand opens a signed, expiring link; approves/rejects talent and drafts with comments; no account needed; every action logged. |
| A8 | **Content submissions & live tracking** | Draft upload (R2) with versions; post URL submission; metrics auto-fetched at 24h/72h/7d. |
| A9 | **Campaign report** | Shareable page: reach, views, engagement, ER, CPE/CPV, content gallery, per-creator table; PDF export. |
| A10 | **WhatsApp notifications** | Utility templates: brief match, shortlisted, confirmed, deadline reminder, payment update; opt-in recorded. |
| A11 | **Role-aware dashboards** | Creator, event talent, brand (review room), AM, ops, finance, founder, admin — each lands on its own home. |
| A12 | **Performance & polish** | LCP < 2.0 s on 4G mid-range Android; INP < 200 ms; skeletons for every async view; no layout shift (CLS < 0.05); reduced-motion respected. |
| A13 | **SEO** | SSR public pages, sitemap, structured data, OG images; opt-in public creator profiles; city/college landing pages. |

### P1 — fast follows

- AI brief parser (paste text/PDF → structured brief) and campaign plan estimator.
- Event rosters with geo + selfie check-in, reliability score, replacement suggestions.
- Finance: payout profile (PAN, GST, UPI/bank), invoice upload, payout status, CSV export.
- Founder dashboard: pipeline value, margin, SLA breaches, team load.
- Talent manager accounts; Brand Interest Signals ("viewed by 3 agencies this week").
- Instagram Login (verified insights badge, audience demographics where available).
- Creator leaderboards, badges, referral invites ("bring 3 friends from your college").
- Saved searches and "more like this" lookalikes.

### P2 — future

- Self-serve brand accounts and paid brand plans.
- In-app payouts and escrow; GST invoices auto-generated.
- Native apps; Academy (training) with attendance → rank.
- YouTube/LinkedIn/Moj/ShareChat connectors; regional-language UI.
- Partner-agency billing, royalty statements, white-label workspaces.

## Success metrics

- **Leading:** signup completion rate, time-to-complete, % profiles with IG synced, briefs → interest rate,
  WhatsApp click-through, time to first shortlist, review-room approval latency.
- **Lagging:** % campaign talent sourced from pool, repeat-creator rate, no-show rate, brand NPS, revenue per
  campaign, partner-agency usage.
- Instrument with PostHog (free tier) or Cloudflare Web Analytics + custom events table.

## Open questions

| Question | Owner | Blocking? |
|---|---|---|
| WhatsApp: direct Meta Cloud API (needs Meta Business verification) or a BSP (AiSensy/Interakt) for speed? | Founder + Eng | Blocks A10 |
| Commercial hosting: Cloudflare Workers (free/$5) vs Vercel Pro ($20/user) — Vercel Hobby forbids commercial use. | Eng | Blocks launch |
| Creator payouts: through Vigor's bank (manual) for v2? | Finance | No |
| Public creator profiles: opt-in default on or off? | Founder | No |
| Do brands see creator contact details? (Recommendation: no — agency mediates.) | Founder | No |

## Phasing

1. **v2.0 Foundation (now):** new design system, landing, auth (Google), 60-s onboarding with auto-fill and college graph, creator/talent dashboards, CRM and admin re-skinned, performance + SEO baseline.
2. **v2.1 Execution:** bookings + deliverables, review rooms, content submissions, live tracking, reports, WhatsApp notifications.
3. **v2.2 Ops & money:** AI brief parser, rosters and check-ins, finance, founder dashboard, talent managers.
4. **v2.3 Network:** Instagram Login insights, leaderboards/referrals, public profiles + programmatic SEO, partner agencies and royalties.
