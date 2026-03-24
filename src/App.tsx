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
import MomentDetailPanel from './components/MomentDetailPanel'
import { IDLE_TIMEOUT_MS } from './tokens'
import { sportsData, SportData } from './data/sportsData'

interface Point {
  x: number
  y: number
}

const STAGE_CENTER: Point = { x: STAGE_W / 2, y: STAGE_H / 2 }
const SPORT_ANCHORS: Record<string, Point> = {
  'march-madness': { x: 320, y: 280 },
  nfl: { x: 960, y: 200 },
  nba: { x: 1580, y: 310 },
  'world-cup': { x: 260, y: 750 },
  mlb: { x: 920, y: 860 },
  nwsl: { x: 1600, y: 720 },
}

/** Sport hub diameter while expanded (see SportBubble `diameter` when selected) */
const EXPANDED_HUB_DIAMETER = 320
/** Time for the sport bubble to ease into the center */
const SPORT_EXPAND_DURATION_S = 0.95
/** After centering, hub scales down before moments appear */
const SPORT_SHRINK_DURATION_S = 0.5
/** Final scale of the hub (relative to its base diameter) once moments are shown */
const EXPANDED_HUB_SCALE = 0.52
/**
 * Legacy polar radii (340 / 318 / 432) assumed a full-size expanded hub (~160px radius
 * for 320px diameter). The visible hub is EXPANDED_HUB_DIAMETER × EXPANDED_HUB_SCALE;
 * we preserve the same hub-edge→moment gaps by rebasing on the real hub radius.
 */
const ORBIT_REF_HUB_RADIUS = EXPANDED_HUB_DIAMETER / 2
const MOMENTS_ORBIT_DELAY_S = 0.12
/** Moments begin after move + shrink completes */
const MOMENTS_START_AFTER_S =
  SPORT_EXPAND_DURATION_S + SPORT_SHRINK_DURATION_S + MOMENTS_ORBIT_DELAY_S
const IDLE_EVENTS = ['touchstart', 'mousedown', 'keydown'] as const

