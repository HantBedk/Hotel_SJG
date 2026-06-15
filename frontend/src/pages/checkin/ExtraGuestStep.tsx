import { CheckCircle, Plus, User } from 'lucide-react'
import type { Guest } from '@/types'
import { cn } from '@/lib/cn'

const DOCUMENT_TYPES = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
]

const DOCUMENT_TYPES_MINOR = [
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'rc', label: 'Registro civil' },
  { value: 'passport', label: 'Pasaporte' },
]

export interface AdditionalGuestForm {
  documentInput: string
  isSearching: boolean
  found: Guest | null
  searchResults: Guest[]
  notFound: boolean
  isEditing: boolean
  editData: { full_name: string; phone: string; email: string; nationality: string; relationship: string }
  newGuest: {
    full_name: string
    document_type: string
    document_number: string
    phone: string
    email: string
    nationality: string
    relationship: string
  }
  registered: boolean
}

const inputCls = 'px-3 py-2 rounded-lg text-sm border outline-none'
const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }

export function makeExtraForm(isMinor = false): AdditionalGuestForm {
  return {
    documentInput: '',
    isSearching: false,
    found: null,
    searchResults: [],
    notFound: false,
    isEditing: false,
    editData: { full_name: '', phone: '', email: '', nationality: '', relationship: '' },
    newGuest: {
      full_name: '',
      document_type: isMinor ? 'ti' : 'cc',
      document_number: '',
      phone: '',
      email: '',
      nationality: '',
      relationship: '',
    },
    registered: false,
  }
}

function docTypeForRender(isMinor: boolean, currentType: string): string {
  if (!isMinor) return currentType
  if (DOCUMENT_TYPES_MINOR.some((d) => d.value === currentType)) return currentType
  return 'ti'
}

function registeredGuestMetaSuffix(ag: AdditionalGuestForm, isMinor: boolean): string {
  if (isMinor) {
    const rel = ag.isEditing ? ag.editData.relationship : ag.found?.relationship
    return rel ? ` · ${rel}` : ''
  }
  if (ag.isEditing && ag.editData.phone) return ` · ${ag.editData.phone}`
  if (ag.found?.phone) return ` · ${ag.found.phone}`
  return ''
}

function confirmExtraButtonLabel(isSaving: boolean, isEditing: boolean): string {
  if (isSaving) return 'Guardando…'
  if (isEditing) return 'Guardar cambios'
  return 'Confirmar'
}

function isNewFormValid(ag: AdditionalGuestForm, isMinor: boolean): boolean {
  return ag.newGuest.full_name.trim() !== ''
    && ag.newGuest.document_number.trim() !== ''
    && (isMinor ? ag.newGuest.relationship.trim() !== '' : true)
}

interface GuestSearchResultListProps {
  readonly guests: Guest[]
  readonly onSelect: (guest: Guest) => void
}

function GuestSearchResultList({ guests, onSelect }: GuestSearchResultListProps) {
  return (
    <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto" style={{ borderColor: 'var(--border-default)' }}>
      {guests.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g)}
          className="w-full text-left px-3 py-2 text-sm hover:opacity-80 border-b last:border-b-0"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <span className="font-medium">{g.full_name}</span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {g.document_type.toUpperCase()} {g.document_number}
          </span>
        </button>
      ))}
    </div>
  )
}

interface RegisteredGuestCardProps {
  readonly ag: AdditionalGuestForm
  readonly isMinor: boolean
  readonly onEdit: () => void
}

function RegisteredGuestCard({ ag, isMinor, onEdit }: RegisteredGuestCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--status-available-soft)', border: '1px solid var(--status-available)' }}>
        <CheckCircle size={18} style={{ color: 'var(--status-available)' }} />
        <div>
          {ag.found ? (
            <>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {ag.isEditing ? ag.editData.full_name : ag.found.full_name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {ag.found.document_type.toUpperCase()} {ag.found.document_number}
                {registeredGuestMetaSuffix(ag, isMinor)}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ag.newGuest.full_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {ag.newGuest.document_type.toUpperCase()} {ag.newGuest.document_number}
                {isMinor && ag.newGuest.relationship && ` · ${ag.newGuest.relationship}`}
                <span className="ml-1" style={{ color: 'var(--color-primary)' }}>· Nuevo</span>
              </p>
            </>
          )}
        </div>
      </div>
      <button type="button" onClick={onEdit} className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Editar
      </button>
    </div>
  )
}

interface FoundGuestPanelProps {
  readonly ag: AdditionalGuestForm
  readonly idx: number
  readonly isMinor: boolean
  readonly isSaving: boolean
  readonly onSetExtra: (idx: number, patch: Partial<AdditionalGuestForm>) => void
  readonly onConfirm: (idx: number) => void
}

