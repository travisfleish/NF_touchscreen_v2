# Genius Moments Wall

A full-screen, touch-first kiosk experience for exploring premium sports moment packages. The app is a single-page interactive journey: idle attract → sport selection → category (theme) selection → orbiting moment bubbles → moment detail panel.

---

## Overview

This build targets live-demo environments (events, sales floors, control rooms, and in-venue displays). After the attract screen, guests see a **six-sport** canvas—**March Madness**, **NFL**, **NBA**, **World Cup**, **MLB**, and **NWSL**—then drill down by sport, then by **category** (grouped themes), then into individual **moments** with trigger copy and descriptions.

The experience is designed for **1920×1080 landscape**. A fixed design stage is scaled to the viewport via `Stage`.

---

## Current Experience Flow

1. **Idle attract**
   - Full-screen branded entry with animated bars background and data chips.
   - Tap or click anywhere to begin.
2. **Sport canvas**
   - “Premium Moments Packages” headline and six sport hub bubbles on an anchored layout.
3. **Sport expansion**
   - The chosen sport becomes the active hub. Other sports **dock** to the perimeter so the center stays clear.
   - If the sport has **categories**, they appear in an orbit around the hub; otherwise the hub stays centered alone.
4. **Category selection**
   - Tap a category to open its **moment ring** around the category hub. Other categories move to perimeter docks, placed to avoid overlapping the moment orbit when possible.
5. **Moment detail**
   - Tap a moment bubble to open the modal detail panel (trigger + package description, optional example chips).
   - Closing the panel or using **Back** steps up the hierarchy: moment → category ring → sport selection.
6. **Navigation**
   - **Back** (top right while expanded): closes the open moment, then collapses category, then returns to the all-sports canvas.
   - **Reset** (circular kiosk control): returns straight to idle attract.
7. **Idle timeout**
   - After **45 seconds** without `touchstart`, `mousedown`, or `keydown`, the app returns to idle attract.

---

## Features

- **Single-page state machine** — No router; flow lives in `App.tsx` with animated transitions.
- **Touch-first** — Core targets use `onTouchStart` and `onClick`.
- **Fixed-stage scaling** — `Stage` scales a 1920×1080 layout surface.
- **Orientation guard** — Prompts rotation in unsupported orientations.
- **Orbit layout** — Packed rings for categories and moments, with SVG connector lines from hub to satellites.
- **Perimeter docking** — Non-active sports and categories animate to edge slots; moment view uses clearance scoring to reduce overlap.

---

## Data Model

Content is defined in `src/data/sportsData.ts`.

### `SportData`

- `id` — Stable key (matches anchor maps in `App.tsx`).
- `name` — Label on the sport bubble.
- `gradient`, `glow` — Visual treatment (idle styling; active hub uses shared parent tokens from the same module).
- `categories` — Array of `SportCategory`.

### `SportCategory`

- `id`, `name` — Category hub identity and label.
- `moments` — List of `SportMoment`.

### `SportMoment`

- `id` — Stable key.
- `name` — Bubble and panel title.
- `trigger` — Trigger condition in the detail panel.
- `description` — Package narrative.
- `examples?` — Optional chips below the description.

---

## Project Structure (Relevant)

```text
├── public/
│   ├── genius-sports-logo.png          # Brand mark (attract + experience header)
│   └── …                               # Additional media (e.g. video/images for other experiments)
└── src/
    ├── App.tsx                         # State machine, anchors, orbit math, connectors
    ├── tokens.ts                       # `IDLE_TIMEOUT_MS`, colors, legacy cinematic timings
    ├── data/
    │   └── sportsData.ts               # Sports, categories, moments
    └── components/
        ├── IdleAttract.tsx
        ├── SportBubble.tsx
        ├── MomentBubble.tsx
        ├── MomentDetailPanel.tsx
        ├── AnimatedBarsBackground.tsx
        ├── KioskControls.tsx           # Reset-to-idle
        ├── OrientationGuard.tsx
        └── Stage.tsx
```

Other components under `src/components/` are from earlier cinematic or multi-screen experiments and are not part of the active flow described above.

---

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Framer Motion 11
- Tailwind CSS (plus inline styles for precise kiosk layout)

Node **18+** recommended.

---

## Getting Started

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## Configuration Notes

- **Idle timeout:** `src/tokens.ts` → `IDLE_TIMEOUT_MS`
- **Copy and hierarchy:** `src/data/sportsData.ts`
- **Layout / orbit / dock behavior:** `src/App.tsx` (anchors, `PERIPHERAL_ANCHORS`, `CATEGORY_DOCK_SLOTS`, packing helpers)

---

## Kiosk Deployment Notes

- Run fullscreen in landscape at 1920×1080 (or let `Stage` scale).
- Keep assets referenced with root paths (e.g. `/genius-sports-logo.png`) under `public/`.
- Mouse, keyboard, and touch all refresh the idle timer.

---

## License

Proprietary - Genius Sports.
