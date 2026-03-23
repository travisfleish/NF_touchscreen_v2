import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moment } from '../data/moments'
import { CONTROVERSY_DETECTED_DISPLAY_MS } from '../tokens'

const VIDEO_SOURCES = ['/soccer-trim-1.mp4', '/soccer-trim-2.mp4', '/soccer-trim-3.mp4']

interface Props {
  moment: Moment
  onComplete: (videoCurrentTime: number, capturedFrameDataUrl: string | null) => void
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

export default function ControversyCinematicTransition({ moment, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIndex, setVideoIndex] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'detected'>('playing')

  const handleEnded = useCallback(() => {
    setPhase('detected')
  }, [])

  useEffect(() => {
    if (phase !== 'detected') return
    const t = setTimeout(() => {
      if (videoIndex < VIDEO_SOURCES.length - 1) {
        setVideoIndex((i) => i + 1)
        setPhase('playing')
      } else {
        onComplete(0, null)
      }
    }, CONTROVERSY_DETECTED_DISPLAY_MS)
    return () => clearTimeout(t)
  }, [phase, videoIndex, onComplete])

  useEffect(() => {
    const v = videoRef.current
    if (!v || phase !== 'playing') return
    v.currentTime = 0
    const play = () => v.play().catch(() => {})
    if (v.readyState >= 2) play()
    else v.addEventListener('loadeddata', play, { once: true })
    return () => v.removeEventListener('loadeddata', play)
  }, [videoIndex, phase])

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
      <video
        key={videoIndex}
        ref={videoRef}
        src={VIDEO_SOURCES[videoIndex]}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
        }}
        aria-label="Moment sample playback"
      />

      {/* Moment label — bottom */}
      {phase === 'playing' && (
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
            Moment {videoIndex + 1} of {VIDEO_SOURCES.length}
          </div>
        </motion.div>
      )}

      {/* Quick "Moment Detected" overlay */}
      <AnimatePresence>
        {phase === 'detected' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              background: 'rgba(0,0,0,0.35)',
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
  )
}
