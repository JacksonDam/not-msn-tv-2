import { useRef, useCallback } from 'react'

export default function useAudio() {
  const ctxRef = useRef(null)
  const buffersRef = useRef({})
  const loadingRef = useRef({})

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }, [])

  const register = useCallback((name, url) => {
    if (buffersRef.current[name] || loadingRef.current[name]) return
    loadingRef.current[name] = true
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getCtx()
        return ctx.decodeAudioData(data)
      })
      .then((buffer) => {
        buffersRef.current[name] = buffer
      })
      .catch((err) => console.warn(`Failed to load sound "${name}":`, err))
  }, [getCtx])

  const play = useCallback((name) => {
    const buffer = buffersRef.current[name]
    if (!buffer) return
    const ctx = getCtx()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  }, [getCtx])

  return { register, play }
}
