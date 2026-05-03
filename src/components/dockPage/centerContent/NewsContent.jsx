import { noop, SelectableRow } from '../shared'
import { createLotteryRows, fallbackNews } from '../data'

function NewsCenterContent({ page, newsStories, nextRow, handleModuleNavigate }) {
  return (
              (() => {
                const section = page.newsSection ?? 'top-stories'
                const stories = newsStories.length ? newsStories : fallbackNews(section)
                const titleBySection = {
                  'top-stories': 'Top Stories from MSNBC',
                  business: 'Business news from MSNBC',
                  technology: 'Technology news from MSNBC',
                  health: 'Health news from MSNBC',
                  travel: 'Travel news from MSNBC',
                  opinion: 'Opinions and analysis from MSNBC',
                  local: 'Local news for San Francisco, CA',
                }
                const isTopStories = section === 'top-stories'
                const isLocal = section === 'local'
                const contentTitle = titleBySection[section] ?? `${page.sidebarCurrent} news from MSNBC`
                const lead = stories[0]
                const bulletStories = isTopStories ? stories.slice(1, 9) : stories.slice(0, isLocal ? 4 : 8)

                return (
                  <div className={`dock-page-news dock-page-news-${section}`}>
                    {isTopStories && lead ? (
                      <>
                        <SelectableRow
                          row={nextRow()}
                          x={0}
                          className="dock-page-news-lead"
                          data-select-id={`news-${section}-story-0`}
                        >
                          <span className="dock-page-news-lead-title">{lead.title}</span>
                          <span className="dock-page-news-lead-copy">
                            {lead.description || 'Read the latest updates and developing stories from NBC News.'}
                          </span>
                        </SelectableRow>
                        <div className="dock-page-news-list">
                          {bulletStories.map((item, index) => (
                            <SelectableRow
                              key={`${index}-${item.title}`}
                              row={nextRow()}
                              x={0}
                              className="dock-page-news-row"
                              data-select-id={`news-${section}-story-${index + 1}`}
                            >
                              <span className="dock-page-classic-bullet"></span>
                              <span className="dock-page-row-label">{item.title}</span>
                            </SelectableRow>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="dock-page-content-title dock-page-news-title">{contentTitle}</div>
                        <div className="dock-page-news-list">
                          {bulletStories.map((item, index) => (
                            <SelectableRow
                              key={`${index}-${item.title}`}
                              row={nextRow()}
                              x={0}
                              className="dock-page-news-row"
                              data-select-id={`news-${section}-story-${index}`}
                            >
                              <span className="dock-page-classic-bullet"></span>
                              <span className="dock-page-row-label">{item.title}</span>
                            </SelectableRow>
                          ))}
                        </div>
                        {isLocal && (
                          <div className="dock-page-news-local-change">
                            <div className="dock-page-divider"></div>
                            <div className="dock-page-news-local-copy">
                              To get local news for another city, choose <b>Change City</b>.
                            </div>
                            <button
                              type="button"
                              className="dock-page-news-action selectable"
                              data-select-id="news-local-change-city"
                              data-select-x="0"
                              data-select-height={nextRow()}
                              data-select-layer="0"
                              onClick={() => handleModuleNavigate('news-local-change')}
                            >
                              Change City
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })()
  )
}

function NewsLocalChangeContent({ nextRow, handleModuleNavigate }) {
  return (
              (() => {
                const cityRow = nextRow()
                const actionRow = nextRow()

                return (
                  <div className="dock-page-news dock-page-news-change-city">
                    <div className="dock-page-content-title dock-page-news-title">Change your city for local news</div>
                    <div className="dock-page-news-change-copy">
                      The local news page currently shows headlines for London, England. To change this city,
                      type a city name or postal code, and then choose <b>Change</b>.
                    </div>
                    <input
                      className="dock-page-news-city-input search-input-stub selectable"
                      type="text"
                      aria-label="City name or postal code"
                      autoComplete="off"
                      spellCheck={false}
                      data-select-id="news-local-city-input"
                      data-select-x="0"
                      data-select-height={cityRow}
                      data-select-layer="0"
                    />
                    <div className="dock-page-news-example">Example: <b>London, England</b> or <b>W1 5DU</b></div>
                    <div className="dock-page-news-change-actions">
                      <button
                        type="button"
                        className="dock-page-news-action selectable"
                        data-select-id="news-local-cancel"
                        data-select-x="0"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate('news-local')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="dock-page-news-action selectable"
                        data-select-id="news-local-change"
                        data-select-x="1"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate('news-local')}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )
              })()
  )
}

function NewsLotteryContent({ nextRow }) {
  return (
              (() => {
                const lotteryRows = createLotteryRows()

                return (
                  <div className="dock-page-news dock-page-news-lottery">
                    <div className="dock-page-content-title dock-page-news-title">Lottery results for California</div>
                    <div className="dock-page-news-lottery-table">
                      <div className="dock-page-news-lottery-header">Date</div>
                      <div className="dock-page-news-lottery-header">Title</div>
                      <div className="dock-page-news-lottery-header">Results</div>
                      {lotteryRows.map((item) => (
                        <div key={`${item.title}-${item.results}`} className="dock-page-news-lottery-row">
                          <div>{item.date}</div>
                          <div>{item.title}</div>
                          <div>{item.results}</div>
                        </div>
                      ))}
                    </div>
                    <div className="dock-page-divider"></div>
                    <div className="dock-page-news-lottery-note">Lottery results provided by Lottery.com</div>
                    <div className="dock-page-news-lottery-copy">
                      To see lottery results for a different state, choose <b>Change State</b>.
                    </div>
                    <button
                      type="button"
                      className="dock-page-news-action dock-page-news-lottery-action selectable"
                      data-select-id="news-lottery-change-state"
                      data-select-x="0"
                      data-select-height={nextRow()}
                      data-select-layer="0"
                      onClick={noop}
                    >
                      Change State
                    </button>
                  </div>
                )
              })()
  )
}

export default function NewsContent(props) {
  const { page } = props

  if (page.variant === 'newsCenter') {
    return NewsCenterContent(props)
  }

  if (page.variant === 'newsLocalChange') {
    return NewsLocalChangeContent(props)
  }

  if (page.variant === 'newsLottery') {
    return NewsLotteryContent(props)
  }

  return null
}
