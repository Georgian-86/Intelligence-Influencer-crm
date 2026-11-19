# Supabase setup

## Fresh project
1. In the Supabase dashboard, open **SQL editor** and run each file in `migrations/` in order (`0001` → `0005`).
2. Run `seed.sql` to load mock data for testing. It is safe to run more than once.

## Project that already has the original tables
Run only `migrations/0005_talent_education.sql`, then `seed.sql`.

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

Every seeded creator follows the pattern `<handle without dots>@creators.test`.

The seed includes 12 talent (approved, pending, screening, rejected, suspended), 9 Instagram
accounts with six months of snapshots and recent posts, 3 campaigns, 5 briefs (open, draft,
closed), 13 pipeline entries across every stage, CRM notes and 4 brand enquiries.

To remove the mock data later, delete the `@vigor.test` and `@creators.test` users under
**Authentication → Users**; their profiles, talent rows and pipeline entries go with them. The seeded campaigns, briefs and enquiries stay and can be deleted from the Table editor.
