import { useEffect, useRef, useState } from 'react'

const BASE = import.meta.env.BASE_URL
const MESSENGER_ASSET_BASE = `${BASE}images/pages/messenger/`

export default function MessengerPanel({ onSettings, selection }) {
  const [status, setStatus] = useState('not-signed-in')
  const [retryRun, setRetryRun] = useState(0)
  const connectingTimeoutRef = useRef(null)

  useEffect(() => {
    return () => window.clearTimeout(connectingTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!selection) return undefined

    if (status === 'connecting') {
      selection.hideFocusBox()
      return undefined
    }

    const frame = window.requestAnimationFrame(() => {
      selection.unHideFocusBox()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selection, status])

  const handleTryAgain = () => {
    window.clearTimeout(connectingTimeoutRef.current)
    setRetryRun((current) => current + 1)
    setStatus('connecting')
    connectingTimeoutRef.current = window.setTimeout(() => {
      setStatus('not-signed-in')
      connectingTimeoutRef.current = null
    }, 500)
  }

  return (
    <section className="messenger-panel" aria-label="Messenger">
      <header className="messenger-panel-header">
        <h1>Messenger</h1>
        <div className="messenger-panel-actions">
          <button
            type="button"
            className="messenger-panel-header-button selectable"
            data-select-id="messenger-settings"
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            onClick={onSettings}
          >
            Settings
          </button>
          <button
            type="button"
            className="messenger-panel-header-button selectable"
            data-select-id="messenger-help"
            data-select-x="1"
            data-select-height="0"
            data-select-layer="0"
          >
            Help <img src={`${BASE}images/helpicon.png`} alt="" />
          </button>
        </div>
      </header>

      <div className="messenger-panel-body">
        <div className={`messenger-panel-connecting${status === 'connecting' ? '' : ' is-hidden'}`}>
          {status === 'connecting' && (
            <img
              key={retryRun}
              src={`${MESSENGER_ASSET_BASE}IM_Connecting.gif?retry=${retryRun}`}
              alt=""
            />
          )}
        </div>
        <div className={`messenger-panel-error${status === 'connecting' ? ' is-hidden' : ''}`}>
          <h2>Not signed into Messenger</h2>
          <p>
            You are not currently signed in to MSN Messenger. There<br />
            may be a technical problem with the Messenger service.
          </p>
          <p>To try signing into Messenger, choose <b>Try Again</b>.</p>
          <button
            type="button"
            className={`messenger-panel-button${status === 'connecting' ? '' : ' selectable'}`}
            data-select-id="messenger-try-again"
            data-select-x="0"
            data-select-height="1"
            data-select-layer="0"
            disabled={status === 'connecting'}
            onClick={handleTryAgain}
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  )
}
