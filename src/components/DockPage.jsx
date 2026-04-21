import { useCallback, useEffect, useRef, useState } from 'react'
import { DOCK_PAGES } from '../data/dockContent'
import animateScrollTop from '../utils/animateScrollTop'
import {
  createEmptyMoneyQuote,
  fetchMoneyQuote,
  fetchMoneyQuoteSnapshot,
  normalizeMoneySymbol,
} from '../utils/moneyQuoteService'
import {
  getMoneyWatchlistMeta,
  normalizeMoneyWatchlistInput,
  readMoneyWatchlistCookie,
  writeMoneyWatchlistCookie,
} from '../utils/moneyWatchlist'

const BASE = import.meta.env.BASE_URL
const CNBC_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/330px-CNBC_logo.svg.png'
const MSN_WORDMARK_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/MSN_2000-2009.png/330px-MSN_2000-2009.png'
const NBC_PEACOCK_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/NBC_Peacock_%282022%3B_outlined%29.svg/330px-NBC_Peacock_%282022%3B_outlined%29.svg.png'

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
  const moneyQuoteSymbol = typeof pageId === 'string' && pageId.startsWith('money-quote:')
    ? decodeURIComponent(pageId.slice('money-quote:'.length))
    : null
  const page = DOCK_PAGES[pageId] ?? (moneyQuoteSymbol ? {
    layout: 'moneySite',
    title: 'Money',
    subtitle: 'Quote',
    symbol: moneyQuoteSymbol,
  } : null)
  const bodyScrollRef = useRef(null)
  const sectionRefs = useRef({})
  const sectionFirstRowsRef = useRef({})
  const moneyLookupInputRef = useRef(null)
  const moneyQuoteInputRef = useRef(null)
  const moneyWatchlistInputRef = useRef(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [moneyQuoteState, setMoneyQuoteState] = useState({
    status: 'idle',
    data: null,
    error: null,
  })
  const [moneyWatchlistSymbols, setMoneyWatchlistSymbols] = useState(() => readMoneyWatchlistCookie())
  const [moneyWatchlistQuotes, setMoneyWatchlistQuotes] = useState({})
  const [moneyWatchlistSelection, setMoneyWatchlistSelection] = useState({})
  const [moneyBusinessNews, setMoneyBusinessNews] = useState([])

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

  const handleMoneyQuoteNavigate = useCallback((rawSymbol, fallbackSymbol = '') => {
    const normalized = normalizeMoneySymbol(rawSymbol || fallbackSymbol)
    if (!normalized) return
    handleModuleNavigate(`money-quote:${encodeURIComponent(normalized.inputSymbol)}`)
  }, [handleModuleNavigate])

  const isMoneyStocksVariant = page.variant === 'moneyStocks'
    || page.variant === 'moneyStocksAdd'
    || page.variant === 'moneyStocksRemove'

  useEffect(() => {
    if (!isMoneyStocksVariant) return
    const stored = readMoneyWatchlistCookie()
    setMoneyWatchlistSymbols(stored)
    setMoneyWatchlistSelection((current) => (
      Object.fromEntries(stored.map((symbol) => [symbol, current[symbol] ?? false]))
    ))
  }, [isMoneyStocksVariant, pageId])

  useEffect(() => {
    writeMoneyWatchlistCookie(moneyWatchlistSymbols)
  }, [moneyWatchlistSymbols])

  useEffect(() => {
    if (!isMoneyStocksVariant) return undefined

    let cancelled = false

    Promise.all(
      moneyWatchlistSymbols.map(async (symbol) => {
        const quote = await fetchMoneyQuoteSnapshot(symbol)
        return [symbol, quote ?? createEmptyMoneyQuote(symbol)]
      }),
    ).then((entries) => {
      if (cancelled) return
      setMoneyWatchlistQuotes(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [isMoneyStocksVariant, moneyWatchlistSymbols])

  useEffect(() => {
    if (page.variant !== 'moneyBusinessNews') return undefined

    let cancelled = false

    fetch(`${BASE}data/money/business-news.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const headlines = Array.isArray(data?.headlines) ? data.headlines.slice(0, 10) : []
        setMoneyBusinessNews(headlines)
      })
      .catch(() => {
        if (!cancelled) setMoneyBusinessNews([])
      })

    return () => {
      cancelled = true
    }
  }, [page.variant, pageId])

  const handleMoneyWatchlistAdd = useCallback(() => {
    const symbol = normalizeMoneyWatchlistInput(moneyWatchlistInputRef.current?.value)
    if (!symbol) return

    setMoneyWatchlistSymbols((current) => (
      current.includes(symbol) ? current : [...current, symbol]
    ))
    setMoneyWatchlistSelection((current) => ({ ...current, [symbol]: false }))
    if (moneyWatchlistInputRef.current) {
      moneyWatchlistInputRef.current.value = ''
    }
    handleModuleNavigate('money-stocks')
  }, [handleModuleNavigate])

  const toggleMoneyWatchlistSelection = useCallback((symbol) => {
    setMoneyWatchlistSelection((current) => ({
      ...current,
      [symbol]: !current[symbol],
    }))
  }, [])

  const handleMoneyWatchlistRemove = useCallback(() => {
    setMoneyWatchlistSymbols((current) => current.filter((symbol) => !moneyWatchlistSelection[symbol]))
    setMoneyWatchlistSelection({})
    handleModuleNavigate('money-stocks')
  }, [handleModuleNavigate, moneyWatchlistSelection])

  useEffect(() => {
    if (page.layout !== 'moneySite' || !page.symbol) return undefined

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
  }, [page.layout, page.symbol])

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

  if (page.layout === 'moneySite') {
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
      <div ref={setShellRef} className="dock-page-money-site-shell">
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

  const headerTitle = page.headerTitle ?? page.title
  const headerSubtitle = page.headerSubtitle ?? page.subtitle
  const tipInlineLinkTarget = page.tipBodyHtml?.includes('dock-page-tip-inline-link') ? 'tip-inline-link-0' : null
  const tipDetailRightTarget = page.variant === 'usingTipDetail'
    ? (tipInlineLinkTarget ?? page.sidebarRightTarget ?? page.actions?.[0]?.selectId ?? 'tip-detail-other')
    : page.sidebarRightTarget
  const moneyStocksRightTarget = page.variant === 'moneyStocks'
    ? (moneyWatchlistSymbols.length ? 'money-stocks-row-0' : 'money-stocks-add')
    : page.variant === 'moneyStocksAdd'
      ? 'money-stocks-add-input'
      : page.variant === 'moneyStocksRemove'
        ? (moneyWatchlistSymbols.length ? 'money-stocks-remove-row-0' : 'money-stocks-remove-cancel')
        : null
  const sidebarRightTarget = tipDetailRightTarget ?? moneyStocksRightTarget

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
      className={`dock-page-shell theme-${page.theme} ${page.variant === 'gamesCenter' ? 'dock-page-shell-games' : ''} ${page.variant === 'moneyCenter' ? 'dock-page-shell-money' : ''} ${page.variant === 'moneyBusinessNews' ? 'dock-page-shell-money-business-news' : ''} ${page.variant === 'moneyExperts' ? 'dock-page-shell-money-experts' : ''} ${page.variant?.startsWith('moneyStocks') ? 'dock-page-shell-money-stocks' : ''} ${page.variant === 'thingsToTry' ? 'dock-page-shell-things' : ''} ${page.variant === 'usingMain' ? 'dock-page-shell-using-main' : ''} ${page.variant === 'usingNewsletter' ? 'dock-page-shell-using-newsletter' : ''} ${page.variant === 'usingTipDetail' ? 'dock-page-shell-using-tip' : ''} ${page.sidebarCurrent === 'Newsletter' ? 'dock-page-shell-newsletter-section' : ''}`.trim()}
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
                      x={-1}
                      className="dock-page-sidebar-card-row"
                        {...(sidebarRightTarget ? { 'data-select-right': sidebarRightTarget } : {})}
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
            {page.variant === 'gamesCenter' ? (
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
            ) : page.variant === 'moneyCenter' ? (
              <div className="dock-page-money">
                <div className="dock-page-content-title dock-page-money-title">{page.contentTitle}</div>
                <div className="dock-page-money-message">{page.message}</div>

                <div className="dock-page-divider"></div>

                <div className="dock-page-content-title dock-page-money-title">{page.lookupTitle}</div>
                {(() => {
                  const lookupRow = nextRow()

                  return (
                    <div className="dock-page-money-lookup-row">
                      <div className="dock-page-money-prompt">{page.lookupPrompt}</div>
                      <input
                        ref={moneyLookupInputRef}
                        className="dock-page-money-input search-input-stub selectable"
                        type="text"
                        aria-label="Stock symbol"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={10}
                        data-select-x="0"
                        data-select-height={lookupRow}
                        data-select-layer="0"
                      />
                      <button
                        type="button"
                        className="dock-page-money-submit selectable"
                        data-select-x="0"
                        data-select-height={lookupRow}
                        data-select-layer="0"
                        onClick={() => handleMoneyQuoteNavigate(moneyLookupInputRef.current?.value)}
                      >
                        {page.lookupButtonLabel}
                      </button>
                    </div>
                  )
                })()}
              </div>
            ) : page.variant === 'moneyBusinessNews' ? (
              <div className="dock-page-money-business-news">
                <div className="dock-page-content-title dock-page-money-business-news-title">{page.contentTitle}</div>
                <div className="dock-page-money-business-news-list">
                  {(moneyBusinessNews.length ? moneyBusinessNews : [{ title: 'Business news is temporarily unavailable', source: 'MSNBC' }]).slice(0, 10).map((item, index) => {
                    const title = String(item.title ?? '').trim()
                    const source = String(item.source ?? '').trim()
                    const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                    return (
                      <SelectableRow
                        key={`${index}-${label}`}
                        row={nextRow()}
                        x={0}
                        className="dock-page-money-business-news-row"
                        data-select-id={`money-business-news-${index}`}
                      >
                        <span className="dock-page-classic-bullet"></span>
                        <span className="dock-page-row-label">{label}</span>
                      </SelectableRow>
                    )
                  })}
                </div>
              </div>
            ) : page.variant === 'moneyExperts' ? (
              <div className="dock-page-money-experts">
                <div className="dock-page-content-title dock-page-money-experts-title">{page.contentTitle}</div>
                <div className="dock-page-money-experts-list">
                  {page.experts.map((expert, index) => (
                    <div key={`${expert.name}-${expert.headline}`} className="dock-page-money-experts-item-wrap">
                      {index > 0 && <div className="dock-page-divider"></div>}
                      <div className={`dock-page-money-experts-item ${expert.image ? 'has-image' : 'no-image'}`}>
                        {expert.image && (
                          <div className="dock-page-money-experts-image-wrap">
                            <img
                              className="dock-page-money-experts-image"
                              src={`${BASE}images/pages/${expert.image}`}
                              alt=""
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          className="dock-page-money-experts-copy selectable"
                          data-select-x="0"
                          data-select-height={nextRow()}
                          data-select-layer="0"
                          data-select-id={`money-expert-${index}`}
                          onClick={noop}
                        >
                          <span className="dock-page-money-experts-name">{expert.name}</span>
                          <span className="dock-page-money-experts-headline">{expert.headline}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : page.variant === 'moneyStocks' ? (
              (() => {
                const formatNumber = (value) => (
                  typeof value === 'number'
                    ? value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0.00'
                )

                const formatSigned = (value, suffix = '') => {
                  if (typeof value !== 'number') return `0.00${suffix}`
                  const absolute = Math.abs(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
                  return `${sign}${absolute}${suffix}`
                }

                const stockRows = moneyWatchlistSymbols.map((symbol, index) => {
                  const quote = moneyWatchlistQuotes[symbol] ?? createEmptyMoneyQuote(symbol)
                  const meta = getMoneyWatchlistMeta(symbol, quote)
                  const row = nextRow()

                  return {
                    symbol,
                    index,
                    quote,
                    meta,
                    row,
                  }
                })
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>

                    <div className="dock-page-money-stocks-table">
                      <div className="dock-page-money-stocks-header">
                        <div className="dock-page-money-stocks-header-cell dock-page-money-stocks-header-name">Name</div>
                        <div className="dock-page-money-stocks-header-cell">Last</div>
                        <div className="dock-page-money-stocks-header-cell">Change</div>
                        <div className="dock-page-money-stocks-header-cell">%Chg</div>
                      </div>

                      {stockRows.map(({ symbol, index, quote, meta, row }) => (
                        <div key={symbol}>
                          <div className="dock-page-money-stocks-row">
                            <SelectableRow
                              row={row}
                              x={0}
                              className="dock-page-money-stocks-name-button"
                              data-select-id={`money-stocks-row-${index}`}
                              onClick={() => handleMoneyQuoteNavigate(meta.quotePageSymbol)}
                            >
                              <span className="dock-page-row-label">{meta.shortLabel}</span>
                            </SelectableRow>
                            <div className="dock-page-money-stocks-value">{formatNumber(quote.price)}</div>
                            <div className={`dock-page-money-stocks-value ${quote.change >= 0 ? 'positive' : 'negative'}`}>{formatSigned(quote.change)}</div>
                            <div className={`dock-page-money-stocks-value ${quote.changePercent >= 0 ? 'positive' : 'negative'}`}>{formatSigned(quote.changePercent, '%')}</div>
                          </div>
                          <div className="dock-page-divider"></div>
                        </div>
                      ))}
                    </div>

                    <div className="dock-page-money-stocks-note">
                      Quotes supplied by MSN Money
                      <br />
                      and are delayed at least 20 minutes.
                    </div>

                    <div className="dock-page-money-stocks-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-add"
                        data-select-id="money-stocks-add"
                        onClick={() => handleModuleNavigate(page.addPageId)}
                      >
                        <span className="dock-page-row-label">Add Stock</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-remove"
                        data-select-id="money-stocks-remove"
                        onClick={() => handleModuleNavigate(page.removePageId)}
                      >
                        <span className="dock-page-row-label">Remove Stocks</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
            ) : page.variant === 'moneyStocksAdd' ? (
              (() => {
                const inputRow = nextRow()
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks dock-page-money-stocks-form">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>
                    <div className="dock-page-money-stocks-instruction">{page.instruction}</div>

                    <input
                      ref={moneyWatchlistInputRef}
                      className="dock-page-money-stocks-input search-input-stub selectable"
                      type="text"
                      aria-label="Add stock"
                      autoComplete="off"
                      spellCheck={false}
                      data-select-x="0"
                      data-select-height={inputRow}
                      data-select-layer="0"
                      data-select-id="money-stocks-add-input"
                    />

                    <div className="dock-page-money-stocks-actions dock-page-money-stocks-form-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-cancel"
                        data-select-id="money-stocks-add-cancel"
                        onClick={() => handleModuleNavigate(page.cancelPageId)}
                      >
                        <span className="dock-page-row-label">Cancel</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-add"
                        data-select-id="money-stocks-add-confirm"
                        onClick={handleMoneyWatchlistAdd}
                      >
                        <span className="dock-page-row-label">Add Stock</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
            ) : page.variant === 'moneyStocksRemove' ? (
              (() => {
                const removeRows = moneyWatchlistSymbols.map((symbol, index) => {
                  const quote = moneyWatchlistQuotes[symbol] ?? createEmptyMoneyQuote(symbol)
                  const meta = getMoneyWatchlistMeta(symbol, quote)
                  const checked = Boolean(moneyWatchlistSelection[symbol])
                  const row = nextRow()

                  return {
                    symbol,
                    index,
                    meta,
                    checked,
                    row,
                  }
                })
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks dock-page-money-stocks-remove">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>
                    <div className="dock-page-money-stocks-instruction">
                      To delete stocks, check the box next to the name of the company, then choose <b>Remove</b>.
                    </div>

                    <div className="dock-page-money-stocks-remove-list">
                      <div className="dock-page-divider"></div>
                      {removeRows.map(({ symbol, index, meta, checked, row }) => (
                        <div key={symbol}>
                          <div className={`dock-page-money-stocks-remove-row ${checked ? 'checked' : ''}`}>
                            <SelectableRow
                              row={row}
                              x={0}
                              className="dock-page-money-stocks-remove-check custom-checkbox"
                              data-select-id={`money-stocks-remove-row-${index}`}
                              onClick={() => toggleMoneyWatchlistSelection(symbol)}
                            >
                              <img
                                className="dock-page-money-stocks-checkbox-image"
                                src={checked ? `${BASE}images/checked.png` : `${BASE}images/unchecked.png`}
                                alt=""
                              />
                            </SelectableRow>
                            <div className="dock-page-money-stocks-remove-short">{meta.shortLabel}</div>
                            <div className="dock-page-money-stocks-remove-full">{meta.fullLabel}</div>
                          </div>
                          {index < moneyWatchlistSymbols.length - 1 && <div className="dock-page-divider"></div>}
                        </div>
                      ))}
                      <div className="dock-page-divider"></div>
                    </div>

                    <div className="dock-page-money-stocks-actions dock-page-money-stocks-remove-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-cancel"
                        data-select-id="money-stocks-remove-cancel"
                        onClick={() => handleModuleNavigate(page.cancelPageId)}
                      >
                        <span className="dock-page-row-label">Cancel</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-confirm"
                        data-select-id="money-stocks-remove-confirm"
                        onClick={handleMoneyWatchlistRemove}
                      >
                        <span className="dock-page-row-label">Remove</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
            ) : page.variant === 'usingMain' ? (
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

                      {index < page.modules.length - 1 && <div className="dock-page-divider"></div>}
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
