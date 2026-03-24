# Genius Moments Wall

A full-screen touch-first kiosk experience for exploring premium sports moment packages. The current app is a single-page interactive journey: idle attract -> sport selection bubbles -> orbiting moment bubbles -> moment detail panel.

---

## Overview

This build demonstrates a single continuous interaction model for live-demo environments (events, sales floors, control rooms, and in-venue displays). Users engage from an attract screen, select one of two sport hubs (**NFL** or **March Madness**), then browse moment packages in an animated orbit around the selected hub.

The app is designed for **1920x1080 landscape** and scales the fixed stage to the viewport.

---

## Current Experience Flow

1. **Idle attract**
   - Full-screen branded entry with animated background and data chips.
   - Tap/click anywhere to begin.
2. **Single-screen interactive canvas**
   - "Premium Moments Packages" headline.
   - Two large sport bubbles: **NFL** and **March Madness**.
3. **Sport expansion**
   - Selected sport bubble moves to center, scales down, and reveals orbiting moment bubbles.
4. **Moment detail overlay**
   - Tap a moment bubble to open a modal panel with trigger + package description.
   - Close panel to return to the expanded sport view.
5. **Back / Reset**
   - **Back** collapses the expanded sport and returns to the two-sport selection state.
   - **Reset** (kiosk control) returns all the way to idle attract.

---

## Features

- **Single-page architecture** - No route/page changes during core flow; transitions are animated within one screen tree in `App.tsx`.
- **Touch-first interactions** - Core controls respond to `onTouchStart` and `onClick`.
- **Idle timeout** - Returns to idle after `45_000ms` of inactivity (`touchstart`, `mousedown`, `keydown`).
- **Fixed-stage scaling** - `Stage` preserves visual layout by scaling a 1920x1080 design surface.
- **Orientation guard** - Shows rotate prompt in unsupported orientations.
- **Kiosk reset control** - Quick reset button for staffed demos.
- **Animated orbit system** - Moment bubbles fan out in one or two rings depending on moment count, with deterministic size variation for visual texture.

---

## Data Model

The live UI is driven by `src/data/sportsData.ts`.

### `SportData`

- `id`: sport identifier (used for anchor/selection logic)
- `name`: display label inside the sport bubble
- `bubbleImage`: background image used on the bubble
- `gradient`, `glow`: visual treatment values
- `moments`: list of `SportMoment`

### `SportMoment`

- `id`: stable key
- `name`: bubble + panel title
- `trigger`: trigger condition shown in detail panel
- `description`: package narrative copy
- `examples?`: optional chips shown below description

---

## Project Structure (Relevant)

```text
├── public/
│   ├── genius-sports-logo.png
│   ├── nfl.jpg
│   └── march_madness.png
└── src/
    ├── App.tsx                         # Single-screen state machine + orchestration
    ├── tokens.ts                       # IDLE_TIMEOUT_MS and shared tokens
    ├── data/
    │   └── sportsData.ts               # Live sport + moment content
    └── components/
        ├── IdleAttract.tsx             # Entry attract screen
        ├── SportBubble.tsx             # Large sport hub bubble
        ├── MomentBubble.tsx            # Orbiting moment bubble
        ├── MomentDetailPanel.tsx       # Modal detail panel
        ├── KioskControls.tsx
        ├── OrientationGuard.tsx
        └── Stage.tsx
```

> Note: Legacy components/data from earlier multi-screen/cinematic flows still exist in the repo, but the active experience is the single-page flow above.

---

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Framer Motion 11
- Tailwind CSS (plus inline styles for precise kiosk layout)

Node 18+ recommended.

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

Open the local URL printed by Vite (usually `http://localhost:5173`).

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

- **Idle timeout:** `src/tokens.ts` -> `IDLE_TIMEOUT_MS`
- **Interactive content:** `src/data/sportsData.ts`
- **Sport anchor layout/orbit behavior:** `src/App.tsx` constants and helper functions

---

## Kiosk Deployment Notes

- Run in full-screen landscape.
- Keep image assets in `public/` so root-relative paths resolve.
- Mouse/keyboard/touch input all keep the kiosk "awake" by resetting idle timeout.

---

## License

Proprietary - Genius Sports.
