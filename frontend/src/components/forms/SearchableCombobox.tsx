import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'

export interface ComboboxOption {
  readonly value: string
  readonly label: string
  readonly hint?: string
}

interface SearchableComboboxProps {
  readonly id?: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: readonly ComboboxOption[]
  readonly placeholder?: string
  readonly searchPlaceholder?: string
  readonly disabled?: boolean
  readonly variant?: 'default' | 'sidebar'
  readonly className?: string
  readonly ariaLabel?: string
  readonly defaultOpen?: boolean
}

function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase()
}

function filterOptions(options: readonly ComboboxOption[], term: string): ComboboxOption[] {
  const q = normalizeSearchTerm(term)
  if (!q) return [...options]

  return options.filter((option) => {
    const haystack = [option.label, option.hint ?? ''].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

function findOptionIndex(options: readonly ComboboxOption[], value: string): number {
  return options.findIndex((option) => option.value === value)
}

function optionButtonClass(isSidebar: boolean, highlighted: boolean, active: boolean): string {
  const base = 'w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors'

  if (isSidebar) {
    const tone = highlighted
      ? 'bg-white/15 text-white'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
    return cn(base, tone, active && 'font-semibold')
  }

  return cn(base, highlighted && 'bg-[var(--bg-muted)]', active && 'font-semibold')
}

function searchHeaderBorderStyle(isSidebar: boolean): { borderColor: string } | undefined {
  if (isSidebar) return undefined
  return { borderColor: 'var(--border-default)' }
}

function optionButtonStyle(isSidebar: boolean): { color: string } | undefined {
  if (isSidebar) return undefined
  return { color: 'var(--text-primary)' }
}

export function SearchableCombobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  disabled = false,
  variant = 'default',
  className,
  ariaLabel,
  defaultOpen = false,
}: SearchableComboboxProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const optionsPanelId = `${controlId}-options`
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(defaultOpen)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => filterOptions(options, search), [options, search])
  const isSidebar = variant === 'sidebar'

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }

    const selectedIndex = findOptionIndex(filtered, value)
    setHighlightIndex(Math.max(selectedIndex, 0))
    searchRef.current?.focus()
  }, [open, value, filtered])

  useEffect(() => {
    setHighlightIndex((current) => {
      if (filtered.length === 0) return 0
      return Math.min(current, filtered.length - 1)
    })
  }, [filtered.length])

  const close = () => setOpen(false)

  const selectOption = (optionValue: string) => {
    onChange(optionValue)
    close()
  }

  const openPanel = () => {
    if (disabled) return
    setOpen(true)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (filtered.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((current) => (current + 1) % filtered.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((current) => (current - 1 + filtered.length) % filtered.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[highlightIndex]
      if (option) selectOption(option.value)
    }
  }

  const triggerClass = cn(
    'w-full flex items-center gap-2 rounded-lg text-left text-sm transition-colors',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    isSidebar
      ? 'px-2.5 py-2 text-xs text-white hover:bg-white/10'
      : cn(personInputClass, 'pr-9 py-2'),
    className,
  )

  const triggerStyle = isSidebar
    ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }
    : personInputStyle

  const panelClass = cn(
    'absolute z-50 mt-1 w-full rounded-lg border shadow-lg overflow-hidden',
    isSidebar ? 'min-w-[220px]' : '',
  )

  const panelStyle = isSidebar
    ? { background: 'var(--sidebar-bg)', borderColor: 'rgba(255,255,255,0.12)' }
    : { background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }

  const searchInputClass = cn(
    'w-full rounded-md border px-8 py-1.5 text-xs outline-none',
    isSidebar ? 'text-white placeholder:text-slate-400' : personInputClass,
  )

  const searchInputStyle = isSidebar
    ? {
      background: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.12)',
    }
    : personInputStyle

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        id={controlId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={optionsPanelId}
        aria-haspopup="true"
        onClick={() => (open ? close() : openPanel())}
        className={triggerClass}
        style={triggerStyle}
      >
        <span className="flex-1 truncate font-medium">
          {selected?.label ?? placeholder}
        </span>
        {selected?.hint && !isSidebar && (
          <span className="text-xs truncate shrink-0 max-w-[40%]" style={{ color: 'var(--text-muted)' }}>
            {selected.hint}
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn('shrink-0 transition-transform', open && 'rotate-180')}
          style={{ color: isSidebar ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div className={panelClass} style={panelStyle}>
          <div
            className={cn('p-2 border-b', isSidebar ? 'border-white/10' : '')}
            style={searchHeaderBorderStyle(isSidebar)}
          >
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isSidebar ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)' }}
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={searchInputClass}
                style={searchInputStyle}
              />
            </div>
          </div>

          <ul
            id={optionsPanelId}
            aria-labelledby={controlId}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 && (
              <li
                className="px-3 py-2 text-xs"
                style={{ color: isSidebar ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}
              >
                Sin resultados
              </li>
            )}

            {filtered.map((option, index) => {
              const active = option.value === value
              const highlighted = index === highlightIndex

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option.value)}
                    className={optionButtonClass(isSidebar, highlighted, active)}
                    style={optionButtonStyle(isSidebar)}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span
                          className="block truncate text-[10px] mt-0.5"
                          style={{ color: isSidebar ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)' }}
                        >
                          {option.hint}
                        </span>
                      )}
                    </span>
                    {active && (
                      <Check
                        size={13}
                        className="shrink-0"
                        style={{ color: isSidebar ? 'white' : 'var(--color-primary)' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
