import { useRef } from 'react'
import { DOCK_ITEMS } from '../data/dockContent'
import { USING_TIP_TARGETS_BY_LABEL } from '../data/usingTipPages'
import DockCarousel from './DockCarousel'
import PromoWidget from './PromoWidget'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BASE = import.meta.env.BASE_URL
const IMG_H = 61

export default function HomePage({
  headlines,
  dockPos = 0,
  dockViewStart = 0,
  dockPixelOffset = 0,
  dockSlidingFromPos = null,
  onSlideEnd,
  onSignOutRequest,
  onDockActivate,
  onAddressGo,
  onSettingsRequest,
}) {
  const searchInputRef = useRef(null)
  const now = new Date()
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
  const audibleDialingTipId = USING_TIP_TARGETS_BY_LABEL['Turn on audible dialing']
  const printingTipId = USING_TIP_TARGETS_BY_LABEL['Preview before you print']
  const submitAddress = () => {
    onAddressGo?.(searchInputRef.current?.value ?? 'http://www.')
  }

  return (
    <div className="flex page-outer flex-wrap">
      <div className="top-0 left-0 right-0 page-outer">
        <div className="flex items-center settings-container page-outer">
          <div
            className="shrink text-center buffer selectable"
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            onClick={() => onDockActivate?.('usingmsntv')}
          >
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
          <div
            className="grow text-center buffer-2 selectable"
            data-select-x="3"
            data-select-height="0"
            data-select-layer="0"
            onClick={onSettingsRequest}
          >
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
        <img className="object-cover" src={`${BASE}images/promotionalimage.webp`} />
      </div>
      <PromoWidget onActivate={onDockActivate} />
      <div className="absolute flex flex-wrap today-pane items-center">
        <h3 className="today-pane-title">Today on MSN</h3>
        <h3
          className="today-pane-date selectable"
          data-select-id="today-date"
          data-select-x="0"
          data-select-height="1"
          data-select-layer="0"
        >
          {dateStr}
        </h3>
        <h3
          className="today-pane-headline selectable"
          data-select-x="0"
          data-select-height="2"
          data-select-layer="0"
          onClick={() => onDockActivate?.('news')}
        >
          {headlines[0]}
        </h3>
        <div className="break"></div>
        <h3
          className="today-pane-headline selectable"
          data-select-x="0"
          data-select-height="3"
          data-select-layer="0"
          onClick={() => onDockActivate?.('news')}
        >
          {headlines[1]}
        </h3>
        <div className="break"></div>
        <h3
          className="today-pane-headline selectable"
          data-select-x="0"
          data-select-height="4"
          data-select-layer="0"
          onClick={() => onDockActivate?.('news')}
        >
          {headlines[2]}
        </h3>
        <div className="break"></div>
        <div
          className="flex items-center today-end selectable"
          data-select-x="0"
          data-select-height="5"
          data-select-layer="0"
          onClick={() => onDockActivate?.('news')}
        >
          <img className="dropdown-right-arrow" src={`${BASE}images/dropdowncustomrightarrow.png`} />
          <h3 className="today-pane-text">More MSNBC news</h3>
        </div>
      </div>
      <div className="absolute flex flex-wrap using-msn-tv-pane items-center">
        <h3 className="using-msn-tv-pane-title">In Using MSN TV</h3>
        <h3
          className="today-pane-headline selectable"
          data-select-x="0"
          data-select-height="6"
          data-select-layer="0"
          data-select-right="using-msn-tv-link"
          onClick={() => audibleDialingTipId && onDockActivate?.(audibleDialingTipId)}
        >
          Tip: Turn on audible dialing
        </h3>
        <div className="break"></div>
        <h3
          className="today-pane-headline selectable"
          data-select-x="0"
          data-select-height="7"
          data-select-layer="0"
          data-select-right="using-msn-tv-link"
          onClick={() => printingTipId && onDockActivate?.(printingTipId)}
        >
          Get better printing results
        </h3>
        <div className="break"></div>
        <div
          className="flex items-center today-end selectable"
          data-select-id="using-msn-tv-link"
          data-select-x="0"
          data-select-height="8"
          data-select-layer="0"
          onClick={() => onDockActivate?.('usingmsntv')}
        >
          <img className="dropdown-right-arrow" src={`${BASE}images/dropdowncustomrightarrow.png`} />
          <h3 className="today-pane-text">Go to Using MSN TV</h3>
        </div>
      </div>
      <div id="search-div">
        <h3 className="search-label">Search or type www</h3>
        <input
          ref={searchInputRef}
          className="search-input-stub selectable"
          type="text"
          data-select-x="0"
          data-select-height="9"
          data-select-layer="0"
          data-home-search="true"
          aria-label="Search and type www"
          autoComplete="off"
          spellCheck={false}
          onClick={(e) => e.currentTarget.focus()}
        />
        <button
          type="button"
          className="sign-in-btn search-go-btn selectable"
          data-select-x="1"
          data-select-height="9"
          data-select-layer="0"
          onClick={submitAddress}
        >
          Go
        </button>
      </div>
      <div id="dock-area">
        <img className="dock-arrow" src={`${BASE}images/dock/dock_left.gif`} />
        <DockCarousel
          items={DOCK_ITEMS}
          pos={dockPos}
          viewStart={dockViewStart}
          pixelOffset={dockPixelOffset}
          slidingFromPos={dockSlidingFromPos}
          onSlideEnd={onSlideEnd}
          onActivate={(item) => onDockActivate?.(item.id)}
          row={10}
          renderItem={(item, { isSelected }) => (
            <img
              className="dock-item-img"
              src={`${BASE}images/dock/${item.id}${isSelected ? '_selected' : ''}.png`}
              style={{ width: `calc(14.5vh * ${item.w} / ${IMG_H})` }}
            />
          )}
        />
        <img className="dock-arrow" src={`${BASE}images/dock/dock_right.gif`} />
      </div>
    </div>
  )
}
