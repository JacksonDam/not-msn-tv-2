import { BASE, noop, SelectableRow } from './shared'

export default function SearchDockPage({ page, pageRef, bodyScrollRef }) {
  let nextHeight = 1
  const nextRow = () => {
    const row = nextHeight
    nextHeight += 1
    return row
  }

    const searchRow = nextRow()
    const tipRow = nextRow()

    return (
      <div ref={pageRef} className={`dock-page-shell dock-page-search-shell theme-${page.theme}`}>
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
