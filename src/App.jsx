import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import useSelection from './hooks/useSelection'
import useAudio from './hooks/useAudio'
import HomePage from './components/HomePage'
import DockPage from './components/DockPage'
import MediaPlayerPanel from './components/MediaPlayerPanel'
import MessengerPanel from './components/MessengerPanel'
import TypeWwwPanel from './components/TypeWwwPanel'
import { MUSIC_NAV_ROW } from './components/MusicCenter'
import SelectionFrame from './components/SelectionFrame'
import { DOCK_ITEMS, DOCK_PAGES } from './data/dockContent'

const BASE = import.meta.env.BASE_URL
const MEDIA_PANEL_SLIDE_MS = 250
const HOME_WEB_ADDRESS = 'http://msntv.msn.com/home/home.html'
const CENTER_WEB_ADDRESS_BASE = 'http://msntv.msn.com'
const USING_MSN_TV_PAGE_IDS = new Set(['tips', 'newsletter'])
const isMoneyQuotePageId = (pageId) => typeof pageId === 'string' && pageId.startsWith('money-quote:')
const isMessengerSettingsPageId = (pageId) => (
  typeof pageId === 'string'
  && (pageId.startsWith('messenger-settings') || pageId === 'settings-control-alerts')
)
const isHomeSettingsPageId = (pageId) => (
  typeof pageId === 'string'
  && DOCK_PAGES[pageId]?.kind === 'home-settings'
)
const isAnySettingsPageId = (pageId) => (
  isMessengerSettingsPageId(pageId) || isHomeSettingsPageId(pageId)
)
const getDockCenterId = (pageId) => {
  if (!pageId) return null
  if (isMoneyQuotePageId(pageId)) return 'money'
  if (isMessengerSettingsPageId(pageId)) return 'messenger'
  if (isHomeSettingsPageId(pageId)) return 'settings'
  if (USING_MSN_TV_PAGE_IDS.has(pageId) || pageId.startsWith('tip-')) return 'usingmsntv'

  return DOCK_ITEMS
    .map((item) => item.id)
    .find((id) => pageId === id || pageId.startsWith(`${id}-`)) ?? pageId
}
const normalizeWebAddressForCompare = (url) => {
  const value = String(url || '').trim()
  if (!value) return ''

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`
  try {
    const parsed = new URL(withProtocol)
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${parsed.host}${pathname}`.toLowerCase()
  } catch {
    return value.replace(/\/+$/, '').toLowerCase()
  }
}

