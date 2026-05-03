import { useCallback, useEffect, useRef, useState } from 'react'
import { DOCK_PAGES } from '../data/dockContent'
import MusicCenter from './MusicCenter'
import PhotosCenter from './PhotosCenter'
import SettingsPage from './SettingsPage'
import CenterDockPage from './dockPage/CenterDockPage'
import MailCenterPage from './dockPage/MailCenterPage'
import MapsCenterPage from './dockPage/MapsCenterPage'
import MoneyQuoteSite from './dockPage/MoneyQuoteSite'
import NavigationErrorPage from './dockPage/NavigationErrorPage'
import SearchDockPage from './dockPage/SearchDockPage'
import TvListingsSite from './dockPage/TvListingsSite'
import { assignRef } from './dockPage/shared'

const noop = () => {}

export default function DockPage({
  pageId,
  pageRef,
  subPageBackRef,
  onClose,
  selection,
  onNavigate = noop,
  musicNavPos = 0,
  musicNavViewStart = 0,
  musicNavPixelOffset = 0,
  musicNavSlidingFromPos = null,
  onMusicNavSlideEnd,
  photosNavPos = 1,
  photosNavViewStart = 0,
  photosNavPixelOffset = 0,
  photosNavSlidingFromPos = null,
  onPhotosNavSlideEnd,
  mediaPlayer,
  onSettingsAction,
  navigationErrorUrl = 'http://www.',
  audio = null,
}) {
  const moneyQuoteSymbol = typeof pageId === 'string' && pageId.startsWith('money-quote:')
    ? decodeURIComponent(pageId.slice('money-quote:'.length))
    : null
  const page = DOCK_PAGES[pageId] ?? (moneyQuoteSymbol ? {
    layout: 'moneySite',
    title: 'Money',
    subtitle: 'Quote',
    symbol: moneyQuoteSymbol,
  } : null)
  const bodyScrollRef = useRef(null)
  const shellNodeRef = useRef(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const setShellRef = useCallback((node) => {
    shellNodeRef.current = node
    assignRef(pageRef, node)
  }, [pageRef])

  useEffect(() => {
    if (!shellNodeRef.current || !selection) return
    const hasInlineLinks = shellNodeRef.current.querySelector('.dock-page-tip-inline-link.selectable')
    if (hasInlineLinks) {
      selection.initSelectables(shellNodeRef.current)
    }
  }, [pageId, selection])

  useEffect(() => {
    if (!subPageBackRef) return undefined
    if (page?.layout === 'mapsCenter' || page?.layout === 'mailCenter' || page?.layout === 'photosCenter') {
      return undefined
    }
    subPageBackRef.current = null
    return undefined
  }, [subPageBackRef, page?.layout])

  const updateScrollIndicators = useCallback(() => {
    const node = bodyScrollRef.current
    if (!node) {
      setCanScrollUp(false)
      setCanScrollDown(false)
      return
    }

    const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight)
    const selected = selection?.getSelected?.()
    let atTopBoundary = false
    let atBottomBoundary = false

    if (selected instanceof Element && node.contains(selected)) {
      const selectableRects = Array.from(node.querySelectorAll('.selectable'))
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0)

      if (selectableRects.length > 0) {
        const selectedRect = selected.getBoundingClientRect()
        const minTop = Math.min(...selectableRects.map(({ rect }) => rect.top))
        const maxBottom = Math.max(...selectableRects.map(({ rect }) => rect.bottom))
        const edgeTolerance = 2

        atTopBoundary = selectedRect.top <= minTop + edgeTolerance
        atBottomBoundary = selectedRect.bottom >= maxBottom - edgeTolerance
      }
    }

    setCanScrollUp(node.scrollTop > 1 && !atTopBoundary)
    setCanScrollDown(node.scrollTop < maxScrollTop - 1 && !atBottomBoundary)
  }, [selection])

  useEffect(() => {
    const node = bodyScrollRef.current
    updateScrollIndicators()
    const frame = window.requestAnimationFrame(updateScrollIndicators)
    if (!node) return undefined

    node.addEventListener('scroll', updateScrollIndicators)
    window.addEventListener('resize', updateScrollIndicators)
    window.addEventListener('msntv-selection-change', updateScrollIndicators)

    return () => {
      window.cancelAnimationFrame(frame)
      node.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
      window.removeEventListener('msntv-selection-change', updateScrollIndicators)
    }
  }, [pageId, updateScrollIndicators])

  const handleModuleNavigate = useCallback((targetPageId, options) => {
    if (!targetPageId) return
    onNavigate(targetPageId, options)
  }, [onNavigate])

  if (!page) return null

  if (page.layout === 'settings') {
    return (
      <div ref={setShellRef} className="dock-page-shell settings-dock-shell">
        <SettingsPage
          page={page}
          onNavigate={handleModuleNavigate}
          onAction={onSettingsAction}
        />
      </div>
    )
  }

  if (page.layout === 'navigationError') {
    return (
      <NavigationErrorPage
        pageRef={setShellRef}
        navigationErrorUrl={navigationErrorUrl}
        onClose={onClose}
      />
    )
  }

  if (page.layout === 'musicHome') {
    return (
      <MusicCenter
        pageRef={setShellRef}
        selection={selection}
        navPos={musicNavPos}
        navViewStart={musicNavViewStart}
        navPixelOffset={musicNavPixelOffset}
        navSlidingFromPos={musicNavSlidingFromPos}
        onNavSlideEnd={onMusicNavSlideEnd}
        mediaPlayer={mediaPlayer}
      />
    )
  }

  if (page.layout === 'photosCenter') {
    return (
      <PhotosCenter
        pageRef={setShellRef}
        subPageBackRef={subPageBackRef}
        selection={selection}
        audio={audio}
        navPos={photosNavPos}
        navViewStart={photosNavViewStart}
        navPixelOffset={photosNavPixelOffset}
        navSlidingFromPos={photosNavSlidingFromPos}
        onNavSlideEnd={onPhotosNavSlideEnd}
      />
    )
  }

  if (page.layout === 'mapsCenter') {
    return (
      <MapsCenterPage
        pageRef={setShellRef}
        selection={selection}
        subPageBackRef={subPageBackRef}
      />
    )
  }

  if (page.layout === 'mailCenter') {
    return (
      <MailCenterPage
        pageRef={setShellRef}
        selection={selection}
        audio={audio}
        subPageBackRef={subPageBackRef}
      />
    )
  }

  if (page.layout === 'search') {
    return (
      <SearchDockPage
        page={page}
        pageRef={setShellRef}
        bodyScrollRef={bodyScrollRef}
      />
    )
  }

  if (page.layout === 'moneySite') {
    return (
      <MoneyQuoteSite
        page={page}
        pageRef={setShellRef}
        bodyScrollRef={bodyScrollRef}
        onNavigate={handleModuleNavigate}
      />
    )
  }

  if (page.layout === 'tvListingsSite') {
    return (
      <TvListingsSite
        pageRef={setShellRef}
        bodyScrollRef={bodyScrollRef}
      />
    )
  }

  return (
    <CenterDockPage
      page={page}
      pageRef={setShellRef}
      bodyScrollRef={bodyScrollRef}
      selection={selection}
      onClose={onClose}
      onNavigate={handleModuleNavigate}
      canScrollUp={canScrollUp}
      canScrollDown={canScrollDown}
      updateScrollIndicators={updateScrollIndicators}
    />
  )
}
