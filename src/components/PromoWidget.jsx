import { useEffect, useState } from 'react'
import { readWeatherCityCookie, WEATHER_DEFAULT_CITY_ID } from '../utils/weatherPreferences'

const BASE = import.meta.env.BASE_URL

const STOCK_SOURCES = [
  { id: 'indu', label: 'Dow' },
  { id: 'nasdaq', label: 'Nasdaq' },
  { id: 'sp500', label: 'S&P' },
]

function cToF(celsius) {
  return Math.round((Number(celsius) || 0) * 9 / 5 + 32)
}

function formatChange(value) {
  const n = Number(value) || 0
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(2)}`
}

export default function PromoWidget() {
  const [mode, setMode] = useState('weather')
  const [weather, setWeather] = useState(null)
  const [stocks, setStocks] = useState([])

  useEffect(() => {
    const id = setInterval(() => {
      setMode((current) => (current === 'weather' ? 'stocks' : 'weather'))
    }, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    const cityId = readWeatherCityCookie() || WEATHER_DEFAULT_CITY_ID

    fetch(`${BASE}data/weather/cities.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const cities = Array.isArray(data.cities) ? data.cities : []
        const city = cities.find((c) => c.id === cityId) || cities[0]
        if (city) setWeather(city)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all(STOCK_SOURCES.map((source) => (
      fetch(`${BASE}data/money/quotes/${source.id}.json?_=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => ({ label: source.label, change: Number(data?.change ?? 0) }))
        .catch(() => ({ label: source.label, change: 0 }))
    ))).then((results) => {
      if (!cancelled) setStocks(results)
    })

    return () => { cancelled = true }
  }, [])

  const showWeather = mode === 'weather' && weather
  const showStocks = mode === 'stocks' && stocks.length > 0

  const currentTempF = weather ? cToF(weather.current?.tempC) : 0
  const lowTempF = weather
    ? cToF(weather.forecast?.[0]?.lowC ?? weather.current?.tempC)
    : 0

  return (
    <div className="absolute promo-widget">
      {showWeather && (
        <div className="promo-widget-inner promo-widget-weather">
          <h3 className="promo-widget-city">{weather.name || weather.displayName}</h3>
          <h3 className="promo-widget-temp">{`${currentTempF}°/${lowTempF}`}</h3>
          <h3 className="promo-widget-cond">{weather.current?.condition || ''}</h3>
          <h3 className="promo-widget-source">The Weather Channel &reg;</h3>
          {weather.current?.icon && (
            <img
              className="promo-widget-weather-icon"
              src={`${BASE}images/pages/weather/${weather.current.icon}.png`}
              alt=""
            />
          )}
        </div>
      )}
      {showStocks && (
        <div className="promo-widget-inner promo-widget-stocks">
          {stocks.map((stock) => {
            const isNegative = stock.change < 0
            return (
              <div className="promo-widget-stock-row" key={stock.label}>
                <h3 className="promo-widget-stock-label">{stock.label}</h3>
                <span className={`promo-widget-stock-arrow ${isNegative ? 'negative' : 'positive'}`} aria-hidden="true">
                  <span className="promo-widget-stock-arrow-tri"></span>
                  <span className="promo-widget-stock-arrow-bar"></span>
                </span>
                <h3 className="promo-widget-stock-val">{formatChange(stock.change)}</h3>
              </div>
            )
          })}
          <h3 className="promo-widget-source promo-widget-source-stocks">Source: MSN Money</h3>
        </div>
      )}
    </div>
  )
}
