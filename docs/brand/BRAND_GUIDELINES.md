# Vigor Talent Network — Brand & Design Guidelines (v3 · "Launch Cobalt")

> Light-first, editorial, futuristic. Premium like a luxury house, energetic like a campus fest.
> Inspiration: Arovas (warm paper + huge grotesk + pill CTAs), editorial luxury sites (serif accents, restraint,
> generous whitespace), and modern product sites (glass, 3D depth, motion that explains).

## 1. Brand idea
**"Launch."** Vigor Launchpad launches brands; the Talent Network launches creators. Every surface should feel
like *lift-off*: upward motion, trails, depth, light. Never noisy — confident and precise.

Personality: **Bold · Precise · Warm · Young-at-heart · Trustworthy.**
Voice: short sentences, active verbs, numbers over adjectives, Indian English (₹, lakh/crore where natural, "campus", "fest").

## 2. Logo
- The mark is the Vigor Launchpad **"V with rocket"**: left stroke is the V, right stroke is a rocket lifting off a puff of exhaust.
  Vector: `public/brand/vigor-mark.svg`, component: `components/brand/logo.tsx` (`<LogoMark tone="color|mono|light" />`).
  *The vector is redrawn from the Vigor Launchpad logo; drop in the official master SVG when available — all usages render from that component.*
- Lockup: mark + **"Vigor. Talent"** wordmark (Bricolage Grotesque Bold, cobalt full stop) + endorsement "BY VIGOR LAUNCHPAD" (10px, 0.2em tracking).
- Clear space = height of the rocket window × 4. Minimum size 20px (mark), 120px (lockup).
- On night backgrounds use `tone="light"`. Never recolour the mark to flame, never add drop shadows, never rotate beyond the hover micro-tilt (-4°).

## 3. Colour — final palette (chosen by arena bracket, see `docs/product/06-decision-log.md` D10)
Experiments: `docs/brand/experiments/palettes.png` (A Launch Cobalt · B Midnight Volt · C Orbit Ultraviolet · D Heritage Navy & Champagne · E Aurora Ice).

| Role | Token | Hex | Use |
|---|---|---|---|
| Canvas | `canvas` | `#F5F4EF` | Page background (warm paper) |
| Canvas 2 | `canvas-2` | `#EDEBE4` | Recessed bands, table heads |
| Surface | `surface` | `#FFFFFF` | Cards, panels, inputs |
| Night | `night` | `#0B1533` | Inverse sections, hero cards, footers |
| Ink | `ink` | `#0B1533` | Primary text (16.6:1) |
| Ink 2 | `ink-2` | `#2A3352` | Secondary text |
| Mute | `mute` | `#5B6178` | Tertiary text (5.6:1 on canvas) |
| Line | `line` | `#E2E0D8` | Hairlines |
| **Cobalt** | `cobalt` | `#2B4BFF` | Primary actions, links, focus, selection (6.1:1 on white) |
| Cobalt 50–800 | `cobalt-*` | `#EEF1FF → #15226A` | Tints for selected states, charts |
| **Flame** | `flame` | `#FF6B4A` | Accent only (≤5% of a screen): "new", live dots, on-night CTAs, highlights. Text on flame = ink. |
| Flame text | `flame-700` | `#B8341A` | Flame-coloured text on light surfaces |
| Ice / Mint / Lilac | `ice` `mint` `lilac` | `#DCE5FF` `#7CF3D6` `#C3B5FF` | 3D lighting, glows, chart series 3–5 |
| Status | `ok` `warn` `bad` `info` (+ `-bg`) | `#0F9D63` `#B86E00` `#D6342C` `#1F6FD6` | Always paired with an icon or label |

Ratios: 70% canvas/surface · 20% ink/night · 8% cobalt · 2% flame.

## 4. Typography
| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | **Bricolage Grotesque Variable** | 600–800 | Headlines, numbers, wordmark. Tracking −0.03 to −0.045em. |
| Editorial accent | **Instrument Serif** (italic) | 400 | One or two words per headline for warmth/luxury ("*launches*"). Never for UI text. |
| UI / body | **Inter Variable** | 400–600 | Body 15–16px, line-height 1.5. Tabular numbers for data. |

