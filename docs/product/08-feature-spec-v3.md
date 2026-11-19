# 08 · Feature Spec v3 — by user type

> Extends `03-PRD.md` (v2 P0/P1). Pains and stage IDs (S1–S14) come from `07-campaign-lifecycle-and-pains.md`;
> architecture and cost in `09-architecture-cost.md`; contested choices in `06-decision-log.md` (D10–D20).
> Methods applied: signup-flow-cro (field-by-field friction), activation design, user story mapping, RICE,
> pre-mortem, red team. Prices marked *(verify)* must be checked against the vendor's rate card before launch.

## 0. Principles

| # | Principle | Consequence |
|---|---|---|
| 1 | **Fetch, infer, then ask** | Every field has a source; a human types only what nothing else can know. |
| 2 | **Ask at the moment of need** | Rate at apply, address at barter booking, PAN/UPI at confirmation, DOB only if a brief needs age. |
| 3 | **WhatsApp is the creator's inbox; the web is the record** | Every WhatsApp action deep-links to a web page that holds the state. |
| 4 | **Brands never need an account** | Signed, expiring magic links for shortlist, review, live page, report (D4). |
| 5 | **Nothing slips silently** | Every item with a due date has an owner, an SLA and a nudge. |
| 6 | **Mobile first for creators/brands, keyboard first for the agency** | PWA for talent; dense desktop CRM with shortcuts. |

## 1. User types and their home

| User type | Role key (schema `roles`) | Lands on | Primary device |
|---|---|---|---|
| Creator (influencer, college creator, campus ambassador) | `talent` (new) | `/me` — matching briefs, active bookings, payouts | Android, 4G |
| Event talent | `talent` (`is_event_talent`) | `/me/gigs` — gigs by city, shifts, check-in | Android |
| Brand | `brand_admin`, `brand_member` (new) or magic link | `/b/[token]` — campaign page | Phone + laptop |
| Agency AM | `campaign_manager` | `/crm` — my campaigns, overdue items | Laptop |
| Ops | `ops` (new, agency) | `/crm/ops` — today's shifts, shipments | Phone on-ground, laptop |
| Reviewer | `reviewer` (new, agency) / brand approver via link | `/crm/review` — queue by SLA | Laptop |
| Finance | `finance` (new, agency) | `/crm/finance` — payouts due, invoices | Laptop |
| Founder | `org_owner` | `/crm/cockpit` | Laptop + phone |
| Platform admin | `super_admin`, `platform_ops`, `hr_screener` | `/admin` — screening queue | Laptop |

New permissions: `review.act`, `finance.view`, `finance.pay`, `ops.roster`, `cockpit.view`, `report.share`,
`talent.contact.view` (already implied in blueprint).

---

## 2. Signup & identity (all talent) — `SU`

### 2.1 Flow (creator path) — target median ≤ 45 s, 1 typed field

| Step | Screen | Input | Auto | Exit metric |
|---|---|---|---|---|
| 1 | Landing CTA "Get brand deals" | tap | — | CTA CTR |
| 2 | **Continue with Google** (one-tap prompt auto-shows on Android Chrome) **or Continue with WhatsApp** (phone → OTP via WhatsApp auth template; SMS fallback after 30 s) | 1 tap or phone + 6-digit code (auto-read via WebOTP on Android SMS) | Name, email, avatar (Google) / verified phone (WhatsApp) | Auth success % |
| 3 | "Your Instagram handle" `@____` | **handle (only required typed field)** | Paste-detect from clipboard (`instagram.com/xyz` → `xyz`); live availability check | Handle submit % |
| 4 | Live preview card fills in (skeleton → content in ≤ 15 s): photo, name, followers, ER, avg views, niche chips, city, language | **Confirm** (1 tap) or edit chips | Apify fetch + inference (2.3) | Confirm % |
| 5 | "Are you in college?" Yes / No | 1 tap | Pre-selected Yes if inferred (§3.3) | — |
| 5a | If Yes: college (autocomplete, filtered to detected city) + graduation year (chips 2026–2031) | 2 taps | Inferred college pre-filled with "Is this right?" | College fill % |
| 6 | "Get brief alerts on WhatsApp?" (skipped if they signed in with WhatsApp) | phone or skip | Opt-in recorded with timestamp + text (DPDP + Meta policy) | WA opt-in % |
| 7 | Done → `/me` shows matching briefs + profile strength ring | — | — | **Activation** (§2.4) |

Consent (share profile with partner agencies, `consent_share`) is a pre-ticked-off toggle on step 4 with plain
copy; default **off** for partner agencies, **on** for Vigor (first party). Turnstile runs invisibly on step 2.

**Private IG account:** show "We can only read public profiles — switch to Professional/public or connect with
Instagram Login" (`IG-5`); allow continuing with manual followers (unverified badge).
**Handle already claimed:** "Is this you?" → verify by Instagram Login or by adding a 6-char code to bio
(checked by refetch) → transfer ownership; old claimant notified.

### 2.2 Field-by-field table

Source: **Auto** = fetched (Google/WhatsApp/Apify/Graph API/headers) · **Inferred** = computed or LLM-classified,
shown for 1-tap confirm · **Asked** = typed/selected by the user.

