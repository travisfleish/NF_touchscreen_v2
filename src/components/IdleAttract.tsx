import { motion } from 'framer-motion'
import AnimatedBarsBackground from './AnimatedBarsBackground'
import FloatingDataChips from './FloatingDataChips'

interface Props {
  onEngage: () => void
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } },
}

const textVariants = {
  initial: { opacity: 0, y: 40 },
  animate: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  }),
}

const STRIP_ITEMS = [
  'Official League Data',
  'Always On Emotional Tracking',
  'Genius Moment Deal IDs',
  "Women's Sports Moments",
]

export default function IdleAttract({ onEngage }: Props) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0000ff 0%, #0000b8 50%, #000090 100%)',
        cursor: 'pointer',
      }}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onEngage}
      onTouchStart={onEngage}
    >
      <AnimatedBarsBackground />
      <FloatingDataChips />

      {/* Top-left: prominent Genius logo */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 20,
          paddingTop: 48,
          paddingLeft: 56,
        }}
        custom={0.1}
        variants={textVariants}
        initial="initial"
        animate="animate"
      >
        <img
          src="/genius-sports-logo.png"
          alt="Genius Sports"
          style={{ height: 120, opacity: 0.98, display: 'block' }}
        />
      </motion.div>

      {/* Center content — max width within safe area */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 1100,
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        {/* Main headline */}
        <motion.h1
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1,
            marginBottom: 32,
            fontSize: 156,
            letterSpacing: '-0.02em',
            textShadow: '0 0 80px rgba(100,120,255,0.6)',
          }}
          custom={0.25}
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          Genius Moments
          <br />
          <span style={{ color: 'rgba(255,255,255,0.9)' }}>Explorer</span>
        </motion.h1>

        {/* Divider */}
        <motion.div
          style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.45)', borderRadius: 2, marginBottom: 40 }}
          custom={0.4}
          variants={textVariants}
          initial="initial"
          animate="animate"
        />

        {/* Subhead */}
        <motion.p
          style={{
            fontWeight: 500,
            color: '#fff',
            marginBottom: 72,
            fontSize: 40,
            opacity: 0.65,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
          custom={0.5}
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          Tap anywhere to explore examples of Genius Moments Packages
        </motion.p>
      </div>

      {/* Bottom data strip */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 120,
          paddingRight: 120,
          paddingTop: 28,
          paddingBottom: 28,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        {STRIP_ITEMS.map((item) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'rgba(100,200,255,0.6)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 20,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
