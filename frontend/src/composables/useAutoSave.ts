import { ref, type Ref } from 'vue'

interface DraftMeta {
  timestamp: number
  data: unknown
}

const DRAFT_PREFIX = 'person-form-draft-'
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function cleanupExpiredDrafts(): void {
  const now = Date.now()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(DRAFT_PREFIX)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const meta: DraftMeta = JSON.parse(raw)
          if (now - meta.timestamp > DRAFT_TTL_MS) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        localStorage.removeItem(key!)
      }
    }
  }
}

export function useAutoSave(key: string, data: Ref<unknown>, interval = 5000) {
  const draftKey = `${DRAFT_PREFIX}${key}`
  const hasDraft = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null
  let lastSaved = ''

  function saveDraft(): void {
    try {
      const payload: DraftMeta = {
        timestamp: Date.now(),
        data: data.value
      }
      const serialized = JSON.stringify(payload)
      if (serialized !== lastSaved) {
        localStorage.setItem(draftKey, serialized)
        lastSaved = serialized
      }
      hasDraft.value = true
    } catch {
      // localStorage full or unavailable — silently skip
    }
  }

  function loadDraft(): unknown | null {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return null
      const meta: DraftMeta = JSON.parse(raw)
      if (Date.now() - meta.timestamp > DRAFT_TTL_MS) {
        clearDraft()
        return null
      }
      hasDraft.value = true
      return meta.data
    } catch {
      return null
    }
  }

  function clearDraft(): void {
    localStorage.removeItem(draftKey)
    hasDraft.value = false
    lastSaved = ''
  }

  function startAutoSave(): void {
    stopAutoSave()
    timer = setInterval(saveDraft, interval)
  }

  function stopAutoSave(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  cleanupExpiredDrafts()

  hasDraft.value = localStorage.getItem(draftKey) !== null

  return {
    hasDraft,
    loadDraft,
    clearDraft,
    saveDraft,
    startAutoSave,
    stopAutoSave
  }
}
