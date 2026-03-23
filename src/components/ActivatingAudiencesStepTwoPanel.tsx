import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedFanCloud } from './AnimatedFanCloud'
import { ActivatingAudiencesReel } from './ActivatingAudiencesReel'

/**
 * Left column for controversy cinematic detail: Step 2 + same fan-graph + audience reel as full-screen cinematic activating phase.
 */
export default function ActivatingAudiencesStepTwoPanel() {
  const [replayToken] = useState(() => Date.now())
  const [reelKey] = useState(() => Date.now())

  const subLine = {
    margin: 0,
    fontFamily: "'Klarheit', serif",
    fontWeight: 600,
    fontSize: 34,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: 'rgba(255,255,255,0.92)',
  } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 20 }}>
      <div
        style={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        Step two
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <p style={subLine}>Audiences.</p>
        <p style={subLine}>Automatically</p>
        <p style={subLine}>Activated.</p>
      </div>

      <motion.div
        style={{ width: '100%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1200 / 675',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            background: '#000',
          }}
        >
          <AnimatedFanCloud
            className="activating-audiences-fan-cloud"
            animate
            mode="graph-build"
            replayToken={replayToken}
            alt="Audience network visualization"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              minHeight: 0,
              aspectRatio: 'auto',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}
          >
            <ActivatingAudiencesReel key={reelKey} marginTop={0} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
