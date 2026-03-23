# Genius Moments Wall

A **touch-screen kiosk application** for showcasing **Genius Sports** moments — game-winning plays, upsets, controversy, and other live-detected events — with branded creatives and sponsor integration previews. Built for fixed **1920×1080** displays (e.g., in-venue walls, broadcast control rooms, or trade-show demos).

---

## Overview

**Genius Moments Wall** demonstrates the **Genius Moment Engine**: real-time detection of high-stakes sporting moments (buzzer beaters, upsets, overtime, elimination games, championship clinches, momentum shifts, hero performances, and review/controversy) with three creative formats — **Live Data Overlay**, **Branded Highlight Frame**, and **Full Takeover**. The app is designed to run on large-format touch screens in landscape, with an idle attract loop, moment selector, cinematic “Moment Detected” transitions, and detailed moment views that explain trigger logic and show creative previews.

**Target environments:** In-venue digital signage, broadcast studios, sales demos, events. **Primary input:** Touch (mouse and keyboard also reset idle timer). **Design resolution:** 1920×1080; the UI scales to fit other resolutions via a fixed stage.

---

## Features

### Core Experience

- **Idle attract screen** — Animated “touch to explore” loop with gradient background, floating data chips, and rotating copy (e.g. “Real-Time Detection”, “Live Data Signals”, “Broadcast Ready”, “Sponsor Integration”). Tap or click anywhere to enter the moment selector.
- **Moment grid (Select a Moment)** — Two featured tiles (“Own the Game” / “Own the Season”) plus a horizontal carousel of additional moments. Each moment has a name, label, hook, and trigger description; tap a tile to open its flow.
- **Moment detail** — Left column: moment name, hook, detection trigger, proof-point stats (discrete path) or season activation visualization (thematic path). Right column: three creative variants (Live Data Overlay, Branded Highlight Frame, Full Takeover) with tabbed previews.
- **Idle timeout** — Returns to the attract screen after **45 seconds** of no touch, mouse, or keyboard input (configurable in `src/tokens.ts`).
- **Orientation guard** — On narrow viewports (portrait), shows a “Rotate Device” message; the main UI is intended for landscape.
- **Kiosk controls** — Optional reset button (top-right) for staff to return to idle from any screen.

### Two Featured Paths

| Path | Label | Behavior |
|------|--------|----------|
| **Own the Game** | Left tile (e.g. Buzzer Beater) | **Discrete** moment. Full-screen **cinematic transition**: sample video → “Detecting Moment…” → “Moment Detected” → “Activating Audiences” (vertical reel) → then detail view with the paused frame (or captured image) in the left media area. |
| **Own the Season** | Right tile (e.g. Controversy) | **Thematic** moment. **Multi-video cinematic**: stacked/split video clips with “Moment Detected” between them, then detail view with **season activation viz** (six video boxes filling in and churning) instead of a single hero video. |

Carousel moments use the default discrete path (single-video cinematic) unless the grid passes a different option.

### Cinematic Transitions

- **Single-video cinematic** (`CinematicTransition`) — One full-bleed video; phases: playing → detecting (spinner) → detected (checkmark, frame capture) → activating (reel scroll); then handoff to detail with `videoPauseTime` and optional `capturedFrameDataUrl`.
- **Multi-video cinematic** (`ControversyCinematicTransition` + `ControversyStackedVideos`) — Multiple clips (e.g. soccer trims) with “Moment Detected” between segments; then transition to detail.

### Creative Formats (per moment)

Each moment defines three creatives, shown as tabs on the detail screen:

1. **Live Data Overlay** — Real-time score, clock, and stats over the feed.
2. **Branded Highlight Frame** — Cinematic freeze-frame or before/after with sponsor branding.
3. **Full Takeover** — Screen-dominating moment with full sponsor integration and CTA.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | React 18, TypeScript |
| **Build** | Vite 5 — dev server (HMR) and production build |
| **Styling** | Tailwind CSS 3, inline styles for layout |
| **Animation** | Framer Motion 11 — screen transitions, AnimatePresence, motion components |
| **Fonts** | Inter (Google Fonts), Klarheit (serif) where used |

**Node:** 18+ recommended. Package manager: npm (or yarn/pnpm).

---

## Project Structure

