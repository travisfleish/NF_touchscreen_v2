import { motion } from 'framer-motion'

/** One leg of the breath (rest→peak or peak→rest). Full cycle = 2× this. */
const PULSE_HALF_S = 2.35

interface SportBubbleProps {
  label: string
  diameter: number
  imageUrl: string
  gradient: string
  glow: string
  /** 0 = start at rest; 1 = delayed half a cycle so two bubbles alternate */
  pulseAlternate: 0 | 1
  isDimmed?: boolean
  onTap: () => void
}

export default function SportBubble({
  label,
  diameter,
  imageUrl,
  gradient,
  glow,
  pulseAlternate,
  isDimmed = false,
  onTap,
}: SportBubbleProps) {
  const pulseDelay = pulseAlternate * PULSE_HALF_S

  return (
    <motion.button
      type="button"
      onClick={onTap}
      onTouchStart={onTap}
      aria-label={`Explore ${label} moments`}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.3)',
        backgroundImage: imageUrl
          ? `linear-gradient(145deg, rgba(46,82,255,0.42) 0%, rgba(24,54,210,0.38) 50%, rgba(10,26,150,0.42) 100%), linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.46) 100%), url(${imageUrl})`
          : gradient,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: `0 0 60px ${glow}, inset 0 0 22px rgba(255,255,255,0.22)`,
        color: '#fff',
        fontFamily: 'var(--font-header)',
        fontWeight: 700,
        fontSize: label.length > 10 ? 42 : 54,
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        opacity: isDimmed ? 0.45 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
      animate={{
        scale: [1, 1.09],
      }}
      transition={{
        duration: PULSE_HALF_S,
        delay: pulseDelay,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.04 }}
    >
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.35), rgba(255,255,255,0.02) 58%, transparent 70%)',
        }}
        animate={{ opacity: [0.34, 0.78] }}
        transition={{
          duration: PULSE_HALF_S,
          delay: pulseDelay,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1, textShadow: '0 0 28px rgba(180,200,255,0.5)' }}>{label}</span>
    </motion.button>
  )
}
