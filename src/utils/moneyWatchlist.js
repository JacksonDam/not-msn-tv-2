import { normalizeMoneySymbol } from './moneyQuoteService'

export const MONEY_WATCHLIST_COOKIE_NAME = 'msntv_money_watchlist'
export const MONEY_WATCHLIST_DEFAULTS = ['INDU', 'NASDAQ', 'SP500']

const MONEY_WATCHLIST_LABELS = {
  INDU: {
    shortLabel: 'Dow',
    fullLabel: 'DOW JONES INDUSTRIAL AVERAGE INDEX',
    quotePageSymbol: 'INDU',
  },
  NASDAQ: {
    shortLabel: 'NASDAQ',
    fullLabel: 'NASDAQ COMPOSITE INDEX',
    quotePageSymbol: 'NASDAQ',
  },
  SP500: {
    shortLabel: 'S&P',
    fullLabel: 'S&P 500 INDEX',
    quotePageSymbol: 'SP500',
  },
}

const NAMED_SYMBOL_ALIASES = {
  DOW: 'INDU',
  'DOW JONES': 'INDU',
  'DOW JONES INDUSTRIAL AVERAGE': 'INDU',
  NASDAQ: 'NASDAQ',
  'NASDAQ COMPOSITE': 'NASDAQ',
  'S&P': 'SP500',
  'S&P 500': 'SP500',
  SP500: 'SP500',
}

function dedupeSymbols(symbols) {
  return [...new Set(symbols.filter(Boolean))]
}

export function getMoneyWatchlistMeta(rawSymbol, quote = null) {
  const symbol = normalizeMoneySymbol(rawSymbol)
  if (!symbol) {
    return {
      symbol: '',
      shortLabel: '',
      fullLabel: '',
      quotePageSymbol: '',
    }
  }

  const known = MONEY_WATCHLIST_LABELS[symbol.inputSymbol]
  if (known) {
    return {
      symbol: symbol.inputSymbol,
      ...known,
    }
  }

  return {
    symbol: symbol.inputSymbol,
    shortLabel: symbol.inputSymbol,
    fullLabel: quote?.name || symbol.inputSymbol,
    quotePageSymbol: symbol.inputSymbol,
  }
}

export function normalizeMoneyWatchlistInput(rawValue) {
  const normalized = String(rawValue ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
  if (!normalized) return null

  const namedAlias = NAMED_SYMBOL_ALIASES[normalized]
  if (namedAlias) {
    return namedAlias
  }

  return normalizeMoneySymbol(normalized)?.inputSymbol ?? null
}

export function parseMoneyWatchlistCookie(cookieValue) {
  if (!cookieValue) {
    return [...MONEY_WATCHLIST_DEFAULTS]
  }

  if (cookieValue === '-') {
    return []
  }

  const symbols = decodeURIComponent(cookieValue)
    .split(',')
    .map((value) => normalizeMoneyWatchlistInput(value))
    .filter(Boolean)

  return symbols.length ? dedupeSymbols(symbols) : [...MONEY_WATCHLIST_DEFAULTS]
}

export function readMoneyWatchlistCookie() {
  if (typeof document === 'undefined') {
    return [...MONEY_WATCHLIST_DEFAULTS]
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${MONEY_WATCHLIST_COOKIE_NAME}=`))

  if (!cookie) {
    return [...MONEY_WATCHLIST_DEFAULTS]
  }

  return parseMoneyWatchlistCookie(cookie.slice(MONEY_WATCHLIST_COOKIE_NAME.length + 1))
}

export function writeMoneyWatchlistCookie(symbols) {
  if (typeof document === 'undefined') return

  const normalizedSymbols = dedupeSymbols(
    symbols
      .map((symbol) => normalizeMoneyWatchlistInput(symbol))
      .filter(Boolean),
  )

  const cookieValue = encodeURIComponent(
    normalizedSymbols.length ? normalizedSymbols.join(',') : '-',
  )

  document.cookie = `${MONEY_WATCHLIST_COOKIE_NAME}=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; SameSite=Lax`
}
