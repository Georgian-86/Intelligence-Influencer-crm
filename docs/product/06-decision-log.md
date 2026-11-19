# 06 · Decision Log ("Arena")

Each contested decision gets the strongest case for each side, then a verdict. Revisit when the
"revisit if" condition happens.

## D1 · Hosting: Vercel vs Cloudflare
- **Vercel:** zero-config Next.js, best DX, previews per branch. But Hobby is non-commercial and Pro is $20/user/month.
- **Cloudflare Workers (OpenNext):** free/$5 plan, global edge, R2/Queues/Turnstile in one place, free geolocation header. Some Next.js features need care (ISR, image optimisation).
- **Verdict:** Stay on Vercel for the demo now; migrate production to **Cloudflare Workers** before commercial launch. Code stays portable (no Vercel-only APIs). *Revisit if* OpenNext blocks a needed Next feature.

## D2 · Signup method
- **Email + password:** universal, but slow and email deliverability is weak.
- **Google:** one tap, verified email, most students have it.
- **WhatsApp/SMS OTP:** phone is what ops needs; costs ~₹0.12 per OTP.
- **Verdict:** **Google first**, phone OTP second (also collects verified phone), email magic link as fallback. Phone is required only for event talent and at booking confirmation.

## D3 · Ask "college" at signup or later?
- **At signup:** Vigor's core business is college campaigns; it's the most valuable targeting field.
- **Later:** every extra field lowers completion.
- **Verdict:** Ask **one yes/no** at signup; only on "yes" show college (city-filtered autocomplete) + graduation year. Course, clubs and verification come later via progressive profiling.

## D4 · Do brands see creator contacts?
- **Yes:** transparency, fewer hops.
- **No:** protects creators from spam, preserves the agency's role and revenue.
- **Verdict:** **No.** Brands act through review rooms; the agency mediates contact. Partner agencies unlock contacts per metered event.

## D5 · Public creator profiles (SEO)
- **Public:** huge SEO surface (city/college/niche pages), creator pride, inbound brand leads.
- **Private:** competitors can scrape the pool.
- **Verdict:** **Opt-in public mini-profile** without contacts or rates; full profile stays private. Programmatic city/college pages show counts and top public profiles only.

## D6 · Payments in-app now?
- **Now:** solves a top pain; differentiator.
- **Later:** KYC, TDS/GST, payout licensing, reconciliation risk.
- **Verdict:** v2 **tracks** fees, invoices and payout status; v3 adds payouts via RazorpayX/Cashfree.

## D7 · Native app vs PWA
- **Native:** push notifications, App Store presence.
- **PWA:** one codebase, instant updates, no store review; WhatsApp covers notifications.
- **Verdict:** **PWA** (installable, offline shell) + WhatsApp notifications. Revisit at 25K monthly active creators.

## D8 · Instagram data source
- **Scraping (Apify):** works for any public account, no user effort, small cost, ToS grey zone.
- **Instagram Login:** official, verified insights, but needs app review and creator effort.
- **Verdict:** **Both.** Apify for instant auto-fill; Instagram Login as an optional "verified insights" upgrade that ranks creators higher in matching.

## D9 · Keep Supabase or move fully to Cloudflare (D1 database)
- **D1:** free, edge-native, but SQLite; we'd lose RLS and auth.
- **Supabase:** Postgres + RLS + auth already built and tested.
- **Verdict:** **Keep Supabase**; use Cloudflare for compute, media, jobs and edge.