| Field | Source | Detail | When asked/confirmed | Schema |
|---|---|---|---|---|
| Name | Auto | Google profile or IG `full_name`; user picks if they differ | Signup (confirm) | `talent_profiles.display_name` |
| Email | Auto | Google; else bio email; else asked at booking | Signup (Google) / booking | `profiles.email`, `talent_contacts.email` |
| Phone / WhatsApp | Auto (WA OTP) / Asked | Required before first "I'm in" for event talent; before booking for creators | Signup (WA path) / step 6 / booking | `talent_contacts.phone`, `whatsapp` |
| Photo | Auto | IG profile pic copied to R2 (IG CDN URLs expire) | Signup | `photo_url` |
| Bio | Auto | IG biography | Signup | `bio`, `social_accounts.biography` |
| Instagram handle | Asked | **Only required typed input** | Signup | `social_accounts.handle` |
| Followers / following / posts | Auto | Apify; Graph API if connected | Signup; refresh by tier | `social_accounts.*` |
| ER, avg likes/comments/views, view rate | Inferred | Last 12 posts; Reels views separately | Signup | `engagement_rate`, `view_rate` |
| Niche / categories | Inferred | LLM on bio + last 12 captions + hashtags → top 3 of the category taxonomy | Signup (confirm chips) | `categories` |
| Content language | Inferred | Caption language detection (en, hi, Hinglish, mr, ta, te, kn, bn, gu) | Signup (confirm) | `languages` |
| City | Inferred | Priority: bio text → post location tags (mode of last 12) → Cloudflare `cf-ipcity` | Signup (confirm) | `city` |
| In college? | Asked (pre-filled if inferred) | §3 | Signup | new `talent_education` |
| College, graduation year | Inferred / Asked | §3.3 inference; autocomplete | Signup (if yes) | `talent_education.college_id`, `graduation_year` |
| Business category, verified, external link | Auto | Apify | Signup | `social_accounts.*` |
| Gender | Inferred → Asked | Not inferred from photos (bias, DPDP). Asked only if a brief filters by gender | Progressive (at apply when needed) | `gender` |
| Date of birth / age band | Asked | Only if a brief has age rules (alcohol-adjacent, 18+) | At apply | `date_of_birth` |
| Rate card (per reel, story, post) | Inferred → Asked | Suggested from tier × niche × city benchmark; user adjusts slider | Progressive (first apply) | `rate_per_post` + new `rate_cards` |
| Availability / exam weeks | Asked | Calendar chips | Progressive (after 1st apply) | new `talent_availability` |
| Course, clubs/societies, campus ambassador interest | Asked | §3.2 | Progressive (profile strength) | `talent_education` |
| Student verification | Asked | College email OTP or ID upload | Progressive (unlocks "verified student" badge) | `talent_education.verified_at` |
| Audience age/gender/city, reach | Auto (consented) | Instagram Login (`IG-5`) | Progressive (after first shortlist) | new `audience_insights` |
| Shipping address | Asked | Only for barter/product bookings | At booking | new `shipments` |
| PAN, UPI/bank, GST (optional) | Asked | Validated; encrypted | At booking confirmation | new `payout_profiles` |
| Portfolio / showreel | Auto + Asked | Top 6 reels auto-picked by views; user can reorder | Progressive | `talent_media` |
| Event roles, rates by rank (event talent) | Asked | Role tiles | Signup (event path) | `skills`, `rate_half_day`, `rate_full_day` |

### 2.3 Inference rules (signup preview)

| Signal | Rule | Confidence shown |
|---|---|---|
| Niche | LLM classifies bio + 12 captions + top hashtags into taxonomy (food, fashion, beauty, tech, fitness, comedy, dance, music, travel, finance, gaming, education, lifestyle, campus life, regional) | Chips pre-selected if p ≥ 0.6 |
| City | Regex/gazetteer on bio (e.g., "Mumbai", "BOM", "📍Pune" stripped to text), location tags, then IP city | Pre-selected; "Change" link |
| Language | fastText-style detection per caption, majority + Hinglish detector (Latin script Hindi lexicon) | Pre-selected |
| Tier | nano < 10K, micro 10–100K, mid 100–500K, macro 500K–1M, mega > 1M | Shown, not editable |
| Quality score (agency-only) | ER vs tier median, likes/comments ratio, follower growth spikes, following/follower ratio | Never shown to creator |

### 2.4 Activation (per role)

| Role | Activation moment (first real value) | Target TTV | Metric | Main blocker → fix |
|---|---|---|---|---|
| Creator | Taps "I'm in" on a matching brief | ≤ 7 days from signup | % activated in 7 d | No matching open brief → "upcoming briefs" + evergreen campus ambassador brief always open |
| College creator | Joins a college-filtered brief or ambassador programme | ≤ 7 days | same, by college | College not in list → "add my college" (admin-verified in 24h) |
| Event talent | Confirmed for a first shift | ≤ 21 days | % confirmed in 21 d | Screening backlog → video intro + 10-min slot booking |
| Brand | Approves a shortlist in the review room | ≤ 48 h from brief | approval latency | Opening link on laptop only → WhatsApp delivery + mobile layout |
| Agency AM | Publishes a brief that gets ≥ 10 interested matches | first day of use | interests per brief | Empty pool in a city → import CSV of past creators (`AD-5`) |
| Finance | First payout marked paid with UTR | first campaign | % payouts with UTR | Missing PAN/UPI → collected at booking |

---

## 3. College creator flow — `CO`

### 3.1 Signup (asked once)

| Q | UI | Data |
|---|---|---|
| Are you in college? | Yes / No (Yes pre-selected if inferred) | `talent_education.status` = `student` / `alumni` / `none` |
| Which college? | Autocomplete, city-filtered first, then all-India; shows short names ("NM", "Mithibai", "SXC") | `college_id` |
| Graduating in? | Chips 2026–2031 + "Already graduated" | `graduation_year` |

### 3.2 Progressive (profile strength; each unlocks something)

| Field | Unlock copy | Data |
|---|---|---|
| Course + stream (BMS, BMM, BCom, BTech, BA, BBA, MBA…) | "Brands target by course for 3 briefs this month" | `course`, `stream` |
| Clubs / societies / fest committees (Malhar, Kshitij, Mood Indigo, Umang…) | "Fest briefs go to committee members first" | `clubs[]`, `fest_roles[]` |
| Campus ambassador interest + role (rep, content, events) | "Join the Vigor campus programme — points, certificates, paid tasks" | `ambassador_status` |
| Student verification | "Verified students get 2× visibility on campus briefs" | `verified_at`, `verification_method` |
| Hostel / day scholar, campus reach estimate (WhatsApp groups they can reach) | For on-ground distribution briefs | `campus_reach` |

