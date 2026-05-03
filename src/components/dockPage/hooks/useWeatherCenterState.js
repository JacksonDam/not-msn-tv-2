import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readWeatherCityCookie,
  readWeatherExtraCitiesCookie,
  writeWeatherCityCookie,
  writeWeatherExtraCitiesCookie,
} from '../../../utils/weatherPreferences'
import { fallbackWeatherCities, normalizeWeatherCity } from '../data'
import { BASE } from '../shared'

export default function useWeatherCenterState(page, handleModuleNavigate) {
  const weatherQuickInputRef = useRef(null)
  const weatherAddInputRef = useRef(null)
  const [weatherCities, setWeatherCities] = useState(() => fallbackWeatherCities())
  const [weatherCityId, setWeatherCityId] = useState(() => readWeatherCityCookie())
  const [weatherExtraCityIds, setWeatherExtraCityIds] = useState(() => readWeatherExtraCitiesCookie())

  useEffect(() => {
    writeWeatherCityCookie(weatherCityId)
  }, [weatherCityId])

  useEffect(() => {
    writeWeatherExtraCitiesCookie(weatherExtraCityIds)
  }, [weatherExtraCityIds])

  useEffect(() => {
    if (!String(page.variant ?? '').startsWith('weather')) return undefined

    let cancelled = false

    fetch(BASE + 'data/weather/cities.json?_=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const cities = Array.isArray(data?.cities)
          ? data.cities.map(normalizeWeatherCity).filter(Boolean)
          : []
        setWeatherCities(cities.length ? cities : fallbackWeatherCities())
      })
      .catch(() => {
        if (!cancelled) setWeatherCities(fallbackWeatherCities())
      })

    return () => {
      cancelled = true
    }
  }, [page.variant])

  const findWeatherCity = useCallback((rawQuery) => {
    const query = String(rawQuery ?? '').trim().toLowerCase()
    if (!query) return null
    const normalizedQuery = query.replace(/[^a-z0-9]+/g, ' ').trim()

    if (/^w1\b/.test(normalizedQuery) || normalizedQuery === 'w1 5du') {
      return weatherCities.find((city) => city.id === 'london') ?? null
    }

    return weatherCities.find((city) => (
      city.id.toLowerCase() === query
      || city.name.toLowerCase() === query
      || city.displayName.toLowerCase() === query
      || city.displayName.toLowerCase().includes(query)
    )) ?? null
  }, [weatherCities])

  const handleWeatherLookup = useCallback((inputRef, target = 'my-city') => {
    const city = findWeatherCity(inputRef.current?.value)
    if (!city) return

    if (target === 'extra') {
      setWeatherExtraCityIds((current) => (
        current.includes(city.id) ? current : [...current, city.id].slice(-3)
      ))
      handleModuleNavigate('weather-more-cities')
      return
    }

    setWeatherCityId(city.id)
    handleModuleNavigate('weather')
  }, [findWeatherCity, handleModuleNavigate])

  return {
    contentProps: {
      weatherCities,
      weatherCityId,
      weatherExtraCityIds,
      weatherQuickInputRef,
      weatherAddInputRef,
      handleWeatherLookup,
      setWeatherCityId,
    },
  }
}
