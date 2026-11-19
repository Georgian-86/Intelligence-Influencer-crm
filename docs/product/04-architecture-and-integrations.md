# 04 · Architecture, Cost & Integrations

## 1. Target architecture (cost-effective)

```
             Cloudflare (DNS, CDN, WAF, Turnstile, Web Analytics — free)
                                │
          Next.js app on Cloudflare Workers (OpenNext adapter)
     SSR/ISR pages · server actions · route handlers · edge geolocation (cf-ipcity)
        │                 │                     │                      │
   Supabase (Mumbai)   Cloudflare R2        Cloudflare Queues +     External APIs
   Postgres + RLS      drafts, videos,      Cron Triggers           Apify (IG), Meta WhatsApp
   Auth (Google, OTP)  avatars (no egress   metric refresh, post    Cloud API, Instagram Login,
   Realtime            fees)                tracking, reminders     YouTube Data API, LLM
```

| Concern | Choice | Free tier / cost | Why |
|---|---|---|---|
| Hosting | **Cloudflare Workers** via OpenNext (or Vercel Pro) | Free 100K req/day; $5/mo paid plan | Vercel Hobby is non-commercial only; Cloudflare is cheapest at scale and colocates CDN/WAF. |
| Database/Auth | Supabase (already live, Mumbai) | Free → Pro $25/mo | RLS-based RBAC already built; Google + phone auth built in. |
| Media | Cloudflare R2 | 10 GB + 1M writes free, zero egress | Creator drafts/videos are bandwidth-heavy. |
| Image transforms | Next/OG + R2; Cloudflare Images later | free / pay-as-you-go | Avoid paid image CDN early. |
| Jobs | Cloudflare Cron Triggers + Queues | Queues 1M ops/mo on paid plan | Replaces fire-and-forget `after()` for Apify syncs and reminders. |
| Bot protection | Cloudflare Turnstile | free | Signup/enquiry forms. |
| Email | Supabase SMTP via Resend | 3K emails/mo free | Fixes the 2-emails/hour default limit. |
| Analytics | Cloudflare Web Analytics + PostHog | free tiers | Funnel metrics for G1–G5. |
| AI | Small LLM for niche tagging + brief parsing | ~₹0.05 per profile | Auto-fill instead of asking. |

**Rough monthly cost at pilot scale (5K creators, 30 campaigns):** Cloudflare $5 + Supabase $0–25 +
Apify ~$15–25 (5K syncs + post tracking) + WhatsApp ~₹1,500 (13K utility messages) ≈ **₹5–6K/month**.

## 2. Performance budget

- JS per route < 120 KB gz; server components by default; client components only for interaction.
- Fonts self-hosted with `font-display: swap`, subset Latin; 2 families max.
- Images: AVIF/WebP, explicit dimensions, lazy below the fold; Instagram images proxied and cached at the edge.
- Skeletons for every data fetch; optimistic updates for stage changes, interest, notes.
- Motion: CSS + Motion One/Framer Motion (lazy-loaded); animate transform/opacity only; `prefers-reduced-motion`.
- Targets: LCP < 2.0 s (4G, mid Android), INP < 200 ms, CLS < 0.05.

## 3. Instagram integration

1. **Public sync (default):** Apify `instagram-profile-scraper` on signup and weekly for active talent (cron),
   storing snapshots → growth chart and ER trend.
2. **Authenticity signals:** ER vs tier benchmark, follower growth spikes, comment/like ratio, ratio of
   following/followers → "Quality score" shown to the agency only.
3. **Live post tracking:** creator submits post URL → Apify post scraper at 24h, 72h, 7d → views, likes,
   comments, plays; checks brand tag and #ad/#collab disclosure in caption.
4. **Instagram Login (P1):** creator connects their professional account (`instagram_business_basic`,
   `instagram_business_manage_insights`) → verified badge + reach/impressions and, where Meta returns them,
   audience demographics. Needs Meta app review with a screencast; verify the metric list before promising
   demographics.

## 4. WhatsApp integration

- **Channel:** Meta WhatsApp Cloud API directly (no BSP mark-up) once Meta Business verification is done;
  a BSP is the fallback if speed matters more than cost.
- **Templates (utility, ~₹0.115 each):** `brief_match`, `shortlisted`, `confirmed_with_details`,
  `deadline_reminder`, `draft_feedback`, `payment_update`, `event_reminder`, `otp` (authentication).
- **Inbound:** quick-reply buttons ("I'm in" / "Not for me") hit a webhook → creates the intent; free-form
  replies inside 24h are free and are logged against the booking.
- **CRM side:** "Message on WhatsApp" button with prefilled text; conversation log per talent.
- **Compliance:** explicit opt-in at signup; per-type mute settings; quiet hours 9pm–9am.

## 5. Data model additions (v2)

`colleges` (AISHE seed), `talent_education` (college_id, course, graduation_year, verified_at),
`bookings` (intent → confirmed booking with fee, deliverables), `deliverables` (type, due_at, status),
`submissions` (deliverable_id, version, r2_key/url, status), `review_links` (token hash, scope, expires_at),
`review_actions`, `post_tracking` (url, checkpoints, metrics), `event_shifts`, `checkins`,
`payout_profiles` (encrypted PAN/bank/UPI), `payments`, `notifications` (channel, template, status),
`talent_managers`, `saved_searches`, `profile_views` (for Brand Interest Signals).

## 6. Security & privacy

- RLS stays the source of truth for tenancy; review links use hashed, expiring, scope-limited tokens.
- Contact details and payout data never reach brands; payout data encrypted at rest (pgsodium/Vault).
- Rate limits on auth, enquiry, fetch endpoints (Cloudflare rules + Turnstile).
- DPDP Act (India) basics: consent records, data export/delete on request, purpose-limited processing.
