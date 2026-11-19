# Teardown · Collabstr (collabstr.com)

> Research date: 19 Nov 2026. Labels: **[F]** fact on a cited page, **[I]** inference, **[A]** to verify in-app.

## 1. Surfaces collected

| Surface | URL |
|---|---|
| Home (brand-facing) | https://collabstr.com/ |
| Pricing | https://collabstr.com/pricing |
| Creator landing | https://collabstr.com/creator |
| Public creator profile | https://collabstr.com/tikicaldwell |
| Approve & pay feature page | https://collabstr.com/features/approve-and-pay/ |
| Help: join as creator | https://help.collabstr.com/en/article/join-as-a-creator-1huw5to/ |
| Help: for brands | https://help.collabstr.com/en/category/for-brands-on2yd6/ |
| Reviews | https://www.trustpilot.com/review/collabstr.com , https://www.reddit.com/r/UGCcreators/comments/1h75h9f/is_collabstr_legit/ |

## 2. Information architecture

- Home leads with a **search bar + platform picker** (Instagram, TikTok, UGC, YouTube, X, Twitch, Amazon, Snapchat) and ~25 niche chips [F home].
- Curated SEO collections as pills: "Rising Instagram Stars", "Under $250", "UGC", "Fashion"… each a filtered URL (`/influencers?qs=under_250&pmi=50&pmx=250`) [F] — **filters are encoded in shareable URLs**.
- Home's 7-tab workflow: Find & Hire · Campaigns · Chat & Negotiate · Approve & Pay · Track & Report · Team · Bring Creators [F].
- Personas: Marketing teams, Agencies, Founders, Enterprise [F].
- Scale claims: 1.3M+ creators, 560,000+ brands registered, 100,000+ pieces of content, 48,000+ 5-star reviews [F home].

## 3. Flows — signup → first value

**Creator** [F help article]:
1. Enter desired **username** on /creator → "Claim" (vanity URL first — a commitment device).
2. Download the mobile app to finish signup (web hands off to app).
3. Email verification code.
4. **Credit card on file** "to verify your identity" — not charged unless policy is violated (e.g. taking gifted product without delivering).
5. Complete profile: profile + cover images, title, description, past content, packages with prices, optional fields "to improve visibility".
6. **Manual review** — "Not all applications are approved."

Field count to listing **[I]**: username, email, code, card (4 fields), name, location, platforms + handles, niches, title, description, ≥3 images, ≥1 package (name, description, price, platform) ≈ **15–20 inputs**. Heavy, but the payoff is a public, bookable storefront.

Agencies: "there isn't a separate portal for agencies or talent managers" — each creator needs their own account [F help].

**Brand:** search is free and anonymous; analytics and reviews are blurred behind "Create a free account to unlock analytics for 1.3m+ creators" [F profile CTA]. First value = Add to Cart on a fixed-price package — "Your next creator collaboration is three minutes away" [F home]. Time-to-value: minutes.

## 4. Creator profile / media-kit anatomy

From https://collabstr.com/tikicaldwell [F]:
1. Hero photo gallery (7) + "Show all photos"; Share / Save.
2. Title line "Fashion/ Model/ Beauty influencer", name, city/country.
3. Platform follower chips (IG, TikTok, X, Snapchat).
4. **Badges:** "Top Creator", "Responds Fast".
5. **Packages (rate card):** e.g. 1 IG feed post $200, 1 IG Reel $250, 3 UGC photos $300 — each with a one-paragraph deliverable description. CTAs **Add to Cart** and **Negotiate a Package**.
6. Analytics (gated): followers, **avg Reel views**, audience location %, age bands, gender split.
7. Reviews: overall stars + count, sub-scores **Communication / Timeliness / Satisfaction**, list of brand reviews with dates. Home cards show 2–4-word review snippets ("fast, patient with changes").
8. Portfolio (3 items). FAQ ("What brands have you worked with?", "Who is your audience?").
9. SEO title: "Promote with <Name> (@handle) | Instagram & UGC Influencer".

## 5. Implied data model [I]

`Creator(username, location, niches[], platforms[{handle, followers, avg_views}], audience{geo%, age%, gender%}, badges[], packages[], portfolio[], faq[])`
`Package(platform, title, description, price, delivery_days?)` · `Order(brand, package|offer, escrow_amount, fee, status: placed→in_progress→delivered→revision→approved→paid|refunded)`
`Campaign(brief, targeting{niche, location, demographics}, invites[], applications[{creator, quoted_price}])`
`Review(order, communication, timeliness, satisfaction, text)` · `TrackedPost(url, window=3 weeks, metrics)` · `Workspace(subaccounts[], seats[], roles)`

## 6. Feature inventory

