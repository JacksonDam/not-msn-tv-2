import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DockCarousel from './DockCarousel'

const BASE = import.meta.env.BASE_URL
const MUSIC_NAV_ROW = 5

const MUSIC_NAV_ITEMS = [
  { id: 'devices', label: 'Devices (1)' },
  { id: 'pcs', label: 'PCs (1)' },
  { id: 'radio', label: 'Radio' },
  { id: 'song-list', label: 'Song List' },
  { id: 'favorite-stations', label: 'Favorite Stations' },
  { id: 'music-video', label: 'Music Video' },
  { id: 'music-news', label: 'Music News' },
]

const BACKGROUND_CAPTIONS = [
  'Listen to background music',
  'whilst surfing the web',
]

function CaptionFader({ text }) {
  const currentTextRef = useRef(text)
  const tokenRef = useRef(0)
  const [display, setDisplay] = useState({
    current: text,
    previous: null,
    token: 0,
  })

  useEffect(() => {
    if (text === currentTextRef.current) return undefined

    const previous = currentTextRef.current
    currentTextRef.current = text
    const token = tokenRef.current + 1
    tokenRef.current = token

    setDisplay({
      current: text,
      previous,
      token,
    })

    const id = setTimeout(() => {
      if (tokenRef.current === token) {
        setDisplay((current) => ({ ...current, previous: null }))
      }
    }, 250)

    return () => clearTimeout(id)
  }, [text])

  return (
    <div className="music-caption-fader" aria-live="polite">
      {display.previous && (
        <span
          key={`previous-${display.token}`}
          className="music-caption-layer music-caption-layer-previous"
        >
          {display.previous}
        </span>
      )}
      <span
        key={`current-${display.token}`}
        className={`music-caption-layer music-caption-layer-current ${display.previous ? 'is-transitioning' : ''}`}
      >
        {display.current}
      </span>
    </div>
  )
}

function MusicFeatureContent({ type, phase, token }) {
  if (type === 'videos') {
    return (
      <div className={`music-feature-layer music-feature-layer-${phase}`} key={`${type}-${phase}-${token}`}>
        <div className="music-feature-heading">Music Videos</div>
        <div className="music-videos-list">
          <div className="music-video-row">
            <img
              className="music-video-thumb"
              src={`${BASE}images/pages/music/winehouse.png`}
              alt=""
            />
            <div className="music-video-title">Trailer : Amy Winehouse Biopic</div>
          </div>
          <div className="music-video-row">
            <img
              className="music-video-thumb"
              src={`${BASE}images/pages/music/icespice.jpg`}
              alt=""
            />
            <div className="music-video-title">Ice Spice : &apos;Think U The Shit (Fart)&apos;</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`music-feature-layer music-feature-layer-${phase}`} key={`${type}-${phase}-${token}`}>
      <div className="music-feature-heading">Music News</div>
      <div className="music-news-list">
        <div>Minaj loses fans amid<br />Megan Thee Stallion feud</div>
        <div>Spears apologises to<br />Timberlake over book</div>
        <div>Lana Del Rey teases new<br />country album</div>
      </div>
    </div>
  )
}

export { MUSIC_NAV_ROW }

