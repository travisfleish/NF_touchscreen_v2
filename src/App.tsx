import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IdleAttract from './components/IdleAttract'
import KioskControls from './components/KioskControls'
import Stage from './components/Stage'
import { STAGE_H, STAGE_W } from './components/Stage'
import OrientationGuard from './components/OrientationGuard'
import AnimatedBarsBackground from './components/AnimatedBarsBackground'
import SportBubble from './components/SportBubble'
import MomentBubble from './components/MomentBubble'
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
  nwsl: { x: 1680, y: 820 },
}

/** Smaller sport hub on the perimeter when another sport is expanded. */
const DOCKED_SPORT_DIAMETER = 148
/** Max visual radius of docked hub (pulse scale 1.09 on SportBubble). */
const DOCKED_HUB_RADIUS_PX = (DOCKED_SPORT_DIAMETER / 2) * 1.09 + STAGE_MARGIN

/**
 * Perimeter slots for category bubbles (step 2: pick category) and non-selected
 * categories during moments — same “easel” idea as docked sports.
 */
const CATEGORY_DOCK_SLOTS: Point[] = [
  { x: 220, y: 300 },
  { x: 960, y: 200 },
  { x: 1720, y: 300 },
  { x: 200, y: 540 },
  { x: 1720, y: 540 },
  { x: 240, y: 820 },
  { x: 960, y: 920 },
  { x: 1680, y: 820 },
]

/** Smaller category bubble when docked on the perimeter. */
const CATEGORY_DOCK_DIAMETER = 148

function categoryDockSlotForIndex(index: number, count: number): Point {
  if (count <= 0) return STAGE_CENTER
  if (count === 1) return CATEGORY_DOCK_SLOTS[1]
  const n = CATEGORY_DOCK_SLOTS.length
  const step = Math.max(1, Math.floor(n / count))
  return CATEGORY_DOCK_SLOTS[(index * step) % n]
}

/**
 * When moments are visible, pick perimeter dock position(s) for non-selected categories so they
 * stay outside the moment ring (fixed slots like top-center can sit on top of a moment).
 */
function computeOptimalCategoryDocksForMoments(
  easelCenter: Point,
  momentOffsets: Point[],
  momentDiameters: number[],
  dockCount: number
): Point[] {
  if (dockCount <= 0) return []
  const dockR = orbitSatelliteEffectiveRadiusPx(CATEGORY_DOCK_DIAMETER)
  const momentCircles = momentOffsets.map((o, i) => ({
    x: easelCenter.x + o.x,
    y: easelCenter.y + o.y,
    r: orbitSatelliteEffectiveRadiusPx(momentDiameters[i]),
  }))

  const minClearanceToMoments = (dock: Point): number => {
    let m = Infinity
    for (const mc of momentCircles) {
      const d = Math.hypot(dock.x - mc.x, dock.y - mc.y) - dockR - mc.r
      m = Math.min(m, d)
    }
    return m
  }

  const minClearanceToPlaced = (dock: Point, placed: Point[]): number => {
    let m = Infinity
    for (const p of placed) {
      const d = Math.hypot(dock.x - p.x, dock.y - p.y) - 2 * dockR - ORBIT_GAP_PX
      m = Math.min(m, d)
    }
    return m
  }

  const scoreSlot = (dock: Point, placed: Point[]): number =>
    Math.min(minClearanceToMoments(dock), minClearanceToPlaced(dock, placed))

  if (dockCount === 1) {
    let best = CATEGORY_DOCK_SLOTS[0]
    let bestScore = scoreSlot(best, [])
    for (const s of CATEGORY_DOCK_SLOTS) {
      const sc = scoreSlot(s, [])
      if (sc > bestScore) {
        bestScore = sc
        best = s
      }
    }
    return [best]
  }

  const available = [...CATEGORY_DOCK_SLOTS]
  const placed: Point[] = []
  const result: Point[] = []

  for (let k = 0; k < dockCount; k++) {
    let bestIdx = -1
    let bestScore = -Infinity
    for (let i = 0; i < available.length; i++) {
      const sc = scoreSlot(available[i], placed)
      if (sc > bestScore) {
        bestScore = sc
        bestIdx = i
      }
    }
    if (bestIdx < 0) break
    const chosen = available.splice(bestIdx, 1)[0]
    placed.push(chosen)
    result.push(chosen)
  }
  return result
}

