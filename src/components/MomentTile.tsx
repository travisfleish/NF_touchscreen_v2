import { motion } from 'framer-motion'
import { Moment } from '../data/moments'

/** Placeholder image URL per moment + sport (deterministic seeds for consistency) */
function getPreviewImageUrl(momentId: string, sport: string): string {
  const seed = `${momentId}-${sport}`.replace(/\s+/g, '-')
  return `https://picsum.photos/seed/${seed}/800/600`
}

interface Props {
  moment: Moment
  index: number
  onSelect: (m: Moment) => void
  /** Optional inventory headline + subheading for discrete/thematic differentiation */
  headline?: string
  subheading?: string
  /** Optional category label when using headline (e.g. "Discrete" / "Thematic") */
  categoryLabel?: string
  /** Optional section label rendered at top-left inside the card (e.g. "Own the Game" / "Own the Season") */
  sectionLabel?: string
  /** Active sport for per-sport placeholder image (e.g. NBA, NFL, Soccer) */
  sport?: string
  /** Optional override for the preview/thumbnail image (e.g. custom asset path) */
  previewImageUrl?: string
}

// Subtle vertical bar pattern inside tile
function TileBarPattern() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {[15, 28, 42, 56, 68, 80].map((pct) => (
        <div
          key={pct}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct}%`,
            width: 1,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  )
}

export default function MomentTile({ moment, index, onSelect, headline, subheading, categoryLabel, sectionLabel, sport = 'NBA', previewImageUrl: previewImageUrlOverride }: Props) {
  const previewImageUrl = previewImageUrlOverride ?? getPreviewImageUrl(moment.id, sport)
  const centerTitle = headline ?? moment.name

  return (
    <motion.button
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        textAlign: 'left',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.45,
          delay: index * 0.06,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
      whileHover={{
        background: 'rgba(255,255,255,0.13)',
        borderColor: 'rgba(255,255,255,0.30)',
        scale: 1.02,
        transition: { duration: 0.18 },
      }}
      whileTap={{ scale: 0.97 }}
      onTap={() => onSelect(moment)}
      onClick={() => onSelect(moment)}
    >
      {/* Preview image — full bleed */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
        }}
      >
        <img
          src={previewImageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <TileBarPattern />

      {/* Section label at top-left (e.g. "Own the Game" / "Own the Season") */}
      {sectionLabel && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '24px 28px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'Klarheit', serif",
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.2,
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
            }}
          >
            {sectionLabel}
          </div>
        </div>
      )}

      {/* Main moment / theme — centered on image */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: 24,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            fontSize: headline ? 42 : 52,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            lineHeight: 1.1,
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {centerTitle}
        </div>
      </div>

      {/* Subtle radial glow at bottom matching accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: `linear-gradient(to top, ${moment.accentColor}12 0%, transparent 100%)`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Text — pinned to bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '28px 28px 28px 28px',
        }}
      >
        {/* Category label (e.g. Discrete / Thematic) */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#00ccff',
            marginBottom: 10,
            lineHeight: 1,
          }}
        >
          {categoryLabel ?? moment.label}
        </div>

        {/* Headline/moment name at bottom only when no subheading (non-featured tiles) */}
        {!subheading && (
          <div
            style={{
              fontFamily: "'Klarheit', serif",
              fontWeight: 600,
              fontSize: 46,
              letterSpacing: '-0.01em',
              color: '#ffffff',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            {headline ?? moment.name}
          </div>
        )}

        {/* Subheading (featured tiles: "The shot that...") */}
        {subheading && (
          <div
            style={{
              fontWeight: 400,
              fontSize: 18,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.35,
            }}
          >
            {subheading}
          </div>
        )}
      </div>
    </motion.button>
  )
}
