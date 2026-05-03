import { useCallback, useRef } from 'react'
import CenterShell from './CenterShell'
import renderCenterContent from './centerContent/CenterContent'
import useCenterNavigation from './hooks/useCenterNavigation'
import useCenterSections from './hooks/useCenterSections'
import useDynamicSelectionRefresh from './hooks/useDynamicSelectionRefresh'
import useMoneyCenterState from './hooks/useMoneyCenterState'
import useNewsCenterState from './hooks/useNewsCenterState'
import useSportsCenterState from './hooks/useSportsCenterState'
import useWeatherCenterState from './hooks/useWeatherCenterState'

function getTipDetailRightTarget(page) {
  const tipInlineLinkTarget = page.tipBodyHtml?.includes('dock-page-tip-inline-link')
    ? 'tip-inline-link-0'
    : null

  return page.variant === 'usingTipDetail'
    ? (tipInlineLinkTarget ?? page.sidebarRightTarget ?? page.actions?.[0]?.selectId ?? 'tip-detail-other')
    : page.sidebarRightTarget
}

export default function CenterDockPage({
  page,
  pageRef,
  bodyScrollRef,
  selection,
  onClose,
  onNavigate,
  canScrollUp,
  canScrollDown,
  updateScrollIndicators,
}) {
  const shellNodeRef = useRef(null)
  const { handleModuleNavigate, handleMoneyQuoteNavigate } = useCenterNavigation(onNavigate)
  const money = useMoneyCenterState(page, handleModuleNavigate)
  const news = useNewsCenterState(page)
  const weather = useWeatherCenterState(page, handleModuleNavigate)
  const sports = useSportsCenterState(page)
  const sections = useCenterSections({
    bodyScrollRef,
    selection,
    updateScrollIndicators,
    handleModuleNavigate,
  })

  useDynamicSelectionRefresh({
    page,
    shellNodeRef,
    selection,
    counts: [
      news.dynamicCount,
      money.dynamicCount,
      ...sports.dynamicCounts,
    ],
  })

  const setRootRef = useCallback((node) => {
    shellNodeRef.current = node
    pageRef(node)
  }, [pageRef])

  const sidebarRightTarget = getTipDetailRightTarget(page) ?? money.sidebarRightTarget

  return (
    <CenterShell
      page={page}
      pageRef={setRootRef}
      bodyScrollRef={bodyScrollRef}
      canScrollUp={canScrollUp}
      canScrollDown={canScrollDown}
      sidebarRightTarget={sidebarRightTarget}
      onNavigate={handleModuleNavigate}
      renderContent={(nextRow) => renderCenterContent({
        page,
        nextRow,
        onClose,
        handleModuleNavigate,
        handleMoneyQuoteNavigate,
        ...money.contentProps,
        ...news.contentProps,
        ...weather.contentProps,
        ...sports.contentProps,
        handleCategoryClick: sections.handleCategoryClick,
        renderSection: sections.createRenderSection(nextRow),
      })}
    />
  )
}
