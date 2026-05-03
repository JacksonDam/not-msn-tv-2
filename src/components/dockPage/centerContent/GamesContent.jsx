import { BASE, normalizeItem, SelectableRow } from '../shared'

function GamesContent({ page, nextRow, handleModuleNavigate }) {
  return (
              <div className="dock-page-games">
                <div className="dock-page-games-intro">{page.intro}</div>

                <div className="dock-page-games-list">
                  {page.gamesItems.map((item) => {
                    const normalized = normalizeItem(item)

                    return (
                      <div key={normalized.label}>
                        <SelectableRow
                          row={nextRow()}
                          x={0}
                          className="dock-page-games-row"
                          onClick={() => handleModuleNavigate(normalized.targetPage)}
                        >
                          {normalized.image ? (
                            <img
                              className={`dock-page-games-thumb-image ${normalized.imageClassName ?? ''}`.trim()}
                              src={`${BASE}images/pages/${normalized.image}`}
                              alt=""
                            />
                          ) : (
                            <span
                              className={`dock-page-games-thumb dock-page-games-thumb-${normalized.stubThumb ?? 'placeholder'}`}
                              aria-hidden="true"
                            />
                          )}
                          <span className="dock-page-row-label">{normalized.label}</span>
                        </SelectableRow>
                        <div className="dock-page-divider"></div>
                      </div>
                    )
                  })}

                  {page.stubLabel && (
                    <div>
                      <SelectableRow
                        row={nextRow()}
                        x={0}
                        className="dock-page-games-row dock-page-games-row-stub"
                      >
                        <span className="dock-page-games-thumb dock-page-games-thumb-placeholder" aria-hidden="true" />
                        <span className="dock-page-row-label">{page.stubLabel}</span>
                      </SelectableRow>
                      <div className="dock-page-divider"></div>
                    </div>
                  )}
                </div>
              </div>
  )
}

export default GamesContent
