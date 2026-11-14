# RoTerra — Design System

*The goal: calm, data-forward, trustworthy. A farmer's decision tool, not a dashboard toy. When in doubt — more whitespace, fewer colors.*

## Palette (design tokens)

Define these once in `src/styles/tokens.css` and reference only via CSS variables. Never hardcode hex values in components.

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#3E7C3A` (paddy green) | Primary actions, active states, links |
| `--color-primary-dark` | `#2C5A29` | Hover / pressed |
| `--color-ink` | `#1F2A1D` | Headings and body text |
| `--color-text-muted` | `#5C6B58` | Secondary text, captions, axis labels |
| `--color-bg` | `#F7F5EF` (cream) | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-border` | `#E4E0D4` | Hairline borders, dividers |
| `--color-accent-soil` | `#8A5A44` (soil brown) | Soil dimension, secondary accent |
| `--color-accent-water` | `#3A6EA5` | Water dimension, rainfall charts |
| `--color-warning` | `#C77F2E` (amber) | "Needs review" band, medium confidence |
| `--color-danger` | `#B5533C` (rust) | "Not advised now" band, low confidence |
| `--color-success` | `#3E7C3A` | "Strong fit" band, high confidence |

## Typography

- UI font: **Inter** (via system fallback: `"Inter", -apple-system, "Segoe UI", Roboto, sans-serif`). Do not load a webfont — use the font stack so the app stays fast and offline-friendly.
- Monospace (numbers in tables/evidence): `ui-monospace, "SF Mono", Menlo, monospace`.
- Scale: 14px body, 16px section lead, 20px card titles, 28px page title, 12px captions/labels.
- Headings: sentence case, never ALL CAPS except tiny overline labels (letter-spacing 0.08em).

## Layout & Shape

- Light mode only.
- Max content width ~1100px, centered.
- Bento-adjacent card grid on the comparison view: one card per rotation strategy, equal height, 16px gap.
- Cards: `border-radius: 12px`, `border: 1px solid var(--color-border)`, background `--color-surface`, subtle shadow `0 1px 3px rgba(31,42,29,0.08)`.
- Minimal borders — separate with spacing and background contrast where possible.
- Consistent 8px spacing scale (8 / 16 / 24 / 32 / 48).

## Charts (Recharts)

- One categorical color per data series; default series colors: primary green, water blue, soil brown.
- Gridlines: `--color-border`, dashed, horizontal only.
- Axis labels: 12px, `--color-text-muted`.
- Always label units in the axis title, and cite the source under the chart (12px, muted).

## Rating Bands (scoring output)

- Strong fit → green tint `rgba(62,124,58,0.12)` + `--color-success` text
- Promising → neutral surface + primary text
- Needs review → amber tint `rgba(199,127,46,0.12)` + `--color-warning` text
- Not advised now → rust tint `rgba(181,83,60,0.12)` + `--color-danger` text

## Map (Leaflet)

- Base layer: CartoDB Positron (light, unobtrusive) — free tier, no API key.
- Field marker: primary green; AOI outline 2px `--color-primary`.
- No dark map tiles, no satellite-only default (satellite toggle optional if trivial).

## States

- Loading: skeleton placeholders on the same shape as the content.
- Missing data: explicit "No coverage for this indicator — dropped" panel, never silence.
- Error: `--color-danger` text with retry affordance.

## Vibe Notes

- Earthy, quiet, credible — like a well-printed extension-service bulletin.
- Numbers are the hero: generous size for scores, monospace for evidence values.
- Avoid dark mode, glassmorphism, gradients, and decorative animation. Transitions ≤200ms, opacity/transform only.
