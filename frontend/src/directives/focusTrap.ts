import type { Directive, DirectiveBinding } from 'vue'

const handlerMap = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>()

function getFocusableElements(el: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  return Array.from(el.querySelectorAll<HTMLElement>(selector))
}

function handleKeydown(e: KeyboardEvent, el: HTMLElement) {
  if (e.key !== 'Tab') return

  const focusable = getFocusableElements(el)
  if (focusable.length === 0) {
    e.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey) {
    if (document.activeElement === first || !el.contains(document.activeElement)) {
      e.preventDefault()
      last.focus()
    }
  } else {
    if (document.activeElement === last || !el.contains(document.activeElement)) {
      e.preventDefault()
      first.focus()
    }
  }
}

export const vFocusTrap: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    if (binding.value !== false) {
      const handler = (e: KeyboardEvent) => handleKeydown(e, el)
      handlerMap.set(el, handler)
      el.addEventListener('keydown', handler)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    if (binding.value !== false && !handlerMap.has(el)) {
      const handler = (e: KeyboardEvent) => handleKeydown(e, el)
      handlerMap.set(el, handler)
      el.addEventListener('keydown', handler)
    } else if (binding.value === false && handlerMap.has(el)) {
      const handler = handlerMap.get(el)
      if (handler) {
        el.removeEventListener('keydown', handler)
        handlerMap.delete(el)
      }
    }
  },
  unmounted(el: HTMLElement) {
    const handler = handlerMap.get(el)
    if (handler) {
      el.removeEventListener('keydown', handler)
      handlerMap.delete(el)
    }
  }
}
