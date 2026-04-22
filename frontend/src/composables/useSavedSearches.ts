/**
 * 已保存搜索和历史记录管理 composable
 * 使用 localStorage 持久化存储
 */

export interface SavedSearch {
  id: string
  name: string
  filters: Record<string, unknown>
  createdAt: number
}

export interface QuickFilter {
  id: string
  label: string
  description?: string
  filters: Record<string, unknown>
  isSystem?: boolean
}

export interface HistoryEntry {
  query: string
  filters: Record<string, unknown>
  timestamp: number
}

const STORAGE_KEY_SAVED = 'rural-talent-saved-searches'
const STORAGE_KEY_HISTORY = 'rural-talent-search-history'
const MAX_HISTORY_ENTRIES = 10

const SYSTEM_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'experienced-farmers',
    label: '种植能手',
    description: '种植年限10年以上的种植人才',
    filters: { farmingYearsMin: 10 },
    isSystem: true,
  },
  {
    id: 'returning-youth',
    label: '返乡青年',
    description: '40岁以下的返乡创业人才',
    filters: { filterAge: '18-25' },
    isSystem: true,
  },
  {
    id: 'high-skill',
    label: '高技能人才',
    description: '技能等级4级以上',
    filters: { skillLevelMin: 4 },
    isSystem: true,
  },
  {
    id: 'cooperation-willing',
    label: '合作意愿强',
    description: '合作意愿强烈的人才',
    filters: { cooperationWillingness: 'strong' },
    isSystem: true,
  },
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage 写入失败时静默忽略
  }
}

export function useSavedSearches() {
    function getSavedSearches(): SavedSearch[] {
    return loadFromStorage<SavedSearch[]>(STORAGE_KEY_SAVED, [])
  }

  function saveSearch(name: string, filters: Record<string, unknown>): void {
    const searches = getSavedSearches()
    const entry: SavedSearch = {
      id: generateId(),
      name,
      filters,
      createdAt: Date.now(),
    }
    searches.unshift(entry)
    saveToStorage(STORAGE_KEY_SAVED, searches)
  }

  function deleteSavedSearch(id: string): void {
    const searches = getSavedSearches().filter(s => s.id !== id)
    saveToStorage(STORAGE_KEY_SAVED, searches)
  }

  function applySavedSearch(id: string): Record<string, unknown> | null {
    const searches = getSavedSearches()
    const found = searches.find(s => s.id === id)
    return found ? { ...found.filters } : null
  }

    function getSearchHistory(): HistoryEntry[] {
    return loadFromStorage<HistoryEntry[]>(STORAGE_KEY_HISTORY, [])
  }

  function addToHistory(query: string, filters: Record<string, unknown>): void {
    const history = getSearchHistory()
    const entry: HistoryEntry = {
      query,
      filters,
      timestamp: Date.now(),
    }
    // 去重：移除相同的查询条件
    const filtered = history.filter(h => {
      return JSON.stringify(h.filters) !== JSON.stringify(filters) || h.query !== query
    })
    filtered.unshift(entry)
    saveToStorage(STORAGE_KEY_HISTORY, filtered.slice(0, MAX_HISTORY_ENTRIES))
  }

  function clearHistory(): void {
    saveToStorage(STORAGE_KEY_HISTORY, [])
  }

    function getQuickFilters(): QuickFilter[] {
    return SYSTEM_QUICK_FILTERS
  }

  return {
    getSavedSearches,
    saveSearch,
    deleteSavedSearch,
    applySavedSearch,
    getSearchHistory,
    addToHistory,
    clearHistory,
    getQuickFilters,
  }
}