### 3.3 Inferring college (before asking)

| Source | Method | Example | Weight |
|---|---|---|---|
| Google / college email domain | Domain → college map (`college_domains` table), seeded with known domains and learned from verified users | `@nmims.in`, `@somaiya.edu`, `@iitb.ac.in`, `@xaviers.edu.in` | High (and auto-verifies if OTP sent to it) |
| `.ac.in` / `.edu.in` / `.edu` domain not in map | Flag as student; suggest colleges whose website domain matches (AISHE has website field for many) | `@college.ac.in` | Medium |
| IG bio text | Alias dictionary (official name, short forms, IG handles of colleges) + year patterns (`'27`, `Class of 2027`, `BMS 2nd yr`, 🎓) | "BMM @mithibai_college '27" | Medium–high |
| Bio @mentions | Match against `colleges.instagram_handle` | `@stxaviersmumbai` | High |
| Post location tags | Geo-match to campus coordinates (≤ 300 m) in ≥ 3 of last 12 posts | Tag "Jai Hind College" | Medium |
| Fest mentions | Fest → college map | "Kshitij core team" → Mithibai | Medium |
| IP city | Only filters the autocomplete list | `cf-ipcity` = Pune | Low |

Rule: combined score ≥ 0.7 → pre-fill "Is this your college?"; 0.4–0.7 → show as first suggestion; < 0.4 → plain
autocomplete. Never mark as verified from inference alone.

### 3.4 College data (AISHE)

| Item | Spec |
|---|---|
| Source | AISHE (All India Survey on Higher Education, Ministry of Education) college & university directory — names, AISHE code, state, district, type, management, affiliating university, website where present |
| Load | One-time import + yearly refresh into `colleges` (name, short_names[], aishe_code, city, district, state, university, type, website_domain, instagram_handle, lat/lng, is_active) |
| Enrich | Vigor team adds short names, IG handles, fest names, coordinates for the top ~500 youth-campaign colleges in launch cities first |
| Search | Postgres `pg_trgm` + `unaccent` on name + aliases, boosted by city match and popularity (creator count) |
| Missing college | "Add my college" → pending row, admin merges/approves in 24 h |

### 3.5 Student verification

| Method | Cost | Strength | When |
|---|---|---|---|
| College email OTP (email magic code) | ~free | High | Default if student has a college email |
| Student ID upload (front, with name + college + validity) | Manual review ~1 min | Medium | Fallback; image deleted after 30 days, only result kept |
| DigiLocker / APAAR ID | Integration effort | Highest | Later; evaluate if fraud appears (D19) |

### 3.6 Campus ambassador programme (`CO-6`)

Persistent across brands: ambassador profile, points ledger (tasks done, referrals, fest activations),
levels (Rep → Lead → Captain per college), monthly college leaderboard (`CO-5`), certificates (PDF), referral
link ("bring 3 friends from your college"). Brands buy "ambassador packs" (e.g., 30 colleges × 1 lead).

---

## 4. Instagram integration — `IG`

| ID | Capability | Now (v3.0): Apify public scrape | Next: Instagram API with Instagram Login |
|---|---|---|---|
| IG-1 | Profile auto-fill | `instagram-profile-scraper` by handle: name, bio, pic, followers, following, posts, verified, category, external URL, latest posts | `instagram_business_basic`: profile fields, media list |
| IG-2 | Post stats | Likes, comments, video views/plays, captions, hashtags, mentions, location, timestamp | Media insights: reach, views, saves, shares, total interactions |
| IG-3 | Refresh | Tiered cadence (09 §6); on-demand "Refresh" for AM (rate-limited 1/day/creator) | Free API calls; refresh daily for connected creators |
| IG-4 | Quality score | ER vs tier median, comment/like ratio, growth spikes from snapshots, generic-comment ratio | Plus reach/follower ratio (true reach) |
| IG-5 | Verified insights | — | `instagram_business_manage_insights`: audience **age, gender, city, country** (`follower_demographics`, needs ≥ 100 followers), account reach & views, profile taps. Badge "Verified insights"; +match score |
| IG-6 | Live post tracking | Post URL → scrape at 24h / 72h / 7d (+ 30d for reports) | Media insights at the same checkpoints (exact reach, saves) |
| IG-7 | Compliance scan | Caption contains brand @, required hashtags, `#ad`/`#collab`/Paid partnership label where detectable | Same + partnership label from API where available |

**Constraints:** Instagram Login works only for Professional (Creator/Business) accounts; tokens are long-lived
(~60 days) and must be refreshed by cron; Meta app review needs a screencast per permission; verify the exact
metric names at build time (Meta renamed `impressions` → `views` in 2025). Scraping is public-data only and
sits in a ToS grey zone (D8) — keep Apify isolated behind one adapter so it can be swapped.

**Prompt to connect:** after first shortlist ("Brands approve verified creators 2× faster" — measure before
claiming), never at signup (D12).

---

## 5. WhatsApp integration — `WA`

**Channel:** Meta WhatsApp Business **Cloud API** direct (D13). Number: dedicated Vigor sender with display
name "Vigor Talent Network", green-tick later.

| ID | Use | Mechanism |
|---|---|---|
| WA-1 | OTP login | Authentication template with copy-code / one-tap autofill button (Android) |
| WA-2 | Brief alerts | Template to top-N matches per brief; **frequency cap 2/week**; weekly digest when > 2 matches |
| WA-3 | Status & reminders | Utility templates on each pipeline transition and due date |
| WA-4 | 1-tap interest | Quick-reply buttons "I'm in" / "Not for me" / "Ask a question" → webhook creates `intent` (source `applied`, channel `whatsapp`) |
| WA-5 | Quick apply form | **WhatsApp Flows**: rate quote + availability + 1 question inside WhatsApp for briefs that need it |
| WA-6 | Content submission | Utility template with button → signed upload link (R2); live URL can also be replied as text inside 24h window and parsed |
| WA-7 | Payment updates | Utility: approved, paid (with UTR), failed (fix UPI) |
| WA-8 | Event ops | T-24h confirm, T-3h "on the way?", check-in link, shift change |
| WA-9 | Inbox for AMs | Inbound messages threaded per talent × booking in the CRM; reply free-form inside the 24h service window |

