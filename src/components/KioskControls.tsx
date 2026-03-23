import { motion } from 'framer-motion'

interface Props {
  onReset: () => void
}

export default function KioskControls({ onReset }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 44,
        right: 80,
        zIndex: 100,
      }}
    >
      <motion.button
        onClick={onReset}
        onTouchStart={onReset}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.22)',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
        whileTap={{ scale: 0.90 }}
        whileHover={{
          background: 'rgba(255,255,255,0.18)',
          color: '#ffffff',
        }}
        transition={{ duration: 0.15 }}
        aria-label="Reset to home screen"
      >
        {/* Refresh / reset icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </motion.button>
    </div>
  )
}
