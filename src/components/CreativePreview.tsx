import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Creative, Moment } from '../data/moments'

interface Props {
  moment: Moment
  /** When 'cinematic', use longer staggered fade-in for a smoother transition */
  entryMode?: 'default' | 'cinematic'
  /** Set on the large preview card (below format buttons); used to align sibling columns */
  previewAreaRef?: (instance: HTMLDivElement | null) => void
}

// --- Live Data Overlay Preview ---
function LiveDataOverlay({ creative, accentColor }: { creative: Creative; accentColor: string }) {
  const { score, time, stat, team1, team2 } = creative.preview
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 28 }}>
      {/* Broadcast field mock */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #001040 0%, #000820 100%)',
        }}
      >
        {[20, 40, 60, 80].map(pct => (
          <div key={pct} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' }} />
      </div>

      {/* Broadcast header bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderRadius: 14,
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff3b30' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span style={{ fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 18 }}>Live</span>
        </div>
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{creative.description}</span>
        <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>GS DATA</span>
      </div>

      {/* Scoreboard */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            padding: '28px 56px',
            borderRadius: 20,
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Klarheit', serif", fontWeight: 600, color: '#fff', fontSize: 44, letterSpacing: '-0.01em', lineHeight: 1 }}>{team1 ?? 'HOME'}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: 6 }}>HOME</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Klarheit', serif", fontWeight: 600, fontSize: 56, letterSpacing: '-0.02em', color: accentColor, lineHeight: 1 }}>{score ?? '—'}</div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{time ?? '–:––'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Klarheit', serif", fontWeight: 600, color: '#fff', fontSize: 44, letterSpacing: '-0.01em', lineHeight: 1 }}>{team2 ?? 'AWAY'}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: 6 }}>AWAY</div>
          </div>
        </div>

        <motion.div
          style={{
            padding: '14px 32px',
            borderRadius: 9999,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}55`,
            color: accentColor,
            fontSize: 20,
          }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {stat ?? 'KEY METRIC'}
        </motion.div>
      </div>

      {/* Lower third */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderRadius: 14,
          background: `linear-gradient(90deg, ${accentColor}33, rgba(0,0,60,0.8))`,
          border: `1px solid ${accentColor}33`,
        }}
      >
        <div>
          <img src="/genius-sports-logo.png" alt="Genius Sports" style={{ height: 20, marginBottom: 4 }} />
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}>CTV · MOMENT DETECTION</div>
        </div>
        <div
          style={{
            padding: '10px 24px',
            borderRadius: 9999,
            fontWeight: 800,
            textTransform: 'uppercase',
            background: accentColor,
            color: '#000',
            fontSize: 18,
            letterSpacing: '0.12em',
          }}
        >
          Sponsor CTA
        </div>
      </div>
    </div>
  )
}

// --- Branded Highlight Frame Preview ---
function BrandedHighlightFrame({ creative, accentColor }: { creative: Creative; accentColor: string }) {
  const { badge, headline, note } = creative.preview
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#0a0a1a',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 90% at 50% 80%, ${accentColor}18 0%, transparent 70%)`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16, opacity: 0.12 }}>
          <div
            style={{
              width: 240,
              height: 380,
              background: accentColor,
              clipPath: 'polygon(40% 0%, 60% 0%, 70% 12%, 65% 25%, 75% 60%, 80% 85%, 70% 100%, 55% 100%, 55% 75%, 50% 60%, 45% 75%, 45% 100%, 30% 100%, 25% 85%, 30% 60%, 35% 25%, 30% 12%)',
              filter: 'blur(2px)',
            }}
          />
        </div>
      </div>

      {/* Frame border */}
      <div style={{ position: 'absolute', inset: 20, borderRadius: 14, border: `2px solid ${accentColor}`, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20, boxShadow: `inset 0 0 80px ${accentColor}20, 0 0 50px ${accentColor}15`, pointerEvents: 'none' }} />

      {/* Top badge */}
      <motion.div
        style={{ position: 'absolute', top: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          style={{
            padding: '12px 48px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            background: accentColor,
            color: '#000',
            fontSize: 22,
            lineHeight: 1.15,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
          }}
        >
          {badge ?? 'HIGHLIGHT'}
        </div>
      </motion.div>

      {/* Center headline */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <motion.h3
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            color: '#fff',
            fontSize: 52,
            letterSpacing: '-0.01em',
            textShadow: `0 0 60px ${accentColor}80`,
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {headline ?? 'The Moment'}
        </motion.h3>
        {/* Corner brackets */}
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
          const [v, h] = corner.split('-') as ['top' | 'bottom', 'left' | 'right']
          return (
            <div
              key={corner}
              style={{
                position: 'absolute',
                [v]: 64,
                [h]: 20,
                width: 32,
                height: 32,
                borderTop: v === 'top' ? `2px solid ${accentColor}` : 'none',
                borderBottom: v === 'bottom' ? `2px solid ${accentColor}` : 'none',
                borderLeft: h === 'left' ? `2px solid ${accentColor}` : 'none',
                borderRight: h === 'right' ? `2px solid ${accentColor}` : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Bottom sponsor */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 28px',
            borderRadius: 9999,
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{ fontWeight: 900, color: '#fff', fontSize: 18, letterSpacing: '0.1em' }}>GS</div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}>{note ?? 'Powered by Genius Sports'}</span>
        </div>
      </motion.div>
    </div>
  )
}

// --- Full Takeover Preview ---
function FullTakeover({ creative, accentColor }: { creative: Creative; accentColor: string }) {
  const { headline, cta, metric } = creative.preview
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${accentColor}33 0%, #000040 40%, #000820 100%)`,
      }}
    >
      {/* Concentric rings */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 320 + i * 100,
              height: 320 + i * 100,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              border: `1px solid ${accentColor}`,
              borderRadius: '50%',
            }}
          />
        ))}
      </div>

      {/* Diagonal accent strips */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.18, transform: 'skewY(-8deg)' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 3,
              top: `${30 + i * 20}%`,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            }}
          />
        ))}
      </div>

      {/* Top wordmark */}
      <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <img src="/genius-sports-logo.png" alt="Genius Sports" style={{ height: 20, opacity: 0.6 }} />
        <div
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            background: `${accentColor}33`,
            border: `1px solid ${accentColor}55`,
            color: accentColor,
            fontSize: 18,
          }}
        >
          Interstitial
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 48px', gap: 24 }}>
        <motion.div
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            color: '#fff',
            lineHeight: 0.95,
            fontSize: 80,
            letterSpacing: '-0.02em',
            textShadow: `0 0 80px ${accentColor}90`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {headline ?? 'MOMENT'}
        </motion.div>

        <motion.div
          style={{ fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {metric ?? '—'}
        </motion.div>

        <motion.div
          style={{
            padding: '20px 48px',
            borderRadius: 9999,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            background: accentColor,
            color: '#000010',
            fontSize: 24,
            minWidth: 280,
            textAlign: 'center',
            boxShadow: `0 0 40px ${accentColor}60`,
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {cta ?? 'Discover More'}
        </motion.div>
      </div>

      {/* Bottom sponsor strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Sponsor Brand · Powered by Genius Sports
        </span>
      </div>
    </div>
  )
}

const FORMAT_LABELS = ['CTV', 'Social', 'Interstitial']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (cinematic: boolean) => ({
    opacity: 1,
    transition: {
      staggerChildren: cinematic ? 0.07 : 0.04,
      delayChildren: cinematic ? 0.1 : 0,
    },
  }),
}

const buttonRowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const previewVariants = {
  hidden: { opacity: 0 },
  visible: (cinematic: boolean) => ({
    opacity: 1,
    transition: { delay: cinematic ? 0.28 : 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function CreativePreview({ moment, entryMode = 'default', previewAreaRef }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeCreative = moment.creatives[activeIndex]
  const PreviewComponent = [LiveDataOverlay, BrandedHighlightFrame, FullTakeover][activeIndex]
  const isCinematic = entryMode === 'cinematic'

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={isCinematic}
    >
      {/* Format selector buttons — min 96px height; staggered fade-in */}
      <motion.div style={{ display: 'flex', gap: 16 }} variants={buttonRowVariants}>
        {FORMAT_LABELS.map((label, i) => (
          <motion.button
            key={label}
            variants={itemVariants}
            onClick={() => setActiveIndex(i)}
            onTouchStart={() => setActiveIndex(i)}
            style={{
              flex: 1,
              padding: '0 16px',
              borderRadius: 16,
              fontFamily: 'inherit',
              fontWeight: 800,
              textAlign: 'center',
              background: activeIndex === i ? moment.accentColor : 'rgba(255,255,255,0.08)',
              border: activeIndex === i ? 'none' : '1px solid rgba(255,255,255,0.12)',
              color: activeIndex === i ? '#000015' : 'rgba(255,255,255,0.55)',
              fontSize: 22,
              letterSpacing: '0.04em',
              minHeight: 96,
              boxShadow: activeIndex === i ? `0 0 28px ${moment.accentColor}55` : 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.2s, color 0.2s',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {i + 1}. {label}
          </motion.button>
        ))}
      </motion.div>

      {/* Preview area — fades in after the format buttons */}
      <motion.div
        ref={previewAreaRef}
        style={{ position: 'relative', flex: 1, borderRadius: 20, overflow: 'hidden', minHeight: 0 }}
        variants={previewVariants}
        initial="hidden"
        animate="visible"
        custom={isCinematic}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <PreviewComponent creative={activeCreative} accentColor={moment.accentColor} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
