import { useRef, useLayoutEffect } from 'react'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BASE = import.meta.env.BASE_URL

const DOCK_ITEMS = [
  { id: 'mail', w: 70 },
  { id: 'messenger', w: 99 },
  { id: 'favorites', w: 87 },
  { id: 'maps', w: 60 },
  { id: 'photos', w: 70 },
  { id: 'music', w: 66 },
  { id: 'news', w: 68 },
  { id: 'entertainment', w: 125 },
  { id: 'tvlistings', w: 98 },
  { id: 'weather', w: 81 },
  { id: 'sports', w: 82 },
  { id: 'money', w: 68 },
  { id: 'shop', w: 62 },
  { id: 'games', w: 70 },
  { id: 'encarta', w: 74 },
  { id: 'chat', w: 55 },
  { id: 'usingmsntv', w: 127 },
  { id: 'thingstotry', w: 116 },
  { id: 'search', w: 84 },
]
const IMG_H = 61

const TOTAL = DOCK_ITEMS.length
const BUFFER = 100


function mod(n, m) {
  return ((n % m) + m) % m
}

export default function HomePage({
  headlines,
  dockPos = 0,
  dockViewStart = 0,
  dockPixelOffset = 0,
  dockSlidingFromPos = null,
  onSlideEnd,
  onSignOutRequest,
}) {
  const now = new Date()
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  const renderOriginRef = useRef(dockViewStart - BUFFER)
  const needsRecenterRef = useRef(false)

  const margin = 10
  if (dockViewStart - renderOriginRef.current < margin || (renderOriginRef.current + BUFFER * 2 + 7) - (dockViewStart + 7) < margin) {
    renderOriginRef.current = dockViewStart - BUFFER
    needsRecenterRef.current = true
  }

  const renderStart = renderOriginRef.current
  const renderCount = BUFFER * 2 + 7
  const renderedItems = []
  for (let i = 0; i < renderCount; i++) {
    const pos = renderStart + i
    renderedItems.push({ ...DOCK_ITEMS[mod(pos, TOTAL)], pos })
  }

  const sliderRef = useRef(null)
  const baseOffsetRef = useRef(null)
  const offsetRef = useRef(0)

  const computeBase = () => {
    const slider = sliderRef.current
    if (!slider) return 0
    const children = slider.children
    const zeroIdx = 0 - renderStart
    let px = 0
    for (let i = 0; i < zeroIdx; i++) {
      px += children[i].offsetWidth
    }
    return px
  }

  useLayoutEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    let skipTransition = false

    if (needsRecenterRef.current) {
      baseOffsetRef.current = computeBase()
      needsRecenterRef.current = false
      skipTransition = true
    }

    if (baseOffsetRef.current === null) {
      baseOffsetRef.current = computeBase()
      skipTransition = true
    }

    if (skipTransition) {
      slider.style.transition = 'none'
    }

    offsetRef.current = baseOffsetRef.current + dockPixelOffset
    slider.style.transform = `translateX(-${offsetRef.current}px)`

    if (skipTransition) {
      slider.offsetHeight // eslint-disable-line no-unused-expressions
      requestAnimationFrame(() => {
        slider.style.transition = ''
      })
      onSlideEnd?.()
    }
  }, [dockPos, dockPixelOffset])

  return (
    <div className="flex page-outer flex-wrap">
      <div className="top-0 left-0 right-0 page-outer">
        <div className="flex items-center settings-container page-outer">
          <div className="shrink text-center buffer selectable" data-select-x="0" data-select-height="0" data-select-layer="0">
            <h3 className="ui-title-white-4">Using MSN TV</h3>
          </div>
          <div
            className="grow text-center buffer-2 selectable"
            data-select-x="1"
            data-select-height="0"
            data-select-layer="0"
            onClick={onSignOutRequest}
          >
            <h3 className="ui-title-white-4">Sign Out</h3>
          </div>
          <div className="grow text-center buffer-2 selectable" data-select-x="2" data-select-height="0" data-select-layer="0">
            <h3 className="ui-title-white-4">Account</h3>
          </div>
          <div className="grow text-center buffer-2 selectable" data-select-x="3" data-select-height="0" data-select-layer="0">
            <h3 className="ui-title-white-4">Settings</h3>
          </div>
          <div className="grow text-center buffer-2 selectable" data-select-x="4" data-select-height="0" data-select-layer="0">
            <div className="flex items-center">
              <h3 className="ui-title-white-4">Help</h3>
              <img className="help-icon-sml" src={`${BASE}images/helpicon.png`} />
            </div>
          </div>
        </div>
      </div>
      <img className="object-cover" src={`${BASE}images/infodivbg.png`} />
      <div className="absolute promo-img">
        <img className="object-cover" src={`${BASE}images/promotionalimage.png`} />
      </div>
      <div className="absolute flex flex-wrap today-pane items-center">
        <h3 className="today-pane-title">Today on MSN</h3>
        <h3 className="today-pane-date selectable" data-select-x="0" data-select-height="1" data-select-layer="0">
          {dateStr}
        </h3>
        <h3 className="today-pane-headline selectable" data-select-x="0" data-select-height="2" data-select-layer="0">
          {headlines[0]}
        </h3>
        <div className="break"></div>
        <h3 className="today-pane-headline selectable" data-select-x="0" data-select-height="3" data-select-layer="0">
          {headlines[1]}
        </h3>
        <div className="break"></div>
        <h3 className="today-pane-headline selectable" data-select-x="0" data-select-height="4" data-select-layer="0">
          {headlines[2]}
        </h3>
        <div className="break"></div>
        <div className="flex items-center today-end selectable" data-select-x="0" data-select-height="5" data-select-layer="0">
          <img className="dropdown-right-arrow" src={`${BASE}images/dropdowncustomrightarrow.png`} />
          <h3 className="today-pane-text">More MSNBC news</h3>
        </div>
      </div>
      <div className="absolute flex flex-wrap using-msn-tv-pane items-center">
        <h3 className="using-msn-tv-pane-title">In Using MSN TV</h3>
        <h3 className="today-pane-headline selectable" data-select-x="0" data-select-height="6" data-select-layer="0">
          Tip: Turn on audible dialing
        </h3>
        <div className="break"></div>
        <h3 className="today-pane-headline selectable" data-select-x="0" data-select-height="7" data-select-layer="0">
          Get better printing results
        </h3>
        <div className="break"></div>
        <div className="flex items-center today-end selectable" data-select-x="0" data-select-height="8" data-select-layer="0">
          <img className="dropdown-right-arrow" src={`${BASE}images/dropdowncustomrightarrow.png`} />
          <h3 className="today-pane-text">Go to Using MSN TV</h3>
        </div>
      </div>
      <div id="search-div"></div>
      <div id="dock-area">
        <img className="dock-arrow" src={`${BASE}images/dock/dock_left.gif`} />
        <div className="dock-items">
          <div
            className="dock-slider"
            ref={sliderRef}
            style={{ transform: `translateX(-${offsetRef.current}px)` }}
            onTransitionEnd={onSlideEnd}
          >
            {renderedItems.map((item) => {
              const isSelected = item.pos === dockPos
              const isSlidingFrom = item.pos === dockSlidingFromPos
              return (
                <div
                  key={item.pos}
                  className={`dock-item-slot${isSelected ? ' selectable' : ''}`}
                  {...(isSelected ? {
                    'data-select-x': '0',
                    'data-select-height': '9',
                    'data-select-layer': '0',
                    'data-dock-pos': `${item.pos}`,
                  } : {})}
                >
                  <img
                    className="dock-item-img"
                    src={`${BASE}images/dock/${item.id}${isSelected ? '_selected' : ''}.png`}
                    style={{ width: `calc(14.5vh * ${item.w} / ${IMG_H})` }}
                  />
                  {isSlidingFrom && <div className="dock-slide-selection"></div>}
                </div>
              )
            })}
          </div>
        </div>
        <img className="dock-arrow" src={`${BASE}images/dock/dock_right.gif`} />
      </div>
    </div>
  )
}
