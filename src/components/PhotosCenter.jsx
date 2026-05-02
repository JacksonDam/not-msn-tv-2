import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DockCarousel from './DockCarousel'

const BASE = import.meta.env.BASE_URL
const PHOTO_ASSET = `${BASE}images/pages/photo/`
const MEDIA_ASSET = `${BASE}images/pages/media/`
export const PHOTOS_NAV_ROW = 0

const PHOTO_NAV_ITEMS = [
  { id: 'devices', label: 'Devices (0)' },
  { id: 'pcs', label: 'PCs (0)' },
  { id: 'mail', label: 'Photos in Mail' },
  { id: 'albums', label: 'Albums' },
]

const PC_ITEMS = [
  { id: 'arda', label: 'JACKSON-PC: jackson:' },
  { id: 'guest', label: 'JACKSON-PC: Guest:' },
]

const PC_ROOT_ITEMS = ['Music', 'Pictures', 'Playlists', 'Videos']
const PICTURE_CATEGORY_ITEMS = [
  'Albums',
  'All Pictures',
  'Folders',
  'Keywords',
  'Picture Playlists',
  'Pictures Date Taken',
  'Rating',
]
const VIEW_BY_ITEMS = ['All Pictures', 'Pictures Date Taken', 'Albums', 'Keywords', 'Rating', 'Picture Playlists', 'Folders']
const PHOTO_GRID_SIZE_CLASSES = ['small', 'medium', 'large']
const PHOTO_LOADING_SMALL = `${PHOTO_ASSET}PhotoLoadingImageSmall.jpg`
const VIEWER_READY_TEXT = 'Please wait while we get the viewer ready.'

const SAMPLE_PHOTOS = [
  { id: '01', title: 'Hydrangea bloom', date: '24 Mar, 2008', src: `${PHOTO_ASSET}sample/3416995839_9624feb2d0_b.jpg` },
  { id: '02', title: 'Orange dahlia', date: '14 Mar, 2008', src: `${PHOTO_ASSET}sample/3417801308_0a1104d840_b.jpg` },
  { id: '03', title: 'Monument Valley', date: '14 Mar, 2008', src: `${PHOTO_ASSET}sample/3417802188_201981a6ec_b.jpg` },
  { id: '04', title: 'King penguins', date: '18 Feb, 2008', src: `${PHOTO_ASSET}sample/3416998869_f68bc9df34_b.jpg` },
  { id: '05', title: 'Yellow tulips', date: '18 Feb, 2008', src: `${PHOTO_ASSET}sample/3417000415_cde41c5b65_b.jpg` },
  { id: '06', title: 'Koala', date: '14 Feb, 2008', src: `${PHOTO_ASSET}sample/3417804404_2279da5b66_b.jpg` },
  { id: '07', title: 'Lighthouse', date: '14 Feb, 2008', src: `${PHOTO_ASSET}sample/3416998011_c0361ce51c_b.jpg` },
  { id: '08', title: 'Jellyfish', date: '9 Feb, 2008', src: `${PHOTO_ASSET}sample/3416996653_3af1c5b90c_b.jpg` },
]

const PHOTO_DATES = ['24 Mar, 2008', '14 Mar, 2008', '18 Feb, 2008', '14 Feb, 2008', '9 Feb, 2008']
const PHOTO_GROUPS = SAMPLE_PHOTOS.reduce((groups, photo) => {
  const currentGroup = groups[groups.length - 1]
  if (currentGroup?.date === photo.date) {
    currentGroup.photos.push(photo)
  } else {
    groups.push({ date: photo.date, photos: [photo] })
  }
  return groups
}, [])

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

function routeKey(route) {
  if (!route) return 'home'
  return [
    route.name,
    route.folder,
    route.album,
    route.source,
  ].filter(Boolean).join(':')
}

function isSelectedAll(selectedIds) {
  return SAMPLE_PHOTOS.every((photo) => selectedIds.has(photo.id))
}

function PathTitle({ children }) {
  return (
    <div className="photos-path-title">
      You are in <strong>{children}</strong>
    </div>
  )
}

function SettingsRadio({ checked }) {
  return (
    <img
      src={`${BASE}images/pages/settings/${checked ? 'RadioButtonMarkedCustom.png' : 'RadioButtonUnmarkedCustom.png'}`}
      alt=""
    />
  )
}

function AlbumSlideshow({ photos }) {
  const items = photos.length > 0 ? photos : SAMPLE_PHOTOS
  const [index, setIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(null)
  const [hasAdvanced, setHasAdvanced] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setPreviousIndex(index)
      setHasAdvanced(true)
      setIndex((current) => (current + 1) % items.length)
    }, 1800)
    return () => clearInterval(id)
  }, [index, items.length])

  const previousPhoto = previousIndex === null ? null : items[previousIndex % items.length]
  const activePhoto = items[index % items.length]

  return (
    <span className="photos-album-icon-wrap" aria-hidden="true">
      {previousPhoto && <img key={`previous-${previousPhoto.id}`} className="photos-album-slide is-previous" src={previousPhoto.src} alt="" />}
      <img
        key={`current-${activePhoto.id}`}
        className={`photos-album-slide ${hasAdvanced ? 'is-current' : 'is-current-initial'}`}
        src={activePhoto.src}
        alt=""
      />
    </span>
  )
}

