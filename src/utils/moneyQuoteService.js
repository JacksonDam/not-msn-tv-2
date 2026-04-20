const BASE = import.meta.env.BASE_URL

const MONEY_SYMBOL_ALIASES = {
  INDU: { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  '$INDU': { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  '^DJI': { requestSymbol: '^DJI', displaySymbol: '$INDU' },
  DJI: { requestSymbol: '^DJI', displaySymbol: '$INDU' },
}

async function fetchJson(url) {
  const response = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

async function fetchSnapshotQuote(rawSymbol) {
  const snapshotId = moneyQuoteSnapshotId(rawSymbol)
  if (!snapshotId) {
    return null
  }

  return fetchJson(`${BASE}data/money/quotes/${snapshotId}.json`)
}

export function normalizeMoneySymbol(rawSymbol) {
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

export function moneyQuoteSnapshotId(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) return null

  const snapshotId = symbol.inputSymbol
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return snapshotId || 'quote'
}

export function createEmptyMoneyQuote(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) {
    return {
      symbol: null,
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
      generatedAt: null,
    }
  }

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
    generatedAt: null,
  }
}

export async function fetchMoneyQuote(rawSymbol) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) {
    throw new Error('No symbol provided')
  }

  try {
    const snapshot = await fetchSnapshotQuote(symbol.inputSymbol)
    if (snapshot) {
      return { ...snapshot, symbol }
    }
  } catch {
    // fall through to empty quote
  }

  return createEmptyMoneyQuote(symbol.inputSymbol)
}
