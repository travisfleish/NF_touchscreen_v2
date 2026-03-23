export const colors = {
  geniusBlue: '#0000dc',
  geniusBlueDark: '#0000a0',
  geniusBlueDeep: '#000070',
  geniusBlueLight: '#2222ff',
  white: '#ffffff',
  whiteAlpha10: 'rgba(255,255,255,0.10)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  whiteAlpha5: 'rgba(255,255,255,0.05)',
  darkBlueAlpha50: 'rgba(0,0,80,0.5)',
  accent: '#4466ff',
} as const

export const IDLE_TIMEOUT_MS = 45_000

/** Cinematic transition: delay before showing "Moment Detected" after "Detecting Moment…" (ms) */
export const CINEMATIC_DETECTING_DELAY_MS = 3_000
/** Cinematic transition: time to show "Moment Detected" before transitioning to activating (ms) */
export const CINEMATIC_DETECTED_DISPLAY_MS = 1_500
/** Activating Audiences: total duration of vertical reel scroll (fast spin → deceleration) (ms) */
export const CINEMATIC_ACTIVATING_SCROLL_MS = 6_000
/** Activating Audiences: hold time on selected audience ID before transitioning to detail (ms) */
export const CINEMATIC_ACTIVATING_HOLD_MS = 1_000

/** Controversy multi-video cinematic: time to show "Moment Detected" before next video or transition (ms) */
export const CONTROVERSY_DETECTED_DISPLAY_MS = 1_000

export const screenVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const screenTransition = { duration: 0.5, ease: 'easeInOut' }
