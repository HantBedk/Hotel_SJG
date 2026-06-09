import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean, onEscape?: () => void) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusables[0]
    if (first) first.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const list = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )
      if (list.length === 0) return
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus()
    }
  }, [active, onEscape])

  return ref
}
