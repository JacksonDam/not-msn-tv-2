import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Parser from 'rss-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')
const HEADLINES_PATH = path.join(PUBLIC_DATA_DIR, 'headlines.json')
const MONEY_BUSINESS_NEWS_PATH = path.join(PUBLIC_DATA_DIR, 'money', 'business-news.json')
const SPORTS_TOP_STORIES_PATH = path.join(PUBLIC_DATA_DIR, 'sports', 'top-stories.json')
const MONEY_QUOTES_DIR = path.join(PUBLIC_DATA_DIR, 'money', 'quotes')
const DEFAULT_SYMBOLS_PATH = path.join(__dirname, 'default-symbols.txt')
const DEFAULT_SYMBOLS = (await fs.readFile(DEFAULT_SYMBOLS_PATH, 'utf8'))
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

const MONEY_SYMBOL_ALIASES = {
  INDU: { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  '$INDU': { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  '^DJI': { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  DJI: { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  NASDAQ: { requestSymbol: '^IXIC', displaySymbol: '$NASDAQ' },
  '$NASDAQ': { requestSymbol: '^IXIC', displaySymbol: '$NASDAQ' },
  IXIC: { requestSymbol: '^IXIC', displaySymbol: '$NASDAQ' },
  '^IXIC': { requestSymbol: '^IXIC', displaySymbol: '$NASDAQ' },
  SP500: { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
  'S&P': { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
  '$S&P': { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
  GSPC: { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
  '^GSPC': { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
  SPX: { requestSymbol: '^GSPC', displaySymbol: '$S&P' },
}

function normalizeMoneySymbol(rawSymbol) {
  const normalized = String(rawSymbol ?? '').trim().toUpperCase()
  if (!normalized) return null

  const alias = MONEY_SYMBOL_ALIASES[normalized]
  if (alias) {
    return {
      inputSymbol: normalized,
      requestSymbol: alias.requestSymbol,
      displaySymbol: alias.displaySymbol,
    }
  }

  return {
    inputSymbol: normalized,
    requestSymbol: normalized,
    displaySymbol: normalized.startsWith('$') ? normalized : `$${normalized}`,
  }
}

function moneyQuoteSnapshotId(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) return null

  const snapshotId = symbol.inputSymbol
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return snapshotId || 'quote'
}

function createEmptyMoneyQuote(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)

  return {
    symbol,
    name: '',
    price: 0,
    previousClose: 0,
    dayHigh: 0,
    dayLow: 0,
    change: 0,
    changePercent: 0,
    currency: 'USD',
    exchangeName: '',
    marketState: '',
    series: [],
    news: null,
    generatedAt: new Date().toISOString(),
  }
}

function lastNonNull(values = []) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] != null) return values[index]
  }
  return null
}

function minNonNull(values = []) {
  const filtered = values.filter((value) => value != null)
  return filtered.length ? Math.min(...filtered) : null
}

function maxNonNull(values = []) {
  const filtered = values.filter((value) => value != null)
  return filtered.length ? Math.max(...filtered) : null
}

function shortenHeadline(text, maxLength = 39) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`
}

function normalizeBusinessHeadline(item) {
  const title = String(item?.title ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return null

  return {
    title,
    source: item?.creator || item?.publisher || item?.author || 'MSNBC',
    link: item?.link || null,
    publishedAt: item?.isoDate || item?.pubDate || null,
  }
}

function normalizeSportsHeadline(item) {
  const title = String(item?.title ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return null

  return {
    title,
    source: item?.creator || item?.publisher || item?.author || 'MSNBC',
    link: item?.link || null,
    publishedAt: item?.isoDate || item?.pubDate || null,
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json,text/plain,*/*',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}

async function fetchMoneyQuoteSnapshot(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) {
    throw new Error('No symbol provided')
  }

  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.requestSymbol)}?interval=5m&range=1d&includePrePost=false&events=div%2Csplits`
  const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol.requestSymbol)}&quotesCount=1&newsCount=3`

  const [chartData, searchData] = await Promise.all([
    fetchJson(chartUrl),
    fetchJson(searchUrl).catch(() => null),
  ])

  const result = chartData?.chart?.result?.[0]
  if (!result) {
    throw new Error('Quote data unavailable')
  }

  const meta = result.meta ?? {}
  const quote = result.indicators?.quote?.[0] ?? {}
  const closes = quote.close ?? []
  const highs = quote.high ?? []
  const lows = quote.low ?? []
  const timestamps = result.timestamp ?? []
  const marketPrice = meta.regularMarketPrice ?? lastNonNull(closes) ?? meta.chartPreviousClose ?? meta.previousClose
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? marketPrice
  const change = marketPrice != null && previousClose != null ? marketPrice - previousClose : null
  const changePercent = change != null && previousClose ? (change / previousClose) * 100 : null
  const series = timestamps
    .map((timestamp, index) => ({
      timestamp,
      close: closes[index],
    }))
    .filter((point) => point.close != null)

  const newsItem = searchData?.news?.[0] ?? null
  const longName = meta.longName ?? meta.shortName ?? symbol.displaySymbol

  return {
    symbol,
    name: longName.toUpperCase(),
    price: marketPrice ?? 0,
    previousClose: previousClose ?? 0,
    dayHigh: meta.regularMarketDayHigh ?? maxNonNull(highs) ?? 0,
    dayLow: meta.regularMarketDayLow ?? minNonNull(lows) ?? 0,
    change: change ?? 0,
    changePercent: changePercent ?? 0,
    currency: meta.currency ?? 'USD',
    exchangeName: meta.exchangeName ?? '',
    marketState: meta.marketState ?? '',
    series,
    news: newsItem
      ? {
          title: newsItem.title,
          publisher: newsItem.publisher,
          publishedAt: newsItem.providerPublishTime
            ? new Date(newsItem.providerPublishTime * 1000).toISOString()
            : null,
        }
      : null,
    generatedAt: new Date().toISOString(),
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function refreshHeadlines() {
  const parser = new Parser()

  try {
    const feed = await parser.parseURL('https://feeds.nbcnews.com/feeds/worldnews')
    const headlines = (feed.items ?? [])
      .slice(0, 3)
      .map((item) => shortenHeadline(item.title))

    await writeJson(HEADLINES_PATH, {
      headlines: headlines.length ? headlines : ['Headline 1', 'Headline 2', 'Headline 3'],
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Failed to refresh headlines:', error.message)
    await writeJson(HEADLINES_PATH, {
      headlines: ['Headline 1', 'Headline 2', 'Headline 3'],
      generatedAt: new Date().toISOString(),
    })
  }
}

async function refreshBusinessNews() {
  const parser = new Parser()
  const fallbackHeadlines = [
    { title: 'Business news is temporarily unavailable', source: 'MSNBC', link: null, publishedAt: null },
  ]

  try {
    const feed = await parser.parseURL('https://feeds.nbcnews.com/nbcnews/public/business')
    const headlines = (feed.items ?? [])
      .map(normalizeBusinessHeadline)
      .filter(Boolean)
      .slice(0, 10)

    await writeJson(MONEY_BUSINESS_NEWS_PATH, {
      source: 'MSNBC',
      headlines: headlines.length ? headlines : fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Failed to refresh business news:', error.message)
    await writeJson(MONEY_BUSINESS_NEWS_PATH, {
      source: 'MSNBC',
      headlines: fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  }
}

async function refreshSportsTopStories() {
  const parser = new Parser()
  const fallbackHeadlines = [
    { title: 'Sports news is temporarily unavailable', source: 'MSNBC', link: null, publishedAt: null },
  ]

  try {
    const feed = await parser.parseURL('https://www.nbcsports.com/index.atom')
    const headlines = (feed.items ?? [])
      .map(normalizeSportsHeadline)
      .filter(Boolean)
      .slice(0, 10)

    await writeJson(SPORTS_TOP_STORIES_PATH, {
      source: 'MSNBC',
      headlines: headlines.length ? headlines : fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Failed to refresh sports top stories:', error.message)
    await writeJson(SPORTS_TOP_STORIES_PATH, {
      source: 'MSNBC',
      headlines: fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  }
}

const SPORTS_LEAGUE_FEEDS = [
  {
    id: 'nfl',
    label: 'NFL',
    source: 'The Athletic',
    url: 'https://www.nytimes.com/athletic/rss/nfl/',
  },
  {
    id: 'mlb',
    label: 'MLB',
    source: 'MLB.com',
    url: 'https://www.mlb.com/feeds/news/rss.xml',
  },
  {
    id: 'nba',
    label: 'NBA',
    source: 'New York Post',
    url: 'https://nypost.com/nba/feed/',
  },
  {
    id: 'nhl',
    label: 'NHL',
    source: 'NHL News',
    url: 'https://www.to-rss.xyz/nhl/news/',
  },
  {
    id: 'ncaa-basketball',
    label: 'NCAA basketball',
    source: 'The Athletic',
    url: 'https://www.nytimes.com/athletic/rss/college-basketball/',
  },
  {
    id: 'ncaa-football',
    label: 'NCAA football',
    source: 'The Athletic',
    url: 'https://www.nytimes.com/athletic/rss/college-football/',
  },
]

async function refreshSportsLeague({ id, label, source, url }) {
  const parser = new Parser()
  const fallbackHeadlines = [
    { title: `${label} news is temporarily unavailable`, source, link: null, publishedAt: null },
  ]
  const outputPath = path.join(PUBLIC_DATA_DIR, 'sports', `${id}.json`)

  try {
    const feed = await parser.parseURL(url)
    const headlines = (feed.items ?? [])
      .map(normalizeSportsHeadline)
      .filter(Boolean)
      .slice(0, 10)

    await writeJson(outputPath, {
      source,
      headlines: headlines.length ? headlines : fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn(`Failed to refresh sports ${label} stories:`, error.message)
    await writeJson(outputPath, {
      source,
      headlines: fallbackHeadlines,
      generatedAt: new Date().toISOString(),
    })
  }
}

async function refreshMoneyQuotes() {
  const symbols = (process.env.MONEY_SNAPSHOT_SYMBOLS || DEFAULT_SYMBOLS.join(','))
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean)

  await fs.mkdir(MONEY_QUOTES_DIR, { recursive: true })

  for (const rawSymbol of symbols) {
    const snapshotId = moneyQuoteSnapshotId(rawSymbol)
    if (!snapshotId) continue

    try {
      const snapshot = await fetchMoneyQuoteSnapshot(rawSymbol)
      await writeJson(path.join(MONEY_QUOTES_DIR, `${snapshotId}.json`), snapshot)
      console.log(`Updated money snapshot for ${rawSymbol}`)
    } catch (error) {
      console.warn(`Failed to refresh ${rawSymbol}: ${error.message}`)
      await writeJson(
        path.join(MONEY_QUOTES_DIR, `${snapshotId}.json`),
        createEmptyMoneyQuote(rawSymbol),
      )
    }
  }
}

await refreshHeadlines()
await refreshBusinessNews()
await refreshSportsTopStories()
for (const leagueFeed of SPORTS_LEAGUE_FEEDS) {
  await refreshSportsLeague(leagueFeed)
}
await refreshMoneyQuotes()
process.exit(0)
