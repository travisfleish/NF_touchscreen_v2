import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CINEMATIC_ACTIVATING_HOLD_MS, CINEMATIC_ACTIVATING_SCROLL_MS } from '../tokens'

type AnimationMode = 'node-fade' | 'graph-build'

interface AnimatedFanCloudProps {
  animate: boolean
  reducedMotion?: boolean
  className?: string
  style?: React.CSSProperties
  alt?: string
  mode?: AnimationMode
  replayToken?: number
}

const SVG_URL = '/fan-cloud.svg'
const SVG_VIEWBOX_WIDTH = 1200
const SVG_VIEWBOX_HEIGHT = 675
const NODE_SELECTOR = 'path.cls-6, path.cls-18'
const BRANCH_SELECTOR = '.cls-2, .cls-3'
const ATTRIBUTE_SELECTOR = `${NODE_SELECTOR}, text, tspan, path.cls-9, path.cls-19, path.cls-20, path.cls-21, path.cls-22, path.cls-23, path.cls-24, path.cls-25, path.cls-26, path.cls-27, path.cls-28, path.cls-32, path.cls-39, path.cls-40, path.cls-41, path.cls-47, path.cls-54, image`
const CENTER_INFO_TEXT_CLASSNAMES = new Set(['cls-7', 'cls-10', 'cls-11'])
const CENTER_INFO_REGION = { minX: 520, maxX: 690, minY: 360, maxY: 520 }
const CENTER_PHOTO_REGION = { minX: 500, maxX: 700, minY: 180, maxY: 420 }
const OUTER_IMAGE_REVEAL_LAG_MS = 120

function toFiniteNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseTranslate(transform: string | null): { x: number; y: number } | null {
  if (!transform) return null

  const match = /translate\(([-\d.]+)(?:[,\s]+([-\d.]+))?\)/.exec(transform)
  if (!match) return null

  const x = Number(match[1])
  const y = Number(match[2] ?? 0)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  return { x, y }
}

function getElementCenter(element: SVGElement): { x: number; y: number } | null {
  try {
    const box = (element as unknown as SVGGraphicsElement).getBBox()
    if (Number.isFinite(box.width) && Number.isFinite(box.height) && (box.width > 0 || box.height > 0)) {
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    }
  } catch {
    // Continue to attribute-based fallbacks below.
  }

  const x = toFiniteNumber(element.getAttribute('x'))
  const y = toFiniteNumber(element.getAttribute('y'))
  const width = toFiniteNumber(element.getAttribute('width'))
  const height = toFiniteNumber(element.getAttribute('height'))
  if (x !== null && y !== null && width !== null && height !== null) {
    return { x: x + width / 2, y: y + height / 2 }
  }

  const cx = toFiniteNumber(element.getAttribute('cx'))
  const cy = toFiniteNumber(element.getAttribute('cy'))
  if (cx !== null && cy !== null) {
    return { x: cx, y: cy }
  }

  const translatedCenter = parseTranslate(element.getAttribute('transform'))
  if (translatedCenter) {
    return translatedCenter
  }

  return null
}

function isWithinRegion(
  point: { x: number; y: number } | null,
  region: { minX: number; maxX: number; minY: number; maxY: number }
) {
  if (!point) return false
  return (
    point.x >= region.minX &&
    point.x <= region.maxX &&
    point.y >= region.minY &&
    point.y <= region.maxY
  )
}

function isCenterStaticAttribute(attribute: SVGElement) {
  const textContainer =
    attribute.tagName.toLowerCase() === 'text'
      ? attribute
      : (attribute.closest('text') as SVGElement | null)

  if (
    textContainer &&
    Array.from(CENTER_INFO_TEXT_CLASSNAMES).some((className) => textContainer.classList.contains(className))
  ) {
    return true
  }

  if (attribute.tagName.toLowerCase() === 'image') {
    // Keep all image assets on the animated timing path so none pop in early.
    return false
  }

  if (
    (attribute.classList.contains('cls-6') || attribute.classList.contains('cls-18')) &&
    isWithinRegion(getElementCenter(attribute), CENTER_INFO_REGION)
  ) {
    return true
  }

  return false
}

