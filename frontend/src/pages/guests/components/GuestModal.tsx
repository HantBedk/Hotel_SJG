import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Guest, DocumentType } from '@/types'
import { guestSchema, validate, type GuestInput } from '@/lib/validators'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { FormField, FormSection } from '@/components/person/FormField'
import { PersonNameFieldsInput } from '@/components/person/PersonNameFields'
import { PersonDocumentFields } from '@/components/person/PersonDocumentFields'
import { personNameFromGuest } from '@/types/person'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'

export interface GuestFormData {
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  document_type: DocumentType
  document_number: string
  email: string
  phone: string
  nationality_id: string
  birth_date: string
  notes: string
}

interface Props {
  readonly guest: Guest | null
  readonly onSave: (data: GuestFormData) => void
  readonly onClose: () => void
  readonly isSaving: boolean
}

function guestToForm(guest: Guest | null): GuestFormData {
  const name = personNameFromGuest(guest ?? {})
  return {
    ...name,
    document_type: guest?.document_type ?? 'cc',
    document_number: guest?.document_number ?? '',
    email: guest?.email ?? '',
    phone: guest?.phone ?? '',
    nationality_id: guest?.nationality_id ?? '',
    birth_date: guest?.birth_date ?? '',
    notes: guest?.notes ?? '',
  }
}

export function GuestModal({ guest, onSave, onClose, isSaving }: Props) {
  const [form, setForm] = useState<GuestFormData>(() => guestToForm(guest))

  useEffect(() => {
    setForm(guestToForm(guest))
  }, [guest])

  const validation = useMemo(() => validate<GuestInput>(guestSchema, form), [form])
  const errors = validation.ok ? {} : validation.errors
  const title = guest ? 'Editar huésped' : 'Nuevo huésped'

  const patch = (data: Partial<GuestFormData>) => setForm((f) => ({ ...f, ...data }))

  return (
    <Modal open onClose={onClose} size="lg" ariaLabel={title}>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 overflow-y-auto space-y-6 max-h-[calc(90vh-9rem)]">
        <FormSection title="Nombre completo" description="Registra los cuatro campos según el documento de identidad.">
          <PersonNameFieldsInput
            idPrefix="guest-name"
            value={form}
            onChange={patch}
            errors={{
              primer_nombre: errors.primer_nombre,
              segundo_nombre: errors.segundo_nombre,
              primer_apellido: errors.primer_apellido,
              segundo_apellido: errors.segundo_apellido,
            }}
          />
        </FormSection>

        <FormSection title="Identificación">
          <PersonDocumentFields
            idPrefix="guest-doc"
            documentType={form.document_type}
            documentNumber={form.document_number}
            nationalityId={form.nationality_id}
            documentNumberError={errors.document_number}
            onDocumentTypeChange={(document_type) => patch({ document_type })}
            onDocumentNumberChange={(document_number) => patch({ document_number })}
            onNationalityChange={(nationality_id) => patch({ nationality_id })}
          />
        </FormSection>

        <FormSection title="Contacto y notas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="guest-phone" label="Teléfono" error={errors.phone}>
              <input
                id="guest-phone"
                type="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="guest-email" label="Correo electrónico" error={errors.email}>
              <input
                id="guest-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="guest-birth" label="Fecha de nacimiento" className="sm:col-span-2">
              <input
                id="guest-birth"
                type="date"
                value={form.birth_date}
                onChange={(e) => patch({ birth_date: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="guest-notes" label="Observaciones" className="sm:col-span-2">
              <textarea
                id="guest-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                className={`${personInputClass} resize-none`}
                style={personInputStyle}
              />
            </FormField>
          </div>
        </FormSection>
      </div>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm border"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSaving || !validation.ok}
          onClick={() => onSave(form)}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          {isSaving ? 'Guardando…' : 'Guardar huésped'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
