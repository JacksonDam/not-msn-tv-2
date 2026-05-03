import { useEffect, useRef, useState } from 'react'
import { createEmptyMoneyQuote, fetchMoneyQuote, normalizeMoneySymbol } from '../../utils/moneyQuoteService'
import { noop } from './shared'

const CNBC_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/330px-CNBC_logo.svg.png'
const MSN_WORDMARK_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/MSN_2000-2009.png/330px-MSN_2000-2009.png'
const NBC_PEACOCK_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/NBC_Peacock_%282022%3B_outlined%29.svg/330px-NBC_Peacock_%282022%3B_outlined%29.svg.png'

export default function MoneyQuoteSite({ page, pageRef, bodyScrollRef, onNavigate }) {
  const moneyQuoteInputRef = useRef(null)
  const [moneyQuoteState, setMoneyQuoteState] = useState({
    status: 'idle',
    data: null,
    error: null,
  })

  const handleMoneyQuoteNavigate = (rawSymbol, fallbackSymbol = '') => {
    const normalized = normalizeMoneySymbol(rawSymbol || fallbackSymbol)
    if (!normalized) return
    onNavigate('money-quote:' + encodeURIComponent(normalized.inputSymbol))
  }

  useEffect(() => {
    if (!page.symbol) return undefined

    let cancelled = false
    setMoneyQuoteState({
      status: 'loading',
      data: null,
      error: null,
    })

    fetchMoneyQuote(page.symbol)
      .then((data) => {
        if (cancelled) return
        setMoneyQuoteState({
          status: 'success',
          data,
          error: null,
        })
      })
      .catch((error) => {
        if (cancelled) return
        setMoneyQuoteState({
          status: 'error',
          data: createEmptyMoneyQuote(page.symbol),
          error,
        })
      })

    return () => {
      cancelled = true
    }
  }, [page.symbol])

  let nextHeight = 1
  const nextRow = () => {
    const row = nextHeight
    nextHeight += 1
    return row
  }

    const quoteRow = nextRow()
    const actionRow = nextRow()
    const normalizedSymbol = normalizeMoneySymbol(page.symbol)
    const quoteData = moneyQuoteState.data ?? createEmptyMoneyQuote(page.symbol)
    const displaySymbol = normalizedSymbol?.displaySymbol ?? page.symbol
    const companyHeading = quoteData.name
      ? `${quoteData.name} (${displaySymbol})`
      : '\u00A0'
    const isNegative = (quoteData.change ?? 0) < 0
    const chartPoints = quoteData.series?.length ? quoteData.series : []
    const polylinePoints = chartPoints.length > 1
      ? (() => {
          const closes = chartPoints.map((point) => point.close)
          const low = Math.min(...closes)
          const high = Math.max(...closes)
          const range = high - low || 1

          return chartPoints
            .map((point, index) => {
              const x = chartPoints.length === 1 ? 0 : (index / (chartPoints.length - 1)) * 100
              const y = 56 - (((point.close - low) / range) * 48)
              return `${x},${y}`
            })
            .join(' ')
        })()
      : ''
    const topHeadline = quoteData.news?.title ?? '\u00A0'
    const marketDispatchesTimestamp = quoteData.news?.publishedAt
      ? new Date(quoteData.news.publishedAt)
      : new Date()
    const marketDispatchesTime = marketDispatchesTimestamp
      .toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
      })
      .toLowerCase()
      .replace(/\b([ap])m\b/g, '$1.m.')

    const formatNumber = (value, digits = 2) => (
      typeof value === 'number'
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          })
        : '--'
    )

    const formatSigned = (value, digits = 2) => {
      if (typeof value !== 'number') return '--'
      const absolute = Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
      return `${value >= 0 ? '+' : '-'}${absolute}`
    }

    return (
      <div ref={pageRef} className="dock-page-money-site-shell">
        <div ref={bodyScrollRef} className="dock-page-scroll-region dock-page-money-site-scroll" data-selection-scroll>
          <div className="dock-page-money-site">
            <div className="dock-page-money-site-topbar">
              <div className="dock-page-money-site-logo-group">
                <img
                  className="dock-page-money-site-logo-mark"
                  src={MSN_WORDMARK_URL}
                  alt="MSN"
                />
                <div className="dock-page-money-site-logo">Money</div>
              </div>
              <div className="dock-page-money-site-search-label">Search MSN Money:</div>
              <input
                className="dock-page-money-site-search-input search-input-stub selectable"
                type="text"
                aria-label="Search MSN Money"
                autoComplete="off"
                spellCheck={false}
                data-select-x="0"
                data-select-height={quoteRow}
                data-select-layer="0"
              />
              <button
                type="button"
                className="dock-page-money-site-go selectable"
                data-select-x="0"
                data-select-height={quoteRow}
                data-select-layer="0"
                onClick={noop}
              >
                Go
              </button>
              <img
                className="dock-page-money-site-network-logo"
                src={CNBC_LOGO_URL}
                alt="CNBC"
              />
              <button
                type="button"
                className="dock-page-money-site-help selectable"
                data-select-x="0"
                data-select-height="0"
                data-select-layer="0"
                onClick={noop}
              >
                Help
              </button>
            </div>

            <div className="dock-page-money-site-tabs">
              {['Home', 'News', 'Banking', 'Investing', 'Planning', 'Taxes', 'My Money', 'Portfolio', 'RSS', 'Loans', 'Insurance'].map((tab, index) => (
                <span key={tab} className={`dock-page-money-site-tab ${index === 3 ? 'current' : ''}`}>{tab}</span>
              ))}
            </div>

            <div className="dock-page-money-site-subtabs">
              {['Investing Home', 'Portfolio', 'Markets', 'Stocks', 'Funds', 'ETFs', 'Commentary', 'Brokers', 'CNBC TV'].map((tab, index) => (
                <span key={tab} className={`dock-page-money-site-subtab ${index === 3 ? 'current' : ''}`}>{tab}</span>
              ))}
            </div>

            <div className="dock-page-money-site-main">
              <aside className="dock-page-money-site-left">
                <div className="dock-page-money-site-left-title">Quote, Chart, News</div>
                {['Quotes', 'Charts', 'Components', 'Calculation'].map((item, index) => (
                  index === 0 ? (
                    <div key={item} className="dock-page-money-site-left-item current">{item}</div>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className="dock-page-money-site-left-item selectable"
                      data-select-x="-1"
                      data-select-height={nextRow()}
                      data-select-layer="0"
                      onClick={noop}
                    >
                      {item}
                    </button>
                  )
                ))}

                <div className="dock-page-money-site-left-links-title">Related Links</div>
                {['E-mail & Alerts', 'IPO Center', 'Message Boards'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="dock-page-money-site-link selectable"
                    data-select-x="-1"
                    data-select-height={nextRow()}
                    data-select-layer="0"
                    onClick={noop}
                  >
                    {item}
                  </button>
                ))}
              </aside>

              <main className="dock-page-money-site-content">
                <div className="dock-page-money-site-quote-controls">
                  <div className="dock-page-money-site-quote-label">Name or Symbol:</div>
                  <input
                    ref={moneyQuoteInputRef}
                    className="dock-page-money-site-quote-input search-input-stub selectable"
                    type="text"
                    aria-label="Quote symbol"
                    autoComplete="off"
                    spellCheck={false}
                    defaultValue={normalizedSymbol?.displaySymbol ?? page.symbol}
                    data-select-x="0"
                    data-select-height={actionRow}
                    data-select-layer="0"
                  />
                  <button
                    type="button"
                    className="dock-page-money-site-action selectable"
                    data-select-x="0"
                    data-select-height={actionRow}
                    data-select-layer="0"
                    onClick={() => handleMoneyQuoteNavigate(moneyQuoteInputRef.current?.value, page.symbol)}
                  >
                    Get Quote
                  </button>
                </div>

                {(() => {
                  const linksRow = nextRow()

                  return (
                    <div className="dock-page-money-site-links-row">
                      <button type="button" className="dock-page-money-site-link selectable" data-select-x="0" data-select-height={linksRow} data-select-layer="0" onClick={noop}>Find Symbol</button>
                      <button type="button" className="dock-page-money-site-link selectable" data-select-x="1" data-select-height={linksRow} data-select-layer="0" onClick={noop}>Add to MSN List</button>
                      <button type="button" className="dock-page-money-site-link selectable" data-select-x="2" data-select-height={linksRow} data-select-layer="0" onClick={noop}>Print Report</button>
                    </div>
                  )
                })()}

                <div className="dock-page-money-site-divider"></div>

                <div className="dock-page-money-site-columns">
                  <div className="dock-page-money-site-quote-panel">
                    <div className="dock-page-money-site-company">
                      {companyHeading}
                    </div>

                    <div className="dock-page-money-site-quote-card">
                      <div className="dock-page-money-site-quote-card-header">
                        <span className="dock-page-money-site-quote-card-header-primary">{displaySymbol} quote</span>
                        <span className="dock-page-money-site-quote-card-header-secondary">Real-time quotes</span>
                      </div>

                      <div className="dock-page-money-site-quote-card-main">
                        <div className="dock-page-money-site-price-block">
                          <div className="dock-page-money-site-price-row">
                            <div className="dock-page-money-site-price">{formatNumber(quoteData?.price)}</div>
                            <div className={`dock-page-money-site-change-block ${isNegative ? 'negative' : 'positive'}`}>
                              <div className="dock-page-money-site-change-arrow">{isNegative ? '▼' : '▲'}</div>
                              <div className={`dock-page-money-site-change-value ${isNegative ? 'negative' : 'positive'}`}>
                                {formatSigned(quoteData?.change)}
                              </div>
                            </div>
                          </div>
                          <div className={`dock-page-money-site-change-percent ${isNegative ? 'negative' : 'positive'}`}>
                            {formatSigned(quoteData?.changePercent)}%
                          </div>
                        </div>
                      </div>

                      <div className="dock-page-money-site-stats">
                        <div className="dock-page-money-site-stat">
                          <div className="dock-page-money-site-stat-label">Previous Close</div>
                          <div className="dock-page-money-site-stat-value">{formatNumber(quoteData?.previousClose)}</div>
                        </div>
                        <div className="dock-page-money-site-stat">
                          <div className="dock-page-money-site-stat-label">Day&apos;s High</div>
                          <div className="dock-page-money-site-stat-value">{formatNumber(quoteData?.dayHigh)}</div>
                        </div>
                        <div className="dock-page-money-site-stat">
                          <div className="dock-page-money-site-stat-label">Day&apos;s Low</div>
                          <div className="dock-page-money-site-stat-value">{formatNumber(quoteData?.dayLow)}</div>
                        </div>
                      </div>

                      <div className="dock-page-money-site-chart">
                        <div className="dock-page-money-site-chart-title">{displaySymbol} Intraday Chart</div>
                        <svg className="dock-page-money-site-chart-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
                          {polylinePoints && (
                            <polyline
                              fill="none"
                              stroke={isNegative ? '#b6374d' : '#2f8f4d'}
                              strokeWidth="2"
                              points={polylinePoints}
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                  </div>

                  <aside className="dock-page-money-site-news">
                    <div className="dock-page-money-site-news-brand-row">
                      <div className="dock-page-money-site-news-brand">
                        <img
                          className="dock-page-money-site-news-peacock"
                          src={NBC_PEACOCK_URL}
                          alt=""
                        />
                        Market Dispatches, {marketDispatchesTime} ET
                      </div>
                    </div>
                    <div className="dock-page-money-site-news-title">{topHeadline}</div>
                  </aside>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    )
}
