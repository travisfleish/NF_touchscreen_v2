import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const VIDEO_SOURCES = ['/soccer-1.mp4', '/soccer-2.mp4', '/soccer-3.mp4']
const TARGET_COUNT = 3
/** Delay between each box appearing during initial fill (one by one) */
const FILL_INTERVAL_MS = 500
/** Interval between replacements — each video plays at least 5 seconds before cycling out */
const LOOP_INTERVAL_MS = 5000
/** Easing for pop in/out */
const EASE_SMOOTH = [0.33, 0, 0.2, 1]
const ANIM_DURATION_IN = 0.5
const ANIM_DURATION_OUT = 0.4

/** Safe margins (px) from container edges */
const MARGIN_X = 18
const MARGIN_Y = 14

/** Min gap (px) between boxes so they don’t bunch together */
/** Max fraction of the smaller box's area that can be covered by overlap (0–1). Higher allows larger boxes to fit. */
/** Min gap (px) between boxes — ensures videos stay visually distinct */
const MIN_GAP = 12

/** Min/max size of each video box (px) — sized so 3 non-overlapping boxes fit with MIN_GAP */
const BOX_SIZE_MIN = 200
const BOX_SIZE_MAX = 320

/** Rotation range in degrees — boxes get random tilt for varied orientation */
const ROTATION_DEG_MIN = -22
const ROTATION_DEG_MAX = 22

interface BoxState {
  id: number
  x: number
  y: number
  width: number
  height: number
  /** Rotation in degrees for varied orientation */
  rotation: number
  /** Start time offset into the video (seconds) so clips feel different */
  startTime: number
  spawnAt: number
  /** Which of the 3 soccer videos to use */
  videoSrc: string
}

function useContainerRect(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setRect(el.getBoundingClientRect())
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])
  return rect
}

/** Intersection area of two axis-aligned rects; 0 if they don't overlap */
function overlapArea(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): number {
  const left = Math.max(ax, bx)
  const right = Math.min(ax + aw, bx + bw)
  const top = Math.max(ay, by)
  const bottom = Math.min(ay + ah, by + bh)
  if (left >= right || top >= bottom) return 0
  return (right - left) * (bottom - top)
}

/** True if box (x,y,w,h) would overlap any existing box (or come within MIN_GAP of it) */
function overlapsTooMuch(
  x: number, y: number, w: number, h: number,
  existing: { x: number; y: number; width: number; height: number }[]
): boolean {
  const halfGap = MIN_GAP / 2
  for (const b of existing) {
    // Inflate existing box by half-gap on each side — reject if new box overlaps this zone
    const bx = b.x - halfGap
    const by = b.y - halfGap
    const bw = b.width + MIN_GAP
    const bh = b.height + MIN_GAP
    const area = overlapArea(x, y, w, h, bx, by, bw, bh)
    if (area > 0) return true
  }
  return false
}

/** Fraction of placement tries that bias toward right/bottom so boxes don't stay clustered left/top */
const EDGE_BIAS_PROBABILITY = 0.4
/** When edge-biasing, we pick from the right/bottom 25% of the range */
const EDGE_ZONE_FRACTION = 0.25

/** Pick a video source not already used by the given boxes (ensures 3 distinct videos) */
function pickDistinctVideo(usedSources: string[]): string {
  const available = VIDEO_SOURCES.filter(s => !usedSources.includes(s))
  return available[Math.floor(Math.random() * available.length)] ?? VIDEO_SOURCES[0]
}

/** Pick a random position, size, and rotation; MIN_GAP between boxes.
 * Uses unrotated bounds so boxes can reach the full container including right/bottom 20%.
 * Falls back to smaller box size if placement fails (ensures 3rd box can always fit). */
function randomBox(
  containerWidth: number,
  containerHeight: number,
  existingBoxes: { x: number; y: number; width: number; height: number }[]
): Omit<BoxState, 'id' | 'spawnAt' | 'startTime' | 'videoSrc'> | null {
  const rotation =
    ROTATION_DEG_MIN + Math.random() * (ROTATION_DEG_MAX - ROTATION_DEG_MIN)
  const sizeRanges: [number, number][] = [
    [BOX_SIZE_MIN, BOX_SIZE_MAX],
    [BOX_SIZE_MIN * 0.7, BOX_SIZE_MAX * 0.85],
    [BOX_SIZE_MIN * 0.5, BOX_SIZE_MAX * 0.65],
  ]
  for (const [sizeMin, sizeMax] of sizeRanges) {
    for (let tryCount = 0; tryCount < 100; tryCount++) {
      const w = sizeMin + Math.random() * (sizeMax - sizeMin)
      const h = sizeMin + Math.random() * (sizeMax - sizeMin)
    const xRange = containerWidth - w - MARGIN_X * 2
    const yRange = containerHeight - h - MARGIN_Y * 2
    if (xRange <= 0 || yRange <= 0) continue
    const xMin = MARGIN_X
    const xMax = MARGIN_X + xRange
    const yMin = MARGIN_Y
    const yMax = MARGIN_Y + yRange
    let x: number
    let y: number
    if (Math.random() < EDGE_BIAS_PROBABILITY) {
      if (Math.random() < 0.5) {
        x = xMax - Math.random() * EDGE_ZONE_FRACTION * xRange
        y = yMin + Math.random() * yRange
      } else {
        x = xMin + Math.random() * xRange
        y = yMax - Math.random() * EDGE_ZONE_FRACTION * yRange
      }
    } else {
      x = xMin + Math.random() * xRange
      y = yMin + Math.random() * yRange
    }
    x = Math.max(xMin, Math.min(xMax, x))
    y = Math.max(yMin, Math.min(yMax, y))
    if (!overlapsTooMuch(x, y, w, h, existingBoxes)) return { x, y, width: w, height: h, rotation }
    }
  }
  return null
}

