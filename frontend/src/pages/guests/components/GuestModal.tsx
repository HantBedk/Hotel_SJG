import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Guest, DocumentType } from '@/types'
import { guestSchema, validate, type GuestInput } from '@/lib/validators'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'

export interface GuestFormData {
  full_name: string
  document_type: DocumentType
  document_number: string
  email: string
  phone: string
  nationality: string
  birth_date: string
  notes: string
}

interface Props {
  readonly guest: Guest | null
  readonly onSave: (data: GuestFormData) => void
  readonly onClose: () => void
  readonly isSaving: boolean
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
]

type StringGuestField = Exclude<keyof GuestFormData, 'document_type'>

export function GuestModal({ guest, onSave, onClose, isSaving }: Props) {
  const [form, setForm] = useState<GuestFormData>({
    full_name: guest?.full_name ?? '',
    document_type: guest?.document_type ?? 'cc',
    document_number: guest?.document_number ?? '',
    email: guest?.email ?? '',
    phone: guest?.phone ?? '',
    nationality: guest?.nationality ?? '',
    birth_date: guest?.birth_date ?? '',
    notes: guest?.notes ?? '',
  })

  useEffect(() => {
    if (guest) {
      setForm({
        full_name: guest.full_name,
        document_type: guest.document_type,
        document_number: guest.document_number,
        email: guest.email ?? '',
        phone: guest.phone ?? '',
        nationality: guest.nationality ?? '',
        birth_date: guest.birth_date ?? '',
        notes: guest.notes ?? '',
      })
    }
  }, [guest])

  const field = (key: StringGuestField) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]'

  const validation = useMemo(() => validate<GuestInput>(guestSchema, form), [form])
  const errors = validation.ok ? {} : validation.errors
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const dialogLabel = guest ? 'Editar huésped' : 'Nuevo huésped'
  const backdropClassName = 'absolute inset-0 border-0 p-0 cursor-default'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-label={dialogLabel}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-center justify-center pointer-events-none p-4',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className={cn(backdropClassName, 'pointer-events-auto bg-transparent')}
        onClick={onClose}
      />
      <div
        className="relative z-10 pointer-events-auto w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {guest ? 'Editar huésped' : 'Nuevo huésped'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
            style={{ background: 'var(--bg-input)' }}
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <input placeholder="Nombre completo *" className={inputClass} style={inputStyle} {...field('full_name')} />
            {errors.full_name && <p className="text-xs mt-1 text-red-500">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              className={inputClass}
              style={inputStyle}
              value={form.document_type}
              onChange={(e) => {
                const nextType = DOCUMENT_TYPES.find((d) => d.value === e.target.value)?.value ?? 'cc'
                setForm((f) => ({ ...f, document_type: nextType }))
              }}
            >
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <div>
              <input placeholder="Número *" className={inputClass} style={inputStyle} {...field('document_number')} />
              {errors.document_number && <p className="text-xs mt-1 text-red-500">{errors.document_number}</p>}
            </div>
          </div>

          <div>
            <input placeholder="Teléfono" className={inputClass} style={inputStyle} {...field('phone')} />
            {errors.phone && <p className="text-xs mt-1 text-red-500">{errors.phone}</p>}
          </div>
          <div>
            <input placeholder="Email" type="email" className={inputClass} style={inputStyle} {...field('email')} />
            {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email}</p>}
          </div>
          <input placeholder="Nacionalidad" className={inputClass} style={inputStyle} {...field('nationality')} />
          <input type="date" placeholder="Fecha de nacimiento" className={inputClass} style={inputStyle} {...field('birth_date')} />
          <textarea
            placeholder="Observaciones"
            rows={2}
            className={`${inputClass} resize-none`}
            style={inputStyle}
            {...field('notes')}
          />
        </div>

        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving || !validation.ok}
            onClick={() => onSave(form)}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
