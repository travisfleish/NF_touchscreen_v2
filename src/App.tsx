import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IdleAttract from './components/IdleAttract'
import KioskControls from './components/KioskControls'
import Stage from './components/Stage'
import { STAGE_H, STAGE_W } from './components/Stage'
import OrientationGuard from './components/OrientationGuard'
import AnimatedBarsBackground from './components/AnimatedBarsBackground'
import SportBubble from './components/SportBubble'
import MomentBubble from './components/MomentBubble'
import { tapRingOuterRadiusPx } from './utils/tapRingGeometry'
import MomentDetailPanel from './components/MomentDetailPanel'
import { IDLE_TIMEOUT_MS } from './tokens'
import { sportsData, SportData, SPORT_PARENT_GLOW, SPORT_PARENT_GRADIENT } from './data/sportsData'

interface Point {
  x: number
  y: number
}

const STAGE_CENTER: Point = { x: STAGE_W / 2, y: STAGE_H / 2 }
const STAGE_MARGIN = 14
const SPORT_BUBBLE_DIAMETER = 300
/** Max visual radius of idle sport hub (pulse scale 1.09 on SportBubble). */
const SPORT_HUB_RADIUS_IDLE = (SPORT_BUBBLE_DIAMETER / 2) * 1.09 + STAGE_MARGIN

const SPORT_ANCHORS: Record<string, Point> = {
  'march-madness': { x: 320, y: 280 },
  nfl: { x: 960, y: 200 },
  nba: { x: 1580, y: 310 },
  'world-cup': { x: 260, y: 750 },
  mlb: { x: 920, y: 860 },
  nwsl: { x: 1600, y: 720 },
}

/**
 * When another sport is expanded, each parent moves to its slot on the perimeter
 * (Option A — dock) so the center stays clear for the active hub + rings.
 */
const PERIPHERAL_ANCHORS: Record<string, Point> = {
  'march-madness': { x: 220, y: 320 },
  nfl: { x: 960, y: 185 },
  nba: { x: 1720, y: 300 },
  'world-cup': { x: 240, y: 820 },
  mlb: { x: 960, y: 920 },
  /** Nudged up vs bottom band so docked hubs clear “Genius Moments Explorer” (bottom-right). */
  nwsl: { x: 1680, y: 695 },
}

/** Smaller sport hub on the perimeter when another sport is expanded. */
const DOCKED_SPORT_DIAMETER = 148
/** Max visual radius of docked hub (pulse scale 1.09 on SportBubble). */
const DOCKED_HUB_RADIUS_PX = (DOCKED_SPORT_DIAMETER / 2) * 1.09 + STAGE_MARGIN
/** Above category / moment orbit layers (max 42); below Back (45) — docked sports must not sit under child nodes. */
const Z_INDEX_DOCKED_SPORT = 44

/**
 * Perimeter slots for category bubbles (step 2: pick category) and non-selected
 * categories during moments — same “easel” idea as docked sports.
 */
const CATEGORY_DOCK_SLOTS: Point[] = [
  { x: 220, y: 300 },
  { x: 960, y: 200 },
  { x: 1720, y: 300 },
  { x: 200, y: 540 },
  /** Right column: y shifted up so perimeter docks stay above bottom-right title. */
  { x: 1720, y: 420 },
  { x: 240, y: 820 },
  { x: 960, y: 920 },
  { x: 1680, y: 690 },
]

/** Sport hub diameter while expanded when there is no theme ring (solo sport). */
const EXPANDED_HUB_DIAMETER = 320
/**
 * With a theme ring visible, the next tap is a theme — sport shrinks to “parent” scale and
 * theme nodes take the large hub size (swap vs idle pick-sport flow).
 */
const SPORT_PARENT_WHEN_THEME_RING_DIAMETER = 200
/** Moment package bubbles on the sport ring (same size idle vs selected — no shrink on drill-in). */
const THEME_PACKAGE_RING_BASE = 288
/**
 * Inner-ring moment bubbles (after a package is selected). Slightly smaller when there are many
 * moments so horizontal lanes stay on-screen — still large enough for readable type vs older 172/156.
 */
const MOMENT_RING_DIAMETER_BASE_FEW = 214
const MOMENT_RING_DIAMETER_BASE_MANY = 196
/**
 * Expanded sport hub: rendered at scale 1 with pulse up to 1.09 (see SportBubble).
 * Used for orbit packing + screen bounds — matches on-screen footprint.
 */
const SPORT_HUB_EFFECTIVE_RADIUS_PX = (EXPANDED_HUB_DIAMETER / 2) * 1.09 + STAGE_MARGIN
/** Small sport anchor when the theme ring is the primary target (no pulse on sport). */
const SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX =
  (SPORT_PARENT_WHEN_THEME_RING_DIAMETER / 2) * 1.04 + STAGE_MARGIN
/** Time for the sport bubble to ease into the center */
const SPORT_EXPAND_DURATION_S = 0.95
/** Minimum clear gap between parent and child (or adjacent sibling) circle edges. */
const ORBIT_GAP_PX = 10
const MOMENTS_ORBIT_DELAY_S = 0.12
/** Moments begin after hub finishes moving to center */
const MOMENTS_START_AFTER_S = SPORT_EXPAND_DURATION_S + MOMENTS_ORBIT_DELAY_S
/** Fade when swapping moment packages so satellites don’t snap off */
const MOMENT_PACKAGE_EXIT_FADE_S = 0.4
const IDLE_EVENTS = ['touchstart', 'mousedown', 'keydown'] as const

/** Satellite: hover 1.02 + small cushion for micro-orbit drift so layouts don’t touch. */
function orbitSatelliteEffectiveRadiusPx(diameter: number): number {
  const microPad = 8
  return (diameter / 2) * 1.02 + STAGE_MARGIN * 0.5 + microPad
}