/** Video duration in seconds for startTime spread (use a safe range so we don't run past end) */
const VIDEO_OFFSET_RANGE_S = 60

function LoopingClip({ src, startTime }: { src: string; startTime: number }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const onReady = () => {
      v.currentTime = startTime
      v.play().catch(() => {}) // Autoplay can be blocked; we try again on canplay
    }
    const onCanPlay = () => {
      if (v.paused) v.play().catch(() => {})
    }
    v.addEventListener('loadedmetadata', onReady)
    v.addEventListener('canplay', onCanPlay)
    if (v.readyState >= 2) onReady()
    return () => {
      v.removeEventListener('loadedmetadata', onReady)
      v.removeEventListener('canplay', onCanPlay)
    }
  }, [src, startTime])

  // Explicit play when mounted — handles cases where autoplay fails (e.g. element initially hidden)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const attemptPlay = () => {
      if (v.paused) v.play().catch(() => {})
    }
    attemptPlay()
    const t = setTimeout(attemptPlay, 300) // Retry after animation starts (element becomes visible)
    return () => clearTimeout(t)
  }, [src])

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      loop
      autoPlay
      style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0c0c0c' }}
    />
  )
}

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function SeasonActivationViz({ containerRef }: Props) {
  const rect = useContainerRect(containerRef)
  const rectRef = useRef(rect)
  rectRef.current = rect
  const [boxes, setBoxes] = useState<BoxState[]>([])
  const idRef = useRef(0)
  const boxCountRef = useRef(0)
  boxCountRef.current = boxes.length

  // Phase 1: Add one box at a time in random locations until we have 3
  useEffect(() => {
    if (!rect || rect.width < 80 || rect.height < 80) return
    const addOne = () => {
      if (boxCountRef.current >= TARGET_COUNT) return
      setBoxes(prev => {
        if (prev.length >= TARGET_COUNT) return prev
        const existing = prev.map(b => ({ x: b.x, y: b.y, width: b.width, height: b.height }))
        const next = randomBox(rect.width, rect.height, existing)
        if (!next) return prev
        const usedVideos = prev.map(b => b.videoSrc)
        return [
          ...prev,
          {
            id: ++idRef.current,
            ...next,
            startTime: Math.random() * VIDEO_OFFSET_RANGE_S,
            spawnAt: Date.now(),
            videoSrc: pickDistinctVideo(usedVideos),
          },
        ]
      })
    }
    const fillId = setInterval(() => {
      if (boxCountRef.current >= TARGET_COUNT) return
      addOne()
    }, FILL_INTERVAL_MS)
    return () => clearInterval(fillId)
  }, [rect?.width, rect?.height])

  // Phase 2: Continuous loop — one out, one in, on a fixed interval. No cycles or waves; videos flow in and out in an even stream (2–3 in transition at once because interval < animation duration).
  useEffect(() => {
    if (!rect || rect.width < 80 || rect.height < 80) return

    const replaceOne = () => {
      if (boxCountRef.current < TARGET_COUNT) return
      const r = rectRef.current
      if (!r || r.width < 80 || r.height < 80) return
      setBoxes(prev => {
        if (prev.length < TARGET_COUNT) return prev
        const byAge = [...prev].sort((a, b) => a.spawnAt - b.spawnAt)
        const oldest = byAge[0]
        const remaining = prev.filter(b => b.id !== oldest.id)
        const existing = remaining.map(b => ({
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
        }))
        const next = randomBox(r.width, r.height, existing)
        if (!next) return prev
        const usedVideos = remaining.map(b => b.videoSrc)
        return [
          ...remaining,
          {
            id: ++idRef.current,
            ...next,
            startTime: Math.random() * VIDEO_OFFSET_RANGE_S,
            spawnAt: Date.now(),
            videoSrc: pickDistinctVideo(usedVideos),
          },
        ]
      })
    }

    const loopId = setInterval(replaceOne, LOOP_INTERVAL_MS)
    return () => clearInterval(loopId)
  }, [rect])

  if (!rect) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: 16,
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      <AnimatePresence mode="wait">
        {boxes.map(box => (
          <motion.div
            key={box.id}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{
              duration: ANIM_DURATION_IN,
              ease: EASE_SMOOTH,
              exit: { duration: ANIM_DURATION_OUT, ease: EASE_SMOOTH },
            }}
            style={{
              position: 'absolute',
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
              transform: `rotate(${box.rotation}deg)`,
              transformOrigin: 'center center',
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: '#0c0c0c',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <LoopingClip src={box.videoSrc} startTime={box.startTime} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
