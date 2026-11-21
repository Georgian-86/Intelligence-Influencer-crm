# Supabase setup

## Fresh project
1. In the Supabase dashboard, open **SQL editor** and run each file in `migrations/` in order (`0001` → `0006`).
2. Run `seed.sql` to load mock data for testing. It is safe to run more than once.

## Project that already has the original tables
Run any migrations it hasn't had yet, in order. A project that already has `0005` needs only
`migrations/0006_execution.sql` (deliverables, content review, brand sharing, payouts, invoices and the
private `deliverables` storage bucket), then `seed.sql`. `0006` is safe to run more than once.

With the Supabase CLI linked to the project, `supabase db push` applies the migrations and
`supabase db reset` (local only) applies migrations plus `seed.sql`.

## Test accounts (password for all: `VigorTest123!`)

| Email | What it opens |
| --- | --- |
| `admin@vigor.test` | Super admin + Vigor Marketing owner: admin screening, CRM, cockpit |
| `screener@vigor.test` | HR screener: admin screening queue |
| `manager@vigor.test` | Campaign manager in the agency CRM |
| `scout@vigor.test` | Read-only scout in the agency CRM |
| `aanyaeats@creators.test` | Approved Gold creator with briefs, a confirmed booking and stats |
| `zoyagrwm@creators.test` | Creator still in screening |
| `arjunlaughs@creators.test` | Pending creator (shows up in the screening queue) |
| `djdevm@creators.test` | Approved Platinum event talent (DJ) |
| `brand@vigor.test` | Brand admin for Brewhouse: brand portal with a shared shortlist, a draft to review and a report |

Every seeded creator follows the pattern `<handle without dots>@creators.test`.

The seed includes 12 talent (approved, pending, screening, rejected, suspended), 9 Instagram
accounts with six months of snapshots and recent posts, 3 campaigns, 5 briefs (open, draft,
closed), 14 pipeline entries across every stage, CRM notes and 4 brand enquiries. It also seeds
one brand workspace linked to a campaign, a shortlist shared with that brand, deliverables in review
and live with metrics, two creator payouts (one paid) and two invoices.

To remove the mock data later, delete the `@vigor.test` and `@creators.test` users under
**Authentication → Users**; their profiles, talent rows and pipeline entries go with them. The seeded campaigns, briefs and enquiries stay and can be deleted from the Table editor.
