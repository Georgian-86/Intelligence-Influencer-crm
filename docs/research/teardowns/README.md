# Competitor & adjacent-product teardowns — roll-up

> Research date: 19 Nov 2026, for Vigor Talent Network (Vigor Launchpad, Mumbai). Extends
> `docs/product/01-market-and-competitors.md`; read that first for market context.
> Method: `.claude/skills/reverse-engineer-product/SKILL.md`; matrix format from
> `.claude/skills/pm-competitive-research-snapshot/SKILL.md`.
> Labels: **[F]** seen on a cited page · **[I]** inference · **[A]** assumption / not re-verified this pass.
> We did not create accounts, so in-app screens are taken from marketing pages, store listings and help centres.
> Coverage limits: Firecrawl credits ran out after ~20 calls and the sandbox blocks wobb.ai and kofluence.com,
> so Wobb's creator app and all of Kofluence are lighter than the others. Light-tier rows marked [A] come from
> background knowledge and need a re-check before anyone quotes them externally.

## Deep teardowns

| Product | File | One-line read |
|---|---|---|
| HashFame | [hashfame.md](hashfame.md) | An app-first, LinkedIn-style directory of 140K+ Indian creators. Free, no Instagram login, brands get direct phone/WhatsApp. Now adding campaign listings. |
| Collabstr | [collabstr.md](collabstr.md) | A global marketplace with fixed-price packages, escrow, approve-to-pay, reviews and post tracking. Charges 10%/5% to brands plus 15% to creators. |
| Passionfroot | [passionfroot.md](passionfroot.md) | Began as a creator storefront, now an agent ("Zest") that runs B2B campaigns: plan → proposals → action center → wallet payouts → insights. |
| Modash | [modash.md](modash.md) | 380M indexed profiles with zero creator signup, plus a deal CRM, auto-tracking, payouts and an MCP connector. Usage is metered, and the metering is framed as anti-spam. |
| Wobb | [wobb.md](wobb.md) | Indian barter/paid marketplace with an OTP creator app and a credit-metered discovery SaaS ($99–$499). Phone-number unlocks. |
| Kofluence | [kofluence.md](kofluence.md) | Indian managed + app platform with escrow, TDS/GST and CPA payouts. Creators log in with Meta. (light-deep) |

## Light-tier snapshots

