# 05 · Design System & Experience Principles

## Direction: "Backstage energy, studio precision"

Youthful and kinetic on the outside (landing, creator app), calm and dense on the inside (CRM, admin).
One system, two densities.

## Principles

1. **Ask less, show more.** Every form field must justify itself; prefer auto-fill, defaults and inference.
2. **Instant feedback.** Every action responds within 100 ms (optimistic UI, pressed states, skeletons).
3. **Mobile-first for talent, keyboard-first for teams.** Thumb zones and bottom sheets for creators;
   shortcuts (`/` search, `j/k` navigation, `⌘K` command palette) for the CRM.
4. **Status is always visible.** Creators always know where they stand; brands always see progress.
5. **Motion explains, never decorates.** Transitions show where things came from and went.

## Tokens

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` / `ink-3` | #0A0A0B / #121214 / #1A1A1E | Backgrounds, raised surfaces |
| `line` | #26262C | Hairlines, borders |
| `fog` / `mute` | #EDEDF0 / #8E8E99 | Text primary / secondary |
| `brand` | #FF6A1A (hover #FF8A3D) | Primary actions, focus, highlights |
| `brand-glow` | radial #FF6A1A at 18% | Hero light, focus halos |
| `ok / warn / bad / info` | #22C55E / #F5A524 / #F04438 / #38BDF8 | Status |
| Rank metals | bronze #D08A4E, silver #D6D6DE, gold #F5C542, platinum #B4F0FF | Rank badges |
| Radius | 8 / 12 / 16 / 24 | inputs / cards / panels / hero media |
| Spacing | 4-pt scale | |
| Type | Display: "Clash Display"-style geometric grotesk (self-hosted, e.g. General Sans/Satoshi); UI: Inter | |
| Type scale | 12 / 14 / 16 / 20 / 24 / 32 / 48 / 72 | |
| Elevation | 1px inner highlight + soft shadow; glass only for floating bars | |

Light theme follows the same tokens with inverted surfaces (CRM users may prefer light).

## Motion spec

| Pattern | Duration / easing | Notes |
|---|---|---|
| Hover/press | 120 ms, ease-out | scale 0.98 on press |
| Enter (cards, lists) | 220 ms, cubic-bezier(.2,.8,.2,1), 30 ms stagger | fade + 8 px rise |
| Page transition | 180 ms cross-fade | View Transitions API where supported |
| Skeleton shimmer | 1.4 s linear loop | matches final layout exactly (no CLS) |
| Number count-up | 600 ms | metrics on dashboards/profile reveal |
| Drag (kanban) | spring (stiffness 500, damping 40) | |
| Success | check draw 300 ms + confetti only for milestones (approved, confirmed) | |
| Reduced motion | all → opacity-only, ≤ 100 ms | |

## Key components

App shell (sidebar + command palette), data table (sticky header, column chooser, virtualised), kanban,
filter bar with chips, profile card, metric tile with sparkline, IG content grid, step onboarding with live
preview, bottom sheet (mobile), toast, empty states with illustration + next action, skeleton variants,
rank badge, status pill, review-room approve/reject cards (swipe on mobile).

## Landing page structure

1. **Hero:** headline "Where India's next-gen creators meet the brands that matter", animated orbit of
   creator cards with live-looking stats; two CTAs (Creator / Brand); trust strip (brands, colleges, cities).
2. **Live ticker:** "Briefs this week · creators joined · campuses" (real numbers once available).
3. **Three audiences** tabs: Creators · Event talent · Brands — each with a 3-step flow animation.
4. **College graph** section: interactive map of cities → colleges.
5. **How a campaign runs** — scroll-driven timeline from brief to report.
6. **Proof:** case studies (Domino's, NUUK, Nua…), testimonials.
7. **FAQ** (SEO), **final CTA**, footer with city/college SEO links.

## Accessibility

WCAG 2.1 AA: contrast ≥ 4.5:1 for text, visible focus rings (brand halo), full keyboard support, labels on
every control, `aria-live` for async status, touch targets ≥ 44 px.
