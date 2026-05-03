import { useCallback, useRef } from 'react'
import animateScrollTop from '../../../utils/animateScrollTop'
import { BASE, normalizeItem, SelectableRow } from '../shared'

export default function useCenterSections({
  bodyScrollRef,
  selection,
  updateScrollIndicators,
  handleModuleNavigate,
}) {
  const sectionRefs = useRef({})
  const sectionFirstRowsRef = useRef({})

  sectionFirstRowsRef.current = {}

  const handleCategoryClick = useCallback((title) => {
    const firstRow = sectionFirstRowsRef.current[title]
    if (selection && typeof firstRow === 'number') {
      selection.goToSpecific(0, firstRow, 0)
      window.requestAnimationFrame(updateScrollIndicators)
      return
    }

    const sectionNode = sectionRefs.current[title]
    const scrollNode = bodyScrollRef.current
    if (!sectionNode || !scrollNode) return

    const sectionRect = sectionNode.getBoundingClientRect()
    const scrollRect = scrollNode.getBoundingClientRect()
    const nextScrollTop = scrollNode.scrollTop + sectionRect.top - scrollRect.top - 6

    animateScrollTop(scrollNode, nextScrollTop, 100, selection ? {
      onStart: () => {
        selection.focusBoxRef.current?.classList.add('scroll-hide-focus')
      },
      onComplete: () => {
        selection.focusBoxRef.current?.classList.remove('scroll-hide-focus')
        selection.updateFocusBox()
      },
    } : undefined)
    window.requestAnimationFrame(updateScrollIndicators)
  }, [bodyScrollRef, selection, updateScrollIndicators])

  const renderItem = (item) => {
    const normalized = normalizeItem(item)

    return (
      <>
        {normalized.icon && (
          <img
            className="dock-page-item-icon"
            src={BASE + 'images/pages/' + normalized.icon}
            alt=""
          />
        )}
        <span className="dock-page-row-copy">
          <span className="dock-page-row-label">{normalized.label}</span>
          {normalized.description && (
            <span className="dock-page-row-description">{normalized.description}</span>
          )}
        </span>
      </>
    )
  }

  const createRenderSection = useCallback((nextRow) => (
    (section, keyPrefix = '', x = 0) => (
      <section
        key={`${keyPrefix}${section.title}`}
        className="dock-page-section"
        ref={(node) => {
          if (node) {
            sectionRefs.current[section.title] = node
          } else {
            delete sectionRefs.current[section.title]
          }
        }}
      >
        <div className="dock-page-section-title">{section.title}</div>
        <div className="dock-page-section-list">
          {section.items.map((item, index) => {
            const normalized = normalizeItem(item)
            const row = nextRow()
            if (index === 0) sectionFirstRowsRef.current[section.title] = row

            return (
              <SelectableRow
                key={`${keyPrefix}${section.title}-${index}-${normalized.label}`}
                row={row}
                x={x}
                className={`dock-page-section-row ${normalized.icon ? 'dock-page-section-row-icon' : 'dock-page-section-row-bullet'}`}
                onClick={() => handleModuleNavigate(normalized.targetPage)}
              >
                {!normalized.icon && <span className="dock-page-classic-bullet"></span>}
                {renderItem(item)}
              </SelectableRow>
            )
          })}
        </div>
      </section>
    )
  ), [handleModuleNavigate])

  return {
    handleCategoryClick,
    createRenderSection,
  }
}
