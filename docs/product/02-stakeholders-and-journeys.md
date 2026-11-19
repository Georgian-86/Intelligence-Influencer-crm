# 02 · Stakeholders, Pains & Journeys

How a campaign really reaches and moves through a youth-marketing agency like Vigor, what hurts for each
person involved, and what the product does about it.

## 1. How a campaign arrives today

1. A brand manager sends a WhatsApp message, email or PDF deck: *"Need 40 college creators in Pune + Mumbai for
   our new menu launch, 2 weeks, ₹4L, reels + stories, plus 20 promoters for 6 campus activations."*
2. The account manager re-types it into a doc, guesses budgets, asks 5 follow-up questions over 3 days.
3. The team scouts on Instagram, old Excel sheets and WhatsApp groups — **again**.
4. Shortlist goes to the brand as a PDF/Excel → feedback by email → second shortlist.
5. Outreach over DMs/WhatsApp; rates negotiated in chats nobody else can see.
6. Products shipped; drafts arrive on WhatsApp/Drive; review rounds tracked in someone's head.
7. Posts go live; someone screenshots metrics days later; links collected in a sheet.
8. Invoices chased; payments delayed; creators frustrated.
9. A report is assembled manually in PowerPoint. Learnings and ratings are lost.

## 2. Stakeholders and their pains → product answers

| Stakeholder | Top pains | What the product does |
|---|---|---|
| **Brand manager** (client) | Can't see progress; slow, vague shortlists; can't verify reach/fakes; approvals buried in email; reports late. | **Brief intake** form or paste-anything AI parser; **review room** magic link to approve talent and content on mobile; live campaign page; one-click report. |
| **Agency founder** (Vigor) | Re-scouting cost; knowledge leaves with employees; no view of margins or team load; can't monetise the pool. | Central pool that compounds; every note/rate/rating saved; founder dashboard (pipeline value, margin, team workload, SLA breaches); licensing + royalty reports for partner agencies. |
| **Account / campaign manager** | Re-typing briefs; juggling 10 campaigns in WhatsApp; chasing drafts and links; manual reports. | Structured briefs; pipeline kanban with deadlines; automated reminders; deliverable checklists; auto-tracked posts; report generator. |
| **Scout / talent team** | Finding the right creators fast; knowing who's available and reliable. | Smart filters incl. college/year; saved searches; "more like this"; reliability score; availability; bulk invite. |
| **Executing team** (on-ground ops) | Last-minute no-shows; staffing lists on WhatsApp; attendance proof. | Event rosters, check-in (geo + selfie) and attendance → reliability score; replacement suggestions from nearby ranked talent. |
| **Reviewer** (agency QA / brand legal) | Drafts scattered; no version history; compliance (tags, #ad, brand guidelines) missed. | Draft submission with versions, timestamped comments, checklist (tag/hashtag/disclosure), approve/request changes. |
| **Finance** | Missing invoices/PAN/GST/bank details; who's been paid? | Payout profile once per talent; booking-level fee, invoice, status (pending → approved → paid); export for accounting. |
| **Creator** (incl. college creator) | Ghosting; irrelevant brief spam; re-sending media kit; late payments; no feedback. | 60-second signup; profile auto-built from Instagram; only matching briefs; one-tap "I'm in"; clear status; WhatsApp updates; payment tracking; ranks and badges. |
| **Event talent** (promoter, anchor, DJ, crew) | Irregular gigs; unclear pay; no career growth. | Gigs by city; transparent rates by rank; ratings and rank upgrades; training sessions (Academy). |
| **Talent manager** (manages many creators) | Updating each creator's info everywhere; tracking offers. | Manager account linked to many creators; one inbox for offers; Brand Interest Signals ("3 agencies viewed X this week"). |
| **Partner agency** (licensee) | Wants access to a quality pool without building one. | Tenant workspace, own campaigns and notes, metered contact unlocks, usage-based royalty. |
| **Platform admin / HR** | Screening volume; fake profiles; consistent ranking. | Screening queue with auto-signals (IG verified, ER sanity, duplicates, student verified), bulk approve, rank rubric. |

## 3. Key journeys (target experience)

### 3.1 Creator signup — target ≤ 60 seconds, ≤ 4 inputs
1. Landing → "I'm a creator" → **Continue with Google** (or WhatsApp OTP).
2. Paste Instagram handle → profile **auto-fills live** (photo, name, followers, ER, niche guesses, email in bio) with
   skeleton → content animation.
3. City pre-selected from IP geolocation (Cloudflare `cf-ipcity`); confirm or change.
4. "Are you in college?" **Yes** → college autocomplete (filtered by detected city) + graduation year. **No** → skip.
5. Consent toggle → **Done**. Dashboard shows matching briefs immediately and a progress ring:
   "Add your rate card to unlock 6 more briefs" (progressive profiling).

Everything else (rates, languages, gender, DOB, portfolio, payout details) is asked **only when it's needed**:
rates when applying, payout details when confirmed, DOB/gender only if a brief requires it.

### 3.2 Event talent signup
Same skeleton: Google/WhatsApp → pick roles (tiles with icons) → city → optional college → optional one video link.
Phone is mandatory (ops calls). HR screening + interview booking via a calendar link.

### 3.3 Brand brief → live campaign
1. Brand (or AM) pastes the WhatsApp/email text or uploads a PDF → AI extracts a structured brief
   (objective, audience, cities, colleges, talent types, counts, deliverables, budget, dates) → human confirms.
2. System proposes a **plan**: N creators by tier × city, estimated reach/cost, plus event staffing.
3. Publish → matching creators get a WhatsApp utility message with a deep link; interest flows in within hours.
4. AM shortlists → shares **review room** link → brand approves/rejects with one tap per talent.
5. Confirmed talent get deliverables, deadlines, guidelines; drafts submitted in-app; review rounds.
6. Post links submitted → auto metrics at 24h/72h/7d → live dashboard → report link to brand.
7. Payments tracked; ratings captured; talent ranks updated.

### 3.4 On-ground activation day
Roster per venue → WhatsApp reminder the evening before → geo + selfie check-in → supervisor marks
performance → no-shows auto-flagged and replacements suggested → reliability score updated.

## 4. Data we can fetch instead of asking

| Data | Source | Cost |
|---|---|---|
| Name, photo, bio, followers, following, posts, verified, business category, external link, recent posts with likes/comments | Apify Instagram profile scraper (public) | ~$0.0026/profile |
| Email/phone in bio | Parsed from bio | free |
| Niche/categories, content language, brand mentions | LLM classification of bio + captions (small model) | ~₹0.05/profile |
| City guess | Cloudflare IP geolocation at signup; bio/location tags | free |
| College list | AISHE (Govt. of India) college directory, seeded into DB with city | free |
| Student verification | College email (.ac.in/.edu.in) OTP or ID upload | free |
| Audience age/gender/city, reach, saves | Instagram Login (creator authorises), professional accounts only — verify metric availability during Meta app review | free |
| YouTube subs/views | YouTube Data API v3 | free quota |
| Name/email/avatar | Google sign-in | free |
| Post performance after going live | Apify post scraper on submitted URL | ~$0.003/post fetch |