/** Polar distance from hub center to each bubble center; `ringLegacy` matches single vs inner/outer ring layout constants. */
function orbitPolarRadiusForDiameter(momentDiameter: number, ringLegacy: number): number {
  const hubRadius = (EXPANDED_HUB_DIAMETER * EXPANDED_HUB_SCALE) / 2
  const momentRadius = momentDiameter / 2
  return hubRadius + (ringLegacy - ORBIT_REF_HUB_RADIUS - 102) + momentRadius
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

function createMomentOffsets(count: number, diameters: number[]): Point[] {
  if (count <= 0) return []

  if (count <= 8) {
    const radii = diameters.map((d) => orbitPolarRadiusForDiameter(d, 340))
    return createRingPointsWithRadii(count, radii)
  }

  const innerCount = Math.min(8, count)
  const outerCount = count - innerCount
  const innerStepDeg = 360 / innerCount
  /** Start outer ring halfway between inner slots so inner/outer pairs are not on the same ray (which caused overlaps when radii differed by less than one bubble diameter). */
  const outerAngleStartDeg = -92 + innerStepDeg / 2
  const innerRadii = diameters.slice(0, innerCount).map((d) => orbitPolarRadiusForDiameter(d, 318))
  const outerRadii = diameters.slice(innerCount).map((d) => orbitPolarRadiusForDiameter(d, 432))
  const inner = createRingPointsWithRadii(innerCount, innerRadii, -92)
  const outer = createRingPointsWithRadii(outerCount, outerRadii, outerAngleStartDeg)
  return [...inner, ...outer]
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
    if (!momentItems.length) return []
    const base = momentItems.length > 10 ? 182 : 204
    const diameters = momentItems.map((_, i) => momentDiameterForIndex(base, i))
    return createMomentOffsets(momentItems.length, diameters)
  }, [momentItems])

  const categoryOffsets = useMemo(() => {
    if (!expandedSport) return []
    const base = 224
    const diameters = expandedSport.categories.map((_, index) => momentDiameterForIndex(base, index))
    return createMomentOffsets(expandedSport.categories.length, diameters)
  }, [expandedSport])

  const selectedCategoryAnchor = useMemo(() => {
    if (!expandedSport || !expandedCategoryId) return null
    const expandedCategoryIndex = expandedSport.categories.findIndex(
      (category) => category.id === expandedCategoryId
    )
    if (expandedCategoryIndex < 0) return null
    const sportAnchor = SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
    const categoryOffset = categoryOffsets[expandedCategoryIndex] ?? { x: 0, y: 0 }
    return {
      x: sportAnchor.x + categoryOffset.x,
      y: sportAnchor.y + categoryOffset.y,
    }
  }, [categoryOffsets, expandedCategoryId, expandedSport])

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
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <ExperienceBackground />

                <AnimatePresence>
                  {!expandedSportId && (
                    <motion.h1
                      key="premium-moments-title"
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 124,
                        zIndex: 36,
                        margin: 0,
                        textAlign: 'center',
                        fontFamily: 'var(--font-header)',
                        fontWeight: 600,
                        fontSize: 62,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: '#ffffff',
                      }}
                    >
                      Premium Moments Packages
                    </motion.h1>
                  )}
                </AnimatePresence>

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
                    const drift = getDriftAnimation(index)
                    const anchor = SPORT_ANCHORS[sport.id] ?? STAGE_CENTER

                    return (
                      <motion.div
                        key={`drift-${sport.id}`}
                        style={{
                          position: 'absolute',
                          left: anchor.x,
                          top: anchor.y,
                        }}
                        initial={{ x: drift.x[1] * 0.5, y: drift.y[1] * 0.5 }}
                        animate={{ x: drift.x, y: drift.y }}
                        transition={{
                          duration: isExpandedSport ? drift.duration * 4 : drift.duration,
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: 'easeInOut',
                        }}
                      >
                        <motion.div
                          transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                          style={{
                            position: 'relative',
                            zIndex: isExpandedSport ? 40 : 32 - index,
                          }}
                          initial={{ opacity: 0, scale: 0.86, x: 0, y: 0 }}
                          animate={{
                            opacity: isExpandedSport ? 1 : expandedSportId ? 0.38 : 1,
                            scale: isExpandedSport ? 0.78 : 1,
                            x: 0,
                            y: 0,
                          }}
                          exit={{ opacity: 0, scale: 0.8, y: 30 }}
                          transition={{
                            opacity: { duration: 0.45, ease: 'easeOut' },
                            scale: isExpandedSport
                              ? {
                                  delay: SPORT_EXPAND_DURATION_S,
                                  duration: SPORT_SHRINK_DURATION_S,
                                  ease: [0.2, 0.9, 0.3, 1],
                                }
                              : {
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
                            diameter={isExpandedSport ? EXPANDED_HUB_DIAMETER : 300}
                            imageUrl={sport.bubbleImage}
                            gradient={sport.gradient}
                            glow={sport.glow}
                            pulseAlternate={index % 2 === 1 ? 1 : 0}
                            onTap={() => handleSportTap(sport.id)}
                          />
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {expandedSport &&
                    expandedSport.categories.map((category, index) => {
                      const bubbleDiameter = momentDiameterForIndex(224, index)
                      const offset = categoryOffsets[index] ?? { x: 0, y: 0 }
                      const sportAnchor = SPORT_ANCHORS[expandedSport.id] ?? STAGE_CENTER
                      const isExpandedCategory = expandedCategoryId === category.id
                      const microDrift = getMicroDrift(index)
                      const orbitStartDelay = MOMENTS_START_AFTER_S + index * 0.045

                      return (
                        <motion.div
                          key={`orbit-drift-category-${category.id}`}
                          style={{
                            position: 'absolute',
                            left: sportAnchor.x + offset.x,
                            top: sportAnchor.y + offset.y,
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
                              opacity: expandedCategoryId ? (isExpandedCategory ? 1 : 0.38) : 1,
                              scale: isExpandedCategory ? 0.78 : 1,
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
                              label={category.name}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
                              onTap={() => handleCategoryTap(category.id)}
                            />
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
                              label={item.label}
                              diameter={bubbleDiameter}
                              phase={(index % 5) * 0.6 + 0.5}
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
