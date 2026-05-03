import CommerceContent from './CommerceContent'
import GamesContent from './GamesContent'
import NewsContent from './NewsContent'
import WeatherContent from './WeatherContent'
import SportsContent from './SportsContent'
import MoneyContent from './MoneyContent'
import UsingContent from './UsingContent'
import ThingsToTryContent from './ThingsToTryContent'
import DefaultCenterContent from './DefaultCenterContent'

export default function renderCenterContent(props) {
  const { page } = props

  if (page.variant === 'entertainmentMissing'
    || page.variant === 'shopMissing'
    || page.variant === 'shopSpecialOffers'
    || page.variant === 'entertainmentMovies') {
    return CommerceContent(props)
  }

  if (page.variant === 'gamesCenter') {
    return GamesContent(props)
  }

  if (page.variant === 'newsCenter'
    || page.variant === 'newsLocalChange'
    || page.variant === 'newsLottery') {
    return NewsContent(props)
  }

  if (String(page.variant ?? '').startsWith('weather')) {
    return WeatherContent(props)
  }

  if (page.variant === 'sportsTopStories'
    || page.variant === 'sportsLeague'
    || page.variant === 'sportsNcaa') {
    return SportsContent(props)
  }

  if (page.variant === 'moneyCenter'
    || page.variant === 'moneyBusinessNews'
    || page.variant === 'moneyExperts'
    || page.variant === 'moneyStocks'
    || page.variant === 'moneyStocksAdd'
    || page.variant === 'moneyStocksRemove') {
    return MoneyContent(props)
  }

  if (page.variant === 'usingMain'
    || page.variant === 'usingNewsletter'
    || page.variant === 'usingTipDetail') {
    return UsingContent(props)
  }

  if (page.variant === 'thingsToTry') {
    return ThingsToTryContent(props)
  }

  return DefaultCenterContent(props)
}
