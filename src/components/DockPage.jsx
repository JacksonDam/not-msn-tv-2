import { useCallback, useEffect, useRef, useState } from 'react'
import { DOCK_PAGES } from '../data/dockContent'
import MusicCenter from './MusicCenter'
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

const NEWS_FALLBACKS = {
  'top-stories': ['Top Stories is temporarily unavailable'],
  business: ['Business news is temporarily unavailable'],
  technology: ['Technology news is temporarily unavailable'],
  health: ['Health news is temporarily unavailable'],
  travel: ['Travel news is temporarily unavailable'],
  opinion: ['Opinion stories are temporarily unavailable'],
  local: ['Local headlines are temporarily unavailable'],
}

function normalizeNewsHeadline(item) {
  const title = String(item?.title ?? item ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return null

  return {
    title,
    description: String(item?.description ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    source: item?.source || 'MSNBC',
  }
}

function fallbackNews(section) {
  return (NEWS_FALLBACKS[section] ?? NEWS_FALLBACKS['top-stories'])
    .map((title) => ({ title, description: '', source: 'MSNBC' }))
}

function dateSeed(date) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  return Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function seededNumber(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function lotteryNumbers(seed, count, max, { allowZero = false } = {}) {
  const numbers = []
  let cursor = seed

  while (numbers.length < count) {
    cursor += 1
    const value = Math.floor(seededNumber(cursor) * (max + (allowZero ? 1 : 0))) + (allowZero ? 0 : 1)
    if (!allowZero && numbers.includes(value)) continue
    numbers.push(value)
  }

  return numbers
}

function formatNewsDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function createLotteryRows() {
  const today = new Date()
  const seed = dateSeed(today)

  return [
    {
      date: formatNewsDate(today),
      title: 'Evening Pick 3',
      results: lotteryNumbers(seed + 10, 3, 9, { allowZero: true }).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'Midday Pick 3',
      results: lotteryNumbers(seed + 20, 3, 9, { allowZero: true }).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'Fantasy 5',
      results: lotteryNumbers(seed + 30, 5, 39).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'SuperLotto Plus',
      results: `${lotteryNumbers(seed + 40, 5, 47).join('-')}\n${lotteryNumbers(seed + 50, 1, 27)[0]}`,
    },
    {
      date: formatNewsDate(today),
      title: 'Daily Derby',
      results: `${lotteryNumbers(seed + 60, 3, 12).join(' ')}\nHS 1:${String(Math.floor(seededNumber(seed + 70) * 60)).padStart(2, '0')}.${String(Math.floor(seededNumber(seed + 80) * 100)).padStart(2, '0')}`,
    },
  ]
}

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

export default function DockPage({
  pageId,
  pageRef,
  onClose,
  selection,
  onNavigate = noop,
  musicNavPos = 0,
  musicNavViewStart = 0,
  musicNavPixelOffset = 0,
  musicNavSlidingFromPos = null,
  onMusicNavSlideEnd,
  mediaPlayer,
}) {
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
  const [newsStories, setNewsStories] = useState([])
  const [sportsTopStories, setSportsTopStories] = useState([])
  const [sportsLeagueStories, setSportsLeagueStories] = useState([])
  const [sportsNcaaStories, setSportsNcaaStories] = useState({ basketball: [], football: [] })

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

  useEffect(() => {
    if (page.variant !== 'newsCenter') return undefined

    let cancelled = false
    const section = page.newsSection ?? 'top-stories'
    setNewsStories([])

    fetch(`${BASE}data/news/${section}.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const headlines = Array.isArray(data?.headlines)
          ? data.headlines.map(normalizeNewsHeadline).filter(Boolean).slice(0, 12)
          : []
        setNewsStories(headlines.length ? headlines : fallbackNews(section))
      })
      .catch(() => {
        if (!cancelled) setNewsStories(fallbackNews(section))
      })

    return () => {
      cancelled = true
    }
  }, [page.variant, pageId, page.newsSection])

  useEffect(() => {
    if (page.variant !== 'sportsTopStories') return undefined

    let cancelled = false

    fetch(`${BASE}data/sports/top-stories.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const headlines = Array.isArray(data?.headlines) ? data.headlines.slice(0, 10) : []
        setSportsTopStories(headlines)
      })
      .catch(() => {
        if (!cancelled) setSportsTopStories([])
      })

    return () => {
      cancelled = true
    }
  }, [page.variant, pageId])

  useEffect(() => {
    if (page.variant !== 'sportsLeague') return undefined

    let cancelled = false
    const leagueId = page.sportsLeagueId ?? 'nfl'
    const leagueName = page.sportsLeagueName ?? 'NFL'
    setSportsLeagueStories([])

    fetch(`${BASE}data/sports/${leagueId}.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const headlines = Array.isArray(data?.headlines) ? data.headlines.slice(0, 10) : []
        setSportsLeagueStories(headlines)
      })
      .catch(() => {
        if (!cancelled) setSportsLeagueStories([{ title: `${leagueName} news is temporarily unavailable`, source: '' }])
      })

    return () => {
      cancelled = true
    }
  }, [page.variant, pageId, page.sportsLeagueId, page.sportsLeagueName])

  useEffect(() => {
    if (page.variant !== 'sportsNcaa') return undefined

    let cancelled = false
    setSportsNcaaStories({ basketball: [], football: [] })

    Promise.all([
      fetch(`${BASE}data/sports/ncaa-basketball.json?_=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(`${BASE}data/sports/ncaa-football.json?_=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(([basketballData, footballData]) => {
      if (cancelled) return
      setSportsNcaaStories({
        basketball: Array.isArray(basketballData?.headlines) ? basketballData.headlines.slice(0, 10) : [],
        football: Array.isArray(footballData?.headlines) ? footballData.headlines.slice(0, 10) : [],
      })
    })

    return () => {
      cancelled = true
    }
  }, [page.variant, pageId])

  useEffect(() => {
    if (page.variant !== 'newsCenter' && page.variant !== 'sportsTopStories' && page.variant !== 'sportsLeague' && page.variant !== 'sportsNcaa' && page.variant !== 'moneyBusinessNews') return
    if (!shellNodeRef.current || !selection) return

    selection.initSelectables(shellNodeRef.current)
  }, [page.variant, pageId, newsStories.length, moneyBusinessNews.length, sportsTopStories.length, sportsLeagueStories.length, sportsNcaaStories.basketball.length, sportsNcaaStories.football.length, selection])

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

  if (page.layout === 'musicHome') {
    return (
      <MusicCenter
        pageRef={setShellRef}
        selection={selection}
        navPos={musicNavPos}
        navViewStart={musicNavViewStart}
        navPixelOffset={musicNavPixelOffset}
        navSlidingFromPos={musicNavSlidingFromPos}
        onNavSlideEnd={onMusicNavSlideEnd}
        mediaPlayer={mediaPlayer}
      />
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

  if (page.layout === 'tvListingsSite') {
    return (
      <div ref={setShellRef} className="dock-page-tv-listings-site-shell">
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
      className={`dock-page-shell theme-${page.theme} ${page.variant === 'newsCenter' || page.variant === 'newsLocalChange' || page.variant === 'newsLottery' ? 'dock-page-shell-news' : ''} ${page.variant === 'newsLocalChange' ? 'dock-page-shell-news-local-change' : ''} ${page.variant === 'newsLottery' ? 'dock-page-shell-news-lottery' : ''} ${page.variant === 'gamesCenter' ? 'dock-page-shell-games' : ''} ${page.variant === 'entertainmentMissing' || page.variant === 'entertainmentMovies' ? 'dock-page-shell-entertainment' : ''} ${page.variant === 'sportsTopStories' ? 'dock-page-shell-sports-top-stories' : ''} ${page.variant === 'sportsLeague' || page.variant === 'sportsNcaa' ? 'dock-page-shell-sports-nfl' : ''} ${page.variant === 'moneyCenter' ? 'dock-page-shell-money' : ''} ${page.variant === 'moneyBusinessNews' ? 'dock-page-shell-money-business-news' : ''} ${page.variant === 'moneyExperts' ? 'dock-page-shell-money-experts' : ''} ${page.variant?.startsWith('moneyStocks') ? 'dock-page-shell-money-stocks' : ''} ${page.variant === 'thingsToTry' ? 'dock-page-shell-things' : ''} ${page.variant === 'usingMain' ? 'dock-page-shell-using-main' : ''} ${page.variant === 'usingNewsletter' ? 'dock-page-shell-using-newsletter' : ''} ${page.variant === 'usingTipDetail' ? 'dock-page-shell-using-tip' : ''} ${page.sidebarCurrent === 'Newsletter' ? 'dock-page-shell-newsletter-section' : ''}`.trim()}
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
            {page.variant === 'entertainmentMissing' ? (
              <div className="dock-page-entertainment-missing">
                <div className="dock-page-divider"></div>
                <div className="dock-page-content-title dock-page-entertainment-title">Page missing</div>
                <p>Unfortunately, this page is missing.</p>
                <p>You can help by retrieving any Cached items from your MSNTV2 if it hasn&apos;t been wiped clean.</p>
              </div>
            ) : page.variant === 'entertainmentMovies' ? (
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
            ) : page.variant === 'gamesCenter' ? (
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
            ) : page.variant === 'newsCenter' ? (
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
            ) : page.variant === 'newsLocalChange' ? (
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
            ) : page.variant === 'newsLottery' ? (
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
            ) : page.variant === 'sportsTopStories' ? (
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
            ) : page.variant === 'sportsLeague' ? (
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
            ) : page.variant === 'sportsNcaa' ? (
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
