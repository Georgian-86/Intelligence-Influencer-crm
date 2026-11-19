# 07 · Campaign Lifecycle, Stakeholder Jobs & Pains

> Builds on `02-stakeholders-and-journeys.md` (journeys) and `03-PRD.md` (requirements). This doc goes one
> level deeper: **how one campaign moves through Vigor end to end, who does what at each step, what hurts,
> and which feature removes each pain.** Feature IDs (e.g. `BB-1`) are specified in `08-feature-spec-v3.md`.
> Method: JTBD (jobs/pains/gains), customer journey map, opportunity solution tree. Numbers marked *(est.)*
> are team estimates to validate in the first 5 campaigns, not measured data.

---

## 1. The lifecycle at a glance

Example campaign used throughout: *"QSR brand menu launch — 40 college creators across Mumbai + Pune
(reels + stories), 20 promoters for 6 campus activations, ₹6L, 3 weeks."*

| # | Stage | Trigger / input | Owner | Output | Today *(est.)* | Target | System object (existing → new) |
|---|---|---|---|---|---|---|---|
| S1 | **Inbound brief** | WhatsApp text, email, call, PDF deck, RFP | AM | Logged enquiry | Lives in AM's phone; 0.5–1 day to log | < 5 min, auto-logged | `brand_enquiries` → `campaigns` (status `planning`) |
| S2 | **Scoping** | Raw brief | AM + brand | Structured brief: objective, audience, cities, colleges, talent mix, deliverables, dates, budget, KPIs | 2–4 days of back-and-forth questions | Same day; gaps flagged automatically | `briefs` + new `brief_requirements` |
| S3 | **Proposal & costing** | Structured brief | AM + founder | Plan (tiers × cities × counts), estimated reach, cost, margin, proposal deck | 1–2 days in Excel + PPT | < 2 h, from rate benchmarks | new `proposals`, `proposal_lines` |
| S4 | **Creator sourcing** | Approved plan | AM / scout | Long-list (3× required) with interest confirmed | 3–5 days re-scouting IG + WhatsApp groups | < 24 h from pool + broadcast | `intents` (`applied` / `invited`) |
| S5 | **Shortlist & brand approval** | Long-list | AM → brand | Brand-approved list + backups | 2 rounds × 2 days over PDF/email | 1 round, < 24 h, one-tap per creator | new `review_links`, `review_actions`; stage `shortlisted` |
| S6 | **Contracting** | Approved creators | AM + finance | Agreed fee, deliverables, usage rights, exclusivity, payment terms, signed | Chat-negotiated, rarely written | Click-accept with OTP log; e-sign above threshold | new `bookings` (from `intents.agreed_rate`), `contracts` |
| S7 | **Briefing creators** | Signed bookings | AM / ops | Creative brief, do/don't, tags, hashtags, deadlines, product shipping | WhatsApp group dump; questions repeat | Brief page per booking + WhatsApp link; FAQ auto-answers | new `deliverables`, `shipments` |
| S8 | **Content drafts** | Brief | Creator | Draft video/image + caption | Sent on WhatsApp/Drive, compressed, lost | Upload to R2 via link; versioned | new `submissions` |
| S9 | **Review rounds** | Draft | Internal reviewer → brand | Approved draft or change list | 2–4 rounds; feedback in voice notes | ≤ 2 rounds; timestamped comments; checklist | `submissions.status`, new `review_comments` |
| S10 | **Go-live** | Approved draft | Creator | Live post URL, on schedule, correct tags | Links collected manually; missed slots | Live URL submitted in 1 tap; tag/disclosure auto-checked | `intents.deliverable_links` → new `post_tracking` |
| S11 | **Tracking** | Live URLs | AM | Views, likes, comments, shares, saves at 24h / 72h / 7d | Screenshots days later | Auto-fetched; anomalies flagged | `social_posts` + new `post_metrics` |
| S12 | **Reporting** | Metrics | AM | Brand report: reach, ER, CPV/CPE, gallery, learnings | 1–2 days in PPT | Live link + PDF in 1 click | new `reports` (share token) |
| S13 | **Invoicing & payouts** | Delivered bookings | Finance | Brand invoice (GST); creator payouts (TDS); reconciled | Creators chase for 30–60 days | Payout status visible to creator; ≤ 15-day payout SLA | new `payout_profiles`, `payments`, `brand_invoices` |
| S14 | **Retro & rating** | Closed campaign | AM / ops | Creator ratings, reliability, learnings, rate data | Lost in heads | 30-s rating per booking; feeds rank and benchmarks | `intents.rating`, `talent_profiles.reliability_score`, `rank` |

