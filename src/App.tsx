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
const SPORT_PAIR_GAP = 420
/** Vertical offset so bubbles sit below the headline */
const SPORT_BUBBLES_Y = STAGE_CENTER.y + 24
const SPORT_ANCHORS: Record<string, Point> = {
  nfl: { x: STAGE_CENTER.x - SPORT_PAIR_GAP / 2, y: SPORT_BUBBLES_Y },
  'march-madness': { x: STAGE_CENTER.x + SPORT_PAIR_GAP / 2, y: SPORT_BUBBLES_Y },
}

const EXPANDED_SPORT_ANCHOR: Point = { ...STAGE_CENTER }
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
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const engagedRef = useRef(hasEngaged)
  engagedRef.current = hasEngaged

  const resetToIdle = useCallback(() => {
    setHasEngaged(false)
    setExpandedSportId(null)
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
    () => expandedSport?.moments.find((moment) => moment.id === selectedMomentId) ?? null,
    [expandedSport, selectedMomentId]
  )

  const momentOffsets = useMemo(() => {
    if (!expandedSport) return []
    const base = expandedSport.moments.length > 10 ? 182 : 204
    const diameters = expandedSport.moments.map((_, i) => momentDiameterForIndex(base, i))
    return createMomentOffsets(expandedSport.moments.length, diameters)
  }, [expandedSport])

  const handleEngage = useCallback(() => {
    setHasEngaged(true)
    setExpandedSportId(null)
    setSelectedMomentId(null)
  }, [])

  const handleSportTap = useCallback((sportId: string) => {
    setExpandedSportId(sportId)
    setSelectedMomentId(null)
  }, [])

  const collapseExpandedState = useCallback(() => {
    setExpandedSportId(null)
    setSelectedMomentId(null)
  }, [])

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
                    const isHidden = expandedSportId !== null && !isExpandedSport
                    const anchor = SPORT_ANCHORS[sport.id] ?? { x: 960, y: 540 }
                    const toCenterX = EXPANDED_SPORT_ANCHOR.x - anchor.x
                    const toCenterY = EXPANDED_SPORT_ANCHOR.y - anchor.y

                    return !isHidden ? (
                      <motion.div
                        key={sport.id}
                        transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                        style={{
                          position: 'absolute',
                          left: anchor.x,
                          top: anchor.y,
                          zIndex: isExpandedSport ? 40 : 32 - index,
                        }}
                        initial={{ opacity: 0, scale: 0.86, x: 0, y: 0 }}
                        animate={{
                          opacity: 1,
                          scale: isExpandedSport ? EXPANDED_HUB_SCALE : 1,
                          x: isExpandedSport ? toCenterX : 0,
                          y: isExpandedSport ? toCenterY : 0,
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
                    ) : null
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {expandedSport &&
                    expandedSport.moments.map((moment, index) => {
                      const baseDiameter = expandedSport.moments.length > 10 ? 182 : 204
                      const bubbleDiameter = momentDiameterForIndex(baseDiameter, index)
                      const offset = momentOffsets[index] ?? { x: 0, y: 0 }
                      const orbitStartDelay = MOMENTS_START_AFTER_S + index * 0.045
                      return (
                        <motion.div
                          key={moment.id}
                          transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
                          style={{
                            position: 'absolute',
                            left: EXPANDED_SPORT_ANCHOR.x + offset.x,
                            top: EXPANDED_SPORT_ANCHOR.y + offset.y,
                            zIndex: 34,
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
                            label={moment.name}
                            diameter={bubbleDiameter}
                            phase={(index % 5) * 0.6 + 0.5}
                            onTap={() => setSelectedMomentId(moment.id)}
                          />
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
