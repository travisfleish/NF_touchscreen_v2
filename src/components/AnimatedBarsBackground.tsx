import { motion } from 'framer-motion'
import { memo } from 'react'

interface Bar {
  id: number
  left: string
  height: string
  width: number
  delay: number
  duration: number
  opacity: number
}

// Generate bars deterministically (no Math.random in render)
const BARS: Bar[] = Array.from({ length: 22 }, (_, i) => {
  const seed = i * 137.508 // golden angle for even distribution
  const pseudoRandom = (seed % 100) / 100
  const pseudoRandom2 = ((seed * 1.618) % 100) / 100
  const pseudoRandom3 = ((seed * 2.414) % 100) / 100
  return {
    id: i,
    left: `${(i / 22) * 100 + pseudoRandom * 2}%`,
    height: `${35 + pseudoRandom2 * 55}%`,
    width: 2 + Math.floor(pseudoRandom3 * 4),
    delay: pseudoRandom * 3,
    duration: 2.5 + pseudoRandom2 * 2.5,
    opacity: 0.06 + pseudoRandom3 * 0.1,
  }
})

interface Props {
  dimmed?: boolean
}

export default memo(function AnimatedBarsBackground({ dimmed = false }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Deep gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 40%, rgba(40,40,255,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Vertical bars */}
      {BARS.map(bar => (
        <motion.div
          key={bar.id}
          className="absolute bottom-0 rounded-full bar-glow"
          style={{
            left: bar.left,
            width: bar.width,
            height: bar.height,
            opacity: dimmed ? bar.opacity * 0.5 : bar.opacity,
            background: 'linear-gradient(to top, rgba(100,120,255,0.9) 0%, rgba(180,200,255,0.3) 60%, transparent 100%)',
            transformOrigin: 'bottom center',
          }}
          animate={{
            scaleY: [1, 1.15 + bar.id % 3 * 0.1, 0.85, 1.1, 1],
            opacity: [
              bar.opacity,
              bar.opacity * 1.8,
              bar.opacity * 0.6,
              bar.opacity * 1.4,
              bar.opacity,
            ],
          }}
          transition={{
            duration: bar.duration,
            delay: bar.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(100,150,255,0.3), rgba(200,220,255,0.5), rgba(100,150,255,0.3), transparent)',
          top: '60%',
        }}
        animate={{ top: ['25%', '75%', '25%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
})
