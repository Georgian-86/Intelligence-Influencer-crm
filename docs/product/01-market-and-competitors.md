# 01 · Market & Competitor Teardown

> Part of the Vigor Talent Network product definition. Read with `02-stakeholders-and-journeys.md`,
> `03-PRD.md`, `04-architecture-and-integrations.md`, `05-design-system.md`, `06-decision-log.md`.
> Research date: Nov 2026. Most third-party sources are vendor blogs, so treat their figures as directional.

## 1. Market context (India)

- Creator campaigns in India grew from ~14,000 to ~42,000 per year, and **66% of creators are now from
  non-metro markets** (ISB–HashFame report, 2026).
- Agencies run 10+ campaigns a month across platforms; spreadsheets, DMs and WhatsApp groups break at that scale.
  Payments (17%) and contracts/deadlines (14%) are the top in-house pain points (Influencer Marketing Hub benchmark).
- Youth/college marketing runs on **campus ambassador programmes** (Hunch, Myntra StyleCast with ~500 college
  creators, Mark18 with 10,000+ student creators, Wobb). None of them is a reusable, data-rich pool an agency
  can query by *college × city × year × niche × engagement*.
- WhatsApp is the default channel for creators. Since July 2025 Meta bills per delivered template:
  ~₹0.86 marketing, ~₹0.115 utility, free replies inside a 24h service window (verify on Meta's rate card).

## 2. Competitor teardown

| Product | What it is | Strengths to borrow | Gaps we exploit |
|---|---|---|---|
| **HashFame** (Bengaluru, from the Qoruz team) | Creator *directory* + direct contact app. ~70K verified creators, 112+ categories, 17–18K brands/agencies. Free for marketers; creator subscription (~₹999/mo) planned. | Phone/WhatsApp-first contact; city × category discovery; shortlists and tags; "Most contacted this week" leaderboard; talent-manager accounts; Brand Interest Signals for talent agencies; regional/non-metro focus. | **Stops at discovery** — no briefs, approvals, live tracking, payments or reports. No college graph. No event/on-ground talent. Creators get contacted but have no pipeline view. Weak app ratings. Directory model = contact spam for top creators. |
| **Qoruz** | Discovery + analytics database for agencies/D2C; free tier, custom paid. | Large indexed database, audience analytics, lists. | Analytics tool, not a workflow; no creator-side product; no event talent. |
| **Winkl / Plixxo** (consolidated with Vidooly/MissMalini) | Managed campaigns + marketplace; Plixxo strong in fashion/beauty IG. | Self-serve campaign posting to creators, creator app. | Commission on fees; generic briefs; little execution tooling for the agency's own team; no youth/college targeting. |
| **Collabstr** | Global marketplace with public creator rate cards. | Transparent prices up front; instant booking; SEO-indexed creator pages. | Self-serve only; no agency layer; not India/college aware. |
| **GRIN / Upfluence** | Full-suite enterprise CRM for e-commerce brands (discovery, outreach, contracts, affiliate, payments). | End-to-end lifecycle, Shopify links, payment rails, content library. | Expensive (built for $5M+ revenue brands), US-centric, no WhatsApp, no on-ground talent, heavy UI. |
| **Campus programmes** (Hunch, StyleCast, Mark18, Wobb) | Ambassador recruitment per brand. | Weekly tasks, gamification, campus clubs. | Siloed per brand, re-recruited every time — exactly Vigor's "scout again and again" problem. |
| **Event staffing marketplaces** (Upwork/Urban Company style, GigSalad, BookMyShow artists) | Book hosts, DJs, performers, promoters. | Ratings, packages, availability calendars. | Not connected to influencer data; no agency CRM. |

## 3. Where the category is weak (and how we win)

| # | Category gap | Vigor Talent Network answer |
|---|---|---|
| 1 | Discovery tools stop at "here's a phone number". | **Brief → interest → shortlist → approval → live tracking → payment → report** in one system. |
| 2 | Nobody models the **college graph**. | First-class `college`, `campus city`, `course`, `graduation year`, `clubs/fests` fields; queries like "200 food creators at Pune colleges, graduating 2027–28, ER > 4%". |
| 3 | Influencers and on-ground talent live in different tools. | One talent identity with influencer + event extensions; one brief can staff creators **and** promoters/anchors. |
| 4 | Brands approve shortlists/content over email threads and PDFs. | **Magic-link review rooms**: brand approves talent and content from a phone, no login, with comments. |
| 5 | Creators get spammed and ghosted. | Creators see a real pipeline status, briefs that match them only, and WhatsApp updates at each stage. |
| 6 | Metrics are self-declared or stale. | Auto-fetched IG metrics, snapshots over time, live-post tracking at 24h / 72h / 7d, authenticity signals. |
| 7 | Payments and invoices sit outside the tool. | Rates, agreed fee, deliverables, invoice upload and payout status tracked per booking (payout rails later). |
| 8 | Agencies can't share a pool commercially. | Multi-tenant pool with licensing, contact-unlock metering and royalty reports. |
| 9 | Heavy, desktop-first UIs. | Mobile-first PWA for creators, keyboard-fast desktop CRM for teams, sub-second interactions. |

## 4. Feature benchmark we must meet or beat

- **Discovery:** filters by city, category, followers, ER, gender, language, rank **plus college, year, availability**; saved searches; lookalike ("more like this creator").
- **Profiles:** auto-fetched stats, growth chart, recent content grid, rate card, past brands, ratings, verified badges (Instagram, phone, student).
- **Outreach:** one-click WhatsApp with templated message; bulk brief broadcast to matching creators.
- **Workflow:** kanban pipeline, deliverables checklist, deadlines, draft submissions, review rounds.
- **Reporting:** campaign dashboard and a shareable brand report (reach, views, ER, CPV/CPE, content gallery).
- **Network effects:** leaderboards, ranks, badges, referrals (creators invite college friends).

## Sources

- HashFame: [Social Samosa launch](https://www.socialsamosa.com/campaign-spot/hashfame-introduces-a-free-app-for-marketers-to-connect-with-70000-influencers-2471047), [hashfame.com](https://hashfame.com/), [brands page](https://hashfame.com/brands), [App Store](https://apps.apple.com/in/app/hashfame/id6452017249), [Google Play](https://play.google.com/store/apps/details?id=com.qoruz.nexus&hl=en_CA), [Storyboard18 interview](https://www.storyboard18.com/brand-makers/regional-creators-lose-out-on-brand-money-because-of-agency-middlemen-says-hashfames-anirudh-sridharan-113398.htm), [Brand Interest Signals](https://www.buzzincontent.com/influencer-marketing/hashfame-rolls-out-brand-interest-signals-to-decode-pre-campaign-demand-for-creators-9534542), [ISB–HashFame report](https://www.isb.edu/news/press-releases/india-s-creator-economy-enters-a-new-phase-as-non-metro-creators-become-the-majority-reveals-isb-hashfame-report)
- Platforms: [getcollab.in comparison](https://getcollab.in/blog/top-influencer-marketing-platforms-india-2025/), [collabvue](https://collabvue.com/blog/influencer-marketing-platforms-in-india), [limurse](https://limurse.ai/best-influencer-marketing-platforms-india), [earnleague](https://earnleague.com/blog/influencer-marketing-platforms-for-brands-india)
- Workflow pain: [Influencity payments](https://influencity.com/blog/en/top-influencer-management-tools-for-negotiating-tracking-and-paying-creators), [Influencer Marketing Hub](https://influencermarketinghub.com/influencer-management/), [creator.co](https://www.creator.co/post/spreadsheets-are-not-an-influencer-marketing-strategy), [InfluenceFlow coordination](https://influenceflow.io/resources/common-campaign-coordination-mistakes-a-2026-guide-for-teams)
- Campus: [Hunch ambassador](https://www.netinfluencer.com/hunch-brand-ambassador-program/), [Myntra StyleCast](https://in.fashionnetwork.com/news/Myntra-StyleCast-launches-college-ambassador-programme-to-strengthen-Gen-Z-ties,1416516.html), [Mark18](https://jobs.weekday.works/campus-ambassador-at-mark18-wkdyc0rf3s)
- WhatsApp pricing: [baat.ai](https://baat.ai/blog/whatsapp-api-pricing-india), [myoperator](https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026)
- Instagram API: [Meta insights docs](https://developers.facebook.com/docs/instagram-platform/insights), [Meta blog: insights on Instagram Login](https://developers.facebook.com/blog/post/2025/03/24/user-and-media-insights-on-instagram-api-with-instagram-login/), [Phyllo scopes](https://www.getphyllo.com/post/instagram-api-permissions-scopes)
