import { BASE, noop } from './shared'

export default function NavigationErrorPage({ pageRef, navigationErrorUrl, onClose }) {
  const errorUrl = String(navigationErrorUrl || 'http://www.').trim() || 'http://www.'

  return (
    <div ref={pageRef} className="dock-page-shell navigation-error-shell">
      <div className="navigation-error-body">
        <img className="navigation-error-icon" src={BASE + 'images/warning.png'} alt="" />
        <div className="navigation-error-copy">
          <h1>Navigation Error</h1>
          <p>We couldn't find the page you're looking for:</p>
          <p className="navigation-error-url">
            {errorUrl}
          </p>
          <p>
            If there is a mistake in the address, you can correct it
            <br />
            below and try again.
          </p>
          <input
            className="navigation-error-input search-input-stub selectable"
            type="text"
            defaultValue={errorUrl}
            autoComplete="off"
            spellCheck={false}
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            aria-label="Web address"
          />
        </div>
        <div className="navigation-error-actions">
          <button
            type="button"
            className="navigation-error-button base-btn selectable"
            data-select-x="0"
            data-select-height="1"
            data-select-layer="0"
            onClick={noop}
          >
            Try Again
          </button>
          <button
            type="button"
            className="navigation-error-button base-btn selectable"
            data-select-x="1"
            data-select-height="1"
            data-select-layer="0"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