function isAtDockPageBoundary(selected, direction) {
  if (!(selected instanceof Element)) return false

  const scrollContainer = selected.closest('.dock-page-shell [data-selection-scroll]')
  if (!scrollContainer) return false

  const selectableRects = Array.from(scrollContainer.querySelectorAll('.selectable'))
    .map((el) => ({ rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  if (selectableRects.length === 0) return false

  const selectedRect = selected.getBoundingClientRect()
  const edgeTolerance = 2

  if (direction === 'up') {
    const minTop = Math.min(...selectableRects.map(({ rect }) => rect.top))
    return selectedRect.top <= minTop + edgeTolerance
  }

  if (direction === 'down') {
    const maxBottom = Math.max(...selectableRects.map(({ rect }) => rect.bottom))
    return selectedRect.bottom >= maxBottom - edgeTolerance
  }

  return false
}

function isTypingTextField(el) {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  if (el instanceof HTMLTextAreaElement) return true
  if (!(el instanceof HTMLInputElement)) return false

  const nonTextTypes = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ])

  return !nonTextTypes.has((el.type || '').toLowerCase())
}

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [overlayGone, setOverlayGone] = useState(false)
  const [started, setStarted] = useState(false)
  const [startBtnFading, setStartBtnFading] = useState(false)
  const [inputLocked, setInputLocked] = useState(false)
  const [statusBarVisible, setStatusBarVisible] = useState(false)
  const [spinnerHidden, setSpinnerHidden] = useState(false)
  const [scrollArrowVisible, setScrollArrowVisible] = useState(false)
  const [sbOverlaying, setSbOverlaying] = useState(false)
  const [panelClass, setPanelClass] = useState('closed-no-anim')
  const [panelText, setPanelText] = useState('Please wait while we sign you in to MSN TV.')
  const [progressWidth, setProgressWidth] = useState('0vh')
  const [spinnerRotation, setSpinnerRotation] = useState(0)
  const [curPageVisible, setCurPageVisible] = useState(false)
  const [openDockPageId, setOpenDockPageId] = useState(null)
  const [dockTransitionPhase, setDockTransitionPhase] = useState('idle')
  const [musicCrossfadeActive, setMusicCrossfadeActive] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorShowing, setErrorShowing] = useState(false)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signOutShowing, setSignOutShowing] = useState(false)
  const [signInRevealStage, setSignInRevealStage] = useState(2)
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [clock, setClock] = useState('')
  const [headlines, setHeadlines] = useState(['Headline 1', 'Headline 2', 'Headline 3'])
  const [currentPageReloadKey, setCurrentPageReloadKey] = useState(0)
  const [dockPos, setDockPos] = useState(0)
  const [dockViewStart, setDockViewStart] = useState(0)
  const [dockPixelOffset, setDockPixelOffset] = useState(0)
  const [dockSlidingFromPos, setDockSlidingFromPos] = useState(null)
  const [musicNavPos, setMusicNavPos] = useState(0)
  const [musicNavViewStart, setMusicNavViewStart] = useState(0)
  const [musicNavPixelOffset, setMusicNavPixelOffset] = useState(0)
  const [musicNavSlidingFromPos, setMusicNavSlidingFromPos] = useState(null)
  const dockSlidingRef = useRef(false)
  const musicNavSlidingRef = useRef(false)

  const timeoutsRef = useRef([])
  const mainPageRef = useRef(null)
  const curPageRef = useRef(null)
  const dockPageRef = useRef(null)
  const dockSubPageBackRef = useRef(null)
  const musicCrossfadePageRef = useRef(null)
  const dockTransitionRef = useRef(null)
  const previousDockPageRef = useRef(null)
  const dockHistoryRef = useRef([])
  const mediaAudioRef = useRef(null)
  const mediaStartTimeoutRef = useRef(null)
  const mediaPanelStageRef = useRef(null)
  const mediaPanelCloseTimeoutRef = useRef(null)
  const mediaPanelReturnTargetRef = useRef(null)
  const messengerPanelStageRef = useRef(null)
  const messengerPanelCloseTimeoutRef = useRef(null)
  const messengerPanelReturnTargetRef = useRef(null)
  const typeWwwPanelStageRef = useRef(null)
  const typeWwwPanelCloseTimeoutRef = useRef(null)
  const handleStartRef = useRef(null)
  const handleBackNavigationRef = useRef(null)

  const [mediaPlaybackState, setMediaPlaybackState] = useState('stopped')
  const [mediaMuted, setMediaMuted] = useState(false)
  const [mediaElapsed, setMediaElapsed] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(36)
  const [mediaPanelMounted, setMediaPanelMounted] = useState(false)
  const [mediaPanelSlideOpen, setMediaPanelSlideOpen] = useState(false)
  const [mediaPanelKey, setMediaPanelKey] = useState(0)
  const [messengerPanelMounted, setMessengerPanelMounted] = useState(false)
  const [messengerPanelSlideOpen, setMessengerPanelSlideOpen] = useState(false)
  const [messengerPanelKey, setMessengerPanelKey] = useState(0)
  const [typeWwwPanelMounted, setTypeWwwPanelMounted] = useState(false)
  const [typeWwwPanelSlideOpen, setTypeWwwPanelSlideOpen] = useState(false)
  const [typeWwwPanelKey, setTypeWwwPanelKey] = useState(0)
  const [typeWwwInitialUrl, setTypeWwwInitialUrl] = useState(null)
  const [navigationErrorUrl, setNavigationErrorUrl] = useState('http://www.')
  const [signInPressed, setSignInPressed] = useState(false)

  const selection = useSelection()
  const audio = useAudio()

  const revealFocusBox = useCallback(() => {
    const focusBox = selection.focusBoxRef.current
    if (focusBox) {
      focusBox.style.visibility = ''
    }
    selection.unHideFocusBox()
  }, [selection])

  const isNavigationErrorScreenActive = useCallback(() => (
    openDockPageId === 'navigation-error'
    || DOCK_PAGES[openDockPageId]?.layout === 'navigationError'
    || Boolean(document.querySelector('.navigation-error-shell'))
  ), [openDockPageId])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const addTimeout = useCallback((fn, ms) => {
    timeoutsRef.current.push(setTimeout(fn, ms))
  }, [])

  const beginDockTransition = useCallback((
    nextPageId,
    {
      pushHistory = false,
      completeSound = null,
      immediateSound = null,
      showContacting = true,
      deferOnly = false,
      crossfade = false,
      crossfadeDelay = 0,
      crossfadeAfterContacting = false,
    } = {},
  ) => {
    clearTimeouts()
    dockSlidingRef.current = false
    setDockSlidingFromPos(null)
    setInputLocked(true)

    if (pushHistory && openDockPageId !== nextPageId) {
      dockHistoryRef.current.push(openDockPageId ?? null)
    }

    if (immediateSound) {
      audio.play(immediateSound)
    }

    if (crossfade) {
      if (crossfadeDelay > 0) {
        selection.holdGreen()
      } else {
        selection.hideFocusBox()
        setMusicCrossfadeActive(true)
        setDockTransitionPhase('idle')
      }

      addTimeout(() => {
        if (crossfadeDelay > 0) {
          selection.hideFocusBox()
          setMusicCrossfadeActive(true)
          setDockTransitionPhase('idle')
        }

        addTimeout(() => {
          setOpenDockPageId(nextPageId)
          setMusicCrossfadeActive(false)
          setInputLocked(false)
          selection.releaseGreen()
          if (completeSound) {
            audio.play(completeSound)
          }
        }, 200)
      }, crossfadeDelay)
      return
    }

    if (crossfadeAfterContacting) {
      setDockTransitionPhase('contacting')

      addTimeout(() => {
        selection.hideFocusBox()
        setDockTransitionPhase('idle')
        setMusicCrossfadeActive(true)
      }, 500)

      addTimeout(() => {
        setOpenDockPageId(nextPageId)
        setMusicCrossfadeActive(false)
        setInputLocked(false)
        selection.releaseGreen()
        if (completeSound) {
          audio.play(completeSound)
        }
      }, 700)
      return
    }

    if (deferOnly) {
      addTimeout(() => {
        setOpenDockPageId(nextPageId)
        setDockTransitionPhase('idle')
        setInputLocked(false)
        selection.releaseGreen()
        if (completeSound) {
          audio.play(completeSound)
        }
      }, 500)
      return
    }

    if (!showContacting) {
      selection.hideFocusBox()
      setDockTransitionPhase('blank')

      addTimeout(() => {
        setOpenDockPageId(nextPageId)
        setDockTransitionPhase('idle')
        setInputLocked(false)
        selection.releaseGreen()
        if (completeSound) {
          audio.play(completeSound)
        }
      }, 500)
      return
    }

    setDockTransitionPhase('contacting')

    addTimeout(() => {
      selection.hideFocusBox()
      setDockTransitionPhase('blank')
    }, 500)

    addTimeout(() => {
      setOpenDockPageId(nextPageId)
      setDockTransitionPhase('idle')
      setInputLocked(false)
      selection.releaseGreen()
      if (completeSound) {
        audio.play(completeSound)
      }
    }, 1000)
  }, [clearTimeouts, addTimeout, selection, openDockPageId, audio])

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const h = d.getHours()
      const m = d.getMinutes()
      setClock(`${h % 12 || 12}:${m < 10 ? '0' : ''}${m}${h >= 12 ? 'pm' : 'am'}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    audio.register('startup', `${BASE}audio/Power_On.mp3`)
    audio.register('connecting', `${BASE}audio/Connecting.mp3`)
    audio.register('disconnect', `${BASE}audio/Disconnect.mp3`)
    audio.register('back', `${BASE}audio/Back.mp3`)
    audio.register('pageBoundary', `${BASE}audio/Page_Boundary.mp3`)
    audio.register('select', `${BASE}audio/Select.mp3`)
    audio.register('controlFeedback', `${BASE}audio/ControlFeedback.mp3`)
    audio.register('error', `${BASE}audio/Error.mp3`)
    audio.register('homeBrand', `${BASE}audio/Home_brand.mp3`)
    audio.register('panelUp', `${BASE}sounds/Panel_Up.mp3`)
    audio.register('panelDown', `${BASE}sounds/Panel_Down.mp3`)
    audio.register('taskComplete', `${BASE}sounds/task_complete.mp3`)
    audio.register('emailDraft', `${BASE}audio/Email_Draft.mp3`)
    audio.register('emailSent', `${BASE}audio/Email_Sent.mp3`)
  }, [audio])

  const clearMediaStart = useCallback(() => {
    clearTimeout(mediaStartTimeoutRef.current)
    mediaStartTimeoutRef.current = null
  }, [])

  const playMedia = useCallback(() => {
    clearMediaStart()
    const audioEl = mediaAudioRef.current
    if (!audioEl) return

    if (audioEl.currentTime === 0 || audioEl.ended) {
      setMediaElapsed(0)
    }

    setMediaPlaybackState('playing')
    void audioEl.play().catch(() => {
      setMediaPlaybackState(audioEl.paused ? 'paused' : 'playing')
    })
  }, [clearMediaStart])

  const pauseMedia = useCallback(() => {
    clearMediaStart()
    const audioEl = mediaAudioRef.current
    audioEl?.pause()
    setMediaPlaybackState('paused')
  }, [clearMediaStart])

  const stopMedia = useCallback(() => {
    clearMediaStart()
    const audioEl = mediaAudioRef.current
    if (audioEl) {
      audioEl.pause()
      audioEl.currentTime = 0
    }
    setMediaElapsed(0)
    setMediaPlaybackState('stopped')
  }, [clearMediaStart])

  const toggleMediaMute = useCallback(() => {
    setMediaMuted((current) => {
      const next = !current
      if (mediaAudioRef.current) {
        mediaAudioRef.current.muted = next
      }
      return next
    })
  }, [])

  const startBackgroundMedia = useCallback(() => {
    const audioEl = mediaAudioRef.current
    if (!audioEl) return

    if (!audioEl.paused && mediaPlaybackState === 'playing') {
      return
    }

    clearMediaStart()

    if (audioEl.currentTime <= 0.05 || mediaPlaybackState === 'stopped') {
      audioEl.currentTime = 0
      setMediaElapsed(0)
      setMediaPlaybackState('buffering')
      mediaStartTimeoutRef.current = setTimeout(() => {
        mediaStartTimeoutRef.current = null
        playMedia()
      }, 1650)
      return
    }

    playMedia()
  }, [clearMediaStart, mediaPlaybackState, playMedia])

  const getActiveSelectionRoot = useCallback(() => {
    if (signOutDialogOpen) return document.getElementById('signout-dialog')
    if (dockTransitionPhase !== 'idle') return dockTransitionRef.current
    if (curPageVisible) return openDockPageId ? dockPageRef.current : curPageRef.current
    return mainPageRef.current
  }, [curPageVisible, dockTransitionPhase, openDockPageId, signOutDialogOpen])

  const capturePanelReturnTarget = useCallback(() => {
    const root = getActiveSelectionRoot()
    const selected = selection.getSelected()
    if (!(root instanceof Element) || !(selected instanceof Element) || !root.contains(selected)) {
      return null
    }

    const layer = Number(selected.getAttribute('data-select-layer'))
    const height = Number(selected.getAttribute('data-select-height'))
    if (!Number.isFinite(layer) || !Number.isFinite(height)) return null

    const row = Array.from(root.querySelectorAll(
      `.selectable[data-select-layer="${layer}"][data-select-height="${height}"]`,
    ))
    const pos = row.indexOf(selected)
    if (pos < 0) return null

    return { element: selected, layer, height, pos, pageId: openDockPageId ?? null }
  }, [getActiveSelectionRoot, openDockPageId, selection])

  const restoreMediaPanelSelection = useCallback(() => {
    const root = getActiveSelectionRoot()
    if (!(root instanceof Element)) return

    selection.initSelectables(root)

    const target = mediaPanelReturnTargetRef.current
    if (target?.element?.isConnected && root.contains(target.element)) {
      selection.updateContainerRef(target.layer, target.height, target.pos, target.element)
      selection.goToSpecific(target.layer, target.height, target.pos)
    } else if (!openDockPageId && curPageVisible) {
      selection.goToSpecific(0, 10, 0)
    }

    revealFocusBox()
  }, [curPageVisible, getActiveSelectionRoot, openDockPageId, revealFocusBox, selection])

  const restoreMessengerPanelSelection = useCallback(() => {
    const root = getActiveSelectionRoot()
    if (!(root instanceof Element)) return

    selection.initSelectables(root)

    const target = messengerPanelReturnTargetRef.current
    const isSamePage = target?.pageId === (openDockPageId ?? null)
    if (isSamePage && target?.element?.isConnected && root.contains(target.element)) {
      selection.updateContainerRef(target.layer, target.height, target.pos, target.element)
      selection.goToSpecific(target.layer, target.height, target.pos)
    } else if (isSamePage && target) {
      const row = Array.from(root.querySelectorAll(
        `.selectable[data-select-layer="${target.layer}"][data-select-height="${target.height}"]`,
      ))
      const freshTarget = row[target.pos]
      if (freshTarget) {
        selection.updateContainerRef(target.layer, target.height, target.pos, freshTarget)
        selection.goToSpecific(target.layer, target.height, target.pos)
      }
    } else if (!openDockPageId && curPageVisible) {
      selection.goToSpecific(0, 10, 0)
    }

    revealFocusBox()
  }, [curPageVisible, getActiveSelectionRoot, openDockPageId, revealFocusBox, selection])

  const closeMediaPanel = useCallback(({ stopBackground = false, afterClose = null } = {}) => {
    clearTimeout(mediaPanelCloseTimeoutRef.current)

    if (stopBackground) {
      stopMedia()
    }

    if (!mediaPanelMounted) {
      afterClose?.()
      return
    }

    void audio.play('panelDown')
    setMediaPanelSlideOpen(false)

    mediaPanelCloseTimeoutRef.current = setTimeout(() => {
      setMediaPanelMounted(false)
      mediaPanelCloseTimeoutRef.current = null
      if (afterClose) {
        afterClose()
      } else {
        window.requestAnimationFrame(restoreMediaPanelSelection)
      }
    }, MEDIA_PANEL_SLIDE_MS)
  }, [audio, mediaPanelMounted, restoreMediaPanelSelection, stopMedia])

  const closeMessengerPanel = useCallback(({ reopenSettings = false, afterClose = null } = {}) => {
    clearTimeout(messengerPanelCloseTimeoutRef.current)
    if (!messengerPanelMounted) {
      afterClose?.()
      return
    }

    void audio.play('panelDown')
    setMessengerPanelSlideOpen(false)

    messengerPanelCloseTimeoutRef.current = setTimeout(() => {
      setMessengerPanelMounted(false)
      messengerPanelCloseTimeoutRef.current = null
      if (afterClose) {
        afterClose()
      } else if (reopenSettings) {
        beginDockTransition('messenger-settings', { pushHistory: true, showContacting: false })
      } else {
        window.requestAnimationFrame(restoreMessengerPanelSelection)
      }
    }, MEDIA_PANEL_SLIDE_MS)
  }, [audio, beginDockTransition, messengerPanelMounted, restoreMessengerPanelSelection])

  const closeTypeWwwPanel = useCallback(({ afterClose = null } = {}) => {
    clearTimeout(typeWwwPanelCloseTimeoutRef.current)
    if (!typeWwwPanelMounted) {
      afterClose?.()
      return
    }

    void audio.play('panelDown')
    setTypeWwwPanelSlideOpen(false)

    typeWwwPanelCloseTimeoutRef.current = setTimeout(() => {
      setTypeWwwPanelMounted(false)
      typeWwwPanelCloseTimeoutRef.current = null
      if (afterClose) {
        afterClose()
      } else if (curPageRef.current) {
        selection.initSelectables(curPageRef.current)
        selection.goToSpecific(0, 10, 0)
        revealFocusBox()
      }
    }, MEDIA_PANEL_SLIDE_MS)
  }, [audio, revealFocusBox, selection, typeWwwPanelMounted])

  const showMediaPanel = useCallback(({ startBackground = false } = {}) => {
    if (!curPageVisible || dockTransitionPhase !== 'idle') return

    clearTimeout(mediaPanelCloseTimeoutRef.current)
    mediaPanelCloseTimeoutRef.current = null

    if (!mediaPanelMounted) {
      mediaPanelReturnTargetRef.current = capturePanelReturnTarget()
    }

    setMediaPanelKey((current) => current + 1)
    setMediaPanelMounted(true)
    setMediaPanelSlideOpen(false)
    void audio.play('panelUp')

    if (startBackground) {
      startBackgroundMedia()
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setMediaPanelSlideOpen(true)
      })
    })
  }, [
    audio,
    capturePanelReturnTarget,
    curPageVisible,
    dockTransitionPhase,
    mediaPanelMounted,
    startBackgroundMedia,
  ])

  const openMediaPanel = useCallback(({ startBackground = false } = {}) => {
    if (typeWwwPanelMounted) {
      closeTypeWwwPanel({ afterClose: () => showMediaPanel({ startBackground }) })
      return
    }

    if (messengerPanelMounted) {
      closeMessengerPanel({ afterClose: () => showMediaPanel({ startBackground }) })
      return
    }

    showMediaPanel({ startBackground })
  }, [closeMessengerPanel, closeTypeWwwPanel, messengerPanelMounted, showMediaPanel, typeWwwPanelMounted])

  const toggleMediaPanel = useCallback(() => {
    if (mediaPanelMounted && mediaPanelSlideOpen) {
      closeMediaPanel()
    } else {
      openMediaPanel()
    }
  }, [closeMediaPanel, mediaPanelMounted, mediaPanelSlideOpen, openMediaPanel])

  const showMessengerPanel = useCallback(({ silent = false } = {}) => {
    if (!curPageVisible || dockTransitionPhase !== 'idle') return

    clearTimeout(messengerPanelCloseTimeoutRef.current)
    messengerPanelCloseTimeoutRef.current = null
    if (!messengerPanelMounted && !silent) {
      messengerPanelReturnTargetRef.current = capturePanelReturnTarget()
    }
    setMessengerPanelKey((current) => current + 1)
    setMessengerPanelMounted(true)
    setMessengerPanelSlideOpen(false)
    if (!silent) {
      void audio.play('panelUp')
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setMessengerPanelSlideOpen(true))
    })
  }, [audio, capturePanelReturnTarget, curPageVisible, dockTransitionPhase, messengerPanelMounted])

  const openMessengerPanel = useCallback(({ silent = false } = {}) => {
    if (typeWwwPanelMounted) {
      closeTypeWwwPanel({ afterClose: () => showMessengerPanel({ silent }) })
      return
    }

    if (mediaPanelMounted) {
      closeMediaPanel({ afterClose: () => showMessengerPanel({ silent }) })
      return
    }

    showMessengerPanel({ silent })
  }, [closeMediaPanel, closeTypeWwwPanel, mediaPanelMounted, showMessengerPanel, typeWwwPanelMounted])

  const toggleMessengerPanel = useCallback(() => {
    if (messengerPanelMounted && messengerPanelSlideOpen) {
      closeMessengerPanel()
    } else {
      openMessengerPanel()
    }
  }, [closeMessengerPanel, messengerPanelMounted, messengerPanelSlideOpen, openMessengerPanel])

  const exitMessengerSettings = useCallback(({ immediateSound = null } = {}) => {
    const previousPageId = dockHistoryRef.current.length > 0
      ? dockHistoryRef.current.pop()
      : null

    dockHistoryRef.current = []
    beginDockTransition(previousPageId ?? null, { immediateSound, showContacting: false })
    setTimeout(() => openMessengerPanel({ silent: true }), 560)
  }, [beginDockTransition, openMessengerPanel])

  const openMessengerSettings = useCallback(() => {
    closeMessengerPanel({ reopenSettings: true })
  }, [closeMessengerPanel])

  const openHomeSettings = useCallback(() => {
    if (inputLocked || dockTransitionPhase !== 'idle') return
    if (openDockPageId === 'settings-home') return
    selection.holdGreen()
    beginDockTransition('settings-home', { pushHistory: true, showContacting: false, deferOnly: true })
  }, [beginDockTransition, dockTransitionPhase, inputLocked, openDockPageId, selection])

  const openForgotPassword = useCallback(() => {
    if (inputLocked || dockTransitionPhase !== 'idle') return
    if (openDockPageId === 'settings-forgot-password') return
    selection.holdGreen()
    beginDockTransition('settings-forgot-password', { pushHistory: true, showContacting: false, deferOnly: true })
  }, [beginDockTransition, dockTransitionPhase, inputLocked, openDockPageId, selection])

  const showTypeWwwPanel = useCallback((initialUrl = null) => {
    if (!curPageVisible || dockTransitionPhase !== 'idle') return
    if (isNavigationErrorScreenActive()) return

    clearTimeout(typeWwwPanelCloseTimeoutRef.current)
    typeWwwPanelCloseTimeoutRef.current = null
    setTypeWwwInitialUrl(initialUrl)
    setTypeWwwPanelKey((current) => current + 1)
    setTypeWwwPanelMounted(true)
    setTypeWwwPanelSlideOpen(false)
    void audio.play('panelUp')

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTypeWwwPanelSlideOpen(true))
    })
  }, [audio, curPageVisible, dockTransitionPhase, isNavigationErrorScreenActive])

  const openTypeWwwPanel = useCallback((initialUrl = null) => {
    if (mediaPanelMounted) {
      closeMediaPanel({ afterClose: () => showTypeWwwPanel(initialUrl) })
      return
    }

    if (messengerPanelMounted) {
      closeMessengerPanel({ afterClose: () => showTypeWwwPanel(initialUrl) })
      return
    }

    showTypeWwwPanel(initialUrl)
  }, [closeMediaPanel, closeMessengerPanel, mediaPanelMounted, messengerPanelMounted, showTypeWwwPanel])

  const toggleTypeWwwPanel = useCallback(() => {
    if (typeWwwPanelMounted && typeWwwPanelSlideOpen) {
      closeTypeWwwPanel()
    } else {
      openTypeWwwPanel()
    }
  }, [closeTypeWwwPanel, openTypeWwwPanel, typeWwwPanelMounted, typeWwwPanelSlideOpen])

  const currentWebAddress = useMemo(() => {
    const centerId = getDockCenterId(openDockPageId)
    return centerId ? `${CENTER_WEB_ADDRESS_BASE}/${centerId}` : HOME_WEB_ADDRESS
  }, [openDockPageId])

  const reloadCurrentPage = useCallback(() => {
    clearTimeouts()
    setInputLocked(true)
    selection.hideFocusBox()
    setDockTransitionPhase('blank')

    addTimeout(() => {
      setCurrentPageReloadKey((current) => current + 1)
      setDockTransitionPhase('idle')
      setInputLocked(false)
      selection.releaseGreen()
    }, 500)
  }, [addTimeout, clearTimeouts, selection])

  const handleTypeWwwGo = useCallback((url) => {
    const nextUrl = String(url || 'http://www.').trim() || 'http://www.'
    if (normalizeWebAddressForCompare(nextUrl) === normalizeWebAddressForCompare(currentWebAddress)) {
      closeTypeWwwPanel({ afterClose: reloadCurrentPage })
      return
    }

    setNavigationErrorUrl(nextUrl)
    closeTypeWwwPanel({
      afterClose: () => beginDockTransition('navigation-error', { pushHistory: true, showContacting: false }),
    })
  }, [beginDockTransition, closeTypeWwwPanel, currentWebAddress, reloadCurrentPage])

  useEffect(() => {
    const mediaAudio = new Audio(`${BASE}audio/chill-jingle.mp3`)
    mediaAudio.loop = true
    mediaAudio.muted = mediaMuted
    mediaAudioRef.current = mediaAudio

    const syncDuration = () => {
      if (Number.isFinite(mediaAudio.duration) && mediaAudio.duration > 0) {
        setMediaDuration(mediaAudio.duration)
      }
    }

    const syncElapsed = () => {
      setMediaElapsed(mediaAudio.currentTime)
    }

    const syncPlayState = () => {
      setMediaPlaybackState('playing')
    }

    const syncPauseState = () => {
      if (mediaStartTimeoutRef.current) return
      setMediaPlaybackState(mediaAudio.currentTime <= 0.05 ? 'stopped' : 'paused')
    }

    mediaAudio.addEventListener('loadedmetadata', syncDuration)
    mediaAudio.addEventListener('durationchange', syncDuration)
    mediaAudio.addEventListener('timeupdate', syncElapsed)
    mediaAudio.addEventListener('play', syncPlayState)
    mediaAudio.addEventListener('pause', syncPauseState)

    return () => {
      clearTimeout(mediaStartTimeoutRef.current)
      mediaAudio.removeEventListener('loadedmetadata', syncDuration)
      mediaAudio.removeEventListener('durationchange', syncDuration)
      mediaAudio.removeEventListener('timeupdate', syncElapsed)
      mediaAudio.removeEventListener('play', syncPlayState)
      mediaAudio.removeEventListener('pause', syncPauseState)
      mediaAudio.pause()
      mediaAudio.currentTime = 0
      mediaAudioRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearTimeout(mediaPanelCloseTimeoutRef.current)
  }, [])

  useEffect(() => {
    return () => clearTimeout(messengerPanelCloseTimeoutRef.current)
  }, [])

  useEffect(() => {
    return () => clearTimeout(typeWwwPanelCloseTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!mediaPanelMounted || !mediaPanelStageRef.current) return undefined

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(mediaPanelStageRef.current)
      selection.goToSpecific(0, 0, 0)
      revealFocusBox()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mediaPanelKey, mediaPanelMounted, revealFocusBox, selection])

  useEffect(() => {
    if (!messengerPanelMounted || !messengerPanelStageRef.current) return undefined

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(messengerPanelStageRef.current)
      selection.goToSpecific(0, 0, 0)
      revealFocusBox()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [messengerPanelKey, messengerPanelMounted, revealFocusBox, selection])

  useEffect(() => {
    if (!typeWwwPanelMounted || !typeWwwPanelStageRef.current) return undefined

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(typeWwwPanelStageRef.current)
      selection.goToSpecific(0, 0, 0)
      revealFocusBox()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [revealFocusBox, selection, typeWwwPanelKey, typeWwwPanelMounted])

  const mediaPlayer = useMemo(() => ({
    playbackState: mediaPlaybackState,
    muted: mediaMuted,
    elapsed: mediaElapsed,
    duration: mediaDuration,
    panelMounted: mediaPanelMounted,
    startBackground: startBackgroundMedia,
    openPanel: openMediaPanel,
    closePanel: closeMediaPanel,
    togglePanel: toggleMediaPanel,
    play: playMedia,
    pause: pauseMedia,
    stop: stopMedia,
    toggleMute: toggleMediaMute,
  }), [
    mediaPlaybackState,
    mediaMuted,
    mediaElapsed,
    mediaDuration,
    mediaPanelMounted,
    startBackgroundMedia,
    openMediaPanel,
    closeMediaPanel,
    toggleMediaPanel,
    playMedia,
    pauseMedia,
    stopMedia,
    toggleMediaMute,
  ])

  const handleBackNavigation = useCallback(() => {
    if (!openDockPageId || inputLocked || dockTransitionPhase !== 'idle') return false

    if (dockSubPageBackRef.current?.()) {
      audio.play('back')
      return true
    }

    if (isMessengerSettingsPageId(openDockPageId)) {
      exitMessengerSettings({ immediateSound: 'back' })
      return true
    }

    const previousPageId = dockHistoryRef.current.length > 0
      ? dockHistoryRef.current.pop()
      : null

    const intraSettings = isAnySettingsPageId(openDockPageId) && isAnySettingsPageId(previousPageId)
    beginDockTransition(previousPageId ?? null, {
      immediateSound: previousPageId ? 'back' : null,
      showContacting: false,
      deferOnly: intraSettings,
    })
    return true
  }, [openDockPageId, inputLocked, dockTransitionPhase, beginDockTransition, exitMessengerSettings, audio])
  handleBackNavigationRef.current = handleBackNavigation

  useEffect(() => {
    if (mainPageRef.current) {
      selection.initSelectables(mainPageRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => {
      const sel = selection.getSelected()
      const isFocusable = sel instanceof HTMLTextAreaElement
        || (sel instanceof HTMLInputElement
          && (!sel.type || ['text', 'email', 'url', 'tel', 'search', 'password'].includes(sel.type))
          && !sel.classList.contains('search-input-stub'))
      if (isFocusable) {
        if (document.activeElement !== sel) {
          window.requestAnimationFrame(() => {
            const stillSelected = selection.getSelected()
            if (stillSelected === sel && document.activeElement !== sel) {
              sel.focus({ preventScroll: true })
            }
          })
        }
      } else {
        const active = document.activeElement
        if (
          active instanceof HTMLTextAreaElement
          || (active instanceof HTMLInputElement
            && !active.classList.contains('search-input-stub'))
        ) {
          active.blur()
        }
      }
    }
    window.addEventListener('msntv-selection-change', handler)
    return () => window.removeEventListener('msntv-selection-change', handler)
  }, [selection])

  useEffect(() => {
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
    if (!/Tizen|SamsungBrowser|SMART-TV/i.test(ua)) return undefined

    document.documentElement.classList.add('tv-remote-mode')

    const dispatchKey = (key, keyCode) => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      }))
    }

    const lastMove = { x: null, y: null, time: 0 }
    const moveHandler = (e) => {
      const now = Date.now()
      if (lastMove.x === null) {
        lastMove.x = e.clientX
        lastMove.y = e.clientY
        lastMove.time = now
        return
      }
      if (now - lastMove.time < 90) return

      const dx = e.clientX - lastMove.x
      const dy = e.clientY - lastMove.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDx < 12 && absDy < 12) return

      lastMove.x = e.clientX
      lastMove.y = e.clientY
      lastMove.time = now

      if (absDx > absDy) {
        dispatchKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft', dx > 0 ? 39 : 37)
      } else {
        dispatchKey(dy > 0 ? 'ArrowDown' : 'ArrowUp', dy > 0 ? 40 : 38)
      }
    }

    const clickHandler = (e) => {
      if (!e.isTrusted) return
      e.preventDefault()
      e.stopImmediatePropagation()
      dispatchKey('Enter', 13)
    }

    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('click', clickHandler, true)

    if (!window.history.state?._tvShellGuard) {
      window.history.pushState({ _tvShellGuard: true }, '')
    }
    const popHandler = () => {
      handleBackNavigationRef.current?.()
      if (!window.history.state?._tvShellGuard) {
        window.history.pushState({ _tvShellGuard: true }, '')
      }
    }
    window.addEventListener('popstate', popHandler)

    return () => {
      document.documentElement.classList.remove('tv-remote-mode')
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('click', clickHandler, true)
      window.removeEventListener('popstate', popHandler)
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (!started) {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return
        e.preventDefault()
        handleStartRef.current?.()
        return
      }

      if (e.keyCode === 10009 || e.key === 'GoBack' || e.key === 'BrowserBack') {
        e.preventDefault()
        if (!isTypingTextField(document.activeElement) && openDockPageId) {
          handleBackNavigation()
        }
        return
      }

      if (e.code === 'F2') {
        e.preventDefault()
        if (isMessengerSettingsPageId(openDockPageId)) return
        toggleMessengerPanel()
        return
      }

      if (e.code === 'F7') {
        e.preventDefault()
        toggleMediaPanel()
        return
      }

      if ((e.key === 'Backspace' || e.code === 'Backspace') && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        if (isNavigationErrorScreenActive()) return
        toggleTypeWwwPanel()
        return
      }

      if ((e.key === 'Escape' || e.key === 'Backspace') && (mediaPanelMounted || messengerPanelMounted || typeWwwPanelMounted)) {
        e.preventDefault()
        if (mediaPanelMounted) closeMediaPanel()
        if (messengerPanelMounted) closeMessengerPanel()
        if (typeWwwPanelMounted) closeTypeWwwPanel()
        return
      }

      if (inputLocked) {
        e.preventDefault()
        return
      }

      const sel = selection.getSelected()
      const isSearchInput = sel instanceof HTMLInputElement && sel.classList.contains('search-input-stub')
      const isActiveTextField = isTypingTextField(document.activeElement)

      if (isSearchInput && sel === document.activeElement && e.code.startsWith('Arrow')) {
        sel.blur()
      }

      if (isSearchInput && sel !== document.activeElement) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          const max = sel.maxLength
          if (max > 0 && sel.value.length >= max) {
            sel.value = sel.value.slice(0, max - 1) + e.key
          } else {
            sel.value += e.key
          }
          return
        }
        if (e.key === 'Backspace') {
          e.preventDefault()
          sel.value = sel.value.slice(0, -1)
          return
        }
        if (e.key === 'Delete') {
          e.preventDefault()
          sel.value = ''
          return
        }
      }

      if (e.key === 'Backspace') {
        if (isActiveTextField) return
        e.preventDefault()
        if (openDockPageId) {
          handleBackNavigation()
        }
        return
      }

      const key = e.code
      if (key === 'Tab') {
        e.preventDefault()
        return
      }
      if (key === 'Escape' && openDockPageId) {
        e.preventDefault()
        dockHistoryRef.current = []
        beginDockTransition(null)
        return
      }
      if (key === 'Enter') {
        if (!sel) return
        if (
          sel instanceof HTMLTextAreaElement
          && document.activeElement === sel
        ) {
          return
        }
        e.preventDefault()
        if (sel instanceof HTMLButtonElement && sel.disabled) return
        const activeEl = document.activeElement
        if (activeEl instanceof HTMLElement && activeEl !== sel && activeEl !== document.body) {
          activeEl.blur()
        }
        const isPlainTextInput = sel instanceof HTMLInputElement
          && (!sel.type || ['text', 'email', 'url', 'tel', 'search'].includes(sel.type))
          && !sel.classList.contains('search-input-stub')
        if (isPlainTextInput || sel instanceof HTMLTextAreaElement) {
          audio.play('select')
          selection.flashGreen()
          setTimeout(() => sel.focus(), 100)
          return
        }
        if (isSearchInput) {
          if (sel.dataset?.homeSearch === 'true') {
            audio.play('select')
            selection.flashGreen()
            const value = sel.value
            setTimeout(() => openTypeWwwPanel(value || null), 100)
            return
          }
          audio.play('select')
          selection.flashGreen()
          setTimeout(() => sel.focus(), 100)
          return
        }
        if (sel?.classList.contains('custom-checkbox') || sel?.classList.contains('settings-control-feedback')) {
          audio.play('controlFeedback')
        } else {
          audio.play('select')
        }
        const isNoopAction = sel.getAttribute?.('data-action-noop') === 'true'
        const holdSettingsNavigation = Boolean(
          openDockPageId
          && isAnySettingsPageId(openDockPageId)
          && sel.closest('.settings-page-shell')
          && !sel.classList.contains('settings-control-feedback')
          && !isNoopAction
        )
        if (holdSettingsNavigation) {
          selection.holdGreen()
        } else {
          selection.flashGreen()
        }
        setTimeout(() => sel?.click(), 100)
        return
      }
      const dirMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
      if (dirMap[key]) {
        const activeEl = document.activeElement
        if (activeEl instanceof HTMLTextAreaElement) {
          const value = activeEl.value || ''
          const start = activeEl.selectionStart ?? 0
          const end = activeEl.selectionEnd ?? 0
          let atBoundary = false
          if (key === 'ArrowLeft' && start === 0 && end === 0) {
            atBoundary = true
          } else if (key === 'ArrowRight' && start === value.length && end === value.length) {
            atBoundary = true
          } else if (key === 'ArrowUp') {
            if (!value.substring(0, start).includes('\n')) atBoundary = true
          } else if (key === 'ArrowDown') {
            if (!value.substring(end).includes('\n')) atBoundary = true
          }
          if (!atBoundary) {
            return
          }
          activeEl.blur()
        }
        e.preventDefault()
        const sel = selection.getSelected()
        const homeDockArea = !openDockPageId ? sel?.closest('#dock-area') : null
        const musicNavArea = openDockPageId === 'music' ? sel?.closest('.music-nav-area') : null
        const isDockSelection = Boolean(homeDockArea)
        const isMusicNavSelection = Boolean(musicNavArea)

        if ((isDockSelection || isMusicNavSelection) && (key === 'ArrowLeft' || key === 'ArrowRight')) {
          const carouselArea = isMusicNavSelection ? musicNavArea : homeDockArea
          const dockSel = carouselArea?.querySelector('[data-dock-carousel-selected="true"]') ?? sel
          if (!(dockSel instanceof HTMLElement)) return

          const slider = carouselArea?.querySelector('.dock-slider')
          const dockItems = carouselArea?.querySelector('.dock-items')
          if (!slider || !dockItems) return

          const containerRect = dockItems.getBoundingClientRect()
          const selRect = dockSel.getBoundingClientRect()
          const children = Array.from(slider.children)
          const selIdx = children.indexOf(dockSel)
          if (selIdx === -1) return

          let willSlide = false
          let pxShift = 0
          if (key === 'ArrowRight' && selIdx + 1 < children.length) {
            const nextEl = children[selIdx + 1]
            const nextRight = selRect.right + nextEl.offsetWidth
            if (nextRight > containerRect.right) {
              willSlide = true
              pxShift = nextRight - containerRect.right
              const peekEl = children[selIdx + 2]
              if (peekEl) pxShift += peekEl.offsetWidth / 2
            }
          } else if (key === 'ArrowLeft' && selIdx - 1 >= 0) {
            const prevEl = children[selIdx - 1]
            const prevLeft = selRect.left - prevEl.offsetWidth
            if (prevLeft < containerRect.left) {
              willSlide = true
              pxShift = prevLeft - containerRect.left
              const peekEl = children[selIdx - 2]
              if (peekEl) pxShift -= peekEl.offsetWidth / 2
            }
          }

          const setCarouselPos = isMusicNavSelection ? setMusicNavPos : setDockPos
          const setCarouselViewStart = isMusicNavSelection ? setMusicNavViewStart : setDockViewStart
          const setCarouselPixelOffset = isMusicNavSelection ? setMusicNavPixelOffset : setDockPixelOffset
          const setCarouselSlidingFromPos = isMusicNavSelection ? setMusicNavSlidingFromPos : setDockSlidingFromPos
          const carouselSlidingRef = isMusicNavSelection ? musicNavSlidingRef : dockSlidingRef
          const carouselPos = isMusicNavSelection ? musicNavPos : dockPos

          setCarouselPos(prev => {
            const next = prev + (key === 'ArrowRight' ? 1 : -1)
            setCarouselViewStart(next)
            return next
          })
          if (willSlide) {
            setCarouselPixelOffset(prev => prev + pxShift)
            setCarouselSlidingFromPos(carouselPos)
            carouselSlidingRef.current = true
            const focusBox = selection.focusBoxRef.current
            if (focusBox) {
              focusBox.style.visibility = 'hidden'
            }
          }
        } else if (isDockSelection && key === 'ArrowUp') {
          selection.moveSelection('up')
        } else {
          const moved = selection.moveSelection(dirMap[key])
          if (
            !moved
            && openDockPageId
            && (key === 'ArrowUp' || key === 'ArrowDown')
            && isAtDockPageBoundary(sel, dirMap[key])
          ) {
            audio.play('pageBoundary')
          }
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [
    selection,
    audio,
    inputLocked,
    openDockPageId,
    beginDockTransition,
    isNavigationErrorScreenActive,
    dockPos,
    musicNavPos,
    handleBackNavigation,
    toggleMediaPanel,
    toggleMessengerPanel,
    toggleTypeWwwPanel,
    openTypeWwwPanel,
    mediaPanelMounted,
    messengerPanelMounted,
    typeWwwPanelMounted,
    closeMediaPanel,
    closeMessengerPanel,
    closeTypeWwwPanel,
    started,
  ])

  const fetchHeadlines = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}data/headlines.json?_=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.headlines?.length) setHeadlines(data.headlines)
      }
    } catch {
      // keep defaults
    }
  }, [])

  const handleStart = useCallback(() => {
    audio.play('select')
    setStartBtnFading(true)
    setInputLocked(true)
    setTimeout(() => {
      setStarted(true)
      selection.goToSpecific(0, 1, 1)
      addTimeout(() => audio.play('startup'), 500)
      addTimeout(() => {
        setOverlayVisible(false)
        setInputLocked(false)
      }, 4000)
    }, 500)
  }, [audio, selection, addTimeout])
  handleStartRef.current = handleStart

  const resetStatusUi = useCallback((nextPanelClass = 'closed-no-anim') => {
    setPanelText('Please wait while we sign you in to MSN TV.')
    setPanelClass(nextPanelClass)
    setErrorDialogOpen(false)
    setErrorShowing(false)
    setStatusBarVisible(false)
    setSpinnerHidden(false)
    setScrollArrowVisible(false)
    setSbOverlaying(false)
    setSpinnerRotation(0)
    setProgressWidth('0vh')
  }, [])

  const resetHomePageState = useCallback(() => {
    previousDockPageRef.current = null
    dockHistoryRef.current = []
    setOpenDockPageId(null)
    setDockPos(0)
    setDockViewStart(0)
    setDockPixelOffset(0)
    setDockSlidingFromPos(null)
    setMusicNavPos(0)
    setMusicNavViewStart(0)
    setMusicNavPixelOffset(0)
    setMusicNavSlidingFromPos(null)
    dockSlidingRef.current = false
    musicNavSlidingRef.current = false
  }, [])

  const handleSignIn = useCallback(() => {
    if (signInPressed) return
    setSignInPressed(true)
    clearTimeouts()
    setInputLocked(false)
    setSignInRevealStage(2)
    setSignOutDialogOpen(false)
    setSignOutShowing(false)
    resetStatusUi('open-no-anim')
    audio.play('connecting')
    selection.goToLayer(1)

    addTimeout(() => setProgressWidth('106vh'), 300)
    addTimeout(() => setProgressWidth('10.6vh'), 400)
    addTimeout(() => setProgressWidth('50vh'), 500)

    addTimeout(() => {
      selection.hideFocusBox()
      setPanelClass('')
    }, 1300)

    addTimeout(() => {
      setProgressWidth('42vh')
      setStatusBarVisible(true)
      setScrollArrowVisible(true)
      setSbOverlaying(true)
      setPanelText('Contacting MSN TV Service')
    }, 1400)

    addTimeout(() => setSbOverlaying(false), 1900)

    addTimeout(() => {
      setPanelClass('open-status-no-anim')
      setScrollArrowVisible(false)
    }, 1950)

    addTimeout(() => selection.unHideFocusBox(), 2050)
    addTimeout(() => selection.hideFocusBox(), 2450)

    addTimeout(() => {
      setProgressWidth('75vh')
      setSpinnerRotation(30)
    }, 4175)
    addTimeout(() => setSpinnerHidden(true), 4275)
    addTimeout(() => setSpinnerHidden(false), 6075)

    addTimeout(() => {
      setSpinnerHidden(true)
      fetchHeadlines()
    }, 6175)

    addTimeout(() => {
      setCurPageVisible(true)
      setPanelClass('closed-no-anim')
    }, 7950)

    addTimeout(() => {
      audio.play('homeBrand')
      setSpinnerHidden(false)
      selection.unHideFocusBox()
    }, 8250)

    addTimeout(() => setSpinnerHidden(true), 8450)
  }, [clearTimeouts, resetStatusUi, audio, selection, addTimeout, fetchHeadlines, signInPressed])

  useEffect(() => {
    const previousDockPageId = previousDockPageRef.current
    previousDockPageRef.current = openDockPageId

    const isSigninDockPage = !curPageVisible && openDockPageId && DOCK_PAGES[openDockPageId]?.kind === 'home-settings'
    const isReturningToSignInShell = !curPageVisible && !openDockPageId && previousDockPageId

    if (!curPageVisible && !isSigninDockPage && !isReturningToSignInShell) return

    let root
    if (openDockPageId) {
      root = dockPageRef.current
    } else if (isReturningToSignInShell) {
      root = mainPageRef.current
    } else {
      root = curPageRef.current
    }
    if (!root) return

    dockSlidingRef.current = false
    setDockSlidingFromPos(null)
    selection.initSelectables(root)
    revealFocusBox()

    if (curPageVisible && !openDockPageId && (previousDockPageId || currentPageReloadKey > 0)) {
      selection.goToSpecific(0, 10, 0)
    }
  }, [curPageVisible, openDockPageId, currentPageReloadKey, selection, revealFocusBox])

  useEffect(() => {
    if (!curPageVisible || openDockPageId || !curPageRef.current) return
    const dockEl = curPageRef.current.querySelector('#dock-area [data-select-height="10"]')
    if (dockEl) {
      selection.updateContainerRef(0, 10, 0, dockEl)
      selection.updateFocusBox()
    }
  }, [dockPos, curPageVisible, openDockPageId, currentPageReloadKey, selection])

  useEffect(() => {
    if (!curPageVisible || openDockPageId !== 'music' || !dockPageRef.current) return
    const navEl = dockPageRef.current.querySelector(`.music-nav-area [data-select-height="${MUSIC_NAV_ROW}"]`)
    if (navEl) {
      selection.updateContainerRef(0, MUSIC_NAV_ROW, 0, navEl)
      selection.updateFocusBox()
    }
  }, [musicNavPos, curPageVisible, openDockPageId, currentPageReloadKey, selection])

  useEffect(() => {
    if (dockTransitionPhase !== 'contacting' || !dockTransitionRef.current) return
    selection.initSelectables(dockTransitionRef.current)
    revealFocusBox()
    selection.goToSpecific(0, 0, 0)
  }, [dockTransitionPhase, selection, revealFocusBox])

  const handleSlideEnd = useCallback(() => {
    if (dockSlidingRef.current) {
      dockSlidingRef.current = false
      const focusBox = selection.focusBoxRef.current
      setDockSlidingFromPos(null)
      if (focusBox) {
        focusBox.style.visibility = ''
      }
      const dockEl = curPageRef.current?.querySelector('[data-select-height="10"]')
      if (dockEl) {
        selection.updateContainerRef(0, 10, 0, dockEl)
      }
      selection.updateFocusBox()
    }
  }, [selection])

  const handleMusicNavSlideEnd = useCallback(() => {
    if (musicNavSlidingRef.current) {
      musicNavSlidingRef.current = false
      const focusBox = selection.focusBoxRef.current
      setMusicNavSlidingFromPos(null)
      if (focusBox) {
        focusBox.style.visibility = ''
      }
      const navEl = dockPageRef.current?.querySelector(`.music-nav-area [data-select-height="${MUSIC_NAV_ROW}"]`)
      if (navEl) {
        selection.updateContainerRef(0, MUSIC_NAV_ROW, 0, navEl)
      }
      selection.updateFocusBox()
    }
  }, [selection])

  const handleNetworkIcon = useCallback(() => {
    clearTimeouts()
    selection.setLast()
    selection.goToLayer(2)
    selection.tempHideFocusBox()
    addTimeout(() => {
      audio.play('error')
      setErrorDialogOpen(true)
      setErrorShowing(true)
    }, 250)
  }, [clearTimeouts, selection, addTimeout, audio])

  const handleCancelError = useCallback(() => {
    setErrorDialogOpen(false)
    setErrorShowing(false)
    selection.goToLast()
  }, [selection])

  const handleCheckbox = useCallback(() => {
    setCheckboxChecked((c) => !c)
  }, [])

  const handleOpenSignOutDialog = useCallback(() => {
    if (inputLocked || signOutDialogOpen) return
    clearTimeouts()
    selection.setLast()
    setSignOutShowing(false)
    selection.goToSpecific(1, 0, 0)
    selection.tempHideFocusBox()
    addTimeout(() => {
      audio.play('error')
      setSignOutDialogOpen(true)
      setSignOutShowing(true)
    }, 250)
  }, [inputLocked, signOutDialogOpen, clearTimeouts, selection, addTimeout, audio])

  const handleCancelSignOut = useCallback(() => {
    if (inputLocked) return
    setSignOutDialogOpen(false)
    setSignOutShowing(false)
    selection.goToLast()
  }, [inputLocked, selection])

  const handleConfirmSignOut = useCallback(() => {
    if (inputLocked) return

    clearTimeouts()
    setInputLocked(true)
    selection.flashGreen(1000)

    addTimeout(() => {
      setSignOutDialogOpen(false)
      setSignOutShowing(false)
      setSignInRevealStage(0)
      setCurPageVisible(false)
      setSignInPressed(false)
      resetHomePageState()
      resetStatusUi('closed-no-anim')
      selection.hideFocusBox()

      addTimeout(() => setSignInRevealStage(1), 50)

      addTimeout(() => {
        setSignInRevealStage(2)
        addTimeout(() => {
          if (mainPageRef.current) {
            selection.initSelectables(mainPageRef.current)
            selection.goToSpecific(0, 1, 1)
          }
          selection.unHideFocusBox()
          setInputLocked(false)
        }, 0)
      }, 100)
    }, 1000)
  }, [inputLocked, clearTimeouts, selection, addTimeout, resetHomePageState, resetStatusUi])

  const handleOpenDockPage = useCallback((pageId, options = {}) => {
    if (inputLocked || signOutDialogOpen || dockTransitionPhase !== 'idle') return
    if (pageId === 'messenger') {
      openMessengerPanel()
      return
    }
    if (!pageId || (!DOCK_PAGES[pageId] && !isMoneyQuotePageId(pageId))) return
    if (pageId === openDockPageId) return
    if (isAnySettingsPageId(openDockPageId) && isAnySettingsPageId(pageId)) {
      beginDockTransition(pageId, { pushHistory: true, showContacting: false, deferOnly: true })
      return
    }
    beginDockTransition(pageId, {
      pushHistory: true,
      crossfade: Boolean(options.crossfade),
      crossfadeDelay: options.crossfadeDelay ?? 0,
      crossfadeAfterContacting: pageId === 'music' && !options.crossfade,
    })
  }, [inputLocked, signOutDialogOpen, dockTransitionPhase, openMessengerPanel, beginDockTransition, openDockPageId])

  const handleCloseDockPage = useCallback(() => {
    if (inputLocked || dockTransitionPhase !== 'idle') return
    dockHistoryRef.current = []
    beginDockTransition(null)
  }, [inputLocked, dockTransitionPhase, beginDockTransition])

  const handleSettingsAction = useCallback((action) => {
    if (!action) return

    if (action.action === 'noop') return

    if (action.action === 'exit') {
      exitMessengerSettings()
      return
    }

    if (action.action === 'home-exit') {
      dockHistoryRef.current = []
      const fromSignIn = !curPageVisible
      beginDockTransition(null, { showContacting: false, deferOnly: fromSignIn })
      return
    }

    if (action.action === 'save') {
      void audio.play('taskComplete').finally(() => {
        beginDockTransition(action.targetPage ?? 'messenger-settings', { pushHistory: false, showContacting: false, deferOnly: true })
      })
      return
    }

    if (action.action === 'settings-home') {
      beginDockTransition(action.targetPage ?? 'messenger-settings', { pushHistory: false, showContacting: false, deferOnly: true })
      return
    }

    if (action.action === 'messenger-settings') {
      beginDockTransition(action.targetPage ?? 'messenger-settings', { pushHistory: false, showContacting: false, deferOnly: true })
    }
  }, [audio, beginDockTransition, curPageVisible, exitMessengerSettings])

  const showSignInShell = signInRevealStage >= 1
  const showSignInExtras = signInRevealStage >= 2
  const dockTransitionActive = dockTransitionPhase !== 'idle'

  return (
    <>
      {!overlayGone && (
        <div className={`flex overlay items-center justify-center ${overlayVisible ? '' : 'fade-out'}`}
          onTransitionEnd={() => !overlayVisible && setOverlayGone(true)}
        >
          {!started && (
            <button
              type="button"
              className={`base-btn ${startBtnFading ? 'start-btn-fading' : ''}`}
              id="start-btn"
              onClick={handleStart}
            >
              Start MSN TV 2
            </button>
          )}
        </div>
      )}

      <div id="main-page" ref={mainPageRef} style={{ pointerEvents: inputLocked ? 'none' : undefined }}>
        <div className="flex mx-auto justify-center">
          <div className="tv-frame flex relative flex-wrap">
            <img className="object-cover w-full h-full absolute inset-0" src={`${BASE}images/bg.png`} />
            <div id="focus-box" ref={selection.focusBoxRef}>
              <SelectionFrame flashable />
            </div>

            <div className={`absolute top-0 left-0 right-0 px-4 py-2 ${showSignInShell && !(openDockPageId && !curPageVisible) ? '' : 'invisible'}`}>
              <div className="flex items-center">
                <div className="shrink">
                  <img className="topbar-img" src={`${BASE}images/topbarlogo.png`} />
                </div>
                <div
                  className={`grow selectable ${showSignInExtras ? '' : 'invisible'}`}
                  data-select-x="0"
                  data-select-height="0"
                  data-select-layer="0"
                  onClick={openForgotPassword}
                >
                  <h3 className="ui-title-white">Forgot your password?</h3>
                </div>
                <div
                  className="grow selectable"
                  data-select-x="1"
                  data-select-height="0"
                  data-select-layer="0"
                  onClick={openHomeSettings}
                >
                  <h3 className="ui-title-white">Settings</h3>
                </div>
                <div className="grow selectable" data-select-x="2" data-select-height="0" data-select-layer="0">
                  <div className="flex items-center">
                    <h3 className="ui-title-white">Help</h3>
                    <img className="help-icon" src={`${BASE}images/helpicon.png`} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`absolute top-0 left-0 right-0 px-4 py-2 login-container flex ${showSignInExtras && !(openDockPageId && !curPageVisible) ? '' : 'invisible'}`}>
              <div className="flex">
                <div className="shrink user-icon-large">
                  <img src={`${BASE}images/tile22_l.png`} />
                </div>
                <div className="grow py-2">
                  <div className="grid-rows-4 items-center">
                    <h3 className="ui-title-navy">jacksondam@webtv.net</h3>
                    <h3 className="text-gap"><br /></h3>
                    <h3 className="ui-title-dark">Type your password</h3>
                    <input
                      className="password-box selectable"
                      type="password"
                      defaultValue="verysecurepassword"
                      data-select-x="0"
                      data-select-height="1"
                      data-select-layer="0"
                    />
                    <button
                      type="button"
                      className="sign-in-btn selectable"
                      data-select-x="1"
                      data-select-height="1"
                      data-select-layer="0"
                      onClick={handleSignIn}
                      disabled={signInPressed}
                    >
                      Sign In
                    </button>
                    <div className="flex items-center">
                      <img
                        className="custom-checkbox selectable"
                        data-select-x="0"
                        data-select-height="2"
                        data-select-layer="0"
                        src={checkboxChecked ? `${BASE}images/checked.png` : `${BASE}images/unchecked.png`}
                        onClick={handleCheckbox}
                      />
                      <h3 className="ui-title-dark-2 ml-2">Save password so I don't need to retype it</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="status-bar"
              className={`absolute bottom-0 left-0 right-0 flex items-center ${statusBarVisible ? '' : 'hidden'}`}
            >
              <div className={`absolute sb-overlay ${sbOverlaying ? 'overlaying' : ''}`}></div>
              <img className="status-bar-bg" src={`${BASE}images/statusbarbg.png`} />
              <img className="absolute" id="status-bar-user-tile" src={`${BASE}images/tile22_s.png`} />
              <img
                className={`absolute scroll-arrow-down ${scrollArrowVisible ? '' : 'hidden'}`}
                src={`${BASE}images/scrollindicatordown.png`}
              />
              <h3 className="absolute" id="status-bar-clock">{clock}</h3>
              <img
                className={`absolute ${spinnerHidden ? 'hidden' : ''}`}
                id="status-bar-spinner"
                src={`${BASE}images/loadpage.png`}
                style={{ transform: `rotate(${spinnerRotation}deg)` }}
              />
              <img className="absolute status-bar-logo" src={`${BASE}images/msntvlogo.png`} />
            </div>

            {!curPageVisible && openDockPageId && DOCK_PAGES[openDockPageId]?.kind === 'home-settings' && (
              <div
                id="signin-dock-page"
                ref={curPageRef}
                className="absolute top-0 left-0 right-0 flex"
              >
                <DockPage
                  key={`signin-${openDockPageId}-${currentPageReloadKey}`}
                  pageId={openDockPageId}
                  pageRef={dockPageRef}
                  subPageBackRef={dockSubPageBackRef}
                  onClose={handleCloseDockPage}
                  selection={selection}
                  onNavigate={handleOpenDockPage}
                  onSettingsAction={handleSettingsAction}
                  navigationErrorUrl={navigationErrorUrl}
                  audio={audio}
                />
              </div>
            )}

            <div
              id="cur-page"
              ref={curPageRef}
              className={`absolute top-0 left-0 right-0 flex ${curPageVisible ? '' : 'hidden'}`}
            >
                  {curPageVisible && (
                    <>
                      <HomePage
                        key={`home-${currentPageReloadKey}`}
                        headlines={headlines}
                        dockPos={dockPos}
                        dockViewStart={dockViewStart}
                    dockPixelOffset={dockPixelOffset}
                    dockSlidingFromPos={dockSlidingFromPos}
                        onSlideEnd={handleSlideEnd}
                        onSignOutRequest={handleOpenSignOutDialog}
                        onDockActivate={handleOpenDockPage}
                        onAddressGo={handleTypeWwwGo}
                        onSettingsRequest={openHomeSettings}
                      />

                  {openDockPageId && (
                    <DockPage
                      key={`${openDockPageId}-${currentPageReloadKey}`}
                      pageId={openDockPageId}
                      pageRef={dockPageRef}
                      subPageBackRef={dockSubPageBackRef}
                      onClose={handleCloseDockPage}
                      selection={selection}
                      onNavigate={handleOpenDockPage}
                      audio={audio}
                      musicNavPos={musicNavPos}
                      musicNavViewStart={musicNavViewStart}
                      musicNavPixelOffset={musicNavPixelOffset}
                      musicNavSlidingFromPos={musicNavSlidingFromPos}
                      onMusicNavSlideEnd={handleMusicNavSlideEnd}
                      mediaPlayer={mediaPlayer}
                      onSettingsAction={handleSettingsAction}
                      navigationErrorUrl={navigationErrorUrl}
                    />
                  )}

                  {messengerPanelMounted && (
                    <div
                      ref={messengerPanelStageRef}
                      className={`messenger-panel-stage${messengerPanelSlideOpen ? ' is-open' : ''}`}
                      onTransitionEnd={() => selection.updateFocusBox()}
                    >
                      <MessengerPanel
                        key={messengerPanelKey}
                        onSettings={openMessengerSettings}
                        selection={selection}
                      />
                    </div>
                  )}

                  {typeWwwPanelMounted && (
                    <div
                      ref={typeWwwPanelStageRef}
                      className={`type-www-panel-stage${typeWwwPanelSlideOpen ? ' is-open' : ''}`}
                      onTransitionEnd={() => selection.updateFocusBox()}
                    >
                      <TypeWwwPanel
                        key={typeWwwPanelKey}
                        onGo={handleTypeWwwGo}
                        onCancel={() => closeTypeWwwPanel()}
                        currentAddress={currentWebAddress}
                        initialUrl={typeWwwInitialUrl}
                      />
                    </div>
                  )}

	                  {mediaPanelMounted && (
	                    <div
	                      ref={mediaPanelStageRef}
	                      className={`music-media-panel-stage${mediaPanelSlideOpen ? ' is-open' : ''}`}
                      onTransitionEnd={() => selection.updateFocusBox()}
                    >
                      <MediaPlayerPanel
                        key={mediaPanelKey}
                        playbackState={mediaPlaybackState}
                        muted={mediaMuted}
                        elapsed={mediaElapsed}
                        duration={mediaDuration}
                        onPlay={playMedia}
                        onPause={pauseMedia}
                        onStop={stopMedia}
                        onToggleMute={toggleMediaMute}
                        onDone={() => closeMediaPanel({ stopBackground: true })}
                        onHide={() => closeMediaPanel({ stopBackground: false })}
                      />
                    </div>
	                  )}

	                  {musicCrossfadeActive && openDockPageId !== 'music' && (
	                    <div className="music-center-crossfade">
	                      <DockPage
	                        key={`music-crossfade-${currentPageReloadKey}`}
	                        pageId="music"
	                        pageRef={musicCrossfadePageRef}
	                        onClose={handleCloseDockPage}
	                        selection={selection}
	                        onNavigate={handleOpenDockPage}
	                        musicNavPos={musicNavPos}
	                        musicNavViewStart={musicNavViewStart}
	                        musicNavPixelOffset={musicNavPixelOffset}
	                        musicNavSlidingFromPos={musicNavSlidingFromPos}
	                        onMusicNavSlideEnd={handleMusicNavSlideEnd}
	                        mediaPlayer={mediaPlayer}
	                        onSettingsAction={handleSettingsAction}
	                        navigationErrorUrl={navigationErrorUrl}
	                      />
	                    </div>
	                  )}

	                  <div
	                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 confirm-dialog-container ${signOutDialogOpen ? '' : 'closed'}`}
	                    id="signout-dialog"
                  >
                    <div className="confirm-dialog-contents inset-0 flex flex-col">
                      <div className="flex items-start">
                        <img
                          className={`confirm-dialog-icon ${signOutShowing ? 'showing' : ''}`}
                          src={`${BASE}images/warning.png`}
                        />
                        <div className={`confirm-dialog-title ${signOutShowing ? 'showing' : ''}`}>
                          {'Are you sure you want to\nsign out of the MSN TV\nService?'}
                        </div>
                      </div>
                      <div className={`confirm-dialog-actions ${signOutShowing ? 'showing' : ''}`}>
                        <button
                          type="button"
                          className="sign-in-btn confirm-dialog-btn selectable"
                          data-select-x="0"
                          data-select-height="0"
                          data-select-layer="1"
                          onClick={handleConfirmSignOut}
                        >
                          Sign Out
                        </button>
                        <button
                          type="button"
                          className="cancel-error-btn confirm-dialog-btn selectable"
                          data-select-x="1"
                          data-select-height="0"
                          data-select-layer="1"
                          onClick={handleCancelSignOut}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {dockTransitionActive && (
              <div ref={dockTransitionRef} className="dock-transition-shell">
                <div className={`dock-transition-blank ${dockTransitionPhase === 'blank' ? '' : 'hidden'}`}></div>

                <div className="absolute bottom-0 left-0 right-0 flex items-center dock-transition-status">
                  <img className="status-bar-bg" src={`${BASE}images/statusbarbg.png`} />
                  <img className="absolute dock-transition-user-tile" src={`${BASE}images/tile22_s.png`} />
                  <h3 className="absolute dock-transition-clock">{clock}</h3>
                  <img
                    className={`absolute dock-transition-spinner ${dockTransitionPhase === 'contacting' ? '' : 'hidden'}`}
                    src={`${BASE}images/loadpage.png`}
                    style={{ transform: 'rotate(0deg)' }}
                  />
                  <img className="absolute status-bar-logo" src={`${BASE}images/msntvlogo.png`} />
                </div>

                <div
                  className={`absolute bottom-0 left-0 right-0 panel-container flex dock-transition-panel ${dockTransitionPhase === 'contacting' ? 'open-status-no-anim' : 'closed-no-anim'}`}
                >
                  <img className="panel-bg" src={`${BASE}images/signinpanelbg.png`} />
                  <div className="absolute flex flex-wrap">
                    <div className="shrink">
                      <h3 className="panel-title-white">Contacting MSN TV Service</h3>
                      <div className="text-gap"></div>
                    </div>
                    <div className="grow flex items-start">
                      <div className="base-other">
                        <img
                          className="progress-bar-fill"
                          src={`${BASE}images/barfill.png`}
                          style={{ width: '5.3vh' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="base-btn selectable ml-2"
                        data-select-x="0"
                        data-select-height="0"
                        data-select-layer="0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

<div className={`absolute bottom-0 left-0 right-0 network-container flex ${showSignInShell ? '' : 'invisible'}`}>
              <div className="flex items-center network-flex">
                <div className="shrink">
                  <h3 className="ui-title-white-2">My home network</h3>
                </div>
                <div className="grow flex items-center network-trio">
                  <div className="grow">
                    <div className="flex items-center">
                      <img
                        className="network-icon selectable"
                        data-select-id="network-photo"
                        data-select-x="0"
                        data-select-height="3"
                        data-select-layer="0"
                        src={`${BASE}images/photo.png`}
                        onClick={handleNetworkIcon}
                      />
                      <h3 className="ui-title-white-3">Photos</h3>
                    </div>
                  </div>
                  <div className="grow">
                    <div className="flex items-center">
                      <img
                        className="network-icon selectable"
                        data-select-id="network-music"
                        data-select-x="1"
                        data-select-height="3"
                        data-select-layer="0"
                        src={`${BASE}images/music.png`}
                        onClick={handleNetworkIcon}
                      />
                      <h3 className="ui-title-white-3">Music</h3>
                    </div>
                  </div>
                  <div className="grow">
                    <div className="flex items-center">
                      <img
                        className="network-icon selectable"
                        data-select-id="network-video"
                        data-select-x="2"
                        data-select-height="3"
                        data-select-layer="0"
                        src={`${BASE}images/video.png`}
                        onClick={handleNetworkIcon}
                      />
                      <h3 className="ui-title-white-3">Videos</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 panel-container flex ${panelClass}`}
              id="signin-panel"
            >
              <img className="panel-bg" src={`${BASE}images/signinpanelbg.png`} />
              <div className="absolute flex flex-wrap">
                <div className="shrink">
                  <h3 className="panel-title-white">{panelText}</h3>
                  <div className="text-gap"></div>
                </div>
                <div className="grow flex items-start">
                  <div className="base-other">
                    <img
                      className="progress-bar-fill"
                      src={`${BASE}images/barfill.png`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                  <button
                    type="button"
                    className="base-btn selectable ml-2"
                    data-select-x="0"
                    data-select-height="0"
                    data-select-layer="1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 error-dialog-container ${errorDialogOpen ? '' : 'closed'}`}
              id="error-dialog"
            >
              <div className="error-contents inset-0 flex flex-col">
                <div className="flex items-center">
                  <img
                    className={`absolute error-dialog-icon ${errorShowing ? 'showing' : ''}`}
                    src={`${BASE}images/warning.png`}
                  />
                  <h3 className={`error-title-dark ${errorShowing ? 'showing' : ''}`}>Please sign in</h3>
                </div>
                <pre className={`error-body ${errorShowing ? 'showing' : ''}`}>
                  {'Please sign in so we can verify your\naccount status.'}
                </pre>
                <pre className={`error-body ${errorShowing ? 'showing' : ''}`}>
                  {"Once you've signed in, you can\neither stay online and explore, or\nsign out and listen to music from\nyour home network or storage\ndevices."}
                </pre>
                <div className={`flex btn-pair ${errorShowing ? 'showing' : ''}`}>
                  <div className="grow"></div>
                  <button
                    type="button"
                    className="sign-in-btn sign-in-btn-variant selectable"
                    data-select-x="0"
                    data-select-height="0"
                    data-select-layer="2"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="cancel-error-btn selectable"
                    data-select-x="1"
                    data-select-height="0"
                    data-select-layer="2"
                    onClick={handleCancelError}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
