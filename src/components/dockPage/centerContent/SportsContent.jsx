import { noop, SelectableRow } from '../shared'

function SportsTopStoriesContent({ page, sportsTopStories, nextRow }) {
  return (
              <div className="dock-page-sports-top-stories">
                <div className="dock-page-content-title dock-page-sports-top-stories-title">{page.contentTitle}</div>
                <div className="dock-page-sports-top-stories-list">
                  {(sportsTopStories.length ? sportsTopStories : [{ title: 'Sports news is temporarily unavailable', source: 'MSNBC' }]).slice(0, 10).map((item, index) => {
                    const title = String(item.title ?? '').trim()
                    const source = String(item.source ?? '').trim()
                    const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                    return (
                      <SelectableRow
                        key={`${index}-${label}`}
                        row={nextRow()}
                        x={0}
                        className="dock-page-sports-top-stories-row"
                        data-select-id={`sports-top-stories-${index}`}
                      >
                        <span className="dock-page-classic-bullet"></span>
                        <span className="dock-page-row-label">{label}</span>
                      </SelectableRow>
                    )
                  })}
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-top-stories-more"
                    data-select-id="sports-top-stories-more"
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More sports stories at NBC</span>
                  </SelectableRow>
                </div>
              </div>
  )
}

function SportsLeagueContent({ page, sportsLeagueStories, nextRow }) {
  return (
              <div className="dock-page-sports-nfl">
                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">{page.contentTitle}</div>
                  <div className="dock-page-sports-nfl-stories">
                    {(sportsLeagueStories.length ? sportsLeagueStories : [{ title: `${page.sportsLeagueName} news is temporarily unavailable`, source: '' }]).slice(0, 4).map((item, index) => {
                      const title = String(item.title ?? '').trim()
                      const source = String(item.source ?? '').trim()
                      const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                      return (
                        <SelectableRow
                          key={`${index}-${label}`}
                          row={nextRow()}
                          x={0}
                          className="dock-page-sports-nfl-story"
                          data-select-id={`sports-${page.sportsLeagueId}-story-${index}`}
                        >
                          <span className="dock-page-classic-bullet"></span>
                          <span className="dock-page-row-label">{label}</span>
                        </SelectableRow>
                      )
                    })}
                  </div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-news"
                    data-select-id={`sports-${page.sportsLeagueId}-more-news`}
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More {page.sportsLeagueNoun} news at MSNBC</span>
                  </SelectableRow>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">Look up news and scores by team</div>
                  {(() => {
                    const teamRow = nextRow()

                    return (
                      <div className="dock-page-sports-nfl-team-row">
                        <span className="dock-page-sports-nfl-team-label">Team name:</span>
                        <input
                          className="dock-page-sports-nfl-team-input selectable"
                          type="text"
                          aria-label="Team name"
                          readOnly
                          data-select-x="0"
                          data-select-height={teamRow}
                          data-select-layer="0"
                        />
                        <button
                          type="button"
                          className="dock-page-sports-nfl-go selectable"
                          data-select-x="1"
                          data-select-height={teamRow}
                          data-select-layer="0"
                          onClick={noop}
                        >
                          Go
                        </button>
                      </div>
                    )
                  })()}
                  <div className="dock-page-sports-nfl-example">Example: {page.sportsLeagueExample}</div>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">{page.sportsLeagueName} scoreboard</div>
                  <div className="dock-page-sports-nfl-empty">There are no recent games.</div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-scores"
                    data-select-id={`sports-${page.sportsLeagueId}-more-scores`}
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More {page.sportsLeagueNoun} scores at MSNBC</span>
                  </SelectableRow>
                </section>
              </div>
  )
}

function SportsNcaaContent({ sportsNcaaStories, nextRow }) {
  return (
              <div className="dock-page-sports-nfl dock-page-sports-ncaa">
                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">Top NCAA basketball stories</div>
                  <div className="dock-page-sports-nfl-stories">
                    {(sportsNcaaStories.basketball.length ? sportsNcaaStories.basketball : [{ title: 'NCAA basketball news is temporarily unavailable', source: '' }]).slice(0, 4).map((item, index) => {
                      const title = String(item.title ?? '').trim()
                      const source = String(item.source ?? '').trim()
                      const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                      return (
                        <SelectableRow
                          key={`basketball-${index}-${label}`}
                          row={nextRow()}
                          x={0}
                          className="dock-page-sports-nfl-story"
                          data-select-id={`sports-ncaa-basketball-story-${index}`}
                        >
                          <span className="dock-page-classic-bullet"></span>
                          <span className="dock-page-row-label">{label}</span>
                        </SelectableRow>
                      )
                    })}
                  </div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-news"
                    data-select-id="sports-ncaa-basketball-more-news"
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More men's basketball news at MSNBC</span>
                  </SelectableRow>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">NCAA basketball scoreboard</div>
                  <div className="dock-page-sports-nfl-empty">There are no recent games.</div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-scores"
                    data-select-id="sports-ncaa-basketball-more-scores"
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More basketball scores at MSNBC</span>
                  </SelectableRow>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">Top NCAA football stories</div>
                  <div className="dock-page-sports-nfl-stories">
                    {(sportsNcaaStories.football.length ? sportsNcaaStories.football : [{ title: 'NCAA football news is temporarily unavailable', source: '' }]).slice(0, 4).map((item, index) => {
                      const title = String(item.title ?? '').trim()
                      const source = String(item.source ?? '').trim()
                      const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                      return (
                        <SelectableRow
                          key={`football-${index}-${label}`}
                          row={nextRow()}
                          x={0}
                          className="dock-page-sports-nfl-story"
                          data-select-id={`sports-ncaa-football-story-${index}`}
                        >
                          <span className="dock-page-classic-bullet"></span>
                          <span className="dock-page-row-label">{label}</span>
                        </SelectableRow>
                      )
                    })}
                  </div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-news"
                    data-select-id="sports-ncaa-football-more-news"
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More men's football news at MSNBC</span>
                  </SelectableRow>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-sports-nfl-section">
                  <div className="dock-page-content-title dock-page-sports-nfl-title">NCAA football scoreboard</div>
                  <div className="dock-page-sports-nfl-empty">There are no recent games.</div>
                  <SelectableRow
                    row={nextRow()}
                    x={0}
                    className="dock-page-sports-nfl-more-scores"
                    data-select-id="sports-ncaa-football-more-scores"
                  >
                    <span className="dock-page-bullet" aria-hidden="true"></span>
                    <span className="dock-page-row-label">More football scores at MSNBC</span>
                  </SelectableRow>
                </section>
              </div>
  )
}

export default function SportsContent(props) {
  const { page } = props

  if (page.variant === 'sportsTopStories') {
    return SportsTopStoriesContent(props)
  }

  if (page.variant === 'sportsLeague') {
    return SportsLeagueContent(props)
  }

  if (page.variant === 'sportsNcaa') {
    return SportsNcaaContent(props)
  }

  return null
}
