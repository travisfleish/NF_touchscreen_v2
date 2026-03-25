import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const SIZE_TRANSITION = { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const }

/** Orbit tier: sport hub is separate (SportBubble); these are mid vs inner rings. */
export type MomentBubbleLayer = 'category' | 'moment'

/** Bright — “tap next” (idle themes, moments). */
const SELECTABLE_ORBIT: {
  baseColor: string
  background: string
  border: string
  boxShadow: string
  boxShadowPrimary: string
  highlightOpacity: [number, number, number]
} = {
  baseColor: 'rgb(8, 52, 200)',
  background:
    'radial-gradient(circle at 24% 18%, rgba(150,195,255,0.55) 0%, rgba(52,105,255,0.88) 48%, rgba(0,41,200,0.95) 100%)',
  border: '1px solid rgba(200,230,255,0.42)',
  boxShadow: '0 0 28px rgba(100,150,255,0.45), inset 0 0 18px rgba(255,255,255,0.12)',
  boxShadowPrimary:
    '0 0 56px rgba(130,180,255,0.55), 0 0 32px rgba(160,210,255,0.45), inset 0 0 20px rgba(255,255,255,0.14)',
  highlightOpacity: [0.22, 0.5, 0.22],
}

/** Dark navy — selected theme as parent (same role as sport hub after pick). */
const PARENT_ORBIT: {
  baseColor: string
  background: string
  border: string
  boxShadow: string
  highlightOpacity: [number, number, number]
} = {
  baseColor: 'rgb(12, 28, 105)',
  background:
    'radial-gradient(circle at 22% 20%, rgba(140,168,235,0.38) 0%, rgba(32,48,155,0.78) 52%, rgba(12,28,105,0.92) 100%)',
  border: '1px solid rgba(200,215,255,0.22)',
  boxShadow: '0 0 22px rgba(72,100,210,0.34), inset 0 0 16px rgba(255,255,255,0.1)',
  highlightOpacity: [0.1, 0.22, 0.1],
}

type OrbitTier = {
  baseColor: string
  background: string
  border: string
  boxShadow: string
  boxShadowPrimary?: string
  highlightOpacity: [number, number, number]
}

const LAYER: Record<MomentBubbleLayer, OrbitTier> = {
  category: { ...SELECTABLE_ORBIT },
  /** Same palette as category — moments are equally “pick me”. */
  moment: { ...SELECTABLE_ORBIT },
}

/** Active theme hub while its moment ring is open — flat, no competing halo. */
const CATEGORY_PARENT_SHADOW =
  '0 0 18px rgba(0,0,0,0.45), inset 0 0 14px rgba(0,0,0,0.22)'

export type MomentBubbleVariant = 'selectable' | 'parent'

interface MomentBubbleProps {
  label: string
  diameter: number
  phase: number
  /** `category` = theme ring; `moment` = inner ring — same palette; role differs for labels only. */
  layer?: MomentBubbleLayer
  /** Selected theme uses parent (dark); idle themes stay bright — mirrors sport idle → selected. */
  variant?: MomentBubbleVariant
  /** Active category hub when its moment ring is open — muted, but still fully opaque vs the sport hub. */
  isDimmed?: boolean
  /** Other categories on the ring while one is expanded — softer, still opaque vs the sport hub. */
  isPeripheral?: boolean
  /** Strong outer glow — only for the deepest visible actionable tier (themes, moments, or a solo theme). */
  isPrimaryAction?: boolean
  /** When true, no idle float or shimmer — used after a sport is selected. */
  disableAmbientMotion?: boolean
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
  /** Slightly smaller body text so “Moment Package:” / “Moment:” + label fit comfortably. */
  const scaled = Math.round(base * scale * 0.88)
  /** Keep longest word on one line (no mid-word wrap); ~0.56 ≈ avg glyph width for this font weight. */
  const maxByLongestWord = Math.floor((diameter * 0.76) / (longestWordLen * 0.56))
  return Math.max(11, Math.min(scaled, maxByLongestWord))
}

function layerTitleFontSizePx(diameter: number): number {
  return Math.max(12, Math.round(diameter * 0.072))
}

