import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moment } from '../data/moments'
import {
  CINEMATIC_DETECTING_DELAY_MS,
  CINEMATIC_DETECTED_DISPLAY_MS,
  CINEMATIC_ACTIVATING_SCROLL_MS,
  CINEMATIC_ACTIVATING_HOLD_MS,
} from '../tokens'
import { AnimatedFanCloud } from './AnimatedFanCloud'
import { ActivatingAudiencesReel } from './ActivatingAudiencesReel'

const SCANLINE_SWEEP_DURATION_S = CINEMATIC_DETECTING_DELAY_MS / 1000
/** Keyframe times: 0 = start, 0.8 = hit right edge, 1 = bounce back ~25% complete */
const SCANLINE_KEYFRAME_TIMES: number[] = [0, 0.8, 1]

const CINEMATIC_VIDEO_SRC = '/Moments Sample.mp4'

/** After reel resolves: overlay fades out, full SVG comes into focus before transition */
const ACTIVATING_FOCUS_MS = 1200

type Phase = 'playing' | 'detecting' | 'detected' | 'activating'

interface Props {
  moment: Moment
  onComplete: (videoCurrentTime: number, capturedFrameDataUrl: string | null) => void
}

function Spinner() {
  return (
    <motion.div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#fff',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      aria-hidden
    />
  )
}

function CheckMark() {
  return (
    <motion.div
      style={{ width: 64, height: 64 }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, opacity: { duration: 0.2 } }}
      aria-hidden
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <motion.path
          d="M18 32l10 10 18-22"
          fill="none"
          stroke="rgba(0,204,255,0.95)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ pathLength: { duration: 0.4, delay: 0.1, ease: 'easeOut' } }}
        />
      </svg>
    </motion.div>
  )
}

export default function CinematicTransition({ moment, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>('playing')
  /** After reel + hold: overlay fades, full SVG comes into focus before transition */
  const [activatingFocus, setActivatingFocus] = useState(false)
  /** When entering activating: captured frame and video time for onComplete after reel + hold + focus */
  const [activatingPayload, setActivatingPayload] = useState<{
    videoCurrentTime: number
    capturedFrameDataUrl: string | null
  } | null>(null)

  const handleEnded = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    setPhase('detecting')
  }, [])

  useEffect(() => {
    if (phase !== 'detecting') return
    const t = setTimeout(() => setPhase('detected'), CINEMATIC_DETECTING_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase])

  // After "Moment Detected" hold: capture frame, pause video, move to Activating Audiences
  useEffect(() => {
    if (phase !== 'detected') return
    const t = setTimeout(() => {
      const video = videoRef.current
      if (!video) return
      let capturedFrameDataUrl: string | null = null
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          capturedFrameDataUrl = canvas.toDataURL('image/jpeg', 0.92)
        }
      } catch (_) {
        // ignore capture failure
      }
      video.pause()
      setActivatingPayload({ videoCurrentTime: video.currentTime, capturedFrameDataUrl })
      setPhase('activating')
    }, CINEMATIC_DETECTED_DISPLAY_MS)
    return () => clearTimeout(t)
  }, [phase])

  // Reset focus state when leaving activating
  useEffect(() => {
    if (phase !== 'activating') setActivatingFocus(false)
  }, [phase])

  // After reel scroll + hold: enter focus phase (overlay fades, SVG comes into focus)
  useEffect(() => {
    if (phase !== 'activating') return
    const reelAndHoldMs = CINEMATIC_ACTIVATING_SCROLL_MS + CINEMATIC_ACTIVATING_HOLD_MS
    const t = setTimeout(() => setActivatingFocus(true), reelAndHoldMs)
    return () => clearTimeout(t)
  }, [phase])

  // After focus phase, transition to detail
  useEffect(() => {
    if (phase !== 'activating' || !activatingPayload || !activatingFocus) return
    const t = setTimeout(() => {
      onComplete(activatingPayload.videoCurrentTime, activatingPayload.capturedFrameDataUrl)
    }, ACTIVATING_FOCUS_MS)
    return () => clearTimeout(t)
  }, [phase, activatingPayload, activatingFocus, onComplete])

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* Full-screen video — hidden during activating (replaced by AnimatedFanCloud) */}
      <video
        ref={videoRef}
        src={CINEMATIC_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          visibility: phase === 'activating' ? 'hidden' : 'visible',
        }}
        aria-label="Moment sample playback"
      />

      {/* Activating background: AnimatedFanCloud replaces frozen video frame */}
      {phase === 'activating' && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          aria-hidden
          initial={false}
          animate={{
            scale: activatingFocus ? [0.98, 1.02, 1] : 1,
          }}
          transition={
            activatingFocus
              ? {
                  scale: {
                    duration: ACTIVATING_FOCUS_MS / 1000,
                    times: [0, 0.35, 1],
                    ease: 'easeOut',
                  },
                }
              : {}
          }
        >
          <AnimatedFanCloud
            animate
            mode="graph-build"
            alt="Audience network visualization"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              minHeight: 0,
            }}
          />
        </motion.div>
      )}

      {/* Base overlay + sweeping scan line — only when detecting/detected */}
      <AnimatePresence>
        {(phase === 'detecting' || phase === 'detected') && (
          <motion.div
            key="detection-overlay"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(40,10,30,0.5) 0%, rgba(60,20,40,0.6) 50%, rgba(30,5,25,0.7) 100%)',
              }}
            />
            {/* Sweeping scan line — full pass L→R, hits right edge then bounces back ~25%; then "Moment Detected" */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '28%',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(0,204,255,0.12) 35%, rgba(0,204,255,0.28) 50%, rgba(0,204,255,0.12) 65%, transparent 100%)',
              }}
              initial={{ left: '-28%' }}
              animate={{
                left: ['-28%', '100%', '75%'],
                transition: {
                  duration: SCANLINE_SWEEP_DURATION_S,
                  times: SCANLINE_KEYFRAME_TIMES,
                  ease: ['linear', 'easeOut'],
                  repeat: 0,
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activating Audiences overlay: reel + label; fades out when focus phase begins */}
      <AnimatePresence>
        {phase === 'activating' && (
          <motion.div
            key="activating-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: activatingFocus ? 0 : 1,
              transition: activatingFocus
                ? { duration: 0.35, ease: 'easeOut' }
                : { duration: 0.4 },
            }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.85)',
                textTransform: 'uppercase',
              }}
            >
              ACTIVATING AUDIENCES
            </div>
            <ActivatingAudiencesReel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal moment label — visible during playback and detecting/detected; hidden during activating */}
      {phase !== 'activating' && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            right: 80,
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
        >
        <div
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            fontSize: 48,
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'pre-line',
          }}
        >
          {moment.name}
        </div>
        <div
          style={{
            marginTop: 8,
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {moment.label}
        </div>
        </motion.div>
      )}

      {/* Centered detection overlay — after video ends */}
      <AnimatePresence>
        {(phase === 'detecting' || phase === 'detected') && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              background: 'rgba(0,0,0,0.35)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              {phase === 'detecting' && (
                <motion.div
                  key="detecting"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Spinner />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 28,
                      letterSpacing: '0.04em',
                      color: '#fff',
                    }}
                  >
                    Detecting Moment…
                  </div>
                </motion.div>
              )}
              {phase === 'detected' && (
                <motion.div
                  key="detected"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 20,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.35 } }}
                  exit={{ opacity: 0 }}
                >
                  <CheckMark />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 32,
                      letterSpacing: '0.06em',
                      color: '#fff',
                      textShadow: '0 0 40px rgba(0,204,255,0.4)',
                    }}
                  >
                    Moment Detected
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
