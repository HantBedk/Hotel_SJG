import { useRef, useState } from 'react'
import { Edit2, Save, X, Upload, Image } from 'lucide-react'
import { useHotelInfo, useHotelMutations } from '@/hooks/useAdmin'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { HotelInfo } from '@/types'

type HotelFieldKey = 'name' | 'nit' | 'address' | 'phone' | 'email' | 'city' | 'country'

type HotelForm = Record<HotelFieldKey, string>

const FIELDS: ReadonlyArray<{ readonly key: HotelFieldKey; readonly label: string; readonly type?: string }> = [
  { key: 'name',    label: 'Nombre del hotel' },
  { key: 'nit',     label: 'NIT' },
  { key: 'address', label: 'Dirección' },
  { key: 'phone',   label: 'Teléfono' },
  { key: 'email',   label: 'Email', type: 'email' },
  { key: 'city',    label: 'Ciudad' },
  { key: 'country', label: 'País' },
]

const EMPTY_FORM: HotelForm = {
  name: '',
  nit: '',
  address: '',
  phone: '',
  email: '',
  city: '',
  country: '',
}

function hotelFieldId(key: HotelFieldKey): string {
  return `hotel-info-${key}`
}

function hotelFieldValue(hotel: HotelInfo | undefined, key: HotelFieldKey): string {
  const value = hotel?.[key]
  if (value) return value
  return '—'
}

function fieldColumnClass(key: HotelFieldKey): string {
  if (key === 'address') return 'col-span-2'
  return ''
}

function uploadLogoLabel(pending: boolean): string {
  if (pending) return 'Subiendo…'
  return 'Cambiar logo'
}

function saveButtonLabel(pending: boolean): string {
  if (pending) return 'Guardando…'
  return 'Guardar'
}

function hotelToForm(hotel: HotelInfo | undefined): HotelForm {
  return {
    name: hotel?.name ?? '',
    nit: hotel?.nit ?? '',
    address: hotel?.address ?? '',
    phone: hotel?.phone ?? '',
    email: hotel?.email ?? '',
    city: hotel?.city ?? '',
    country: hotel?.country ?? '',
  }
}

interface HotelLogoSectionProps {
  readonly logoUrl: string | null | undefined
  readonly uploadPending: boolean
  readonly fileRef: React.RefObject<HTMLInputElement | null>
  readonly onUploadClick: () => void
  readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function HotelLogoSection({ logoUrl, uploadPending, fileRef, onUploadClick, onFileChange }: HotelLogoSectionProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo del hotel" className="w-full h-full object-contain" />
        ) : (
          <Image size={24} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploadPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border disabled:opacity-60"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <Upload size={12} />
          {uploadLogoLabel(uploadPending)}
        </button>
        <input
          ref={fileRef}
          id="hotel-logo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PNG, JPG, max 2 MB</p>
      </div>
    </div>
  )
}

interface HotelFieldProps {
  readonly fieldKey: HotelFieldKey
  readonly label: string
  readonly type?: string
  readonly editing: boolean
  readonly formValue: string
  readonly displayValue: string
  readonly onChange: (key: HotelFieldKey, value: string) => void
}

function HotelField({ fieldKey, label, type, editing, formValue, displayValue, onChange }: HotelFieldProps) {
  const inputId = hotelFieldId(fieldKey)

  return (
    <div className={fieldColumnClass(fieldKey)}>
      <label htmlFor={inputId} className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {editing ? (
        <input
          id={inputId}
          type={type ?? 'text'}
          value={formValue}
          onChange={e => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
          style={{
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            borderColor: 'var(--color-primary)',
          }}
        />
      ) : (
        <p id={inputId} className="text-sm py-2" style={{ color: 'var(--text-primary)' }}>
          {displayValue}
        </p>
      )}
    </div>
  )
}

interface HotelEditActionsProps {
  readonly saving: boolean
  readonly onSave: () => void
  readonly onCancel: () => void
}

function HotelEditActions({ saving, onSave, onCancel }: HotelEditActionsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--color-primary)' }}
      >
        <Save size={14} />
        {saveButtonLabel(saving)}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        <X size={14} /> Cancelar
      </button>
    </div>
  )
}

export default function HotelTab() {
  const { data: hotel, isLoading } = useHotelInfo()
  const { update, uploadLogo } = useHotelMutations()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<HotelForm>(EMPTY_FORM)
  const fileRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setForm(hotelToForm(hotel))
    setEditing(true)
  }

  const save = async () => {
    await update.mutateAsync(form)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadLogo.mutate(file)
    e.target.value = ''
  }

  const handleFieldChange = (key: HotelFieldKey, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  if (isLoading) return <SkeletonText lines={8} />

  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Información del hotel
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Edit2 size={13} /> Editar
          </button>
        )}
      </div>

      <HotelLogoSection
        logoUrl={hotel?.logo_url}
        uploadPending={uploadLogo.isPending}
        fileRef={fileRef}
        onUploadClick={() => fileRef.current?.click()}
        onFileChange={handleLogo}
      />

      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, type }) => (
          <HotelField
            key={key}
            fieldKey={key}
            label={label}
            type={type}
            editing={editing}
            formValue={form[key]}
            displayValue={hotelFieldValue(hotel, key)}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      {editing && (
        <HotelEditActions saving={update.isPending} onSave={save} onCancel={cancel} />
      )}
    </div>
  )
}
