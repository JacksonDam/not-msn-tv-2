import { BASE, SelectableRow } from '../shared'
import { WEATHER_FALLBACK_CITY, formatTemp } from '../data'
import { WEATHER_DEFAULT_CITY_ID } from '../../../utils/weatherPreferences'

function WeatherCenterContent({ weatherCities, weatherCityId, nextRow, handleModuleNavigate }) {
  return (
              (() => {
                const city = weatherCities.find((item) => item.id === weatherCityId)
                  ?? weatherCities.find((item) => item.id === WEATHER_DEFAULT_CITY_ID)
                  ?? weatherCities[0]
                  ?? WEATHER_FALLBACK_CITY
                const forecast = city.forecast.length ? city.forecast : WEATHER_FALLBACK_CITY.forecast

                return (
                  <div className="dock-page-weather">
                    <div className="dock-page-content-title dock-page-weather-title">Weather in {city.displayName}</div>
                    <div className="dock-page-weather-current">
                      <img
                        className="dock-page-weather-current-icon"
                        src={`${BASE}images/pages/weather/${city.current.icon}.png`}
                        alt=""
                      />
                      <div className="dock-page-weather-current-reading">
                        <div className="dock-page-weather-current-temp">{formatTemp(city.current.tempC, city)}</div>
                        <div className="dock-page-weather-current-condition">
                          {city.current.condition}, Feels Like: {formatTemp(city.current.feelsLikeC, city)}
                        </div>
                      </div>
                    </div>
                    <div className="dock-page-divider"></div>
                    <div className="dock-page-weather-forecast-title">4 day Forecast:</div>
                    <div className="dock-page-weather-forecast">
                      {forecast.map((item, index) => (
                        <div key={`${item.day}-${index}`} className="dock-page-weather-day">
                          <div className="dock-page-weather-day-name">{item.day}</div>
                          <img
                            className="dock-page-weather-day-icon"
                            src={`${BASE}images/pages/weather/${item.icon}.png`}
                            alt=""
                          />
                          <div className="dock-page-weather-day-temp">
                            <span>{formatTemp(item.lowC, city)}</span>
                            <span className="dock-page-weather-day-temp-secondary">/{formatTemp(item.highC, city)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <SelectableRow
                      row={nextRow()}
                      x={0}
                      className="dock-page-weather-extended"
                      data-select-id="weather-extended-forecast"
                    >
                      <span className="dock-page-bullet dock-page-weather-link-arrow" aria-hidden="true"></span>
                      <span className="dock-page-row-label">Extended forecast at MSN Weather</span>
                    </SelectableRow>
                    <div className="dock-page-weather-provider">Provided by The Weather Channel ®</div>
                    <button
                      type="button"
                      className="dock-page-news-action dock-page-weather-action dock-page-weather-change-city selectable"
                      data-select-id="weather-change-city"
                      data-select-x="1"
                      data-select-height={nextRow()}
                      data-select-layer="0"
                      onClick={() => handleModuleNavigate('weather-quick-lookup')}
                    >
                      Change City
                    </button>
                  </div>
                )
              })()
  )
}

function WeatherQuickLookupContent({ weatherQuickInputRef, nextRow, handleModuleNavigate, handleWeatherLookup }) {
  return (
              (() => {
                const cityRow = nextRow()
                const actionRow = nextRow()

                return (
                  <div className="dock-page-weather dock-page-weather-lookup">
                    <div className="dock-page-weather-copy">
                      To see the weather forecast for a city, type the city name or postal code in the box
                      below, and then choose <b>Get Forecast</b>.
                    </div>
                    <input
                      ref={weatherQuickInputRef}
                      className="dock-page-weather-input search-input-stub selectable"
                      type="text"
                      aria-label="City name or postal code"
                      autoComplete="off"
                      spellCheck={false}
                      data-select-id="weather-quick-city-input"
                      data-select-x="0"
                      data-select-height={cityRow}
                      data-select-layer="0"
                    />
                    <div className="dock-page-weather-example">Example: <b>London, England</b> or <b>W1 5DU</b></div>
                    <div className="dock-page-weather-actions">
                      <button
                        type="button"
                        className="dock-page-news-action dock-page-weather-action selectable"
                        data-select-id="weather-quick-cancel"
                        data-select-x="0"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate('weather')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="dock-page-news-action dock-page-weather-action selectable"
                        data-select-id="weather-get-forecast"
                        data-select-x="1"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleWeatherLookup(weatherQuickInputRef)}
                      >
                        Get Forecast
                      </button>
                    </div>
                  </div>
                )
              })()
  )
}

function WeatherMoreCitiesContent({ weatherExtraCityIds, weatherCities, nextRow, setWeatherCityId, handleModuleNavigate }) {
  return (
              (() => {
                const extraCities = weatherExtraCityIds
                  .map((id) => weatherCities.find((city) => city.id === id))
                  .filter(Boolean)

                return (
                  <div className="dock-page-weather dock-page-weather-more">
                    {extraCities.length ? (
                      <div className="dock-page-weather-more-list">
                        {extraCities.map((city) => (
                          <SelectableRow
                            key={city.id}
                            row={nextRow()}
                            x={0}
                            className="dock-page-weather-more-city"
                            onClick={() => {
                              setWeatherCityId(city.id)
                              handleModuleNavigate('weather')
                            }}
                          >
                            <img
                              className="dock-page-weather-more-icon"
                              src={`${BASE}images/pages/weather/${city.current.icon}.png`}
                              alt=""
                            />
                            <span className="dock-page-row-label">{city.displayName}</span>
                            <span className="dock-page-weather-more-temp">{formatTemp(city.current.tempC, city)}</span>
                          </SelectableRow>
                        ))}
                      </div>
                    ) : (
                      <div className="dock-page-weather-copy dock-page-weather-more-copy">
                        You can get 4-day forecasts for up to 3 additional cities. To add a city to this page,
                        choose <b>Add City</b>.
                      </div>
                    )}
                    <button
                      type="button"
                      className="dock-page-news-action dock-page-weather-action dock-page-weather-add-button selectable"
                      data-select-id="weather-add-city"
                      data-select-x="0"
                      data-select-height={nextRow()}
                      data-select-layer="0"
                      onClick={() => handleModuleNavigate('weather-add-city')}
                    >
                      Add City
                    </button>
                  </div>
                )
              })()
  )
}

function WeatherAddCityContent({ weatherAddInputRef, nextRow, handleModuleNavigate, handleWeatherLookup }) {
  return (
              (() => {
                const cityRow = nextRow()
                const actionRow = nextRow()

                return (
                  <div className="dock-page-weather dock-page-weather-add">
                    <div className="dock-page-content-title dock-page-weather-title">Add a city</div>
                    <div className="dock-page-weather-copy">
                      Type the name or postal code of the city you want to add to your More cities page, and
                      then choose <b>Add</b>.
                    </div>
                    <input
                      ref={weatherAddInputRef}
                      className="dock-page-weather-input search-input-stub selectable"
                      type="text"
                      aria-label="City name or postal code"
                      autoComplete="off"
                      spellCheck={false}
                      data-select-id="weather-add-city-input"
                      data-select-x="0"
                      data-select-height={cityRow}
                      data-select-layer="0"
                    />
                    <div className="dock-page-weather-example">Example: <b>London, England</b> or <b>W1 5DU</b></div>
                    <div className="dock-page-weather-actions">
                      <button
                        type="button"
                        className="dock-page-news-action dock-page-weather-action selectable"
                        data-select-id="weather-add-cancel"
                        data-select-x="0"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate('weather-more-cities')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="dock-page-news-action dock-page-weather-action selectable"
                        data-select-id="weather-add"
                        data-select-x="1"
                        data-select-height={actionRow}
                        data-select-layer="0"
                        onClick={() => handleWeatherLookup(weatherAddInputRef, 'extra')}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )
              })()
  )
}

export default function WeatherContent(props) {
  const { page } = props

  if (page.variant === 'weatherCenter') {
    return WeatherCenterContent(props)
  }

  if (page.variant === 'weatherQuickLookup') {
    return WeatherQuickLookupContent(props)
  }

  if (page.variant === 'weatherMoreCities') {
    return WeatherMoreCitiesContent(props)
  }

  if (page.variant === 'weatherAddCity') {
    return WeatherAddCityContent(props)
  }

  return null
}
