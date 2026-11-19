---
name: reverse-engineer-product
description: Reverse-engineer a competitor website or app (landing, signup, onboarding, dashboard, pricing) into a teardown of its information architecture, flows, data model, feature list, UX patterns, visual system and gaps. Use when studying a competitor or inspiration product before designing or building a feature.
---

# Reverse-engineer a product

Goal: turn a live product into evidence you can build on — not a copy. Never reproduce a product's
brand, copy, art or layout one-to-one; extract patterns and gaps.

## Process

1. **Collect surfaces.** Map the site (sitemap, nav, footer links). Scrape: home, pricing, signup,
   features, docs/help centre, changelog, app-store listing, public profile pages, reviews (G2, Capterra,
   Play Store, Reddit). Screenshot key pages at 1440px and 390px.
2. **Information architecture.** Draw the page tree and the in-app nav. Note who each area is for.
3. **Flows.** For signup → first value, list every screen, every field, every required vs optional input,
   what is auto-filled, and time-to-value. Count the fields.
4. **Implied data model.** From forms, filters and profile pages, infer the entities (creator, brand,
   campaign, deliverable, payment…) and their key attributes and states.
5. **Feature inventory.** Table: feature · user type · depth (1–3) · evidence URL.
6. **Visual and motion system.** Palette (hex), type families and scale, radius, spacing, elevation,
   iconography, illustration/3D style, motion (what moves, duration, easing, triggers), density.
7. **Tech fingerprint.** Framework, hosting/CDN, analytics, auth, payments (headers, script tags, `/_next`, etc.).
8. **Positioning and pricing.** Headline promise, ICP, plans, limits, what's paywalled.
9. **Gaps and complaints.** From reviews and your own walk-through: friction, missing features, bugs.
10. **So-what.** For each finding: *adopt*, *beat* (do it better — say how) or *avoid*. End with the 5
    highest-leverage moves for our product.

## Output

One markdown file per product under `docs/research/teardowns/<product>.md` using the headings above,
plus a roll-up comparison matrix in `docs/research/teardowns/README.md`. Cite a URL for every claim.
