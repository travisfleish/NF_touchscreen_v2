import React, { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Moment } from '../data/moments'
import AnimatedBarsBackground from './AnimatedBarsBackground'
import CreativePreview from './CreativePreview'
import ControversyStackedVideos from './ControversyStackedVideos'
import ActivatingAudiencesStepTwoPanel from './ActivatingAudiencesStepTwoPanel'
import OwnTheSeasonExplanation from './OwnTheSeasonExplanation'

interface Props {
  moment: Moment
  onBack: () => void
  /** 'thematic' = Own the Season (direct to detail + left-side season viz); 'discrete' = Own the Game */
  variant?: 'discrete' | 'thematic'
  /** When 'cinematic', left column includes media container for morphed video; 'thematic' = smooth direct transition */
  entryMode?: 'default' | 'cinematic' | 'thematic'
  mediaContainerRef?: React.RefObject<HTMLDivElement>
  /** Paused time for the embedded video when entering from cinematic */
  videoPauseTime?: number
  /** Exact final frame from full-screen "Moment Detected" for left media (same frame, no fallback) */
  capturedFrameDataUrl?: string
  /** Called when the left media container is mounted so parent can measure for morph target */
  onMediaContainerReady?: (rect: DOMRect) => void
  onMorphComplete?: () => void
}

const PROOF_POINTS = [
  { val: '3', label: 'Creative Formats' },
  { val: 'Live', label: 'Detection' },
  { val: 'API', label: 'Ready' },
]