/**
 * Minimum polar distance from hub center so satellites don’t overlap the parent (edge clearance)
 * and adjacent satellites on the ring don’t overlap (chord clearance), using max child radius.
 */
function minPolarRadiusForRing(
  n: number,
  maxChildRadius: number,
  parentRadius: number,
  gap: number
): number {
  const clearOfParent = parentRadius + maxChildRadius + gap
  if (n <= 1) return clearOfParent
  const chordClear = (2 * maxChildRadius + gap) / (2 * Math.sin(Math.PI / n))
  return Math.max(clearOfParent, chordClear)
}

function maxOf(nums: number[]): number {
  return nums.length ? Math.max(...nums) : 0
}

/**
 * Evenly spaced rings around a parent: uses the minimum polar radius that clears the parent
 * and avoids sibling overlap; two rings when count > 8 (inner 8 + outer remainder).
 */
function createPackedOrbitOffsets(
  count: number,
  diameters: number[],
  parentRadius: number,
  gap: number
): Point[] {
  if (count <= 0) return []
  const childRadii = diameters.map((d) => orbitSatelliteEffectiveRadiusPx(d))

  if (count <= 8) {
    const polar = minPolarRadiusForRing(count, maxOf(childRadii), parentRadius, gap)
    return createRingPointsWithRadii(count, Array(count).fill(polar))
  }

  const innerCount = Math.min(8, count)
  const outerCount = count - innerCount
  const innerRadii = childRadii.slice(0, innerCount)
  const outerRadii = childRadii.slice(innerCount)
  const rInnerMax = maxOf(innerRadii)
  const rOuterMax = maxOf(outerRadii)

  let polarInner = minPolarRadiusForRing(innerCount, rInnerMax, parentRadius, gap)
  let polarOuter = minPolarRadiusForRing(outerCount, rOuterMax, parentRadius, gap)
  polarOuter = Math.max(polarOuter, polarInner + rInnerMax + rOuterMax + gap)

  const innerStepDeg = 360 / innerCount
  const outerAngleStartDeg = -92 + innerStepDeg / 2
  const inner = createRingPointsWithRadii(innerCount, Array(innerCount).fill(polarInner), -92)
  const outer = createRingPointsWithRadii(outerCount, Array(outerCount).fill(polarOuter), outerAngleStartDeg)
  return [...inner, ...outer]
}

/**
 * Place child nodes to the left and right of the parent only (keeps moments on-screen horizontally).
 */
function createHorizontalOrbitOffsets(
  count: number,
  diameters: number[],
  parentRadius: number,
  gap: number
): Point[] {
  if (count <= 0) return []
  const childRadii = diameters.map((d) => orbitSatelliteEffectiveRadiusPx(d))
  const maxCh = maxOf(childRadii)
  const basePolar = parentRadius + maxCh + gap
  const laneStep = 2 * maxCh + gap
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const lane = Math.floor(i / 2)
    const polar = basePolar + lane * laneStep
    return { x: side * polar, y: 0 }
  })
}

function createRingPointsWithRadii(count: number, radii: number[], angleStartDeg = -90): Point[] {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, index) => {
    const angleDeg = angleStartDeg + (360 / count) * index
    const angle = (angleDeg * Math.PI) / 180
    const r = radii[index] ?? radii[radii.length - 1] ?? 0
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
}

/** Slight deterministic size variation per slot (visual texture). */
function momentDiameterForIndex(base: number, index: number): number {
  const delta = Math.round(Math.sin(index * 2.1) * 5 + Math.cos(index * 0.85) * 3)
  return Math.min(base + 8, Math.max(base - 8, base + delta))
}

function getDriftAnimation(index: number) {
  const patterns = [
    { x: [0, 80, -60, 100, -40, 0], y: [0, -70, 90, 40, -80, 0], duration: 22 },
    { x: [0, -90, 70, -50, 110, 0], y: [0, 80, -50, 100, -60, 0], duration: 26 },
    { x: [0, 70, -110, 50, 80, 0], y: [0, -90, 60, -70, 50, 0], duration: 24 },
    { x: [0, -80, 50, -120, 60, 0], y: [0, 90, -70, 50, -100, 0], duration: 20 },
    { x: [0, 110, -50, 80, -90, 0], y: [0, -60, 90, -40, 80, 0], duration: 28 },
    { x: [0, -60, 100, -90, 40, 0], y: [0, 70, -110, 60, -50, 0], duration: 23 },
  ]
  return patterns[index % patterns.length]
}

function getMicroDrift(index: number) {
  const patterns = [
    { x: [0, 6, -4, 7, -3, 0], y: [0, -5, 7, 3, -6, 0], duration: 11 },
    { x: [0, -7, 5, -3, 8, 0], y: [0, 6, -4, 8, -5, 0], duration: 13 },
    { x: [0, 5, -8, 3, 6, 0], y: [0, -7, 4, -5, 3, 0], duration: 10 },
    { x: [0, -5, 4, -8, 4, 0], y: [0, 7, -5, 4, -7, 0], duration: 14 },
  ]
  return patterns[index % patterns.length]
}

/** Min/max drift across all micro-drift patterns (orbit satellites). */
function getMicroDriftExtents() {
  let minX = 0
  let maxX = 0
  let minY = 0
  let maxY = 0
  for (let i = 0; i < 4; i++) {
    const d = getMicroDrift(i)
    minX = Math.min(minX, ...d.x)
    maxX = Math.max(maxX, ...d.x)
    minY = Math.min(minY, ...d.y)
    maxY = Math.max(maxY, ...d.y)
  }
  return { minX, maxX, minY, maxY }
}

const MICRO_DRIFT_EXTENTS = getMicroDriftExtents()

/** No positional drift — used after a sport is selected so hubs and rings stay fixed. */
const STATIC_HUB_DRIFT: { x: number[]; y: number[] } = { x: [0], y: [0] }

/**
 * Trimmed segment between circle centers (container-relative px). Radii from getBoundingClientRect.
 */
