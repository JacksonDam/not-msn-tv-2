import { useRef } from 'react'

const BASE = import.meta.env.BASE_URL

export default function TypeWwwPanel({ onGo, onCancel, currentAddress, initialUrl }) {
  const inputRef = useRef(null)

  const submit = () => {
    onGo(inputRef.current?.value ?? 'http://www.')
  }

  const showCurrentAddress = () => {
    if (inputRef.current) {
      inputRef.current.value = currentAddress || 'http://msntv.msn.com/home/home.html'
      inputRef.current.focus()
      inputRef.current.select()
    }
  }

  return (
    <section className="type-www-panel" aria-label="Type www">
      <div className="type-www-panel-content">
        <h1>Type www</h1>
        <p>
          Type the address of a Web page you want to go to and then
          <br />
          choose <b>Go</b>. A Web address looks like this: www.website.com
        </p>

        <div className="type-www-form-row">
          <input
            ref={inputRef}
            className="type-www-input search-input-stub selectable"
            type="text"
            defaultValue={initialUrl || 'http://www.'}
            autoComplete="off"
            spellCheck={false}
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            aria-label="Web address"
          />
          <button
            type="button"
            className="type-www-button base-btn selectable"
            data-select-x="1"
            data-select-height="0"
            data-select-layer="0"
            onClick={submit}
          >
            Go
          </button>
          <button
            type="button"
            className="type-www-button base-btn selectable"
            data-select-x="2"
            data-select-height="0"
            data-select-layer="0"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        <button
          type="button"
          className="type-www-current-link selectable"
          data-select-x="0"
          data-select-height="1"
          data-select-layer="0"
          onClick={showCurrentAddress}
        >
          <span className="dock-page-bullet"></span>
          <span>Show current Web address</span>
        </button>
      </div>
      <img className="type-www-panel-preload" src={`${BASE}images/pages/panels/PanelsLargeBG.jpg`} alt="" />
    </section>
  )
}