### 5.1 Cost (India) *(verify on Meta's current rate card)*

| Category | Price per delivered template (INR, approx.) | Our use |
|---|---|---|
| Marketing | ~₹0.78–0.86 | Brief alerts and digests (budget them as marketing even if submitted as utility; Meta may reclassify) |
| Utility | ~₹0.115; **free inside an open 24h customer-service window** | Status, reminders, payments |
| Authentication | ~₹0.115 | OTP |
| Service (free-form replies inside 24h after user message) | Free | Q&A, live-URL replies |

Messaging limit starts low for a new number (e.g., 250 business-initiated unique users / 24h) and rises with
verification and quality — plan the launch broadcast around it.

### 5.2 Message templates (v3.0 set)

Variables in `{{n}}`. Language variants: `en`, `hi` (Hinglish copy reviewed by the team).

| Name | Category | Body (en) | Buttons |
|---|---|---|---|
| `otp_login` | Authentication | `{{1}} is your Vigor login code. Do not share it.` | Copy code / autofill |
| `brief_match` | Marketing | `Hi {{1}}, a new paid brief matches you: {{2}} ({{3}}). Pay: {{4}}. Apply by {{5}}.` | I'm in · Not for me · View brief |
| `brief_digest` | Marketing | `{{1}}, {{2}} new briefs match your profile this week, top pay {{3}}.` | See briefs |
| `interest_received` | Utility | `Got it, {{1}}! You're on the list for {{2}}. We'll update you by {{3}}.` | View status |
| `shortlisted` | Utility | `Good news {{1}} — you're shortlisted for {{2}}. The brand decides by {{3}}.` | View |
| `not_selected` | Utility | `{{1}}, the brand went another way for {{2}}. Your profile stays in the pool for future briefs.` | See open briefs |
| `booking_confirmed` | Utility | `You're confirmed for {{2}}, {{1}}. Fee {{3}}, first draft due {{4}}. Accept terms to lock it.` | Accept terms · View brief |
| `payout_details_needed` | Utility | `{{1}}, add your UPI/PAN once so we can pay you for {{2}}.` | Add details |
| `draft_due` | Utility | `Reminder: your draft for {{1}} is due {{2}}.` | Upload draft |
| `draft_feedback` | Utility | `{{1}} left {{2}} comments on your draft for {{3}}.` | See feedback |
| `draft_approved` | Utility | `Approved! Post {{1}} on {{2}} at {{3}} and send us the link.` | Submit live link |
| `golive_reminder` | Utility | `{{1}} goes live today at {{2}}. Remember {{3}}.` (tags) | Submit live link |
| `live_link_missing` | Utility | `We couldn't find your live post for {{1}}. Please share the link.` | Submit link |
| `payment_update` | Utility | `Payment for {{1}}: {{2}}. {{3}}` (status, UTR/date) | View |
| `event_confirm_24h` | Utility | `{{1}}, you're on shift at {{2}}, {{3}} tomorrow {{4}}. Still coming?` | Coming · Can't make it |
| `event_on_the_way` | Utility | `Shift at {{1}} starts {{2}}. Check in on arrival.` | Check in · Running late |
| `shift_changed` | Utility | `Update for {{1}}: {{2}}.` | View |
| `brand_approval_request` | Utility | `{{1}}, {{2}} creators are ready for your approval for {{3}}.` | Review now |
| `brand_report_ready` | Utility | `Your {{1}} report is ready: {{2}} views, {{3}} engagements.` | Open report |

**Compliance:** explicit opt-in text stored (who, when, wording, channel); per-type mute; quiet hours 21:00–09:00 IST
(except OTP and same-day event ops); STOP keyword → unsubscribe marketing; quality rating monitored daily.

---

## 6. Creator features — `CR`

| ID | Feature | Spec | Acceptance |
|---|---|---|---|
| CR-1 | Matching briefs feed | Only eligible open briefs (hard filters: city, tier, niche, college, language, gender/age if set, availability); sorted by match score and pay | Ineligible briefs never shown; "Why this matches you" chips |
| CR-2 | Brief page | Brand (or masked), pay type (cash/barter/both) and value, deliverables, dates, usage rights, exclusivity, revision limit | All contract-relevant terms visible before "I'm in" |
| CR-3 | One-tap interest | Web or WhatsApp; optional quote (pre-filled from rate card) | Intent created < 2 s; confirmation message |
| CR-4 | Application status timeline | Interested → Shortlisted → Brand review → Confirmed / Not selected; auto-close 48h after brief closes | Zero applications left open after campaign end |
| CR-5 | Bookings & deliverables | Checklist per booking, due dates, upload, live link submit | Upload resumable on 4G; ≤ 2 GB per video |
| CR-6 | Media kit link | Public-or-private shareable page with live stats | Loads < 1.5 s LCP |
| CR-7 | Availability | Exam weeks, travel, busy dates | Matching excludes busy dates |
| CR-8 | Earnings | Per booking: fee, TDS, net, status, expected date, UTR | Matches finance ledger |
| CR-9 | Profile strength | Ring with next best action and the unlock it gives | Each step ≤ 30 s |
| CR-10 | Ranks, badges, referrals | Verified student, Verified insights, On-time 10/10, Top in college; referral rewards after friend's first booking | Fraud checks on referrals |

## 7. Event talent features — `EV`

