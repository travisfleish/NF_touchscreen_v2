import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ALL_CHIPS = [
  'Down 1 Point',
  '4.05 Sec Left',
  'Game Winning',
  'Momentum Shift',
  'Win Prob: 12%',
  'Final Quarter',
  'Crowd on Feet',
  'Series Clincher',
  '+3 Point Lead',
  'Comeback Trail',
  'Shot Clock: 2s',
  'Overtime Looms',
  'Data Confirmed',
  'Historic Pace',
  'Record Crowd',
]

interface ChipInstance {
  id: number
  text: string
  x: string
  y: string
  duration: number
  driftX: number
  driftY: number
}

let chipCounter = 0

// Positions that avoid the center column (reserved for headline)
const POSITIONS = [
  { x: '5%', y: '15%' },
  { x: '72%', y: '12%' },
  { x: '8%', y: '55%' },
  { x: '74%', y: '48%' },
  { x: '3%', y: '78%' },
  { x: '70%', y: '72%' },
  { x: '78%', y: '30%' },
  { x: '6%', y: '35%' },
]

const DRIFT_VALUES = [-12, -8, 8, 12, -10, 10, -6, 6]

export default function FloatingDataChips() {
  const [activeChips, setActiveChips] = useState<ChipInstance[]>([])

  useEffect(() => {
    // Spawn initial chips immediately
    const initialChips: ChipInstance[] = POSITIONS.slice(0, 5).map((pos, i) => {
      const text = ALL_CHIPS[i % ALL_CHIPS.length]
      chipCounter++
      return {
        id: chipCounter,
        text,
        x: pos.x,
        y: pos.y,
        duration: 6 + i,
        driftX: DRIFT_VALUES[i % DRIFT_VALUES.length],
        driftY: DRIFT_VALUES[(i + 2) % DRIFT_VALUES.length],
      }
    })
    setActiveChips(initialChips)

    // Cycle chips in and out
    const interval = setInterval(() => {
      setActiveChips(prev => {
        const keep = prev.length >= 5 ? prev.slice(1) : prev
        const nextPosIndex = chipCounter % POSITIONS.length
        const nextTextIndex = (chipCounter + 3) % ALL_CHIPS.length
        chipCounter++
        const newChip: ChipInstance = {
          id: chipCounter,
          text: ALL_CHIPS[nextTextIndex],
          x: POSITIONS[nextPosIndex].x,
          y: POSITIONS[nextPosIndex].y,
          duration: 5 + (chipCounter % 4),
          driftX: DRIFT_VALUES[chipCounter % DRIFT_VALUES.length],
          driftY: DRIFT_VALUES[(chipCounter + 3) % DRIFT_VALUES.length],
        }
        return [...keep, newChip]
      })
    }, 2800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <AnimatePresence>
        {activeChips.map(chip => (
          <motion.div
            key={chip.id}
            className="absolute"
            style={{ left: chip.x, top: chip.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.9, 0.9, 0],
              scale: [0.8, 1, 1, 0.9],
              x: [0, chip.driftX * 0.4, chip.driftX, chip.driftX * 1.3],
              y: [0, chip.driftY * 0.3, chip.driftY * 0.7, chip.driftY],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: chip.duration, ease: 'easeInOut' }}
          >
            <span
              style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 22,
                letterSpacing: '0.12em',
              }}
            >
              {chip.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
