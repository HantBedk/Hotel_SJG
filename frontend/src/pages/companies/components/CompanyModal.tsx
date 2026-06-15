import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Company } from '@/types'
import { companySchema, validate, type CompanyInput } from '@/lib/validators'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'

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
  readonly company: Company | null
  readonly onSave: (data: CompanyFormData) => void
  readonly onClose: () => void
  readonly isSaving: boolean
}

export function CompanyModal({ company, onSave, onClose, isSaving }: Props) {
  const [form, setForm] = useState<CompanyFormData>({
    name: company?.name ?? '',
    nit: company?.nit ?? '',
    address: company?.address ?? '',
    phone: company?.phone ?? '',
    email: company?.email ?? '',
    contact_name: company?.contact_name ?? '',
    notes: company?.notes ?? '',
  })

  useEffect(() => {
    if (company) setForm({
      name: company.name,
      nit: company.nit,
      address: company.address ?? '',
      phone: company.phone ?? '',
      email: company.email ?? '',
      contact_name: company.contact_name ?? '',
      notes: company.notes ?? '',
    })
  }, [company])

  const field = (key: keyof CompanyFormData) => ({
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

  const validation = useMemo(() => validate<CompanyInput>(companySchema, form), [form])
  const errors = validation.ok ? {} : validation.errors
  const dialogRef = useFocusTrap<HTMLDialogElement>(true, onClose)
  const dialogLabel = company ? 'Editar empresa' : 'Nueva empresa'
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
            {company ? 'Editar empresa' : 'Nueva empresa'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: 'var(--bg-input)' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <input placeholder="Razón social *" className={inputClass} style={inputStyle} {...field('name')} />
            {errors.name && <p className="text-xs mt-1 text-red-500">{errors.name}</p>}
          </div>
          <div>
            <input placeholder="NIT *" className={inputClass} style={inputStyle} {...field('nit')} />
            {errors.nit && <p className="text-xs mt-1 text-red-500">{errors.nit}</p>}
          </div>
          <input placeholder="Dirección" className={inputClass} style={inputStyle} {...field('address')} />
          <div>
            <input placeholder="Teléfono" className={inputClass} style={inputStyle} {...field('phone')} />
            {errors.phone && <p className="text-xs mt-1 text-red-500">{errors.phone}</p>}
          </div>
          <div>
            <input placeholder="Email" type="email" className={inputClass} style={inputStyle} {...field('email')} />
            {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email}</p>}
          </div>
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