function clampCategoryDockAnchor(raw: Point, driftIndex: number): Point {
  const r = orbitSatelliteEffectiveRadiusPx(CATEGORY_DOCK_DIAMETER)
  return expandClusterToFit(raw, getMicroDrift(driftIndex), r, [], MICRO_DRIFT_EXTENTS)
}

/** Sport hub diameter while expanded when there is no theme ring (solo sport). */
const EXPANDED_HUB_DIAMETER = 320
/**
 * With a theme ring visible, the next tap is a theme — sport shrinks to “parent” scale and
 * theme nodes take the large hub size (swap vs idle pick-sport flow).
 */
const SPORT_PARENT_WHEN_THEME_RING_DIAMETER = 224
const THEME_ORBIT_BASE_DIAMETER = EXPANDED_HUB_DIAMETER
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
const IDLE_EVENTS = ['touchstart', 'mousedown', 'keydown'] as const

/** Satellite: hover 1.02 + small cushion for micro-orbit drift so layouts don’t touch. */
function orbitSatelliteEffectiveRadiusPx(diameter: number): number {
  const microPad = 8
  return (diameter / 2) * 1.02 + STAGE_MARGIN * 0.5 + microPad
}

/** Selected category hub when showing moments (parent scale 0.78, hover 1.02). */
function categoryHubEffectiveRadiusForMomentsPx(diameter: number): number {
  return (diameter / 2) * 0.78 * 1.02 + STAGE_MARGIN * 0.5
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
  if (Math.hypot(x2 - x1, y2 - y1) < 6) return null
  return { x1, y1, x2, y2 }
}

function circleFromElement(el: HTMLElement | null, containerRect: DOMRect): (Point & { r: number }) | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2 - containerRect.left
  const cy = r.top + r.height / 2 - containerRect.top
  const rad = Math.min(r.width, r.height) / 2
  return { x: cx, y: cy, r: rad }
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

