# Design

Visual system for the portfolio. Identity: **engineering dossier** — editorial display type on a machined near-black surface, one committed amber-gold brand color, dossier artifacts (title blocks, figure numbers, spec tables) as the structural grammar. Mood phrase: *"gold leaf lettering on a black lacquered instrument case."*

## Color

OKLCH only. Strategy: **Committed** — amber carries the display type, interactive states, and one fully drenched closing section. Everything else is pure chroma-0 dark.

```css
--bg:            oklch(0.115 0 0);          /* body — pure near-black, zero tint */
--surface:       oklch(0.155 0.006 91);     /* raised panels, whisper of amber */
--surface-2:     oklch(0.19 0.008 91);      /* hover fills, chips */
--ink:           oklch(0.935 0.012 91);     /* body text — ~15:1 vs bg */
--muted:         oklch(0.72 0.02 91);       /* secondary text — ~7:1 vs bg */
--line:          oklch(0.30 0.01 91);       /* hairlines */
--line-strong:   oklch(0.42 0.02 91);
--brand:         oklch(0.80 0.155 88);      /* amber-gold — display, links, focus */
--brand-deep:    oklch(0.66 0.13 80);       /* borders, secondary amber */
--ink-on-brand:  oklch(0.185 0.035 80);     /* dark text on the drench section */
--accent:        oklch(0.78 0.10 235);      /* cool slate-blue — LIVE pulse only */
```

Rules: amber never sits on `--surface-2` at small sizes (contrast drops). The drench section (`#contact`) inverts: `--brand` becomes the background, all text uses `--ink-on-brand`.

## Typography

- **Display:** Gloock (400 only) — high-contrast display serif, engraved-plate voice. Headlines, project titles, giant numerals, the drench statement. Letter-spacing ≥ -0.03em. Clamp ceiling 6rem.
- **Body:** Geist Sans — machined grotesque. Prose, descriptions, nav. 65ch max lines.
- **Data:** Geist Mono — *data only*: metrics, dates, stack tags, the title block. Never decorative eyebrows.

Scale: 1.333 ratio. Fluid display via `clamp()`. Light-on-dark body gets line-height 1.7.

## Layout

- Max content width 72rem, fluid gutters `clamp(1.25rem, 5vw, 4rem)`.
- Asymmetric 12-col grid for Work: description block and spec table offset against each other, alternating per project; giant Gloock figure numerals anchor each entry.
- Dossier grammar: hairline rules (`--line`), a bordered **title block** (mono key/value grid) in hero and footer, `FIG. 01` figure numbering *only* in Selected Work (a real curated sequence).
- Experience = ledger rows (grid: dates | role/company | impact), hairline separated.
- Vertical rhythm varies: hero 100svh, work sections generous (`clamp(6rem, 14vh, 10rem)`), ledger tight.

## Imagery

Generated, not stock: an amber plotted trace (canvas, seeded, drawn once) behind the hero type; small deterministic SVG schematics per project. Static render under reduced motion.

## Motion

- Ease: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint family). Durations 500–900ms entrances, 180–250ms hovers.
- Hero: one orchestrated load — type lines rise (clip + translate), trace draws, title block fades last.
- Scroll reveals via IntersectionObserver: hidden state applied only under a `.js` root class so content is visible by default (no-JS, headless). Stagger within lists only.
- Hovers: underline sweep on links, numeral amber fill on work entries, ledger row illumination.
- `prefers-reduced-motion: reduce`: all transforms off, opacity-only or instant; canvas renders final frame statically.

## Components

- **Title block** — bordered mono key/value grid (NAME / ROLE / LOC / STATUS). Hero + footer only.
- **Spec table** — `<dl>` of metric label/value pairs per project, mono values, hairline rows.
- **Stack chip** — square-cornered 1px-border mono tag, `--surface-2` on hover.
- **Arrow link** — amber underlined link, `↗` translates 2px diagonal on hover, 2px amber focus outline offset 3px.
