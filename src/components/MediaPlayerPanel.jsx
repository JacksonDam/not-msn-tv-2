import { useEffect, useMemo, useRef, useState } from 'react'

const BASE = import.meta.env.BASE_URL
const MEDIA_ASSET_BASE = `${BASE}images/pages/media/`
const DURATION_SECONDS = 36

const VISIBLE_CONTROLS = [
  { id: 'play', label: 'PLAY', icon: 'PanelPlayerControlPlay.png' },
  { id: 'pause', label: 'PAUSE', icon: 'PanelPlayerControlPause.png' },
  { id: 'stop', label: 'STOP', icon: 'PanelPlayerControlStop.png' },
]

const PRELOAD_CONTROL_ASSETS = [
  { id: 'ff', label: 'FF', icon: 'PanelPlayerControlFF.png' },
  { id: 'prev', label: 'PREV', icon: 'PanelPlayerControlPrev.png' },
  { id: 'next', label: 'NEXT', icon: 'PanelPlayerControlNext.png' },
  { id: 'rew', label: 'REW', icon: 'PanelPlayerControlREW.png' },
]

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function Visualizer({ paused = false }) {
  const vid1Ref = useRef(null)
  const vid2Ref = useRef(null)
  const [showSecond, setShowSecond] = useState(false)

  useEffect(() => {
    const v1 = vid1Ref.current
    if (!v1) return
    if (!paused) {
      v1.play().catch(() => {})
    }

    const onEnded = () => {
      setShowSecond(true)
      const v2 = vid2Ref.current
      if (v2 && !paused) v2.play().catch(() => {})
    }
    v1.addEventListener('ended', onEnded)
    return () => v1.removeEventListener('ended', onEnded)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentVideo = showSecond ? vid2Ref.current : vid1Ref.current
    if (!currentVideo) return

    if (paused) {
      currentVideo.pause()
      return
    }

    currentVideo.play().catch(() => {})
  }, [paused, showSecond])

  return (
    <div className="media-player-visualizer" aria-hidden="true">
      <video
        ref={vid1Ref}
        className="media-player-vis-video"
        src={`${MEDIA_ASSET_BASE}PanelPlayerVisualization_1.mp4`}
        muted
        playsInline
        style={{ display: showSecond ? 'none' : 'block' }}
      />
      <video
        ref={vid2Ref}
        className="media-player-vis-video"
        src={`${MEDIA_ASSET_BASE}PanelPlayerVisualization_2.mp4`}
        muted
        playsInline
        loop
        style={{ display: showSecond ? 'block' : 'none' }}
      />
    </div>
  )
}

