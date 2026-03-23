import { motion } from 'framer-motion'

interface Props {
  accentColor: string
}

const PLACEHOLDER_TEXT = `Instead of just getting one event every time there's a controversial play, your ads are activated and served across the entire season. Every disputed call, every VAR review, every debate-worthy moment becomes an opportunity to reach engaged fans when they're most invested.`

export default function OwnTheSeasonExplanation({ accentColor }: Props) {
  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gap: 20,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        style={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        Own the Season
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
            fontSize: 24,
            lineHeight: 1.6,
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          {PLACEHOLDER_TEXT}
        </p>
        <div
          style={{
            marginTop: 28,
            paddingTop: 24,
            borderTop: `1px solid ${accentColor}40`,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: accentColor,
              fontSize: 18,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            The Difference
          </div>
          <p
            style={{
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 20,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            One moment vs. every moment. Your brand stays in the conversation all season long.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
