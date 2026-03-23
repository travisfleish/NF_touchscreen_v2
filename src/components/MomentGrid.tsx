import { motion } from 'framer-motion'
import { Moment, moments } from '../data/moments'
import MomentTile from './MomentTile'
import MomentsTextCarousel from './MomentsTextCarousel'
import AnimatedBarsBackground from './AnimatedBarsBackground'

const FEATURED_COUNT = 2
const featuredMoments = moments.slice(0, FEATURED_COUNT)
const carouselMoments = moments.slice(FEATURED_COUNT)

interface Props {
  onSelect: (m: Moment, options?: { isDiscrete?: boolean; useMultiCinematic?: boolean }) => void
}

/** Titles for the two featured tiles (discrete vs thematic moment) */
const TITLES = {
  discrete: { headline: 'BUZZER BEATER', subheading: 'The shot that silences arenas. One trigger, maximum impact.' },
  thematic: { headline: 'CONTROVERSY', subheading: 'The playoff narrative — history made live, moment by moment.' },
}

export default function MomentGrid({ onSelect }: Props) {

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

      {/* Top bar: logo left only — return button is in KioskControls (top right) */}
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

      {/* Title, subtitle, toggle — bleed up into header so cards get more height */}
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
          Select a Moment
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
          See the Genius Moment Engine in action
        </p>
      </motion.div>

      {/* Two featured moments + scrolling carousel — wider side padding so cards are less wide / more card-like */}
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
        {/* Two moment tiles — discrete (left) and thematic (right); labels inside cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            flex: 1,
            minHeight: 0,
          }}
        >
          <MomentTile
            key={featuredMoments[0].id}
            moment={featuredMoments[0]}
            index={0}
            onSelect={(m) => onSelect(m, { isDiscrete: true })}
            sectionLabel="Own the Game"
            categoryLabel="Discrete"
            headline={TITLES.discrete.headline}
            subheading={TITLES.discrete.subheading}
            previewImageUrl="/buzzer-beater.jpg"
          />
          <MomentTile
            key={featuredMoments[1].id}
            moment={featuredMoments[1]}
            index={1}
            onSelect={(m) => onSelect(m, { useMultiCinematic: true })}
            sectionLabel="Own the Season"
            categoryLabel="Thematic"
            headline={TITLES.thematic.headline}
            subheading={TITLES.thematic.subheading}
            previewImageUrl="/soccer-thumbnail.png"
          />
        </div>

        {/* Footer block: tagline + carousel grouped together, with clear separation from cards above */}
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
              paddingBottom: 10,
            }}
          >
            See the game. Know the fan. Win the moment.
          </p>
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 12,
            }}
          >
            <MomentsTextCarousel moments={carouselMoments} onSelect={(m) => onSelect(m)} />
          </div>
        </div>
      </div>

    </motion.div>
  )
}
