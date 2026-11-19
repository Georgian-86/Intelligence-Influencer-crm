# Teardown · Wobb (wobb.ai)

> Research date: 19 Nov 2026. Labels: **[F]** fact on a cited page, **[I]** inference, **[A]** to verify.
> Chosen over Winkl because Wobb has a live **creator app + barter marketplace** aimed at Indian
> micro/nano and campus creators — the closest product to Vigor's creator side.
> Coverage caveat: home and pricing were scraped; the creator app was **not** walked through (sandbox
> blocks wobb.ai and Firecrawl credits ran out), so creator-flow details come from store listings and
> third-party reviews.

## 1. Surfaces collected

| Surface | URL |
|---|---|
| Home | https://wobb.ai/ |
| Pricing | https://wobb.ai/pricing |
| Barter "Launchpad" | https://wobb.ai/launchpad (not scraped) |
| Managed services / API | https://wobb.ai/managed-services , https://wobb.ai/influencer-api |
| Creator app | https://apps.apple.com/us/app/id1538489817 , https://play.google.com/store/apps/details?id=ai.wobb |
| Shopify app | https://apps.shopify.com/wobb |
| Third-party reviews | https://www.softwareadvice.com/marketing/wobb-profile , https://www.influencer-hero.com/blogs/wobb-pricing (competitor-authored), https://www.creator-hero.com/blog/wobb-pricing-and-review |

## 2. Information architecture

Brand web app (`app.wobb.ai`): Discovery (400M+ profiles, 20+ filters) → Analytics → Outreach (bulk invites) → Campaign marketplace postings → Lists → Export [F home/pricing]. Plus Launchpad (barter-only programme), managed services, an influencer data API and white-label add-on [F]. Creator side: mobile app "Wobb: Influencer Marketing Hub" [F store].

## 3. Flows — signup → first value

**Creator** [F App Store listing summary via search]: download app → **sign up with OTP** → set up profile → explore and apply to **barter and paid** campaigns (Instagram & YouTube) → in-app chat with brands. Field count **[A]** — likely phone, name, handle(s), niche, city, gender, address for product shipping.

**Brand** [F home/pricing]: "Start Free 3-Day Trial" (third-party reviews mention 14 days — conflicting) → search → unlock contacts → post a campaign → receive applications ("100+ pre-qualified applications per campaign" per a review [F creator-hero/influencer-hero]) → ship product via Shopify integration → track deliverables.

## 4. Creator profile / media-kit anatomy [I]

Brand-side analytics card: followers, ER, audience demographics, audience quality, growth trends, content quality [F home "Deep Analytics"]. Contact unlock reveals **verified email and phone** [F pricing]. No public creator pages seen.

## 5. Implied data model [I]

`IndexedProfile(400M)` · `CreatorAccount(phone, profile, address)` · `Campaign(type: barter|paid, platform, brief, slots)` · `Application(creator, status)` · `Shipment(Shopify order)` · `Deliverable(link, status)` · `Credits(search_results, analytics, unlocks, postings)`

## 6. Feature inventory

| Feature | User | Depth | Evidence |
|---|---|---|---|
| Discovery 400M+, 20+ filters | Brand | 2 | home |
| Contact unlock (email **and phone**) | Brand | 2 | pricing |
| Bulk invites with templates (each burns a search credit) | Brand | 2 | pricing |
| Campaign posting to creator marketplace (1/5/unlimited) | Brand | 2 | pricing |
| Barter/gifting programme ("Launchpad") | Brand/Creator | 2 | home |
| Shopify product shipping | Brand | 1 | apps.shopify.com/wobb (no reviews) |
| Gmail/Outlook integration, export, white-label ($200/mo) | Agency | 1 | pricing |
| Creator app with OTP signup, apply, chat | Creator | 2 | App Store |
| Managed services (full-service agency arm) | Brand | 2 | home |
| WhatsApp | — | 0? | not advertised [A] |

## 7. Visual & motion system

Branding extraction of https://wobb.ai/ [F]: primary `#166DF4` blue on white, text `#09090B`, grey `#4B5563`; system **ui-sans-serif** stack (no brand font); radius 4–8 px; subtle `0 1px 2px` shadow; **Tailwind + shadcn/ui** defaults. Imagery = product screenshots + client logos marquee; emoji in announcement bar. Reads as template-default SaaS — little brand distinctiveness [I].

## 8. Tech fingerprint

Tailwind + shadcn [F extraction]; asset path `/attached_assets/` with screenshot filenames like `Screenshot 2025-04-24 at 5.34.19 PM.jpg` [F] — `attached_assets` is Replit's convention, so the marketing site was likely built on Replit [I]. Vite-style hashed bundles (`/assets/discovery_1-hi2kOD1t.webp`) [F]. Calendly for demos [F]. Registered in Delhi (Shopify developer address) [F].

## 9. Positioning & pricing

[F https://wobb.ai/pricing] Basic $99/mo (5,000 search results, 250 analytics, 1 posting, 1,000 unlocks, 1 seat) · Pro $279/mo (20K results, 400 analytics, 5 postings, 2,500 unlocks, 5 seats) · Unlimited $499/mo (fair-use; unlimited results/postings/unlocks, 1,000 analytics, unlimited seats). Yearly saves 40%. Clients claimed: Marico, HDFC Life, Meesho, Plum, Super Bottoms [F home]; "5,000+ agencies and D2C brands" [F].

## 10. Gaps & complaints

- Software Advice reviewer: "UX needs improvement" and wants "more active influencers for the campaign" [F https://www.softwareadvice.com/marketing/wobb-profile].
- "Almost everything you do inside it burns credits, and credits run out faster than most teams expect" [F competitor-authored review, influencer-hero.com — weigh accordingly].
- Ratings strong but on a thin review base (G2 ~4.8) [F creator-hero].
- Pivot from Indian barter marketplace to global "AI platform" copy dilutes the India/campus story [I].

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| OTP signup → apply to barter/paid briefs | **Adopt** | Phone/WhatsApp OTP or Google; first brief visible before profile is complete. |
| Barter as an entry tier | **Adopt** | Barter briefs for nano college creators; rank and reliability grow from barter completions. |
| Credit-burning on every action | **Avoid** | Meter only contact unlocks for partner agencies; never meter internal Vigor staff. |
| Phone numbers in unlocks without creator consent | **Avoid** | Consent-gated reveal (see HashFame connection request). |
| Generic shadcn look | **Beat** | Vigor's dark "backstage" system with rank metals is a real differentiator in this category. |
| Managed services beside SaaS | **Note** | Same hybrid as Vigor — but Vigor's moat is the college pool, not a 400M scrape. |