| ID | Feature | Spec |
|---|---|---|
| EV-7 | Gigs feed | By city, role, date, rank-based rate; "I'm in" + availability |
| EV-1 | Roster (ops side) | Venue × shift × role grid; drag talent in; backups per shift |
| EV-2 | Call sheet | Venue map link, reporting time, POC, dress code, brief, payment terms |
| EV-3 | Confirms | T-24h, T-3h WhatsApp; "Can't make it" triggers EV-5 |
| EV-4 | Check-in/out | Geofence (≤ 200 m of venue) + selfie; offline-tolerant (queued in PWA); supervisor override |
| EV-5 | Auto-replacement | Ranked list of available talent within X km, same role, rank ≥ required; one-tap broadcast |
| EV-6 | Shift rating | Supervisor: punctuality, performance, attitude (1–5) → reliability score and rank |
| EV-8 | Screening | Video intro (60 s), auto-booked 10-min call slot, rubric scoring by `hr_screener` |

## 8. Brand features — `BP` (magic link first; optional login P2)

| ID | Feature | Spec |
|---|---|---|
| BP-1 | Brief intake | Public form or "send us anything" WhatsApp/email; AI pre-structures |
| BP-2 | Live campaign page | Status per creator (approved, drafting, in review, live), next milestones, live posts embed, headline metrics |
| BP-3 | Brand kit | Logo, guidelines PDF, do/don't, mandatory tags/hashtags, past approved content; reused per campaign |
| SL-1 | Shortlist room | Cards: photo, handle, tier, ER, avg views, city, college, niche, past brands, 3 sample reels, quality badge, fee band (not contacts — D4); approve / reject / maybe + comment; named approvers; due-by timer |
| RV-1 | Content approval | Same review room as reviewers (§11) with "Brand approver" role |
| RP-1 | Report | Live link + PDF |
| BP-4 | Proposal view | Plan, estimate, terms; "Approve proposal" with name + timestamp (logged) |

Magic links: signed token (hashed at rest), scope (campaign + action), expiry (default 14 days, extendable),
optional OTP-to-email for second open on a new device, every action audit-logged.

## 9. Agency AM features

### 9.1 Brief builder — `BB`

| ID | Spec |
|---|---|
| BB-1 | **Paste or forward anything:** paste text, upload PDF/PPT/image, or forward email to `briefs@` (Cloudflare Email Routing → Email Worker) or WhatsApp to the Vigor number. LLM extracts: brand, product, objective, audience (age, gender, cities, colleges, SEC), talent mix (creators by tier, event roles, counts), deliverables (reel/story/post/YouTube short; event shifts), dates, budget (total / per head), KPIs, usage rights, exclusivity, approvals, confidentiality |
| BB-2 | **Gap checklist:** missing or ambiguous fields highlighted; one click generates a polite WhatsApp/email with only the open questions |
| BB-3 | **Confidence per field** (green/amber); AM confirms in a form; source span highlighted in the original text |
| BB-4 | **Templates:** college launch, fest sponsorship, campus sampling, app installs, UGC pack; pre-fill deliverables and checklist |
| BB-5 | Creates `campaign` + `brief(s)` + draft `proposal` in one save |

Acceptance: on 20 historical briefs, ≥ 85% of fields correctly extracted; brief structured in < 10 min AM time.

### 9.2 Proposal & costing — `PC`

| ID | Spec |
|---|---|
| PC-1 | Rate benchmarks: median & IQR agreed fee by tier × niche × city × deliverable from `bookings` history; falls back to rate cards |
| PC-2 | Plan builder: lines (tier, city/college, count, deliverables, unit cost, unit price) → total cost, price, margin %, GST; **margin floor** (e.g., 25%) needs founder approval |
| PC-3 | Reach estimate: Σ avg views × count with 70% confidence band; CPV/CPE estimate |
| PC-4 | Pool feasibility: "You have 63 matching creators for this line, 41 active in last 30 days" |
| PC-5 | Proposal share link + PDF; versioned; brand approves in BP-4 |

### 9.3 Matching & scoring — `MT`

**Hard filters** (must pass): talent type, city/college, tier/followers, ER min, language, gender/age (only if
brief requires), availability, not blocked, no competitor exclusivity conflict in window.

**Match score (0–100):**

| Component | Weight | Signal |
|---|---|---|
| Content fit | 30 | Niche overlap + embedding similarity of captions to brief |
| Audience fit | 20 | Creator city/college vs target; verified demographics if connected (bonus) |
| Performance | 15 | ER and view rate vs tier median (percentile) |
| Reliability | 15 | On-time rate, ratings, no-shows, response time |
| Cost fit | 10 | Rate vs budget per head |
| Freshness | 5 | Active in last 30 days, stats refreshed ≤ 14 days |
| Verification | 5 | Verified student / insights / phone |

Plus **diversity constraint** (max N per college/handle cluster), **fatigue rule** (deprioritise creators who
posted ≥ 3 sponsored posts in 7 days), and an explanation ("Why ranked #4") on every card.

| ID | Spec |
|---|---|
| MT-1 | Pool search: filters incl. college, graduation year, course, clubs, ambassador, verified; saved searches |
| MT-2 | Eligibility engine shared by creator feed and AM search |
| MT-3 | Broadcast: send `brief_match` to top N (default 3× required count, cap 500), respects frequency caps |
| MT-4 | Lookalikes: "more like this creator" (embedding nearest neighbours) |
| MT-5 | Backups: approved-but-not-booked creators kept ranked; auto-offer if a booking drops |

### 9.4 Shortlist share & approval — `SL` (see BP §8)
AM curates from intents + invites → "Share with brand" → link via WhatsApp/email → approvals stream back in
real time; AM sees who opened, when, and what's pending.

### 9.5 Contracting & briefing — `CT`, `BR`

| ID | Spec |
|---|---|
| CT-1 | Booking terms from template: fee, deliverables, dates, revision limit, usage rights (organic only / paid ads N days), exclusivity (category, days), payment terms, cancellation |
| CT-2 | Click-accept with OTP (logged IP, timestamp, version hash) default; Aadhaar eSign via provider for high-value bookings (D18) |
| BR-1 | Creator brief page per booking: key message, do/don't, mandatory tags/hashtags/links, references, product shipping status, FAQ |
| BR-2 | Brief Q&A: creator asks → answer once → added to FAQ for all |
| OP-1 | Shipments: address at booking, courier + tracking link, "Received" tap; barter value logged for TDS 194R |

