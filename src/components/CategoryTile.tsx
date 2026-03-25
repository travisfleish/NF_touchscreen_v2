import { motion } from 'framer-motion'
import { Category } from '../data/moments'

/** Preview image URL for category; uses local assets for championship/rivalry, else placeholder */
export function getCategoryPreviewImageUrl(categoryId: string): string {
  if (categoryId === 'championship-race') return '/championship.jpg'
  if (categoryId === 'rivalry-matchups') return '/rivalry.jpeg'
  const seed = categoryId.replace(/\s+/g, '-')
  return `https://picsum.photos/seed/${seed}/800/600`
}

interface Props {
  category: Category
  index: number
  onSelect: (c: Category) => void
}

export function CategoryTileBarPattern() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {[15, 28, 42, 56, 68, 80].map((pct) => (
        <div
          key={pct}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct}%`,
            width: 1,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  )
}

export default function CategoryTile({ category, index, onSelect }: Props) {
  const firstMoment = category.moments[0]
  const accentColor = firstMoment?.accentColor ?? '#00ccff'
  const previewImageUrl = getCategoryPreviewImageUrl(category.id)

  return (
    <motion.button
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
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
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.45,
          delay: index * 0.06,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
      whileHover={{
        background: 'rgba(255,255,255,0.13)',
        borderColor: 'rgba(255,255,255,0.30)',
        transition: { duration: 0.18 },
      }}
      whileTap={{ scale: 0.97 }}
      onTap={() => onSelect(category)}
      onClick={() => onSelect(category)}
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
        }}
      >
        <div
          style={{
            fontFamily: "'Klarheit', serif",
            fontWeight: 600,
            fontSize: 42,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            lineHeight: 1.1,
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {category.name}
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
  )
}
