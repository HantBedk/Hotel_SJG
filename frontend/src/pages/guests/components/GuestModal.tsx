import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Guest, DocumentType } from '@/types'

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
  guest: Guest | null
  onSave: (data: GuestFormData) => void
  onClose: () => void
  isSaving: boolean
}

const DOCUMENT_TYPES = [
  { value: 'cc',       label: 'Cédula de ciudadanía' },
  { value: 'ce',       label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
]

export function GuestModal({ guest, onSave, onClose, isSaving }: Props) {
  const [form, setForm] = useState<GuestFormData>({
    full_name:       guest?.full_name ?? '',
    document_type:   guest?.document_type ?? 'cc',
    document_number: guest?.document_number ?? '',
    email:           guest?.email ?? '',
    phone:           guest?.phone ?? '',
    nationality:     guest?.nationality ?? '',
    birth_date:      guest?.birth_date ?? '',
    notes:           guest?.notes ?? '',
  })

  useEffect(() => {
    if (guest) setForm({
      full_name:       guest.full_name,
      document_type:   guest.document_type,
      document_number: guest.document_number,
      email:           guest.email ?? '',
      phone:           guest.phone ?? '',
      nationality:     guest.nationality ?? '',
      birth_date:      guest.birth_date ?? '',
      notes:           guest.notes ?? '',
    })
  }, [guest])

  const field = (key: keyof GuestFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value } as GuestFormData)),
  })

  const inputStyle = {
    background: 'var(--bg-input)',
    border:     '1px solid var(--border-default)',
    color:      'var(--text-primary)',
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {guest ? 'Editar huésped' : 'Nuevo huésped'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: 'var(--bg-input)' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <input placeholder="Nombre completo *" className={inputClass} style={inputStyle} {...field('full_name')} />

          <div className="grid grid-cols-2 gap-3">
            <select className={inputClass} style={inputStyle} {...field('document_type')}>
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input placeholder="Número *" className={inputClass} style={inputStyle} {...field('document_number')} />
          </div>

          <input placeholder="Teléfono" className={inputClass} style={inputStyle} {...field('phone')} />
          <input placeholder="Email" type="email" className={inputClass} style={inputStyle} {...field('email')} />
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
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            disabled={isSaving || !form.full_name.trim() || !form.document_number.trim()}
            onClick={() => onSave(form)}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