### 9.6 Deliverable tracker — `DT`

| ID | Spec |
|---|---|
| DT-1 | Grid: creator × deliverable with status (not started, draft due, in review, changes, approved, scheduled, live, verified), due date, owner, SLA colour |
| DT-2 | Auto-nudges: T-48h, T-24h, overdue (creator); review SLA (reviewer); approval SLA (brand) |
| DT-3 | Bulk actions: extend dates, message all late, reassign reviewer |
| DT-4 | Keyboard: `j/k` move, `a` approve, `c` comment, `/` search, `g c` go campaigns |

### 9.7 Live tracking & reports — `LT`, `RP`

| ID | Spec |
|---|---|
| LT-1 | Live URL capture (web or WhatsApp reply) → validates it belongs to the creator's handle |
| LT-2 | Metrics at 24h, 72h, 7d, 30d; views, likes, comments, shares/saves (if connected) |
| LT-3 | Live-vs-approved check: caption diff, tags present, posted within the agreed window |
| LT-4 | Anomaly flags: views < 30% of creator's average, post deleted, comments disabled |
| RP-1 | Report: headline (posts, reach/views, engagements, ER, CPV, CPE vs estimate), per-creator table, content gallery, top comments, learnings box (AM), event attendance section; share link + PDF; brand logo |
| RP-2 | Benchmarks feed back to PC-1 automatically |

## 10. Ops features — see `EV-1…EV-6`, `OP-1`, plus

| ID | Spec |
|---|---|
| OP-2 | Today view: shifts by venue, check-in status live, late/no-show alerts |
| OP-3 | Kit checklist per venue (standees, samples, T-shirts) with photo proof |
| OP-4 | Permissions tracker (college permission letters, venue NOCs) with expiry |

## 11. Reviewer features — `RV`

| ID | Spec |
|---|---|
| RV-1 | **Versioned submissions**: v1, v2…; side-by-side or toggle compare; approved version hash locked; creator can't overwrite an approved version |
| RV-2 | **Frame-accurate comments**: player shows timecode + frame number (from file fps); comment pins to `t` and optional region drawing; keyboard `,`/`.` step one frame, `space` play; images get pin-point comments |
| RV-3 | Comment → task: each comment is a checkbox the creator must resolve; reviewer re-checks only open items in v2 |
| RV-4 | Decision: Approve · Request changes · Reject; round counter vs contract limit; extra rounds need AM override |
| RV-5 | Compliance checklist auto-generated from brief: brand tag, hashtags, #ad/Paid partnership, claims (no "best/No.1" without proof), music licensing (use IG library audio), safe-content, logo visibility; reviewer ticks |
| RV-6 | Two-step approval: internal reviewer → brand approver (parallel allowed); SLA timers each |
| RV-7 | Caption review: caption is part of the submission, diffed between versions |
| RV-8 | Media: upload direct to R2 via presigned multipart; transcode-free playback of MP4/H.264; proxy preview for HEVC from iPhones (Stream later if needed) |

## 12. Finance features — `FN`

| ID | Spec |
|---|---|
| FN-1 | Brand invoices: milestone schedule from proposal (e.g., 50% advance / 50% on report), GST 18%, invoice number series, due date, status, reminders |
| FN-2 | Payout profile: PAN (format + name match where API available), UPI ID (validate via provider) or bank + IFSC; GSTIN optional; encrypted at rest; collected at confirmation |
| FN-3 | Payments ledger per booking: payable, TDS, net, status (pending → approved → paid → failed), UTR, date; creator sees it in CR-8 |
| FN-4 | TDS defaults by payee type (e.g., professional fee vs contract vs barter perquisite), configurable by the CA; annual TDS summary per payee *(confirm sections and rates with the CA)* |
| FN-5 | Exports: payouts batch CSV (bank bulk upload), Tally/Zoho CSV; v3 RazorpayX/Cashfree payouts (D6) |
| FN-6 | Approval rule: payout approvable only when booking `delivered` + live verified (or event check-in) |

## 13. Founder cockpit — `FC`

| ID | Widget | Definition |
|---|---|---|
| FC-1 | Margin | Per campaign: proposal margin vs actual (price − creator fees − ops costs); org-wide this month |
| FC-2 | Team load | Per AM: active campaigns, open deliverables, overdue items, review queue; capacity line |
| FC-3 | SLA breaches | Brief→proposal > 24h, approval wait > 48h, review > 24h, payout > 15 days, no-shows |
| FC-4 | Cash | Receivables ageing (0–30/31–60/60+), payables due next 14 days, net |
| FC-5 | Pipeline value | Enquiries & proposals × stage probability; win rate; average deal size |
| FC-6 | Pool health | Active creators by city/college/niche; new signups; % verified; brief interest rate |
| FC-7 | Weekly digest | Monday 9:00 IST WhatsApp/email summary of FC-1…FC-6 |

## 14. Platform admin — `AD`

| ID | Spec |
|---|---|
| AD-1 | Screening queue with auto-signals (IG fetched, quality score, duplicates by phone/handle/face-free hash of avatar, student verified) and bulk approve |
| AD-2 | College directory admin: merge duplicates, add aliases, IG handles, domains, coordinates |
| AD-3 | Rank rubric config + rank history |
| AD-4 | Taxonomy (niches, event roles), message templates registry, frequency caps |
| AD-5 | Import tool: CSV/Sheets of past creators → create unclaimed profiles (invite to claim) |
| AD-6 | Tenants, licences, usage metering (`usage_events`), audit log, DPDP requests (export/delete) |
| AD-7 | Integration health: Apify run failures, WhatsApp quality rating & limits, queue depth, DLQ |

