import { useEffect, useMemo, useState } from 'react'

const BASE = import.meta.env.BASE_URL

function renderSettingsText(item) {
  const parts = item.parts ?? [item.text]
  return parts.map((part, index) => {
    if (typeof part === 'string') return part
    if (part.strong) {
      return <strong key={`${part.text}-${index}`}>{part.text}</strong>
    }
    return <span key={`${part.text}-${index}`}>{part.text}</span>
  })
}

function SettingsControl({ item, row, itemKey, checked, selectedOption, onNavigate, onRadio, onCheckbox }) {
  if (item.type === 'radio') {
    return (
      <div className="settings-choice settings-radio-choice">
        <button
          type="button"
          className="settings-control-icon settings-control-feedback selectable"
          data-select-x="0"
          data-select-height={row}
          data-select-layer="0"
          onClick={() => onRadio(itemKey, 0)}
        >
          <img src={`${BASE}images/pages/settings/${checked ? 'RadioButtonMarkedCustom.png' : 'RadioButtonUnmarkedCustom.png'}`} alt="" />
        </button>
        <span>{item.label}</span>
      </div>
    )
  }

  if (item.type === 'radioRow') {
    return (
      <div className="settings-radio-row">
        {item.options.map((option, index) => (
          <div
            key={option.label}
            className="settings-choice settings-radio-choice"
          >
            <button
              type="button"
              className="settings-control-icon settings-control-feedback selectable"
              data-select-x={index}
              data-select-height={row}
              data-select-layer="0"
              onClick={() => onRadio(itemKey, index)}
            >
              <img src={`${BASE}images/pages/settings/${selectedOption === index ? 'RadioButtonMarkedCustom.png' : 'RadioButtonUnmarkedCustom.png'}`} alt="" />
            </button>
            <span>{option.label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (item.type === 'checkbox') {
    return (
      <div className="settings-choice settings-checkbox-choice">
        <button
          type="button"
          className="settings-control-icon settings-checkbox-icon settings-control-feedback selectable"
          data-select-x="0"
          data-select-height={row}
          data-select-layer="0"
          onClick={() => onCheckbox(itemKey)}
        >
          <img className="settings-checkbox-image" src={`${BASE}images/${checked ? 'checked.png' : 'unchecked.png'}`} alt="" />
        </button>
        <span>{item.label}</span>
      </div>
    )
  }

  if (item.type === 'link') {
    return (
      <button
        type="button"
        className="settings-link selectable"
        data-select-x="0"
        data-select-height={row}
        data-select-layer="0"
        onClick={() => onNavigate(item.targetPage)}
      >
        <span className="dock-page-bullet" aria-hidden="true"></span>
        <span>{item.label}</span>
      </button>
    )
  }

  if (item.type === 'heading') return <h2 className="settings-body-heading">{renderSettingsText(item)}</h2>
  if (item.type === 'strong') return <div className="settings-body-strong">{renderSettingsText(item)}</div>
  return <p className="settings-body-copy">{renderSettingsText(item)}</p>
}

export default function SettingsPage({ page, onNavigate, onAction }) {
  const initialControlState = useMemo(() => {
    const next = { radios: {}, radioGroups: {}, checkboxes: {} }
    const body = page.body ?? []

    body.forEach((item, index) => {
      if (item.type === 'radio') {
        const group = item.group ?? 'default'
        next.radioGroups[index] = group
        if (item.checked || next.radios[group] == null) {
          next.radios[group] = index
        }
      }

      if (item.type === 'radioRow') {
        const selected = item.options.findIndex((option) => option.checked)
        next.radios[`row-${index}`] = selected >= 0 ? selected : 0
      }

      if (item.type === 'checkbox') {
        next.checkboxes[index] = item.checked !== false
      }
    })

    return next
  }, [page])

  const [controlState, setControlState] = useState(initialControlState)

  useEffect(() => {
    setControlState(initialControlState)
  }, [initialControlState])

  let rowIndex = 0
  const nextRow = () => {
    const current = rowIndex
    rowIndex += 1
    return current
  }

  const handleAction = (action) => {
    if (action.action === 'navigate') {
      onNavigate(action.targetPage)
      return
    }
    onAction(action)
  }

  const handleRadio = (itemKey, optionIndex) => {
    setControlState((current) => {
      if (String(itemKey).startsWith('row-')) {
        return {
          ...current,
          radios: { ...current.radios, [itemKey]: optionIndex },
        }
      }

      const group = current.radioGroups[itemKey] ?? 'default'
      return {
        ...current,
        radios: { ...current.radios, [group]: itemKey },
      }
    })
  }

  const handleCheckbox = (itemKey) => {
    setControlState((current) => ({
      ...current,
      checkboxes: {
        ...current.checkboxes,
        [itemKey]: !current.checkboxes[itemKey],
      },
    }))
  }

  return (
    <div className={`settings-page-shell${page.variant ? ` settings-page-${page.variant}` : ''}`}>
      <header className="settings-page-header">
        <span>{page.headerTitle}</span>
        {page.headerSubtitle && <span>{page.headerSubtitle}</span>}
      </header>

      <main className="settings-page-main">
        <section className="settings-page-content">
          {page.items ? (
            <div className="settings-list">
              {page.items.map((item) => (
                <div
                  key={item.title}
                  className="settings-list-item"
                >
                  <button
                    type="button"
                    className="settings-list-title settings-list-title-button selectable"
                    data-select-x="0"
                    data-select-height={nextRow()}
                    data-select-layer="0"
                    onClick={() => onNavigate(item.targetPage)}
                  >
                    {item.title}
                  </button>
                  <span className="settings-list-description">{item.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="settings-body">
              {page.body?.map((item, index) => (
                <SettingsControl
                  key={`${item.type}-${index}-${item.text ?? item.label ?? ''}`}
                  item={item}
                  itemKey={item.type === 'radioRow' ? `row-${index}` : index}
                  row={item.type === 'paragraph' || item.type === 'heading' || item.type === 'strong' ? null : nextRow()}
                  checked={
                    item.type === 'radio'
                      ? controlState.radios[controlState.radioGroups[index] ?? 'default'] === index
                      : controlState.checkboxes[index]
                  }
                  selectedOption={controlState.radios[`row-${index}`]}
                  onNavigate={onNavigate}
                  onRadio={handleRadio}
                  onCheckbox={handleCheckbox}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="settings-page-actions">
          {page.actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              className={`settings-action selectable${action.alignBottom ? ' settings-action-bottom' : ''}`}
              data-select-id={`settings-action-${action.id}`}
              data-select-x="1"
              data-select-height={index}
              data-select-layer="0"
              onClick={() => handleAction(action)}
            >
              {action.label}
            </button>
          ))}
        </aside>
      </main>
    </div>
  )
}
