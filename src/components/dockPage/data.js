const NEWS_FALLBACKS = {
  'top-stories': ['Top Stories is temporarily unavailable'],
  business: ['Business news is temporarily unavailable'],
  technology: ['Technology news is temporarily unavailable'],
  health: ['Health news is temporarily unavailable'],
  travel: ['Travel news is temporarily unavailable'],
  opinion: ['Opinion stories are temporarily unavailable'],
  local: ['Local headlines are temporarily unavailable'],
}

const WEATHER_FALLBACK_CITY = {
  id: 'san-francisco',
  name: 'San Francisco',
  country: 'CA',
  displayName: 'San Francisco, CA',
  current: {
    tempC: 14,
    feelsLikeC: 13,
    condition: 'Partly cloudy',
    icon: 'cloudysun',
  },
  forecast: [
    { day: 'Sun', highC: 17, lowC: 11, condition: 'Partly cloudy', icon: 'suncloud' },
    { day: 'Mon', highC: 18, lowC: 12, condition: 'Partly cloudy', icon: 'cloudysun' },
    { day: 'Tue', highC: 16, lowC: 11, condition: 'Cloudy', icon: 'cloud' },
    { day: 'Wed', highC: 17, lowC: 12, condition: 'Clear', icon: 'sun' },
  ],
}

function normalizeNewsHeadline(item) {
  const title = String(item?.title ?? item ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return null

  return {
    title,
    description: String(item?.description ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    source: item?.source || 'MSNBC',
  }
}

function normalizeWeatherCity(item) {
  const name = String(item?.name ?? '').trim()
  const country = String(item?.country ?? '').trim()
  if (!name) return null

  return {
    id: String(item?.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
    name,
    country,
    displayName: String(item?.displayName ?? (name + (country ? ', ' + country : ''))).trim(),
    current: {
      tempC: Math.round(Number(item?.current?.tempC ?? 0)),
      feelsLikeC: Math.round(Number(item?.current?.feelsLikeC ?? item?.current?.tempC ?? 0)),
      condition: String(item?.current?.condition ?? 'Unavailable').trim(),
      icon: String(item?.current?.icon ?? 'cloud').trim(),
    },
    forecast: Array.isArray(item?.forecast)
      ? item.forecast.slice(0, 4).map((forecastItem) => ({
          day: String(forecastItem?.day ?? '').trim(),
          highC: Math.round(Number(forecastItem?.highC ?? 0)),
          lowC: Math.round(Number(forecastItem?.lowC ?? 0)),
          condition: String(forecastItem?.condition ?? '').trim(),
          icon: String(forecastItem?.icon ?? 'cloud').trim(),
        }))
      : [],
  }
}

function fallbackWeatherCities() {
  return [WEATHER_FALLBACK_CITY]
}

function usesFahrenheit(city) {
  const country = String(city?.country ?? '').trim().toUpperCase()
  return ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY', 'UNITED STATES', 'USA', 'US'].includes(country)
}

function formatTemp(value, city = null) {
  const celsius = Number(value ?? 0)
  const rounded = Math.round(usesFahrenheit(city) ? (celsius * 9 / 5) + 32 : celsius)
  return String(rounded) + '°'
}

function fallbackNews(section) {
  return (NEWS_FALLBACKS[section] ?? NEWS_FALLBACKS['top-stories'])
    .map((title) => ({ title, description: '', source: 'MSNBC' }))
}

function dateSeed(date) {
  const key = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  return Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function seededNumber(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function lotteryNumbers(seed, count, max, { allowZero = false } = {}) {
  const numbers = []
  let cursor = seed

  while (numbers.length < count) {
    cursor += 1
    const value = Math.floor(seededNumber(cursor) * (max + (allowZero ? 1 : 0))) + (allowZero ? 0 : 1)
    if (!allowZero && numbers.includes(value)) continue
    numbers.push(value)
  }

  return numbers
}

function formatNewsDate(date) {
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
}

function createLotteryRows() {
  const today = new Date()
  const seed = dateSeed(today)

  return [
    {
      date: formatNewsDate(today),
      title: 'Evening Pick 3',
      results: lotteryNumbers(seed + 10, 3, 9, { allowZero: true }).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'Midday Pick 3',
      results: lotteryNumbers(seed + 20, 3, 9, { allowZero: true }).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'Fantasy 5',
      results: lotteryNumbers(seed + 30, 5, 39).join('-'),
    },
    {
      date: formatNewsDate(today),
      title: 'SuperLotto Plus',
      results: lotteryNumbers(seed + 40, 5, 47).join('-') + '\n' + lotteryNumbers(seed + 50, 1, 27)[0],
    },
    {
      date: formatNewsDate(today),
      title: 'Daily Derby',
      results: lotteryNumbers(seed + 60, 3, 12).join(' ')
        + '\nHS 1:'
        + String(Math.floor(seededNumber(seed + 70) * 60)).padStart(2, '0')
        + '.'
        + String(Math.floor(seededNumber(seed + 80) * 100)).padStart(2, '0'),
    },
  ]
}

export {
  WEATHER_FALLBACK_CITY,
  createLotteryRows,
  fallbackNews,
  fallbackWeatherCities,
  formatTemp,
  normalizeNewsHeadline,
  normalizeWeatherCity,
}
