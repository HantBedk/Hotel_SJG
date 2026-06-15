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
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    // Si ya hay un elemento del modal con autoFocus que tomó el foco (ej. un input),
    // respetalo; si no, focuseá el primer focusable.
    if (!previouslyFocused || !root.contains(previouslyFocused)) {
      const first = focusables[0]
      if (first) first.focus()
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.stopPropagation()
        onEscapeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const list = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )
      if (list.length === 0) return
      const firstEl = list[0]
      const lastEl = list.at(-1)
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl?.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus()
    }
  }, [active])

  return ref
}
