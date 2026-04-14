const activeAnimations = new WeakMap()

export default function animateScrollTop(node, nextTop, duration = 100, options = {}) {
  if (!node) return false
  const { onStart, onComplete } = options

  const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight)
  const targetTop = Math.max(0, Math.min(nextTop, maxScrollTop))
  const startTop = node.scrollTop

  if (Math.abs(targetTop - startTop) < 1) {
    node.scrollTop = targetTop
    return false
  }

  const existing = activeAnimations.get(node)
  if (existing) {
    window.cancelAnimationFrame(existing.frame)
  }

  onStart?.()
  const startedAt = window.performance.now()

  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    node.scrollTop = startTop + (targetTop - startTop) * progress

    if (progress < 1) {
      activeAnimations.set(node, { frame: window.requestAnimationFrame(tick) })
      return
    }

    node.scrollTop = targetTop
    activeAnimations.delete(node)
    onComplete?.()
  }

  activeAnimations.set(node, { frame: window.requestAnimationFrame(tick) })
  return true
}