Scale (px): 12 · 13 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64 · 88 · 120 (hero, clamp()).

## 5. Shape, depth, texture
- Radius: inputs 12 · cards 20 · panels 28 · hero media 36 · buttons/chips **pill**.
- Elevation: soft cool shadows (`shadow-sm/md/lg`), never black. Cobalt glow only under the primary CTA.
- Glass (`glass`) only for floating UI (nav bar, overlays on 3D). Subtle grain (`.grain`) on hero bands.
- 3D: glossy cobalt/ice spheres, rings and the rocket-V in perspective; lit from top-left with mint/lilac rim light.
  Built in WebGL (three.js, lazy-loaded after LCP) with a static CSS fallback; paused off-screen; disabled under reduced motion.

## 6. Motion
| Pattern | Spec |
|---|---|
| Micro (hover/press) | 150–200ms, `ease-out-expo` `cubic-bezier(.16,1,.3,1)`, press scale .97 |
| Enter | fade + 12px rise, 500ms, 40–60ms stagger |
| Page/section | scroll-linked parallax ≤ 40px; sticky storytelling for "how it works" |
| Numbers | count-up 900ms when in view |
| Skeletons | shimmer 1.6s, exact final geometry (CLS 0) |
| Celebrate | confetti/rocket trail only on milestones (approved, confirmed, paid) |
| Reduced motion | opacity only, ≤100ms; 3D replaced by still |
Only animate `transform` and `opacity`. 60fps budget; no layout-thrashing animations.

## 7. Iconography & imagery
- Icons: Lucide, 1.8 stroke, 16/18/20px. No emoji as icons.
- Creator imagery: real creator photos when available; otherwise gradient-initial avatars and gradient media tiles (never stock).
- Illustrations: abstract 3D primitives only (spheres, rings, trails) in brand colours.

## 8. Components (in code)
`app/globals.css` (tokens + utilities: `btn-primary/dark/flame/ghost/quiet`, `input`, `card`, `panel`, `chip`, `eyebrow`, `skeleton`, `glass`),
`components/kit.tsx` (Avatar, AvatarStack, Sparkline, Metric, Delta, Progress, Panel, MediaTile, Segmented, EmptyState),
`components/app-shell.tsx` (sidebar + top bar + mobile tabs + ⌘K), `components/motion/*`.

## 9. Accessibility
WCAG 2.2 AA: text ≥4.5:1, focus ring always visible (2px cobalt), 44px touch targets, labels on every control,
status never by colour alone, `aria-live` for async results, full keyboard paths, `prefers-reduced-motion` honoured.

## 10. Do / Don't
Do: one idea per section · huge confident headlines · real numbers · lots of canvas.
Don't: dark-by-default UI · neon gradients everywhere · more than one flame element per viewport · centred body text blocks · stock photos.

## 11. Product mode (signed-in workspaces)
The editorial look above is for marketing pages. Every signed-in workspace (creator, brand portal, agency CRM,
admin) renders inside `AppShell`, which adds the `.app-ui` scope in `app/globals.css`. Inside it:

- **Canvas** is a cool neutral (`#F6F7F9`), hairlines `#E6E8EE`. Cards are white with a hairline and an almost-flat
  shadow; no floating, no glow.
- **Type**: Inter for everything, including headings and numbers. Bricolage and the serif italic stay on marketing.
  Page title 24–26px (`PageIntro` in `components/kit.tsx`), section titles 16–17px, body 14–15px, metadata 12–13px.
- **Radius**: buttons and inputs 10px, small buttons 8px, chips and status pills 6px, cards 14px.
- **One primary action per view.** Row and card actions (Approve, I'm interested, Nudge) are ghost buttons;
  the page's single main action is the only filled cobalt button.
- **Numbers**: key figures go in one `StatStrip` (a single card divided by hairlines), not a row of floating tiles.
  Sparklines only where the trend is the point.
- **Colour**: cobalt for action and selection, status colours only for status. Flame is reserved for the brand mark
  and marketing; in charts the second series is `cobalt-300`, not flame.
- **Mobile**: a flush bottom tab bar (max 5 items, 44px targets, safe-area padding); grids collapse to one column with
  `minmax(0,1fr)` so nothing overflows.