| Feature | User | Depth | Evidence |
|---|---|---|---|
| Public search 1.3M creators, filters (platform, niche, location, followers, ER, age, ethnicity, language) | Brand | 3 | /pricing |
| Fixed-price packages + cart | Brand | 3 | profile |
| Campaign brief → creators apply with pricing; "AI campaign" brief generation; instant creator match | Brand | 2 | home, /pricing |
| Chat & negotiate (paid plans) | Both | 2 | /pricing |
| **Escrow → submit → request revision → one-click approve → auto payout** | Both | 3 | /features/approve-and-pay |
| Payouts + tax docs in 150 countries | Creator | 3 | home |
| Live post tracking (5/15/unlimited posts, 3-week window) | Brand | 2 | /pricing FAQ |
| Engagement & fake-follower reports (20/50/unlimited) | Brand | 2 | /pricing |
| Reviews with 3 sub-scores | Brand | 3 | profile |
| Team seats, subaccounts, white-label reports | Agency | 2 | /pricing Enterprise |
| Bring your own creators into same workflow | Brand | 2 | home |
| WhatsApp | — | 0 | absent |

## 7. Visual & motion system

Branding extraction of https://collabstr.com/ [F]:

| Token | Value |
|---|---|
| Primary ink | `#252B37` slate; text `#333333` |
| Secondary | `#BDB4FE` lavender |
| Accent / CTA | `#FC85B1` candy pink (primary button fill) |
| Background | `#FFFFFF` |
| Type | **Inter** throughout; H1 60 px, H2 48 px, body 16 px; italic emphasis word in H1 |
| Radius | 12 px cards; **41 px pill** primary; 24 px secondary |
| Imagery | Real creator photos in cards; 25 custom niche line-icons (`niche-icons/*.svg`); product screenshot "feature cards"; testimonial portraits. No 3D. |
| Motion | Logo marquee (duplicated logos) [F]; strikethrough "~~40 hours~~ 1 hour" stat; tabbed workflow switcher [F]. |

## 8. Tech fingerprint

- Server-rendered pages with `/static/igmarketplace/…` asset paths → **Django** app named "igmarketplace" [I — Django `static/<app>/` convention].
- Media on **AWS CloudFront** (`d5ik1gor6xydq.cloudfront.net`), some Cloudinary [F].
- Native iOS/Android apps; "Continue in app" interstitial on mobile web [F].
- Help centre on **Crisp** (`help.collabstr.com/en/article/...-xxxx/` slug pattern) [I].

## 9. Positioning & pricing

From https://collabstr.com/pricing [F]:

| Plan | Price | Key limits |
|---|---|---|
| Free | $0 | Search, direct hire, escrow, **10% brand fee** |
| Pro | $249/mo annual | 1 campaign/mo, 15 invites, chat before order, 5 tracked posts, 20 reports, 10% fee |
| Premium | $333/mo annual | Unlimited campaigns, 30 invites, 15 tracked posts, 50 reports, **5% fee** |
| Enterprise/Agency | from $1,000/mo | Subaccounts, roles, white-label reports, consolidated invoicing |

**Creators pay a separate 15% fee on payout** [F pricing FAQ]. Paywalled: campaigns, pre-order chat, tracking, audience reports.

## 10. Gaps & complaints

- Trustpilot "top mentions": creators dropping out after receiving product, delivering content different from what was agreed, **deleting a post soon after it went live**, returning product without approval [F https://www.trustpilot.com/review/collabstr.com].
- r/UGCcreators asks "Is Collabstr legit?" — beginner creators unsure of value of joining [F https://www.reddit.com/r/UGCcreators/comments/1h75h9f/is_collabstr_legit/].
- Double-sided take (10% + 15%) pushes deals off-platform [I].
- No agency/talent-manager portal [F help]. Mandatory credit card for creators is a high-friction step for students [I].
- US/global — no INR, UPI, GST, WhatsApp, college data [I].

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| Fixed packages on profile | **Adopt (internal)** | Creators enter indicative packages (Reel, Story, Post, event hour); shown to Vigor staff and in brand review rooms, not as a public cart. |
| Review sub-scores Communication / Timeliness / Satisfaction | **Adopt + extend** | Rated by Vigor reviewers per booking; add "Brief compliance". Feeds rank. |
| Escrow + revision + one-click approve | **Adopt the state machine, not escrow** | Draft → revision → approved → live → paid states per deliverable; money moves outside (v2 non-goal). |
| Post-deletion complaint | **Beat** | Live-link monitoring at 24h/72h/7d flags deleted posts automatically. |
| Claim-your-username first | **Adopt** | First screen = Instagram handle (doubles as vanity URL `vigor.network/@handle`). |
| Credit card for creators | **Avoid** | Use phone OTP + Instagram verification + reliability score instead. |
| Filters encoded in URLs / curated collections | **Adopt** | Saved searches as shareable URLs ("Pune food creators 2027 batch"). |
| No agency portal | **Beat** | Agency is the primary user; roles for AM, scout, reviewer, finance, founder. |
