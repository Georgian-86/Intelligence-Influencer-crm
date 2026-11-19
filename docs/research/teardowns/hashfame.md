# Teardown · HashFame (hashfame.com)

> Research date: 19 Nov 2026. Extends `docs/product/01-market-and-competitors.md` (which covers HashFame's
> positioning, the ~70K launch number, the ISB report and Brand Interest Signals) — this file adds the
> walk-through, profile anatomy, visual system and fingerprint. Labels: **[F]** fact seen on a cited page,
> **[I]** inference, **[A]** assumption still to verify inside the app (we did not create an account).

## 1. Surfaces collected

| Surface | URL | Notes |
|---|---|---|
| Creator landing | https://hashfame.com/ | Creator-facing; "No Insta login needed" [F] |
| Brand/agency landing | https://hashfame.com/brands | Claims **140,000+ professional creators** [F] (up from ~70K at launch, see 01-doc) |
| Public creator profile | https://hashfame.com/@foodpharmer | SEO-indexed, `index, follow` [F] |
| Find influencers directory | https://hashfame.com/find-influencers | Linked from footer [F] |
| Play Store | https://play.google.com/store/apps/details?id=com.qoruz.nexus&hl=en_IN | 1 lakh+ downloads, updated 29 Oct 2026 [F] |
| App Store | https://apps.apple.com/in/app/hashfame/id6452017249 | Mixed ratings by storefront [F] |
| Footer "services" | Influencer marketing, Talent mgmt, Meme marketing, UGC, Event marketing, PR… → all `/comingsoon` [F] | Signals an intent to become a services marketplace [I] |

## 2. Information architecture

- **Web = marketing + public profiles only.** Every CTA pushes to the native app (Play/App Store badges, QR modal) [F, home + brands pages]. The product lives in the app [I].
- **Audiences:** creators, celebrities/talent managers, brands, agencies [F footer copy: "OPEN Professional Network for Creators, Celebrities, Talent Managers and Brands"]. "For Talent Managers" page is still `/comingsoon` [F].
- **In-app nav (from Play listing feature list)** [F]: Discovery (search + 140+ categories) · Inbox ("one inbox for chats, briefs, and terms") · Campaigns ("live brand campaigns and collab requests") · Work Mode (availability toggle) · Insights (profile views and interest).
- Latest release notes add "better visibility for creators in campaigns section", "competition analytics for creators", "easier approval process for brand and agencies after listing a campaign" [F Play listing] → HashFame is **moving from directory to light campaign posting** [I]. Our 01-doc claim that it "stops at discovery" is now only partly true.

## 3. Flows — signup → first value