function clampDockPeripheralAnchor(raw: Point, driftIndex: number): Point {
  return expandClusterToFit(raw, getDriftAnimation(driftIndex), DOCKED_HUB_RADIUS_PX, [], MICRO_DRIFT_EXTENTS)
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
    const base = momentItems.length > 10 ? 182 : 204
    const diameters = momentItems.map((_, i) => momentDiameterForIndex(base, i))
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    const catD = momentDiameterForIndex(224, catIdx >= 0 ? catIdx : 0)
    const parentR = categoryHubEffectiveRadiusForMomentsPx(catD)
    return createPackedOrbitOffsets(momentItems.length, diameters, parentR, ORBIT_GAP_PX)
  }, [momentItems, expandedSport, expandedCategoryId])

  /** When moments are shown, center the active category + its ring in the open stage area (easel). */
  const momentsEaselAnchor = useMemo(() => {
    if (!expandedSport || !expandedCategoryId || !momentItems.length) return null
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    if (catIdx < 0) return null
    const base = momentItems.length > 10 ? 182 : 204
    const diameters = momentItems.map((_, i) => momentDiameterForIndex(base, i))
    const catD = momentDiameterForIndex(224, catIdx)
    const parentR = categoryHubEffectiveRadiusForMomentsPx(catD)
    const hubDrift = getMicroDrift(catIdx)
    const orbitPoints = momentItems.map((_, i) => ({
      offset: momentOffsets[i] ?? { x: 0, y: 0 },
      radius: orbitSatelliteEffectiveRadiusPx(diameters[i]),
    }))
    return expandClusterToFit(STAGE_CENTER, hubDrift, parentR, orbitPoints, MICRO_DRIFT_EXTENTS)
  }, [expandedSport, expandedCategoryId, momentItems, momentOffsets])

  /** Selected category with no moments — center it alone (easel). */
  const categorySoloEaselAnchor = useMemo(() => {
    if (!expandedSport || !expandedCategoryId || momentItems.length > 0) return null
    const catIdx = expandedSport.categories.findIndex((c) => c.id === expandedCategoryId)
    if (catIdx < 0) return null
    const catD = momentDiameterForIndex(224, catIdx)
    const parentR = orbitSatelliteEffectiveRadiusPx(catD)
    const hubDrift = getMicroDrift(catIdx)
    return expandClusterToFit(STAGE_CENTER, hubDrift, parentR, [], MICRO_DRIFT_EXTENTS)
  }, [expandedSport, expandedCategoryId, momentItems.length])

  /** Non-selected category dock positions while moments are open — avoid overlapping the moment ring. */
  const categoryDockAnchorsWhenMoments = useMemo(() => {
    if (!expandedSport || !expandedCategoryId || !momentsEaselAnchor || momentItems.length === 0) return null
    const nonSelected = expandedSport.categories.filter((c) => c.id !== expandedCategoryId)
    const base = momentItems.length > 10 ? 182 : 204
    const momentDiameters = momentItems.map((_, i) => momentDiameterForIndex(base, i))
    const raw = computeOptimalCategoryDocksForMoments(
      momentsEaselAnchor,
      momentOffsets,
      momentDiameters,
      nonSelected.length
    )
    return nonSelected.map((_, i) => clampCategoryDockAnchor(raw[i] ?? CATEGORY_DOCK_SLOTS[i % CATEGORY_DOCK_SLOTS.length], i))
  }, [
    expandedSport,
    expandedCategoryId,
    momentItems,
    momentsEaselAnchor,
    momentOffsets,
  ])

  const categoryOffsets = useMemo(() => {
    if (!expandedSport) return []
    const base = THEME_ORBIT_BASE_DIAMETER
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
    const sportIndex = sportsData.findIndex((s) => s.id === expandedSportId)
    if (sportIndex < 0) return null
    const hubDrift = getDriftAnimation(sportIndex)
    /** Step 2 (no category): pack hub + category ring. Step 3: hub centered — others dock on perimeter. */
    if (!expandedCategoryId && expandedSport.categories.length > 0) {
      const raw = SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
      const orbitPoints = expandedSport.categories.map((_, i) => {
        const d = momentDiameterForIndex(THEME_ORBIT_BASE_DIAMETER, i)
        return {
          offset: categoryOffsets[i] ?? { x: 0, y: 0 },
          radius: orbitSatelliteEffectiveRadiusPx(d),
        }
      })
      return expandClusterToFit(raw, hubDrift, SPORT_HUB_EFFECTIVE_RADIUS_THEME_RING_PX, orbitPoints, MICRO_DRIFT_EXTENTS)
    }
    const raw =
      expandedSport.categories.length > 0 ? STAGE_CENTER : SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
    return expandClusterToFit(raw, hubDrift, SPORT_HUB_EFFECTIVE_RADIUS_PX, [], MICRO_DRIFT_EXTENTS)
  }, [expandedSportId, expandedSport, expandedCategoryId, categoryOffsets])

  const selectedCategoryAnchor = useMemo(() => {
    if (!expandedSport || !expandedCategoryId || !expandedClusterAnchor) return null
    const expandedCategoryIndex = expandedSport.categories.findIndex(
      (category) => category.id === expandedCategoryId
    )
    if (expandedCategoryIndex < 0) return null
    if (momentItems.length > 0 && momentsEaselAnchor) {
      return momentsEaselAnchor
    }
    if (momentItems.length === 0 && categorySoloEaselAnchor) {
      return categorySoloEaselAnchor
    }
    return null
  }, [expandedCategoryId, expandedSport, expandedClusterAnchor, momentItems.length, momentsEaselAnchor, categorySoloEaselAnchor])

  const experienceRef = useRef<HTMLDivElement>(null)
  const connectorsSvgRef = useRef<SVGSVGElement>(null)
  const hubRef = useRef<HTMLButtonElement | null>(null)
  const categoryBubbleRefs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedCategoryBubbleRef = useRef<HTMLButtonElement | null>(null)
  const momentBubbleRefs = useRef<(HTMLButtonElement | null)[]>([])
  const hubLineElsRef = useRef<Map<string, SVGLineElement>>(new Map())
  const momentLineElsRef = useRef<Map<string, SVGLineElement>>(new Map())

  useEffect(() => {
    if (!expandedCategoryId) selectedCategoryBubbleRef.current = null
  }, [expandedCategoryId])

  useLayoutEffect(() => {
    const container = experienceRef.current
    if (!container || !hasEngaged) return

    let raf = 0
    const tick = () => {
      const cr = container.getBoundingClientRect()
      connectorsSvgRef.current?.setAttribute('viewBox', `0 0 ${cr.width} ${cr.height}`)

      const hub = circleFromElement(hubRef.current, cr)

      if (expandedSport?.categories.length && hub) {
        expandedSport.categories.forEach((cat) => {
          const idx = expandedSport.categories.findIndex((c) => c.id === cat.id)
          const childEl = idx >= 0 ? categoryBubbleRefs.current[idx] : null
          const child = circleFromElement(childEl, cr)
          const lineEl = hubLineElsRef.current.get(cat.id)
          if (!lineEl) return
          if (!child) return
          const seg = trimmedSegmentBetweenCircles(hub, child)
          if (seg) {
            lineEl.setAttribute('x1', String(seg.x1))
            lineEl.setAttribute('y1', String(seg.y1))
            lineEl.setAttribute('x2', String(seg.x2))
            lineEl.setAttribute('y2', String(seg.y2))
          }
        })
      }

      if (expandedCategoryId && momentItems.length) {
        const parent = circleFromElement(selectedCategoryBubbleRef.current, cr)
        momentItems.forEach((item, mi) => {
          const child = circleFromElement(momentBubbleRefs.current[mi], cr)
          const lineEl = momentLineElsRef.current.get(item.id)
          if (!lineEl) return
          if (!parent || !child) return
          const seg = trimmedSegmentBetweenCircles(parent, child)
          if (seg) {
            lineEl.setAttribute('x1', String(seg.x1))
            lineEl.setAttribute('y1', String(seg.y1))
            lineEl.setAttribute('x2', String(seg.x2))
            lineEl.setAttribute('y2', String(seg.y2))
          }
        })
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hasEngaged, expandedSport, expandedSportId, expandedCategoryId, momentItems])

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

                <style>{`
                  .orbit-connector-line {
                    fill: none;
                    stroke-linecap: round;
                  }
                  .orbit-connector-line--hub {
                    stroke: rgba(200,215,255,0.42);
                    stroke-width: 2.25;
                  }
                  .orbit-connector-line--moment {
                    stroke: rgba(180,205,255,0.5);
                    stroke-width: 2;
                  }
                `}</style>

                <svg
                  ref={connectorsSvgRef}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 33,
                    overflow: 'visible',
                  }}
                >
                  {expandedSport &&
                    expandedSport.categories.map((cat, index) => {
                      const delayS = MOMENTS_START_AFTER_S + index * 0.045
                      return (
                        <motion.line
                          key={`hub-conn-${cat.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 175,
                            damping: 20,
                            mass: 0.85,
                            delay: delayS,
                          }}
                          ref={(el) => {
                            if (el) hubLineElsRef.current.set(cat.id, el)
                            else hubLineElsRef.current.delete(cat.id)
                          }}
                          className="orbit-connector-line orbit-connector-line--hub"
                        />
                      )
                    })}
                  {expandedSport &&
                    expandedCategoryId &&
                    momentItems.map((item, index) => {
                      const delayS = MOMENTS_START_AFTER_S + index * 0.045
                      return (
                        <motion.line
                          key={`moment-conn-${item.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 175,
                            damping: 20,
                            mass: 0.85,
                            delay: delayS,
                          }}
                          ref={(el) => {
                            if (el) momentLineElsRef.current.set(item.id, el)
                            else momentLineElsRef.current.delete(item.id)
                          }}
                          className="orbit-connector-line orbit-connector-line--moment"
                        />
                      )
                    })}
                </svg>

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
                    /** Dock on perimeter: other sports, or active sport once a category is chosen. */
                    const isSportPerimeterDock =
                      expandedSportId !== null &&
                      (!isExpandedSport || expandedCategoryId !== null)
                    const isHubCentered = isExpandedSport && expandedClusterAnchor && expandedCategoryId === null
                    /** Halo targets the deepest visible tier: sports on the grid, or an expanded sport with no theme children. */
                    const sportIsPrimaryAction =
                      !isExpandedSport ||
                      (isExpandedSport && expandedCategoryId === null && sport.categories.length === 0)
                    const drift = isSportPerimeterDock ? getMicroDrift(index) : getDriftAnimation(index)
                    const anchor = isHubCentered
                      ? expandedClusterAnchor
                      : expandedSportId
                        ? clampDockPeripheralAnchor(PERIPHERAL_ANCHORS[sport.id] ?? STAGE_CENTER, index)
                        : clampIdleSportAnchor(SPORT_ANCHORS[sport.id] ?? STAGE_CENTER, index)

                    return (
                      <motion.div
                        key={`drift-${sport.id}`}
                        style={{ position: 'absolute' }}
                        initial={{ left: anchor.x, top: anchor.y }}
                        animate={{ left: anchor.x, top: anchor.y }}
                        transition={{
                          left: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                          top: { duration: SPORT_EXPAND_DURATION_S, ease: [0.22, 0.94, 0.36, 1] },
                        }}
                      >
                        <motion.div
                          initial={{ x: drift.x[1] * 0.5, y: drift.y[1] * 0.5 }}
                          animate={{ x: drift.x, y: drift.y }}
                          transition={{
                            duration:
                              isExpandedSport && expandedCategoryId === null
                                ? drift.duration * 4
                                : drift.duration,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'easeInOut',
                          }}
                        >
                          <motion.div
                            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                            style={{
                              position: 'relative',
                              zIndex:
                                isExpandedSport && expandedCategoryId === null
                                  ? sport.categories.length > 0
                                    ? 30
                                    : 40
                                  : expandedSportId
                                    ? 28
                                    : 32 - index,
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
                              ref={isExpandedSport ? hubRef : undefined}
                              label={sport.name}
                              diameter={
                                isExpandedSport && expandedCategoryId === null
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
                      const nonSelectedCategories = expandedCategoryId
                        ? expandedSport.categories.filter((c) => c.id !== expandedCategoryId)
                        : []
                      const dockSlotsCount = nonSelectedCategories.length
                      const dockOrderAmongNonSelected = expandedCategoryId
                        ? nonSelectedCategories.findIndex((c) => c.id === category.id)
                        : -1
                      const dockNonSelected =
                        expandedCategoryId !== null && !isExpandedCategory && dockOrderAmongNonSelected >= 0
                      const dockedAnchor = dockNonSelected
                        ? momentItems.length > 0 && categoryDockAnchorsWhenMoments
                          ? categoryDockAnchorsWhenMoments[dockOrderAmongNonSelected] ??
                            clampCategoryDockAnchor(
                              categoryDockSlotForIndex(
                                dockOrderAmongNonSelected,
                                Math.max(1, dockSlotsCount)
                              ),
                              index
                            )
                          : clampCategoryDockAnchor(
                              categoryDockSlotForIndex(
                                dockOrderAmongNonSelected,
                                Math.max(1, dockSlotsCount)
                              ),
                              index
                            )
                        : null
                      const isMomentsEasel =
                        isExpandedCategory && momentItems.length > 0 && momentsEaselAnchor !== null
                      const isSoloEasel =
                        isExpandedCategory && momentItems.length === 0 && categorySoloEaselAnchor !== null
                      const anchorLeft = isMomentsEasel
                        ? momentsEaselAnchor!.x
                        : isSoloEasel
                          ? categorySoloEaselAnchor!.x
                          : dockNonSelected && dockedAnchor
                            ? dockedAnchor.x
                            : ringLeft
                      const anchorTop = isMomentsEasel
                        ? momentsEaselAnchor!.y
                        : isSoloEasel
                          ? categorySoloEaselAnchor!.y
                          : dockNonSelected && dockedAnchor
                            ? dockedAnchor.y
                            : ringTop
                      const isCategoryDocked = dockNonSelected
                      /** Themes pulse when no theme is selected; a solo theme with no moments is the leaf target. */
                      const categoryIsPrimaryAction =
                        expandedCategoryId === null ||
                        (isExpandedCategory && momentItems.length === 0)
                      const bubbleDiameter = isCategoryDocked
                        ? CATEGORY_DOCK_DIAMETER
                        : momentDiameterForIndex(
                            expandedCategoryId === null ? THEME_ORBIT_BASE_DIAMETER : 224,
                            index
                          )
                      const microDrift = getMicroDrift(index)
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
                            animate={{ x: microDrift.x, y: microDrift.y }}
                            transition={{
                              duration: microDrift.duration,
                              repeat: Infinity,
                              repeatType: 'loop',
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
                              scale: isExpandedCategory && momentItems.length > 0 ? 0.78 : 1,
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
                              type: 'spring',
                              stiffness: 175,
                              damping: 20,
                              mass: 0.85,
                              delay: orbitStartDelay,
                            }}
                          >
                            <MomentBubble
                              ref={(el) => {
                                categoryBubbleRefs.current[index] = el
                                if (isExpandedCategory) selectedCategoryBubbleRef.current = el
                              }}
                              label={category.name}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
                              layer="category"
                              variant={isExpandedCategory ? 'parent' : 'selectable'}
                              isDimmed={false}
                              isPeripheral={expandedCategoryId !== null && !isExpandedCategory}
                              isPrimaryAction={categoryIsPrimaryAction}
                              onTap={() => handleCategoryTap(category.id)}
                            />
                          </motion.div>
                        </motion.div>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>

                <AnimatePresence>
                  {expandedSport &&
                    expandedCategoryId &&
                    selectedCategoryAnchor &&
                    momentItems.map((item, index) => {
                      const baseDiameter = momentItems.length > 10 ? 182 : 204
                      const bubbleDiameter = momentDiameterForIndex(baseDiameter, index)
                      const offset = momentOffsets[index] ?? { x: 0, y: 0 }
                      const microDrift = getMicroDrift(index)
                      const orbitStartDelay = MOMENTS_START_AFTER_S + index * 0.045

                      return (
                        <motion.div
                          key={`orbit-drift-moment-${item.id}`}
                          style={{
                            position: 'absolute',
                            left: selectedCategoryAnchor.x + offset.x,
                            top: selectedCategoryAnchor.y + offset.y,
                            zIndex: 34,
                          }}
                          animate={{ x: microDrift.x, y: microDrift.y }}
                          transition={{
                            duration: microDrift.duration,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'easeInOut',
                          }}
                        >
                          <motion.div
                            key={`moment-${item.id}`}
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
                            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                            exit={{
                              opacity: 0,
                              x: -offset.x * 0.28,
                              y: -offset.y * 0.28,
                              scale: 0.35,
                              transition: { delay: 0, duration: 0.22, ease: 'easeIn' },
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 175,
                              damping: 20,
                              mass: 0.85,
                              delay: orbitStartDelay,
                            }}
                          >
                            <MomentBubble
                              ref={(el) => {
                                momentBubbleRefs.current[index] = el
                              }}
                              label={item.label}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
                              layer="moment"
                              isPrimaryAction
                              onTap={() => setSelectedMomentId(item.id)}
                            />
                          </motion.div>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedMoment && <MomentDetailPanel moment={selectedMoment} onClose={() => setSelectedMomentId(null)} />}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Stage>
    </OrientationGuard>
  )
}