function Header({ title, showSettings = false }) {
  return (
    <header className="photos-header">
      <h1 className="photos-header-title">
        <span>Photos</span>
        <span>{title}</span>
      </h1>
      <div className="photos-header-actions">
        {showSettings && (
          <button
            type="button"
            className="photos-header-action selectable"
            data-select-x="2"
            data-select-height="-1"
            data-select-layer="0"
          >
            Settings
          </button>
        )}
        <button
          type="button"
          className="photos-header-action photos-header-help selectable"
          data-select-id="photos-help"
          data-select-x="3"
          data-select-height="-1"
          data-select-layer="0"
        >
          Help
          <img src={`${BASE}images/helpicon.png`} alt="" />
        </button>
      </div>
    </header>
  )
}

function SideButton({ row, children, onClick, className = '', x = 3 }) {
  return (
    <button
      type="button"
      className={`photos-side-button selectable ${className}`.trim()}
      data-select-x={x}
      data-select-height={row}
      data-select-layer="0"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ListRow({ row, children, onClick, className = '', x = 0, id = null }) {
  return (
    <button
      type="button"
      className={`photos-list-row selectable ${className}`.trim()}
      data-select-id={id || undefined}
      data-select-x={x}
      data-select-height={row}
      data-select-layer="0"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function PhotoCheckbox({ checked }) {
  return (
    <img
      className="photos-check-icon"
      src={`${PHOTO_ASSET}${checked ? 'CheckBox_UnSelectAll.png' : 'CheckBox_SelectAll.png'}`}
      alt=""
    />
  )
}

function SaveProgressPanel({ progress, onCancel }) {
  if (!progress.active) return null

  return (
    <div className="photos-save-progress-panel panel-container open-no-anim flex">
      <img className="panel-bg" src={`${BASE}images/signinpanelbg.png`} alt="" />
      <div className="absolute flex flex-wrap">
        <div className="shrink">
          <h3 className="panel-title-white">{progress.text}</h3>
          <div className="text-gap"></div>
        </div>
        <div className="grow flex items-start">
          <div className="base-other">
            <img
              className="progress-bar-fill"
              src={`${BASE}images/barfill.png`}
              alt=""
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <button
            type="button"
            className="base-btn photos-save-progress-cancel selectable ml-2"
            data-select-id="photos-progress-cancel"
            data-select-x="0"
            data-select-height="0"
            data-select-layer="1"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function SimpleDialog({ dialogRef, title, icon = 'warning', children, actions, showing }) {
  return (
    <div className="photos-dialog-scrim">
      <div ref={dialogRef} className="photos-dialog">
        <div className={`photos-dialog-icon photos-dialog-icon-${icon} ${showing ? 'showing' : ''}`}>
          {icon === 'info'
            ? <img src={`${PHOTO_ASSET}Icon_Info_ErrorPanels.png`} alt="" />
            : <img src={`${BASE}images/warning.png`} alt="" />}
        </div>
        <div className="photos-dialog-body">
          <div className={`photos-dialog-copy ${showing ? 'showing' : ''}`}>
            {title && <h2>{title}</h2>}
            <div>{children}</div>
          </div>
        </div>
        <div className={`photos-dialog-actions ${showing ? 'showing' : ''}`}>
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              className="photos-dialog-button base-btn selectable"
              data-select-x={index}
              data-select-height="0"
              data-select-layer="0"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PhotosCenter({
  pageRef,
  subPageBackRef,
  selection,
  audio,
  navPos = 1,
  navViewStart = 0,
  navPixelOffset = 0,
  navSlidingFromPos = null,
  onNavSlideEnd,
}) {
  const rootRef = useRef(null)
  const dialogRef = useRef(null)
  const routeRef = useRef({ name: 'home' })
  const routeStackRef = useRef([])
  const saveTimersRef = useRef([])
  const readyTimersRef = useRef([])
  const slideshowTimersRef = useRef([])
  const slideshowControlsTimerRef = useRef(null)
  const slideshowAutoTimerRef = useRef(null)
  const [route, setRoute] = useState({ name: 'home' })
  const [routeStack, setRouteStack] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [rotations, setRotations] = useState({})
  const [photoGridSizeIndex, setPhotoGridSizeIndex] = useState(1)
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const [slideshowPreviousIndex, setSlideshowPreviousIndex] = useState(null)
  const [slideshowInitialFade, setSlideshowInitialFade] = useState(false)
  const [slideshowPlaying, setSlideshowPlaying] = useState(true)
  const [slideshowControlsVisible, setSlideshowControlsVisible] = useState(true)
  const [slideshowStatusOverride, setSlideshowStatusOverride] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [dialogShowing, setDialogShowing] = useState(false)
  const [saveProgress, setSaveProgress] = useState({ active: false, text: '', percent: 0 })
  const [viewerImagesReady, setViewerImagesReady] = useState(true)
  const [contentReveal, setContentReveal] = useState({ main: true, side: true })
  const [saveTarget, setSaveTarget] = useState('existing')
  const [saveAlbumName, setSaveAlbumName] = useState('')
  const [lastSavedAlbum, setLastSavedAlbum] = useState('engagement party')
  const [lastSavedCount, setLastSavedCount] = useState(0)

  const selectedPhotos = useMemo(() => {
    const photos = SAMPLE_PHOTOS.filter((photo) => selectedIds.has(photo.id))
    return photos.length > 0 ? photos : SAMPLE_PHOTOS
  }, [selectedIds])

  const selectedCount = selectedIds.size
  const allSelected = isSelectedAll(selectedIds)

  const setRootRef = useCallback((node) => {
    rootRef.current = node
    assignRef(pageRef, node)
  }, [pageRef])

  const clearSaveTimers = useCallback(() => {
    saveTimersRef.current.forEach((id) => window.clearTimeout(id))
    saveTimersRef.current = []
  }, [])

  const clearReadyTimers = useCallback(() => {
    readyTimersRef.current.forEach((id) => window.clearTimeout(id))
    readyTimersRef.current = []
  }, [])

  const clearSlideshowTimers = useCallback(() => {
    slideshowTimersRef.current.forEach((id) => window.clearTimeout(id))
    slideshowTimersRef.current = []
    window.clearTimeout(slideshowControlsTimerRef.current)
    slideshowControlsTimerRef.current = null
    window.clearTimeout(slideshowAutoTimerRef.current)
    slideshowAutoTimerRef.current = null
  }, [])

  const cancelProgress = useCallback(() => {
    clearSaveTimers()
    clearReadyTimers()
    setSaveProgress({ active: false, text: '', percent: 0 })
    setViewerImagesReady(true)
    setContentReveal({ main: true, side: true })
    selection?.goToLayer?.(0)
    selection?.updateFocusBox?.()
  }, [clearReadyTimers, clearSaveTimers, selection])

  const goRoute = useCallback((nextRoute, { replace = false } = {}) => {
    const normalized = typeof nextRoute === 'string' ? { name: nextRoute } : nextRoute
    if (!replace) {
      const nextStack = [...routeStackRef.current, routeRef.current]
      routeStackRef.current = nextStack
      setRouteStack(nextStack)
    }
    routeRef.current = normalized
    setRoute(normalized)
  }, [])

  const revealStagedContent = useCallback(() => {
    setContentReveal({ main: false, side: false })
    const timers = [
      window.setTimeout(() => {
        setContentReveal((current) => ({ ...current, main: true }))
        selection?.updateFocusBox?.()
      }, 100),
      window.setTimeout(() => {
        setContentReveal((current) => ({ ...current, side: true }))
        selection?.updateFocusBox?.()
      }, 200),
    ]
    readyTimersRef.current.push(...timers)
  }, [selection])

  const showViewerReadyBanner = useCallback((onReady, { viewer = false, staged = false } = {}) => {
    clearReadyTimers()
    setSaveProgress({ active: true, text: VIEWER_READY_TEXT, percent: 10 })
    const timers = [
      window.setTimeout(() => {
        setSaveProgress({ active: true, text: VIEWER_READY_TEXT, percent: 90 })
      }, 300),
      window.setTimeout(() => {
        setSaveProgress({ active: false, text: '', percent: 0 })
        onReady()
        if (viewer) {
          setViewerImagesReady(false)
          readyTimersRef.current.push(window.setTimeout(() => {
            setViewerImagesReady(true)
            selection?.updateFocusBox?.()
          }, 200))
        }
        if (staged) {
          revealStagedContent()
        } else {
          setContentReveal({ main: true, side: true })
        }
      }, 600),
    ]
    readyTimersRef.current = timers
  }, [clearReadyTimers, revealStagedContent, selection])

  const goDirectory = useCallback((nextRoute, options = {}) => {
    showViewerReadyBanner(() => goRoute(nextRoute, options), { staged: true })
  }, [goRoute, showViewerReadyBanner])

  const goHome = useCallback(() => {
    routeStackRef.current = []
    setRouteStack([])
    routeRef.current = { name: 'home' }
    setRoute({ name: 'home' })
    setDialog(null)
    setDialogShowing(false)
    clearSaveTimers()
    clearReadyTimers()
    clearSlideshowTimers()
    setSaveProgress({ active: false, text: '', percent: 0 })
    setContentReveal({ main: true, side: true })
    setViewerImagesReady(true)
  }, [clearReadyTimers, clearSaveTimers, clearSlideshowTimers])

  const openDialog = useCallback((nextDialog, { playError = false } = {}) => {
    if (playError) {
      audio?.play?.('error')
    }
    setDialog(nextDialog)
    setDialogShowing(false)
    window.setTimeout(() => setDialogShowing(true), 45)
  }, [audio])

  const goBack = useCallback((options = {}) => {
    const { closeDialog = true } = options
    if (closeDialog && dialog) {
      setDialog(null)
      setDialogShowing(false)
      return true
    }

    const stack = routeStackRef.current
    if (stack.length === 0) return false

    const nextRoute = stack[stack.length - 1]
    const nextStack = stack.slice(0, -1)
    routeStackRef.current = nextStack
    setRouteStack(nextStack)
    routeRef.current = nextRoute
    setRoute(nextRoute)
    return true
  }, [dialog])

  useEffect(() => {
    routeRef.current = route
  }, [route])

  useEffect(() => () => {
    clearSaveTimers()
    clearReadyTimers()
    clearSlideshowTimers()
  }, [clearReadyTimers, clearSaveTimers, clearSlideshowTimers])

  useEffect(() => {
    routeStackRef.current = routeStack
  }, [routeStack])

  useEffect(() => {
    if (!subPageBackRef) return undefined
    const handler = () => goBack()
    subPageBackRef.current = handler
    return () => {
      if (subPageBackRef.current === handler) {
        subPageBackRef.current = null
      }
    }
  }, [goBack, subPageBackRef])

  useEffect(() => {
    if (!selection) return undefined
    const frame = window.requestAnimationFrame(() => {
      const selectionRoot = dialog ? dialogRef.current : rootRef.current
      if (!selectionRoot) return
      selection.initSelectables(selectionRoot)
      if (saveProgress.active) {
        selection.goToLayer(1)
        selection.unHideFocusBox()
        return
      }
      if (!dialog && route.name === 'home') {
        selection.goToSpecific(0, PHOTOS_NAV_ROW, 0)
      }
      if (!dialog && route.name === 'viewer') {
        selection.goToSpecific(0, 0, 0)
      }
      selection.unHideFocusBox()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [dialog, route.name, route.folder, route.source, route.album, saveProgress.active, selection])

  const togglePhoto = useCallback((photoId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => (
      isSelectedAll(current)
        ? new Set()
        : new Set(SAMPLE_PHOTOS.map((photo) => photo.id))
    ))
  }, [])

  const rotateSelected = useCallback((amount) => {
    const targetIds = selectedIds.size > 0
      ? Array.from(selectedIds)
      : SAMPLE_PHOTOS.map((photo) => photo.id)
    setRotations((current) => {
      const next = { ...current }
      targetIds.forEach((id) => {
        next[id] = ((next[id] || 0) + amount + 360) % 360
      })
      return next
    })
  }, [selectedIds])

  const stepPhotoGridSize = useCallback((amount) => {
    setPhotoGridSizeIndex((current) => {
      const next = current + amount
      return Math.max(0, Math.min(PHOTO_GRID_SIZE_CLASSES.length - 1, next))
    })
  }, [])

  const advanceSlideshow = useCallback((amount = 1, { fade = true } = {}) => {
    window.clearTimeout(slideshowAutoTimerRef.current)
    setSlideshowInitialFade(false)
    setSlideshowPreviousIndex(fade ? slideshowIndex : null)
    setSlideshowIndex((current) => (current + amount + selectedPhotos.length) % selectedPhotos.length)
    if (fade) {
      slideshowTimersRef.current.push(window.setTimeout(() => {
        setSlideshowPreviousIndex(null)
      }, 2000))
    }
  }, [selectedPhotos.length, slideshowIndex])

  const scheduleSlideshowControlsHide = useCallback(() => {
    window.clearTimeout(slideshowControlsTimerRef.current)
    slideshowControlsTimerRef.current = window.setTimeout(() => {
      setSlideshowControlsVisible(false)
      selection?.hideFocusBox?.()
    }, 3000)
  }, [selection])

  const revealSlideshowControls = useCallback(() => {
    setSlideshowControlsVisible(true)
    window.requestAnimationFrame(() => {
      selection?.unHideFocusBox?.()
      selection?.updateFocusBox?.()
    })
    scheduleSlideshowControlsHide()
  }, [scheduleSlideshowControlsHide, selection])

  const openViewer = useCallback((source = 'sample') => {
    showViewerReadyBanner(() => {
      setSelectedIds(new Set())
      goRoute({ name: 'viewer', source })
    }, { viewer: true })
  }, [goRoute, showViewerReadyBanner])

  const openSlideshow = useCallback(() => {
    if (selectedPhotos.length === 0) return
    selection?.holdGreen?.()
    clearReadyTimers()
    readyTimersRef.current = [window.setTimeout(() => {
      selection?.releaseGreen?.()
      setSlideshowIndex(0)
      setSlideshowPreviousIndex(null)
      setSlideshowInitialFade(true)
      setSlideshowPlaying(true)
      setSlideshowControlsVisible(true)
      setSlideshowStatusOverride(null)
      goRoute({ name: 'slideshow' })
    }, 1000)]
  }, [clearReadyTimers, goRoute, selectedPhotos.length, selection])

  const handleSlideshowNext = useCallback(() => {
    setSlideshowStatusOverride('Reading:')
    slideshowTimersRef.current.push(window.setTimeout(() => {
      setSlideshowStatusOverride(null)
      advanceSlideshow(1, { fade: false })
    }, 500))
  }, [advanceSlideshow])

  const handleSlideshowDone = useCallback(() => {
    setSlideshowPlaying(false)
    showViewerReadyBanner(() => {
      goBack({ closeDialog: false })
    }, { viewer: true })
  }, [goBack, showViewerReadyBanner])

  useEffect(() => {
    if (route.name !== 'slideshow') return undefined
    setSlideshowControlsVisible(true)
    selection?.unHideFocusBox?.()
    slideshowTimersRef.current.push(window.setTimeout(() => {
      setSlideshowInitialFade(false)
    }, 1000))
    scheduleSlideshowControlsHide()
    return () => {
      clearSlideshowTimers()
      selection?.unHideFocusBox?.()
    }
  }, [clearSlideshowTimers, route.name, scheduleSlideshowControlsHide, selection])

  useEffect(() => {
    if (route.name !== 'slideshow' || !slideshowPlaying) return undefined
    window.clearTimeout(slideshowAutoTimerRef.current)
    slideshowAutoTimerRef.current = window.setTimeout(() => {
      advanceSlideshow(1)
    }, 5000)
    return () => {
      window.clearTimeout(slideshowAutoTimerRef.current)
      slideshowAutoTimerRef.current = null
    }
  }, [advanceSlideshow, route.name, slideshowIndex, slideshowPlaying])

  useEffect(() => {
    if (route.name !== 'slideshow') return undefined
    const handleInput = () => {
      revealSlideshowControls()
    }
    window.addEventListener('keydown', handleInput, true)
    window.addEventListener('pointerdown', handleInput, true)
    return () => {
      window.removeEventListener('keydown', handleInput, true)
      window.removeEventListener('pointerdown', handleInput, true)
    }
  }, [revealSlideshowControls, route.name])

  const handleSendPhotos = useCallback(() => {
    if (selectedCount === 0) {
      openDialog('noSelection', { playError: true })
      return
    }
    openDialog('quality', { playError: true })
  }, [openDialog, selectedCount])

  const continueSave = useCallback(() => {
    clearSaveTimers()
    const albumName = saveTarget === 'new'
      ? (saveAlbumName.trim() || 'New album')
      : 'engagement party'
    const count = selectedCount > 0 ? selectedCount : SAMPLE_PHOTOS.length
    setLastSavedAlbum(albumName)
    setLastSavedCount(count)
    setSaveProgress({ active: true, text: 'Saving Photos, please wait...', percent: 0 })

    const timers = []
    timers.push(window.setTimeout(() => {
      for (let i = 1; i <= count; i += 1) {
        timers.push(window.setTimeout(() => {
          setSaveProgress({
            active: true,
            text: `Saving photo ${i} of ${count} ...`,
            percent: Math.round((i / count) * 100),
          })
        }, i * 120))
      }

      timers.push(window.setTimeout(() => {
        setSaveProgress({ active: false, text: '', percent: 0 })
        audio?.play?.('taskComplete')
        openDialog('saved')
      }, count * 120 + 220))
    }, 200))
    saveTimersRef.current = timers
  }, [audio, clearSaveTimers, openDialog, saveAlbumName, saveTarget, selectedCount])

  const mainRevealClass = contentReveal.main ? '' : ' photos-content-hidden'
  const sideRevealClass = contentReveal.side ? '' : ' photos-content-hidden'

  const renderHome = () => (
    <>
      <Header title="Home" />
      <main className="photos-home-main">
        <div className="photos-home-grid" aria-label="Recent photos">
          <div className="photos-home-tile photos-home-photo">
            <img src={`${PHOTO_ASSET}PhotosHomeBirthdayParty.jpg`} alt="" />
          </div>
          <div className="photos-home-tile photos-home-label">Birthday<br />party</div>
          <p className="photos-home-copy photos-home-copy-light">
            As you look at photos, this page will begin to fill in.
          </p>
          <div className="photos-home-tile photos-home-label">Baby</div>
          <div className="photos-home-tile photos-home-photo">
            <img src={`${PHOTO_ASSET}PhotosHomeBaby.jpg`} alt="" />
          </div>
          <p className="photos-home-copy photos-home-copy-dark">
            Even if your photos are stored on a PC, you can show them on your TV!
            <button
              type="button"
              className="photos-home-network-link selectable"
              data-select-id="photos-home-network"
              data-select-x="2"
              data-select-height="1"
              data-select-layer="0"
              data-select-up="photos-help"
              data-select-down="photos-nav-current"
            >
              Set up my home network
            </button>
          </p>
        </div>
      </main>
      <nav className="photos-home-nav" data-dock-carousel-area="photos-nav" aria-label="Photos">
        <img className="photos-home-nav-arrow" src={`${BASE}images/dock/dock_left.gif`} alt="" />
        <DockCarousel
          items={PHOTO_NAV_ITEMS}
          pos={navPos}
          viewStart={navViewStart}
          pixelOffset={navPixelOffset}
          slidingFromPos={navSlidingFromPos}
          onSlideEnd={onNavSlideEnd}
          onActivate={(item) => {
            if (item.id === 'devices') goRoute('devices')
            if (item.id === 'pcs') goRoute('pcs')
            if (item.id === 'mail') openViewer('mail')
            if (item.id === 'albums') goRoute('albums')
          }}
          row={PHOTOS_NAV_ROW}
          x={1}
          visibleCount={4}
          itemsClassName="photos-home-nav-items dock-items"
          sliderClassName="photos-home-nav-slider dock-slider"
          slotClassName="photos-home-nav-slot dock-item-slot"
          slideSelectionClassName="photos-home-nav-slide-selection dock-slide-selection"
          selectedProps={{
            'data-select-id': 'photos-nav-current',
            'data-select-up': 'photos-home-network',
          }}
          renderItem={(item) => (
            <span className="photos-home-nav-item">{item.label}</span>
          )}
        />
        <img className="photos-home-nav-arrow" src={`${BASE}images/dock/dock_right.gif`} alt="" />
      </nav>
    </>
  )

  const renderDevices = () => (
    <>
      <Header title="Devices" showSettings />
      <div className="photos-two-pane">
        <section className="photos-device-panel">
          <p className="photos-device-description">No memory cards or USB photo devices were found.</p>
          <div className="photos-learn-row">
            <img src={`${PHOTO_ASSET}PhotoMemoryCard.png`} alt="" />
            <span>Connect a camera, memory card, or USB storage device to browse photos.</span>
          </div>
        </section>
        <aside className="photos-sidebar">
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderPcList = () => (
    <>
      <Header title="PCs" showSettings />
      <section className="photos-pc-panel">
        <div className="photos-pc-heading">
          <img src={`${PHOTO_ASSET}Icon_DMRPC.png`} alt="" />
          <span>JACKSON-PC: Guest:</span>
        </div>
        <div className="photos-pc-list">
          {PC_ITEMS.map((item, index) => (
            <ListRow
              key={item.id}
              row={index}
              id={item.id === 'arda' ? 'photos-pc-arda' : null}
              onClick={() => goDirectory({ name: 'pcRoot', pc: item.id })}
            >
              {item.label}
            </ListRow>
          ))}
        </div>
      </section>
    </>
  )

  const renderPcRoot = () => (
    <>
      <Header title="JACKSON-PC: jackson:" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          {PC_ROOT_ITEMS.map((item, index) => (
            <ListRow
              key={item}
              row={index}
              onClick={() => {
                if (item === 'Pictures') goDirectory('pictureCategories')
              }}
            >
              {item}
            </ListRow>
          ))}
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderPictureCategories = () => (
    <>
      <Header title="JACKSON-PC: jackson:" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          <PathTitle>Pictures</PathTitle>
          {PICTURE_CATEGORY_ITEMS.map((item, index) => (
            <ListRow
              key={item}
              row={index}
              onClick={() => {
                if (item === 'Folders') goDirectory('folders')
                if (item === 'All Pictures') openViewer('all')
                if (item === 'Albums') goDirectory('albums')
              }}
            >
              {item}
            </ListRow>
          ))}
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderFolders = () => (
    <>
      <Header title="JACKSON-PC: jackson:" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          <div className="photos-path-title">View Photos by:</div>
          <div className="photos-view-by-list">
            {VIEW_BY_ITEMS.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`photos-view-by-item selectable ${item === 'Folders' ? 'is-current' : ''}`}
                data-select-x={index % 4}
                data-select-height={index < 4 ? 0 : 1}
                data-select-layer="0"
                onClick={() => {
                  if (item !== 'Folders') openViewer(item.toLowerCase().replace(/\s+/g, '-'))
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <ListRow row={2} className="photos-folder-root-row" onClick={() => {}}>C:</ListRow>
          <ListRow row={3} onClick={() => goDirectory({ name: 'folder', folder: 'Pictures' })}>Pictures</ListRow>
          <ListRow row={4} onClick={() => goDirectory({ name: 'shared' })}>Shared Pictures</ListRow>
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderShared = () => (
    <>
      <Header title="JACKSON-PC: jackson:" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          <PathTitle>Shared Pictures</PathTitle>
          <ListRow row={0} className="photos-shared-row" onClick={() => openViewer('sample')}>
            Sample Pictures
          </ListRow>
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderFolder = () => (
    <>
      <Header title="JACKSON-PC: jackson:" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          <PathTitle>{route.folder || 'Pictures'}</PathTitle>
          <ListRow row={0} className="photos-shared-row" onClick={() => openViewer('sample')}>
            Sample Pictures
          </ListRow>
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderAlbums = () => (
    <>
      <Header title="Albums" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel photos-album-panel${mainRevealClass}`}>
          <p className="photos-album-intro">
            Photos are saved to your Player inside albums. Choose the album name to view it.
          </p>
          {['engagement party', 'family reunion', 'vacation ideas'].map((album, index) => (
            <ListRow key={album} row={index} className="photos-album-row" onClick={() => goDirectory({ name: 'albumViewer', album })}>
              <img src={`${PHOTO_ASSET}PhotoAlbum.png`} alt="" />
              <span>{album}</span>
            </ListRow>
          ))}
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={() => {}}>Add Album</SideButton>
          <SideButton row={1} onClick={() => {}}>Rename Albums</SideButton>
          <SideButton row={2} onClick={() => {}}>Delete Albums</SideButton>
          <SideButton row={3} onClick={() => {}}>Screensaver</SideButton>
          <SideButton row={4} onClick={goHome}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderAlbumViewer = () => (
    <>
      <Header title="Albums" />
      <div className="photos-two-pane">
        <section className={`photos-browser-panel${mainRevealClass}`}>
          <PathTitle>{route.album || lastSavedAlbum}</PathTitle>
          <div className="photos-saved-album-grid">
            {selectedPhotos.slice(0, 4).map((photo, index) => (
              <button
                type="button"
                key={photo.id}
                className="photos-saved-album-thumb selectable"
                data-select-x={index}
                data-select-height="0"
                data-select-layer="0"
                onClick={() => openViewer('album')}
              >
                <img src={photo.src} alt="" />
              </button>
            ))}
          </div>
        </section>
        <aside className={`photos-sidebar${sideRevealClass}`}>
          <SideButton row={0} onClick={() => openViewer('album')}>View Slideshow</SideButton>
          <SideButton row={1} onClick={goBack}>Done</SideButton>
        </aside>
      </div>
    </>
  )

  const renderViewer = () => {
    let photoRow = 4

    return (
      <>
        <Header title="JACKSON-PC: jackson:" />
        <div className="photos-two-pane photos-viewer-pane">
          <section className="photos-viewer-main" data-selection-scroll>
            <PathTitle>Sample Pictures</PathTitle>
            <div className="photos-count-row">
              <span>{SAMPLE_PHOTOS.length} photos, {selectedCount} selected</span>
              <div className="photos-select-all">
                <span>Select All</span>
                <button
                  type="button"
                  className="photos-select-all-box selectable"
                  data-select-id="photos-viewer-select-all"
                  data-select-x="2"
                  data-select-height="0"
                  data-select-layer="0"
                  onClick={toggleSelectAll}
                >
                  <PhotoCheckbox checked={allSelected} />
                </button>
              </div>
            </div>
            <div className="photos-section-title">Photos</div>
            <div className={`photos-grid photos-grid-size-${PHOTO_GRID_SIZE_CLASSES[photoGridSizeIndex]}`}>
              {PHOTO_GROUPS.map((group, groupIndex) => {
                const itemRow = photoRow
                photoRow += 1
                return (
                  <div key={group.date} className="photos-date-group">
                    <div className="photos-date-title">{group.date}</div>
                    <div className="photos-date-photo-row">
                      {group.photos.map((photo, photoIndex) => {
                        const checked = selectedIds.has(photo.id)
                        return (
                          <div key={photo.id} className="photos-photo-cell-wrap">
                            <button
                              type="button"
                              className={`photos-photo-cell selectable ${checked ? 'is-selected' : ''}`}
                              data-select-x={photoIndex}
                              data-select-height={itemRow}
                              data-select-layer="0"
                              data-select-up={groupIndex === 0 && photoIndex === 0 ? 'photos-viewer-select-all' : undefined}
                              onClick={() => togglePhoto(photo.id)}
                            >
                              <img
                                className="photos-photo-thumb"
                                src={viewerImagesReady ? photo.src : PHOTO_LOADING_SMALL}
                                alt=""
                                style={{ transform: `rotate(${rotations[photo.id] || 0}deg)` }}
                              />
                              <span className="photos-thumb-checkbox">
                                <PhotoCheckbox checked={checked} />
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          <aside className="photos-sidebar photos-viewer-sidebar">
            <button
              type="button"
              className="photos-date-button selectable"
              data-select-x="3"
              data-select-height="0"
              data-select-layer="0"
            >
              <span className="mail-center-sort-label-inner">{PHOTO_DATES[0]}</span>
              <span className="mail-center-sort-arrow"></span>
            </button>
            <div className="photos-size-row">
              <SideButton row={1} x={3} onClick={() => stepPhotoGridSize(-1)}>-</SideButton>
              <span>Size</span>
              <SideButton row={1} x={4} onClick={() => stepPhotoGridSize(1)}>+</SideButton>
            </div>
            <SideButton row={2} onClick={openSlideshow}>View Slideshow</SideButton>
            <SideButton row={3} onClick={handleSendPhotos}>Send Photos</SideButton>
            <SideButton row={4} onClick={() => openDialog('prints')}>Order Prints</SideButton>
            <SideButton row={5} onClick={() => goRoute('saveAlbum')}>Save Photos</SideButton>
            <div className="photos-rotate-row">
              <SideButton row={6} x={3} onClick={() => rotateSelected(270)}>
                <img src={`${PHOTO_ASSET}Icon_PhotoRotateLeft.png`} alt="" />
              </SideButton>
              <span>Rotate</span>
              <SideButton row={6} x={4} onClick={() => rotateSelected(90)}>
                <img src={`${PHOTO_ASSET}Icon_PhotoRotateRight.png`} alt="" />
              </SideButton>
            </div>
            <SideButton row={7} onClick={goBack}>Done</SideButton>
          </aside>
        </div>
      </>
    )
  }

  const renderSaveAlbum = () => (
    <>
      <Header title="Save Photos to Album" />
      <div className="photos-two-pane photos-save-pane">
        <section className="photos-browser-panel photos-save-main">
          <p>
            Choose the album where you want to save these photos, and then choose <em>Continue</em>.
            To create a new album, type a name for it in the box at the bottom of the page and then
            choose <em>Continue</em>.
          </p>
          <div className="photos-save-divider" />
          <button
            type="button"
            className="photos-save-choice settings-control-feedback selectable"
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            onClick={() => setSaveTarget('existing')}
          >
            <span className="photos-save-radio-control settings-control-feedback">
              <SettingsRadio checked={saveTarget === 'existing'} />
            </span>
            <AlbumSlideshow photos={selectedPhotos} />
            <span>engagement party</span>
          </button>
          <div className="photos-save-new-row">
            <button
              type="button"
              className="photos-save-radio-button settings-control-feedback selectable"
              data-select-x="0"
              data-select-height="1"
              data-select-layer="0"
              onClick={() => setSaveTarget('new')}
            >
              <span className="photos-save-radio-control">
                <SettingsRadio checked={saveTarget === 'new'} />
              </span>
              New album:
            </button>
            <input
              className="photos-save-input selectable"
              type="text"
              value={saveAlbumName}
              maxLength={30}
              data-select-x="1"
              data-select-height="1"
              data-select-layer="0"
              aria-label="New album name"
              onFocus={() => setSaveTarget('new')}
              onChange={(event) => {
                setSaveTarget('new')
                setSaveAlbumName(event.target.value)
              }}
            />
          </div>
        </section>
        <aside className="photos-sidebar photos-save-sidebar">
          <SideButton row={0} onClick={continueSave}>Continue</SideButton>
          <SideButton row={1} onClick={goBack}>Cancel</SideButton>
          <p>Tip: Photos you place in albums are saved at a lower quality that is suitable for viewing on TV.</p>
          <strong>Photo Storage:</strong>
          <span>23 saved</span>
          <span>77 available</span>
        </aside>
      </div>
    </>
  )

  const renderSlideshow = () => {
    const activePhoto = selectedPhotos[slideshowIndex % selectedPhotos.length]
    const previousPhoto = slideshowPreviousIndex === null ? null : selectedPhotos[slideshowPreviousIndex % selectedPhotos.length]
    const activeRotation = rotations[activePhoto.id] || 0
    const previousRotation = previousPhoto ? (rotations[previousPhoto.id] || 0) : 0
    const slideshowStatus = slideshowStatusOverride || (slideshowPlaying ? 'Playing:' : 'Paused:')
    return (
      <div className={`photos-slideshow ${slideshowControlsVisible ? '' : 'is-controls-hidden'}`}>
        <div className="photos-slideshow-stage">
          {previousPhoto && (
            <img
              key={`slideshow-previous-${previousPhoto.id}-${slideshowIndex}`}
              className={`photos-slideshow-photo is-previous ${previousRotation % 180 === 0 ? '' : 'is-rotated-quarter'}`}
              src={previousPhoto.src}
              alt=""
              style={{ '--photo-rotation': `${previousRotation}deg` }}
            />
          )}
          <img
            key={`slideshow-current-${activePhoto.id}-${slideshowIndex}`}
            className={`photos-slideshow-photo is-current ${slideshowInitialFade ? 'is-first' : ''} ${slideshowPreviousIndex === null ? '' : 'is-crossfading'} ${activeRotation % 180 === 0 ? '' : 'is-rotated-quarter'}`}
            src={activePhoto.src}
            alt=""
            style={{ '--photo-rotation': `${activeRotation}deg` }}
          />
        </div>
        <div className="photos-slideshow-controls">
          <button
            type="button"
            className="photos-player-button photos-player-play selectable"
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            onClick={() => setSlideshowPlaying(true)}
          >
            <img src={`${MEDIA_ASSET}PanelPlayerControlPlay.png`} alt="" />
          </button>
          <button
            type="button"
            className="photos-player-button selectable"
            data-select-x="1"
            data-select-height="0"
            data-select-layer="0"
            onClick={() => setSlideshowPlaying(false)}
          >
            <img src={`${MEDIA_ASSET}PanelPlayerControlPause.png`} alt="" />
          </button>
          <button
            type="button"
            className="photos-player-button selectable"
            data-select-x="2"
            data-select-height="0"
            data-select-layer="0"
            onClick={() => advanceSlideshow(-1, { fade: false })}
          >
            <img src={`${MEDIA_ASSET}PanelPlayerControlPrev.png`} alt="" />
          </button>
          <button
            type="button"
            className="photos-player-button selectable"
            data-select-x="3"
            data-select-height="0"
            data-select-layer="0"
            onClick={handleSlideshowNext}
          >
            <img src={`${MEDIA_ASSET}PanelPlayerControlNext.png`} alt="" />
          </button>
          <span className="photos-slideshow-status">{slideshowStatus}</span>
          <span className="photos-slideshow-count">{slideshowIndex + 1} of {selectedPhotos.length} photos</span>
          <button
            type="button"
            className="photos-slideshow-done selectable"
            data-select-x="4"
            data-select-height="0"
            data-select-layer="0"
            onClick={handleSlideshowDone}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  const renderDialog = () => {
    if (dialog === 'quality') {
      return (
        <SimpleDialog
          dialogRef={dialogRef}
          title="Choose photo quality"
          showing={dialogShowing}
          actions={[
            { label: 'Full', onClick: () => openDialog('sent') },
            { label: 'Friendly', onClick: () => openDialog('sent') },
            { label: 'Cancel', onClick: () => { setDialog(null); setDialogShowing(false) } },
          ]}
        >
          <p>Sending photos at full quality can take a long time.</p>
          <p>
            Choose <em>Friendly</em> to send lower quality photos that are e-mail friendly
            (these are smaller files that are good for viewing but not for printing).
            Choose <em>Full</em> if you do not want to change the quality.
          </p>
        </SimpleDialog>
      )
    }

    if (dialog === 'noSelection') {
      return (
        <SimpleDialog
          dialogRef={dialogRef}
          title=""
          showing={dialogShowing}
          actions={[{ label: 'OK', onClick: () => { setDialog(null); setDialogShowing(false) } }]}
        >
          <p>Please choose one or more photos before selecting <strong>Send Photos</strong>.</p>
        </SimpleDialog>
      )
    }

    if (dialog === 'sent') {
      return (
        <SimpleDialog
          dialogRef={dialogRef}
          title="Photos Ready"
          icon="info"
          showing={dialogShowing}
          actions={[{ label: 'Done', onClick: () => { setDialog(null); setDialogShowing(false) } }]}
        >
          <p>{selectedCount || 1} photo{(selectedCount || 1) === 1 ? '' : 's'} have been added to a new e-mail message.</p>
        </SimpleDialog>
      )
    }

    if (dialog === 'prints') {
      return (
        <SimpleDialog
          dialogRef={dialogRef}
          title="Order Prints"
          icon="info"
          showing={dialogShowing}
          actions={[{ label: 'Done', onClick: () => { setDialog(null); setDialogShowing(false) } }]}
        >
          <p>The online print ordering service is not available in this recreation.</p>
        </SimpleDialog>
      )
    }

    if (dialog === 'saved') {
      const count = lastSavedCount || Math.max(1, selectedCount)
      const total = 23 + count
      const available = Math.max(0, 100 - total)
      return (
        <SimpleDialog
          dialogRef={dialogRef}
          title="Photo Saved"
          icon="info"
          showing={dialogShowing}
          actions={[
            {
              label: 'View',
              onClick: () => {
                setDialog(null)
                setDialogShowing(false)
                goRoute({ name: 'albumViewer', album: lastSavedAlbum }, { replace: true })
              },
            },
            {
              label: 'Done',
              onClick: () => {
                setDialog(null)
                setDialogShowing(false)
                showViewerReadyBanner(() => {
                  goBack({ closeDialog: false })
                }, { viewer: true })
              },
            },
          ]}
        >
          <p>You have successfully added {count} photo{count === 1 ? '' : 's'} to <strong>{lastSavedAlbum}</strong> album.</p>
          <p><strong>Total Saved:</strong> {total} photos</p>
          <p><strong>Space available:</strong> {available} photos</p>
        </SimpleDialog>
      )
    }

    return null
  }

  const renderRoute = () => {
    if (route.name === 'devices') return renderDevices()
    if (route.name === 'pcs') return renderPcList()
    if (route.name === 'pcRoot') return renderPcRoot()
    if (route.name === 'pictureCategories') return renderPictureCategories()
    if (route.name === 'folders') return renderFolders()
    if (route.name === 'folder') return renderFolder()
    if (route.name === 'shared') return renderShared()
    if (route.name === 'viewer') return renderViewer()
    if (route.name === 'saveAlbum') return renderSaveAlbum()
    if (route.name === 'slideshow') return renderSlideshow()
    if (route.name === 'albums') return renderAlbums()
    if (route.name === 'albumViewer') return renderAlbumViewer()
    return renderHome()
  }

  return (
    <div
      ref={setRootRef}
      className={`photos-center-shell dock-page-shell photos-route-${route.name}`}
      data-route-key={routeKey(route)}
    >
      {renderRoute()}
      <SaveProgressPanel progress={saveProgress} onCancel={cancelProgress} />
      {renderDialog()}
    </div>
  )
}
