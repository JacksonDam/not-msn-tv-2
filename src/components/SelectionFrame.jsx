const BASE = import.meta.env.BASE_URL

const SOURCES = {
  yellow: `${BASE}images/selectionBox.svg`,
  green: `${BASE}images/selectionBoxGreen.svg`,
}

const PIECES = [
  { name: 'top-left', x: 0, y: 0, w: 8, h: 8 },
  { name: 'top', x: 8, y: 0, w: 14, h: 8 },
  { name: 'top-right', x: 22, y: 0, w: 8, h: 8 },
  { name: 'right', x: 22, y: 8, w: 8, h: 14 },
  { name: 'bottom-right', x: 22, y: 22, w: 8, h: 8 },
  { name: 'bottom', x: 8, y: 22, w: 14, h: 8 },
  { name: 'bottom-left', x: 0, y: 22, w: 8, h: 8 },
  { name: 'left', x: 0, y: 8, w: 8, h: 14 },
]

function SelectionFrameTone({ tone, className = '' }) {
  const src = SOURCES[tone]

  return (
    <div className={className}>
      {PIECES.map((piece) => (
        <div
          key={`${tone}-${piece.name}`}
          className={`selection-frame-piece selection-frame-piece-${piece.name}`}
        >
          <svg
            className="selection-frame-piece-svg"
            viewBox={`${piece.x} ${piece.y} ${piece.w} ${piece.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <image href={src} x="0" y="0" width="30" height="30" />
          </svg>
        </div>
      ))}
    </div>
  )
}

export default function SelectionFrame({ flashable = false }) {
  return (
    <div className={`selection-frame${flashable ? ' selection-frame-flashable' : ''}`} aria-hidden="true">
      <SelectionFrameTone tone="yellow" className="selection-frame-tone selection-frame-tone-yellow" />
      {flashable && (
        <SelectionFrameTone tone="green" className="selection-frame-tone selection-frame-tone-green" />
      )}
    </div>
  )
}
