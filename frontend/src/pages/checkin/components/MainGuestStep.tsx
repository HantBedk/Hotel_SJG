import { type RefObject } from 'react'
import { Search, Plus, User } from 'lucide-react'
import type { Guest } from '@/types'
import { cn } from '@/lib/cn'
import { DOCUMENT_TYPES, inputCls, inputStyle } from '@/pages/checkin/constants'
import type { CompanionForm } from '@/pages/checkin/types'
import { CompanionRow, GuestResultList } from '@/pages/checkin/components/WizardFieldComponents'

interface MainGuestStepProps {
  readonly guestInputRef: RefObject<HTMLInputElement | null>
  readonly isNewGuest: boolean
  readonly newGuest: {
    full_name: string
    document_type: string
    document_number: string
    phone: string
    email: string
    nationality: string
  }
  readonly guest: Guest | null
  readonly guestSearch: string
  readonly guestResults: Guest[]
  readonly companions: CompanionForm[]
  readonly withCompany: boolean
  readonly onNewGuestChange: (patch: Partial<MainGuestStepProps['newGuest']>) => void
  readonly onGuestSearchChange: (value: string) => void
  readonly onSelectGuest: (guest: Guest) => void
  readonly onClearGuest: () => void
  readonly onStartNewGuest: () => void
  readonly onBackToSearch: () => void
  readonly onAddCompanion: () => void
  readonly onCompanionNameChange: (formKey: string, value: string) => void
  readonly onCompanionRelationshipChange: (formKey: string, value: string) => void
  readonly onRemoveCompanion: (formKey: string) => void
  readonly onWithCompanyChange: (checked: boolean) => void
}

export function MainGuestStep({
  guestInputRef,
  isNewGuest,
  newGuest,
  guest,
  guestSearch,
  guestResults,
  companions,
  withCompany,
  onNewGuestChange,
  onGuestSearchChange,
  onSelectGuest,
  onClearGuest,
  onStartNewGuest,
  onBackToSearch,
  onAddCompanion,
  onCompanionNameChange,
  onCompanionRelationshipChange,
  onRemoveCompanion,
  onWithCompanyChange,
}: MainGuestStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        TITULAR DE LA RESERVA
      </p>

      {isNewGuest ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                ref={guestInputRef}
                placeholder="Nombre completo *"
                value={newGuest.full_name}
                onChange={(e) => onNewGuestChange({ full_name: e.target.value })}
                className={cn('w-full', inputCls)}
                style={inputStyle}
              />
            </div>
            <select
              value={newGuest.document_type}
              onChange={(e) => onNewGuestChange({ document_type: e.target.value })}
              className={inputCls}
              style={inputStyle}
            >
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input
              placeholder="Número de documento *"
              value={newGuest.document_number}
              onChange={(e) => onNewGuestChange({ document_number: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Teléfono"
              value={newGuest.phone}
              onChange={(e) => onNewGuestChange({ phone: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              value={newGuest.email}
              onChange={(e) => onNewGuestChange({ email: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            onClick={onBackToSearch}
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Buscar huésped existente
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={guestInputRef}
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              value={guestSearch}
              onChange={(e) => onGuestSearchChange(e.target.value)}
              className={cn('w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none')}
              style={inputStyle}
            />
          </div>

          {guestResults.length > 0 && !guest && (
            <GuestResultList guests={guestResults} onSelect={onSelectGuest} />
          )}

          {guest && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--status-available-soft)', border: '1px solid var(--status-available)' }}>
              <User size={20} style={{ color: 'var(--status-available)' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{guest.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {guest.document_type.toUpperCase()} {guest.document_number}
                  {guest.phone && ` · ${guest.phone}`}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={onClearGuest}
              >
                Cambiar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onStartNewGuest}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Nuevo huésped
          </button>
        </>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ACOMPAÑANTES (OPCIONAL)</p>
          <button
            type="button"
            onClick={onAddCompanion}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
        {companions.map((c) => (
          <CompanionRow
            key={c.formKey}
            formKey={c.formKey}
            name={c.name}
            relationship={c.relationship}
            onNameChange={(value) => onCompanionNameChange(c.formKey, value)}
            onRelationshipChange={(value) => onCompanionRelationshipChange(c.formKey, value)}
            onRemove={() => onRemoveCompanion(c.formKey)}
          />
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
        <input
          type="checkbox"
          checked={withCompany}
          onChange={(e) => onWithCompanyChange(e.target.checked)}
          className="rounded"
        />
        <span>Viene por empresa</span>
      </label>
    </div>
  )
}