**Creator** (from landing FAQ + App Store notes; field-level walk-through **[A]**, not verified):
1. Install app (web cannot sign you up) [F].
2. Phone-based account [I — Play data-safety lists "Personal info, Contacts"].
3. Profile is built **without Instagram OAuth** — "Your profile is created independently, and you control what information is shared" [F home FAQ]. Follower counts on profiles still appear (4.1M IG, 2.2M YT on @foodpharmer) [F], so counts are fetched from public data or self-entered [I].
4. Previously waitlisted with manual approval; App Store notes now say creators can sign up directly without a waitlist [F via App Store listing summary, https://apps.apple.com/in/app/hashfame/id6452017249].
5. Brands send **connection requests creators accept/reject before chat opens** [F App Store notes] — the anti-spam valve.

Estimated fields to a listed profile **[I]**: name, phone (OTP), photo, social handles, category + sub-category, language(s), city/state, profession (full-time/part-time), commercial terms, manager (optional) ≈ **9–11 fields**. Nothing about college/course/year.

**Brand:** install → sign up with **work email** (public email domains blocked per developer reply on App Store) [F] → manual vetting → search → call/WhatsApp/chat. First value = a creator's verified phone number, the thing reviewers praise: "Even paid softwares don't give direct contact numbers" [F testimonial, /brands].

Time-to-value: brand side gated by manual approval (hours–days) [I]; creator side gated by first inbound request.

## 4. Creator profile / media-kit anatomy (public page)

From https://hashfame.com/@foodpharmer [F]:

1. Photo, name, primary category + sub-category, city/state.
2. Photo strip (3 images).
3. **Social proof counter:** "691 brands connected • in past 6 months".
4. **Rank chips:** "Top 1% in Kolkata", "Top 5% in Health", "Top 5% in Wellness Nutrition & Diet Advice" — percentile rank by **city** and **category**.
5. **Managed by** <manager name> + "Verified contact for partnerships" seal.
6. Socials with follower counts (IG, YT).
7. Content category, content language, primary location, full-time profession.
8. "Payment & Commercial terms: Flexible (Depends)" — no rate card.
9. CTA "Get in touch" (into app). Page title is "<Name> – Contact for Collaborations".

No ER, no audience demographics, no content grid, no past brands list, no reviews on the public page [F, absent]. Builtin.com describes "anonymous reviews on creator behavior" for brands [F https://builtin.com/company/hashfame] — so reviews exist privately, brand-side.

## 5. Implied data model [I]

`Creator(name, phone✓, photos[], categories[], subcategories[], languages[], city, state, profession_type, commercial_terms_enum, manager_id?, work_mode:boolean, socials[{platform, handle, followers}])`
`Manager(name, verified, creators[])` · `Brand(org, verified_work_email, members[])`
`ConnectionRequest(brand→creator, status: pending/accepted/rejected)` · `Conversation` · `Campaign(brief, applications[])` (new)
`Signals: brands_connected_6mo, percentile_rank{city, category}, profile_views, interest`
`BrandReview(creator, anonymous, behaviour)`

## 6. Feature inventory

| Feature | User | Depth 1–3 | Evidence |
|---|---|---|---|
| Category/city discovery, 140+ categories | Brand | 2 | Play listing |
| Direct call/WhatsApp/chat | Brand | 3 | Instagram bio https://www.instagram.com/hashfame_/ ; /brands testimonials |
| Connection-request gate | Creator | 2 | App Store notes |
| Work Mode availability | Creator | 1 | Play listing |
| Profile-view / interest insights | Creator | 1 | Play listing |
| Percentile rank chips (city, category) | Both | 2 | @foodpharmer page |
| Talent-manager attribution | Manager | 2 | @foodpharmer page |
| Campaign listing + applications | Brand/Creator | 1 (new) | Play release notes |
| Anonymous creator-behaviour reviews | Brand | 1 | builtin.com |
| Briefs/approvals/payments/reports | — | 0 | absent |

## 7. Visual & motion system

Source: Firecrawl branding extraction of https://hashfame.com/ [F] + asset names [F].

| Token | Value |
|---|---|
| Primary | `#51099C` deep violet; accent/link `#6049F5`; soft button fill `#DFDBFD` |
| Ink | `#030312` near-black (footer, secondary buttons) |
| Background | `#FFFFFF` (light scheme) |
| Type | **DM Sans** for everything; H1 56 px, H2 44 px, body 18 px |
| Radius | 16 px cards; **36 px pill** primary buttons; square-cornered dark secondary |
| Spacing | 4-pt base |
| Imagery | Real creator portraits in phone mock-ups (`phoneImgWrapper.avif`); carousel of creator cards with platform icons; flat 2D illustration (`app_creators_homepage_illustration.webp`); "doodle" accents. No 3D. |
| Motion | Auto-scrolling creator carousel and avatar marquee (duplicated image lists = infinite loop) [I]; video testimonials with pause icons [F]. |
| Tone | "Serious Brands. Only." / "Only Serious Business" — exclusivity and professionalism, LinkedIn-for-creators [F]. |

## 8. Tech fingerprint

- **Next.js** (pages router) — `next-head-count` meta tag on every page [F].
- Media on **DigitalOcean Spaces, Singapore** (`live-hashfame.sgp1.digitaloceanspaces.com`) and legacy **AWS S3 ap-southeast-1 bucket `qoruz-nexus`** [F image URLs] → shares infra lineage with Qoruz; Android package is `com.qoruz.nexus` [F].
- AVIF/WebP assets; company entity **Datrux Systems Pvt Ltd**, HSR Layout, Bengaluru [F Play developer info].
- Native apps on both stores; web profiles server-rendered for SEO [I].

## 9. Positioning & pricing

- Promise: "professional network where brands discover and connect with creators directly. It isn't an agency or a campaign marketplace" [F home FAQ]. No commissions [F].
- Free for creators [F FAQ] and free for marketers [F App Store]. Creator subscription (~₹999/mo) was reported as planned (see 01-doc) — not visible on site today.
- Expanding to "More than Creators: Athletes, doctors, subject-experts" and "Collaborate on more than Sponsored Posts… longer-term deal formats" [F /brands].

## 10. Gaps & complaints

- Thin, polarised store ratings: US App Store 1.0 from 2 ratings; another aggregator 4.2 from ~100 [F via https://apps.apple.com/us/app/hashfame/id6452017249 and https://mwm.ai/de/apps/hashfame/6452017249].
- One App Store reviewer alleges it "collects data and sells it"; developer replied it vets users and blocks public email domains [F, unverified allegation]. Trust around **phone-number exposure** is the structural risk of the model [I].
- No reviews of complaints found on Reddit/G2 (G2 page exists only as an alternatives list: https://www.g2.com/products/hashfame/competitors/alternatives) [F].
- Walk-through gaps [I]: no rates → every lead starts a negotiation; no ER/audience data publicly; no execution tooling; web is a dead-end (must install app); no college/student dimension; no event/on-ground talent.

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| Percentile rank chips by **city** and **category** | **Adopt + extend** | Add rank by **college** and **campus city** ("Top 3% at NMIMS", "Top 5% food creators in Pune colleges"). Cheap to compute, massively shareable. |
| "N brands connected in past 6 months" | **Adopt** | Show "Shortlisted for N briefs · Booked N times" — demand proof that motivates creators. |
| No-Instagram-login signup | **Adopt (as default)** | Handle-only signup with public fetch; OAuth optional for verified insights. |
| Connection-request gate before contact | **Adopt** | Creator consents before phone/WhatsApp is revealed to a brand or partner agency. |
| Talent-manager attribution on profile | **Adopt** | `managed_by` on talent; route outreach to manager. |
| App-only product, web dead-ends | **Beat** | PWA: the public profile itself has "Express interest" and the creator can sign up from it in 60 s. |
| Phone-number directory as the value | **Avoid** | Contact-spam and data-sale suspicion. Vigor reveals contact through metered unlocks and logs every reveal. |
| No rate card ("Flexible") | **Beat** | Indicative rate band + Vigor's historical paid rates. |
