import { motion } from 'framer-motion'
import { Category, categories } from '../data/moments'
import CategoryTile from './CategoryTile'
import AnimatedBarsBackground from './AnimatedBarsBackground'

interface Props {
  onSelect: (c: Category) => void
}

export default function CategoryGrid({ onSelect }: Props) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#0000dc',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <AnimatedBarsBackground dimmed />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'flex-start',
          paddingLeft: 80,
          paddingRight: 80,
          paddingTop: 40,
          paddingBottom: 0,
        }}
      >
        <div style={{ flexShrink: 0, width: 200 }}>
          <img
            src="/genius-sports-logo.png"
            alt="Genius Sports"
            style={{ height: 120, opacity: 0.98, display: 'block' }}
          />
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <motion.div
        style={{
          position: 'relative',
          zIndex: 11,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: -40,
          paddingBottom: 48,
        }}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }}
      >
        <h2
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            color: '#ffffff',
            fontSize: 72,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          Select a category
        </h2>
        <p
          style={{
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            fontSize: 28,
            letterSpacing: '0.01em',
            marginBottom: 8,
          }}
        >
          Then choose a moment to explore
        </p>
      </motion.div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 140,
          paddingRight: 140,
          paddingBottom: 48,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            flex: 1,
            minHeight: 0,
          }}
        >
          {categories.map((category, index) => (
            <CategoryTile
              key={category.id}
              category={category}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div
          style={{
            flexShrink: 0,
            paddingTop: 48,
          }}
        >
          <p
            style={{
              fontFamily: "'Klarheit', serif",
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.3,
              textAlign: 'center',
              margin: 0,
            }}
          >
            See the game. Know the fan. Win the moment.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
