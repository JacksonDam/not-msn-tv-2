import { useRef, useCallback } from 'react'

export default function useAudio() {
  const ctxRef = useRef(null)
  const buffersRef = useRef({})
  const pendingRef = useRef({})

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const register = useCallback((name, url) => {
    if (buffersRef.current[name] || pendingRef.current[name]) return
    pendingRef.current[name] = fetch(url)
      .then((res) => res.arrayBuffer())
      .catch((err) => {
        console.warn(`Failed to load sound "${name}":`, err)
        return null
      })
  }, [])

  const play = useCallback(async (name) => {
    const ctx = getCtx()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (!buffersRef.current[name]) {
      const raw = await pendingRef.current[name]
      if (!raw) return
      try {
        buffersRef.current[name] = await ctx.decodeAudioData(raw.slice(0))
      } catch {
        return
      }
    }

    const source = ctx.createBufferSource()
    source.buffer = buffersRef.current[name]
    source.connect(ctx.destination)
    source.start(0)
  }, [getCtx])

  return { register, play }
}
