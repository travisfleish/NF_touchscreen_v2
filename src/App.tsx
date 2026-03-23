import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { IDLE_TIMEOUT_MS } from './tokens'
import { Category, Moment } from './data/moments'
import IdleAttract from './components/IdleAttract'
import CategoryGrid from './components/CategoryGrid'
import SelectMomentScreen from './components/SelectMomentScreen'
import MomentDetail from './components/MomentDetail'
import CinematicTransition from './components/CinematicTransition'
import ControversyCinematicTransition from './components/ControversyCinematicTransition'
import KioskControls from './components/KioskControls'
import Stage from './components/Stage'
import OrientationGuard from './components/OrientationGuard'

const CINEMATIC_VIDEO_SRC = '/Moments Sample.mp4'

type Screen = 'idle' | 'select-category' | 'select-moment' | 'cinematic' | 'cinematic-multi' | 'detail'
type MomentVariant = 'discrete' | 'thematic'

const MORPH_FADEOUT_MS = 120

function MorphOverlay({
  targetRect,
  capturedFrameDataUrl,
  videoSrc,
  currentTime,
  onAnimationComplete,
}: {
  targetRect: DOMRect | null
  capturedFrameDataUrl: string | null
  videoSrc: string
  currentTime: number
  onAnimationComplete: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'morph' | 'fadeOut'>('morph')

  useEffect(() => {
    if (capturedFrameDataUrl) return
    const v = videoRef.current
    if (v) v.currentTime = currentTime
  }, [currentTime, capturedFrameDataUrl])

  const fullScreen = {
    left: 0,
    top: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }

  // Round to integers so the overlay's final position matches layout (avoids sub-pixel jump on unmount)
  const roundedTarget = targetRect
    ? {
        left: Math.round(targetRect.left),
        top: Math.round(targetRect.top),
        width: Math.round(targetRect.width),
        height: Math.round(targetRect.height),
      }
    : null

  return (
    <motion.div
      style={{
        position: 'fixed',
        zIndex: 9999,
        overflow: 'hidden',
        borderRadius: roundedTarget ? 16 : 0, // match detail media container for seamless handoff
      }}
      initial={fullScreen}
      animate={{
        ...(roundedTarget ?? fullScreen),
        opacity: phase === 'fadeOut' ? 0 : 1,
      }}
      transition={{
        left: { duration: 0.6, ease: [0.33, 0, 0.2, 1] },
        top: { duration: 0.6, ease: [0.33, 0, 0.2, 1] },
        width: { duration: 0.6, ease: [0.33, 0, 0.2, 1] },
        height: { duration: 0.6, ease: [0.33, 0, 0.2, 1] },
        opacity: phase === 'fadeOut' ? { duration: MORPH_FADEOUT_MS / 1000, ease: 'easeOut' } : { duration: 0 },
      }}
      onAnimationComplete={() => {
        if (!targetRect) return
        if (phase === 'morph') {
          // Smooth handoff: fade out overlay over the in-page media so there's no visible jump
          setPhase('fadeOut')
          return
        }
        onAnimationComplete()
      }}
    >
      {capturedFrameDataUrl ? (
        <img
          src={capturedFrameDataUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </motion.div>
  )
}

function getInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === '1' ? 'select-category' : 'idle'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<MomentVariant>('discrete')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const screenRef = useRef(screen)
  screenRef.current = screen

  const [morphState, setMorphState] = useState<{ currentTime: number } | null>(null)
  const [detailVideoPauseTime, setDetailVideoPauseTime] = useState<number | null>(null)
  const [capturedFrameDataUrl, setCapturedFrameDataUrl] = useState<string | null>(null)
  const mediaContainerRef = useRef<HTMLDivElement>(null)
  const [morphTargetRect, setMorphTargetRect] = useState<DOMRect | null>(null)
  const fromCinematicFlow = detailVideoPauseTime != null

  const resetToIdle = useCallback(() => {
    setScreen('idle')
    setSelectedCategory(null)
    setSelectedMoment(null)
    setSelectedVariant('discrete')
    setMorphState(null)
    setDetailVideoPauseTime(null)
    setCapturedFrameDataUrl(null)
    setMorphTargetRect(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const scheduleIdleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (screenRef.current !== 'idle') {
      timerRef.current = setTimeout(resetToIdle, IDLE_TIMEOUT_MS)
    }
  }, [resetToIdle])

  useEffect(() => {
    if (screen !== 'idle') {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(resetToIdle, IDLE_TIMEOUT_MS)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [screen, resetToIdle])

  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown'] as const
    events.forEach(e => window.addEventListener(e, scheduleIdleReset, { passive: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, scheduleIdleReset))
    }
  }, [scheduleIdleReset])

  const handleSelectMoment = useCallback((m: Moment, options?: { isDiscrete?: boolean; useMultiCinematic?: boolean }) => {
    setSelectedMoment(m)
    if (options?.useMultiCinematic) {
      setSelectedVariant('discrete')
      setScreen('cinematic-multi')
      return
    }
    const isThematic = options?.isDiscrete === false
    setSelectedVariant(isThematic ? 'thematic' : 'discrete')
    setScreen(options?.isDiscrete ? 'cinematic' : 'detail')
  }, [])

  const handleBackToSelect = useCallback(() => {
    setScreen('select-category')
    setSelectedCategory(null)
    setSelectedMoment(null)
    setSelectedVariant('discrete')
    setMorphState(null)
    setDetailVideoPauseTime(null)
    setCapturedFrameDataUrl(null)
    setMorphTargetRect(null)
  }, [])

  const handleCinematicComplete = useCallback((videoCurrentTime: number, frameDataUrl: string | null) => {
    setDetailVideoPauseTime(videoCurrentTime)
    setCapturedFrameDataUrl(frameDataUrl)
    // Morph disabled: use simple fade out of "Moment Detected" then fade in of detail (no overlay)
    // setMorphState({ currentTime: videoCurrentTime })
    setScreen('detail')
  }, [])

  const handleMediaContainerReady = useCallback((rect: DOMRect) => {
    setMorphTargetRect(rect)
  }, [])

  const handleMorphComplete = useCallback(() => {
    setMorphState(null)
    setMorphTargetRect(null)
    // keep detailVideoPauseTime so the embedded video in MomentDetail stays visible
  }, [])

  return (
    <OrientationGuard>
      <Stage>
        {/* Stage root — 1920×1080 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0000dc',
            overflow: 'hidden',
          }}
        >
          <KioskControls onReset={resetToIdle} />
          <AnimatePresence mode="wait">
            {screen === 'idle' && (
              <IdleAttract key="idle" onEngage={() => setScreen('select-category')} />
            )}
            {screen === 'select-category' && (
              <CategoryGrid
                key="select-category"
                onSelect={(cat) => {
                  setSelectedCategory(cat)
                  setScreen('select-moment')
                }}
              />
            )}
            {screen === 'select-moment' && selectedCategory && (
              <SelectMomentScreen
                key={`select-moment-${selectedCategory.id}`}
                category={selectedCategory}
                onSelectMoment={handleSelectMoment}
                onBack={handleBackToSelect}
              />
            )}
            {screen === 'cinematic' && selectedMoment && (
              <CinematicTransition
                key="cinematic"
                moment={selectedMoment}
                onComplete={handleCinematicComplete}
              />
            )}
            {screen === 'cinematic-multi' && selectedMoment && (
              <ControversyCinematicTransition
                key="cinematic-multi"
                moment={selectedMoment}
                onComplete={handleCinematicComplete}
              />
            )}
            {screen === 'detail' && selectedMoment && (
              <MomentDetail
                key={`detail-${selectedMoment.id}`}
                moment={selectedMoment}
                onBack={handleBackToSelect}
                variant={selectedVariant}
                entryMode={fromCinematicFlow ? 'cinematic' : selectedVariant === 'thematic' ? 'thematic' : 'default'}
                mediaContainerRef={fromCinematicFlow ? mediaContainerRef : undefined}
                videoPauseTime={detailVideoPauseTime ?? undefined}
                capturedFrameDataUrl={capturedFrameDataUrl ?? undefined}
                onMediaContainerReady={fromCinematicFlow ? handleMediaContainerReady : undefined}
              />
            )}
          </AnimatePresence>

          {/* Morph overlay: full-screen video stays visible then shrinks into detail's media container */}
          {morphState &&
            createPortal(
              <MorphOverlay
                targetRect={morphTargetRect}
                capturedFrameDataUrl={capturedFrameDataUrl}
                videoSrc={CINEMATIC_VIDEO_SRC}
                currentTime={morphState.currentTime}
                onAnimationComplete={handleMorphComplete}
              />,
              document.body
            )}
        </div>
      </Stage>
    </OrientationGuard>
  )
}