function FoundGuestPanel({ ag, idx, isMinor, isSaving, onSetExtra, onConfirm }: FoundGuestPanelProps) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--status-available-soft)', border: '1px solid var(--status-available)' }}>
        <div className="flex items-center gap-2">
          <User size={16} style={{ color: 'var(--status-available)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--status-available)' }}>Huésped encontrado</span>
        </div>
        {ag.isEditing ? (
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Nombre completo"
              value={ag.editData.full_name}
              onChange={(e) => onSetExtra(idx, { editData: { ...ag.editData, full_name: e.target.value } })}
              className={cn('col-span-2', inputCls)}
              style={{ ...inputStyle, padding: '6px 12px' }}
            />
            {isMinor ? (
              <input
                list="relationship-suggestions"
                placeholder="Parentesco con el titular *"
                value={ag.editData.relationship}
                onChange={(e) => onSetExtra(idx, { editData: { ...ag.editData, relationship: e.target.value } })}
                className={cn('col-span-2', inputCls)}
                style={{ ...inputStyle, padding: '6px 12px' }}
              />
            ) : (
              <>
                <input
                  placeholder="Teléfono"
                  value={ag.editData.phone}
                  onChange={(e) => onSetExtra(idx, { editData: { ...ag.editData, phone: e.target.value } })}
                  className={inputCls}
                  style={{ ...inputStyle, padding: '6px 12px' }}
                />
                <input
                  placeholder="Email"
                  value={ag.editData.email}
                  onChange={(e) => onSetExtra(idx, { editData: { ...ag.editData, email: e.target.value } })}
                  className={inputCls}
                  style={{ ...inputStyle, padding: '6px 12px' }}
                />
                <input
                  placeholder="Nacionalidad"
                  value={ag.editData.nationality}
                  onChange={(e) => onSetExtra(idx, { editData: { ...ag.editData, nationality: e.target.value } })}
                  className={cn('col-span-2', inputCls)}
                  style={{ ...inputStyle, padding: '6px 12px' }}
                />
              </>
            )}
          </div>
        ) : (
          <>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ag.found?.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {ag.found?.document_type.toUpperCase()} {ag.found?.document_number}
              {isMinor
                ? (ag.found?.relationship && ` · ${ag.found.relationship}`)
                : (ag.found?.phone && ` · ${ag.found.phone}`)}
            </p>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(idx)}
          disabled={isSaving}
          className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-opacity', isSaving && 'opacity-40 cursor-not-allowed')}
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          {confirmExtraButtonLabel(isSaving, ag.isEditing)}
        </button>
        <button
          type="button"
          onClick={() => onSetExtra(idx, { isEditing: !ag.isEditing })}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
        >
          {ag.isEditing ? 'Cancelar' : 'Editar'}
        </button>
        <button
          type="button"
          onClick={() => onSetExtra(idx, { found: null, notFound: false, documentInput: '', isEditing: false })}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
        >
          Cambiar
        </button>
      </div>
    </div>
  )
}

interface NewGuestFormProps {
  readonly ag: AdditionalGuestForm
  readonly idx: number
  readonly isMinor: boolean
  readonly isSaving: boolean
  readonly onSetExtra: (idx: number, patch: Partial<AdditionalGuestForm>) => void
  readonly onPersist: (idx: number) => void
}

function NewGuestForm({ ag, idx, isMinor, isSaving, onSetExtra, onPersist }: NewGuestFormProps) {
  const docOptions = isMinor ? DOCUMENT_TYPES_MINOR : DOCUMENT_TYPES
  const docType = docTypeForRender(isMinor, ag.newGuest.document_type)
  const formOk = isNewFormValid(ag, isMinor)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Documento no encontrado. Completa los datos.
        </p>
        <button
          type="button"
          onClick={() => onSetExtra(idx, { notFound: false, documentInput: '' })}
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Buscar otro
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input
            placeholder="Nombre completo *"
            value={ag.newGuest.full_name}
            onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, full_name: e.target.value } })}
            className={cn('w-full', inputCls)}
            style={inputStyle}
          />
        </div>
        <select
          value={docType}
          onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, document_type: e.target.value } })}
          className={inputCls}
          style={inputStyle}
        >
          {docOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <input
          placeholder="Número de documento *"
          value={ag.newGuest.document_number}
          onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, document_number: e.target.value } })}
          className={inputCls}
          style={inputStyle}
        />
        {isMinor ? (
          <input
            list="relationship-suggestions"
            placeholder="Parentesco con el titular *"
            value={ag.newGuest.relationship}
            onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, relationship: e.target.value } })}
            className={cn('col-span-2', inputCls)}
            style={inputStyle}
          />
        ) : (
          <>
            <input
              placeholder="Teléfono"
              value={ag.newGuest.phone}
              onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, phone: e.target.value } })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              value={ag.newGuest.email}
              onChange={(e) => onSetExtra(idx, { newGuest: { ...ag.newGuest, email: e.target.value } })}
              className={inputCls}
              style={inputStyle}
            />
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => { if (formOk) onPersist(idx) }}
        disabled={!formOk || isSaving}
        className={cn('w-full py-2 rounded-lg text-sm font-medium transition-opacity', (!formOk || isSaving) && 'opacity-40 cursor-not-allowed')}
        style={{ background: 'var(--color-primary)', color: '#fff' }}
      >
        {isSaving ? 'Guardando…' : 'Guardar huésped'}
      </button>
    </div>
  )
}

