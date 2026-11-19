# Teardown · Passionfroot (passionfroot.me)

> Research date: 19 Nov 2026. Labels: **[F]** fact on a cited page, **[I]** inference, **[A]** to verify.
> Why it matters to Vigor: it began as a **creator storefront/media kit** product and became an
> **agentic campaign OS for brands** — the clearest example of an AI agent running the agency workflow.

## 1. Surfaces collected

| Surface | URL |
|---|---|
| Home | https://www.passionfroot.me/ |
| Brand app entry | https://workspace.passionfroot.me/select-workspace |
| Creator pricing | https://passionfroot.me/creator-pricing , https://help.passionfroot.me/creators/getting-started/pricing |
| Fee policy | https://help.passionfroot.me/en/articles/15970415-fees-deductions-internal , https://help.passionfroot.me/en/articles/11552638-pricing |
| Press | https://techcrunch.com/2024/10/21/passionfroot-is-building-a-platform-for-brand-and-creator-colloboration-with-a-focus-on-b2b-sector |
| Case studies | https://www.passionfroot.me/partner-story/replit , /comet , /gamma |

## 2. Information architecture

- Home is a long scroll in three acts: **Plan strategy → Run campaign → Measure results** [F].
- Hero: "Agentic Marketing OS"; the agent is named **Zest** [F].
- ICP: **B2B / tech GTM teams** (Intercom, ElevenLabs, Figma, Framer, HubSpot, Replit, Attio logos) [F]. Platforms: LinkedIn, YouTube, X, newsletters (beehiiv, Substack), Instagram, TikTok [F].
- Creator side: free storefront where a creator lists offers and brands book them [F help pricing]; network deals sourced by Passionfroot [F].
- Booking a demo uses **cal.com** routing form [F home link].

## 3. Flows — signup → first value

**Brand** [F home copy; screens are marketing mock-ups]:
1. "Start for free" → workspace selection.
2. Give Zest a goal ("Launch a product", "Announce a fundraise", "Stay top of mind") → Zest outputs ICP, platforms, budget, messaging, and a **creator mix** (Micro / Mid-tier / Lighthouse) with estimated impressions, engagement, budget.
3. Zest curates creators matched to ICP (8 shown in mock).
4. Zest drafts the brief and **personalised proposals per creator** (deliverables + total) → human reviews → "Send to all 25 creators" or "Don't send".
5. Creators reply in-thread ("Love this, I'm in!").
6. **Action center:** contacted / in negotiation / confirmed / live counts; agent flags "4 creators missed their draft deadline" with options A) send reminder B) extend 5 days C) ask Zest.
7. Pay all creators in one go via **FrootWallet** (one vendor onboarding for procurement) — "23 creators to pay · $34,550".
8. Analytics: per-post reach, engagement, ER, CPM; "Add external post"; Zest insights ("Design-focused creators in 20K–150K range delivered 45% better CPM than lighthouse creators") and next-campaign recommendations.

Time-to-value claim: "campaigns in minutes — not weeks" [F]. Field count for brand: effectively **one prompt** + approvals [F/I].

**Creator** [I from fee docs]: claim storefront → list offers with prices → share link with brands → bookings come in; network deals arrive from Passionfroot.

## 4. Creator profile / media-kit anatomy [I]

Storefront = media kit + checkout: creator name/avatar, one-line audience description (seen on cards: "Weekly insights on business and tech strategies… 110K"), per-platform audience sizes, **offers with fixed prices** (e.g. "1 x 60s Integration, 3 x Story"), booking flow with brief upload and payment. Cards in the agent mock show one-sentence AI-written audience summaries [F].

## 5. Implied data model [I]

`Campaign(goal, icp, platforms[], creator_mix{micro, mid, lighthouse}, budget, status)`
`Proposal(creator, deliverables[{format, qty}], total, message, state: draft→approved→sent→replied→negotiating→confirmed)`
`Deliverable(due_at, draft_at, live_url, metrics)` · `ActionItem(type: missed_deadline|pending_approval|follow_up, options[])`
`Wallet(balance) → Payout(creator, amount)` · `Insight(campaign, finding, recommended_action)`

