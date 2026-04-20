import { useRef, useCallback, useEffect, useMemo } from 'react'
import animateScrollTop from '../utils/animateScrollTop'

function getSelectX(el) {
  const value = Number(el?.getAttribute('data-select-x'))
  return Number.isFinite(value) ? value : 0
}

function getSelectAttrNumber(el, attr) {
  const value = Number(el?.getAttribute(attr))
  return Number.isFinite(value) ? value : null
}

function emitSelectionChange() {
  window.dispatchEvent(new Event('msntv-selection-change'))
}

export default function useSelection() {
  const state = useRef({
    layer: -1,
    height: -1,
    posInHeight: -1,
    lastLayer: -1,
    lastHeight: -1,
    lastPosInHeight: -1,
    container: {},
    selected: null,
  })
  const focusBoxRef = useRef(null)
  const greenFlashTimeoutRef = useRef(null)
  const focusBoxFrameRef = useRef(null)

  const paintFocusBox = useCallback(() => {
    let { selected } = state.current
    const box = focusBoxRef.current
    if (!selected || !box) return
    if (!selected.isConnected) {
      const selectId = selected.getAttribute('data-select-id')
      if (selectId) {
        const freshNode = document.querySelector(`.selectable[data-select-id="${selectId}"]`)
        if (freshNode) {
          state.current.selected = freshNode
          selected = freshNode
        }
      }
      if (!selected.isConnected) return
    }
    const rect = selected.getBoundingClientRect()
    const offsetParentRect = box.offsetParent instanceof Element
      ? box.offsetParent.getBoundingClientRect()
      : { top: 0, left: 0 }
    const m = 4
    box.style.top = `${rect.top - offsetParentRect.top - m}px`
    box.style.left = `${rect.left - offsetParentRect.left - m}px`
    box.style.width = `${rect.width + 2 * m}px`
    box.style.height = `${rect.height + 2 * m}px`
  }, [])

  const animateSelectionScroll = useCallback((scrollContainer, nextTop) => {
    return animateScrollTop(scrollContainer, nextTop, 100, {
      onStart: () => {
        focusBoxRef.current?.classList.add('scroll-hide-focus')
      },
      onComplete: () => {
        focusBoxRef.current?.classList.remove('scroll-hide-focus')
        paintFocusBox()
        emitSelectionChange()
        requestAnimationFrame(() => {
          paintFocusBox()
        })
      },
    })
  }, [paintFocusBox])

  const scrollSelectedIntoView = useCallback((selected) => {
    if (!selected) return false

    const scrollContainer = selected.closest('[data-selection-scroll]')
    if (!scrollContainer) return false

    const selectedRect = selected.getBoundingClientRect()
    const containerRect = scrollContainer.getBoundingClientRect()
    const verticalPadding = 4
    const selectableRects = Array.from(scrollContainer.querySelectorAll('.selectable'))
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)

    if (selectableRects.length > 0) {
      const minTop = Math.min(...selectableRects.map(({ rect }) => rect.top))
      const maxBottom = Math.max(...selectableRects.map(({ rect }) => rect.bottom))
      const edgeTolerance = 2

      if (selectedRect.top <= minTop + edgeTolerance) {
        return animateSelectionScroll(scrollContainer, 0)
      }

      if (selectedRect.bottom >= maxBottom - edgeTolerance) {
        return animateSelectionScroll(scrollContainer, scrollContainer.scrollHeight)
      }
    }

    if (selectedRect.top < containerRect.top) {
      return animateSelectionScroll(
        scrollContainer,
        scrollContainer.scrollTop + selectedRect.top - containerRect.top - verticalPadding,
      )
    }

    if (selectedRect.bottom > containerRect.bottom) {
      return animateSelectionScroll(
        scrollContainer,
        scrollContainer.scrollTop + selectedRect.bottom - containerRect.bottom + verticalPadding,
      )
    }

    return false
  }, [animateSelectionScroll])

  const updateFocusBox = useCallback(() => {
    const { selected } = state.current
    const didScroll = scrollSelectedIntoView(selected)
    cancelAnimationFrame(focusBoxFrameRef.current)
    if (didScroll) {
      focusBoxFrameRef.current = null
      return
    }
    paintFocusBox()
    emitSelectionChange()
  }, [scrollSelectedIntoView, paintFocusBox])

  const initSelectables = useCallback((rootEl) => {
    const s = state.current
    s.layer = -1
    s.height = -1
    s.posInHeight = -1
    s.container = {}
    s.lastLayer = -1
    s.lastHeight = -1
    s.lastPosInHeight = -1
    s.selected = null

    if (!rootEl) return

    const selectables = rootEl.querySelectorAll('.selectable')
    selectables.forEach((el) => {
      const itemLayer = parseInt(el.getAttribute('data-select-layer'))
      const itemHeight = parseInt(el.getAttribute('data-select-height'))
      if (!(itemLayer in s.container)) s.container[itemLayer] = {}
      if (!(itemHeight in s.container[itemLayer])) s.container[itemLayer][itemHeight] = []
      s.container[itemLayer][itemHeight].push(el)
    })

    if (0 in s.container && s.container[0][0]?.length) {
      s.selected = s.container[0][0][0]
      s.layer = 0
      s.height = 0
      s.posInHeight = 0
      updateFocusBox()
    }
  }, [updateFocusBox])

  const goToSpecific = useCallback((newLayer, newHeight, newPos) => {
    const s = state.current
    s.layer = newLayer
    s.height = newHeight
    s.posInHeight = newPos
    s.selected = s.container[s.layer]?.[s.height]?.[s.posInHeight] ?? null
    updateFocusBox()
  }, [updateFocusBox])

  const goToLayer = useCallback((newLayer) => {
    goToSpecific(newLayer, 0, 0)
  }, [goToSpecific])

  const setLast = useCallback(() => {
    const s = state.current
    s.lastLayer = s.layer
    s.lastHeight = s.height
    s.lastPosInHeight = s.posInHeight
  }, [])

  const goToLast = useCallback(() => {
    const s = state.current
    goToSpecific(s.lastLayer, s.lastHeight, s.lastPosInHeight)
  }, [goToSpecific])

  const hideFocusBox = useCallback(() => {
    focusBoxRef.current?.classList.add('hide-focus')
  }, [])

  const unHideFocusBox = useCallback(() => {
    focusBoxRef.current?.classList.remove('hide-focus')
    updateFocusBox()
  }, [updateFocusBox])

  const tempHideFocusBox = useCallback(() => {
    hideFocusBox()
    setTimeout(() => focusBoxRef.current?.classList.remove('hide-focus'), 250)
  }, [hideFocusBox])

  const flashGreen = useCallback((duration = 100) => {
    const box = focusBoxRef.current
    if (!box) return
    clearTimeout(greenFlashTimeoutRef.current)
    box.classList.add('green-flash')
    greenFlashTimeoutRef.current = setTimeout(() => {
      box.classList.remove('green-flash')
      greenFlashTimeoutRef.current = null
    }, duration)
  }, [])

  const findExplicitNeighbor = useCallback((direction) => {
    const current = state.current.selected
    const targetId = current?.getAttribute(`data-select-${direction}`)
    if (!targetId) return null

    const allSelectables = Array.from(document.querySelectorAll('.selectable'))
    return allSelectables.find((el) => el.getAttribute('data-select-id') === targetId) ?? null
  }, [])

  const findHorizontalNeighbor = useCallback((direction) => {
    const s = state.current
    const current = s.selected
    const layerRows = s.container[s.layer]
    if (!current || !layerRows) return null

    const currentRect = current.getBoundingClientRect()
    const currentCenterX = (currentRect.left + currentRect.right) / 2
    const currentCenterY = (currentRect.top + currentRect.bottom) / 2
    const currentScrollContainer = current.closest('[data-selection-scroll]')

    let bestMatch = null

    Object.entries(layerRows).forEach(([heightKey, row]) => {
      row.forEach((el, posInHeight) => {
        if (!el || el === current) return
        if (currentScrollContainer && el.closest('[data-selection-scroll]') !== currentScrollContainer) return

        const rect = el.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return

        const centerX = (rect.left + rect.right) / 2
        const centerY = (rect.top + rect.bottom) / 2
        const deltaX = centerX - currentCenterX

        if (direction === 'right' && deltaX <= 4) return
        if (direction === 'left' && deltaX >= -4) return

        const verticalDistance = Math.abs(centerY - currentCenterY)
        const overlapsVertically = rect.bottom > currentRect.top && rect.top < currentRect.bottom
        const edgeDistance = direction === 'right'
          ? Math.max(0, rect.left - currentRect.right)
          : Math.max(0, currentRect.left - rect.right)
        const score = (overlapsVertically ? 0 : 1000) + verticalDistance * 10 + edgeDistance

        if (!bestMatch || score < bestMatch.score) {
          bestMatch = {
            height: Number(heightKey),
            posInHeight,
            score,
          }
        }
      })
    })

    return bestMatch
  }, [])

  const findVerticalNeighbor = useCallback((direction) => {
    const s = state.current
    const current = s.selected
    const layerRows = s.container[s.layer]
    if (!current || !layerRows) return null

    const heights = Object.keys(layerRows).map(Number).sort((a, b) => a - b)
    const startIndex = heights.indexOf(s.height)
    if (startIndex === -1) return null

    const currentX = getSelectX(current)
    const step = direction === 'down' ? 1 : -1

    for (let i = startIndex + step; i >= 0 && i < heights.length; i += step) {
      const height = heights[i]
      const row = layerRows[height]
      const posInHeight = row.findIndex((el) => getSelectX(el) === currentX)

      if (posInHeight !== -1) {
        return { height, posInHeight }
      }
    }

    return null
  }, [])

  const moveSelection = useCallback((direction) => {
    const s = state.current
    const current = s.selected
    if (s.layer < 0) return false
    const explicitNeighbor = findExplicitNeighbor(direction)
    if (explicitNeighbor) {
      const layer = getSelectAttrNumber(explicitNeighbor, 'data-select-layer')
      const height = getSelectAttrNumber(explicitNeighbor, 'data-select-height')
      if (layer !== null && height !== null) {
        const row = s.container[layer]?.[height]
        let posInHeight = row?.indexOf(explicitNeighbor) ?? -1
        if (posInHeight === -1 && row) {
          const targetId = explicitNeighbor.getAttribute('data-select-id')
          if (targetId) {
            posInHeight = row.findIndex((el) => el.getAttribute('data-select-id') === targetId)
            if (posInHeight !== -1) {
              row[posInHeight] = explicitNeighbor
            }
          }
        }
        if (posInHeight !== -1) {
          s.layer = layer
          s.height = height
          s.posInHeight = posInHeight
          s.selected = explicitNeighbor
          updateFocusBox()
          return true
        }
      }
    }
    if (direction === 'left' && s.posInHeight > 0) {
      s.posInHeight--
    } else if (direction === 'right' && s.posInHeight + 1 < s.container[s.layer][s.height].length) {
      s.posInHeight++
    } else if (direction === 'left' || direction === 'right') {
      const neighbor = findHorizontalNeighbor(direction)
      if (!neighbor) return false
      s.height = neighbor.height
      s.posInHeight = neighbor.posInHeight
    } else if ((direction === 'up' || direction === 'down') && current?.closest('.dock-page-shell, .dock-page-money-site-shell')) {
      const neighbor = findVerticalNeighbor(direction)
      if (!neighbor) return false
      s.height = neighbor.height
      s.posInHeight = neighbor.posInHeight
    } else if (direction === 'up' && s.height > 0) {
      s.height--
      s.posInHeight = 0
    } else if (direction === 'down' && s.height + 1 < Object.keys(s.container[s.layer]).length) {
      s.height++
      s.posInHeight = 0
    } else {
      return false
    }
    s.selected = s.container[s.layer][s.height][s.posInHeight]
    if (s.selected && !s.selected.isConnected) {
      const selectId = s.selected.getAttribute('data-select-id')
      if (selectId) {
        const freshNode = document.querySelector(`.selectable[data-select-id="${selectId}"]`)
        if (freshNode) {
          s.selected = freshNode
          s.container[s.layer][s.height][s.posInHeight] = freshNode
        }
      }
    }
    updateFocusBox()
    return true
  }, [findExplicitNeighbor, findHorizontalNeighbor, findVerticalNeighbor, updateFocusBox])

  const getSelected = useCallback(() => state.current.selected, [])

  const updateContainerRef = useCallback((layer, height, pos, el) => {
    const s = state.current
    if (s.container[layer]?.[height]) {
      s.container[layer][height][pos] = el
    }
    if (s.layer === layer && s.height === height && s.posInHeight === pos) {
      s.selected = el
      updateFocusBox()
    }
  }, [updateFocusBox])

  // Resize handler
  useEffect(() => {
    const handleResize = () => paintFocusBox()
    const handleScroll = () => paintFocusBox()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      clearTimeout(greenFlashTimeoutRef.current)
      cancelAnimationFrame(focusBoxFrameRef.current)
    }
  }, [paintFocusBox])

  return useMemo(() => ({
    focusBoxRef,
    initSelectables,
    goToSpecific,
    goToLayer,
    setLast,
    goToLast,
    hideFocusBox,
    unHideFocusBox,
    tempHideFocusBox,
    flashGreen,
    moveSelection,
    getSelected,
    updateFocusBox,
    updateContainerRef,
  }), [
    initSelectables,
    goToSpecific,
    goToLayer,
    setLast,
    goToLast,
    hideFocusBox,
    unHideFocusBox,
    tempHideFocusBox,
    flashGreen,
    moveSelection,
    getSelected,
    updateFocusBox,
    updateContainerRef,
  ])
}
