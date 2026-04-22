import { ref, watch, onMounted, onUnmounted } from 'vue'

export function useCountUp(targetGetter: () => number, duration: number = 1500) {
  const displayValue = ref(0)
  let animationFrame: number | null = null

  function animate(from: number, to: number): void {
    const startTime = performance.now()
    function update(currentTime: number): void {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
      displayValue.value = Math.round(from + (to - from) * eased)
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update)
      }
    }
    if (animationFrame) cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(update)
  }

  onMounted(() => {
    const target = targetGetter()
    if (target > 0) animate(0, target)
  })

  watch(() => targetGetter(), (newVal, oldVal) => {
    if (newVal !== oldVal) animate(oldVal || 0, newVal)
  })

  onUnmounted(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })

  return { displayValue }
}
