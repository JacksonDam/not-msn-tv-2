import { useCallback, useEffect, useRef, useState } from 'react'
import { BASE, noop } from './shared'

const MAP_VIEW_LABELS = ['Road Map', 'Photo Map', "Bird's Eye"]
const MAP_ZOOM_LABELS = ['Country', 'Region', 'City', 'Street', 'Close']

export default function MapsCenterPage({ pageRef, selection, subPageBackRef }) {
  const rootRef = useRef(null)
  const [mapsScreen, setMapsScreen] = useState('map')
  const [mapsLocation, setMapsLocation] = useState({
    street: '1 Microsoft Way',
    city: 'Redmond',
    state: 'WA',
    zip: '98052',
  })
  const [mapsDraftLocation, setMapsDraftLocation] = useState(mapsLocation)
  const [mapsZoomIndex, setMapsZoomIndex] = useState(3)
  const [mapsViewIndex, setMapsViewIndex] = useState(0)
  const [mapsTrafficVisible, setMapsTrafficVisible] = useState(false)
  const [mapsPan, setMapsPan] = useState({ x: 0, y: 0 })
  const [mapsDirectionChoice, setMapsDirectionChoice] = useState('start')

  const setRootRef = useCallback((node) => {
    rootRef.current = node
    pageRef(node)
  }, [pageRef])

  useEffect(() => {
    if (!subPageBackRef) return undefined
    if (mapsScreen === 'map') {
      subPageBackRef.current = null
      return undefined
    }

    const handler = () => {
      setMapsScreen('map')
      return true
    }
    subPageBackRef.current = handler
    return () => {
      if (subPageBackRef.current === handler) {
        subPageBackRef.current = null
      }
    }
  }, [subPageBackRef, mapsScreen])

  useEffect(() => {
    if (!rootRef.current || !selection) return undefined

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(rootRef.current)
      selection.goToSpecific(0, 1, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mapsScreen, selection])

    const locationLabel = [
      mapsLocation.street,
      [mapsLocation.city, mapsLocation.state].filter(Boolean).join(', '),
      mapsLocation.zip,
    ].filter(Boolean).join('  ')
    const activeViewLabel = MAP_VIEW_LABELS[mapsViewIndex]
    const nextViewLabel = MAP_VIEW_LABELS[(mapsViewIndex + 1) % MAP_VIEW_LABELS.length]
    const mapTone = mapsViewIndex === 0 ? 'road' : mapsViewIndex === 1 ? 'photo' : 'birds'
    const headerTitle = mapsScreen === 'location'
      ? 'Choose a location'
      : mapsScreen === 'directions'
        ? 'Driving directions'
        : 'Maps & Directions'

    const openMapsScreen = (screen) => {
      setMapsScreen(screen)
    }

    const handleMapsDraftChange = (field, value) => {
      setMapsDraftLocation((current) => ({ ...current, [field]: value }))
    }

    const handleMapsSubmit = () => {
      const hasLocation = mapsDraftLocation.city.trim() || mapsDraftLocation.state.trim() || mapsDraftLocation.zip.trim()
      if (!hasLocation) return
      setMapsLocation(mapsDraftLocation)
      openMapsScreen('map')
    }

    const panMap = (dx, dy) => {
      setMapsPan((current) => ({
        x: Math.max(-2, Math.min(2, current.x + dx)),
        y: Math.max(-2, Math.min(2, current.y + dy)),
      }))
    }

    const zoomMap = (delta) => {
      setMapsZoomIndex((current) => Math.max(0, Math.min(MAP_ZOOM_LABELS.length - 1, current + delta)))
    }

    const mapHeader = (
      <div className="maps-center-header">
        <div className="maps-center-title">{headerTitle}</div>
        <button
          type="button"
          className="maps-center-help selectable"
          data-select-id="maps-help"
          data-select-x="4"
          data-select-height="0"
          data-select-layer="0"
          data-select-down="maps-first-control"
          onClick={noop}
        >
          Help
          <img className="maps-center-help-icon" src={`${BASE}images/helpicon.png`} alt="" />
        </button>
      </div>
    )

    return (
      <div ref={setRootRef} className="dock-page-shell maps-center-shell theme-maps">
        {mapHeader}

        {mapsScreen === 'location' ? (
          <main className="maps-center-form">
            <p className="maps-center-copy">
              Enter a location in the U.S. to view it on a map. (You can enter a specific address, or just a city, state, or ZIP code.)
            </p>

            <div className="maps-center-field-grid">
              {[
                ['street', 'Street:', 1, 75],
                ['city', 'City:', 2, 49],
                ['state', 'State:', 3, 20],
                ['zip', 'Zip:', 4, 12],
              ].map(([field, label, row, maxLength]) => (
                <div className="maps-center-field-row" key={field}>
                  <label className="maps-center-field-label" htmlFor={`maps-${field}`}>{label}</label>
                  <input
                    id={`maps-${field}`}
                    className={`maps-center-input maps-center-input-${field} selectable`}
                    type="text"
                    maxLength={maxLength}
                    value={mapsDraftLocation[field]}
                    data-select-x="0"
                    data-select-height={row}
                    data-select-layer="0"
                    {...(row === 1 ? { 'data-select-id': 'maps-first-control' } : {})}
                    onChange={(event) => handleMapsDraftChange(field, event.currentTarget.value)}
                  />
                </div>
              ))}
            </div>

            <div className="maps-center-button-row">
              <button
                type="button"
                className="maps-center-button selectable"
                data-select-x="0"
                data-select-height="5"
                data-select-layer="0"
                onClick={handleMapsSubmit}
              >
                View Map
              </button>
            </div>
          </main>
        ) : mapsScreen === 'directions' ? (
          <main className="maps-center-form">
            <div className="maps-center-directions-label">Current location:</div>
            <div className="maps-center-current-location">{locationLabel}</div>
            <div className="maps-center-directions-question">
              Would you like directions starting or ending at this location?
            </div>

            <div className="maps-center-radio-list">
              <button
                type="button"
                className="maps-center-radio-row settings-control-feedback selectable"
                data-select-id="maps-first-control"
                data-select-x="0"
                data-select-height="1"
                data-select-layer="0"
                onClick={() => setMapsDirectionChoice('start')}
              >
                <img
                  className="maps-center-radio-icon"
                  src={`${BASE}images/pages/settings/${mapsDirectionChoice === 'start' ? 'RadioButtonMarkedCustom.png' : 'RadioButtonUnmarkedCustom.png'}`}
                  alt=""
                />
                <span>Starting here</span>
              </button>
              <button
                type="button"
                className="maps-center-radio-row settings-control-feedback selectable"
                data-select-x="0"
                data-select-height="2"
                data-select-layer="0"
                onClick={() => setMapsDirectionChoice('end')}
              >
                <img
                  className="maps-center-radio-icon"
                  src={`${BASE}images/pages/settings/${mapsDirectionChoice === 'end' ? 'RadioButtonMarkedCustom.png' : 'RadioButtonUnmarkedCustom.png'}`}
                  alt=""
                />
                <span>Ending here</span>
              </button>
            </div>

            <div className="maps-center-button-row maps-center-button-row-directions">
              <button
                type="button"
                className="maps-center-button selectable"
                data-select-x="0"
                data-select-height="3"
                data-select-layer="0"
                onClick={() => openMapsScreen('location')}
              >
                Continue
              </button>
              <button
                type="button"
                className="maps-center-button selectable"
                data-select-x="1"
                data-select-height="3"
                data-select-layer="0"
                onClick={() => openMapsScreen('map')}
              >
                Cancel
              </button>
            </div>
          </main>
        ) : (
          <>
            <main className="maps-center-map-stage">
              <div className="maps-center-map-wrapper">
                <div className={`maps-center-map maps-center-map-${mapTone}`}>
                  <div
                    className="maps-center-map-shift"
                    style={{ transform: `translate(${mapsPan.x * -2.6}vh, ${mapsPan.y * -2.1}vh) scale(${1 + mapsZoomIndex * 0.055})` }}
                  >
                    <div className="maps-center-road maps-center-road-main"></div>
                    <div className="maps-center-road maps-center-road-second"></div>
                    <div className="maps-center-road maps-center-road-third"></div>
                    <div className="maps-center-water"></div>
                    {mapsTrafficVisible && (
                      <>
                        <div className="maps-center-traffic maps-center-traffic-one"></div>
                        <div className="maps-center-traffic maps-center-traffic-two"></div>
                      </>
                    )}
                    <div className="maps-center-gridline maps-center-gridline-h"></div>
                    <div className="maps-center-gridline maps-center-gridline-v"></div>
                  </div>
                  <div className="maps-center-pin">
                    <span></span>
                  </div>
                  <div className="maps-center-location-card">
                    <b>{[mapsLocation.city, mapsLocation.state].filter(Boolean).join(', ') || 'Selected location'}</b>
                    <span>{mapsLocation.street || mapsLocation.zip || 'Map location'}</span>
                  </div>
                  <div className="maps-center-view-badge">{activeViewLabel}</div>
                </div>

                <button type="button" aria-label="Pan up" className="maps-center-pan maps-center-pan-up selectable" data-select-id="maps-first-control" data-select-x="1" data-select-height="1" data-select-layer="0" data-select-up="maps-help" onClick={() => panMap(0, -1)}></button>
                <button type="button" aria-label="Pan left" className="maps-center-pan maps-center-pan-left selectable" data-select-id="maps-pan-left" data-select-x="0" data-select-height="2" data-select-layer="0" data-select-up="maps-first-control" data-select-left="maps-pan-left" data-select-right="maps-pan-right" onClick={() => panMap(-1, 0)}></button>
                <button type="button" aria-label="Pan right" className="maps-center-pan maps-center-pan-right selectable" data-select-id="maps-pan-right" data-select-x="2" data-select-height="2" data-select-layer="0" data-select-up="maps-first-control" data-select-left="maps-pan-left" data-select-right="maps-pan-right" onClick={() => panMap(1, 0)}></button>
                <button type="button" aria-label="Pan down" className="maps-center-pan maps-center-pan-down selectable" data-select-id="maps-pan-down" data-select-x="1" data-select-height="3" data-select-layer="0" data-select-up="maps-pan-left" onClick={() => panMap(0, 1)}></button>
              </div>
            </main>

            <div className="maps-center-control-bar">
              <div className="maps-center-zoom">
                <button type="button" className="maps-center-button maps-center-zoom-button selectable" data-select-x="0" data-select-height="4" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => zoomMap(1)}>+</button>
                <button type="button" className="maps-center-button maps-center-zoom-button selectable" data-select-x="0" data-select-height="5" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => zoomMap(-1)}>-</button>
              </div>
              <div className="maps-center-zoom-label">{MAP_ZOOM_LABELS[mapsZoomIndex]}</div>
              <div className="maps-center-actions">
                <button type="button" className="maps-center-button maps-center-action-button selectable" data-select-x="1" data-select-height="4" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => setMapsViewIndex((mapsViewIndex + 1) % MAP_VIEW_LABELS.length)}>{nextViewLabel}</button>
                <button type="button" className="maps-center-button maps-center-action-button maps-center-action-button-wide selectable" data-select-x="2" data-select-height="4" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => { setMapsDraftLocation(mapsLocation); openMapsScreen('location') }}>New Location</button>
                <button type="button" className="maps-center-button maps-center-action-button selectable" data-select-x="3" data-select-height="4" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => openMapsScreen('directions')}>Directions</button>
                <button type="button" className="maps-center-button maps-center-action-button maps-center-action-button-wide selectable" data-select-x="4" data-select-height="4" data-select-layer="0" data-select-up="maps-pan-down" onClick={() => setMapsTrafficVisible((current) => !current)}>{mapsTrafficVisible ? 'Hide Traffic' : 'Show Traffic'}</button>
              </div>
            </div>
          </>
        )}
      </div>
    )
}
