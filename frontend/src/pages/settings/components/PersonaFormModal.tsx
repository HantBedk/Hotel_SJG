import { useEffect, useMemo, useState } from 'react'
import { Building2, Info, Mail, X } from 'lucide-react'
import type { AdminPersona } from '@/types/admin'
import type { DocumentType, HotelSummary } from '@/types'
import { personaSchema, validate, type PersonaInput } from '@/lib/validators'
import { rolesRequireHotelAssignment, rolesRequireStaffEmail, isRealStaffEmail } from '@/lib/staffRoles'
import { HotelAssignmentField } from '@/components/settings/HotelAssignmentField'
import { PersonaRolePicker } from '@/components/settings/PersonaRolePicker'
import { PersonaRoleBadgeList } from '@/components/settings/PersonaRoleBadge'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { FormField, FormSection } from '@/components/person/FormField'
import { PersonNameFieldsInput } from '@/components/person/PersonNameFields'
import { PersonDocumentFields } from '@/components/person/PersonDocumentFields'
import { emptyPersonName, personNameFromGuest } from '@/types/person'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'

export interface PersonaFormData {
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
  roles: string[]
  hotel_ids: string[]
}

function contactEmail(persona: AdminPersona | null): string {
  const candidates = [persona?.email, persona?.user_email]
  for (const value of candidates) {
    const trimmed = value?.trim() ?? ''
    if (trimmed && isRealStaffEmail(trimmed)) return trimmed
  }
  return ''
}

function personaToForm(persona: AdminPersona | null, assignableHotels: HotelSummary[]): PersonaFormData {
  const name = personNameFromGuest(persona ?? {})
  const roles = persona?.roles?.length ? [...persona.roles] : ['guest']
  let hotelIds = persona?.hotel_ids ?? []
  if (hotelIds.length === 0 && rolesRequireHotelAssignment(roles) && assignableHotels.length === 1) {
    hotelIds = [assignableHotels[0].id]
  }
  return {
    ...name,
    document_type: (persona?.document_type as DocumentType) ?? 'cc',
    document_number: persona?.document_number ?? '',
    email: contactEmail(persona),
    phone: persona?.phone ?? '',
    nationality_id: persona?.nationality_id ?? '',
    birth_date: persona?.birth_date ?? '',
    notes: persona?.notes ?? '',
    roles,
    hotel_ids: hotelIds,
  }
}

function applyRoleChange(
  roles: string[],
  assignableHotels: HotelSummary[],
  hotelIds: string[],
): { roles: string[]; hotel_ids: string[] } {
  let nextHotelIds = hotelIds
  if (roles.includes('superadmin')) {
    nextHotelIds = []
  } else if (
    rolesRequireHotelAssignment(roles)
    && nextHotelIds.length === 0
    && assignableHotels.length === 1
  ) {
    nextHotelIds = [assignableHotels[0].id]
  }
  return { roles, hotel_ids: nextHotelIds }
}

interface StaffSummaryProps {
  readonly roles: string[]
  readonly hotelIds: string[]
  readonly assignableHotels: HotelSummary[]
  readonly email: string
}