## 15. Notifications matrix

Channels: **WA** WhatsApp · **E** email · **In** in-app · **P** web push (PWA, opt-in) · — none.

| Event | Creator | Event talent | Brand | AM | Ops | Reviewer | Finance | Founder |
|---|---|---|---|---|---|---|---|---|
| New enquiry / brief received | — | — | E (ack) | In, WA | — | — | — | In |
| Proposal shared / approved | — | — | WA, E | In | — | — | In (terms) | In (if < margin floor) |
| Brief published, match | WA (cap), In | WA (cap), In | — | — | — | — | — | — |
| Interest received | WA (ack), In | WA, In | — | In (digest hourly) | — | — | — | — |
| Shortlisted / not selected | WA, In | WA, In | — | — | — | — | — | — |
| Shortlist ready for approval | — | — | WA, E | In | — | — | — | — |
| Brand approved/rejected creator | — | — | — | In, P | — | — | — | — |
| Booking confirmed / terms accepted | WA, E, In | WA, In | In (live page) | In | In (if event) | — | In | — |
| Payout details needed | WA, In | WA, In | — | — | — | — | In | — |
| Draft due (T-48h/T-24h/overdue) | WA, In | — | — | In (overdue) | — | — | — | — |
| Draft submitted | In | — | — | In | — | In, P | — | — |
| Feedback / approved | WA, In | — | — | In | — | — | — | — |
| Brand approval needed for content | — | — | WA, E | In | — | — | — | — |
| Go-live reminder / missing live link | WA | — | — | In (missing) | — | — | — | — |
| Live post anomaly | — | — | — | In, P | — | In | — | — |
| Shift T-24h / T-3h / changed | — | WA | — | — | In | — | — | — |
| No-show / late | — | WA (replacements) | — | In | In, P, WA | — | — | In (digest) |
| Report ready | — | — | WA, E | In | — | — | — | In |
| Invoice raised / overdue | — | — | E | In | — | — | In | In (overdue > 30d) |
| Payout approved / paid / failed | WA, In | WA, In | — | — | — | — | In | — |
| SLA breach | — | — | — | In, P | In | In | In | In (daily digest) |
| Weekly digest | E (earnings) | — | E (campaign) | E | — | — | E | WA, E |

Rules: one channel per event unless urgent; WhatsApp honours quiet hours and caps; in-app is always written so
history is complete; brand messages only to named approvers.

---

## 16. User story map (backbone → release slices)

| Activity → | Join | Get matched | Get booked | Create | Go live | Get paid / reported |
|---|---|---|---|---|---|---|
| **R1 · v3.0 (walking skeleton)** | Google/WA auth, IG handle auto-fill, college yes/no + autocomplete | Matching feed, `brief_match` WA, 1-tap interest | Shortlist room, booking with click-accept | Upload draft, versioning, basic comments | Live URL + 24h/7d metrics | Payout ledger + UTR, simple report |
| **R2 · v3.1** | Inferred college, student email verify, progressive profile | Match score + explanations, frequency caps, digest | Brief builder (paste), proposal & costing, payout profile at confirm | Frame-accurate comments, checklist, round limits | Compliance scan, anomalies | Report PDF, brand invoices, founder cockpit v1 |
| **R3 · v3.2** | Instagram Login insights, ambassador programme | Lookalikes, backups auto-offer, WhatsApp Flows apply | E-sign above threshold, shipments | Brand kit reuse, two-step approval | 30d checkpoint, live-vs-approved | Cockpit cash & SLA, benchmarks loop, RazorpayX payouts (v3 per D6) |
| **Event lane** | Role tiles, video intro | Gigs feed (R1) | Roster + call sheet (R2) | — | Check-in + replacements (R2) | Shift rating → rank (R2) |

---

## 17. "What else makes everyone's work easier" — ranked by RICE

Reach = users affected per quarter *(est.)*; Impact 0.25–3; Confidence %; Effort = person-weeks.
RICE = R × I × C / E.

| # | Idea | Who | R | I | C | E | RICE |
|---|---|---|---|---|---|---|---|
| 1 | Auto "not selected" closure + status timeline | Creators | 5000 | 2 | 90% | 1 | **9000** |
| 2 | WhatsApp 1-tap "I'm in" quick replies | Creators | 5000 | 2 | 80% | 1.5 | **5333** |
| 3 | Payout tracker with UTR visible to creator | Creators, finance | 2000 | 2 | 90% | 1 | **3600** |
| 4 | Clipboard paste-detect + live IG preview at signup | Creators | 4000 | 1 | 90% | 1 | **3600** |
| 5 | Evergreen "campus ambassador" brief so every new student has something to join | College creators | 3000 | 1 | 80% | 1 | **2400** |
| 6 | Auto-nudges for drafts/live links (T-48/T-24/overdue) | AM, creators | 1500 | 2 | 90% | 1.5 | **1800** |
| 7 | Exam-week availability that matching respects | College creators | 3000 | 0.5 | 80% | 1 | **1200** |
| 8 | Hinglish/Hindi template variants | Creators | 2000 | 0.5 | 60% | 0.5 | **1200** |
| 9 | Brief FAQ auto-answer (answer once, reuse) | Creators, AM | 2000 | 0.5 | 70% | 1 | **700** |
| 10 | Auto-generated creator invoice (for creators without invoicing know-how) | Creators, finance | 1500 | 1 | 70% | 1.5 | **700** |
| 11 | College leaderboard + referral rewards | College creators | 3000 | 1 | 50% | 3 | **500** |
| 12 | Media-kit link creators share outside Vigor ("Book via Vigor") | Creators, growth | 3000 | 0.5 | 60% | 2 | **450** |
| 13 | Shortlist "who opened / pending approvers" tracker | AM, brand | 120 | 2 | 80% | 0.5 | **384** |
| 14 | Barter value + shipment tracker | Ops, finance | 600 | 1 | 80% | 1.5 | **320** |
| 15 | "Running late" button + ETA share for event talent | Ops, event talent | 400 | 1 | 80% | 1 | **320** |
| 16 | Live-vs-approved check within 1h of posting | Reviewer, brand | 600 | 1 | 70% | 2 | **210** |
| 17 | Gap-question generator from pasted brief (reach = briefs/quarter) | AM, brand | 120 | 3 | 70% | 2 | **126** |
| 18 | Rate benchmark tooltip in proposal | AM, founder | 40 | 2 | 60% | 2 | **24** |
| 19 | Saved replies for AMs in WhatsApp inbox | AM | 10 | 1 | 90% | 0.5 | **18** |
| 20 | Founder Monday digest on WhatsApp | Founder | 3 | 3 | 90% | 0.5 | **16** |

