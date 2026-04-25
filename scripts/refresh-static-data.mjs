import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Parser from 'rss-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')
const HEADLINES_PATH = path.join(PUBLIC_DATA_DIR, 'headlines.json')
const NEWS_DIR = path.join(PUBLIC_DATA_DIR, 'news')
const WEATHER_DIR = path.join(PUBLIC_DATA_DIR, 'weather')
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

const WEATHER_CAPITALS = [
  { id: 'san-francisco', name: 'San Francisco', country: 'CA', latitude: 37.7749, longitude: -122.4194 },
  { id: 'london', name: 'London', country: 'England', latitude: 51.5072, longitude: -0.1276 },
  { id: 'washington-dc', name: 'Washington', country: 'DC', latitude: 38.9072, longitude: -77.0369 },
  { id: 'ottawa', name: 'Ottawa', country: 'Canada', latitude: 45.4215, longitude: -75.6972 },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', latitude: 19.4326, longitude: -99.1332 },
  { id: 'brasilia', name: 'Brasilia', country: 'Brazil', latitude: -15.7939, longitude: -47.8828 },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816 },
  { id: 'santiago', name: 'Santiago', country: 'Chile', latitude: -33.4489, longitude: -70.6693 },
  { id: 'lima', name: 'Lima', country: 'Peru', latitude: -12.0464, longitude: -77.0428 },
  { id: 'bogota', name: 'Bogota', country: 'Colombia', latitude: 4.711, longitude: -74.0721 },
  { id: 'caracas', name: 'Caracas', country: 'Venezuela', latitude: 10.4806, longitude: -66.9036 },
  { id: 'paris', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 },
  { id: 'madrid', name: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038 },
  { id: 'rome', name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964 },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  { id: 'dublin', name: 'Dublin', country: 'Ireland', latitude: 53.3498, longitude: -6.2603 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041 },
  { id: 'brussels', name: 'Brussels', country: 'Belgium', latitude: 50.8503, longitude: 4.3517 },
  { id: 'vienna', name: 'Vienna', country: 'Austria', latitude: 48.2082, longitude: 16.3738 },
  { id: 'bern', name: 'Bern', country: 'Switzerland', latitude: 46.948, longitude: 7.4474 },
  { id: 'stockholm', name: 'Stockholm', country: 'Sweden', latitude: 59.3293, longitude: 18.0686 },
  { id: 'oslo', name: 'Oslo', country: 'Norway', latitude: 59.9139, longitude: 10.7522 },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', latitude: 55.6761, longitude: 12.5683 },
  { id: 'helsinki', name: 'Helsinki', country: 'Finland', latitude: 60.1699, longitude: 24.9384 },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', latitude: 64.1466, longitude: -21.9426 },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', latitude: 52.2297, longitude: 21.0122 },
  { id: 'prague', name: 'Prague', country: 'Czechia', latitude: 50.0755, longitude: 14.4378 },
  { id: 'budapest', name: 'Budapest', country: 'Hungary', latitude: 47.4979, longitude: 19.0402 },
  { id: 'athens', name: 'Athens', country: 'Greece', latitude: 37.9838, longitude: 23.7275 },
  { id: 'ankara', name: 'Ankara', country: 'Turkey', latitude: 39.9334, longitude: 32.8597 },
  { id: 'moscow', name: 'Moscow', country: 'Russia', latitude: 55.7558, longitude: 37.6173 },
  { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', latitude: 50.4501, longitude: 30.5234 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
  { id: 'pretoria', name: 'Pretoria', country: 'South Africa', latitude: -25.7479, longitude: 28.2293 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', latitude: -1.2921, longitude: 36.8219 },
  { id: 'addis-ababa', name: 'Addis Ababa', country: 'Ethiopia', latitude: 8.9806, longitude: 38.7578 },
  { id: 'abuja', name: 'Abuja', country: 'Nigeria', latitude: 9.0765, longitude: 7.3986 },
  { id: 'accra', name: 'Accra', country: 'Ghana', latitude: 5.6037, longitude: -0.187 },
  { id: 'rabat', name: 'Rabat', country: 'Morocco', latitude: 34.0209, longitude: -6.8416 },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753 },
  { id: 'jerusalem', name: 'Jerusalem', country: 'Israel', latitude: 31.7683, longitude: 35.2137 },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  { id: 'new-delhi', name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { id: 'islamabad', name: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479 },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125 },
  { id: 'beijing', name: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.978 },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018 },
  { id: 'hanoi', name: 'Hanoi', country: 'Vietnam', latitude: 21.0278, longitude: 105.8342 },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456 },
  { id: 'manila', name: 'Manila', country: 'Philippines', latitude: 14.5995, longitude: 120.9842 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.139, longitude: 101.6869 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'canberra', name: 'Canberra', country: 'Australia', latitude: -35.2809, longitude: 149.13 },
  { id: 'wellington', name: 'Wellington', country: 'New Zealand', latitude: -41.2865, longitude: 174.7762 },
]

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