const MomentBubble = forwardRef<HTMLButtonElement, MomentBubbleProps>(function MomentBubble(
  {
    label,
    diameter,
    phase,
    layer = 'category',
    variant = 'selectable',
    isDimmed = false,
    isPeripheral = false,
    isPrimaryAction = true,
    disableAmbientMotion = false,
    onTap,
  },
  ref
) {
  const layerTitle = layer === 'category' ? 'Moment Package:' : 'Moment:'
  const fontSize = labelFontSizePx(label, diameter)
  const titleFontSize = layerTitleFontSizePx(diameter)
  const isParentTheme = layer === 'category' && variant === 'parent'
  const tier: OrbitTier = isParentTheme ? PARENT_ORBIT : LAYER[layer]
  const highlightOpacity = isDimmed
    ? (tier.highlightOpacity.map((v) => v * 0.28) as [number, number, number])
    : isPeripheral
      ? (tier.highlightOpacity.map((v) => v * 0.65) as [number, number, number])
      : !isPrimaryAction && layer === 'category' && !isParentTheme
        ? (tier.highlightOpacity.map((v) => v * 0.42) as [number, number, number])
        : tier.highlightOpacity

  const resolvedBoxShadow: string = ((): string => {
    if (isDimmed) return '0 0 12px rgba(0,0,0,0.35), inset 0 0 14px rgba(0,0,0,0.18)'
    if (isPeripheral) return tier.boxShadow
    if (isParentTheme) return CATEGORY_PARENT_SHADOW
    if (!isPrimaryAction && layer === 'category') return CATEGORY_PARENT_SHADOW
    if (isPrimaryAction) {
      const primary = 'boxShadowPrimary' in tier ? tier.boxShadowPrimary : undefined
      return primary ?? tier.boxShadow
    }
    return tier.boxShadow
  })()

  const subduedFilter = isDimmed
    ? 'saturate(0.55) brightness(0.84)'
    : isPeripheral
      ? 'saturate(0.72) brightness(0.88)'
      : undefined

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onTap}
      onTouchStart={onTap}
      aria-label={`${layerTitle} ${label}`}
      animate={{
        width: diameter,
        height: diameter,
        ...(disableAmbientMotion
          ? { x: 0, y: 0 }
          : {
              x: [0, 2, -2, 1, 0],
              y: [0, -3, 2, -1, 0],
            }),
      }}
      transition={{
        width: SIZE_TRANSITION,
        height: SIZE_TRANSITION,
        x: {
          duration: disableAmbientMotion ? 0.2 : 8 + phase,
          repeat: disableAmbientMotion ? 0 : Infinity,
          ease: 'easeInOut',
        },
        y: {
          duration: disableAmbientMotion ? 0.2 : 8 + phase,
          repeat: disableAmbientMotion ? 0 : Infinity,
          ease: 'easeInOut',
        },
      }}
      style={{
        borderRadius: '50%',
        border: tier.border,
        backgroundColor: tier.baseColor,
        backgroundImage: tier.background,
        boxShadow: resolvedBoxShadow,
        filter: subduedFilter,
        color: '#fff',
        padding: '12px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 28%, rgba(220,235,255,0.32), rgba(255,255,255,0.08) 45%, transparent 62%)',
          pointerEvents: 'none',
        }}
        animate={{
          opacity: disableAmbientMotion ? highlightOpacity[1] : highlightOpacity,
        }}
        transition={{
          duration: disableAmbientMotion ? 0.2 : 3.6 + phase * 0.25,
          repeat: disableAmbientMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.span
        animate={{
          gap: Math.max(8, Math.round(diameter * 0.034)),
          y: -Math.round(diameter * 0.03),
        }}
        transition={SIZE_TRANSITION}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '92%',
          wordBreak: 'normal',
          overflowWrap: 'normal',
          hyphens: 'none',
        }}
      >
        <motion.span
          animate={{
            fontSize: titleFontSize,
            opacity: isDimmed ? 0.45 : isPeripheral ? 0.72 : 0.92,
          }}
          transition={SIZE_TRANSITION}
          style={{
            fontFamily: 'var(--font-header)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1.15,
            color: isDimmed ? 'rgba(255,255,255,0.42)' : isPeripheral ? 'rgba(255,255,255,0.85)' : '#fff',
          }}
        >
          {layerTitle}
        </motion.span>
        <motion.span
          animate={{
            fontSize,
            opacity: isDimmed ? 0.4 : isPeripheral ? 0.82 : 1,
          }}
          transition={SIZE_TRANSITION}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.01em',
            textAlign: 'center',
            color: isDimmed ? 'rgba(255,255,255,0.4)' : isPeripheral ? 'rgba(255,255,255,0.82)' : '#fff',
          }}
        >
          {label}
        </motion.span>
      </motion.span>
    </motion.button>
  )
})

export default MomentBubble