export default function MusicCenter({
  pageRef,
  selection,
  navPos = 0,
  navViewStart = 0,
  navPixelOffset = 0,
  navSlidingFromPos = null,
  onNavSlideEnd,
  mediaPlayer,
}) {
  const rootRef = useRef(null)
  const [captionKind, setCaptionKind] = useState('background')
  const [backgroundCaptionIndex, setBackgroundCaptionIndex] = useState(0)
  const mediaPanelOpen = Boolean(mediaPlayer?.panelMounted)
  const featureRef = useRef({ active: 'news', token: 0 })
  const featureTimeoutRef = useRef(null)
  const [feature, setFeature] = useState({
    active: 'news',
    previous: null,
    token: 0,
  })

  const setRootRef = useCallback((node) => {
    rootRef.current = node
    if (typeof pageRef === 'function') {
      pageRef(node)
    } else if (pageRef) {
      pageRef.current = node
    }
  }, [pageRef])

  const advanceFeature = useCallback(() => {
    const current = featureRef.current
    const next = current.active === 'news' ? 'videos' : 'news'
    const token = current.token + 1

    featureRef.current = { active: next, token }
    clearTimeout(featureTimeoutRef.current)
    setFeature({
      active: next,
      previous: current.active,
      token,
    })

    featureTimeoutRef.current = setTimeout(() => {
      setFeature((value) => (
        value.token === token ? { ...value, previous: null } : value
      ))
    }, 500)
  }, [])

  useEffect(() => {
    const id = setInterval(advanceFeature, 10000)
    return () => {
      clearInterval(id)
      clearTimeout(featureTimeoutRef.current)
    }
  }, [advanceFeature])

  useEffect(() => {
    const updateCaptionKind = () => {
      if (mediaPanelOpen) return
      const selected = selection?.getSelected?.()
      const nextKind = selected?.getAttribute?.('data-music-caption') ?? 'default'
      setCaptionKind(nextKind)
    }

    updateCaptionKind()
    window.addEventListener('msntv-selection-change', updateCaptionKind)
    return () => window.removeEventListener('msntv-selection-change', updateCaptionKind)
  }, [mediaPanelOpen, selection])

  useEffect(() => {
    if (!rootRef.current || !selection || mediaPanelOpen) return undefined

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(rootRef.current)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mediaPanelOpen, selection])

  useEffect(() => {
    if (captionKind !== 'background') {
      setBackgroundCaptionIndex(0)
      return undefined
    }

    const id = setInterval(() => {
      setBackgroundCaptionIndex((current) => (current + 1) % BACKGROUND_CAPTIONS.length)
    }, 2000)

    return () => clearInterval(id)
  }, [captionKind])

  const caption = useMemo(() => {
    if (captionKind === 'background') return BACKGROUND_CAPTIONS[backgroundCaptionIndex]
    if (captionKind === 'jumble') return 'Play my music at random'
    if (captionKind === 'placeholder') return '...'
    return 'A fast way to get to fresh tracks'
  }, [backgroundCaptionIndex, captionKind])

  return (
    <div ref={setRootRef} className="music-center-shell dock-page-shell">
      <header className="music-center-header">
        <h1 className={`music-center-title${mediaPanelOpen ? ' is-hidden-for-panel' : ''}`}>Music</h1>
        <div className="music-center-header-actions">
          <button
            type="button"
            className="music-center-header-button selectable"
            data-select-x="2"
            data-select-height="-1"
            data-select-layer="0"
            data-music-caption="default"
          >
            Settings
          </button>
          <button
            type="button"
            className="music-center-header-button music-center-help selectable"
            data-select-x="3"
            data-select-height="-1"
            data-select-layer="0"
            data-music-caption="default"
          >
            Help
            <img className="music-center-help-icon" src={`${BASE}images/helpicon.png`} alt="" />
          </button>
        </div>
      </header>

      {mediaPanelOpen && (
        <h1 className="music-center-title music-center-title-panel-overlay" aria-hidden="true">
          Music
        </h1>
      )}

      <div className="music-home-content" aria-hidden={mediaPanelOpen ? 'true' : undefined}>
          <section className="music-center-quick-row">
            <div className="music-feature-panel">
              <div className="music-feature-stage">
                {feature.previous && (
                  <MusicFeatureContent type={feature.previous} phase="outgoing" token={feature.token} />
                )}
                <MusicFeatureContent
                  type={feature.active}
                  phase={feature.previous ? 'incoming' : 'current'}
                  token={feature.token}
                />
              </div>
              <button
                type="button"
                className="music-feature-next selectable"
                data-select-x="0"
                data-select-height="4"
                data-select-layer="0"
                data-select-id="music-feature-next"
                data-music-caption="default"
                onClick={advanceFeature}
              >
                <img src={`${BASE}images/pages/music/NextBtn.png`} alt="" />
                <span>NEXT</span>
              </button>
            </div>

            <div className="music-quick-panel">
              <h2 className="music-quick-title">Quick Spin</h2>
              <CaptionFader text={caption} />
              <div className="music-quick-options">
                <button
                  type="button"
                  className="music-quick-option music-quick-option-primary selectable"
                  data-select-x="1"
                  data-select-height="0"
                  data-select-layer="0"
                  data-music-caption="background"
                  onClick={() => mediaPlayer?.openPanel?.({ startBackground: true })}
                >
                  Play Background Music <span className="music-midi-label">(MIDI)</span>
                </button>
                <button
                  type="button"
                  className="music-quick-option selectable"
                  data-select-x="1"
                  data-select-height="1"
                  data-select-layer="0"
                  data-music-caption="jumble"
                >
                  Play a Jumble-Mix
                </button>
                <button
                  type="button"
                  className="music-quick-option selectable"
                  data-select-x="1"
                  data-select-height="2"
                  data-select-layer="0"
                  data-music-caption="placeholder"
                >
                  Tune to &apos;90s Hip-Hop &amp; Rap
                </button>
                <button
                  type="button"
                  className="music-quick-option selectable"
                  data-select-x="1"
                  data-select-height="3"
                  data-select-layer="0"
                  data-music-caption="placeholder"
                >
                  Tune to Britpop
                </button>
              </div>
            </div>
          </section>

          <section className="music-now-playing">
            <button
              type="button"
              className="music-now-playing-promo selectable"
              data-select-x="1"
              data-select-height="4"
              data-select-layer="0"
              data-music-caption="default"
            >
              Tune in to scores of <em>Radio</em> stations
            </button>
          </section>

          <nav className="music-nav-area" data-dock-carousel-area="music-nav" aria-label="Music">
            <img className="music-nav-arrow" src={`${BASE}images/dock/dock_left.gif`} alt="" />
            <DockCarousel
              items={MUSIC_NAV_ITEMS}
              pos={navPos}
              viewStart={navViewStart}
              pixelOffset={navPixelOffset}
              slidingFromPos={navSlidingFromPos}
              onSlideEnd={onNavSlideEnd}
              onActivate={() => {}}
              row={MUSIC_NAV_ROW}
              x={1}
              itemsClassName="music-nav-items dock-items"
              sliderClassName="music-nav-slider dock-slider"
              slotClassName="music-nav-slot dock-item-slot"
              slideSelectionClassName="music-nav-slide-selection dock-slide-selection"
              selectedProps={{
                'data-select-id': 'music-nav-current',
                'data-music-caption': 'default',
              }}
              renderItem={(item) => (
                <span className="music-nav-label">{item.label}</span>
              )}
            />
            <img className="music-nav-arrow" src={`${BASE}images/dock/dock_right.gif`} alt="" />
          </nav>
      </div>

    </div>
  )
}
