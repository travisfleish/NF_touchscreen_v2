import { forwardRef } from 'react'
import { motion } from 'framer-motion'

/** One leg of the breath (rest→peak or peak→rest). Full cycle = 2× this. */
const PULSE_HALF_S = 2.35

interface SportBubbleProps {
  label: string
  diameter: number
  gradient: string
  glow: string
  /** 0 = start at rest; 1 = delayed half a cycle so two bubbles alternate */
  pulseAlternate: 0 | 1
  isDimmed?: boolean
  /** Expanded hub — stronger rim so the anchor reads above category/moment rings. */
  isHub?: boolean
  /** Strong pulse + colored halo: only when this bubble is the deepest visible actionable tier. */
  isPrimaryAction?: boolean
  /** Smaller title when docked on the perimeter (non-selected parents). */
  compactLabel?: boolean
  onTap: () => void
}

const SportBubble = forwardRef<HTMLButtonElement, SportBubbleProps>(function SportBubble(
  {
    label,
    diameter,
    gradient,
    glow,
    pulseAlternate,
    isDimmed = false,
    isHub = false,
    isPrimaryAction = true,
    compactLabel = false,
    onTap,
  },
  ref
) {
  const pulseDelay = pulseAlternate * PULSE_HALF_S
  /** Idle / expanded hub uses ~300–320px reference; shrink type when hub is smaller (e.g. sport-as-parent beside theme ring). */
  const labelFontSize = compactLabel
    ? Math.max(14, Math.round((label.length > 10 ? 42 : 54) * (diameter / 300)))
    : Math.max(
        14,
        Math.round((label.length > 10 ? 42 : 54) * Math.min(1, diameter / 300))
      )
  const hubRim = isDimmed
    ? 'rgba(255,255,255,0.32)'
    : isHub
      ? 'rgba(255,255,255,0.42)'
      : 'rgba(255,255,255,0.3)'
  const hubInset = isDimmed
    ? 'rgba(255,255,255,0.16)'
    : isHub
      ? 'rgba(255,255,255,0.28)'
      : 'rgba(255,255,255,0.22)'
  const hubGlow = isDimmed
    ? `0 0 40px ${glow}, 0 0 18px rgba(0,0,0,0.22), inset 0 0 16px rgba(0,0,0,0.12)`
    : !isPrimaryAction
      ? `0 0 36px rgba(0,0,0,0.45), inset 0 0 20px rgba(0,0,0,0.18)`
      : isHub
        ? `0 0 72px ${glow}, 0 0 28px rgba(255,255,255,0.18)`
        : `0 0 60px ${glow}`

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onTap}
      onTouchStart={onTap}
      aria-label={`Explore ${label} moments`}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: `1px solid ${hubRim}`,
        backgroundImage: gradient,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: `${hubGlow}, inset 0 0 22px ${hubInset}`,
        color: '#fff',
        fontFamily: 'var(--font-header)',
        fontWeight: 700,
        fontSize: labelFontSize,
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        opacity: isDimmed ? 0.82 : 1,
        filter: isDimmed ? 'saturate(0.88) brightness(1.02)' : undefined,
        WebkitTapHighlightColor: 'transparent',
      }}
      animate={{
        scale: isPrimaryAction ? [1, 1.09] : 1,
      }}
      transition={{
        duration: PULSE_HALF_S,
        delay: pulseDelay,
        repeat: isPrimaryAction ? Infinity : 0,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.35), rgba(255,255,255,0.02) 58%, transparent 70%)',
        }}
        animate={{
          opacity: isDimmed ? 0.14 : !isPrimaryAction ? 0.2 : [0.34, 0.78],
        }}
        transition={{
          duration: PULSE_HALF_S,
          delay: pulseDelay,
          repeat: isPrimaryAction && !isDimmed ? Infinity : 0,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          color: isDimmed ? 'rgba(255,255,255,0.94)' : '#fff',
          textShadow: isDimmed
            ? '0 1px 12px rgba(0,0,0,0.55), 0 0 20px rgba(40,60,140,0.35)'
            : '0 0 28px rgba(180,200,255,0.5)',
        }}
      >
        {label}
      </span>
    </motion.button>
  )
})

export default SportBubble
