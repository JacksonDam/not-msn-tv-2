import { useRef, useCallback, useEffect, useMemo } from 'react'

const RESUME_RETRY_DELAYS_MS = [0, 100, 250]
const RESUME_CYCLE_PAUSE_MS = 50
const LONG_HIDDEN_MS = 30000

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

export default function useAudio() {
  const ctxRef = useRef(null)
  const buffersRef = useRef({})
  const rawBuffersRef = useRef({})
  const pendingRef = useRef({})
  const sourcesRef = useRef(new Set())
  const hiddenAtRef = useRef(null)

  const createCtx = useCallback(() => {
    return new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  const stopTrackedSources = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop()
      } catch {
      }
      source.disconnect()
    })
    sourcesRef.current.clear()
  }, [])

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createCtx()
    }
    return ctxRef.current
  }, [createCtx])

  const rebuildCtx = useCallback(async () => {
    const oldCtx = ctxRef.current
    stopTrackedSources()
    if (oldCtx && oldCtx.state !== 'closed') {
      try {
        await oldCtx.close()
      } catch {
      }
    }
    ctxRef.current = createCtx()
    buffersRef.current = {}
    return ctxRef.current
  }, [createCtx, stopTrackedSources])

  const warmBuffer = useCallback(async (name) => {
    const ctx = getCtx()
    const cached = buffersRef.current[name]
    if (cached?.ctx === ctx) return cached.buffer

    const raw = rawBuffersRef.current[name] ?? await pendingRef.current[name]
    if (!raw) return null

    try {
      const buffer = await ctx.decodeAudioData(raw.slice(0))
      buffersRef.current[name] = { ctx, buffer }
      return buffer
    } catch {
      return null
    }
  }, [getCtx])

  const getBuffer = useCallback(async (ctx, name) => {
    const cached = buffersRef.current[name]
    if (cached?.ctx === ctx) return cached.buffer

    const raw = rawBuffersRef.current[name] ?? await pendingRef.current[name]
    if (!raw) return null

    try {
      const buffer = await ctx.decodeAudioData(raw.slice(0))
      buffersRef.current[name] = { ctx, buffer }
      return buffer
    } catch {
      return null
    }
  }, [])

  const warmAllBuffers = useCallback(() => {
    Object.keys(rawBuffersRef.current).forEach((name) => {
      void warmBuffer(name)
    })
  }, [warmBuffer])

  const ensureRunningCtx = useCallback(async ({ forceCycle = false, createIfMissing = true } = {}) => {
    let ctx = createIfMissing ? getCtx() : ctxRef.current
    if (!ctx) return null

    if (ctx.state === 'closed') {
      ctx = await rebuildCtx()
    }

    if (forceCycle) {
      if (ctx.state === 'running') {
        try {
          await ctx.suspend()
        } catch {
        }
      }

      if (ctx.state === 'suspended') {
        await wait(RESUME_CYCLE_PAUSE_MS)
      } else if (ctx.state === 'running') {
        ctx = await rebuildCtx()
      }
    }

    for (const delayMs of RESUME_RETRY_DELAYS_MS) {
      if (delayMs) {
        await wait(delayMs)
      }

      if (ctx.state === 'closed') {
        ctx = await rebuildCtx()
      }

      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        try {
          await ctx.resume()
        } catch {
        }
      }

      if (ctx.state === 'running') {
        warmAllBuffers()
        return ctx
      }
    }

    ctx = await rebuildCtx()

    for (const delayMs of RESUME_RETRY_DELAYS_MS) {
      if (delayMs) {
        await wait(delayMs)
      }

      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        try {
          await ctx.resume()
        } catch {
        }
      }

      if (ctx.state === 'running') {
        warmAllBuffers()
        return ctx
      }
    }

    return null
  }, [getCtx, rebuildCtx, warmAllBuffers])

  const suspendCtx = useCallback(async () => {
    const ctx = ctxRef.current
    if (!ctx || ctx.state === 'closed' || ctx.state === 'suspended') return

    if (ctx.state === 'running') {
      try {
        await ctx.suspend()
      } catch {
      }
    }
  }, [])

  const register = useCallback((name, url) => {
    if (rawBuffersRef.current[name] || pendingRef.current[name]) return
    pendingRef.current[name] = fetch(url)
      .then((res) => res.ok ? res.arrayBuffer() : null)
      .then((raw) => {
        if (raw) rawBuffersRef.current[name] = raw
        if (raw && ctxRef.current) void warmBuffer(name)
        return raw
      })
      .catch((err) => {
        console.warn(`Failed to load sound "${name}":`, err)
        return null
      })
  }, [warmBuffer])

  const play = useCallback(async (name) => {
    const forceCycle = hiddenAtRef.current !== null && document.visibilityState === 'visible'
    if (forceCycle) {
      hiddenAtRef.current = null
    }

    const ctx = await ensureRunningCtx({ forceCycle })
    if (!ctx) return

    const buffer = await getBuffer(ctx, name)
    if (!buffer) return

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    sourcesRef.current.add(source)
    return await new Promise((resolve) => {
      source.onended = () => {
        source.disconnect()
        sourcesRef.current.delete(source)
        resolve(true)
      }

      try {
        source.start(0)
      } catch {
        source.onended = null
        source.disconnect()
        sourcesRef.current.delete(source)
        resolve(false)
      }
    })
  }, [ensureRunningCtx, getBuffer])

  useEffect(() => {
    const unlockAudio = () => {
      void ensureRunningCtx()
    }

    const handleBackground = () => {
      if (hiddenAtRef.current === null) {
        hiddenAtRef.current = Date.now()
      }
      void suspendCtx()
    }

    const handleForeground = () => {
      if (document.visibilityState === 'hidden') return

      const hiddenAt = hiddenAtRef.current
      hiddenAtRef.current = null

      const wasHiddenLong =
        typeof hiddenAt === 'number' &&
        Date.now() - hiddenAt >= LONG_HIDDEN_MS

      void ensureRunningCtx({ forceCycle: wasHiddenLong, createIfMissing: false })
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleBackground()
      } else if (document.visibilityState === 'visible') {
        handleForeground()
      }
    }

    window.addEventListener('pointerdown', unlockAudio, true)
    window.addEventListener('keydown', unlockAudio, true)
    window.addEventListener('touchend', unlockAudio, true)
    window.addEventListener('pagehide', handleBackground)
    window.addEventListener('pageshow', handleForeground)
    window.addEventListener('focus', handleForeground)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true)
      window.removeEventListener('keydown', unlockAudio, true)
      window.removeEventListener('touchend', unlockAudio, true)
      window.removeEventListener('pagehide', handleBackground)
      window.removeEventListener('pageshow', handleForeground)
      window.removeEventListener('focus', handleForeground)
      document.removeEventListener('visibilitychange', handleVisibility)
      stopTrackedSources()
      const ctx = ctxRef.current
      if (ctx && ctx.state !== 'closed') {
        void ctx.close()
      }
    }
  }, [ensureRunningCtx, stopTrackedSources, suspendCtx])

  return useMemo(() => ({ register, play }), [register, play])
}
