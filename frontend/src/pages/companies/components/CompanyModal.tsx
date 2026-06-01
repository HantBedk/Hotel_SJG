import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Company } from '@/types'

export interface CompanyFormData {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  contact_name: string
  notes: string
}

interface Props {
  company: Company | null
  onSave: (data: CompanyFormData) => void
  onClose: () => void
  isSaving: boolean
}

export function CompanyModal({ company, onSave, onClose, isSaving }: Props) {
  const [form, setForm] = useState<CompanyFormData>({
    name:         company?.name ?? '',
    nit:          company?.nit ?? '',
    address:      company?.address ?? '',
    phone:        company?.phone ?? '',
    email:        company?.email ?? '',
    contact_name: company?.contact_name ?? '',
    notes:        company?.notes ?? '',
  })

  useEffect(() => {
    if (company) setForm({
      name:         company.name,
      nit:          company.nit,
      address:      company.address ?? '',
      phone:        company.phone ?? '',
      email:        company.email ?? '',
      contact_name: company.contact_name ?? '',
      notes:        company.notes ?? '',
    })
  }, [company])

  const field = (key: keyof CompanyFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
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
            {company ? 'Editar empresa' : 'Nueva empresa'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: 'var(--bg-input)' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <input placeholder="Razón social *" className={inputClass} style={inputStyle} {...field('name')} />
          <input placeholder="NIT *" className={inputClass} style={inputStyle} {...field('nit')} />
          <input placeholder="Dirección" className={inputClass} style={inputStyle} {...field('address')} />
          <input placeholder="Teléfono" className={inputClass} style={inputStyle} {...field('phone')} />
          <input placeholder="Email" type="email" className={inputClass} style={inputStyle} {...field('email')} />
          <input placeholder="Nombre del contacto" className={inputClass} style={inputStyle} {...field('contact_name')} />
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
            disabled={isSaving || !form.name.trim() || !form.nit.trim()}
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
