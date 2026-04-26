import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from 'react'

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

function applyNavAttrs(navProps, navOverrides) {
  const out = { ...navProps }
  if (navOverrides) {
    for (const direction of ['up', 'down', 'left', 'right']) {
      const key = `select${direction[0].toUpperCase()}${direction.slice(1)}`
      if (navOverrides[key]) {
        out[`data-select-${direction}`] = navOverrides[key]
      }
    }
  }
  return out
}

function SettingsControl({
  item,
  row,
  itemKey,
  checked,
  selectedOption,
  onNavigate,
  onRadio,
  onCheckbox,
  rightTargetId,
  upTargetId,
  downTargetId,
}) {
  if (item.type === 'radio') {
    return (
      <div className="settings-choice settings-radio-choice">
        <button
          type="button"
          className="settings-control-icon settings-control-feedback selectable"
          data-select-x="0"
          data-select-height={row}
          data-select-layer="0"
          data-select-right={item.selectRight ?? rightTargetId ?? undefined}
          data-select-up={upTargetId ?? undefined}
          data-select-down={downTargetId ?? undefined}
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
              data-select-x="0"
              data-select-height={row + index}
              data-select-layer="0"
              data-select-right={rightTargetId ?? undefined}
              data-select-up={index === 0 ? upTargetId ?? undefined : undefined}
              data-select-down={index === item.options.length - 1 ? downTargetId ?? undefined : undefined}
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
          data-select-right={item.selectRight ?? rightTargetId ?? undefined}
          data-select-up={upTargetId ?? undefined}
          data-select-down={downTargetId ?? undefined}
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
        data-select-right={item.selectRight ?? rightTargetId ?? undefined}
        data-select-up={upTargetId ?? undefined}
        data-select-down={downTargetId ?? undefined}
        onClick={() => onNavigate(item.targetPage)}
      >
        <span className="dock-page-bullet" aria-hidden="true"></span>
        <span>{item.label}</span>
      </button>
    )
  }

  const selectableTextProps = item.selectable
    ? {
        className: 'selectable',
        'data-select-x': 0,
        'data-select-height': row,
        'data-select-layer': 0,
        'data-select-right': item.selectRight ?? rightTargetId ?? undefined,
        'data-select-up': upTargetId ?? undefined,
        'data-select-down': downTargetId ?? undefined,
        'data-action-noop': 'true',
      }
    : null
  if (item.type === 'heading') {
    return (
      <h2
        {...(selectableTextProps ?? {})}
        className={`settings-body-heading${selectableTextProps ? ' selectable' : ''}`}
      >
        {renderSettingsText(item)}
      </h2>
    )
  }
  if (item.type === 'strong') {
    return (
      <div
        {...(selectableTextProps ?? {})}
        className={`settings-body-strong${selectableTextProps ? ' selectable' : ''}`}
      >
        {renderSettingsText(item)}
      </div>
    )
  }
  if (item.type === 'arrowGrid') {
    const cells = [
      {
        id: 'tv-arrow-up',
        cls: 'row1col2',
        img: 'MoveUp.gif',
        x: 1,
        h: row,
        nav: { selectDown: 'tv-arrow-reset', selectRight: 'settings-action-save', selectUp: upTargetId },
      },
      {
        id: 'tv-arrow-left',
        cls: 'row2col1',
        img: 'MoveLeft.gif',
        x: 0,
        h: row + 1,
        nav: { selectUp: 'tv-arrow-up', selectDown: 'tv-arrow-down', selectRight: 'tv-arrow-reset' },
      },
      {
        id: 'tv-arrow-reset',
        cls: 'row2col2',
        img: 'MoveReset.gif',
        x: 1,
        h: row + 1,
        nav: { selectUp: 'tv-arrow-up', selectDown: 'tv-arrow-down', selectLeft: 'tv-arrow-left', selectRight: 'tv-arrow-right' },
      },
      {
        id: 'tv-arrow-right',
        cls: 'row2col3',
        img: 'MoveRight.gif',
        x: 2,
        h: row + 1,
        nav: { selectUp: 'tv-arrow-up', selectDown: 'tv-arrow-down', selectLeft: 'tv-arrow-reset' },
      },
      {
        id: 'tv-arrow-down',
        cls: 'row3col2',
        img: 'MoveDown.gif',
        x: 1,
        h: row + 2,
        nav: { selectUp: 'tv-arrow-reset', selectRight: 'settings-action-cancel', selectDown: downTargetId },
      },
    ]
    return (
      <div className="settings-control-grid">
        {cells.map((cell) => {
          const navAttrs = applyNavAttrs({}, cell.nav)
          return (
            <button
              key={cell.id}
              type="button"
              className={`settings-control-grid-button ${cell.cls} settings-control-feedback selectable`}
              data-select-id={cell.id}
              data-select-x={cell.x}
              data-select-height={cell.h}
              data-select-layer="0"
              {...navAttrs}
            >
              <img src={`${BASE}images/pages/settings/${cell.img}`} alt={cell.id} />
            </button>
          )
        })}
      </div>
    )
  }
  if (item.type === 'image') {
    const cls = ['settings-body-side-image', item.imageVariant === 'pluge' ? 'settings-body-side-image-pluge' : '']
      .filter(Boolean)
      .join(' ')
    return <img className={cls} src={`${BASE}${item.src}`} alt={item.alt ?? ''} />
  }
  if (item.type === 'inputRow') {
    return (
      <div className="settings-field-row">
        {item.label && <span className="settings-field-label">{item.label}</span>}
        <input
          type={item.inputType ?? 'text'}
          className={`settings-input settings-input-text search-input-stub selectable${item.fieldClass ? ` ${item.fieldClass}` : ''}`}
          defaultValue={item.defaultValue ?? ''}
          maxLength={item.maxLength}
          autoComplete="off"
          spellCheck={false}
          data-select-x="0"
          data-select-height={row}
          data-select-layer="0"
          data-select-right={item.selectRight ?? rightTargetId ?? undefined}
          data-select-up={upTargetId ?? undefined}
          data-select-down={downTargetId ?? undefined}
        />
        {item.suffix && <span className="settings-field-suffix">{item.suffix}</span>}
      </div>
    )
  }
  if (item.type === 'ipAddress') {
    const octets = item.defaultValue?.split('.') ?? ['', '', '', '']
    return (
      <div className="settings-field-row">
        {item.label && <span className="settings-field-label">{item.label}</span>}
        <div className="settings-ip-address">
          {[0, 1, 2, 3].map((i) => (
            <Fragment key={i}>
              <input
                type="text"
                inputMode="numeric"
                className="settings-input settings-input-octet search-input-stub selectable"
                defaultValue={octets[i] ?? ''}
                maxLength={3}
                autoComplete="off"
                spellCheck={false}
                data-select-x={i}
                data-select-height={row}
                data-select-layer="0"
                data-select-right={i === 3 ? (item.selectRight ?? rightTargetId ?? undefined) : undefined}
                data-select-up={i === 0 ? upTargetId ?? undefined : undefined}
                data-select-down={downTargetId ?? undefined}
              />
              {i < 3 && <span className="settings-ip-dot">.</span>}
            </Fragment>
          ))}
        </div>
      </div>
    )
  }
  return (
    <p
      {...(selectableTextProps ?? {})}
      className={`settings-body-copy${selectableTextProps ? ' selectable' : ''}`}
    >
      {renderSettingsText(item)}
    </p>
  )
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
  const contentRef = useRef(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    setControlState(initialControlState)
  }, [initialControlState])

  const updateScrollIndicator = useCallback(() => {
    const node = contentRef.current
    if (!node) {
      setCanScrollDown(false)
      return
    }
    const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight)
    setCanScrollDown(node.scrollTop < maxScrollTop - 1)
  }, [])

  useEffect(() => {
    const node = contentRef.current
    if (!node) return undefined
    updateScrollIndicator()
    const frame = window.requestAnimationFrame(updateScrollIndicator)
    node.addEventListener('scroll', updateScrollIndicator)
    window.addEventListener('resize', updateScrollIndicator)
    window.addEventListener('msntv-selection-change', updateScrollIndicator)
    return () => {
      window.cancelAnimationFrame(frame)
      node.removeEventListener('scroll', updateScrollIndicator)
      window.removeEventListener('resize', updateScrollIndicator)
      window.removeEventListener('msntv-selection-change', updateScrollIndicator)
    }
  }, [page, updateScrollIndicator])

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

  const firstActionId = page.actions[0]?.id ? `settings-action-${page.actions[0].id}` : undefined
  const lastActionId = page.actions.length > 0
    ? `settings-action-${page.actions[page.actions.length - 1].id}`
    : undefined

  const isItemSelectable = (item) => (
    item.type === 'radio'
    || item.type === 'radioRow'
    || item.type === 'checkbox'
    || item.type === 'link'
    || item.type === 'arrowGrid'
    || item.type === 'inputRow'
    || item.type === 'ipAddress'
    || item.selectable === true
  )

  const firstSelectableBodyIndex = useMemo(() => {
    if (!page.body) return -1
    return page.body.findIndex(isItemSelectable)
  }, [page.body])

  const lastSelectableBodyIndex = useMemo(() => {
    if (!page.body) return -1
    for (let i = page.body.length - 1; i >= 0; i -= 1) {
      if (isItemSelectable(page.body[i])) return i
    }
    return -1
  }, [page.body])

  const isFullVariant = page.variant === 'full'

  const actionsAside = (
    <aside className="settings-page-actions">
      {page.actions.map((action, index) => {
        const prevAction = page.actions[index - 1]
        const nextAction = page.actions[index + 1]
        const defaults = isFullVariant
          ? {
              selectLeft: prevAction ? `settings-action-${prevAction.id}` : undefined,
              selectRight: nextAction ? `settings-action-${nextAction.id}` : undefined,
            }
          : {
              selectUp: prevAction ? `settings-action-${prevAction.id}` : undefined,
              selectDown: nextAction ? `settings-action-${nextAction.id}` : undefined,
            }
        const navAttrs = applyNavAttrs({}, { ...defaults, ...action })
        return (
          <button
            key={action.id}
            type="button"
            className={`settings-action selectable${action.alignBottom ? ' settings-action-bottom' : ''}`}
            data-select-id={`settings-action-${action.id}`}
            data-select-x={isFullVariant ? index : 1}
            data-select-height={isFullVariant ? 999 : index}
            data-select-layer="0"
            data-action-noop={action.action === 'noop' ? 'true' : undefined}
            {...navAttrs}
            onClick={() => handleAction(action)}
          >
            {action.label}
          </button>
        )
      })}
    </aside>
  )

  return (
    <div className={`settings-page-shell${page.variant ? ` settings-page-${page.variant}` : ''}`}>
      <header className="settings-page-header">
        <span>{page.headerTitle}</span>
        {page.headerSubtitle && <span>{page.headerSubtitle}</span>}
      </header>

      <main className="settings-page-main">
        <section className="settings-page-content" ref={contentRef} data-selection-scroll>
          {page.items ? (
            <div className="settings-list">
              {page.items.map((item, listIndex) => (
                <div
                  key={item.title}
                  className="settings-list-item"
                >
                  <button
                    type="button"
                    className="settings-list-title settings-list-title-button selectable"
                    data-select-id={`settings-list-item-${listIndex}`}
                    data-select-x="0"
                    data-select-height={nextRow()}
                    data-select-layer="0"
                    data-select-right={firstActionId}
                    data-select-up={listIndex === 0 ? lastActionId : undefined}
                    onClick={() => onNavigate(item.targetPage)}
                  >
                    {item.title}
                  </button>
                  <span className="settings-list-description">{item.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`settings-body${page.sideImage ? ' settings-body-with-side' : ''}`}>
              <div>
                {page.body?.map((item, index) => {
                  const isSelectable = (
                    item.type === 'radio'
                    || item.type === 'radioRow'
                    || item.type === 'checkbox'
                    || item.type === 'link'
                    || item.type === 'arrowGrid'
                    || item.type === 'inputRow'
                    || item.type === 'ipAddress'
                    || item.selectable === true
                  )
                  let assignedRow = null
                  if (isSelectable) {
                    assignedRow = rowIndex
                    if (item.type === 'radioRow') {
                      rowIndex += item.options.length
                    } else if (item.type === 'arrowGrid') {
                      rowIndex += 3
                    } else {
                      rowIndex += 1
                    }
                  }
                  return (
                    <SettingsControl
                      key={`${item.type}-${index}-${item.text ?? item.label ?? ''}`}
                      item={item}
                      itemKey={item.type === 'radioRow' ? `row-${index}` : index}
                      row={assignedRow}
                      checked={
                        item.type === 'radio'
                          ? controlState.radios[controlState.radioGroups[index] ?? 'default'] === index
                          : controlState.checkboxes[index]
                      }
                      selectedOption={controlState.radios[`row-${index}`]}
                      onNavigate={onNavigate}
                      onRadio={handleRadio}
                      onCheckbox={handleCheckbox}
                      rightTargetId={firstActionId}
                      upTargetId={index === firstSelectableBodyIndex ? lastActionId : undefined}
                      downTargetId={index === lastSelectableBodyIndex ? firstActionId : undefined}
                    />
                  )
                })}
              </div>
              {page.sideImage && (
                <img
                  className={`settings-body-side-image${page.sideImagePluge ? ' settings-body-side-image-pluge' : ''}`}
                  src={`${BASE}${page.sideImage}`}
                  alt=""
                />
              )}
            </div>
          )}
          {isFullVariant && actionsAside}
        </section>
        <img
          className={`settings-page-scroll-indicator ${canScrollDown ? '' : 'hidden'}`}
          src={`${BASE}images/scrollindicatordown.png`}
          alt=""
        />

        {!isFullVariant && actionsAside}
      </main>
    </div>
  )
}