function getNearestBranchIndex(
  attributeCenter: { x: number; y: number } | null,
  branchCenters: Array<{ x: number; y: number } | null>
) {
  if (!attributeCenter || !branchCenters.length) {
    return -1
  }

  let nearestIndex = -1
  let nearestDistance = Number.POSITIVE_INFINITY

  branchCenters.forEach((branchCenter, index) => {
    if (!branchCenter) {
      return
    }

    const dx = attributeCenter.x - branchCenter.x
    const dy = attributeCenter.y - branchCenter.y
    const distance = dx * dx + dy * dy

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

function hashSeed(seed: number) {
  let hashed = seed | 0
  hashed ^= hashed >>> 16
  hashed = Math.imul(hashed, 0x45d9f3b)
  hashed ^= hashed >>> 16
  hashed = Math.imul(hashed, 0x45d9f3b)
  hashed ^= hashed >>> 16
  return hashed >>> 0
}

function createSeededRandom(seed: number) {
  let state = hashSeed(seed) || 0x6d2b79f5
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

function createShuffledIndices(length: number, seed: number) {
  const indices = Array.from({ length }, (_, index) => index)
  const random = createSeededRandom(seed)

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentValue = indices[index]
    indices[index] = indices[swapIndex]
    indices[swapIndex] = currentValue
  }

  return indices
}

export function AnimatedFanCloud({
  animate,
  reducedMotion = false,
  className,
  style,
  alt,
  mode = 'node-fade',
  replayToken = 0,
}: AnimatedFanCloudProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [svgMarkup, setSvgMarkup] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    fetch(SVG_URL)
      .then((response) => response.text())
      .then((markup) => {
        if (isMounted) {
          setSvgMarkup(markup)
        }
      })
      .catch(() => {
        // Keep silent in UI; fallback state is just an empty container.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useLayoutEffect(() => {
    if (!svgMarkup || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const nodes = Array.from(container.querySelectorAll<SVGElement>(NODE_SELECTOR))
    const branches = Array.from(container.querySelectorAll<SVGElement>(BRANCH_SELECTOR))
    const attributes = Array.from(container.querySelectorAll<SVGElement>(ATTRIBUTE_SELECTOR))

    if (!nodes.length && !branches.length && !attributes.length) {
      return
    }

    const timers: number[] = []

    const clearTimers = () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }

    const resetNodes = () => {
      nodes.forEach((node) => {
        node.style.opacity = '0'
        node.style.transitionProperty = 'opacity'
        node.style.transitionDuration = '0ms'
        node.style.transitionTimingFunction = 'ease-out'
        node.style.transitionDelay = '0ms'
      })
    }

    const revealNodes = () => {
      nodes.forEach((node, index) => {
        node.style.transitionDuration = '320ms'
        node.style.transitionDelay = `${index * 30}ms`
        node.style.opacity = '1'
      })
    }

    const resetGraphBuild = () => {
      branches.forEach((branch) => {
        branch.style.opacity = '0'
        branch.style.transitionProperty = 'opacity'
        branch.style.transitionDuration = '0ms'
        branch.style.transitionTimingFunction = 'ease-out'
        branch.style.transitionDelay = '0ms'
      })

      attributes.forEach((attribute) => {
        if (!isCenterStaticAttribute(attribute)) {
          attribute.style.opacity = '0'
        } else {
          attribute.style.opacity = '1'
        }
        attribute.style.transitionProperty = 'opacity'
        attribute.style.transitionDuration = '0ms'
        attribute.style.transitionTimingFunction = 'ease-out'
        attribute.style.transitionDelay = '0ms'
      })
    }

    const revealGraphBuild = () => {
      const overlayTotalMs =
        CINEMATIC_ACTIVATING_SCROLL_MS + CINEMATIC_ACTIVATING_HOLD_MS
      const finalSettleLeadMs = 260
      const targetFinalAttributeCompleteMs = Math.max(0, overlayTotalMs - finalSettleLeadMs)
      const branchFadeMs = 1100
      const attributeFadeMs = 1320
      const attributeLeadMs = 0
      const branchDelayStepMs =
        branches.length > 1
          ? Math.max(
              120,
              Math.round(
                (targetFinalAttributeCompleteMs - attributeFadeMs + attributeLeadMs) /
                  (branches.length - 1)
              )
            )
          : 0
      const branchCenters = branches.map((branch) => getElementCenter(branch))
      const nodeCenters = nodes.map((node) => getElementCenter(node))
      const branchRevealOrder = createShuffledIndices(
        branches.length,
        replayToken + branches.length * 131 + 17
      )
      const revealStepByBranchIndex = new Map<number, number>(
        branchRevealOrder.map((branchIndex, revealStep) => [branchIndex, revealStep])
      )
      const nodeRevealOrder = createShuffledIndices(
        nodes.length,
        replayToken + nodes.length * 227 + 43
      )
      const revealStepByNodeIndex = new Map<number, number>(
        nodeRevealOrder.map((nodeIndex, revealStep) => [nodeIndex, revealStep])
      )
      const nodeBaseDelayByIndex = nodeCenters.map((nodeCenter, nodeIndex) => {
        const nearestBranchIndex = getNearestBranchIndex(nodeCenter, branchCenters)
        if (nearestBranchIndex >= 0) {
          return (revealStepByBranchIndex.get(nearestBranchIndex) ?? nearestBranchIndex) * branchDelayStepMs
        }

        return (revealStepByNodeIndex.get(nodeIndex) ?? nodeIndex) * branchDelayStepMs
      })

      branches.forEach((branch, branchIndex) => {
        const revealStep = revealStepByBranchIndex.get(branchIndex) ?? branchIndex
        branch.style.transitionDuration = `${branchFadeMs}ms`
        branch.style.transitionDelay = `${revealStep * branchDelayStepMs}ms`
        branch.style.opacity = '1'
      })

      attributes.forEach((attribute, attributeIndex) => {
        if (isCenterStaticAttribute(attribute)) {
          return
        }

        const isImageAttribute = attribute.tagName.toLowerCase() === 'image'
        if (isImageAttribute) {
          const imageCenter = getElementCenter(attribute)
          const nearestNodeIndex = getNearestBranchIndex(getElementCenter(attribute), nodeCenters)
          const outerImageLagMs = isWithinRegion(imageCenter, CENTER_PHOTO_REGION)
            ? 0
            : OUTER_IMAGE_REVEAL_LAG_MS
          const imageDelay =
            nearestNodeIndex >= 0
              ? (nodeBaseDelayByIndex[nearestNodeIndex] ?? nearestNodeIndex * branchDelayStepMs) +
                outerImageLagMs
              : attributeIndex * Math.max(16, branchDelayStepMs * 0.2)

          attribute.style.transitionDuration = `${attributeFadeMs}ms`
          attribute.style.transitionDelay = `${Math.max(0, imageDelay - attributeLeadMs)}ms`
          attribute.style.opacity = '1'
          return
        }

        const nearestNodeIndex = getNearestBranchIndex(getElementCenter(attribute), nodeCenters)
        const nearestBranchIndex = getNearestBranchIndex(getElementCenter(attribute), branchCenters)
        const baseDelay =
          nearestNodeIndex >= 0
            ? nodeBaseDelayByIndex[nearestNodeIndex] ?? nearestNodeIndex * branchDelayStepMs
            : nearestBranchIndex >= 0
              ? (revealStepByBranchIndex.get(nearestBranchIndex) ?? nearestBranchIndex) * branchDelayStepMs
              : attributeIndex * Math.max(16, branchDelayStepMs * 0.2)

        attribute.style.transitionDuration = `${attributeFadeMs}ms`
        attribute.style.transitionDelay = `${Math.max(0, baseDelay - attributeLeadMs)}ms`
        attribute.style.opacity = '1'
      })
    }

    if (reducedMotion) {
      branches.forEach((branch) => {
        branch.style.opacity = '1'
      })
      attributes.forEach((attribute) => {
        attribute.style.opacity = '1'
      })
      nodes.forEach((node) => {
        node.style.opacity = '1'
      })
      return
    }

    if (mode === 'graph-build') {
      resetGraphBuild()
    } else {
      resetNodes()
    }

    if (!animate) {
      return () => {
        clearTimers()
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      if (mode === 'graph-build') {
        revealGraphBuild()
      } else {
        revealNodes()
      }
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      clearTimers()
    }
  }, [animate, mode, reducedMotion, replayToken, svgMarkup])

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label={alt}
      style={{
        // Keep a stable render box while SVG markup is loading.
        aspectRatio: `${SVG_VIEWBOX_WIDTH} / ${SVG_VIEWBOX_HEIGHT}`,
        minHeight: '220px',
        backgroundColor: 'var(--color-navy)',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  )
}