export default function MediaPlayerPanel({
  playbackState = 'stopped',
  muted = false,
  elapsed = 0,
  duration = DURATION_SECONDS,
  onPlay,
  onPause,
  onStop,
  onToggleMute,
  onDone,
  onHide,
}) {
  const phase = playbackState

  const status = useMemo(() => {
    if (phase === 'buffering') return 'Opening'
    if (phase === 'paused') return 'Paused'
    if (phase === 'stopped') return 'Stopped'
    return 'Playing'
  }, [phase])

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : DURATION_SECONDS
  const progress = phase === 'buffering'
    ? 8
    : phase === 'stopped'
      ? 0
      : Math.min(100, (elapsed / safeDuration) * 100)

  const handleControl = (controlId) => {
    if (controlId === 'play') {
      onPlay?.()
      return
    }

    if (controlId === 'pause') {
      onPause?.()
      return
    }

    if (controlId === 'stop') {
      onStop?.()
      return
    }

    if (controlId === 'prev') {
      onPlay?.()
      return
    }

    if (controlId === 'next') {
      onPlay?.()
      return
    }

    if (controlId === 'rew' || controlId === 'ff') return
  }

  return (
    <section className={`media-player-panel media-player-panel-${phase}`} aria-label="Media player">
      <div className="media-player-body">
        <div className="media-player-screen">
          <img
            className="media-player-default-screen"
            src={`${MEDIA_ASSET_BASE}PanelPlayerDefaultScreen.jpg`}
            alt=""
          />
          {phase === 'buffering' && (
            <div className="media-player-opening">
              <img src={`${MEDIA_ASSET_BASE}PanelPlayerOpening.gif`} alt="" />
            </div>
          )}
          {(phase === 'playing' || phase === 'paused') && <Visualizer paused={phase === 'paused'} />}
        </div>

        <div className="media-player-info">
          <div className="media-player-now-title">Now playing</div>
          <div className="media-player-track-list">
            <div className="media-player-field">
              <div className="media-player-field-label">Chill Jingle</div>
              <div className="media-player-field-copy">(BGM)</div>
            </div>
            <div className="media-player-field">
              <div className="media-player-field-label">Title</div>
              <div className="media-player-field-copy">WebTV</div>
            </div>
          </div>
          <button
            type="button"
            className="media-player-change-images selectable"
            data-select-x="4"
            data-select-height="2"
            data-select-layer="0"
          >
            Change audio images
          </button>
        </div>

        <div className="media-player-progress">
          <span className="media-player-time-current">{formatTime(elapsed)}</span>
          <div className="media-player-progress-track">
            <img
              className="media-player-progress-fill"
              src={`${BASE}images/barfill.png`}
              alt=""
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="media-player-time-total">{formatTime(safeDuration)}</span>
          <span className="media-player-status">{status}</span>
        </div>
      </div>

      <div className="media-player-bottom-bar">
        <div className="media-player-controls">
          <button
            type="button"
            className="media-player-control selectable"
            data-select-id="media-control-mute"
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
            data-select-x="0"
            data-select-height="0"
            data-select-layer="0"
            onClick={onToggleMute}
          >
            <img
              src={`${MEDIA_ASSET_BASE}${muted ? 'PanelPlayerControlUnMute.png' : 'PanelPlayerControlMute.png'}`}
              alt=""
            />
          </button>
          {VISIBLE_CONTROLS.map((control, index) => (
            <button
              key={control.id}
              type="button"
              className="media-player-control selectable"
              data-select-id={`media-control-${control.id}`}
              {...(control.id === 'stop' ? { 'data-select-right': 'media-action-fullscreen' } : {})}
              aria-label={control.label}
              title={control.label}
              data-select-x={index + 1}
              data-select-height="0"
              data-select-layer="0"
              onClick={() => handleControl(control.id)}
            >
              <img src={`${MEDIA_ASSET_BASE}${control.icon}`} alt="" />
            </button>
          ))}
        </div>

        <div className="media-player-preload-controls" aria-hidden="true">
          {PRELOAD_CONTROL_ASSETS.map((control) => (
            <img key={control.id} src={`${MEDIA_ASSET_BASE}${control.icon}`} alt="" />
          ))}
        </div>

        <div className="media-player-actions">
          <button
            type="button"
            className="media-player-action selectable"
            data-select-id="media-action-fullscreen"
            data-select-left="media-control-stop"
            data-select-down="media-action-hide"
            data-select-x="1"
            data-select-height="1"
            data-select-layer="0"
          >
            Full Screen
          </button>
          <button
            type="button"
            className="media-player-action selectable"
            data-select-id="media-action-hide"
            data-select-left="media-control-stop"
            data-select-up="media-action-fullscreen"
            data-select-right="media-action-done"
            data-select-x="2"
            data-select-height="1"
            data-select-layer="0"
            onClick={onHide}
          >
            Hide
          </button>
          <button
            type="button"
            className="media-player-action selectable"
            data-select-id="media-action-done"
            data-select-left="media-action-hide"
            data-select-up="media-action-fullscreen"
            data-select-x="3"
            data-select-height="1"
            data-select-layer="0"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </div>
    </section>
  )
}
