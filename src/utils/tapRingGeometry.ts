/** Shared math for MomentBubble tap ring + orbit connector endpoints. */

export function tapRingStrokeWidthPx(diameter: number): number {
  return Math.max(2.5, Math.round(diameter * 0.016))
}

export function tapRingGapPx(diameter: number): number {
  return Math.max(10, Math.round(diameter * 0.052))
}

/**
 * Padding from bubble rect to outer layout frame.
 * Includes room for the orbiting pulse drawn **outside** the main ring (see TapRingCue).
 */
export function tapRingFramePad(diameter: number): number {
  const sw = tapRingStrokeWidthPx(diameter)
  const gap = tapRingGapPx(diameter)
  const orbitPulseW = sw * 1.15
  return gap + sw + 2 + orbitPulseW + 10
}

/** Radius of the main ring stroke path (centerline). */
export function tapRingStrokeCenterRadiusPx(diameter: number): number {
  const sw = tapRingStrokeWidthPx(diameter)
  const gap = tapRingGapPx(diameter)
  return diameter / 2 + gap + sw / 2
}

/** Outer edge of the main white ring — connector endpoints. */
export function tapRingOuterRadiusPx(diameter: number): number {
  return tapRingStrokeCenterRadiusPx(diameter) + tapRingStrokeWidthPx(diameter) / 2
}

/**
 * Bubble breathing: at peak, rim reaches the **centerline** of the main white ring
 * (middle of the stroke — not inner gap edge, not outer outer edge).
 */
export function tapRingBubblePulseScaleHigh(diameter: number): number {
  const r0 = diameter / 2
  return tapRingStrokeCenterRadiusPx(diameter) / r0
}
