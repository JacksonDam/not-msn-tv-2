export const WEATHER_CITY_COOKIE_NAME = 'msntv_weather_city'
export const WEATHER_EXTRA_CITIES_COOKIE_NAME = 'msntv_weather_extra_cities'
export const WEATHER_DEFAULT_CITY_ID = 'san-francisco'

function normalizeCityId(rawValue) {
  return String(rawValue ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readCookie(name) {
  if (typeof document === 'undefined') return null

  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; SameSite=Lax`
}

export function readWeatherCityCookie() {
  const cityId = normalizeCityId(decodeURIComponent(readCookie(WEATHER_CITY_COOKIE_NAME) ?? ''))
  return cityId || WEATHER_DEFAULT_CITY_ID
}

export function writeWeatherCityCookie(cityId) {
  const normalizedCityId = normalizeCityId(cityId) || WEATHER_DEFAULT_CITY_ID
  writeCookie(WEATHER_CITY_COOKIE_NAME, normalizedCityId)
}

export function readWeatherExtraCitiesCookie() {
  const cookie = readCookie(WEATHER_EXTRA_CITIES_COOKIE_NAME)
  if (!cookie || cookie === '-') return []

  return [...new Set(
    decodeURIComponent(cookie)
      .split(',')
      .map(normalizeCityId)
      .filter(Boolean),
  )].slice(0, 3)
}

export function writeWeatherExtraCitiesCookie(cityIds) {
  const normalizedCityIds = [...new Set(
    cityIds
      .map(normalizeCityId)
      .filter(Boolean),
  )].slice(0, 3)

  writeCookie(WEATHER_EXTRA_CITIES_COOKIE_NAME, normalizedCityIds.length ? normalizedCityIds.join(',') : '-')
}