function normalizeNewsHeadline(item) {
  const title = String(item?.title ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return null

  return {
    title,
    description: String(item?.contentSnippet ?? item?.content ?? item?.summary ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
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

function weatherCodeInfo(code, isDay = 1) {
  const numericCode = Number(code)

  if ([0].includes(numericCode)) {
    return { condition: 'Clear', icon: isDay ? 'sun' : 'nightclear' }
  }
  if ([1].includes(numericCode)) {
    return { condition: 'Mostly clear', icon: isDay ? 'suncloud' : 'nightcloud' }
  }
  if ([2].includes(numericCode)) {
    return { condition: 'Partly cloudy', icon: isDay ? 'cloudysun' : 'nightcloud' }
  }
  if ([3].includes(numericCode)) {
    return { condition: 'Cloudy', icon: 'cloud' }
  }
  if ([45, 48].includes(numericCode)) {
    return { condition: 'Fog', icon: 'fog' }
  }
  if ([51, 53, 55, 56, 57].includes(numericCode)) {
    return { condition: 'Drizzle', icon: 'cloud' }
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(numericCode)) {
    return { condition: 'Rain', icon: 'cloud' }
  }
  if ([71, 73, 75, 77, 85, 86].includes(numericCode)) {
    return { condition: 'Snow', icon: 'cloud' }
  }
  if ([95, 96, 99].includes(numericCode)) {
    return { condition: 'Thunderstorms', icon: 'cloud' }
  }

  return { condition: 'Hazy', icon: 'haze' }
}

function weatherDisplayName(city) {
  return `${city.name}, ${city.country}`
}

function weatherDayName(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
}

function createFallbackWeatherCity(city, index = 0) {
  const now = new Date()
  const baseTemp = Math.round(12 + Math.sin((now.getDate() + index) / 4) * 10 - Math.abs(city.latitude) / 12)
  const info = weatherCodeInfo(index % 5 === 0 ? 61 : index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 0)
  const forecast = Array.from({ length: 4 }, (_, forecastIndex) => {
    const date = new Date(now)
    date.setDate(now.getDate() + forecastIndex)
    const high = baseTemp + 4 + (forecastIndex % 3)
    const low = baseTemp - 2 + (forecastIndex % 2)
    const dayInfo = weatherCodeInfo((index + forecastIndex) % 4 === 0 ? 61 : (index + forecastIndex) % 3 === 0 ? 3 : 1)

    return {
      date: date.toISOString().slice(0, 10),
      day: weatherDayName(date.toISOString().slice(0, 10)),
      highC: high,
      lowC: low,
      condition: dayInfo.condition,
      icon: dayInfo.icon,
    }
  })

  return {
    ...city,
    displayName: weatherDisplayName(city),
    current: {
      tempC: baseTemp,
      feelsLikeC: baseTemp - 2,
      condition: info.condition,
      icon: info.icon,
    },
    forecast,
  }
}

async function fetchWeatherCity(city, index) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', city.latitude)
  url.searchParams.set('longitude', city.longitude)
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,is_day,weather_code')
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '4')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`)
  const data = await response.json()
  const currentInfo = weatherCodeInfo(data.current?.weather_code, data.current?.is_day)
  const dates = data.daily?.time ?? []
  const highs = data.daily?.temperature_2m_max ?? []
  const lows = data.daily?.temperature_2m_min ?? []
  const codes = data.daily?.weather_code ?? []

  return {
    ...city,
    displayName: weatherDisplayName(city),
    current: {
      tempC: Math.round(data.current?.temperature_2m ?? 0),
      feelsLikeC: Math.round(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 0),
      condition: currentInfo.condition,
      icon: currentInfo.icon,
    },
    forecast: dates.slice(0, 4).map((date, forecastIndex) => {
      const info = weatherCodeInfo(codes[forecastIndex], 1)

      return {
        date,
        day: weatherDayName(date),
        highC: Math.round(highs[forecastIndex] ?? 0),
        lowC: Math.round(lows[forecastIndex] ?? 0),
        condition: info.condition,
        icon: info.icon,
      }
    }),
  }
}

async function refreshWeather() {
  const cities = []

  for (let index = 0; index < WEATHER_CAPITALS.length; index += 1) {
    const city = WEATHER_CAPITALS[index]

    try {
      cities.push(await fetchWeatherCity(city, index))
    } catch (error) {
      console.warn(`Failed to refresh weather for ${city.name}:`, error.message)
      cities.push(createFallbackWeatherCity(city, index))
    }
  }

  await writeJson(path.join(WEATHER_DIR, 'cities.json'), {
    source: 'Open-Meteo',
    sourceUrl: 'https://open-meteo.com/',
    cities,
    generatedAt: new Date().toISOString(),
  })
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

const NEWS_FEEDS = [
  {
    id: 'top-stories',
    label: 'Top stories',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/news',
      'https://feeds.nbcnews.com/feeds/topstories',
      'https://feeds.nbcnews.com/feeds/worldnews',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/business',
    ],
  },
  {
    id: 'technology',
    label: 'Technology',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/tech',
      'https://feeds.nbcnews.com/nbcnews/public/tech-media',
      'https://feeds.nbcnews.com/nbcnews/public/science',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/health',
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/travel',
      'https://www.nbcnews.com/id/3032118/device/rss/rss.xml',
      'https://feeds.nbcnews.com/nbcnews/public/news',
    ],
  },
  {
    id: 'opinion',
    label: 'Opinion',
    urls: [
      'https://feeds.nbcnews.com/nbcnews/public/opinion',
      'https://www.msnbc.com/feeds/latest',
      'https://feeds.nbcnews.com/nbcnews/public/politics',
    ],
  },
  {
    id: 'local',
    label: 'Local',
    urls: [
      'https://www.nbcbayarea.com/news/local/?rss=y',
      'https://feeds.nbcnews.com/nbcnews/public/us-news',
      'https://feeds.nbcnews.com/nbcnews/public/news',
    ],
  },
]

async function parseFirstAvailableFeed(parser, urls) {
  let lastError = null

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url)
      const headlines = (feed.items ?? [])
        .map(normalizeNewsHeadline)
        .filter(Boolean)
        .slice(0, 12)

      if (headlines.length) {
        return { sourceUrl: url, headlines }
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) throw lastError
  throw new Error('No headlines found')
}

async function refreshNewsFeed({ id, label, urls }) {
  const parser = new Parser()
  const fallbackHeadlines = [
    { title: `${label} news is temporarily unavailable`, description: '', source: 'MSNBC', link: null, publishedAt: null },
  ]
  const outputPath = path.join(NEWS_DIR, `${id}.json`)

  try {
    const { sourceUrl, headlines } = await parseFirstAvailableFeed(parser, urls)
    await writeJson(outputPath, {
      source: 'MSNBC',
      sourceUrl,
      headlines,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn(`Failed to refresh news ${label}:`, error.message)
    await writeJson(outputPath, {
      source: 'MSNBC',
      sourceUrl: urls[0],
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
for (const newsFeed of NEWS_FEEDS) {
  await refreshNewsFeed(newsFeed)
}
await refreshWeather()
await refreshBusinessNews()
await refreshSportsTopStories()
for (const leagueFeed of SPORTS_LEAGUE_FEEDS) {
  await refreshSportsLeague(leagueFeed)
}
await refreshMoneyQuotes()
process.exit(0)
