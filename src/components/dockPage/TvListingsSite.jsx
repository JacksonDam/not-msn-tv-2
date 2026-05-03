import { BASE, noop } from './shared'

export default function TvListingsSite({ pageRef, bodyScrollRef }) {
    return (
      <div ref={pageRef} className="dock-page-tv-listings-site-shell">
        <div ref={bodyScrollRef} className="dock-page-scroll-region dock-page-tv-listings-site-scroll" data-selection-scroll>
          <div className="dock-page-tv-listings-site">
            <nav className="dock-page-tv-listings-category-bar" aria-label="Entertainment categories">
              {['entertainment', 'movies', 'music', 'tv', 'more'].map((item, index) => (
                <div
                  key={item}
                  className={`dock-page-tv-listings-category selectable ${item === 'tv' ? 'current' : ''}`}
                  data-select-x={index}
                  data-select-height="0"
                  data-select-layer="0"
                  onClick={noop}
                >
                  {item}
                  {item === 'more' && (
                    <img
                      className="dock-page-tv-listings-more-arrow"
                      src={`${BASE}images/pages/tv-listings/arrow_down_white.gif`}
                      alt=""
                    />
                  )}
                </div>
              ))}
            </nav>

            <div className="dock-page-tv-listings-hero">
              <div className="dock-page-tv-listings-brand">
                <img className="dock-page-tv-listings-msn-logo" src={`${BASE}images/pages/tv-listings/msft.png`} alt="MSN" />
                <span className="dock-page-tv-listings-tv-word">tv</span>
              </div>
              <div className="dock-page-tv-listings-search">
                <input
                  className="dock-page-tv-listings-search-input selectable"
                  type="text"
                  aria-label="Search TV"
                  readOnly
                  data-select-x="0"
                  data-select-height="1"
                  data-select-layer="0"
                />
                <div className="dock-page-tv-listings-search-blend" aria-hidden="true"></div>
                <div
                  className="dock-page-tv-listings-search-button selectable"
                  data-select-x="1"
                  data-select-height="1"
                  data-select-layer="0"
                  onClick={noop}
                >
                  Search
                </div>
              </div>
            </div>

            <div className="dock-page-tv-listings-tabs">
              <button
                type="button"
                className="dock-page-tv-listings-tab selectable"
                data-select-x="0"
                data-select-height="2"
                data-select-layer="0"
                onClick={noop}
              >
                Home
              </button>
              {['TV Listings', "Tonight's Picks", 'Reality TV', 'TV Buzz', 'New on DVD'].map((tab, index) => (
                <div
                  key={tab}
                  className={`dock-page-tv-listings-tab selectable ${tab === 'TV Listings' ? 'current' : ''}`}
                  data-select-x={index + 1}
                  data-select-height="2"
                  data-select-layer="0"
                  onClick={noop}
                >
                  {tab}
                  {tab !== 'TV Listings' && (
                    <img
                      className="dock-page-tv-listings-tab-separator"
                      src={`${BASE}images/pages/tv-listings/nav_pipe.gif`}
                      alt=""
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="dock-page-tv-listings-title-strip">
              <h1 className="dock-page-tv-listings-title">TV Listings</h1>
            </div>

            <main className="dock-page-tv-listings-content">
              <div className="dock-page-tv-listings-loading" aria-live="polite">
                <img
                  className="dock-page-tv-listings-spinner"
                  src={`${BASE}images/pages/tv-listings/spin2.gif`}
                  alt=""
                  aria-hidden="true"
                />
                <div className="dock-page-tv-listings-loading-text">
                  retrieving<br />
                  listings<br />
                  information
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
}