**Stage gates the system enforces:** no S6 without brand approval (or AM override with reason); no S10
without an approved submission; no payout without delivered + verified live post (or check-in for events).

---

## 2. Swimlane (who does what, by phase)

Phases group the 14 stages: **P1 Intake** (S1–S2) · **P2 Propose** (S3) · **P3 Source & approve** (S4–S5) ·
**P4 Contract & brief** (S6–S7) · **P5 Create & review** (S8–S9) · **P6 Live & track** (S10–S11) ·
**P7 Report & settle** (S12–S14).

| Lane | P1 Intake | P2 Propose | P3 Source & approve | P4 Contract & brief | P5 Create & review | P6 Live & track | P7 Report & settle |
|---|---|---|---|---|---|---|---|
| **Brand marketer** | Sends WhatsApp/email brief; answers gap questions | Reviews proposal link; approves budget | Taps approve/reject per creator in review room | Shares brand guidelines, product, do/don't | Approves drafts in review room (phone) | Watches live campaign page | Gets report link; pays invoice |
| **Agency AM** | Pastes brief → AI structures it; sends gap questions | Builds plan from benchmarks; shares proposal | Runs matching; broadcasts brief; curates long-list; shares shortlist | Confirms fees; triggers contracts; publishes creator brief | First-pass review; consolidates brand comments | Monitors tracker; chases late posts (auto-nudged) | Publishes report; rates creators |
| **Execution / ops** | — | Flags feasibility (dates, venues, permissions) | Staffs event roster (promoters, anchors) | Ships product; books venues; sends call sheets | Collects event-day assets | Runs check-ins; replaces no-shows | Marks attendance; rates talent |
| **Influencer** | — | — | Sees matching brief; taps "I'm in" (web/WhatsApp); quotes rate | Accepts terms with OTP; reads brief page | Uploads draft; fixes comments | Posts; submits live URL | Sees payout status; rates the brief |
| **College creator / campus ambassador** | — | — | Same as influencer; filtered by college/city | Same; may get barter + fee | Same | Posts; runs campus tasks (fest stalls, referrals) | Earns points/rank; payout or vouchers |
| **Event talent** | — | — | Sees gig by city/role/rank; taps "I'm in" | Accepts shift; gets call sheet | Optional: rehearsal/training | Geo + selfie check-in; performs | Payout status; rating → rank |
| **Reviewers** (internal QA, brand legal) | — | — | — | Define checklist (tags, #ad, claims) | Comment on frames; approve/request changes | Verify live post matches approved version | — |
| **Founder / leadership** | Sees new enquiry value | Approves margin < floor | Sees pipeline value | — | Sees SLA breaches | Sees at-risk campaigns | Sees margin, receivables, team load |
| **Finance** | — | Checks payment terms | — | Collects PAN/GST/UPI once; contract terms | — | — | Raises GST invoice; pays creators with TDS; reconciles |
| **System (automatic)** | Logs enquiry; extracts fields; flags gaps | Suggests tiers, counts, cost, margin | Scores creators; sends WhatsApp alerts; dedupes | Generates contract; schedules reminders | Versions files; runs compliance checks | Fetches metrics at 24h/72h/7d; flags missing posts | Builds report; payout reminders; updates rank and benchmarks |

---

## 3. Stakeholder jobs, ranked pains and the feature that removes each

Format per stakeholder: **Core job (JTBD)** — "When … I want to … so I can …". Pains are ranked by
**severity × frequency** (H/M/L). Every pain maps to one feature.

### 3.1 Brand marketer (client)
**Job:** When I launch something for Gen Z, I want the right college creators live on time with proof of
results, so I can show my boss the campaign worked without managing it myself.
Social job: look competent internally. Emotional job: not be surprised on launch day.

| Rank | Pain | Sev. | Feature that removes it |
|---|---|---|---|
| 1 | "I can't see progress until something goes wrong" | H | `BP-2` live campaign page (status per creator, drafts, live posts) |
| 2 | Shortlists arrive late as PDFs; can't judge fit from follower counts | H | `SL-1` shortlist share link with ER, view rate, audience city/college, past brands, sample reels |
| 3 | Approvals buried in email; 4 people reply-all | H | `RV-1` review room: one-tap approve/reject, named approvers, deadline |
| 4 | Fear of fake followers / inflated views | M | `IG-4` quality score + "verified insights" badge (`IG-5`) |
| 5 | Reports are late, inconsistent, screenshot-based | M | `RP-1` auto-report link + PDF, live within 24h of last checkpoint |
| 6 | Re-explaining the brand every campaign | L | `BP-3` brand kit (guidelines, do/don't, past approved content) reused across campaigns |

### 3.2 Agency account manager (AM)
**Job:** When a brand sends a brief, I want to turn it into an approved, live, reported campaign with the
least back-and-forth, so I can run 8–10 campaigns at once without dropping balls.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Chasing drafts, links and replies across 40 WhatsApp chats | H | `DT-1` deliverable tracker + `WA-3` auto-nudges; one inbox per campaign |
| 2 | Re-typing briefs and asking the same 8 gap questions | H | `BB-1` paste-to-brief AI + gap checklist with a WhatsApp-ready question message |
| 3 | Re-scouting from scratch every time | H | `MT-1` pool search + match score; `MT-3` broadcast brief to top matches |
| 4 | Costing by gut; margin discovered after the fact | H | `PC-1` rate benchmarks by tier × niche × city; `PC-2` margin calculator |
| 5 | Feedback rounds spiral (voice notes, vague comments) | M | `RV-2` timestamped comments, `RV-4` round limit + checklist |
| 6 | Building reports in PPT | M | `RP-1` auto-report |
| 7 | Creator drops out after confirmation | M | `MT-5` backups auto-promoted from approved long-list |

### 3.3 Execution / ops team
**Job:** When an activation or shoot is scheduled, I want the right people at the right place with the right
kit, so the event runs fully staffed and I have proof for the client.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | No-shows discovered at the venue | H | `EV-3` T-24h and T-3h WhatsApp confirm ("Coming / Can't"); `EV-5` auto-replacement from nearby ranked talent |
| 2 | Rosters and call sheets live in WhatsApp groups | H | `EV-1` roster per venue/shift; `EV-2` call sheet link (map, contact, dress code) |
| 3 | No proof of attendance for client billing | M | `EV-4` geo + selfie check-in/out; attendance export |
| 4 | Product shipping to 40 creators tracked by hand | M | `OP-1` shipment tracker (address captured at booking, courier link, "received" tap) |
| 5 | Can't rate talent consistently | L | `EV-6` 3-question shift rating → reliability score |

### 3.4 Creators
#### a) Influencer (non-student)
**Job:** When I'm looking for paid brand work, I want relevant offers with clear pay and terms, so I can earn
reliably without negotiating in DMs or chasing money.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Late or unclear payments | H | `FN-3` payout tracker with dates, TDS shown; ≤ 15-day SLA visible |
| 2 | Ghosting after "interested" | H | `CR-4` status timeline per application; auto "not selected" closes the loop |
| 3 | Irrelevant brief spam | M | `MT-2` eligibility filter + `WA-2` max 2 alerts/week |
| 4 | Re-sending media kit and stats | M | `SU-1` profile auto-built from IG; shareable media-kit link (`CR-6`) |
| 5 | Vague briefs, endless revisions | M | `BR-1` structured brief page; `RV-4` agreed revision limit in contract |

#### b) College creator / campus ambassador
**Job:** When I'm in college, I want paid gigs and brand credentials that fit around classes, so I can earn,
build a portfolio and stand out on campus.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Small follower count = invisible to agencies | H | `MT-1` college-first matching (campus reach matters more than followers); `CO-5` college leaderboards |
| 2 | Barter-only offers, unpaid tasks | H | Brief shows pay type up front (cash / barter / both) and value; filter "paid only" |
| 3 | Exam-time clashes | M | `CR-7` availability: mark exam weeks; matching skips them |
| 4 | Doesn't have PAN/GST/invoice know-how | M | `FN-2` guided payout profile (UPI + PAN), auto-generated invoice for creator |
| 5 | Ambassador programmes restart every brand | M | `CO-6` persistent campus ambassador profile + points across brands |

#### c) Event talent (promoters, anchors, DJs, crew)
**Job:** When I'm free on a date, I want nearby gigs at a fair, known rate, so I can fill my calendar and grow
into better-paid roles.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Irregular gigs, found via friends' WhatsApp groups | H | `EV-7` gigs feed by city/role/rank + WhatsApp alert |
| 2 | Pay unclear / delayed | H | Rate by rank shown on gig; `FN-3` payout tracker |
| 3 | No path to grow | M | `AD-3` rank rubric (Bronze→Platinum) with visible next-step checklist |
| 4 | Last-minute changes not communicated | M | `NT` matrix: change alerts on WhatsApp within 5 min |

### 3.5 Content reviewers (internal QA + brand)
**Job:** When a draft comes in, I want to check it against the brief and rules quickly and say precisely what
to change, so it goes live right first time and nothing embarrasses the brand.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Feedback is vague ("make it more fun") and lost in chat | H | `RV-2` frame-accurate comments with drawing; `RV-3` comment → checklist item |
| 2 | Versions mixed up; approving the wrong file | H | `RV-1` versioned submissions, side-by-side compare, approved hash locked |
| 3 | Compliance misses (#ad, brand tag, claims, music rights) | M | `RV-5` auto-checklist from brief + caption scan |
| 4 | Brand legal is a bottleneck | M | Parallel approval with SLA timer; escalations to AM (`NT`) |
| 5 | Live post differs from approved draft | L | `LT-3` live-vs-approved check (caption diff, duration, thumbnail) |

### 3.6 Founder / leadership
**Job:** When I run a growing agency, I want to see where money, people and risk are, so I can take on more
campaigns profitably and turn the talent pool into an asset.

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Margins known only after the campaign | H | `FC-1` margin per campaign (quoted vs actual) live |
| 2 | Can't see team load; best AM burns out | H | `FC-2` load per AM (active bookings, overdue items) |
| 3 | Knowledge leaves with employees | H | Pool + notes + ratings + benchmarks in one system (`MT`, `PC-1`) |
| 4 | SLA misses surface as client complaints | M | `FC-3` SLA breach feed (brief→proposal, review turnaround, payouts) |
| 5 | Cash crunch: brands pay in 60–90 days, creators expect 15 | M | `FC-4` receivables vs payables ageing |
| 6 | Can't monetise the pool yet | L | Phase 3 tenancy + `usage_events` metering (already in schema) |

### 3.7 Finance
**Job:** When bookings complete, I want to bill brands and pay creators correctly and on time with clean
records, so cash flow is healthy and we're compliant (GST, TDS).

| Rank | Pain | Sev. | Feature |
|---|---|---|---|
| 1 | Missing PAN/UPI/GST details at payout time | H | `FN-2` payout profile collected at booking confirmation, validated (PAN format, UPI name check) |
| 2 | "Who's been paid?" spreadsheet drift | H | `FN-3` payments ledger per booking (pending → approved → paid → failed) |
| 3 | TDS section confusion (194J vs 194C), barter (194R) | M | `FN-4` TDS rule per payee type with CA-approved defaults; barter value logged |
| 4 | Brand invoices raised late | M | `FN-1` invoice draft auto-created on milestone (e.g., 50% advance, 50% on report) |
| 5 | Reconciliation with bank | L | `FN-5` CSV export for Tally/Zoho; v3 payouts via RazorpayX/Cashfree (D6) |

---

## 4. Journey map — emotion & metric per stage (creator vs brand vs AM)

Emotion scale: **+2** delighted … **-2** frustrated. Today → target.

| Stage | Creator emotion | Brand emotion | AM emotion | Moment of truth | Metric |
|---|---|---|---|---|---|
| Inbound / scoping | — | 0 → +1 (fast questions) | -1 → +1 | First reply within 2 h | Time to structured brief |
| Proposal | — | -1 → +1 | -1 → +1 | Numbers look grounded | Proposal win rate |
| Sourcing | -1 (spam) → +1 (relevant) | — | -2 → +1 | First 20 interested in < 6 h | Interest rate per alert |
| Shortlist approval | -2 (ghosted) → +1 (status) | -1 → +2 | -1 → +1 | Brand approves in 1 round | Approval latency |
| Contract & brief | 0 → +1 | 0 | -1 → 0 | Creator knows pay date | % signed in 24h |
| Drafts & review | -1 → +1 | -1 → +1 | -2 → 0 | ≤ 2 rounds | Rounds per deliverable |
| Live & track | +1 | 0 → +2 (live page) | -1 → +1 | All posts live on the day | On-time live % |
| Report & pay | -2 (payment) → +1 | 0 → +2 | -1 → +1 | Paid within 15 days | Days to payout; brand NPS |

**Biggest gaps (where to invest first):** creator payment (-2), creator ghosting (-2), AM sourcing (-2), AM
review chasing (-2). These map to `FN-3`, `CR-4`, `MT-1/MT-3`, `DT-1` + `RV-1`.

---

## 5. Opportunity solution tree

**Outcome:** Cut brief-to-live time from ~21 days to ≤ 10 days *(est.)* while raising gross margin per campaign
by 5 points, with ≥ 80% of talent from the pool (PRD G2).

| Opportunity (customer problem) | Candidate solutions | Pick | Cheapest test |
|---|---|---|---|
| O1 · AMs lose 2–4 days turning messy briefs into plans | a) AI paste parser · b) brand intake form · c) templates per campaign type | a + c | Paste 20 past briefs; measure field accuracy ≥ 85% |
| O2 · Sourcing restarts every campaign | a) pool search + match score · b) WhatsApp broadcast to matches · c) referrals from creators | a + b | Broadcast 1 live brief to 300 matches; interest ≥ 15% in 24h |
| O3 · Brand approvals are slow | a) magic-link review room · b) PDF shortlist with better data · c) WhatsApp approval buttons | a (c later) | Next 3 campaigns: approval latency vs last 3 |
| O4 · Creators disengage (ghosting, late pay) | a) status timeline + closure messages · b) payout tracker · c) instant payouts | a + b (c = v3) | Creator NPS + reply rate before/after |
| O5 · Review rounds spiral | a) timestamped comments · b) brief-derived checklist · c) revision cap in contract | a + b + c | Rounds per deliverable on 2 pilots |
| O6 · No-shows at activations | a) T-24h/T-3h confirms · b) backup roster · c) reliability score in matching | all | No-show rate on next 6 activations |
| O7 · Founder has no live margin view | a) proposal → booking cost linkage · b) cockpit | a then b | Reconcile 3 closed campaigns in-system vs Excel |

---

## 6. Hand-offs where campaigns break (and the guard)

| Hand-off | Typical failure | Guard in product |
|---|---|---|
| Brand → AM (brief) | Missing budget split, usage rights, KPIs | `BB-2` gap checklist blocks "publish" until answered or waived |
| AM → creators (alert) | Wrong creators, spam | `MT-2` hard filters + frequency cap; brand masked if confidential |
| AM → brand (shortlist) | Data mismatch, stale stats | Stats refreshed ≤ 7 days before share (`IG-3` on-demand refresh) |
| Creator → reviewer (draft) | Wrong version, compressed WhatsApp file | Upload to R2 at source quality; version number in file name |
| Reviewer → creator (feedback) | Ambiguous notes | Comments pinned to frame + checklist; creator must tick each |
| Creator → AM (live) | Post goes live without approval or tags | `LT-3` live-vs-approved check within 1 h of URL submission |
| AM → finance (payout) | Missing delivery proof | Payment approval requires `delivered` stage + metrics checkpoint or check-in |
| Ops → founder (event) | No-shows hidden until invoice disputes | Attendance export attached to brand invoice |
