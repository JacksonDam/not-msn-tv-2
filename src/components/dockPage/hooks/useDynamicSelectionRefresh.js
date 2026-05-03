import { useEffect } from 'react'

const DYNAMIC_SELECTION_VARIANTS = new Set([
  'newsCenter',
  'sportsTopStories',
  'sportsLeague',
  'sportsNcaa',
  'moneyBusinessNews',
])

export default function useDynamicSelectionRefresh({
  page,
  shellNodeRef,
  selection,
  counts,
}) {
  useEffect(() => {
    if (!DYNAMIC_SELECTION_VARIANTS.has(page.variant)) return
    if (!shellNodeRef.current || !selection) return

    selection.initSelectables(shellNodeRef.current)
  }, [page.variant, shellNodeRef, selection, ...counts])
}