## D10 · Brand colour system (arena bracket, 5 candidates)
Board: `docs/brand/experiments/palettes.png`. Rubric (1–5): logo fit · premium feel · youth energy · AA accessibility · dashboard legibility · distinctiveness vs competitors.
| Candidate | Logo | Premium | Youth | AA | Dashboard | Distinct | Total |
|---|---|---|---|---|---|---|---|
| A Launch Cobalt (cobalt + flame on warm paper) | 5 | 4 | 5 | 5 | 5 | 4 | **28** |
| B Midnight Volt (royal + lime) | 4 | 3 | 5 | 3 | 4 | 4 | 23 |
| C Orbit Ultraviolet (indigo + cyan) | 3 | 4 | 4 | 4 | 4 | 3 | 22 |
| D Heritage Navy & Champagne | 5 | 5 | 2 | 5 | 4 | 3 | 24 |
| E Aurora Ice (blue + aurora gradient) | 4 | 4 | 4 | 4 | 4 | 2 | 22 |
- Semi-finals: A beat E (same blue, but A's flame accent is ownable — it is the logo's rocket exhaust; aurora gradients are generic SaaS). D beat B (B's lime fails AA as text and cheapens the brand).
- Final A vs D: D is the most luxurious but reads "law firm" to a 19-year-old; A keeps D's warm paper premium and adds energy.
- **Verdict: A · Launch Cobalt**, borrowing E's mint/lilac only as 3D rim light. Previous dark + orange theme retired (rejected by the founder).
- *Revisit if* brand partners report the flame accent clashes with their own red brands in co-branded reports (then switch accent to mint).

## D11 · Theme: light-first vs dark-first
- Dark-first: dramatic, but the founder disliked it; dashboards are used for hours in daylight; light reads more premium/editorial.
- **Verdict: light-first everywhere**; `night` is used for contrast bands (hero cards, footer, review room player). A dark CRM theme can come later as a preference.

## D12 · 3D on the landing: WebGL vs CSS
- WebGL (three.js): real depth, lighting and motion — the "class apart" moment. Cost ~150KB gz.
- CSS/SVG pseudo-3D: zero JS, but looks flat next to top-tier sites.
- **Verdict: WebGL hero object, lazy-loaded after first paint** (`next/dynamic`, `ssr:false`), static poster underneath (LCP is the headline text, not the canvas), pause when off-screen, skip on `prefers-reduced-motion` and low-memory devices. Everything else uses CSS 3D transforms.

---

## Arena round 2 (v3 spec, Nov 2026)

Rubric for D10–D20: each option scored 1–5 on **User value**, **Build cost** (5 = cheapest), **Risk** (5 = safest)
and **Differentiation**; max 20. The steelman is the strongest honest case for each side. Context:
`07-campaign-lifecycle-and-pains.md`, `08-feature-spec-v3.md`, `09-architecture-cost.md`.

## D13 · Primary sign-in on mobile: Google one-tap vs WhatsApp OTP
- **Steelman Google:** zero typing, free, verified email; students all have Google accounts; one-tap auto-prompts on Android Chrome.
- **Steelman WhatsApp OTP:** gives the verified phone ops and notifications need; WhatsApp is the creator's inbox, so opt-in happens at signup; works for people who don't recall which Gmail they use.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Google only first (D2) | 4 | 5 | 4 | 2 | 15 |
| WhatsApp OTP only first | 4 | 3 | 3 | 3 | 13 |
| **Both, equal weight + WhatsApp opt-in step after Google** | 5 | 3 | 4 | 3 | **15 (wins on value)** |

- **Verdict:** Show **Continue with Google** and **Continue with WhatsApp** side by side; after Google, one optional
  "Get brief alerts on WhatsApp" step. Refines D2. *Revisit if* WhatsApp OTP delivery < 95% or cost per signup > ₹1.

## D14 · Instagram handle: required at signup vs optional
- **Required:** the handle is what powers auto-fill, matching and quality score; a creator profile without it is unusable to AMs.
- **Optional:** event talent (promoters, crew) may not have a meaningful IG; forcing it blocks them.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Required for everyone | 3 | 5 | 2 | 3 | 13 |
| Optional for everyone | 2 | 5 | 3 | 1 | 11 |
| **Required on creator path, optional on event path** | 5 | 4 | 4 | 3 | **16** |

- **Verdict:** Creator path requires the handle (the only typed field); event path asks for roles + phone, IG optional.

## D15 · When to ask for Instagram Login (verified insights)
- **At signup:** best data from day one; free API calls replace Apify cost.
- **After first shortlist:** signup stays one field; creator has a reason ("brands are reviewing you") to connect.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| At signup | 3 | 3 | 2 | 4 | 12 |
| **After first shortlist (+ profile-strength nudge)** | 4 | 4 | 4 | 4 | **16** |

- **Verdict:** After first shortlist. *Revisit if* < 15% of shortlisted creators connect within 30 days.

## D16 · WhatsApp: Meta Cloud API direct vs a BSP (AiSensy, Interakt, Gupshup)
- **Direct:** no per-message mark-up or platform fee; full control of webhooks and Flows; one less vendor holding creator data.
- **BSP:** live in days, template-approval help, ready dashboards and broadcast tools for non-engineers.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| **Cloud API direct** | 4 | 3 | 3 | 4 | **14** |
| BSP | 4 | 4 | 3 | 2 | 13 |

- **Verdict:** **Direct**; start Meta Business verification now. Use a BSP only as a stop-gap if verification takes > 3 weeks.
  Closes the PRD open question.

## D17 · Brief alerts: instant per brief vs weekly digest
- **Instant:** gigs fill fast; first responders are the most engaged.
- **Digest:** fewer marketing messages (each ~₹0.86), less spam, better WhatsApp quality rating.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Instant to all eligible | 4 | 1 | 1 | 2 | 8 |
| Weekly digest only | 2 | 5 | 4 | 2 | 13 |
| **Instant to top-N matches (≤ 2/week per creator), digest for the rest** | 5 | 4 | 4 | 4 | **17** |

- **Verdict:** Hybrid with caps.

## D18 · Content review: build a review room vs use Drive/Frame.io links
- **Build:** versions tied to bookings, frame comments become creator tasks, approvals gate payouts — the review data is the product.
- **Reuse:** Frame.io-class tools are excellent and free to start; zero build.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Drive/WhatsApp links (status quo) | 1 | 5 | 2 | 1 | 9 |
| Frame.io-style third party | 4 | 4 | 3 | 1 | 12 |
| **Lightweight in-house (R2 + `<video>` + timestamp/frame comments)** | 5 | 2 | 4 | 5 | **16** |

- **Verdict:** Build the lightweight room (RV-1…RV-8); no transcoding in v3.

## D19 · Use D1 for anything?
- **Yes:** edge-local reads for public directory pages; free 5 GB.
- **No:** a second database means sync jobs and two sources of truth; RLS lives in Postgres.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| D1 read replica of public profiles | 3 | 2 | 2 | 2 | 9 |
| **No business data in D1; ISR (R2) + KV for edge reads; D1 only if OpenNext tag cache requires it** | 4 | 5 | 5 | 2 | **16** |

- **Verdict:** No. Refines D9.

## D20 · Instagram refresh cadence: weekly for all vs tiered by activity
- **Weekly for all:** simple, always-fresh data.
- **Tiered:** spend follows value — hot creators refreshed often, dormant rarely.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Weekly for all (~$1,120/mo at 100K) | 4 | 1 | 4 | 2 | 11 |
| **Tiered (signup/hot/active/warm/cold) + Instagram Login daily (~$290/mo)** | 4 | 5 | 4 | 3 | **16** |

- **Verdict:** Tiered (`09` §6), plus an on-demand refresh before any shortlist is shared.

## D21 · Contracts: click-accept with OTP vs Aadhaar eSign
- **Click-accept + OTP:** instant on mobile, free, valid as an electronic contract with a logged audit trail.
- **Aadhaar eSign:** strongest evidence; brands with legal teams prefer it; costs per signature and adds steps.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| Aadhaar eSign always | 3 | 2 | 4 | 3 | 12 |
| Click-accept always | 4 | 5 | 3 | 2 | 14 |
| **Click-accept default; eSign above a fee threshold (e.g., ₹1L) or on brand request** | 5 | 4 | 4 | 3 | **16** |

- **Verdict:** Threshold model; legal to confirm the template and threshold.

## D22 · Student verification: college email vs ID upload vs DigiLocker
- **College email OTP:** instant, free, strong where colleges issue email.
- **ID upload:** works for every college; needs manual review and careful PII handling.
- **DigiLocker / APAAR:** government-grade, but integration and partner approval effort.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| **Email OTP first, ID upload fallback (auto-deleted after review)** | 4 | 4 | 4 | 4 | **16** |
| DigiLocker now | 5 | 1 | 3 | 4 | 13 |

- **Verdict:** Email + ID fallback; DigiLocker when student-badge fraud appears or brands pay for it.

## D23 · Draft video: R2 + browser playback vs Cloudflare Stream
- **R2:** cheapest, zero egress, simple; originals kept for frame accuracy.
- **Stream:** adaptive bitrate on weak 4G, HEVC/iPhone handling, thumbnails out of the box.

| Option | Value | Cost | Risk | Diff. | Total |
|---|---|---|---|---|---|
| **R2 originals + MP4 playback; client-side proxy for HEVC** | 4 | 5 | 3 | 3 | **15** |
| Stream for all drafts | 5 | 2 | 4 | 3 | 14 |

- **Verdict:** R2 now. *Revisit if* > 15% of drafts fail to play in browsers or review-room LCP on 4G > 3 s.