function trimmedSegmentBetweenCircles(
  parent: Point & { r: number },
  child: Point & { r: number }
): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = child.x - parent.x
  const dy = child.y - parent.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-3) return null
  const ux = dx / len
  const uy = dy / len
  const x1 = parent.x + ux * parent.r
  const y1 = parent.y + uy * parent.r
  const x2 = child.x - ux * child.r
  const y2 = child.y - uy * child.r
  if (Math.hypot(x2 - x1, y2 - y1) < 0.1) return null
  return { x1, y1, x2, y2 }
}

/**
 * Shorten a segment from both ends along the line so stroke (centered on the path) does not
 * paint past the circle rims — half the stroke width at each end, matching user-unit strokeWidth.
 */
function insetSegmentEndpoints(
  seg: ConnectorSegment,
  insetStart: number,
  insetEnd: number
): ConnectorSegment | null {
  const dx = seg.x2 - seg.x1
  const dy = seg.y2 - seg.y1
  const len = Math.hypot(dx, dy)
  if (len < 1e-3) return null
  let s = Math.max(0, insetStart)
  let e = Math.max(0, insetEnd)
  const total = s + e
  if (total >= len - 0.5) {
    const budget = Math.max(0, len - 0.5)
    const scale = total > 0 ? budget / total : 0
    s *= scale
    e *= scale
  }
  const ux = dx / len
  const uy = dy / len
  const x1 = seg.x1 + ux * s
  const y1 = seg.y1 + uy * s
  const x2 = seg.x2 - ux * e
  const y2 = seg.y2 - uy * e
  if (Math.hypot(x2 - x1, y2 - y1) < 0.5) return null
  return { x1, y1, x2, y2 }
}

/**
 * Shifts a hub anchor so the hub (with hub drift) and optional orbit bubbles (offsets + radii + micro drift)
 * stay inside the stage. Iterates so fixing one edge can be corrected on the next pass.
 */
function expandClusterToFit(
  rawAnchor: Point,
  hubDrift: { x: number[]; y: number[] },
  hubRadius: number,
  orbitPoints: Array<{ offset: Point; radius: number }>,
  orbitDrift: { minX: number; maxX: number; minY: number; maxY: number }
): Point {
  const minDxHub = Math.min(...hubDrift.x)
  const maxDxHub = Math.max(...hubDrift.x)
  const minDyHub = Math.min(...hubDrift.y)
  const maxDyHub = Math.max(...hubDrift.y)
  const { minX: oxMin, maxX: oxMax, minY: oyMin, maxY: oyMax } = orbitDrift

  const computeBounds = (ax: number, ay: number) => {
    let minX = ax + minDxHub - hubRadius
    let maxX = ax + maxDxHub + hubRadius
    let minY = ay + minDyHub - hubRadius
    let maxY = ay + maxDyHub + hubRadius
    for (const p of orbitPoints) {
      const cx = ax + p.offset.x
      const cy = ay + p.offset.y
      minX = Math.min(minX, cx + oxMin - p.radius)
      maxX = Math.max(maxX, cx + oxMax + p.radius)
      minY = Math.min(minY, cy + oyMin - p.radius)
      maxY = Math.max(maxY, cy + oyMax + p.radius)
    }
    return { minX, maxX, minY, maxY }
  }

  let ax = rawAnchor.x
  let ay = rawAnchor.y

  for (let iter = 0; iter < 8; iter++) {
    const b = computeBounds(ax, ay)
    if (b.minX >= 0 && b.maxX <= STAGE_W && b.minY >= 0 && b.maxY <= STAGE_H) break
    if (b.minX < 0) ax += -b.minX
    else if (b.maxX > STAGE_W) ax -= b.maxX - STAGE_W
    if (b.minY < 0) ay += -b.minY
    else if (b.maxY > STAGE_H) ay -= b.maxY - STAGE_H
  }

  return { x: ax, y: ay }
}

function clampIdleSportAnchor(raw: Point, driftIndex: number): Point {
  return expandClusterToFit(raw, getDriftAnimation(driftIndex), SPORT_HUB_RADIUS_IDLE, [], MICRO_DRIFT_EXTENTS)
}

function clampDockPeripheralAnchor(raw: Point): Point {
  return expandClusterToFit(raw, STATIC_HUB_DRIFT, DOCKED_HUB_RADIUS_PX, [], MICRO_DRIFT_EXTENTS)
}

/** Extra air gap between docked sport circles and cluster / each other (stage px). */
const DOCKED_SPORT_CLEARANCE_PX = 14

type CircleDef = { x: number; y: number; r: number }

