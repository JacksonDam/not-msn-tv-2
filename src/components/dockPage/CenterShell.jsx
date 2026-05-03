import {
  BASE,
  noop,
  normalizeItem,
  ScrollIndicator,
  SelectableRow,
  StaticRow,
} from './shared'

function getCenterShellClassName(page) {
  return `dock-page-shell theme-${page.theme} ${page.variant === 'newsCenter' || page.variant === 'newsLocalChange' || page.variant === 'newsLottery' ? 'dock-page-shell-news' : ''} ${page.variant === 'newsLocalChange' ? 'dock-page-shell-news-local-change' : ''} ${page.variant === 'newsLottery' ? 'dock-page-shell-news-lottery' : ''} ${String(page.variant ?? '').startsWith('weather') ? 'dock-page-shell-weather' : ''} ${page.variant === 'gamesCenter' ? 'dock-page-shell-games' : ''} ${page.variant === 'entertainmentMissing' || page.variant === 'entertainmentMovies' ? 'dock-page-shell-entertainment' : ''} ${page.variant === 'shopSpecialOffers' || page.variant === 'shopMissing' ? 'dock-page-shell-shop' : ''} ${page.variant === 'sportsTopStories' ? 'dock-page-shell-sports-top-stories' : ''} ${page.variant === 'sportsLeague' || page.variant === 'sportsNcaa' ? 'dock-page-shell-sports-nfl' : ''} ${page.variant === 'moneyCenter' ? 'dock-page-shell-money' : ''} ${page.variant === 'moneyBusinessNews' ? 'dock-page-shell-money-business-news' : ''} ${page.variant === 'moneyExperts' ? 'dock-page-shell-money-experts' : ''} ${page.variant?.startsWith('moneyStocks') ? 'dock-page-shell-money-stocks' : ''} ${page.variant === 'thingsToTry' ? 'dock-page-shell-things' : ''} ${page.variant === 'usingMain' ? 'dock-page-shell-using-main' : ''} ${page.variant === 'usingNewsletter' ? 'dock-page-shell-using-newsletter' : ''} ${page.variant === 'usingTipDetail' ? 'dock-page-shell-using-tip' : ''} ${page.sidebarCurrent === 'Newsletter' ? 'dock-page-shell-newsletter-section' : ''}`.trim()
}

function createRowAllocator() {
  let nextHeight = 1

  return () => {
    const row = nextHeight
    nextHeight += 1
    return row
  }
}

export default function CenterShell({
  page,
  pageRef,
  bodyScrollRef,
  canScrollUp,
  canScrollDown,
  sidebarRightTarget,
  onNavigate,
  renderContent,
}) {
  const nextRow = createRowAllocator()
  const headerTitle = page.headerTitle ?? page.title
  const headerSubtitle = page.headerSubtitle ?? page.subtitle

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
        x={-1}
        className="dock-page-sidebar-row"
        {...(sidebarRightTarget ? { 'data-select-right': sidebarRightTarget } : {})}
        onClick={() => onNavigate(targetPageId)}
      >
        <span className="dock-page-row-label">{item}</span>
      </SelectableRow>
    )
  }

  return (
    <div ref={pageRef} className={getCenterShellClassName(page)}>
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
                        x={-1}
                        className="dock-page-sidebar-card-row"
                        {...(sidebarRightTarget ? { 'data-select-right': sidebarRightTarget } : {})}
                        onClick={() => onNavigate(normalized.targetPage, {
                          crossfade: page.title === 'Entertainment' && normalized.targetPage === 'music',
                          crossfadeDelay: page.title === 'Entertainment' && normalized.targetPage === 'music' ? 500 : 0,
                        })}
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
            {renderContent(nextRow)}
          </main>
        </div>
      </div>

      <ScrollIndicator direction="up" visible={canScrollUp} />
      <ScrollIndicator direction="down" visible={canScrollDown} />
    </div>
  )
}