export default function MomentDetail({
  moment,
  onBack,
  variant = 'discrete',
  entryMode = 'default',
  mediaContainerRef,
  videoPauseTime,
  capturedFrameDataUrl,
  onMediaContainerReady,
}: Props) {
  const thematicMediaRef = useRef<HTMLDivElement>(null)
  const creativePreviewAreaRef = useRef<HTMLDivElement | null>(null)
  const stepTwoAlignRef = useRef<HTMLDivElement>(null)
  const [stepTwoAlignNudgePx, setStepTwoAlignNudgePx] = useState(0)
  const isThematic = variant === 'thematic'
  /** Controversy multi-video cinematic: final detail uses Step 2 (activating audiences) left / Step 3 creatives right */
  const isControversyCinematicActivatingDetail =
    !isThematic && moment.id === 'controversy' && entryMode === 'cinematic'

  useLayoutEffect(() => {
    if (!isControversyCinematicActivatingDetail) {
      setStepTwoAlignNudgePx(0)
      return
    }
    const alignStepTwoToPreview = () => {
      const previewEl = creativePreviewAreaRef.current
      const stepEl = stepTwoAlignRef.current
      if (!previewEl || !stepEl) return
      const pr = previewEl.getBoundingClientRect()
      const sr = stepEl.getBoundingClientRect()
      const previewMid = pr.top + pr.height / 2
      const stepMid = sr.top + sr.height / 2
      setStepTwoAlignNudgePx(previewMid - stepMid)
    }
    alignStepTwoToPreview()
    const ro = new ResizeObserver(alignStepTwoToPreview)
    if (creativePreviewAreaRef.current) ro.observe(creativePreviewAreaRef.current)
    if (stepTwoAlignRef.current) ro.observe(stepTwoAlignRef.current)
    window.addEventListener('resize', alignStepTwoToPreview)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', alignStepTwoToPreview)
    }
  }, [isControversyCinematicActivatingDetail, moment.id])

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(145deg, #0000cc 0%, #00009a 40%, #000070 100%)',
      }}
      initial={
        entryMode === 'cinematic'
          ? { opacity: 0 }
          : entryMode === 'thematic'
            ? { opacity: 0, scale: 0.98 }
            : { opacity: 0, scale: 1.03 }
      }
      animate={
        entryMode === 'cinematic'
          ? { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } }
          : entryMode === 'thematic'
            ? { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
            : { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
      }
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
    >
      <AnimatedBarsBackground dimmed />

      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 55% 70% at 75% 50%, ${moment.accentColor}15 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top bar — ~120px; extra right padding so "All Moments" doesn't overlap the return-to-home circular button (72px + 16px gap) */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 80,
          paddingRight: 168,
          paddingTop: 44,
          paddingBottom: 28,
        }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
      >
        {/* Logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src="/genius-sports-logo.png" alt="Genius Sports" style={{ height: 40, opacity: 0.9 }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 20,
              }}
            >
              Genius Moments
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span
              style={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#00ccff',
                fontSize: 20,
              }}
            >
              {moment.label}
            </span>
          </div>
        </div>

        {/* Back button — large, touch-safe */}
        <motion.button
          onClick={onBack}
          onTouchStart={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingLeft: 40,
            paddingRight: 40,
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.65)',
            borderRadius: 9999,
            height: 72,
            minHeight: 72,
            minWidth: 220,
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
          whileHover={{ background: 'rgba(255,255,255,0.17)', color: 'rgba(255,255,255,0.95)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          aria-label="Back to moment selection"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All Moments
        </motion.button>
      </motion.div>

      {/* Divider */}
      <div style={{ position: 'relative', zIndex: 10, marginLeft: 80, marginRight: 80, marginBottom: 28, height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* Two-column body — no scroll when thematic so video constellation is fully in view */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          gap: 48,
          paddingLeft: 80,
          paddingRight: 80,
          paddingBottom: 60,
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: isThematic ? 'hidden' : 'auto',
        }}
      >
        {/* LEFT — Title/description block; for thematic, season-long activation viz below */}
        <motion.div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent:
              isControversyCinematicActivatingDetail
                ? 'flex-start'
                : entryMode === 'cinematic'
                  ? 'flex-start'
                  : isThematic
                    ? 'flex-start'
                    : 'center',
            gap: 24,
            minHeight: 0,
          }}
          initial={
            entryMode === 'cinematic'
              ? { opacity: 0 }
              : entryMode === 'thematic'
                ? { opacity: 0, x: -20 }
                : { opacity: 0, x: -28 }
          }
          animate={{
            opacity: 1,
            x: 0,
            transition: {
              delay: entryMode === 'cinematic' ? 0 : entryMode === 'thematic' ? 0.08 : 0.2,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
        >
          {isControversyCinematicActivatingDetail ? (
            <div
              ref={stepTwoAlignRef}
              style={{ width: '100%', marginTop: stepTwoAlignNudgePx }}
            >
              <ActivatingAudiencesStepTwoPanel />
            </div>
          ) : (
            <>
          {/* Content block — compact when thematic to maximize video constellation space */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isThematic ? 12 : 24,
              flexShrink: 0,
            }}
          >
          {/* Label badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: isThematic ? 8 : 28 }}>
            <div
              style={{
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 9999,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                background: 'rgba(0,204,255,0.12)',
                border: '1px solid rgba(0,204,255,0.35)',
                color: '#00ccff',
                fontSize: 22,
              }}
            >
              {moment.label}
            </div>
            <motion.div
              style={{ width: 12, height: 12, borderRadius: '50%', background: moment.accentColor }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Moment name (title) — smaller for thematic so video constellation fits without scroll */}
          <h1
            style={{
              fontFamily: "'Klarheit', serif",
              fontWeight: 600,
              color: '#fff',
              lineHeight: 0.95,
              marginBottom: isThematic ? 8 : 28,
              fontSize: isThematic ? 48 : 108,
              letterSpacing: '-0.02em',
              textShadow: `0 0 80px ${moment.accentColor}50`,
            }}
          >
            {moment.name}
          </h1>

          {/* Hook */}
          <p
            style={{
              fontWeight: 500,
              color: '#fff',
              marginBottom: isThematic ? 12 : 32,
              fontSize: isThematic ? 20 : 28,
              lineHeight: 1.5,
              opacity: 0.65,
              maxWidth: 560,
            }}
          >
            {moment.hook}
          </p>

          {/* Accent divider — hide for thematic */}
          {!isThematic && (
          <div
            style={{
              marginBottom: 32,
              width: 64,
              height: 3,
              background: moment.accentColor,
              borderRadius: 2,
              opacity: 0.8,
            }}
          />
          )}

          {/* Detection Trigger — hidden for thematic */}
          {!isThematic && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 20,
                marginBottom: 12,
              }}
            >
              Detection Trigger
            </div>
            <div
              style={{
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.55,
                fontSize: 24,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: '20px 28px',
              }}
            >
              {moment.trigger}
            </div>
          </div>
          )}

          {/* Proof point stats — hidden for thematic */}
          {!isThematic && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
          >
            {PROOF_POINTS.map(item => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  paddingTop: 20,
                  paddingBottom: 20,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ fontWeight: 900, color: '#fff', fontSize: 36, lineHeight: 1 }}>{item.val}</div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', marginTop: 6 }}>{item.label}</div>
              </div>
            ))}
          </motion.div>
          )}

          </div>

          {/* Thematic only: three stacked videos that sequentially fade in */}
          {isThematic && (
            <motion.div
              ref={thematicMediaRef}
              style={{
                flex: 1,
                minHeight: 0,
                marginTop: 4,
                position: 'relative',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ControversyStackedVideos />
            </motion.div>
          )}
            </>
          )}

        </motion.div>

        {/* RIGHT — Creative Units (discrete) or Own the Season explanation (thematic) */}
        <motion.div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          initial={{ opacity: 0, x: 28 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: {
              delay: entryMode === 'cinematic' ? 0.5 : 0.28,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
        >
          {isThematic ? (
            <OwnTheSeasonExplanation accentColor={moment.accentColor} />
          ) : (
            <>
              {isControversyCinematicActivatingDetail && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 20,
                      marginBottom: 10,
                    }}
                  >
                    Step three
                  </div>
                  <p
                    style={{
                      margin: 0,
                      maxWidth: 520,
                      fontWeight: 500,
                      fontSize: 22,
                      lineHeight: 1.45,
                      color: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.92)' }}>Ads served.</span>{' '}
                    Within your existing workflow in premium inventory.
                  </p>
                </div>
              )}
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span
                  style={{
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 20,
                  }}
                >
                  Creative Units
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <CreativePreview
                  moment={moment}
                  entryMode={entryMode === 'cinematic' ? 'cinematic' : 'default'}
                  previewAreaRef={
                    isControversyCinematicActivatingDetail
                      ? (el) => {
                          creativePreviewAreaRef.current = el
                        }
                      : undefined
                  }
                />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
