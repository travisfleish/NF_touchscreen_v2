import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Category, Moment, moments as momentsList } from '../data/moments'
import AnimatedBarsBackground from './AnimatedBarsBackground'
import { CategoryTileBarPattern, getCategoryPreviewImageUrl } from './CategoryTile'
import { colors } from '../tokens'
import { momentPackageDisplayLines } from '../utils/momentPackageLabel'

interface Props {
  category: Category
  onSelectMoment: (m: Moment, options?: { isDiscrete?: boolean; useMultiCinematic?: boolean }) => void
  onBack: () => void
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  )
}

export default function SelectMomentScreen({ category, onSelectMoment, onBack }: Props) {
  const entryMoment = category.moments[0]
  const accentColor = entryMoment?.accentColor ?? '#00ccff'
  const previewImageUrl = getCategoryPreviewImageUrl(category.id)

  const handleWorkflowStart = () => {
    if (!entryMoment) return
    // Temporary: championship-race uses same multi-video transition as rivalry (controversy flow)
    if (category.id === 'championship-race') {
      const controversyMoment = momentsList.find((m) => m.id === 'controversy')
      if (controversyMoment) {
        onSelectMoment(controversyMoment, { useMultiCinematic: true })
        return
      }
    }
    if (entryMoment.id === 'controversy') {
      onSelectMoment(entryMoment, { useMultiCinematic: true })
      return
    }
    onSelectMoment(entryMoment)
  }

  if (!entryMoment) return null

  const ctaLabel = category.workflowCtaLabel ?? 'View activation workflow'

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: colors.geniusBlue,
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
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 80,
          paddingRight: 168,
          paddingTop: 40,
          paddingBottom: 0,
          flexShrink: 0,
        }}
      >
        <div style={{ flexShrink: 0, width: 200 }}>
          <img
            src="/genius-sports-logo.png"
            alt="Genius Sports"
            style={{ height: 120, opacity: 0.98, display: 'block' }}
          />
        </div>

        <motion.button
          onClick={onBack}
          onTouchStart={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingLeft: 40,
            paddingRight: 40,
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.65)',
            borderRadius: 9999,
            height: 72,
            minHeight: 72,
            minWidth: 220,
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
          whileHover={{ background: 'rgba(255,255,255,0.17)', color: 'rgba(255,255,255,0.95)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          aria-label="Back to categories"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All categories
        </motion.button>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 40,
          paddingLeft: 80,
          paddingRight: 80,
          paddingTop: 28,
          paddingBottom: 40,
        }}
      >
        {/* Left: transparent copy on blue — vertically centered to match workflow card height */}
        <motion.div
          style={{
            flex: '1 1 52%',
            minWidth: 0,
            maxWidth: 720,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 0,
          }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.08 } }}
        >
          <div
            style={{
              maxHeight: '100%',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingRight: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'Klarheit', serif",
                fontWeight: 600,
                fontSize: 44,
                letterSpacing: '-0.01em',
                lineHeight: 1.08,
                color: '#ffffff',
                margin: '0 0 14px 0',
                whiteSpace: 'pre-line',
              }}
            >
              {momentPackageDisplayLines(category.name).join('\n')}
            </h2>

            <p
              style={{
                fontWeight: 400,
                fontSize: 16,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.78)',
                marginBottom: 14,
              }}
            >
              {category.description}
            </p>

            <p
              style={{
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.62)',
                marginBottom: 22,
              }}
            >
              {category.activationCopy}
            </p>

            <SectionLabel>Example moments</SectionLabel>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 22px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {category.exampleMoments.map((line) => (
                <li
                  key={line}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 15,
                    lineHeight: 1.4,
                    color: 'rgba(255,255,255,0.78)',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: accentColor,
                      marginTop: 6,
                      flexShrink: 0,
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.25)`,
                    }}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <SectionLabel>Sports & tournaments</SectionLabel>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {category.sportsAndTournaments.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.88)',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: 9999,
                    padding: '6px 12px',
                    lineHeight: 1.2,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: same image card as category grid, CTA as center headline */}
        <motion.div
          style={{
            flex: '1 1 44%',
            minWidth: 0,
            maxWidth: 720,
            display: 'flex',
            alignItems: 'stretch',
          }}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.14 } }}
        >
          <motion.button
            type="button"
            onClick={handleWorkflowStart}
            onTap={handleWorkflowStart}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: 380,
              borderRadius: 16,
              overflow: 'hidden',
              textAlign: 'left',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
            whileHover={{
              background: 'rgba(255,255,255,0.13)',
              borderColor: 'rgba(255,255,255,0.30)',
              transition: { duration: 0.18 },
            }}
            whileTap={{ scale: 0.97 }}
            aria-label={ctaLabel}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
              }}
            >
              <img
                src={previewImageUrl}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.35) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <CategoryTileBarPattern />

            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                padding: 24,
                pointerEvents: 'none',
                width: '88%',
              }}
            >
              <div
                style={{
                  fontFamily: "'Klarheit', serif",
                  fontWeight: 600,
                  fontSize: 34,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  textShadow: '0 2px 24px rgba(0,0,0,0.5)',
                }}
              >
                {ctaLabel}
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '55%',
                background: `linear-gradient(to top, ${accentColor}12 0%, transparent 100%)`,
                pointerEvents: 'none',
                borderRadius: 'inherit',
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '28px 28px 28px 28px',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontWeight: 400,
                  fontSize: 18,
                  letterSpacing: '0.02em',
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1.35,
                }}
              >
                {category.description}
              </div>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
