import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyMoneyQuote, fetchMoneyQuoteSnapshot } from '../../../utils/moneyQuoteService'
import {
  normalizeMoneyWatchlistInput,
  readMoneyWatchlistCookie,
  writeMoneyWatchlistCookie,
} from '../../../utils/moneyWatchlist'
import { BASE } from '../shared'

export default function useMoneyCenterState(page, handleModuleNavigate) {
  const moneyLookupInputRef = useRef(null)
  const moneyWatchlistInputRef = useRef(null)
  const [moneyWatchlistSymbols, setMoneyWatchlistSymbols] = useState(() => readMoneyWatchlistCookie())
  const [moneyWatchlistQuotes, setMoneyWatchlistQuotes] = useState({})
  const [moneyWatchlistSelection, setMoneyWatchlistSelection] = useState({})
  const [moneyBusinessNews, setMoneyBusinessNews] = useState([])

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
  }, [isMoneyStocksVariant, page.variant])

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

    fetch(BASE + 'data/money/business-news.json?_=' + Date.now(), { cache: 'no-store' })
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
  }, [page.variant])

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

  const sidebarRightTarget = page.variant === 'moneyStocks'
    ? (moneyWatchlistSymbols.length ? 'money-stocks-row-0' : 'money-stocks-add')
    : page.variant === 'moneyStocksAdd'
      ? 'money-stocks-add-input'
      : page.variant === 'moneyStocksRemove'
        ? (moneyWatchlistSymbols.length ? 'money-stocks-remove-row-0' : 'money-stocks-remove-cancel')
        : null

  return {
    dynamicCount: moneyBusinessNews.length,
    sidebarRightTarget,
    contentProps: {
      moneyLookupInputRef,
      moneyBusinessNews,
      moneyWatchlistInputRef,
      moneyWatchlistSymbols,
      moneyWatchlistQuotes,
      moneyWatchlistSelection,
      handleMoneyWatchlistAdd,
      handleMoneyWatchlistRemove,
      toggleMoneyWatchlistSelection,
    },
  }
}
