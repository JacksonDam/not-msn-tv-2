import { useCallback, useEffect, useRef, useState } from 'react'
import { DOCK_PAGES } from '../data/dockContent'
import animateScrollTop from '../utils/animateScrollTop'

const BASE = import.meta.env.BASE_URL

const noop = () => {}

function normalizeItem(item) {
  return typeof item === 'string' ? { label: item } : item
}

function SelectableRow({ row, children, onClick = noop, className = '', x = 0, layer = 0, ...props }) {
  return (
    <button
      type="button"
      className={`dock-page-row selectable ${className}`.trim()}
      data-select-x={x}
      data-select-height={row}
      data-select-layer={layer}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

function StaticRow({ children, className = '' }) {
  return <div className={`dock-page-row ${className}`.trim()}>{children}</div>
}

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

function ScrollIndicator({ direction, visible }) {
  return (
    <img
      className={`dock-page-scroll-indicator dock-page-scroll-indicator-${direction} ${visible ? '' : 'hidden'}`}
      src={`${BASE}images/scrollindicatordown.png`}
      alt=""
    />
  )
}

function UsingMainModuleIcon({ icon }) {
  const iconFile = {
    tips: 'usingmsntv-tips.png',
    things: 'usingmsntv-ttt.png',
    newsletter: 'usingmsntv-newsletter.png',
  }[icon]

  if (!iconFile) return null

  return (
    <img
      className="dock-page-using-main-icon-image"
      src={`${BASE}images/pages/${iconFile}`}
      alt=""
    />
  )
}

export default function DockPage({ pageId, pageRef, onClose, selection, onNavigate = noop }) {
  const page = DOCK_PAGES[pageId]
  const bodyScrollRef = useRef(null)
  const sectionRefs = useRef({})
  const sectionFirstRowsRef = useRef({})
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  if (!page) return null
  sectionFirstRowsRef.current = {}

  const shellNodeRef = useRef(null)
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
    if (!node) return

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
  }, [selection, updateScrollIndicators])

  const handleModuleNavigate = useCallback((targetPageId) => {
    if (!targetPageId) return
    onNavigate(targetPageId)
  }, [onNavigate])

  let nextHeight = 1
  const nextRow = () => {
    const row = nextHeight
    nextHeight += 1
    return row
  }

  const renderItem = (item) => {
    const normalized = normalizeItem(item)

    return (
      <>
        {normalized.icon && (
          <img
            className="dock-page-item-icon"
            src={`${BASE}images/pages/${normalized.icon}`}
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

  if (page.layout === 'search') {
    const searchRow = nextRow()
    const tipRow = nextRow()

    return (
      <div ref={setShellRef} className={`dock-page-shell dock-page-search-shell theme-${page.theme}`}>
        <div ref={bodyScrollRef} className="dock-page-scroll-region" data-selection-scroll>
          <div className="dock-page-header">
            <div className="dock-page-header-title-wrap">
              <div className="dock-page-header-title">{page.title}</div>
              <div className="dock-page-header-subtitle">{page.subtitle}</div>
            </div>
            <div className="dock-page-header-actions">
              <button
                type="button"
                className="dock-page-help-btn selectable"
                data-select-x="0"
                data-select-height="0"
                data-select-layer="0"
                onClick={noop}
              >
                Help
                <img className="dock-page-help-icon" src={`${BASE}images/helpicon.png`} alt="" />
              </button>
            </div>
          </div>

          <div className="dock-page-search-body">
            <div className="dock-page-search-copy">Type a word or phrase to search for:</div>
            <div className="dock-page-search-bar">
              <input
                className="dock-page-search-input search-input-stub selectable"
                type="text"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
                data-select-x="0"
                data-select-height={searchRow}
                data-select-layer="0"
              />
              <button
                type="button"
                className="dock-page-search-submit selectable"
                data-select-x="0"
                data-select-height={searchRow}
                data-select-layer="0"
                onClick={noop}
              >
                Search
              </button>
            </div>

            <div className="dock-page-search-tip-lead">{page.tipLead}</div>
            <button
              type="button"
              className="dock-page-search-tip selectable"
              data-select-x="0"
              data-select-height={tipRow}
              data-select-layer="0"
              onClick={noop}
            >
              <span className="dock-page-bullet"></span>
              {page.tipLabel}
            </button>

            <div className="dock-page-divider"></div>
            <div className="dock-page-section-title dock-page-section-title-search">
              {page.resourcesTitle}
            </div>
            <div className="dock-page-resource-list">
              {page.resources.map((resource) => (
                <SelectableRow key={resource} row={nextRow()} className="dock-page-resource-row">
                  <span className="dock-page-row-label">{resource}</span>
                </SelectableRow>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const headerTitle = page.headerTitle ?? page.title
  const headerSubtitle = page.headerSubtitle ?? page.subtitle
  const tipInlineLinkTarget = page.tipBodyHtml?.includes('dock-page-tip-inline-link') ? 'tip-inline-link-0' : null
  const tipDetailRightTarget = page.variant === 'usingTipDetail'
    ? (tipInlineLinkTarget ?? page.sidebarRightTarget ?? page.actions?.[0]?.selectId ?? 'tip-detail-other')
    : page.sidebarRightTarget

  const renderSidebarItem = (item) => {
    const targetPageId = page.sidebarTargets?.[item]

    if (item === page.sidebarCurrent) {
      return (
        <StaticRow key={item} className="dock-page-sidebar-row dock-page-sidebar-row-current">
          <span className="dock-page-row-label">{item}</span>
        </StaticRow>
      )
    }

    return (
      <SelectableRow
        key={item}
        row={nextRow()}
        className="dock-page-sidebar-row"
        {...(tipDetailRightTarget ? { 'data-select-right': tipDetailRightTarget } : {})}
        onClick={() => handleModuleNavigate(targetPageId)}
      >
        <span className="dock-page-row-label">{item}</span>
      </SelectableRow>
    )
  }

  const renderSection = (section, keyPrefix = '', x = 0) => (
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

  return (
    <div
      ref={setShellRef}
      className={`dock-page-shell theme-${page.theme} ${page.variant === 'thingsToTry' ? 'dock-page-shell-things' : ''} ${page.variant === 'usingMain' ? 'dock-page-shell-using-main' : ''} ${page.variant === 'usingNewsletter' ? 'dock-page-shell-using-newsletter' : ''} ${page.variant === 'usingTipDetail' ? 'dock-page-shell-using-tip' : ''} ${page.sidebarCurrent === 'Newsletter' ? 'dock-page-shell-newsletter-section' : ''}`.trim()}
    >
      <div ref={bodyScrollRef} className="dock-page-scroll-region" data-selection-scroll>
        <div className="dock-page-header">
          <div className="dock-page-header-title-wrap">
            <div className="dock-page-header-title">{headerTitle}</div>
            <div className="dock-page-header-subtitle">{headerSubtitle}</div>
          </div>
          <div className="dock-page-header-actions">
            <button
              type="button"
              className="dock-page-help-btn selectable"
              data-select-x="0"
              data-select-height="0"
              data-select-layer="0"
              onClick={noop}
            >
              Help
              <img className="dock-page-help-icon" src={`${BASE}images/helpicon.png`} alt="" />
            </button>
          </div>
        </div>

        <div className="dock-page-body">
          <aside className="dock-page-sidebar">
            <div className="dock-page-sidebar-items">
              {page.sidebar.map(renderSidebarItem)}
            </div>

            {page.sidebarBox && (
              <div className="dock-page-sidebar-card">
                <div className="dock-page-sidebar-card-title">{page.sidebarBox.title}</div>
                <div className="dock-page-sidebar-card-list">
                  {page.sidebarBox.items.map((item) => {
                    const normalized = normalizeItem(item)

                    return (
                      <SelectableRow
                        key={normalized.label}
                        row={nextRow()}
                        className="dock-page-sidebar-card-row"
                        {...(tipDetailRightTarget ? { 'data-select-right': tipDetailRightTarget } : {})}
                        onClick={() => handleModuleNavigate(normalized.targetPage)}
                      >
                        <span className="dock-page-row-label">{normalized.label}</span>
                      </SelectableRow>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>

          <main className="dock-page-content">
            {page.variant === 'usingMain' ? (
              <div className="dock-page-using-main">
                {page.modules.map((module, index) => {
                  const titleRow = nextRow()
                  const linkRow = nextRow()

                  return (
                    <section key={module.title} className="dock-page-using-main-module">
                      <div className="dock-page-using-main-summary">
                        <div className="dock-page-using-main-icon-wrap">
                          <UsingMainModuleIcon icon={module.icon} />
                        </div>
                        <div className="dock-page-using-main-copy">
                          <button
                            type="button"
                            className="dock-page-using-main-title selectable"
                            data-select-x="0"
                            data-select-height={titleRow}
                            data-select-layer="0"
                            onClick={() => handleModuleNavigate(module.targetPage)}
                          >
                            {module.title}
                          </button>
                          <div className="dock-page-using-main-description">{module.description}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="dock-page-using-main-link selectable"
                        data-select-x="0"
                        data-select-height={linkRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate(module.targetPage)}
                      >
                        <span className="dock-page-using-main-link-bullet" aria-hidden="true">
                          •
                        </span>
                        <span className="dock-page-using-main-link-text">{module.linkText}</span>
                      </button>

                      {index < page.modules.length - 1 && <div className="dock-page-using-main-divider"></div>}
                    </section>
                  )
                })}
              </div>
            ) : page.variant === 'usingNewsletter' ? (
              <div className="dock-page-using-newsletter">
                <div className="dock-page-content-title">{page.contentTitle}</div>

                <div className="dock-page-using-newsletter-feature">
                  <div className="dock-page-using-newsletter-media">
                    <img
                      className="dock-page-using-newsletter-image"
                      src={`${BASE}images/pages/${page.feature.image}`}
                      alt=""
                    />
                  </div>

                  <button
                    type="button"
                    className="dock-page-using-newsletter-feature-copy selectable"
                    data-select-x="0"
                    data-select-height={nextRow()}
                    data-select-layer="0"
                    onClick={() => handleModuleNavigate(page.feature.targetPage)}
                  >
                    <div className="dock-page-using-newsletter-feature-title">{page.feature.title}</div>
                    <div className="dock-page-using-newsletter-feature-description">{page.feature.description}</div>
                  </button>
                </div>

                <div className="dock-page-using-newsletter-links">
                  {page.links.map((item) => (
                    <SelectableRow
                      key={normalizeItem(item).label}
                      row={nextRow()}
                      x={0}
                      className="dock-page-using-newsletter-link"
                      onClick={() => handleModuleNavigate(normalizeItem(item).targetPage)}
                    >
                      <span className="dock-page-using-newsletter-link-bullet" aria-hidden="true">
                        •
                      </span>
                      <span className="dock-page-row-label">{normalizeItem(item).label}</span>
                    </SelectableRow>
                  ))}
                </div>
              </div>
            ) : page.variant === 'usingTipDetail' ? (
              <div className="dock-page-using-tip">
                <div className="dock-page-content-title dock-page-using-tip-title">{page.contentTitle}</div>

                {page.byline && <div className="dock-page-using-tip-byline">{page.byline}</div>}

                {(() => {
                  let inlineLinkIndex = 0
                  const tipBodyHtml = page.tipBodyHtml.replace(
                    /<span class="dock-page-tip-inline-link">([\s\S]*?)<\/span>/g,
                    (_, linkLabel) => {
                      const inlineLinkId = `tip-inline-link-${inlineLinkIndex}`
                      inlineLinkIndex += 1
                      return `<span class="dock-page-tip-inline-link selectable" data-select-id="${inlineLinkId}" data-select-x="0" data-select-height="${nextRow()}" data-select-layer="0">${linkLabel}</span>`
                    },
                  )

                  return (
                    <div
                      className="dock-page-using-tip-body"
                      dangerouslySetInnerHTML={{ __html: tipBodyHtml }}
                    />
                  )
                })()}

                {(() => {
                  const actionRow = nextRow()
                  const actions = page.actions ?? [
                    { label: 'Other Tips', targetPage: 'tips', selectId: 'tip-detail-other' },
                    { label: 'Done', close: true, selectId: 'tip-detail-done' },
                  ]

                  return (
                    <div className="dock-page-using-tip-actions">
                      {actions.map((action, index) => (
                        <SelectableRow
                          key={action.label}
                          row={actionRow}
                          x={index}
                          className="dock-page-using-tip-action base-btn"
                          {...(action.selectId ? { 'data-select-id': action.selectId } : {})}
                          onClick={action.close ? onClose : () => handleModuleNavigate(action.targetPage)}
                        >
                          <span className="dock-page-row-label">{action.label}</span>
                        </SelectableRow>
                      ))}
                    </div>
                  )
                })()}
              </div>
            ) : page.variant === 'thingsToTry' ? (
              <>
                <div className="dock-page-content-title">{page.contentTitle}</div>
                {(() => {
                  const categoryRows = Array.from(
                    { length: Math.max(...page.categoryColumns.map((column) => column.length)) },
                    () => nextRow(),
                  )

                  return (
                    <div className="dock-page-category-box">
                      {page.categoryColumns.map((column, columnIndex) => (
                        <div key={`category-column-${columnIndex}`} className="dock-page-category-column">
                          {column.map((category, rowIndex) => (
                            <button
                              key={category}
                              type="button"
                              className="dock-page-category-link selectable"
                              data-select-x={columnIndex}
                              data-select-height={categoryRows[rowIndex]}
                              data-select-layer="0"
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                <div className="dock-page-things-columns">
                  {page.columns.map((column, columnIndex) => (
                    <div key={`things-column-${columnIndex}`} className="dock-page-things-column">
                      {column.map((section) => renderSection(section, `things-${columnIndex}-`, columnIndex))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="dock-page-promo">
                  {(page.promo?.image || page.promo?.secondaryImage) && (
                    <div className="dock-page-promo-images">
                      {page.promo?.image && (
                        <img
                          className="dock-page-promo-image dock-page-promo-image-primary"
                          src={`${BASE}images/pages/${page.promo.image}`}
                          alt=""
                        />
                      )}
                      {page.promo?.secondaryImage && (
                        <img
                          className="dock-page-promo-image dock-page-promo-image-secondary"
                          src={`${BASE}images/pages/${page.promo.secondaryImage}`}
                          alt=""
                        />
                      )}
                    </div>
                  )}
                  <div className="dock-page-promo-copy">
                    {page.promo?.eyebrow && <div className="dock-page-promo-eyebrow">{page.promo.eyebrow}</div>}
                    <div className="dock-page-promo-title">{page.promo?.title}</div>
                    <div className="dock-page-promo-body">{page.promo?.body}</div>
                  </div>
                </div>

                {page.highlights?.length > 0 && (
                  <div className="dock-page-highlight-grid">
                    {page.highlights.map((item) => (
                      <div key={item.label} className="dock-page-highlight-card">
                        <div className="dock-page-highlight-label">{item.label}</div>
                        <div className="dock-page-highlight-value">{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dock-page-sections">
                  {page.sections.map((section) => renderSection(section, '', 0))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <ScrollIndicator direction="up" visible={canScrollUp} />
      <ScrollIndicator direction="down" visible={canScrollDown} />
    </div>
  )
}