function StaffSummary({ roles, hotelIds, assignableHotels, email }: StaffSummaryProps) {
  const hotelNames = assignableHotels
    .filter((h) => hotelIds.includes(h.id))
    .map((h) => h.name)

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-2"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)' }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        <Info size={14} />
        Resumen de personal
      </div>
      <PersonaRoleBadgeList roles={roles.filter((r) => r !== 'guest')} compact />
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1">
          <Mail size={12} />
          {email.trim() || 'Falta correo real'}
        </span>
        {hotelNames.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Building2 size={12} />
            {hotelNames.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

interface Props {
  readonly persona: AdminPersona | null
  readonly roleOptions: string[]
  readonly assignableHotels: HotelSummary[]
  readonly onSave: (data: PersonaFormData) => void
  readonly onClose: () => void
  readonly isSaving: boolean
}

export function PersonaFormModal({
  persona,
  roleOptions,
  assignableHotels,
  onSave,
  onClose,
  isSaving,
}: Props) {
  const [form, setForm] = useState<PersonaFormData>(() => personaToForm(persona, assignableHotels))

  useEffect(() => {
    setForm(personaToForm(persona, assignableHotels))
  }, [persona, assignableHotels])

  const validation = useMemo(() => {
    const base = validate<PersonaInput>(personaSchema, form)
    if (!base.ok) return base
    if (rolesRequireStaffEmail(form.roles) && !isRealStaffEmail(form.email)) {
      return {
        ok: false as const,
        errors: {
          email: form.email.trim()
            ? 'Indica un correo electrónico real (no cuentas internas @personal.local).'
            : 'Correo real obligatorio para roles de personal.',
        },
      }
    }
    return base
  }, [form])

  const errors = validation.ok ? {} : validation.errors
  const isEditing = persona !== null
  const title = isEditing ? 'Editar persona' : 'Nueva persona'
  const showHotels = rolesRequireHotelAssignment(form.roles)
  const showStaffSummary = showHotels

  const patch = (data: Partial<PersonaFormData>) => setForm((f) => ({ ...f, ...data }))

  const handleRolesChange = (roles: string[]) => {
    patch(applyRoleChange(roles, assignableHotels, form.hotel_ids))
  }

  const saveLabel = isSaving ? 'Guardando…' : (isEditing ? 'Guardar cambios' : 'Crear persona')

  return (
    <Modal open onClose={onClose} size="lg" ariaLabel={title}>
      <div className="flex items-start justify-between px-5 pt-5 pb-2 shrink-0 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {isEditing && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {persona.full_name} · {persona.document_number}
            </p>
          )}
          {!isEditing && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Registra datos, roles y hoteles en un solo lugar.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full hover:opacity-80"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 overflow-y-auto space-y-6 max-h-[calc(90vh-9rem)]">
        <FormSection title="Identidad" description="Nombre e identificación oficial.">
          <PersonNameFieldsInput
            idPrefix="persona-name"
            value={form}
            onChange={patch}
            errors={{
              primer_nombre: errors.primer_nombre,
              segundo_nombre: errors.segundo_nombre,
              primer_apellido: errors.primer_apellido,
              segundo_apellido: errors.segundo_apellido,
            }}
          />
          <PersonDocumentFields
            idPrefix="persona-doc"
            documentType={form.document_type}
            documentNumber={form.document_number}
            nationalityId={form.nationality_id}
            documentNumberError={errors.document_number}
            onDocumentTypeChange={(document_type) => patch({ document_type })}
            onDocumentNumberChange={(document_number) => patch({ document_number })}
            onNationalityChange={(nationality_id) => patch({ nationality_id })}
          />
        </FormSection>

        <FormSection
          title="Roles"
          description="Selecciona uno o más roles. Los permisos se acumulan."
        >
          <PersonaRolePicker
            roleOptions={roleOptions}
            selected={form.roles}
            onChange={handleRolesChange}
          />
          {errors.roles && (
            <p className="text-xs mt-1" style={{ color: 'var(--status-occupied)' }}>{errors.roles}</p>
          )}
        </FormSection>

        {showHotels && (
          <FormSection
            title="Hoteles y acceso"
            description="El personal debe tener correo real y al menos un hotel asignado."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="persona-email"
                label="Correo electrónico"
                error={errors.email}
                required
                hint="Correo real definido por el administrador."
                className="sm:col-span-2"
              >
                <input
                  id="persona-email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                  placeholder="nombre@empresa.com"
                />
              </FormField>
              <FormField id="persona-phone" label="Teléfono" error={errors.phone}>
                <input
                  id="persona-phone"
                  type="tel"
                  autoComplete="off"
                  value={form.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                />
              </FormField>
            </div>
            <HotelAssignmentField
              idPrefix="persona"
              hotelIds={form.hotel_ids}
              assignableHotels={assignableHotels}
              onHotelIdsChange={(hotel_ids) => patch({ hotel_ids })}
            />
            {showStaffSummary && (
              <StaffSummary
                roles={form.roles}
                hotelIds={form.hotel_ids}
                assignableHotels={assignableHotels}
                email={form.email}
              />
            )}
          </FormSection>
        )}

        {!showHotels && (
          <FormSection title="Contacto" description="Opcional para huéspedes y perfiles sin rol de personal.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField id="persona-phone" label="Teléfono" error={errors.phone}>
                <input
                  id="persona-phone"
                  type="tel"
                  autoComplete="off"
                  value={form.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                />
              </FormField>
              <FormField id="persona-email" label="Correo electrónico" error={errors.email}>
                <input
                  id="persona-email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                  placeholder="opcional@correo.com"
                />
              </FormField>
            </div>
          </FormSection>
        )}

        <FormSection title="Información adicional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="persona-birth" label="Fecha de nacimiento">
              <input
                id="persona-birth"
                type="date"
                value={form.birth_date}
                onChange={(e) => patch({ birth_date: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
            <FormField id="persona-notes" label="Observaciones" className="sm:col-span-2">
              <textarea
                id="persona-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                className={`${personInputClass} resize-none`}
                style={personInputStyle}
                placeholder="Notas internas visibles solo para administración."
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
          {saveLabel}
        </button>
      </ModalFooter>
    </Modal>
  )
}

export const EMPTY_PERSONA_FORM: PersonaFormData = {
  ...emptyPersonName(),
  document_type: 'cc',
  document_number: '',
  email: '',
  phone: '',
  nationality_id: '',
  birth_date: '',
  notes: '',
  roles: ['guest'],
  hotel_ids: [],
}
