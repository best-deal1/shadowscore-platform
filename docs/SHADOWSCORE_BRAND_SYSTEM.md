# ShadowScore brand and interface system

Version 1.0, July 2026

## Brand idea

ShadowScore is the brand. The infinity mark represents its continuous intelligence loop. Connected observations form both loops. The illuminated crossing point is Resolution, where evidence becomes knowledge and knowledge changes trust.

The core line is: **Evidence. Knowledge. Trust.**

## Logo system

| Asset | Use |
| --- | --- |
| `public/brand/shadowscore-infinity.svg` | Canonical source for the primary digital mark on dark and light surfaces |
| `public/brand/shadowscore-infinity-mono.svg` | Single-color print, engraving, and constrained UI |

Clear space is the height of the Resolution core on every side. The minimum digital width is 24 px for the symbol and 104 px for the symbol with the ShadowScore wordmark. Do not rotate, stretch, add a container, recolor individual observations, or remove the Resolution core.

## Design tokens

### Semantic color

| Token | Value | Meaning |
| --- | --- | --- |
| Knowledge | `#38BDF8` | Sourced facts and verified evidence |
| Intelligence | `#8B5CF6` | Resolution, inference, and active processing |
| Trusted | `#34D399` | Supported outcomes and increasing confidence |
| Review | `#FBBF24` | Analyst attention required |
| Conflict | `#FB7185` | Contradictory evidence or material risk |
| Historical | `#71717A` | Superseded or historical context |
| Night 950 | `#060814` | Dark canvas |
| Night 900 | `#0C1020` | Dark surface |
| Paper 50 | `#F7F8FC` | Light canvas |
| Ink 950 | `#11162A` | Light-theme text |

Color always carries a label or icon. It is never the only status signal.

### Typography

- Display and interface: Inter, with Arial as the system fallback.
- Technical values and evidence IDs: IBM Plex Mono, with the system monospace stack as fallback.
- Display: 64/64 at desktop, 44/46 at mobile, weight 650.
- Page title: 40/44, weight 650.
- Section title: 28/34, weight 650.
- Body: 16/26, weight 400.
- Label: 11/14, weight 700, 0.16 em letter spacing, uppercase.

### Layout

- Base spacing unit: 4 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius scale: 8 controls, 12 cards, 16 panels, 24 feature surfaces, full status pills.
- Desktop frame: 1440 px, 12 columns, 24 px gutters, 72 px margins.
- Tablet frame: 768 px, 8 columns, 20 px gutters, 24 px margins.
- Mobile frame: 390 px, 4 columns, 16 px gutters and margins.

## Icon language

Icons use 1.5 px strokes at 24 px. Open circles mean observations. Connected nodes mean relationships. A solid center means a resolved identity. Directional arcs mean monitoring. Icons use rounded joins and remain recognizable in monochrome. Filled icons are reserved for resolved or selected states.

## Motion language

Motion follows Collect, Evidence, Knowledge, Trust, then Monitoring. Evidence enters over 160 ms. Relationships resolve over 240 ms. Confidence recalculates over 600 ms. Continuous monitoring may use a four-second directional line cycle. No element drifts or moves without describing a state change. All motion stops when `prefers-reduced-motion` is enabled.

## Component library

1. **Live status:** status label, activity pulse, and relative update time.
2. **Confidence metric:** numeric value, semantic state, delta, and explanation.
3. **Evidence record:** source, observation time, reliability, and connected assertion.
4. **Entity node:** entity type, resolved name, and confidence.
5. **Relationship edge:** relationship type, direction, evidence count, and status.
6. **Intelligence event:** semantic stage, event copy, source, actor, and timestamp.
7. **Review state:** review reason, severity, and primary analyst action.
8. **Empty state:** investigation state and a clear next action. Use “This entity has not yet been investigated.”

Each interactive control has a visible focus state, a 44 px minimum target, a programmatic label, and keyboard support.

## Product architecture

### Intelligence overview

The dashboard opens with freshness, active entities, new evidence, trust shifts, and confidence. The Living Relationship Graph and Live Intelligence feed provide the main working context. Queues are secondary.

### Subject

The subject header combines canonical identity, entity type, jurisdiction, monitoring state, and trust confidence. The network is the primary visual. Evidence and identity assertions remain available as adjacent structured views.

### Investigation

The investigation workspace retains a three-part hierarchy: decision context, evidence and relationships, then analyst controls. Every recommendation links back to evidence. Empty states explain the current investigation state.

### Relationship graph

Nodes use type, label, and confidence. Edges use a named relationship and evidence count. The selected path receives the Intelligence color. Conflicts use Conflict. Historical paths use Historical. Graph motion only appears when new evidence resolves a relationship.

### Timeline

The canonical sequence is Evidence, Assertion, Knowledge, Relationship, Trust, Monitoring, and Change. Events show relative time for scanning and exact UTC time on request. New events enter at the top without removing audit history.

## Theme mapping

Dark theme uses Night 950 for canvas, Night 900 for surfaces, `#EEF2FF` for primary text, and translucent white borders. Light theme uses Paper 50 for canvas, white surfaces, Ink 950 for primary text, and translucent Ink borders. Semantic colors retain their meanings in both themes and meet WCAG contrast requirements when used for text.

## Future surfaces

AI Analyst, Monitoring, Trust Engine, Entity Intelligence, Investigation Workspace, and the Live Relationship Graph share the same entity, evidence, relationship, confidence, event, and review primitives. New surfaces should compose these primitives instead of creating new visual semantics.