function dedupeAnchorPoints(points: Point[]): Point[] {
  const seen = new Set<string>()
  const out: Point[] = []
  for (const p of points) {
    const k = `${Math.round(p.x)}:${Math.round(p.y)}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out
}

/**
 * Circles that occupy the “main column” (hub + themes + moments) so docked sports can be
 * placed outside them.
 */
function buildExpandedClusterObstacleCircles(
  expandedSport: SportData,
  expandedCategoryId: string | null,
  expandedClusterAnchor: Point,
  categoryOffsets: Point[],
  /** Selected theme hub on the sport ring (not stage-centered). */
  themeRingAnchor: Point | null,
  momentItems: { id: string }[],
  momentOffsets: Point[]
): CircleDef[] {
  const circles: CircleDef[] = []

  if (!expandedCategoryId && expandedSport.categories.length > 0) {
    circles.push({
      x: expandedClusterAnchor.x,
      y: expandedClusterAnchor.y,
      r: SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX,
    })
    expandedSport.categories.forEach((_, i) => {
      const d = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, i)
      const off = categoryOffsets[i] ?? { x: 0, y: 0 }
      circles.push({
        x: expandedClusterAnchor.x + off.x,
        y: expandedClusterAnchor.y + off.y,
        r: orbitSatelliteEffectiveRadiusPx(d),
      })
    })
    return circles
  }

  if (expandedCategoryId && momentItems.length > 0) {
    if (!themeRingAnchor) return []
    circles.push({
      x: expandedClusterAnchor.x,
      y: expandedClusterAnchor.y,
      r: SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX,
    })
    expandedSport.categories.forEach((cat, i) => {
      const off = categoryOffsets[i] ?? { x: 0, y: 0 }
      const cx = expandedClusterAnchor.x + off.x
      const cy = expandedClusterAnchor.y + off.y
      const d = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, i)
      const r = orbitSatelliteEffectiveRadiusPx(d)
      circles.push({ x: cx, y: cy, r })
    })
    const base = momentItems.length > 10 ? MOMENT_RING_DIAMETER_BASE_MANY : MOMENT_RING_DIAMETER_BASE_FEW
    momentItems.forEach((_, i) => {
      const d = momentDiameterForIndex(base, i)
      const off = momentOffsets[i] ?? { x: 0, y: 0 }
      circles.push({
        x: themeRingAnchor.x + off.x,
        y: themeRingAnchor.y + off.y,
        r: orbitSatelliteEffectiveRadiusPx(d),
      })
    })
    return circles
  }

  if (expandedCategoryId && momentItems.length === 0 && themeRingAnchor) {
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    const catD = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, catIdx >= 0 ? catIdx : 0)
    circles.push({
      x: themeRingAnchor.x,
      y: themeRingAnchor.y,
      r: orbitSatelliteEffectiveRadiusPx(catD),
    })
    return circles
  }

  circles.push({
    x: expandedClusterAnchor.x,
    y: expandedClusterAnchor.y,
    r: SPORT_HUB_EFFECTIVE_RADIUS_PX,
  })
  return circles
}

function minClearanceDock(
  anchor: Point,
  dockR: number,
  cluster: CircleDef[],
  placedCenters: Point[]
): number {
  let m = Infinity
  for (const c of cluster) {
    const d = Math.hypot(anchor.x - c.x, anchor.y - c.y) - dockR - c.r - DOCKED_SPORT_CLEARANCE_PX
    m = Math.min(m, d)
  }
  for (const p of placedCenters) {
    const d = Math.hypot(anchor.x - p.x, anchor.y - p.y) - 2 * dockR - ORBIT_GAP_PX
    m = Math.min(m, d)
  }
  return m
}

/**
 * Chooses perimeter positions for docked sports so they stay outside the measured cluster footprint.
 * Greedy in sportsData order; prefers each sport’s static PERIPHERAL_ANCHORS slot when it clears.
 */
function computeDockedSportAnchorsAvoidingCluster(
  allSports: SportData[],
  expandedSportId: string,
  preferredById: Record<string, Point>,
  clusterObstacles: CircleDef[]
): Record<string, Point> {
  const dockR = DOCKED_HUB_RADIUS_PX
  const cluster = clusterObstacles.map((c) => ({
    ...c,
    r: c.r + DOCKED_SPORT_CLEARANCE_PX,
  }))

  const candidatePool = dedupeAnchorPoints([
    ...Object.values(preferredById),
    ...CATEGORY_DOCK_SLOTS,
    { x: 160, y: 200 },
    { x: 1760, y: 200 },
    { x: 160, y: 880 },
    { x: 1760, y: 720 },
    { x: 280, y: 1000 },
    { x: 1640, y: 860 },
    { x: 120, y: 540 },
    { x: 1800, y: 430 },
    { x: 400, y: 180 },
    { x: 1520, y: 180 },
    { x: 400, y: 900 },
    { x: 1520, y: 780 },
  ]).map((p) => clampDockPeripheralAnchor(p))

  /** Active sport uses hub anchor — only other sports need perimeter dock slots. */
  const dockedSports = allSports.filter((s) => expandedSportId !== null && expandedSportId !== s.id)

  const result: Record<string, Point> = {}
  const placed: Point[] = []

  for (const s of dockedSports) {
    const preferred = clampDockPeripheralAnchor(preferredById[s.id] ?? STAGE_CENTER)

    let best = preferred
    let bestScore = minClearanceDock(preferred, dockR, cluster, placed)

    for (const cand of candidatePool) {
      const sc = minClearanceDock(cand, dockR, cluster, placed)
      if (sc > bestScore) {
        bestScore = sc
        best = cand
      }
    }

    result[s.id] = best
    placed.push(best)
  }

  return result
}

type ConnectorSegment = { x1: number; y1: number; x2: number; y2: number }

const HUB_CONNECTOR_RADIUS_PX = SPORT_PARENT_WHEN_THEME_RING_DIAMETER / 2
/** User-space stroke widths (match viewBox); butt caps remove end overlap; inset only bleeds perpendicular to path. */
const HUB_LINE_STROKE_USER = 6
const MOMENT_LINE_STROKE_USER = 5

function orbitConnectorEndInset(strokeUser: number): number {
  // Half-stroke inset was too aggressive (visible gap); ~¼ stroke keeps paint off the fill without a seam.
  return Math.max(0.5, strokeUser * 0.28)
}

/**
 * Orbit connectors: geometry is derived from the same stage-space layout as the bubbles
 * (`left`/`top` anchors + orbit offsets + diameters). Measuring DOM under CSS `transform: scale()`
 * was unreliable; this stays aligned with the 1920×1080 coordinate system used for positioning.
 */
function OrbitConnectorSvg({
  expandedSport,
  expandedClusterAnchor,
  categoryOffsets,
  expandedCategoryId,
  momentItems,
  selectedThemeRingAnchor,
  momentOffsets,
}: {
  expandedSport: SportData | null
  expandedClusterAnchor: Point | null
  categoryOffsets: Point[]
  expandedCategoryId: string | null
  momentItems: { id: string }[]
  selectedThemeRingAnchor: Point | null
  momentOffsets: Point[]
}) {
  const hubSegments = useMemo(() => {
    const out: Record<string, ConnectorSegment> = {}
    if (!expandedSport?.categories.length || !expandedClusterAnchor) return out

    const hx = expandedClusterAnchor.x
    const hy = expandedClusterAnchor.y
    const hubCircle: Point & { r: number } = { x: hx, y: hy, r: HUB_CONNECTOR_RADIUS_PX }

    expandedSport.categories.forEach((cat, index) => {
      const offset = categoryOffsets[index] ?? { x: 0, y: 0 }
      const cx = hx + offset.x
      const cy = hy + offset.y
      const baseD = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, index)
      /** Expanded theme hub has no tap ring — connectors meet the bubble rim. */
      const childR =
        expandedCategoryId === cat.id ? baseD / 2 : tapRingOuterRadiusPx(baseD)
      const childCircle: Point & { r: number } = { x: cx, y: cy, r: childR }
      const seg = trimmedSegmentBetweenCircles(hubCircle, childCircle)
      if (seg) out[cat.id] = seg
    })
    return out
  }, [expandedSport, expandedClusterAnchor, categoryOffsets, expandedCategoryId])

  const momentSegments = useMemo(() => {
    const out: Record<string, ConnectorSegment> = {}
    if (!expandedSport || !expandedCategoryId || !momentItems.length || !selectedThemeRingAnchor) {
      return out
    }
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    if (catIdx < 0) return out

    const parentD = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, catIdx)
    const px = selectedThemeRingAnchor.x
    const py = selectedThemeRingAnchor.y
    const parentR = parentD / 2
    const parentCircle: Point & { r: number } = { x: px, y: py, r: parentR }

    const baseMoment = momentItems.length > 10 ? MOMENT_RING_DIAMETER_BASE_MANY : MOMENT_RING_DIAMETER_BASE_FEW
    momentItems.forEach((item, mi) => {
      const off = momentOffsets[mi] ?? { x: 0, y: 0 }
      const cx = px + off.x
      const cy = py + off.y
      const d = momentDiameterForIndex(baseMoment, mi)
      const childCircle: Point & { r: number } = {
        x: cx,
        y: cy,
        r: tapRingOuterRadiusPx(d),
      }
      const seg = trimmedSegmentBetweenCircles(parentCircle, childCircle)
      if (seg) out[item.id] = seg
    })
    return out
  }, [
    expandedSport,
    expandedCategoryId,
    momentItems,
    selectedThemeRingAnchor,
    momentOffsets,
  ])

  const hubLineTransition = {
    pathLength: {
      duration: 0.55,
      ease: [0.22, 0.94, 0.36, 1] as const,
    },
    opacity: {
      duration: 0.45,
      ease: [0.22, 0.94, 0.36, 1] as const,
    },
  }

  const momentLineTransition = {
    pathLength: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
    opacity: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }

  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 55,
        overflow: 'visible',
      }}
    >
      {expandedSport?.categories.map((cat, index) => {
        const seg = hubSegments[cat.id]
        if (!seg) return null
        const inset = orbitConnectorEndInset(HUB_LINE_STROKE_USER)
        const drawn = insetSegmentEndpoints(seg, inset, inset)
        if (!drawn) return null
        const staggerDelay = MOMENTS_START_AFTER_S + index * 0.045
        return (
          <motion.path
            key={`hub-conn-${cat.id}`}
            d={`M ${drawn.x1} ${drawn.y1} L ${drawn.x2} ${drawn.y2}`}
            fill="none"
            stroke="rgba(255, 248, 220, 0.98)"
            strokeWidth={HUB_LINE_STROKE_USER}
            strokeLinecap="butt"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              ...hubLineTransition,
              pathLength: { ...hubLineTransition.pathLength, delay: staggerDelay },
              opacity: { ...hubLineTransition.opacity, delay: staggerDelay },
            }}
          />
        )
      })}
      {expandedSport && expandedCategoryId && selectedThemeRingAnchor && (
        <AnimatePresence>
          {momentItems.map((item, index) => {
            const seg = momentSegments[item.id]
            if (!seg) return null
            const inset = orbitConnectorEndInset(MOMENT_LINE_STROKE_USER)
            const drawn = insetSegmentEndpoints(seg, inset, inset)
            if (!drawn) return null
            const staggerDelay = MOMENTS_START_AFTER_S + index * 0.045
            return (
              <motion.path
                key={`${expandedCategoryId}-moment-conn-${item.id}`}
                d={`M ${drawn.x1} ${drawn.y1} L ${drawn.x2} ${drawn.y2}`}
                fill="none"
                stroke="rgba(200, 235, 255, 0.95)"
                strokeWidth={MOMENT_LINE_STROKE_USER}
                strokeLinecap="butt"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{
                  pathLength: 0,
                  opacity: 0,
                  transition: {
                    pathLength: { duration: MOMENT_PACKAGE_EXIT_FADE_S * 0.85, ease: 'easeIn' },
                    opacity: { duration: MOMENT_PACKAGE_EXIT_FADE_S, ease: 'easeIn' },
                  },
                }}
                transition={{
                  ...momentLineTransition,
                  pathLength: { ...momentLineTransition.pathLength, delay: staggerDelay },
                  opacity: { ...momentLineTransition.opacity, delay: staggerDelay },
                }}
              />
            )
          })}
        </AnimatePresence>
      )}
    </svg>
  )
}

function ExperienceBackground() {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #0000ff 0%, #0000b8 50%, #000090 100%)',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      <AnimatedBarsBackground />

      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 12,
          paddingTop: 48,
          paddingLeft: 56,
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <img
          src="/genius-sports-logo.png"
          alt="Genius Sports"
          style={{ height: 120, opacity: 0.98, display: 'block' }}
        />
      </motion.div>

    </motion.div>
  )
}

export default function App() {
  const [hasEngaged, setHasEngaged] = useState(false)
  const [expandedSportId, setExpandedSportId] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const engagedRef = useRef(hasEngaged)
  engagedRef.current = hasEngaged

  const resetToIdle = useCallback(() => {
    setHasEngaged(false)
    setExpandedSportId(null)
    setExpandedCategoryId(null)
    setSelectedMomentId(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleIdleReset = useCallback(() => {
    if (!engagedRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(resetToIdle, IDLE_TIMEOUT_MS)
  }, [resetToIdle])

  useEffect(() => {
    if (hasEngaged) {
      scheduleIdleReset()
    } else if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [hasEngaged, scheduleIdleReset])

  useEffect(() => {
    IDLE_EVENTS.forEach((eventName) => window.addEventListener(eventName, scheduleIdleReset))
    return () => {
      IDLE_EVENTS.forEach((eventName) => window.removeEventListener(eventName, scheduleIdleReset))
    }
  }, [scheduleIdleReset])

  const expandedSport = useMemo<SportData | null>(
    () => sportsData.find((sport) => sport.id === expandedSportId) ?? null,
    [expandedSportId]
  )

  const selectedMoment = useMemo(
    () =>
      expandedSport?.categories
        .find((category) => category.id === expandedCategoryId)
        ?.moments.find((moment) => moment.id === selectedMomentId) ?? null,
    [expandedCategoryId, expandedSport, selectedMomentId]
  )

  const momentItems = useMemo(() => {
    if (!expandedSport || !expandedCategoryId) return []
    const activeCategory = expandedSport.categories.find((category) => category.id === expandedCategoryId)
    if (!activeCategory) return []
    return activeCategory.moments.map((moment) => ({ id: moment.id, label: moment.name }))
  }, [expandedCategoryId, expandedSport])

  const momentOffsets = useMemo(() => {
    if (!expandedSport || !expandedCategoryId || !momentItems.length) return []
    const base = momentItems.length > 10 ? MOMENT_RING_DIAMETER_BASE_MANY : MOMENT_RING_DIAMETER_BASE_FEW
    const diameters = momentItems.map((_, i) => momentDiameterForIndex(base, i))
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    const catD = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, catIdx >= 0 ? catIdx : 0)
    const parentR = orbitSatelliteEffectiveRadiusPx(catD)
    return createHorizontalOrbitOffsets(momentItems.length, diameters, parentR, ORBIT_GAP_PX)
  }, [momentItems, expandedSport, expandedCategoryId])

  const categoryOffsets = useMemo(() => {
    if (!expandedSport) return []
    const base = THEME_PACKAGE_RING_BASE
    const diameters = expandedSport.categories.map((_, index) => momentDiameterForIndex(base, index))
    return createPackedOrbitOffsets(
      expandedSport.categories.length,
      diameters,
      SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX,
      ORBIT_GAP_PX
    )
  }, [expandedSport])

  const expandedClusterAnchor = useMemo(() => {
    if (!expandedSportId || !expandedSport) return null
    const hubDrift = STATIC_HUB_DRIFT
    /** Hub + full theme ring — same anchor after a moment package is selected (sport stays fixed). */
    if (expandedSport.categories.length > 0) {
      const raw = STAGE_CENTER
      const orbitPoints = expandedSport.categories.map((_, i) => {
        const d = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, i)
        return {
          offset: categoryOffsets[i] ?? { x: 0, y: 0 },
          radius: orbitSatelliteEffectiveRadiusPx(d),
        }
      })
      return expandClusterToFit(raw, hubDrift, SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX, orbitPoints, MICRO_DRIFT_EXTENTS)
    }
    const raw = SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
    return expandClusterToFit(raw, hubDrift, SPORT_HUB_EFFECTIVE_RADIUS_PX, [], MICRO_DRIFT_EXTENTS)
  }, [expandedSportId, expandedSport, categoryOffsets])

  /** Selected theme stays on the sport ring; moments orbit from here (no re-centering). */
  const selectedThemeRingAnchor = useMemo((): Point | null => {
    if (!expandedSport || !expandedCategoryId || !expandedClusterAnchor) return null
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    if (catIdx < 0) return null
    const off = categoryOffsets[catIdx] ?? { x: 0, y: 0 }
    return { x: expandedClusterAnchor.x + off.x, y: expandedClusterAnchor.y + off.y }
  }, [expandedSport, expandedCategoryId, expandedClusterAnchor, categoryOffsets])

  /**
   * Perimeter sport positions — use the hub + theme ring footprint only (not moment satellites).
   * Otherwise the obstacle set grows when a moment package opens and dock positions re-solve,
   * which makes other sports jump around on every package change.
   */
  const dockedSportAnchorsResolved = useMemo(() => {
    if (!expandedSportId || !expandedSport || !expandedClusterAnchor) return null
    const obs = buildExpandedClusterObstacleCircles(
      expandedSport,
      null,
      expandedClusterAnchor,
      categoryOffsets,
      null,
      [],
      []
    )
    if (obs.length === 0) return null
    return computeDockedSportAnchorsAvoidingCluster(sportsData, expandedSportId, PERIPHERAL_ANCHORS, obs)
  }, [expandedSportId, expandedSport, expandedClusterAnchor, categoryOffsets])

  const experienceRef = useRef<HTMLDivElement>(null)

  const handleEngage = useCallback(() => {
    setHasEngaged(true)
    setExpandedSportId(null)
    setExpandedCategoryId(null)
    setSelectedMomentId(null)
  }, [])

  const handleSportTap = useCallback((sportId: string) => {
    setExpandedSportId(sportId)
    setExpandedCategoryId(null)
    setSelectedMomentId(null)
  }, [])

  const handleCategoryTap = useCallback((categoryId: string) => {
    setExpandedCategoryId(categoryId)
    setSelectedMomentId(null)
  }, [])

  const collapseExpandedState = useCallback(() => {
    if (selectedMomentId) {
      setSelectedMomentId(null)
      return
    }
    if (expandedCategoryId) {
      setExpandedCategoryId(null)
      return
    }
    setExpandedSportId(null)
  }, [expandedCategoryId, selectedMomentId])

  /** Tap empty stage (not a bubble): return to floating sport pickers in one step. */
  const collapseToSportSelection = useCallback(() => {
    setExpandedSportId(null)
    setExpandedCategoryId(null)
    setSelectedMomentId(null)
  }, [])

  const showStageBackdropDismiss =
    hasEngaged &&
    (expandedSportId !== null || expandedCategoryId !== null || selectedMomentId !== null)

  return (
    <OrientationGuard>
      <Stage>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0000dc',
            overflow: 'hidden',
          }}
        >
          <KioskControls onReset={resetToIdle} />

          <AnimatePresence mode="wait">
            {!hasEngaged ? (
              <IdleAttract key="idle-attract" onEngage={handleEngage} />
            ) : (
              <motion.div
                key="single-screen-experience"
                ref={experienceRef}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <ExperienceBackground />

                {showStageBackdropDismiss && (
                  <div
                    role="presentation"
                    aria-hidden
                    onPointerDown={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return
                      collapseToSportSelection()
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 24,
                      touchAction: 'manipulation',
                    }}
                  />
                )}

                {/* Subtle title — bottom-right safe zone (bubbles use center / perimeter; z below bubbles). */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 48,
                    zIndex: 25,
                    pointerEvents: 'none',
                    textAlign: 'right',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontWeight: 600,
                      fontSize: 30,
                      letterSpacing: '0.04em',
                      color: '#ffffff',
                      textShadow: '0 1px 18px rgba(0,0,40,0.55)',
                    }}
                  >
                    Genius Moments Explorer
                  </span>
                </div>

                <OrbitConnectorSvg
                  expandedSport={expandedSport}
                  expandedClusterAnchor={expandedClusterAnchor}
                  categoryOffsets={categoryOffsets}
                  expandedCategoryId={expandedCategoryId}
                  momentItems={momentItems}
                  selectedThemeRingAnchor={selectedThemeRingAnchor}
                  momentOffsets={momentOffsets}
                />

                <AnimatePresence>
                  {expandedSport && (
                    <motion.button
                      type="button"
                      onClick={collapseExpandedState}
                      onTouchStart={collapseExpandedState}
                      initial={{ opacity: 0, y: -18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: 'absolute',
                        right: 168,
                        top: 51,
                        zIndex: 45,
                        height: 58,
                        padding: '0 24px',
                        borderRadius: 29,
                        border: '1px solid rgba(255,255,255,0.28)',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: 24,
                        letterSpacing: '0.01em',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </motion.button>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {sportsData.map((sport, index) => {
                    const isExpandedSport = expandedSportId === sport.id
                    /** Only non-expanded sports dock on the perimeter — active sport stays at cluster anchor. */
                    const isSportPerimeterDock = expandedSportId !== null && !isExpandedSport
                    const useExpandedHubAnchor = isExpandedSport && expandedClusterAnchor
                    /** Halo / pulse only for the active hub — docked perimeter sports stay visually quiet + transparent. */
                    const sportIsPrimaryAction =
                      !isSportPerimeterDock &&
                      (!isExpandedSport ||
                        (isExpandedSport && expandedCategoryId === null && sport.categories.length === 0))
                    const drift = isSportPerimeterDock ? getMicroDrift(index) : getDriftAnimation(index)
                    const isFloatingPickSport = expandedSportId === null
                    const positionDrift = isFloatingPickSport ? drift : { x: [0], y: [0], duration: 1 }
                    const anchor = useExpandedHubAnchor
                      ? expandedClusterAnchor
                      : expandedSportId
                        ? dockedSportAnchorsResolved?.[sport.id] ??
                          clampDockPeripheralAnchor(PERIPHERAL_ANCHORS[sport.id] ?? STAGE_CENTER)
                        : clampIdleSportAnchor(SPORT_ANCHORS[sport.id] ?? STAGE_CENTER, index)

                    const sportStackZIndex = isSportPerimeterDock
                      ? Z_INDEX_DOCKED_SPORT
                      : isExpandedSport
                        ? sport.categories.length > 0
                          ? 43
                          : 40
                        : expandedSportId
                          ? 28
                          : 32 - index

                    return (
                      <motion.div
                        key={`drift-${sport.id}`}
                        style={{ position: 'absolute', zIndex: sportStackZIndex }}
                        initial={{ left: anchor.x, top: anchor.y }}
                        animate={{ left: anchor.x, top: anchor.y }}
                        transition={{
                          left: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                          top: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                        }}
                      >
                        <motion.div
                          initial={{
                            x: isFloatingPickSport ? drift.x[1] * 0.5 : 0,
                            y: isFloatingPickSport ? drift.y[1] * 0.5 : 0,
                          }}
                          animate={{ x: positionDrift.x, y: positionDrift.y }}
                          transition={{
                            duration: isFloatingPickSport
                              ? isExpandedSport && expandedCategoryId === null
                                ? drift.duration * 4
                                : drift.duration
                              : 0.4,
                            repeat: isFloatingPickSport ? Infinity : 0,
                            repeatType: 'loop',
                            ease: 'easeInOut',
                          }}
                        >
                          <motion.div
                            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                            style={{
                              position: 'relative',
                            }}
                            initial={{ opacity: 0, scale: 0.86, x: 0, y: 0 }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              x: 0,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.8, y: 30 }}
                            transition={{
                              opacity: { duration: 0.45, ease: 'easeOut' },
                              scale: {
                                duration: 0.55,
                                ease: [0.22, 1, 0.36, 1],
                              },
                              x: {
                                type: 'tween',
                                duration: SPORT_EXPAND_DURATION_S,
                                ease: [0.22, 0.94, 0.36, 1],
                              },
                              y: {
                                type: 'tween',
                                duration: SPORT_EXPAND_DURATION_S,
                                ease: [0.22, 0.94, 0.36, 1],
                              },
                            }}
                          >
                            <SportBubble
                              label={sport.name}
                              diameter={
                                isExpandedSport
                                  ? sport.categories.length > 0
                                    ? SPORT_PARENT_WHEN_THEME_RING_DIAMETER
                                    : EXPANDED_HUB_DIAMETER
                                  : isSportPerimeterDock
                                    ? DOCKED_SPORT_DIAMETER
                                    : 300
                              }
                              gradient={isExpandedSport ? SPORT_PARENT_GRADIENT : sport.gradient}
                              glow={isExpandedSport ? SPORT_PARENT_GLOW : sport.glow}
                              pulseAlternate={index % 2 === 1 ? 1 : 0}
                              isHub={
                                isExpandedSport &&
                                expandedCategoryId === null &&
                                sport.categories.length === 0
                              }
                              isPrimaryAction={sportIsPrimaryAction}
                              isDimmed={isSportPerimeterDock}
                              compactLabel={isSportPerimeterDock}
                              onTap={() => handleSportTap(sport.id)}
                            />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {expandedSport &&
                    expandedSport.categories.map((category, index) => {
                      const offset = categoryOffsets[index] ?? { x: 0, y: 0 }
                      const sportAnchor = expandedClusterAnchor ?? SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
                      const isExpandedCategory = expandedCategoryId === category.id
                      const ringLeft = sportAnchor.x + offset.x
                      const ringTop = sportAnchor.y + offset.y
                      const anchorLeft = ringLeft
                      const anchorTop = ringTop
                      /** Themes pulse when no theme is selected; a solo theme with no moments is the leaf target. */
                      const categoryIsPrimaryAction =
                        expandedCategoryId === null ||
                        (isExpandedCategory && momentItems.length === 0)
                      const bubbleDiameter = momentDiameterForIndex(THEME_PACKAGE_RING_BASE, index)
                      const orbitStartDelay = MOMENTS_START_AFTER_S + index * 0.045

                      return (
                        <motion.div
                          key={`orbit-drift-category-${category.id}`}
                          style={{
                            position: 'absolute',
                            zIndex: expandedCategoryId === null ? 42 : 34,
                          }}
                          initial={{ left: ringLeft, top: ringTop }}
                          animate={{ left: anchorLeft, top: anchorTop }}
                          transition={{
                            left: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                            top: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                          }}
                        >
                          <motion.div
                            animate={{ x: 0, y: 0 }}
                            transition={{
                              duration: 0.25,
                              repeat: 0,
                              ease: 'easeInOut',
                            }}
                            style={{ position: 'relative' }}
                          >
                          <motion.div
                            key={`category-${category.id}`}
                            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                            style={{
                              position: 'relative',
                            }}
                            initial={{
                              opacity: 0,
                              x: -offset.x,
                              y: -offset.y,
                              scale: 0.2,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              x: 0,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              x: -offset.x * 0.28,
                              y: -offset.y * 0.28,
                              scale: 0.35,
                              transition: { delay: 0, duration: 0.22, ease: 'easeIn' },
                            }}
                            transition={{
                              opacity: {
                                duration: 0.45,
                                delay: orbitStartDelay,
                                ease: [0.22, 0.94, 0.36, 1],
                              },
                              x: {
                                type: 'spring',
                                stiffness: 175,
                                damping: 20,
                                mass: 0.85,
                                delay: orbitStartDelay,
                              },
                              y: {
                                type: 'spring',
                                stiffness: 175,
                                damping: 20,
                                mass: 0.85,
                                delay: orbitStartDelay,
                              },
                            }}
                          >
                            <MomentBubble
                              label={category.name}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
                              layer="category"
                              variant={isExpandedCategory ? 'parent' : 'selectable'}
                              isDimmed={false}
                              isPeripheral={expandedCategoryId !== null && !isExpandedCategory}
                              isPrimaryAction={categoryIsPrimaryAction}
                              disableAmbientMotion
                              onTap={() => handleCategoryTap(category.id)}
                            />
                          </motion.div>
                        </motion.div>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {expandedSport &&
                    expandedCategoryId &&
                    selectedThemeRingAnchor &&
                    momentItems.map((item, index) => {
                      const baseDiameter =
                        momentItems.length > 10 ? MOMENT_RING_DIAMETER_BASE_MANY : MOMENT_RING_DIAMETER_BASE_FEW
                      const bubbleDiameter = momentDiameterForIndex(baseDiameter, index)
                      const offset = momentOffsets[index] ?? { x: 0, y: 0 }
                      const orbitStartDelay = MOMENTS_START_AFTER_S + index * 0.045

                      return (
                        <motion.div
                          key={`${expandedCategoryId}-orbit-moment-${item.id}`}
                          style={{
                            position: 'absolute',
                            left: selectedThemeRingAnchor.x + offset.x,
                            top: selectedThemeRingAnchor.y + offset.y,
                            zIndex: 34,
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          exit={{
                            opacity: 0,
                            transition: { duration: MOMENT_PACKAGE_EXIT_FADE_S, ease: 'easeIn' },
                          }}
                          transition={{
                            opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: orbitStartDelay },
                            x: { duration: 0.25, repeat: 0, ease: 'easeInOut' },
                            y: { duration: 0.25, repeat: 0, ease: 'easeInOut' },
                          }}
                        >
                          <motion.div
                            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                            style={{
                              position: 'relative',
                            }}
                          >
                            <MomentBubble
                              label={item.label}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
                              layer="moment"
                              isPrimaryAction
                              disableAmbientMotion
                              onTap={() => setSelectedMomentId(item.id)}
                            />
                          </motion.div>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedMoment && (
                    <MomentDetailPanel
                      moment={selectedMoment}
                      onClose={() => setSelectedMomentId(null)}
                      onBackdropDismiss={collapseToSportSelection}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Stage>
    </OrientationGuard>
  )
}
