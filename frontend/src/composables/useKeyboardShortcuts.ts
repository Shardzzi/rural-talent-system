import { onMounted, onUnmounted } from 'vue'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  function handleKeydown(e: KeyboardEvent) {
    // Skip if typing in input/textarea/contenteditable
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only allow Escape shortcut when typing
      if (e.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
      const altMatch = shortcut.alt ? e.altKey : !e.altKey

      if (keyMatch && ctrlMatch && altMatch) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}

// Default shortcuts definition for reference
export const DEFAULT_SHORTCUTS = [
  { key: 'k', ctrl: true, description: '聚焦搜索框' },
  { key: '/', ctrl: false, description: '聚焦搜索框' },
  { key: 'n', ctrl: true, description: '新建人才（管理员）' },
  { key: 'Escape', ctrl: false, description: '关闭弹窗' },
  { key: '?', ctrl: true, description: '显示快捷键帮助' }
]
