import { useRef, useCallback, useEffect } from 'react'

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

  const updateFocusBox = useCallback(() => {
    const { selected } = state.current
    const box = focusBoxRef.current
    if (!selected || !box) return
    const rect = selected.getBoundingClientRect()
    const m = 4
    box.style.top = `${rect.top - m}px`
    box.style.left = `${rect.left - m}px`
    box.style.width = `${rect.width + 2 * m}px`
    box.style.height = `${rect.height + 2 * m}px`
  }, [])

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

  const flashGreen = useCallback(() => {
    const box = focusBoxRef.current
    if (!box) return
    clearTimeout(greenFlashTimeoutRef.current)
    box.classList.add('green-flash')
    greenFlashTimeoutRef.current = setTimeout(() => {
      box.classList.remove('green-flash')
      greenFlashTimeoutRef.current = null
    }, 100)
  }, [])

  const moveSelection = useCallback((direction) => {
    const s = state.current
    if (s.layer < 0) return
    if (direction === 'left' && s.posInHeight > 0) {
      s.posInHeight--
    } else if (direction === 'right' && s.posInHeight + 1 < s.container[s.layer][s.height].length) {
      s.posInHeight++
    } else if (direction === 'up' && s.height > 0) {
      s.height--
      s.posInHeight = 0
    } else if (direction === 'down' && s.height + 1 < Object.keys(s.container[s.layer]).length) {
      s.height++
      s.posInHeight = 0
    }
    s.selected = s.container[s.layer][s.height][s.posInHeight]
    updateFocusBox()
  }, [updateFocusBox])

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
    const handleResize = () => updateFocusBox()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(greenFlashTimeoutRef.current)
    }
  }, [updateFocusBox])

  return {
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
  }
}
