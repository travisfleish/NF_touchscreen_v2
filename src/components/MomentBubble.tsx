import { motion } from 'framer-motion'

interface MomentBubbleProps {
  label: string
  diameter: number
  phase: number
  onTap: () => void
}

function labelFontSizePx(label: string, diameter: number): number {
  const words = label.trim().split(/\s+/).filter(Boolean)
  const longestWordLen = words.length ? Math.max(...words.map((w) => w.length)) : label.length
  const scale = diameter / 204
  let base: number
  if (longestWordLen <= 10) base = 22
  else if (longestWordLen <= 13) base = 20
  else if (longestWordLen <= 16) base = 18
  else base = 16
  const scaled = Math.round(base * scale)
  /** Keep longest word on one line (no mid-word wrap); ~0.56 ≈ avg glyph width for this font weight. */
  const maxByLongestWord = Math.floor((diameter * 0.82) / (longestWordLen * 0.56))
  return Math.max(13, Math.min(scaled, maxByLongestWord))
}

export default function MomentBubble({ label, diameter, phase, onTap }: MomentBubbleProps) {
  const fontSize = labelFontSizePx(label, diameter)

  return (
    <motion.button
      type="button"
      onClick={onTap}
      onTouchStart={onTap}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.24)',
        background: 'radial-gradient(circle at 22% 20%, rgba(165,192,255,0.4) 0%, rgba(26,53,198,0.82) 55%, rgba(8,23,125,0.9) 100%)',
        boxShadow: '0 0 28px rgba(98,132,255,0.42), inset 0 0 18px rgba(255,255,255,0.14)',
        color: '#fff',
        fontFamily: 'var(--font-header)',
        fontWeight: 600,
        fontSize,
        lineHeight: 1.14,
        letterSpacing: '-0.01em',
        padding: '12px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
      animate={{
        x: [0, 2, -2, 1, 0],
        y: [0, -3, 2, -1, 0],
      }}
      transition={{
        duration: 8 + phase,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), transparent 60%)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: [0.24, 0.5, 0.24] }}
        transition={{ duration: 3.6 + phase * 0.25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '92%',
          wordBreak: 'normal',
          overflowWrap: 'normal',
          hyphens: 'none',
        }}
      >
        {label}
      </span>
    </motion.button>
  )
}
