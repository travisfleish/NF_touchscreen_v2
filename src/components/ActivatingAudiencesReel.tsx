import { useState } from 'react'
import { motion } from 'framer-motion'
import { CINEMATIC_ACTIVATING_SCROLL_MS } from '../tokens'

/** Deterministic audience/segment IDs for the activating reel (product-forward, not random) */
const REEL_IDS = (() => {
  const ids: string[] = []
  const chars = '0123456789ABCDEF'
  for (let i = 0; i < 56; i++) {
    const a = chars[(i * 7) % 16]
    const b = chars[(i * 11 + 3) % 16]
    const c = chars[(i * 13 + 5) % 16]
    const d = chars[(i * 17 + 7) % 16]
    ids.push(`AUD-${a}${b}${c}${d}`)
  }
  return ids
})()

const REEL_ROW_HEIGHT_PX = 64
const REEL_WINDOW_HEIGHT_PX = 88
/** Index of the ID that will be "selected" (centered and emphasized) after deceleration */
const REEL_TARGET_INDEX = 42
/** Final translateY so the center of the target row aligns with the center of the window (integer for pixel-perfect stop) */
const REEL_FINAL_OFFSET_PX = Math.round(
  REEL_WINDOW_HEIGHT_PX / 2 - (REEL_TARGET_INDEX * REEL_ROW_HEIGHT_PX + REEL_ROW_HEIGHT_PX / 2)
)
/** Wheel-of-fortune: fast spin then progressive slowdown; last segment is a crawl to a full stop */
const REEL_KEYFRAME_TIMES: number[] = [0, 0.45, 0.78, 0.94, 1]

/** Keyframe positions for reel (stable ref so Framer doesn't restart animation). */
const REEL_KEYFRAME_Y: number[] = [
  0,
  REEL_FINAL_OFFSET_PX * 0.72,
  REEL_FINAL_OFFSET_PX * 0.91,
  REEL_FINAL_OFFSET_PX * 0.99,
  REEL_FINAL_OFFSET_PX,
]

export interface ActivatingAudiencesReelProps {
  /** Top spacing under the "ACTIVATING AUDIENCES" label */
  marginTop?: number
}

/** Vertical reel: IDs scroll upward with fast spin → wheel-of-fortune deceleration → full stop on one Fan ID. */
export function ActivatingAudiencesReel({ marginTop = 20 }: ActivatingAudiencesReelProps) {
  const scrollDurationS = CINEMATIC_ACTIVATING_SCROLL_MS / 1000
  const [reelComplete, setReelComplete] = useState(false)

  return (
    <div
      style={{
        height: REEL_WINDOW_HEIGHT_PX,
        width: 280,
        overflow: 'clip',
        display: 'flex',
        justifyContent: 'center',
        marginTop,
        position: 'relative',
      }}
      aria-hidden
    >
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: REEL_IDS.length * REEL_ROW_HEIGHT_PX,
          position: 'relative',
          willChange: reelComplete ? 'auto' : 'transform',
          zIndex: 1,
        }}
        initial={{ y: 0 }}
        animate={{
          y: reelComplete ? REEL_FINAL_OFFSET_PX : REEL_KEYFRAME_Y,
        }}
        transition={
          reelComplete
            ? { duration: 0 }
            : {
                duration: scrollDurationS,
                times: REEL_KEYFRAME_TIMES,
                ease: 'linear',
              }
        }
        onAnimationComplete={() => setReelComplete(true)}
      >
        {REEL_IDS.map((id, i) => (
          <div
            key={`${id}-${i}`}
            style={{
              height: REEL_ROW_HEIGHT_PX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'ui-monospace, monospace',
              fontSize: i === REEL_TARGET_INDEX ? 28 : 20,
              fontWeight: i === REEL_TARGET_INDEX ? 700 : 500,
              letterSpacing: '0.08em',
              color: i === REEL_TARGET_INDEX ? 'rgba(0,204,255,0.98)' : 'rgba(255,255,255,0.45)',
              minWidth: 200,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {id}
          </div>
        ))}
      </motion.div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: (REEL_WINDOW_HEIGHT_PX - REEL_ROW_HEIGHT_PX) / 2,
          height: REEL_ROW_HEIGHT_PX,
          border: '2px solid rgba(0,204,255,0.4)',
          borderRadius: 8,
          pointerEvents: 'none',
          background: 'transparent',
          zIndex: 2,
        }}
        aria-hidden
      />
    </div>
  )
}
