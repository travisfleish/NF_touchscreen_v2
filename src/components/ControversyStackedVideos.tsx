import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const VIDEO_SOURCES = ['/soccer-trim-1.mp4', '/soccer-trim-2.mp4', '/soccer-trim-3.mp4']
const FADE_DELAY_S = 2.5
const FADE_DURATION_S = 0.8

function StackedVideo({ src, index, isVisible }: { src: string; index: number; isVisible: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isVisible) {
      v.currentTime = 0
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [isVisible])

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: isVisible ? 1 : 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: FADE_DURATION_S, ease: [0.16, 1, 0.3, 1] }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          backgroundColor: '#0c0c0c',
        }}
      />
    </motion.div>
  )
}

export default function ControversyStackedVideos() {
  const [visibleIndex, setVisibleIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIndex((prev) => (prev + 1) % VIDEO_SOURCES.length)
    }, FADE_DELAY_S * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 200,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      {VIDEO_SOURCES.map((src, i) => (
        <StackedVideo key={src} src={src} index={i} isVisible={visibleIndex === i} />
      ))}
    </div>
  )
}
