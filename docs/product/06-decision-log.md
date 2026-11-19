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
