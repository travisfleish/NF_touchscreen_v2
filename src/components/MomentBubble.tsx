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

function labelFontSizePx(label: string, diameter: number, layer: MomentBubbleLayer): number {
  const words = label.trim().split(/\s+/).filter(Boolean)
  const longestWordLen = words.length ? Math.max(...words.map((w) => w.length)) : label.length
  /** `diameter / 204` maps ring bubbles (~214–296px) to a comfortable body size. */
  const scale = diameter / 204
  let base: number
  if (longestWordLen <= 10) base = 25
  else if (longestWordLen <= 13) base = 23
  else if (longestWordLen <= 16) base = 20
  else base = 18
  const scaled = Math.round(base * scale * 0.93)
  /**
   * Keep longest word on one line — usable width ~82% of diameter (padding + 94% text block).
   * Slightly tighter glyph factor so we don’t under-size large bubbles.
   */
  const maxByLongestWord = Math.floor((diameter * 0.82) / (longestWordLen * 0.52))
  let raw = Math.max(12, Math.min(scaled, maxByLongestWord))
  /** Theme ring (moment package) — body slightly smaller than inner “Moment” satellites. */
  if (layer === 'category') {
    raw = Math.max(12, Math.round(raw * 0.94))
  }
  return raw
}

function layerTitleFontSizePx(diameter: number): number {
  /** “Moment Package:” / “Moment:” — ~9.1% of bubble width, floor 14px. */
  return Math.max(14, Math.round(diameter * 0.091))
}

/** Space between “Moment Package:” / “Moment:” and the label — must live in plain `style` (not motion `animate`); animated gap often doesn’t apply. */
function headerBodyGapPx(diameter: number): number {
  return Math.max(22, Math.round(diameter * 0.1))
}

/** Between the two lines of the green header (“Moment” / “Package:” or “Moment” / “:”). */
function titleLineGapPx(diameter: number): number {
  return Math.max(2, Math.round(diameter * 0.014))
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
  const fontSize = labelFontSizePx(label, diameter, layer)
  const titleFontSize = layerTitleFontSizePx(diameter)
  const titleLineGap = titleLineGapPx(diameter)
  const headerBodyGap = headerBodyGapPx(diameter)
  const padV = Math.max(8, Math.round(diameter * 0.036))
  const padH = Math.max(10, Math.round(diameter * 0.046))
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
        padding: `${padV}px ${padH}px`,
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
          maxWidth: '94%',
          wordBreak: 'normal',
          overflowWrap: 'normal',
          hyphens: 'none',
        }}
      >
        {/* fontSize in `style` only — animated fontSize on nested motion nodes often never hits the DOM; copy inherits Tailwind button `font-size: 100%` (~16px). */}
        <motion.span
          animate={{
            opacity: isDimmed ? 0.45 : isPeripheral ? 0.72 : 0.92,
          }}
          transition={SIZE_TRANSITION}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-header)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            color: isDimmed
              ? 'rgba(225, 255, 103, 0.42)'
              : isPeripheral
                ? 'rgba(225, 255, 103, 0.85)'
                : '#e1ff67',
          }}
        >
          {layer === 'category' ? (
            <>
              <span style={{ fontSize: titleFontSize }}>Moment</span>
              <span style={{ fontSize: titleFontSize, marginTop: titleLineGap }}>Package:</span>
            </>
          ) : (
            <span style={{ fontSize: titleFontSize }}>Moment:</span>
          )}
        </motion.span>
        <motion.span
          animate={{
            opacity: isDimmed ? 0.4 : isPeripheral ? 0.82 : 1,
          }}
          transition={SIZE_TRANSITION}
          style={{
            fontSize,
            display: 'block',
            marginTop: headerBodyGap,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            lineHeight: 1.25,
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
