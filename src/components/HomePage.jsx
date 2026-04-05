const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BASE = import.meta.env.BASE_URL

export default function HomePage({ headlines }) {
  const now = new Date()
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  return (
    <div className="flex page-outer flex-wrap">
      <div className="top-0 left-0 right-0 page-outer">
        <div className="flex items-center settings-container page-outer">
          <div className="shrink text-center buffer selectable" data-select-x="0" data-select-height="0" data-select-layer="0">
            <h3 className="ui-title-white-4">Using MSN TV</h3>
          </div>
          <div className="grow text-center buffer-2 selectable" data-select-x="1" data-select-height="0" data-select-layer="0">
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
      <div id="placeholder-bar">
        <h3 className="absolute holiday-text">Coming soon!</h3>
      </div>
    </div>
  )
}
