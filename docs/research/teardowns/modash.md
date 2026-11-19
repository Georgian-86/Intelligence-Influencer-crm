# Teardown · Modash (modash.io)

> Research date: 19 Nov 2026. Labels: **[F]** fact on a cited page, **[I]** inference, **[A]** to verify.
> Why it matters: the benchmark for **zero-signup creator data** (380M+ indexed public profiles) plus a
> deal CRM, tracking and payouts — the "creators shouldn't have to work for your software" philosophy.

## 1. Surfaces collected

| Surface | URL |
|---|---|
| Pricing + full feature matrix | https://www.modash.io/pricing |
| Feature pages | https://www.modash.io/features/influencer-discovery , /features/influencer-management , /features/influencer-tracking , /influencer-payments |
| API | https://www.modash.io/influencer-marketing-api , https://docs.modash.io/ |
| Signup | https://marketer.modash.io/register/marketer |
| Product tour | https://www.modash.io/product-tour |
| Help | https://help.modash.io/ |

## 2. Information architecture

App nav (seen in mega-menu mock): **Discover · Manage · Email · Track · Pay · Learn · Support** [F pricing page nav]. Separate API product (Discovery, Raw, AI search, lookalikes, collaborations) [F]. Use-case pages: Gifting, Affiliates, Paid partnerships [F].

## 3. Flows — signup → first value

**Brand** [F pricing FAQ]: register → 14-day trial, **no credit card** → limits: 20 profile opens, 6 email unlocks, 10 tracked creators. First value = a filtered search result list with ER and audience demographics in the first minute [I]. Interactive product tours for pre-signup evaluation [F].

**Creator:** **no signup at all** — "Creators get discovered without signing up or doing anything", "No re-authentication or recurring access requests", "Creators don't upload screenshots, links, or performance reports", "Outreach comes from real brand emails, not generic platform inboxes" [F pricing "Better for creators"]. Fields asked of creators: **0**.

## 4. Creator profile anatomy (brand-side)

From the feature matrix [F]: followers, follower growth, ER, views, audience location/demographics/interests/**quality (fake followers)**, performance insights, **brand collabs timeline** (incl. IG Stories, sector match), lookalikes, content history; downloadable **creator PDF** ("Download profiles"). In CRM: status, labels, documents, notes, address, birthday, rates, activity timeline (every email, status change, campaign, code).

## 5. Implied data model [I]

`IndexedProfile(platform, handle, followers, growth, er, avg_views, audience{geo, age, gender, interests, credibility}, bio, captions, hashtags, songs, city, brand_collabs[])`
`Creator(person) ← profiles[] (cross-platform, up to 6)` · `List(filters, members)` · `Relationship(creator, status(custom), labels[], rates, notes, docs)`
`Campaign(workflow statuses(custom), tracked_creators[], collectors{all|sponsored by tag/mention/keyword})`
`Content(post, metrics, EMV, audit_trail_of_manual_edits)` · `Payment(request, invoice, approval_rounds, payout)` · `Affiliate(code, link, commission_tier, sales)`
`Seat(role: full|limited — sees only assigned lists/campaigns, financials hidden)`

## 6. Feature inventory (selected)

| Feature | User | Depth | Evidence |
|---|---|---|---|
| 380M+ profiles ≥1K followers (IG, TikTok, YT) | Brand | 3 | pricing |
| AI natural-language search, **image search**, **audio/song search**, handle search for un-indexed accounts | Brand | 3 | pricing |
| Filters incl. bio/caption include/exclude, hashtags, **city** | Brand | 3 | pricing |
| Lookalikes; "influential fans/customers" (who already follows you) | Brand | 3 | pricing |
| Brand-mention monitoring with sentiment | Brand | 2 | pricing |
| CRM with custom statuses per campaign, custom columns, bulk actions | Brand | 3 | pricing |
| **Limited team access** for freelancers/regional managers, financials hidden | Agency | 2 | pricing |
| Gmail/Outlook 2-way sync, templates, sequences, team inbox | Brand | 3 | pricing |
| Auto content collector (no tags needed), ad-disclosure compliance alerts, missed-hashtag alerts | Brand | 3 | pricing |
| CPM/CPE/CPV/ROAS per creator; manual metric edits with audit trail | Brand | 3 | pricing |
| Payouts 180+ countries, approval rounds, invoice generator, bulk CSV payments | Brand | 3 | pricing |
| Shopify gifting + affiliates | Brand | 3 | pricing |
| **MCP connector** (Claude/ChatGPT/Cursor) on every plan | Brand | 2 | pricing |
| WhatsApp | — | 0 | absent (email-only outreach) |

## 7. Visual & motion system

Not extracted with tokens this pass (credits ran out). Observed from asset names on https://www.modash.io/pricing [F]: **sticker-style illustration** (`post_sticker`, `sticker-peach`, `sticker-purple`, Gmail/Excel/Doc app-icon stickers), AVIF product UI crops, an animated product-UI mega-menu, rolling digit counters on prices ("$0123456789…$199") [F]. Palette/typography: **[A]** verify (peach + purple accents implied by sticker names).

## 8. Tech fingerprint

**Webflow** marketing site (`generator: Webflow`, `cdn.prod.website-files.com`) [F]; app on `marketer.modash.io` [F]; help centre on help.modash.io; webinars via Contrast [F].

## 9. Positioning & pricing

[F https://www.modash.io/pricing]

| Plan | Price | Limits |
|---|---|---|
| Essentials | $199/mo (annual) | 2 seats, 300 profile opens, 150 email unlocks, 100 tracked creators |
| Performance | $499/mo (annual) | 5 seats, 800 opens, 400 unlocks, 250 tracked; payments + affiliates (0% fee to $10K/yr, then 5%) |
| Enterprise | from $1,225/mo | custom; 0% fee to $100K/yr |

Metering rationale stated openly: "We limit email unlocks to protect influencers from exploitative offers and spam" [F] — the model for Vigor's contact-unlock metering.

## 10. Gaps & complaints

- No review mining this pass (credit limit). Known structural gaps [I]: email-only outreach (Indian micro/college creators live on WhatsApp/DM), public-email availability is low for students, no talent-side app so no availability/consent/college data, audience data for tiny accounts is noisy, USD pricing.

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| Zero-signup indexing of public profiles | **Adopt (hybrid)** | Scouts add any handle → auto-fetched "shadow profile"; creator later **claims** it in one tap from a WhatsApp invite. |
| Metered unlocks justified as anti-spam | **Adopt** | Partner agencies get N contact unlocks/month; every reveal logged and visible to the creator. |
| Limited seats with financials hidden | **Adopt** | Execution team and freelance scouts see assigned campaigns only; fees/margins hidden. |
| Auto-collector + compliance alerts | **Adopt** | Detect live posts without asking creators for links; flag missing #ad / brand tag. |
| Manual metric edits with audit trail | **Adopt** | Story views come from screenshots → editable with audit log. |
| MCP connector | **Later** | Expose Vigor search/briefs to the founder's AI tools. |
| Email-only outreach | **Beat** | WhatsApp templates as the primary channel, email secondary. |
