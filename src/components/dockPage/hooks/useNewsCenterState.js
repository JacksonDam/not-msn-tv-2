import { useEffect, useState } from 'react'
import { fallbackNews, normalizeNewsHeadline } from '../data'
import { BASE } from '../shared'

export default function useNewsCenterState(page) {
  const [newsStories, setNewsStories] = useState([])

  useEffect(() => {
    if (page.variant !== 'newsCenter') return undefined

    let cancelled = false
    const section = page.newsSection ?? 'top-stories'
    setNewsStories([])

    fetch(BASE + 'data/news/' + section + '.json?_=' + Date.now(), { cache: 'no-store' })
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
  }, [page.variant, page.newsSection])

  return {
    dynamicCount: newsStories.length,
    contentProps: {
      newsStories,
    },
  }
}
