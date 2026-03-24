# Genius Moments Wall

A **touch-screen kiosk application** for showcasing **Genius Sports** moments — game-winning plays, upsets, controversy, and other live-detected events — with branded creatives and sponsor integration previews. Built for fixed **1920×1080** displays (e.g., in-venue walls, broadcast control rooms, or trade-show demos).

---

## Overview

**Genius Moments Wall** demonstrates the **Genius Moment Engine**: real-time detection of high-stakes sporting moments (buzzer beaters, upsets, overtime, elimination games, championship clinches, momentum shifts, hero performances, and review/controversy) with three creative formats — **CTV**, **Social**, and **Interstitial** (see [Creative formats](#creative-formats-per-moment)). The app runs in landscape on large-format touch screens: an idle attract loop, **category** selection, a per-category moment and workflow screen, optional cinematic “Moment Detected” transitions, and detail views that explain trigger logic and show creative previews.

**Target environments:** In-venue digital signage, broadcast studios, sales demos, events. **Primary input:** Touch (mouse and keyboard also reset the idle timer). **Design resolution:** 1920×1080; the UI scales to fit other resolutions via a fixed stage.

---

## Features

### Core experience

- **Idle attract screen** — Animated “touch to explore” loop with gradient background, floating data chips, and rotating copy. Tap or click anywhere to open **category selection**.
- **Category grid** — Two tiles (**Championship Race**, **Rivalry Matchups**) with descriptions, example moments, and sports/tournament pills. Choosing a category opens that category’s **moment / workflow** screen.
- **Category workflow screen** — Category narrative, activation copy, example-moment bullets, sports/tournament pills, and a large **primary workflow** card. That CTA starts the scripted flow for the category (see [Cinematic routing](#cinematic-routing)). Moment membership and ordering per category live in `categories[].moments` in data even though the current UI does not expose a separate tile per moment.
- **Moment detail** — Left column: moment name, hook, detection trigger, proof-point stats (discrete path) or **season activation** visualization (thematic path). Right column: three creative format tabs with previews.
- **Idle timeout** — Returns to the attract screen after **45 seconds** of no touch, mouse, or keyboard input (configurable in `src/tokens.ts`).
- **Orientation guard** — On narrow viewports (portrait), shows a “Rotate Device” message; the main UI is intended for landscape.
- **Kiosk controls** — Optional reset button (top-right) for staff to return to idle from any screen.

### Categories and moments

Categories are defined in `src/data/moments.ts` as `categories[]`. Each category owns a subset of moments:

| Category | Focus | Example moments in the demo |
|----------|--------|-----------------------------|
| **Championship Race** | Title-race beats: clinchers, last-second drama, elimination, overtime | Championship, Buzzer Beater, Elimination, Overtime |
| **Rivalry Matchups** | High-intensity rivalry-driven beats | Controversy, Momentum Shift, Hero Performance, Review / Controversy |

The global `moments[]` array holds full **Moment** definitions (copy, triggers, creatives). Categories only reference which moments appear in each path.

### Cinematic routing

From the **category workflow** CTA (`SelectMomentScreen` → `App.tsx`), the app can open **single-video cinematic**, **multi-video cinematic**, or **detail** directly:

| Situation | What happens |
|-----------|----------------|
| **Championship Race** — workflow CTA | **Multi-video** cinematic using the **Controversy** moment’s clips (shared demo path; see comment in `SelectMomentScreen.tsx`). |
| **Rivalry Matchups** — workflow CTA (entry moment **Controversy**) | **Multi-video** cinematic (`ControversyCinematicTransition` + stacked clips). |
| `onSelectMoment(moment)` with **no** `isDiscrete` / `useMultiCinematic` | Opens **detail** immediately (discrete variant). |
| `isDiscrete: true` | **Single-video** cinematic (`CinematicTransition`), then detail with pause time / optional frame capture. |
| `isDiscrete: false` | **Detail** with **thematic** variant (e.g. season activation viz). |

The root flow is **category → workflow screen** (not a single flat moment carousel). `MomentGrid` / `MomentsTextCarousel` remain in the repo but are **not** mounted from `App.tsx` in the current wiring.

### Cinematic transitions

- **Single-video cinematic** (`CinematicTransition`) — One full-bleed video; phases include playing → detecting → “Moment Detected” → **Activating Audiences** (vertical reel via `ActivatingAudiencesReel`) → handoff to detail with `videoPauseTime` and optional `capturedFrameDataUrl`.
- **Multi-video cinematic** (`ControversyCinematicTransition` + `ControversyStackedVideos`) — Multiple clips (e.g. soccer trims) with “Moment Detected” between segments, then transition to detail.

### Creative formats (per moment)

On the detail screen, format buttons are labeled **1. CTV**, **2. Social**, **3. Interstitial**. They map to the same three preview layouts as before (broadcast-style overlay, branded frame, full takeover), driven by each moment’s `creatives` tuple in `moments.ts`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Runtime** | React 18, TypeScript |
| **Build** | Vite 5 — dev server (HMR) and production build |
| **Styling** | Tailwind CSS 3, inline styles for layout |
| **Animation** | Framer Motion 11 — screen transitions, AnimatePresence, motion components |
| **Fonts** | Inter (Google Fonts), Klarheit (serif) where used |

**Node:** 18+ recommended. Package manager: npm (or yarn/pnpm).

---

## Project structure

```
├── index.html              # Entry HTML; viewport, theme-color, kiosk-friendly CSS
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/                 # Static assets (videos, images, SVG)
│   ├── genius-sports-logo.png
│   ├── Moments Sample.mp4       # Single-video cinematic
│   ├── buzzer-beater.jpg, championship.jpg, rivalry.jpeg, soccer-thumbnail.png
│   ├── soccer-trim-1.mp4 … soccer-trim-3.mp4   # Multi-video cinematic
│   ├── soccer-1.mp4, soccer-2.mp4, soccer-3.mp4
│   ├── fan-cloud.svg
│   └── …
└── src/
    ├── main.tsx
    ├── App.tsx             # Screens: idle | select-category | select-moment |
    │                       #   cinematic | cinematic-multi | detail; idle timer; handlers
    ├── index.css
    ├── tokens.ts           # Colors, IDLE_TIMEOUT_MS, cinematic timing
    ├── data/
    │   └── moments.ts      # Moment[], Category[], categories, moments
    └── components/
        ├── Stage.tsx
        ├── OrientationGuard.tsx
        ├── KioskControls.tsx
        ├── IdleAttract.tsx
        ├── AnimatedBarsBackground.tsx
        ├── FloatingDataChips.tsx
        ├── CategoryGrid.tsx          # “Select a category”
        ├── CategoryTile.tsx          # Category card + preview image helpers
        ├── SelectMomentScreen.tsx    # Per-category moment list + workflow CTA
        ├── MomentGrid.tsx            # Legacy grid (not wired in App)
        ├── MomentTile.tsx
        ├── MomentsTextCarousel.tsx
        ├── CinematicTransition.tsx
        ├── ActivatingAudiencesReel.tsx
        ├── ActivatingAudiencesStepTwoPanel.tsx
        ├── ControversyCinematicTransition.tsx
        ├── ControversyStackedVideos.tsx
        ├── MomentDetail.tsx
        ├── CreativePreview.tsx
        ├── SeasonActivationViz.tsx
        ├── AnimatedFanCloud.tsx
        └── OwnTheSeasonExplanation.tsx
```

---

## Configuration

### Idle and cinematic timing (`src/tokens.ts`)

| Constant | Default | Description |
|----------|---------|-------------|
| `IDLE_TIMEOUT_MS` | `45_000` | Milliseconds of no input before returning to idle. |
| `CINEMATIC_DETECTING_DELAY_MS` | `3_000` | Delay before showing “Moment Detected” after “Detecting Moment…”. |
| `CINEMATIC_DETECTED_DISPLAY_MS` | `1_500` | Time “Moment Detected” is shown before the activating phase. |
| `CINEMATIC_ACTIVATING_SCROLL_MS` | `6_000` | Duration of the vertical reel scroll in the activating phase. |
| `CINEMATIC_ACTIVATING_HOLD_MS` | `1_000` | Hold on the selected audience ID before transitioning to detail. |
| `CONTROVERSY_DETECTED_DISPLAY_MS` | `1_000` | Multi-video cinematic: time “Moment Detected” is shown between segments. |

### Moments and categories (`src/data/moments.ts`)

- **Moment:** `id`, `name`, `label`, `hook`, `trigger`, `accentColor`, `creatives` (tuple of three **Creative**).
- **Creative:** `id`, `title`, `description`, `preview` (headline, stat, score, time, badge, cta, team1/2, metric, note). Tab labels in the UI are fixed (**CTV / Social / Interstitial**) in `CreativePreview.tsx`; titles in data are used in preview chrome where relevant.
- **Category:** `id`, `name`, `description`, `moments`, `activationCopy`, `exampleMoments`, `sportsAndTournaments`, optional `workflowCtaLabel`.

Edit `moments` and `categories` to change copy, which moments appear per category, and creative preview content.

---

## Getting started

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

Opens the app at `http://localhost:5173` (or the port Vite prints). Touch, mouse, and keyboard events reset the idle timer.

**Demo mode** — Skip the idle screen and start on **category selection**:

```
http://localhost:5173?demo=1
```

### Build

```bash
npm run build
```

Runs `tsc` then `vite build`. Output is in **`dist/`**. Serve that folder over HTTP for kiosk deployment.

### Preview production build

```bash
npm run preview
```

Serves the `dist/` build locally to verify the production bundle.

---

## Kiosk / touch deployment

- **Resolution:** Designed for **1920×1080**. `Stage` scales the fixed-stage layout to fit the viewport.
- **Input:** Touch, mouse, and key events reset the idle timer. `index.html` disables text selection and tap highlight where appropriate for kiosk use.
- **Full screen:** Run the built app in a browser full screen (or kiosk/Electron). Use landscape so the orientation guard does not block the UI.
- **Assets:** Keep `Moments Sample.mp4`, trim videos, and images in `public/` so paths like `/Moments Sample.mp4` resolve correctly.

---

## License

Proprietary — Genius Sports.
