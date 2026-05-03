import { useCallback } from 'react'
import { normalizeMoneySymbol } from '../../../utils/moneyQuoteService'

export default function useCenterNavigation(onNavigate) {
  const handleModuleNavigate = useCallback((targetPageId, options) => {
    if (!targetPageId) return
    onNavigate(targetPageId, options)
  }, [onNavigate])

  const handleMoneyQuoteNavigate = useCallback((rawSymbol, fallbackSymbol = '') => {
    const normalized = normalizeMoneySymbol(rawSymbol || fallbackSymbol)
    if (!normalized) return
    handleModuleNavigate('money-quote:' + encodeURIComponent(normalized.inputSymbol))
  }, [handleModuleNavigate])

  return {
    handleModuleNavigate,
    handleMoneyQuoteNavigate,
  }
}
