import { useEffect, useState } from 'react'
import { BASE } from '../shared'

export default function useSportsCenterState(page) {
  const [sportsTopStories, setSportsTopStories] = useState([])
  const [sportsLeagueStories, setSportsLeagueStories] = useState([])
  const [sportsNcaaStories, setSportsNcaaStories] = useState({ basketball: [], football: [] })

  useEffect(() => {
    if (page.variant !== 'sportsTopStories') return undefined

    let cancelled = false

    fetch(BASE + 'data/sports/top-stories.json?_=' + Date.now(), { cache: 'no-store' })
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
  }, [page.variant])

  useEffect(() => {
    if (page.variant !== 'sportsLeague') return undefined

    let cancelled = false
    const leagueId = page.sportsLeagueId ?? 'nfl'
    const leagueName = page.sportsLeagueName ?? 'NFL'
    setSportsLeagueStories([])

    fetch(BASE + 'data/sports/' + leagueId + '.json?_=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const headlines = Array.isArray(data?.headlines) ? data.headlines.slice(0, 10) : []
        setSportsLeagueStories(headlines)
      })
      .catch(() => {
        if (!cancelled) setSportsLeagueStories([{ title: leagueName + ' news is temporarily unavailable', source: '' }])
      })

    return () => {
      cancelled = true
    }
  }, [page.variant, page.sportsLeagueId, page.sportsLeagueName])

  useEffect(() => {
    if (page.variant !== 'sportsNcaa') return undefined

    let cancelled = false
    setSportsNcaaStories({ basketball: [], football: [] })

    Promise.all([
      fetch(BASE + 'data/sports/ncaa-basketball.json?_=' + Date.now(), { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(BASE + 'data/sports/ncaa-football.json?_=' + Date.now(), { cache: 'no-store' })
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
  }, [page.variant])

  return {
    dynamicCounts: [
      sportsTopStories.length,
      sportsLeagueStories.length,
      sportsNcaaStories.basketball.length,
      sportsNcaaStories.football.length,
    ],
    contentProps: {
      sportsTopStories,
      sportsLeagueStories,
      sportsNcaaStories,
    },
  }
}