- **CreatorIQ** [A] (https://www.creatoriq.com/): enterprise creator-intelligence and CRM suite for global brands and large agencies, with deep Meta/TikTok/YouTube API partnerships, programme management, payments and benchmarking. Annual contracts sold through sales. Built for global CPG/retail scale, so it misses Indian micro and college creators and WhatsApp.
- **GRIN** [A] (https://grin.co/): e-commerce/Shopify-centric creator management covering discovery, Gmail outreach, gifting, affiliate links, content library and payments. Priced for funded DTC brands; US-centric.
- **Aspire** [A] (https://www.aspire.io/): creator marketplace plus CRM with inbound creator applications, gifting/affiliate workflows and Shopify. Focused on DTC ambassador programmes.
- **Upfluence** [A] (https://www.upfluence.com/): an all-in-one suite. Its distinctive move is a Chrome extension and "find creators among your customers". Offers affiliate/Shopify and payments. A Trustpilot page exists with mixed creator payout complaints (https://ie.trustpilot.com/review/upfluence.com).
- **Qoruz** [A] (https://qoruz.com/): Indian influencer discovery and analytics database for agencies and D2C, and HashFame's sibling (shared `qoruz-nexus` infra, see hashfame.md). Also publishes agency profiles, e.g. https://qoruz.com/agencies/profile/opa.
- **KlugKlug** [F]: Indian AI "influencer intelligence" SaaS offering discovery with ~15 filters, comment-sentiment analysis, affiliate features (used by Havas Media India) and a free D2C growth programme. Creator counts conflict across reports (250M global vs 11M India). Sources: https://www.afaqs.com/news/influencer-marketing/kalyan-kumar-and-vaibhav-gupta-launches-klugklug , https://www.storyboard18.com/amp/how-it-works/havas-media-india-partners-with-klugklug-to-elevate-influencer-marketing-for-brands-26632.htm
- **OPA (Wondrlab)** [F]: Indian influencer platform acquired by Wondrlab, with 300K+ influencers and 500+ brands (Nykaa, Sugar, Plum). In 2026 Wondrlab launched **WondrAgents**, an agentic AI layer across OPA/Opportune that claims up to 70% faster go-live. This is an Indian agency-holding company doing exactly the agent-runs-the-workflow play. Sources: https://www.afaqs.com/news/influencer-marketing/wondrlab-acquires-influencer-marketing-platform-opa , https://manifest-media.in/digital/070926/wondrlab-launches-wondragents-for-end-to-end-influencer-marketing.html
- **HYPD** [F]: Delhi creator-commerce platform. Creators build multi-brand storefronts "in under 30 seconds", native checkout, commission up to ~20%. Backed by Bhuvan Bam/Tanmay Bhat, pre-Series A from Orios. It is adjacent (monetisation, not campaigns), but its 30-second store setup is the onboarding bar Indian creators know. Sources: https://indianstartupnews.com/funding/creator-tech-startup-hypd-raises-funding-from-orios-venture-partners-and-existing-investors , https://inc42.com/?p=274810
- **Later Influence (ex-Mavrck)** [A] (https://later.com/influencer-marketing/): enterprise influencer suite attached to the Later social scheduler. Offers community/ambassador programmes, payments and reporting.
- **Agentio** [F]: a YouTube ad-slot marketplace. Creators list upcoming integration slots, and brands buy them directly or through AI contextual matching. It takes a 20% brand-side fee and nothing from creators. Raised $40M (Forerunner, Nov 2025) to expand beyond YouTube. It is the cleanest **inventory/availability** model in the set. Sources: https://techcrunch.com/2023/11/01/agentio-is-building-a-platform-for-youtubers-to-sell-ads-slots-in-their-videos , https://techcrunch.com/2025/11/18/agentio-secures-40-million-from-forerunner-as-it-scales-its-creator-marketplace-beyond-youtube/

## Comparison matrix (features × products)

Legend: ● strong · ◐ partial/basic · ○ absent · ? unverified. Evidence is in each teardown. Light-tier cells are [A] unless cited above.

| Capability | HashFame | Collabstr | Passionfroot | Modash | Wobb | Kofluence | CreatorIQ | GRIN | Aspire | Upfluence | Qoruz | KlugKlug | OPA | HYPD | Later Inf. | Agentio | **Vigor (planned)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Creator signup ≤ 60 s | ◐ app-only | ○ (card, review) | ◐ | n/a (0 signup) | ◐ OTP | ◐ Meta login | ○ | ○ | ◐ | ○ | ○ | ○ | ? | ● | ○ | ◐ | ● |
| Auto-fill stats from IG without OAuth | ◐ | ○ self-entered | ○ | ● | ● index | ○ OAuth | ● API | ◐ | ◐ | ● | ● | ● | ◐ | ○ | ◐ | ○ | ● |
| Public media-kit page (SEO) | ● | ● | ● storefront | ○ PDF | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● store | ○ | ◐ | ● |
| Rate card / packages | ○ "Flexible" | ● | ● | ◐ CRM field | ○ | ? | ◐ | ◐ | ◐ | ◐ | ○ | ○ | ? | n/a | ◐ | ● slots | ● |
| Percentile rank / badges | ● city+category | ◐ Top/Fast | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● + college |
| **College / campus dimension** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| City filter | ● | ● | ? | ● | ● | ? | ● | ● | ● | ● | ● | ● | ? | ○ | ● | ○ | ● |
| AI / natural-language discovery, lookalikes | ○ | ◐ match | ● | ● | ● | ? | ● | ◐ | ◐ | ● | ◐ | ● | ● agents | ○ | ◐ | ● | ◐ |
| Brief → applications | ◐ new | ● | ● proposals | ○ | ● | ● | ● | ● | ● | ● | ○ | ○ | ● | ○ | ● | ● | ● |
| AI brief drafting | ○ | ● | ● | ○ | ? | ? | ◐ | ◐ | ◐ | ◐ | ○ | ○ | ● | ○ | ? | ● | ● (paste WhatsApp brief) |
| Draft review / revisions / approval | ○ | ● | ● | ◐ | ◐ | ● moderation | ● | ● | ● | ● | ○ | ○ | ● | ○ | ● | ◐ | ● + magic link |
| Brand approves without login | ○ | ○ | ○ | ○ | ○ | ○ | ◐ share links | ○ | ○ | ○ | ○ | ○ | ? | ○ | ◐ | ○ | ● |
| Live-post tracking & deletion alerts | ○ | ◐ 3 wks | ● | ● compliance alerts | ◐ | ● | ● | ● | ● | ● | ◐ | ◐ | ● | ○ | ● | ● | ● 24h/72h/7d |
| Payments / escrow | ○ | ● escrow | ● wallet | ● payouts | ○ | ● escrow+TDS/GST | ● | ● | ● | ● | ○ | ○ | ? | ● commissions | ● | ● | ◐ track (rails later) |
| INR, GST/TDS awareness | ○ | ○ | ○ | ○ | ? | ● | ○ | ○ | ○ | ○ | ? | ? | ? | ● | ○ | ○ | ● |
| **WhatsApp-native ops** | ◐ deep-link | ○ | ○ | ○ email | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ? | ○ | ○ | ○ | ● |
| Agency multi-role workspace | ○ | ◐ Enterprise | ◐ | ● limited seats | ◐ seats | ? | ● | ◐ | ◐ | ● | ◐ | ◐ | ● | ○ | ● | ○ | ● AM/scout/ops/reviewer/finance/founder |
| Talent-manager attribution | ● | ○ | ○ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ● |
| Creator consent before contact reveal | ● request | ● (chat on platform) | ● | ○ | ○ phone unlock | ? | n/a | n/a | ● | n/a | ○ | ○ | ? | n/a | ● | ● | ● |
| On-ground / event talent | ○ (coming soon) | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Reviews of creator reliability | ◐ anon brand | ● 3 sub-scores | ○ | ○ | ○ | ? | ◐ | ◐ | ◐ | ◐ | ○ | ○ | ? | ○ | ◐ | ? | ● |
| Pricing (brand) | Free | $0–$1K/mo + 5–10% | free start + 2–5% | $199–$1,225/mo | $99–$499/mo | sales-led | enterprise | enterprise | mid/enterprise | mid/enterprise | free + custom | custom | managed | n/a | enterprise | 20% of spend | agency-internal; partner licence |

## Best-in-class pattern per area

| Area | Best in class | Pattern worth copying (in our own words, not their UI) |
|---|---|---|
| Creator onboarding | **Modash** (0 fields) / **HYPD** (30 s store) | Never ask what you can fetch. Let a creator **claim** a profile the agency already built. |
| Commitment device | **Collabstr** | The first field is the vanity handle/URL, so the creator owns something before any form. |
| Media kit | **Collabstr** | Packages with deliverable text and price, audience splits, 3-dimension reviews and FAQ on one SEO page. |
| Social proof for creators | **HashFame** | Percentile chips by city and category; "N brands connected in 6 months". |
| Anti-spam contact | **HashFame** (request gate) + **Modash** (metered unlocks) | Consent first, then metered and logged reveals. |
| Discovery | **Modash** | NL + image + audio search, caption include/exclude, lookalikes, "creators among your followers". |
| Brief → outreach | **Passionfroot** | The agent drafts brief and per-creator proposals, and a human approves in bulk before sending. |
| Execution follow-up | **Passionfroot** | An action center that turns overdue items into A/B/C one-tap remedies. |
| Approval → payment | **Collabstr** | Submit → request revision → approve releases payment, as one state machine. |
| Tracking | **Modash** | Auto-collect posts without tags; disclosure and missed-hashtag alerts; manual edits with an audit trail. |
| India money | **Kofluence** | TDS/GST-aware payouts; CPA pricing models. |
| Inventory | **Agentio** | Creators publish **availability slots** ahead of time, which brands can buy. |
| Team access | **Modash** | Limited seats that see only assigned campaigns, with financials hidden. |

## Gaps nobody solves well

1. **College graph.** None of the 16 products model college, campus city, course or graduation year. This was the 01-doc thesis, and it still holds.
2. **WhatsApp as the operating channel.** At best there is a WhatsApp deep-link (HashFame). Nobody runs briefs, "I'm in" replies, draft nudges and payout notices over the WhatsApp Business API.
3. **The agency chain.** Brand → agency AM → execution team → creators → reviewers → founder. Tools are built for one in-house marketer (Passionfroot, Collabstr) or a flat enterprise seat list (CreatorIQ). Nobody does role-specific queues plus founder margin/workload views.
4. **Brand approvals without accounts.** Every product makes the brand log in. Indian brand managers approve on WhatsApp today.
5. **Influencer + on-ground talent in one identity.** HashFame lists "Event marketing" as coming soon; nobody ships it.
6. **Consent and trust for student creators.** Credit-card checks (Collabstr), phone unlocks (Wobb) and number directories (HashFame) all feel unsafe for 18–22-year-olds.
7. **Reliability as data.** Collabstr reviews are brand-written and public. Nobody computes no-show rate, on-time %, revision count and post-deletion as a private, agency-owned score.
8. **Story-heavy proof.** Most Indian micro deliverables are Stories, which APIs barely expose (Modash: "Stories… aren't supported yet" for mentions). Nobody has a clean screenshot-to-metric flow with audit.
9. **Compounding pool across agencies.** Discovery databases are rented; nobody lets agencies share a consented pool with licensing and royalties.

## Top 15 moves for Vigor Talent Network

| # | Move | Type | From | Why / how |
|---|---|---|---|---|
| 1 | **Handle-first, 3-field signup**: Instagram handle → phone/WhatsApp OTP (or Google) → college picker. Everything else is auto-filled or asked later. | Beat | Collabstr (handle first), Modash (fetch, don't ask), HYPD (30 s) | Hits PRD G1 (≤ 60 s). Under 4 required inputs vs Collabstr's ~15–20. |
| 2 | **Auto-fill from public Instagram data** (followers, avg Reel views, ER, recent grid, bio-parsed city/college hints) with an optional Instagram Login that adds a "verified insights" badge. | Adopt | Modash, HashFame (no OAuth) | Avoids Kofluence-style Meta-login drop-off for personal accounts. |
| 3 | **Claimable shadow profiles**: scouts add any handle, and the creator claims it from a WhatsApp invite in one tap. | Adopt + beat | Modash | The pool grows without creators doing any work. Claiming adds consent, college and rates. |
| 4 | **College × city as first-class filters and ranks**, e.g. "Top 3% at Mithibai", "Top 5% food creators in Pune colleges". | Beat | HashFame rank chips | Unique in the matrix. Rank chips are also shareable growth loops. |
| 5 | **WhatsApp-first ops loop**: brief broadcast → "I'm in" quick-reply → status updates at every stage → draft-due nudges → payout notice, all from templates. | Beat | none | Gap #2. Use utility templates (~₹0.115) for status messages and free replies inside 24 h windows (01-doc pricing). |
| 6 | **Paste-a-WhatsApp-brief → structured brief + tier mix + budget + college/city spread**, edited by the AM. | Adopt | Passionfroot Zest, OPA WondrAgents | Agents assist named humans; nothing goes out without AM approval. |
| 7 | **Batch-approve personalised invites** before sending. | Adopt | Passionfroot | Speeds outreach without spam. |
| 8 | **Role queues ("Needs you")** for AM, scout, ops, reviewer, finance, each with one-tap remedies (nudge / extend / replace). Plus a **founder cockpit** for pipeline value, margin and team workload. | Beat | Passionfroot action center | Gap #3. Mirrors the brand → agency → execution → creators → reviewers → founder chain. |
| 9 | **Magic-link brand review rooms** to approve shortlists and drafts from a phone with no account, with comments and versions. | Beat | none | Gap #4, and it hits PRD G4. |
| 10 | **Per-deliverable state machine**: brief → applied → shortlisted → brand-approved → draft v1..n → approved → live → verified 24h/72h/7d → invoiced → paid. Deleted-post alerts included. | Adopt + beat | Collabstr approve-to-pay, Modash tracking | Fixes Collabstr's top complaint (deleted posts, off-brief content). |
| 11 | **Private reliability score** built from on-time %, revision rounds, no-shows, post retention and reviewer sub-scores (communication, timeliness, brief compliance). It feeds rank metals. | Beat | Collabstr reviews | Gap #7. Agency-owned, never public shaming. |
| 12 | **Consent-gated, metered, logged contact reveal** for partner agencies. The creator sees who unlocked them. | Adopt | HashFame request gate, Modash metering | Gap #6. Avoids Wobb/HashFame phone-directory distrust. |
| 13 | **Indicative packages + Vigor paid-rate history** on profiles (internal and review-room only, not a public cart). | Adopt (modified) | Collabstr packages | Ends "Flexible (Depends)" negotiations without exposing rates publicly. |
| 14 | **India-ready money tracking**: PAN, optional GSTIN, TDS %, fee, invoice upload and payout status per booking. `pricing_model` fixed / barter / CPA. Rails (RazorpayX) later. | Adopt | Kofluence | Matches the PRD non-goal on payouts while keeping data ready. |
| 15 | **Availability and barter on-ramp**: creators toggle "open for briefs" with dates (exam season!), and a nano "Rising" tier starts with barter briefs to earn rank. | Adopt | HashFame Work Mode, Agentio slots, Wobb barter, Kofinity | College calendars drive availability. Barter builds reliability data cheaply. |

**Avoid list:** credit card for creators (Collabstr); credit burn on every click (Wobb); app-only product with a web dead-end (HashFame); phone-number directory as the core value (HashFame/Wobb); mandatory Meta login (Kofluence); double-sided take rates that push deals off-platform (Collabstr 10%+15%); orange-on-cream marketing that would read as Passionfroot (`#FF6900` on `#F8F7F2`) given our `#FF6A1A` brand. Keep Vigor dark-first per `05-design-system.md`.

## Visual systems at a glance

| Product | Primary / accent | Surface | Type | Radius | Signature |
|---|---|---|---|---|---|
| HashFame | `#51099C` / `#6049F5` | white, ink `#030312` | DM Sans | 16, pill 36 | creator carousels, rank chips |
| Collabstr | `#252B37`, `#BDB4FE`, CTA `#FC85B1` | white | Inter | 12, pill 41 | niche icon set, review snippets on cards |
| Passionfroot | `#FF6900` | cream `#F8F7F2` | New-Kansas + Nunito Sans | 6–12 | odometer KPIs, layered "paper" shadows, agent chat mock-ups |
| Modash | peach/purple stickers [A] | white | [A] | [A] | sticker illustrations, UI crops, Webflow |
| Wobb | `#166DF4` | white | system ui-sans | 4–8 | stock shadcn |
| Kofluence | [A] | [A] | [A] | [A] | WordPress |

None of them uses a dark-first or 3D system. Vigor's "backstage" dark UI with rank metals stands out visually in this category (see `05-design-system.md`).

## Sources

All URLs are inline above and in each teardown. Key ones: https://hashfame.com/ , https://hashfame.com/brands , https://hashfame.com/@foodpharmer , https://play.google.com/store/apps/details?id=com.qoruz.nexus&hl=en_IN , https://collabstr.com/ , https://collabstr.com/pricing , https://collabstr.com/tikicaldwell , https://help.collabstr.com/en/article/join-as-a-creator-1huw5to/ , https://www.trustpilot.com/review/collabstr.com , https://www.passionfroot.me/ , https://help.passionfroot.me/en/articles/15970415-fees-deductions-internal , https://www.modash.io/pricing , https://wobb.ai/ , https://wobb.ai/pricing , https://www.softwareadvice.com/marketing/wobb-profile , https://apps.apple.com/app/id1488194664 .