**Read:** creator-side items dominate RICE because reach is large; agency-side items (13, 17, 18, 19, 20) have
small reach but each saves hours per campaign — treat them as **must-haves for the paying side** rather than
ranking them purely by RICE. Recommended next 6: #1, #2, #3, #4, #6, #17 (#17 ships with the brief builder, BB-2).

---

## 18. Pre-mortem — "It's May 2027 and v3 failed. Why?"

### Tigers (real risks)

| Risk | Class | Mitigation | Owner | By |
|---|---|---|---|---|
| Meta classifies `brief_match` as marketing and/or the new number's limit (≈250/day) throttles launch broadcasts; quality rating drops from spammy alerts | Launch-blocking | Budget as marketing; strict caps; warm the number with utility traffic; start Business verification now | Founder + Eng | Before R1 launch |
| Apify actor breaks or IG blocks scraping → signup preview fails | Launch-blocking | Adapter with 2 actors + manual-entry fallback; "syncing" state never blocks signup; Instagram Login path | Eng | R1 |
| Not enough open briefs → new creators never activate | Launch-blocking | Evergreen ambassador brief; seed pool via AD-5 import of past creators; time signup pushes with live campaigns | AM lead | R1 |
| AMs keep working in WhatsApp; system becomes a second job | Fast-follow | WA inbox inside CRM; auto-capture of live links; measure % deliverables tracked in-product weekly | Product | R2 |
| Payout promises (≤ 15 days) broken by brand payment delays | Fast-follow | Founder decides float policy; show "expected date" honestly; FC-4 cash view | Founder + finance | R2 |
| OpenNext on Workers hits bundle/CPU limits for CRM routes | Fast-follow | Paid plan from day 1; split heavy routes; perf CI budget | Eng | R1 |

### Paper tigers

| Concern | Why overblown |
|---|---|
| "Creators won't sign in with Google" | Two equal options (Google, WhatsApp); students overwhelmingly have both |
| "AI brief parsing will be wrong" | Human confirms every field; value is the 80% pre-fill, not autonomy |
| "Brands want logins" | Magic links reduce friction; logins can be added (P2) without rework |

### Elephants

| Unspoken worry | How to investigate |
|---|---|
| Is scraped public data + profile building acceptable under DPDP and IG ToS at 100K scale? | Legal opinion before public profiles/SEO (D5) and before partner-agency licensing |
| Will partner agencies trust a pool owned by a competitor agency? | 5 interviews with Mumbai/Pune agencies before Phase 3 build |
| Do brands actually pay more for "college graph" targeting? | Price test in next 5 proposals: campus-targeted line vs generic |

## 19. Red team — top kill-assumptions

| Claim | Fails if | Evidence this week | Kill criterion | Cheapest test |
|---|---|---|---|---|
| One required field (IG handle) gives a usable profile | Apify preview > 15 s or wrong niche/city for > 30% | Run 200 known handles through the pipeline | Median > 15 s or accuracy < 70% | Script on 200 handles from past campaigns |
| WhatsApp alerts drive interest | Interest rate < 8% per alert | Manual broadcast via WhatsApp Business app to 100 creators | < 8% "I'm in" in 24h | One live brief, two message variants |
| Brands will approve in a magic-link room | Brands still reply on email | Use a clickable prototype on next shortlist | < 50% of approvals in-room | Figma/HTML prototype with 2 brands |
| College inference is good enough to pre-fill | < 60% precision | Label 300 IG bios | Precision < 60% → ask, don't pre-fill | Spreadsheet + alias list |

**Holds up:** keeping Supabase/RLS (D9), magic links for brands (D4), tracking-not-moving money (D6) — all lower
risk and already reflected in the schema.
**Couldn't assess:** real funnel numbers (no production analytics yet) — instrument R1 before tuning.

---

## 20. Data model additions (beyond `04` §5)

| Table / column | Purpose |
|---|---|
| `roles`: `talent`, `ops`, `reviewer`, `finance`, `brand_admin`, `brand_member` | New role keys + permissions |
| `talent_education.status, course, stream, clubs[], fest_roles[], ambassador_status, verification_method, inferred_score` | College graph |
| `colleges.short_names[], website_domain, instagram_handle, lat, lng, popularity` + `college_domains`, `college_fests` | Inference & search |
| `social_accounts.refresh_tier, next_refresh_at, source ('apify'|'ig_login'), token_expires_at` | Refresh scheduling |
| `brief_requirements` (extracted fields + confidence + source span), `proposals`, `proposal_lines` | Brief builder & costing |
| `bookings`, `contracts (version_hash, accepted_at, method)`, `deliverables`, `submissions (version, r2_key, fps, hash)`, `review_comments (t_ms, frame, region, resolved)` | Execution & review |
| `post_tracking`, `post_metrics (checkpoint)`, `shipments`, `event_shifts`, `checkins` | Live tracking & ops |
| `payout_profiles`, `payments`, `brand_invoices`, `tds_rules` | Finance |
| `wa_messages (template, category, cost_inr, status)`, `wa_optins`, `notifications` | WhatsApp & cost tracking |
| `ambassador_points`, `referrals` | Campus programme |
