import { useLayoutEffect, useRef } from 'react'
import SelectionFrame from './SelectionFrame'

const BUFFER = 100

function mod(n, m) {
  return ((n % m) + m) % m
}

export default function DockCarousel({
  items,
  pos = 0,
  viewStart = 0,
  pixelOffset = 0,
  slidingFromPos = null,
  onSlideEnd,
  onActivate,
  renderItem,
  row = 10,
  layer = 0,
  x = 0,
  visibleCount = 7,
  itemsClassName = 'dock-items',
  sliderClassName = 'dock-slider',
  slotClassName = 'dock-item-slot',
  slideSelectionClassName = 'dock-slide-selection',
  selectedProps = {},
}) {
  const total = items.length
  const renderOriginRef = useRef(viewStart - BUFFER)
  const needsRecenterRef = useRef(false)
  const sliderRef = useRef(null)
  const baseOffsetRef = useRef(null)
  const offsetRef = useRef(0)

  const margin = 10
  if (
    total > 0
    && (
      viewStart - renderOriginRef.current < margin
      || (renderOriginRef.current + BUFFER * 2 + visibleCount) - (viewStart + visibleCount) < margin
    )
  ) {
    renderOriginRef.current = viewStart - BUFFER
    needsRecenterRef.current = true
  }

  const renderStart = renderOriginRef.current
  const renderCount = BUFFER * 2 + visibleCount
  const renderedItems = []

  if (total > 0) {
    for (let i = 0; i < renderCount; i += 1) {
      const itemPos = renderStart + i
      renderedItems.push({ ...items[mod(itemPos, total)], pos: itemPos })
    }
  }

  const computeBase = () => {
    const slider = sliderRef.current
    if (!slider) return 0
    const children = slider.children
    const zeroIdx = 0 - renderStart
    let px = 0
    for (let i = 0; i < zeroIdx; i += 1) {
      px += children[i]?.offsetWidth ?? 0
    }
    return px
  }

  useLayoutEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    let skipTransition = false

    if (needsRecenterRef.current) {
      baseOffsetRef.current = computeBase()
      needsRecenterRef.current = false
      skipTransition = true
    }

    if (baseOffsetRef.current === null) {
      baseOffsetRef.current = computeBase()
      skipTransition = true
    }

    if (skipTransition) {
      slider.style.transition = 'none'
    }

    offsetRef.current = baseOffsetRef.current + pixelOffset
    slider.style.transform = `translateX(-${offsetRef.current}px)`

    if (skipTransition) {
      slider.offsetHeight // eslint-disable-line no-unused-expressions
      requestAnimationFrame(() => {
        slider.style.transition = ''
      })
      onSlideEnd?.()
    }
  }, [pos, pixelOffset])

  return (
    <div className={itemsClassName}>
      <div
        className={sliderClassName}
        ref={sliderRef}
        style={{ transform: `translateX(-${offsetRef.current}px)` }}
        onTransitionEnd={onSlideEnd}
      >
        {renderedItems.map((item) => {
          const isSelected = item.pos === pos
          const isSlidingFrom = item.pos === slidingFromPos

          return (
            <div
              key={item.pos}
              className={`${slotClassName}${isSelected ? ' selectable' : ''}`}
              {...(isSelected ? {
                'data-select-x': `${x}`,
                'data-select-height': `${row}`,
                'data-select-layer': `${layer}`,
                'data-dock-pos': `${item.pos}`,
                'data-dock-carousel-selected': 'true',
                ...selectedProps,
              } : {})}
              onClick={() => onActivate?.(item)}
            >
              {renderItem(item, { isSelected, isSlidingFrom })}
              {isSlidingFrom && (
                <div className={slideSelectionClassName}>
                  <SelectionFrame />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
