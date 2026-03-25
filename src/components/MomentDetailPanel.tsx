import { motion } from 'framer-motion'
import { SportMoment } from '../data/sportsData'

interface MomentDetailPanelProps {
  moment: SportMoment
  onClose: () => void
}

export default function MomentDetailPanel({ moment, onClose }: MomentDetailPanelProps) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(2, 8, 36, 0.48)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 70,
        padding: '80px 120px',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
      onClick={onClose}
    >
      <motion.div
        style={{
          width: 1020,
          maxWidth: '100%',
          borderRadius: 28,
          background: 'rgb(12, 28, 105)',
          border: '1px solid rgba(170,198,255,0.26)',
          boxShadow: '0 0 70px rgba(27,76,255,0.35), inset 0 0 1px rgba(255,255,255,0.25)',
          color: '#fff',
          padding: '44px 50px 40px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'var(--font-body)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.2, 0.9, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <motion.button
          type="button"
          onClick={onClose}
          onTouchStart={onClose}
          style={{
            position: 'absolute',
            right: 24,
            top: 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 26,
            lineHeight: 1,
          }}
          whileHover={{ background: 'rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.92 }}
          aria-label="Close moment details"
        >
          ×
        </motion.button>

        <h2
          style={{
            margin: 0,
            marginBottom: 22,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontSize: 60,
            fontFamily: 'var(--font-header)',
            maxWidth: 860,
            position: 'relative',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#e1ff67',
              marginBottom: 12,
              fontFamily: 'var(--font-header)',
            }}
          >
            Moment:
          </span>
          {moment.name}
        </h2>

        <p
          style={{
            margin: 0,
            marginBottom: 20,
            color: 'rgba(230,239,255,0.95)',
            fontSize: 30,
            lineHeight: 1.35,
            fontWeight: 500,
            position: 'relative',
          }}
        >
          <strong style={{ color: '#fff', fontWeight: 700 }}>Trigger:</strong> {moment.trigger}
        </p>

        <p
          style={{
            margin: 0,
            marginBottom: moment.examples?.length ? 24 : 0,
            color: 'rgba(221,234,255,0.9)',
            fontSize: 27,
            lineHeight: 1.45,
            fontWeight: 400,
            position: 'relative',
          }}
        >
          {moment.description}
        </p>

        {moment.examples && moment.examples.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, position: 'relative' }}>
            {moment.examples.map((example) => (
              <span
                key={example}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 44,
                  borderRadius: 22,
                  padding: '0 18px',
                  border: '1px solid rgba(158,190,255,0.35)',
                  background: 'rgba(118,158,255,0.16)',
                  color: 'rgba(241,247,255,0.95)',
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {example}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
