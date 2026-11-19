# Teardown · Kofluence (kofluence.com)

> Research date: 19 Nov 2026. Labels: **[F]** fact on a cited page, **[I]** inference, **[A]** to verify.
> Chosen over Plixxo because Kofluence is the Indian player that ships **escrow + TDS/GST handling +
> performance (CPA) payouts + a creator app** — the India-specific money workflow Vigor will eventually need.
> Coverage caveat: kofluence.com could not be fetched (sandbox DNS block, Firecrawl credits exhausted).
> Evidence is from search-indexed vendor pages, store listings and press. Treat as a **light-deep** teardown;
> re-run a walk-through when access allows.

## 1. Surfaces collected

| Surface | URL |
|---|---|
| Vendor pages (indexed) | https://www.kofluence.com/?p=69499 ("The Full-Stack Influencer Marketing Platform"), https://kofluence.com/?p=60978 |
| Diwali campaign guide (reports in Brand app) | https://www.kofluence.com/influencer-marketing-for-diwali-campaigns/ |
| Creator app (iOS) | https://apps.apple.com/app/id1488194664 , https://appadvice.com/app/kofluence-influencer-platform/1488194664 |
| App analytics | https://appgoblin.info/apps/1488194664 , https://appgoblin.info/apps/com.kofluence |
| Kofinity launch | https://cxotoday.com/media-coverage/kofluence-launches-kofinity-a-platform-for-budding-creators-to-partner-with-brands-seamlessly/ |
| Third-party | https://sourceforge.net/software/product/Kofluence/ , https://elev8or.io/alternatives/kofluence (competitor-authored) |

## 2. Information architecture [I from F snippets]

Brand app: discovery → campaign management → **content moderation** → reporting ("Reports section of the Brand's App") → payments [F search summary of kofluence.com pages]. Creator app: single app where influencers and brands collaborate "through Instagram and Facebook accounts" [F App Store]. **Kofinity**: separate on-ramp for budding creators [F cxotoday].

## 3. Flows — signup → first value

**Creator [A/I]:** App Store copy implies sign-in **via Instagram/Facebook** (Meta login), i.e. stats are auto-fetched via the Graph API rather than typed — the opposite choice to HashFame. Then browse campaigns, apply, submit content for moderation, get paid.
**Brand [I]:** largely managed-service + self-serve app; elev8or calls it "a managed-service, India-focused influencer platform" [F, competitor-authored].

## 4. Creator profile anatomy [A]

Not observed. Expected from Meta-login model: followers, reach/impressions insights, audience demographics from Instagram Insights, past campaigns.

## 5. Implied data model [I]

`Creator(meta_account, insights)` · `Campaign(type: fixed|performance(CPC/CPS/CPL))` · `Submission(content, moderation_status)` · `Payment(escrow, TDS, GST, payout)` · `Report(campaign)`.

## 6. Feature inventory

| Feature | User | Depth | Evidence |
|---|---|---|---|
| Self-claimed 750K+ verified creators, 4K+ campaigns, 700+ brands | — | — | kofluence.com homepage via search |
| Discovery + campaign mgmt + content moderation + reporting in one system | Brand | 2 | kofluence.com ?p=69499 |
| **Escrow-backed payments, automated TDS/GST** | Both | 3 | kofluence.com via search |
| **Performance payouts per click / sale / lead** | Creator | 2 | kofluence.com via search |
| Stripe integration | — | 1 | sourceforge listing |
| Creator app with Instagram/Facebook login | Creator | 2 | App Store |
| Kofinity for budding creators | Creator | 1 | cxotoday |

## 7. Visual & motion system

**[A]** Not captured this pass. Fingerprint below suggests a WordPress theme marketing site.

## 8. Tech fingerprint

WordPress — indexed URLs use `?p=<post_id>` permalinks [F URLs above] [I]. Native iOS + Android apps; Android ~10.7K monthly installs per aggregator [F appgoblin].

## 9. Positioning & pricing

"Largest AI-driven ad-tech influencer marketing platform in India" (self-claim) [F]. No public pricing found [F absent]. Promotional "Save 10%" pages exist [F https://www.kofluence.com/?p=60328] → sales-led, discount-driven [I].

## 10. Gaps & complaints

- iOS rating ~3.4★ from 22 ratings [F appgoblin]; no written payment-delay complaints found for Kofluence specifically [F search].
- Competitor page claims "limited payment options, standard Indian payments" [F elev8or, biased].
- Meta login is a known drop-off point for students with personal (non-professional) IG accounts [I; see `04-architecture-and-integrations.md`].

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| TDS/GST-aware payments | **Adopt (tracking now, rails later)** | Store PAN, GSTIN (optional), TDS % per booking; generate payout sheet; RazorpayX later. |
| Performance (CPA) campaigns | **Later** | Add `pricing_model: fixed|barter|cpa` on bookings so data is ready. |
| Content moderation stage | **Adopt** | Reviewer role with versioned drafts and checklist (already in PRD). |
| Mandatory Meta login | **Avoid as default** | Handle-first with public fetch; Instagram Login only to unlock verified insights badge. |
| Separate on-ramp for budding creators (Kofinity) | **Adopt idea** | "Rising" tier for nano/college creators with barter briefs, not a separate product. |
