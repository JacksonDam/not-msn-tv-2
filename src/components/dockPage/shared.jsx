const BASE = import.meta.env.BASE_URL

const noop = () => {}

function normalizeItem(item) {
  return typeof item === 'string' ? { label: item } : item
}

function SelectableRow({ row, children, onClick = noop, className = '', x = 0, layer = 0, ...props }) {
  return (
    <button
      type="button"
      className={('dock-page-row selectable ' + className).trim()}
      data-select-x={x}
      data-select-height={row}
      data-select-layer={layer}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

function StaticRow({ children, className = '' }) {
  return <div className={('dock-page-row ' + className).trim()}>{children}</div>
}

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

function ScrollIndicator({ direction, visible }) {
  return (
    <img
      className={('dock-page-scroll-indicator dock-page-scroll-indicator-' + direction + ' ' + (visible ? '' : 'hidden')).trim()}
      src={BASE + 'images/scrollindicatordown.png'}
      alt=""
    />
  )
}

function UsingMainModuleIcon({ icon }) {
  const iconFile = {
    tips: 'usingmsntv-tips.png',
    things: 'usingmsntv-ttt.png',
    newsletter: 'usingmsntv-newsletter.png',
  }[icon]

  if (!iconFile) return null

  return (
    <img
      className="dock-page-using-main-icon-image"
      src={BASE + 'images/pages/' + iconFile}
      alt=""
    />
  )
}

export {
  BASE,
  noop,
  normalizeItem,
  SelectableRow,
  StaticRow,
  assignRef,
  ScrollIndicator,
  UsingMainModuleIcon,
}
