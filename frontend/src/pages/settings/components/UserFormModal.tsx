import type { SubmitEvent } from 'react'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormField, FormSection } from '@/components/person/FormField'
import { PersonNameFieldsInput } from '@/components/person/PersonNameFields'
import { NationalitySelect } from '@/components/person/NationalitySelect'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import type { AdminUser, HotelSummary } from '@/types'

export type UserForm = {
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  document_number: string
  phone: string
  nationality_id: string
  email: string
  password: string
  role: string
  is_active: boolean
  hotel_ids: string[]
}

const LOGIN_ROLES = new Set(['admin', 'superadmin', 'receptionist'])

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super administrador',
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  housekeeping: 'Camarera',
  maintenance: 'Mantenimiento',
}

function roleNeedsLogin(role: string): boolean {
  return LOGIN_ROLES.has(role)
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function userFormTitle(editing: AdminUser | null): string {
  if (editing) return `Editar usuario`
  return 'Nuevo usuario'
}

function requiresHotelAssignment(role: string): boolean {
  return role !== 'superadmin'
}

function toggleHotelAssignment(hotelIds: string[], hotelId: string, checked: boolean): string[] {
  if (checked) {
    return hotelIds.includes(hotelId) ? hotelIds : [...hotelIds, hotelId]
  }
  const next = hotelIds.filter((id) => id !== hotelId)
  return next.length === 0 ? hotelIds : next
}

interface UserHotelAssignmentProps {
  readonly role: string
  readonly hotelIds: string[]
  readonly assignableHotels: HotelSummary[]
  readonly onHotelIdsChange: (hotelIds: string[]) => void
}

function UserHotelAssignment({ role, hotelIds, assignableHotels, onHotelIdsChange }: UserHotelAssignmentProps) {
  if (!requiresHotelAssignment(role) || assignableHotels.length === 0) return null

  return (
    <FormField
      id="user-hotels"
      label="Hoteles asignados"
      required
      hint="El usuario solo verá datos de los hoteles seleccionados."
    >
      <div
        className="space-y-1 max-h-36 overflow-y-auto rounded-lg border px-3 py-2"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)' }}
      >
        {assignableHotels.map((hotel) => {
          const checkboxId = `user-hotel-${hotel.id}`
          const checked = hotelIds.includes(hotel.id)
          const isLastSelected = checked && hotelIds.length === 1
          return (
            <label
              key={hotel.id}
              htmlFor={checkboxId}
              className="flex items-center gap-2.5 py-1.5 text-sm cursor-pointer"
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                disabled={isLastSelected}
                onChange={(e) => onHotelIdsChange(toggleHotelAssignment(hotelIds, hotel.id, e.target.checked))}
              />
              <span style={{ color: 'var(--text-primary)' }}>{hotel.name}</span>
            </label>
          )
        })}
      </div>
    </FormField>
  )
}

interface UserFormModalProps {
  readonly editing: AdminUser | null
  readonly form: UserForm
  readonly roleNames: string[]
  readonly assignableHotels: HotelSummary[]
  readonly saving: boolean
  readonly onClose: () => void
  readonly onChange: (patch: Partial<UserForm>) => void
  readonly onHotelIdsChange: (hotelIds: string[]) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

export function UserFormModal({
  editing,
  form,
  roleNames,
  assignableHotels,
  saving,
  onClose,
  onChange,
  onHotelIdsChange,
  onSubmit,
}: UserFormModalProps) {
  const needsLogin = roleNeedsLogin(form.role)
  const title = userFormTitle(editing)

  return (
    <Modal open onClose={onClose} size="lg" ariaLabel={title}>
      <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {editing && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{editing.name}</p>
            )}
          </div>
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

        <input type="text" name="prevent-autofill" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
        <input type="password" name="prevent-autofill" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

        <div className="px-5 py-4 overflow-y-auto space-y-6 flex-1">
          <FormSection title="Datos personales" description="Información de la persona vinculada al usuario.">
            <PersonNameFieldsInput
              idPrefix="user-name"
              value={form}
              onChange={onChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField id="user-document" label="Documento de identidad">
                <input
                  id="user-document"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.document_number}
                  onChange={(e) => onChange({ document_number: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                />
              </FormField>
              <FormField id="user-nationality" label="Nacionalidad">
                <NationalitySelect
                  id="user-nationality"
                  value={form.nationality_id}
                  onChange={(nationality_id) => onChange({ nationality_id })}
                  withLabel={false}
                />
              </FormField>
            </div>
            <FormField id="user-phone" label="Celular">
              <input
                id="user-phone"
                type="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                className={personInputClass}
                style={personInputStyle}
              />
            </FormField>
          </FormSection>

          <FormSection
            title="Rol y acceso"
            description={needsLogin
              ? 'Define permisos y credenciales de ingreso al sistema.'
              : 'Este rol es solo para seguimiento interno y no requiere acceso al sistema.'}
          >
            <FormField id="user-role" label="Rol" required>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value
                  const patch: Partial<UserForm> = { role }
                  if (role === 'superadmin') {
                    patch.hotel_ids = []
                  } else if (form.hotel_ids.length === 0 && assignableHotels.length === 1) {
                    patch.hotel_ids = [assignableHotels[0].id]
                  }
                  onChange(patch)
                }}
                className={personInputClass}
                style={personInputStyle}
              >
                {roleNames.map((role) => (
                  <option key={role} value={role}>{roleLabel(role)}</option>
                ))}
              </select>
            </FormField>

            <UserHotelAssignment
              role={form.role}
              hotelIds={form.hotel_ids}
              assignableHotels={assignableHotels}
              onHotelIdsChange={onHotelIdsChange}
            />

            {needsLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField id="user-email" label="Correo de acceso" required className="sm:col-span-2">
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    required
                    autoComplete="off"
                    name="user-email-field"
                    onChange={(e) => onChange({ email: e.target.value })}
                    className={personInputClass}
                    style={personInputStyle}
                  />
                </FormField>
                <FormField
                  id="user-password"
                  label={editing ? 'Nueva contraseña' : 'Contraseña'}
                  required={!editing}
                  hint={editing ? 'Dejar vacío para mantener la actual.' : 'Mínimo 6 caracteres.'}
                  className="sm:col-span-2"
                >
                  <input
                    id="user-password"
                    type="password"
                    value={form.password}
                    required={!editing}
                    minLength={6}
                    autoComplete="new-password"
                    name="user-password-field"
                    onChange={(e) => onChange({ password: e.target.value })}
                    className={personInputClass}
                    style={personInputStyle}
                  />
                </FormField>
              </div>
            )}

            {editing && (
              <Checkbox
                id="user-is-active"
                checked={form.is_active}
                onChange={(is_active) => onChange({ is_active })}
                label="Usuario activo"
                className="w-full rounded-lg border px-3 py-2.5"
              />
            )}
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
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? 'Guardando…' : 'Guardar usuario'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