## 6. Feature inventory

| Feature | User | Depth | Evidence |
|---|---|---|---|
| Goal → strategy + creator mix + budget (AI) | Brand | 3 | home |
| ICP-matched creator curation | Brand | 2 | home |
| AI-generated briefs + per-creator proposals, human approve-then-send | Brand | 3 | home |
| Action center for missed deadlines/approvals with one-tap remedies | Brand | 3 | home |
| Consolidated compliant payouts (FrootWallet) | Brand | 3 | home |
| Cross-platform post tracking incl. external posts | Brand | 2 | home |
| Learnings → next campaign recommendations | Brand | 2 | home |
| Creator storefront, no subscription | Creator | 2 | help pricing |
| WhatsApp / Indian payments | — | 0 | absent |

## 7. Visual & motion system

Branding extraction of https://www.passionfroot.me/ [F]:

| Token | Value |
|---|---|
| Primary / accent | `#FF6900` orange (note: within a few degrees of Vigor's `#FF6A1A` — see so-what) |
| Background | `#F8F7F2` warm cream; secondary `#F0EDE0`; text `#1D1D1C` |
| Type | Headings **New-Kansas** (soft serif); body **Nunito Sans**; H1 64 / H2 48 / body 18 |
| Radius | 6 px base, 10–12 px buttons |
| Elevation | Multi-layer hairline + stacked oklch shadows (1px ring + 1/3/6/12/24 px soft layers) — a "paper" look |
| Imagery | Real creator headshots inside product-UI mock-ups; hero video; no 3D |
| Motion | **Odometer number roll** for KPIs (digit strips "0123456789" in DOM) [F]; animated agent chat sequences; logo marquee; letter-by-letter animated quote in hero (words concatenated in DOM) [I] |
| Framework | Tailwind + shadcn/ui [F extraction], Cloudinary media, cal.com |

## 8. Tech fingerprint

Tailwind + shadcn (extractor), assets under `/_pfweb/` and `res.cloudinary.com/passionfroot` [F]; app on `workspace.passionfroot.me` subdomain [F]; Stripe for payouts (15% sourcing fee "covers Stripe fees") [F help].

## 9. Positioning & pricing

- "Drive growth through trusted, human voices at scale. Find them, pay them, see the impact" [F home].
- Creators: never charged a subscription [F help]. Organic storefront deals: brand pays ~5% platform fee, creator keeps listed price; network-sourced deals: **15% sourcing fee from the creator payout** [F help]. Marketing page also mentions a 2% brand fee — sources conflict [F https://passionfroot.me/creator-pricing].
- Brand plans not public on home; "Start for free" + "Talk to our team" [F].

## 10. Gaps & complaints

- No substantive public complaints found in this pass (Capterra/G2 listings exist: https://www.capterra.com/p/10022434/Passionfroot/ , https://www.g2.com/products/passionfroot/pricing) [F].
- B2B/Western focus; no Instagram-first micro/college creators, no INR/GST/UPI, no WhatsApp, no on-ground talent [I].
- Agent-heavy UX hides the agency team: built for one marketer, not a brand → agency → execution team chain [I].

## 11. So-what for Vigor Talent Network

| Finding | Verdict | How |
|---|---|---|
| Goal → creator mix (micro/mid/lighthouse) + budget plan | **Adopt** | Brief parser outputs tier mix + budget + college/city spread for the AM to edit. |
| Draft proposals per creator, approve-then-send | **Adopt** | AM approves a batch of personalised WhatsApp invites; system sends templates. |
| Action center with A/B/C remedies | **Adopt** | "Needs you" queue per role: overdue drafts → nudge / extend / replace. |
| Odometer KPIs, paper elevation | **Adopt pattern** | Use for live-campaign counters in review rooms. |
| Orange on cream palette | **Avoid collision** | Vigor's orange is dark-first (ink backgrounds); never ship orange-on-cream marketing pages. |
| One wallet for many creators | **Later** | Mirrors our v2 non-goal; plan RazorpayX bulk payouts with one consolidated brand invoice. |
| AI hides the team | **Beat** | Agents assist named humans; every action shows who approved it (AM, reviewer, founder). |