interface DocumentSearchPhaseProps {
  readonly ag: AdditionalGuestForm
  readonly idx: number
  readonly onDocInputChange: (idx: number, value: string) => void
  readonly onPickGuest: (idx: number, guest: Guest) => void
  readonly onSetExtra: (idx: number, patch: Partial<AdditionalGuestForm>) => void
}

function DocumentSearchPhase({ ag, idx, onDocInputChange, onPickGuest, onSetExtra }: DocumentSearchPhaseProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Busca por nombre o número de documento.
      </p>
      <div className="relative">
        <input
          type="text"
          placeholder="Nombre o número de documento"
          value={ag.documentInput}
          onChange={(e) => onDocInputChange(idx, e.target.value)}
          className={cn('w-full pr-20', inputCls)}
          style={inputStyle}
          autoFocus
        />
        {ag.isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Buscando…
          </span>
        )}
      </div>

      {ag.searchResults.length > 0 && (
        <GuestSearchResultList guests={ag.searchResults} onSelect={(g) => onPickGuest(idx, g)} />
      )}

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex-1 border-t" style={{ borderColor: 'var(--border-default)' }} />
        <span>o</span>
        <span className="flex-1 border-t" style={{ borderColor: 'var(--border-default)' }} />
      </div>

      <button
        type="button"
        onClick={() => onSetExtra(idx, {
          notFound: true,
          searchResults: [],
          newGuest: { ...makeExtraForm().newGuest, document_number: ag.documentInput.trim() },
        })}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg border"
        style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
      >
        <Plus size={14} /> Crear huésped nuevo
      </button>
    </div>
  )
}

export interface ExtraGuestStepProps {
  readonly idx: number
  readonly ag: AdditionalGuestForm
  readonly totalGuests: number
  readonly isMinor: boolean
  readonly isSaving: boolean
  readonly onSetExtra: (idx: number, patch: Partial<AdditionalGuestForm>) => void
  readonly onDocInputChange: (idx: number, value: string) => void
  readonly onPickGuest: (idx: number, guest: Guest) => void
  readonly onConfirm: (idx: number) => void
  readonly onPersist: (idx: number) => void
}

export function ExtraGuestStep({
  idx,
  ag,
  totalGuests,
  isMinor,
  isSaving,
  onSetExtra,
  onDocInputChange,
  onPickGuest,
  onConfirm,
  onPersist,
}: ExtraGuestStepProps) {
  const guestNum = idx + 2
  const showSearchPhase = !ag.found && !ag.notFound

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          HUÉSPED {guestNum} DE {totalGuests}
          {isMinor && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold align-middle"
              style={{ background: '#FEF3C7', color: '#92400E' }}
            >
              NIÑO
            </span>
          )}
        </p>
        {ag.registered && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--status-available)' }}>
            <CheckCircle size={12} /> Registrado
          </span>
        )}
      </div>

      {ag.registered ? (
        <RegisteredGuestCard ag={ag} isMinor={isMinor} onEdit={() => onSetExtra(idx, { registered: false })} />
      ) : (
        <>
          {showSearchPhase && (
            <DocumentSearchPhase
              ag={ag}
              idx={idx}
              onDocInputChange={onDocInputChange}
              onPickGuest={onPickGuest}
              onSetExtra={onSetExtra}
            />
          )}
          {ag.found && (
            <FoundGuestPanel
              ag={ag}
              idx={idx}
              isMinor={isMinor}
              isSaving={isSaving}
              onSetExtra={onSetExtra}
              onConfirm={onConfirm}
            />
          )}
          {ag.notFound && (
            <NewGuestForm
              ag={ag}
              idx={idx}
              isMinor={isMinor}
              isSaving={isSaving}
              onSetExtra={onSetExtra}
              onPersist={onPersist}
            />
          )}
        </>
      )}
    </div>
  )
}
