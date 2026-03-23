import { useState, useEffect } from 'react'

export default function OrientationGuard({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (!isPortrait) return <>{children}</>

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0000dc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: 60,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: 40 }}
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M12 18h.01" />
        {/* Rotation arrows */}
        <path
          d="M20 8c0-2.21-1.79-4-4-4H8C5.79 4 4 5.79 4 8"
          strokeDasharray="2 2"
          opacity="0.4"
        />
        <polyline points="22 6 20 8 18 6" />
      </svg>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          marginBottom: 20,
          lineHeight: 1.1,
        }}
      >
        Rotate Device
      </h1>
      <p
        style={{
          fontSize: 28,
          fontWeight: 500,
          opacity: 0.6,
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        This experience is designed for landscape orientation.
      </p>
    </div>
  )
}
