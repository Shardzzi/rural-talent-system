import { useRoute } from 'vue-router'

export interface PreservedFilterState {
  [key: string]: unknown
}

export interface PreservedRouteState {
  searchKeyword?: string
  currentPage?: number
  pageSize?: number
  filters?: PreservedFilterState
  scrollY?: number
}

const STORAGE_PREFIX = 'state-preservation:'

const ROUTE_SECTION_MAP: Record<string, string> = {
  home: 'public',
  talents: 'public',
  guest: 'public',
  admin: 'admin',
  analytics: 'admin',
  user: 'user',
  profile: 'user',
  login: 'auth'
}

const normalizeRouteKey = (routeName: string | symbol | null | undefined): string | null => {
  if (typeof routeName === 'string' && routeName.trim()) {
    return routeName.trim().toLowerCase()
  }

  return null
}

const getStorageKey = (routeName: string | symbol | null | undefined): string | null => {
  const normalizedKey = normalizeRouteKey(routeName)
  if (!normalizedKey) return null

  return `${STORAGE_PREFIX}${normalizedKey}`
}

const getSectionKey = (routeName: string | symbol | null | undefined): string | null => {
  const normalizedKey = normalizeRouteKey(routeName)
  if (!normalizedKey) return null

  return ROUTE_SECTION_MAP[normalizedKey] ?? normalizedKey
}

const readJson = (storageKey: string): PreservedRouteState | undefined => {
  const rawValue = sessionStorage.getItem(storageKey)
  if (!rawValue) return undefined

  try {
    return JSON.parse(rawValue) as PreservedRouteState
  } catch {
    sessionStorage.removeItem(storageKey)
    return undefined
  }
}

const writeJson = (storageKey: string, state: PreservedRouteState): void => {
  sessionStorage.setItem(storageKey, JSON.stringify(state))
}

const removeByPredicate = (predicate: (key: string) => boolean): void => {
  const keysToRemove: string[] = []

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index)
    if (key && predicate(key)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => sessionStorage.removeItem(key))
}

export const saveState = (
  routeName: string | symbol | null | undefined,
  state: PreservedRouteState
): void => {
  const storageKey = getStorageKey(routeName)
  if (!storageKey) return

  try {
    writeJson(storageKey, state)
  } catch (error) {
    console.warn('保存路由状态失败:', error)
  }
}

export const restoreState = (
  routeName: string | symbol | null | undefined
): PreservedRouteState | undefined => {
  const storageKey = getStorageKey(routeName)
  if (!storageKey) return undefined

  try {
    return readJson(storageKey)
  } catch (error) {
    console.warn('恢复路由状态失败:', error)
    return undefined
  }
}

export const clearState = (
  routeName: string | symbol | null | undefined
): void => {
  const storageKey = getStorageKey(routeName)
  if (!storageKey) return

  sessionStorage.removeItem(storageKey)
}

export const clearSectionState = (
  routeName: string | symbol | null | undefined
): void => {
  const sectionKey = getSectionKey(routeName)
  if (!sectionKey) return

  removeByPredicate(key => {
    if (!key.startsWith(STORAGE_PREFIX)) {
      return false
    }

    const routeKey = key.slice(STORAGE_PREFIX.length)
    return getSectionKey(routeKey) !== sectionKey
  })
}

export const clearStateForNavigation = (
  fromRouteName: string | symbol | null | undefined,
  toRouteName: string | symbol | null | undefined
): void => {
  const fromSectionKey = getSectionKey(fromRouteName)
  const toSectionKey = getSectionKey(toRouteName)

  if (!fromSectionKey || !toSectionKey || fromSectionKey === toSectionKey) {
    return
  }

  clearSectionState(toRouteName)
}

export function useStatePreservation() {
  const route = useRoute()

  const routeKey = () => route.name

  return {
    saveState: (state: PreservedRouteState) => saveState(routeKey(), state),
    restoreState: () => restoreState(routeKey()),
    clearState: () => clearState(routeKey()),
    clearSectionState: () => clearSectionState(routeKey())
  }
}
