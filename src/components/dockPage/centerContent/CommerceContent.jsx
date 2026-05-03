import { BASE, noop, SelectableRow } from '../shared'

function MissingPageContent() {
  return (
              <div className="dock-page-entertainment-missing">
                <div className="dock-page-divider"></div>
                <div className="dock-page-content-title dock-page-entertainment-title">Page missing</div>
                <p>Unfortunately, this page is missing.</p>
                <p>You can help by retrieving any Cached items from your MSNTV2 if it hasn&apos;t been wiped clean.</p>
              </div>
  )
}

function ShopSpecialOffersContent({ nextRow }) {
  return (
              <div className="dock-page-shop-special">
                <section className="dock-page-shop-section">
                  <div className="dock-page-shop-section-row">
                    <img className="dock-page-shop-photo" src={`${BASE}images/pages/shop/sale.png`} alt="" />
                    <div className="dock-page-shop-section-text">
                      <div className="dock-page-content-title dock-page-shop-title">MSN Shopping</div>
                      <div className="dock-page-shop-list">
                        {['Clothing & shoes', "Editors' picks", 'Deals & clearance', 'Electronics & photo', 'Jewelry & watches'].map((item, index) => (
                          <SelectableRow
                            key={item}
                            row={nextRow()}
                            x={0}
                            className="dock-page-section-row dock-page-shop-row"
                            data-select-id={`shop-special-top-${index}`}
                          >
                            <span className="dock-page-classic-bullet"></span>
                            <span className="dock-page-row-label">{item}</span>
                          </SelectableRow>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="dock-page-shop-section">
                  <div className="dock-page-content-title dock-page-shop-title">MSN Shopping</div>
                  <div className="dock-page-shop-list">
                    {["Editors' picks", 'Deals & clearance', 'Gift center'].map((item, index) => (
                      <SelectableRow
                        key={item}
                        row={nextRow()}
                        x={0}
                        className="dock-page-section-row dock-page-shop-row"
                        data-select-id={`shop-special-bottom-${index}`}
                      >
                        <span className="dock-page-classic-bullet"></span>
                        <span className="dock-page-row-label">{item}</span>
                      </SelectableRow>
                    ))}
                  </div>
                </section>
              </div>
  )
}

function EntertainmentMoviesContent({ nextRow }) {
  return (
              <div className="dock-page-entertainment-movies">
                <section className="dock-page-entertainment-movies-section dock-page-entertainment-movies-showtimes">
                  <div className="dock-page-content-title dock-page-entertainment-title">Find local movie showtimes</div>
                  {(() => {
                    const movieZipRow = nextRow()

                    return (
                      <div className="dock-page-entertainment-movies-search-row">
                        <label className="dock-page-entertainment-movies-label" htmlFor="entertainment-movies-zip">
                          Enter city name or ZIP<br />
                          code:
                        </label>
                        <input
                          id="entertainment-movies-zip"
                          className="dock-page-entertainment-movies-input search-input-stub selectable"
                          type="text"
                          data-select-id="entertainment-movies-zip"
                          data-select-x="0"
                          data-select-height={movieZipRow}
                          data-select-layer="0"
                        />
                        <button
                          type="button"
                          className="dock-page-entertainment-movies-go selectable"
                          data-select-id="entertainment-movies-go"
                          data-select-x="1"
                          data-select-height={movieZipRow}
                          data-select-layer="0"
                          onClick={noop}
                        >
                          Go
                        </button>
                      </div>
                    )
                  })()}
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-entertainment-movies-section dock-page-entertainment-featured-section">
                  <div className="dock-page-content-title dock-page-entertainment-title">Featured movie selections</div>
                  <div className="dock-page-entertainment-featured-list">
                    {['Movie News', 'Now Playing', 'Coming Soon', 'New on DVD/Video'].map((item, index) => (
                      <SelectableRow
                        key={item}
                        row={nextRow()}
                        x={0}
                        className="dock-page-entertainment-featured-row"
                        data-select-id={`entertainment-movies-featured-${index}`}
                      >
                        <span className="dock-page-classic-bullet"></span>
                        <span className="dock-page-row-label">{item}</span>
                      </SelectableRow>
                    ))}
                  </div>
                </section>

                <div className="dock-page-divider"></div>

                <section className="dock-page-entertainment-movies-section">
                  <div className="dock-page-content-title dock-page-entertainment-title">Top-grossing movies</div>
                  <div className="dock-page-entertainment-grossing-list">
                    {[
                      'Spider-Man 3 -- $148M',
                      'Disturbia -- $5.7M',
                      'Fracture -- $3.4M',
                      'The Invisible -- $3.1M',
                      'Next -- $2.8M',
                      'Lucky You -- $2.5M',
                      'Meet the Robinsons -- $2.5M',
                      'Blades of Glory -- $2.3M',
                      'Hot Fuzz -- $2.1M',
                      'Are We Done Yet? -- $1.7M',
                    ].map((item, index) => (
                      <SelectableRow
                        key={item}
                        row={nextRow()}
                        x={0}
                        className="dock-page-entertainment-grossing-row"
                        data-select-id={`entertainment-movies-grossing-${index}`}
                      >
                        <span className="dock-page-entertainment-grossing-number">{index + 1}.</span>
                        <span className="dock-page-row-label">{item}</span>
                      </SelectableRow>
                    ))}
                  </div>
                </section>
              </div>
  )
}

export default function CommerceContent(props) {
  const { page } = props

  if (page.variant === 'entertainmentMissing' || page.variant === 'shopMissing') {
    return MissingPageContent(props)
  }

  if (page.variant === 'shopSpecialOffers') {
    return ShopSpecialOffersContent(props)
  }

  if (page.variant === 'entertainmentMovies') {
    return EntertainmentMoviesContent(props)
  }

  return null
}
