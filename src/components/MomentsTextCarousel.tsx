import { motion } from 'framer-motion'
import { Moment } from '../data/moments'

interface Props {
  moments: Moment[]
  onSelect: (m: Moment) => void
  sport?: string
  /** When set, the matching moment is styled as active (e.g. in category select-moment rail) */
  activeMomentId?: string
  /** If false, no auto-scroll animation; rail is static for tap-to-select. Default true. */
  scrollAnimation?: boolean
}

export default function MomentsTextCarousel({ moments, onSelect, sport = 'NBA', activeMomentId, scrollAnimation = true }: Props) {

  if (moments.length === 0) return null

  // Duplicate items for seamless infinite scroll (only when animating)
  const duplicated = scrollAnimation ? [...moments, ...moments] : moments

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: scrollAnimation ? 'hidden' : 'auto',
        paddingTop: 8,
        paddingBottom: 8,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          width: 'max-content',
          willChange: scrollAnimation ? 'transform' : 'auto',
        }}
        animate={scrollAnimation ? { x: ['0%', '-50%'] } : undefined}
        transition={
          scrollAnimation
            ? {
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 40,
                  ease: 'linear',
                },
              }
            : undefined
        }
      >
        {duplicated.map((moment, i) => {
          const isActive = activeMomentId != null && moment.id === activeMomentId
          return (
            <motion.button
              key={scrollAnimation ? `${moment.id}-${i}-${sport}` : moment.id}
              onClick={() => onSelect(moment)}
              onTouchStart={() => onSelect(moment)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                paddingLeft: 24,
                paddingRight: 32,
                paddingTop: 0,
                paddingBottom: 0,
                background: 'transparent',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                minHeight: 80,
              }}
              whileHover={{ opacity: 0.85 }}
              whileTap={{ scale: 0.98 }}
            >
              <span
                style={{
                  fontFamily: "'Klarheit', serif",
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: '-0.01em',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.9)',
                }}
              >
                {moment.name}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  letterSpacing: '0.06em',
                  color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {moment.label}
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                }}
              />
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