```
├── index.html              # Entry HTML; viewport, theme-color, kiosk-friendly CSS (no tap highlight, no text select)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/                 # Static assets
│   ├── genius-sports-logo.png
│   ├── Moments Sample.mp4  # Cinematic transition video (single-video flow)
│   ├── buzzer-beater.jpg   # Left featured tile preview
│   ├── soccer-thumbnail.png
│   ├── soccer-trim-1.mp4, soccer-trim-2.mp4, soccer-trim-3.mp4  # Multi-video cinematic
│   ├── fan-cloud.svg
│   └── ...
├── docs/
│   ├── OWN_THE_GAME_ARCHITECTURE.md   # Discrete flow: cinematic → detail
│   └── THEMATIC-DETAIL-ARCHITECTURE.md # Thematic flow: season viz, entry modes
└── src/
    ├── main.tsx            # React root
    ├── App.tsx             # Screen state (idle | select | cinematic | cinematic-multi | detail),
    │                       # idle timer, morph state, handlers (select, back, cinematic complete)
    ├── index.css           # Tailwind directives
    ├── tokens.ts           # Colors, IDLE_TIMEOUT_MS, cinematic timing constants, screen transition config
    ├── data/
    │   └── moments.ts      # Moment[] and Creative[] definitions; featured = first 2, rest = carousel
    └── components/
        ├── Stage.tsx              # 1920×1080 fixed stage; scale-to-fit on resize
        ├── OrientationGuard.tsx   # Portrait → "Rotate Device" overlay
        ├── KioskControls.tsx      # Reset-to-idle button (top-right)
        ├── IdleAttract.tsx        # Attract loop, "touch to explore", gradient + FloatingDataChips
        ├── AnimatedBarsBackground.tsx
        ├── FloatingDataChips.tsx
        ├── MomentGrid.tsx         # Select screen: two featured MomentTiles + MomentsTextCarousel
        ├── MomentTile.tsx         # Single moment card (image, labels, hook)
        ├── MomentsTextCarousel.tsx # Horizontal scroll of moment chips
        ├── CinematicTransition.tsx       # Single-video "Moment Detected" sequence
        ├── ControversyCinematicTransition.tsx
        ├── ControversyStackedVideos.tsx
        ├── MomentDetail.tsx       # Detail view: left column (trigger/viz) + right (CreativePreview)
        ├── CreativePreview.tsx    # Three creative tabs + preview content
        ├── SeasonActivationViz.tsx # Thematic left media: 6 video boxes, fill-in and churn
        ├── AnimatedFanCloud.tsx
        └── OwnTheSeasonExplanation.tsx   # Thematic copy/explanation where used
```

---

## Configuration

### Idle and cinematic timing (`src/tokens.ts`)

| Constant | Default | Description |
|----------|---------|-------------|
| `IDLE_TIMEOUT_MS` | `45_000` | Milliseconds of no input before returning to idle. |
| `CINEMATIC_DETECTING_DELAY_MS` | `3_000` | Delay before showing “Moment Detected” after “Detecting Moment…”. |
| `CINEMATIC_DETECTED_DISPLAY_MS` | `1_500` | Time “Moment Detected” is shown before activating phase. |
| `CINEMATIC_ACTIVATING_SCROLL_MS` | `6_000` | Duration of vertical reel scroll in activating phase. |
| `CINEMATIC_ACTIVATING_HOLD_MS` | `1_000` | Hold time on selected audience ID before transitioning to detail. |
| `CONTROVERSY_DETECTED_DISPLAY_MS` | `1_000` | Multi-video cinematic: time “Moment Detected” shown before next video or transition. |

Colors and screen transition variants are also defined in `tokens.ts`.

### Moments and creatives (`src/data/moments.ts`)

- **Moment** interface: `id`, `name`, `label`, `hook`, `trigger`, `accentColor`, `creatives` (tuple of three Creative).
- **Creative** interface: `id`, `title`, `description`, `preview` (headline, stat, score, time, badge, cta, team1/2, metric, note).
- **Featured moments:** First two in `moments` array (e.g. Buzzer Beater, Controversy); they drive the two main tiles. **Carousel:** Remaining moments (Overtime, Elimination, Championship, Momentum Shift, Hero Performance, Review/Controversy, etc.).
- Edit this file to add or change moments and their creative preview copy.

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm (or yarn/pnpm).

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173` (or the port Vite reports). Touch, mouse, and keyboard events reset the idle timer.

**Demo mode** — Skip the idle screen and land directly on the moment grid:

```
http://localhost:5173?demo=1
```

### Build

```bash
npm run build
```

Runs `tsc` then `vite build`. Output is in **`dist/`**. Serve that folder over HTTP for kiosk deployment (e.g. static host or local server).

### Preview production build

```bash
npm preview
```

Serves the `dist/` build locally so you can test the production bundle.

---

## Kiosk / Touch Deployment

- **Resolution:** The UI is designed for **1920×1080**. `Stage` scales the fixed-stage div to fit the viewport (e.g. `transform: scale(...)`) so it works on other resolutions.
- **Input:** Touch, mouse, and key events reset the idle timer. `index.html` disables text selection and tap highlight for a kiosk-friendly experience (`user-select: none`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`).
- **Full screen:** For kiosk mode, run the built app in a browser in full screen (e.g. F11 or kiosk flags for Chrome/Electron). Ensure the device is in landscape so the orientation guard does not block the experience.
- **Assets:** Place `Moments Sample.mp4` and any other video/image assets in `public/` so they are served at the root path used by the app.

---

## Architecture Documentation

- **[docs/OWN_THE_GAME_ARCHITECTURE.md](docs/OWN_THE_GAME_ARCHITECTURE.md)** — Event flow for “Own the Game” (discrete): grid → cinematic (phases, frame capture, activating audiences) → detail; App state and `CinematicTransition` behavior.
- **[docs/THEMATIC-DETAIL-ARCHITECTURE.md](docs/THEMATIC-DETAIL-ARCHITECTURE.md)** — “Own the Season” (thematic) flow, `MomentDetail` layout (discrete vs thematic left column), `SeasonActivationViz`, and entry modes (`default` | `cinematic` | `thematic`).

---

## License

Proprietary — Genius Sports.
