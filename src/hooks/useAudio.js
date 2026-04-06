import { useRef, useCallback, useEffect } from 'react'

export default function useAudio() {
  const ctxRef = useRef(null)
  const buffersRef = useRef({})
  const rawBuffersRef = useRef({})
  const pendingRef = useRef({})
  const sourcesRef = useRef(new Set())

  const createCtx = useCallback(() => {
    return new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createCtx()
    }
    return ctxRef.current
  }, [createCtx])

  const rebuildCtx = useCallback(async () => {
    const oldCtx = ctxRef.current
    if (oldCtx && oldCtx.state !== 'closed') {
      try {
        await oldCtx.close()
      } catch {
      }
    }
    ctxRef.current = createCtx()
    buffersRef.current = {}
    return ctxRef.current
  }, [createCtx])

  const ensureRunningCtx = useCallback(async () => {
    let ctx = getCtx()

    if (ctx.state === 'closed') {
      ctx = await rebuildCtx()
    }

    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try {
        await ctx.resume()
      } catch {
      }
    }

    if (ctx.state !== 'running') {
      ctx = await rebuildCtx()
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        try {
          await ctx.resume()
        } catch {
          return null
        }
      }
    }

    return ctx.state === 'running' ? ctx : null
  }, [getCtx, rebuildCtx])

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

  const register = useCallback((name, url) => {
    if (rawBuffersRef.current[name] || pendingRef.current[name]) return
    pendingRef.current[name] = fetch(url)
      .then((res) => res.ok ? res.arrayBuffer() : null)
      .then((raw) => {
        if (raw) rawBuffersRef.current[name] = raw
        if (raw) void warmBuffer(name)
        return raw
      })
      .catch((err) => {
        console.warn(`Failed to load sound "${name}":`, err)
        return null
      })
  }, [warmBuffer])

  const play = useCallback(async (name) => {
    const ctx = await ensureRunningCtx()
    if (!ctx) return

    const buffer = await getBuffer(ctx, name)
    if (!buffer) return

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    sourcesRef.current.add(source)
    source.onended = () => {
      source.disconnect()
      sourcesRef.current.delete(source)
    }

    try {
      source.start(0)
    } catch {
      source.onended = null
      source.disconnect()
      sourcesRef.current.delete(source)
    }
  }, [ensureRunningCtx, getBuffer])

  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getCtx()
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        void ctx.resume()
      }
    }

    const resumeIfNeeded = async () => {
      const ctx = ctxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        try {
          await ctx.resume()
        } catch {
        }
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void resumeIfNeeded()
      }
    }

    window.addEventListener('pointerdown', unlockAudio, true)
    window.addEventListener('keydown', unlockAudio, true)
    window.addEventListener('touchend', unlockAudio, true)
    window.addEventListener('pageshow', resumeIfNeeded)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true)
      window.removeEventListener('keydown', unlockAudio, true)
      window.removeEventListener('touchend', unlockAudio, true)
      window.removeEventListener('pageshow', resumeIfNeeded)
      document.removeEventListener('visibilitychange', handleVisibility)
      sourcesRef.current.forEach((source) => {
        try {
          source.stop()
        } catch {
        }
        source.disconnect()
      })
      sourcesRef.current.clear()
      const ctx = ctxRef.current
      if (ctx && ctx.state !== 'closed') {
        void ctx.close()
      }
    }
  }, [getCtx])

  return { register, play }
}
