import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface UseInfiniteScrollOptions {
  /** Distance in px from bottom before triggering loadMore */
  threshold?: number
  /** Whether infinite scroll is currently enabled */
  enabled?: boolean
}

export function useInfiniteScroll(
  containerRef: Ref<HTMLElement | null>,
  sentinelRef: Ref<HTMLElement | null>,
  loadMore: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 200, enabled = true } = options

  const isLoading = ref(false)
  let observer: IntersectionObserver | null = null

  function handleIntersect(entries: IntersectionObserverEntry[]): void {
    if (!enabled) return
    const entry = entries[0]
    if (entry && entry.isIntersecting && !isLoading.value) {
      triggerLoad()
    }
  }

  async function triggerLoad(): Promise<void> {
    if (isLoading.value) return
    isLoading.value = true
    try {
      await loadMore()
    } finally {
      isLoading.value = false
    }
  }

  function setupObserver(): void {
    if (!sentinelRef.value) return
    teardownObserver()

    observer = new IntersectionObserver(handleIntersect, {
      root: containerRef.value,
      rootMargin: `${threshold}px 0px 0px 0px`,
      threshold: 0
    })

    observer.observe(sentinelRef.value)
  }

  function teardownObserver(): void {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    // Use nextTick to ensure DOM is ready
    setTimeout(setupObserver, 0)
  })

  onUnmounted(() => {
    teardownObserver()
  })

  // Re-observe when sentinel element changes
  watch(sentinelRef, (newVal) => {
    if (newVal && enabled) {
      setupObserver()
    }
  })

  return {
    isLoading,
    /** Manually trigger a load (useful for initial load) */
    triggerLoad
  }
}
