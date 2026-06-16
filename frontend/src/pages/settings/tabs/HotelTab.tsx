import { useRef, useState, type ReactNode } from 'react'
import {
  Building2,
  Clock,
  Coins,
  Edit2,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Phone,
  Save,
  Upload,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useHotelInfo, useHotelMutations } from '@/hooks/useAdmin'
import { CitySelect } from '@/components/forms/CitySelect'
import { CountrySelect, countryLabel } from '@/components/forms/CountrySelect'
import { FormField, FormSection } from '@/components/person/FormField'
import { personInputClass, personInputStyle } from '@/components/person/personFormStyles'
import { SkeletonText } from '@/components/ui/Skeleton'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { HotelInfo } from '@/types'
import type { LucideIcon } from 'lucide-react'

type HotelFieldKey = 'name' | 'nit' | 'address' | 'phone' | 'email'

type HotelForm = Record<HotelFieldKey, string> & {
  city: string
  country: string
}

const EMPTY_FORM: HotelForm = {
  name: '',
  nit: '',
  address: '',
  phone: '',
  email: '',
  city: '',
  country: 'CO',
}

function hotelFieldId(key: string): string {
  return `hotel-info-${key}`
}

function hotelToForm(hotel: HotelInfo | undefined): HotelForm {
  return {
    name: hotel?.name ?? '',
    nit: hotel?.nit ?? '',
    address: hotel?.address ?? '',
    phone: hotel?.phone ?? '',
    email: hotel?.email ?? '',
    city: hotel?.city ?? '',
    country: hotel?.country?.toUpperCase() || 'CO',
  }
}

function displayValue(value: string | null | undefined): string {
  if (value?.trim()) return value.trim()
  return '—'
}

function formatHotelTime(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 5)
}

function formatTaxRate(value: string | null | undefined): string {
  if (!value) return '—'
  const rate = Number.parseFloat(value)
  if (Number.isNaN(rate)) return '—'
  return `${Math.round(rate * 100)}%`
}

function formatLateFee(value: string | null | undefined): string {
  if (!value) return '—'
  const amount = Number.parseFloat(value)
  if (Number.isNaN(amount)) return '—'
  return formatCOP(amount)
}

interface InfoRowProps {
  readonly icon: LucideIcon
  readonly label: string
  readonly value: string
  readonly href?: string
}

function InfoRow({ icon: Icon, label, value, href }: InfoRowProps) {
  const content = (
    <div className="flex items-start gap-3 min-w-0">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--bg-muted)', color: 'var(--color-primary)' }}
      >
        <Icon size={16} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p
          className={cn('text-sm mt-0.5 truncate', href && 'hover:underline')}
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  )

  if (href && value !== '—') {
    return (
      <a href={href} className="block rounded-lg transition-opacity hover:opacity-80">
        {content}
      </a>
    )
  }

  return <div className="rounded-lg">{content}</div>
}

interface OperationChipProps {
  readonly icon: LucideIcon
  readonly label: string
  readonly value: string
}

function OperationChip({ icon: Icon, label, value }: OperationChipProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 min-w-0"
      style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--bg-surface)', color: 'var(--color-primary)' }}
      >
        <Icon size={15} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  )
}

interface HotelLogoUploaderProps {
  readonly logoUrl: string | null | undefined
  readonly hotelName: string
  readonly uploadPending: boolean
  readonly fileRef: React.RefObject<HTMLInputElement | null>
  readonly onUploadClick: () => void
  readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function HotelLogoUploader({
  logoUrl,
  hotelName,
  uploadPending,
  fileRef,
  onUploadClick,
  onFileChange,
}: HotelLogoUploaderProps) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploadPending}
        className={cn(
          'group relative flex h-28 w-28 items-center justify-center rounded-2xl overflow-hidden',
          'border-2 border-dashed transition-all disabled:opacity-60',
          'hover:border-[var(--color-primary)] hover:shadow-md',
        )}
        style={{
          borderColor: logoUrl ? 'var(--border-default)' : 'var(--color-primary)',
          background: 'var(--bg-muted)',
        }}
        aria-label="Subir logo del hotel"
      >
        {logoUrl ? (
          <>
            <img src={logoUrl} alt="" className="h-full w-full object-contain p-2" />
            <span
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              {uploadPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {uploadPending ? 'Subiendo…' : 'Cambiar'}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            {uploadPending ? (
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            ) : (
              <Upload size={22} style={{ color: 'var(--color-primary)' }} />
            )}
            <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {uploadPending ? 'Subiendo…' : 'Subir logo'}
            </span>
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        id="hotel-logo-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      <p className="text-[11px] mt-2 text-center sm:text-left max-w-[8.75rem]" style={{ color: 'var(--text-muted)' }}>
        PNG, JPG o WebP · máx. 2 MB
      </p>
      <p className="sr-only">Logo de {hotelName}</p>
    </div>
  )
}

interface SectionCardProps {
  readonly children: ReactNode
  readonly className?: string
}

function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn('rounded-xl shadow-sm p-5 sm:p-6', className)}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {children}
    </section>
  )
}

interface HotelEditActionsProps {
  readonly saving: boolean
  readonly onSave: () => void
  readonly onCancel: () => void
}

function HotelEditActions({ saving, onSave, onCancel }: HotelEditActionsProps) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 mt-6 flex flex-wrap items-center justify-end gap-2 border-t backdrop-blur-sm"
      style={{
        borderColor: 'var(--border-default)',
        background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border disabled:opacity-60"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        <X size={15} /> Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 shadow-sm"
        style={{ background: 'var(--color-primary)' }}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Guardando…' : 'Guardar cambios'}
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
    try {
      await update.mutateAsync(form)
      setEditing(false)
      toast.success('Información del hotel actualizada.')
    } catch {
      toast.error('No se pudo guardar. Verifica ciudad y país.')
    }
  }

  const cancel = () => setEditing(false)

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success('Logo actualizado.'),
      onError: () => toast.error('No se pudo subir el logo.'),
    })
    e.target.value = ''
  }

  const patchForm = (patch: Partial<HotelForm>) => setForm((f) => ({ ...f, ...patch }))

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <SkeletonText lines={2} />
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <SkeletonText lines={10} />
        </div>
      </div>
    )
  }

  const phoneHref = hotel?.phone ? `tel:${hotel.phone.replace(/\s/g, '')}` : undefined
  const emailHref = hotel?.email ? `mailto:${hotel.email}` : undefined

  return (
    <div className="space-y-5 max-w-4xl pb-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Perfil del hotel
          </h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Datos de identidad, contacto y ubicación del establecimiento activo. Los horarios y tarifas se configuran en Operación.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <Edit2 size={15} />
            Editar información
          </button>
        )}
      </header>

      {/* Identidad */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <HotelLogoUploader
            logoUrl={hotel?.logo_url}
            hotelName={hotel?.name ?? 'Hotel'}
            uploadPending={uploadLogo.isPending}
            fileRef={fileRef}
            onUploadClick={() => fileRef.current?.click()}
            onFileChange={handleLogo}
          />

          <div className="flex-1 min-w-0 space-y-4">
            {editing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField id={hotelFieldId('name')} label="Nombre del hotel" required className="sm:col-span-2">
                  <input
                    id={hotelFieldId('name')}
                    type="text"
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                    className={personInputClass}
                    style={personInputStyle}
                    required
                  />
                </FormField>
                <FormField id={hotelFieldId('nit')} label="NIT" required>
                  <input
                    id={hotelFieldId('nit')}
                    type="text"
                    value={form.nit}
                    onChange={(e) => patchForm({ nit: e.target.value })}
                    className={personInputClass}
                    style={personInputStyle}
                    required
                  />
                </FormField>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                  >
                    <Building2 size={12} />
                    Hotel activo
                  </span>
                  {hotel?.city && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                    >
                      <MapPin size={11} />
                      {hotel.city}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {displayValue(hotel?.name)}
                </h2>
                <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Hash size={13} />
                  NIT {displayValue(hotel?.nit)}
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Contacto */}
      <SectionCard>
        <FormSection title="Contacto" description="Datos visibles en comprobantes y comunicaciones con huéspedes.">
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField id={hotelFieldId('phone')} label="Teléfono">
                <input
                  id={hotelFieldId('phone')}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => patchForm({ phone: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                  placeholder="+57 300 000 0000"
                />
              </FormField>
              <FormField id={hotelFieldId('email')} label="Correo electrónico">
                <input
                  id={hotelFieldId('email')}
                  type="email"
                  value={form.email}
                  onChange={(e) => patchForm({ email: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                  placeholder="hotel@ejemplo.com"
                />
              </FormField>
              <FormField id={hotelFieldId('address')} label="Dirección" className="sm:col-span-2">
                <input
                  id={hotelFieldId('address')}
                  type="text"
                  value={form.address}
                  onChange={(e) => patchForm({ address: e.target.value })}
                  className={personInputClass}
                  style={personInputStyle}
                  placeholder="Carrera 1 # 1-01"
                />
              </FormField>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow icon={Phone} label="Teléfono" value={displayValue(hotel?.phone)} href={phoneHref} />
              <InfoRow icon={Mail} label="Correo" value={displayValue(hotel?.email)} href={emailHref} />
              <div className="sm:col-span-2">
                <InfoRow icon={MapPin} label="Dirección" value={displayValue(hotel?.address)} />
              </div>
            </div>
          )}
        </FormSection>
      </SectionCard>

      {/* Ubicación */}
      <SectionCard>
        <FormSection title="Ubicación" description="Ciudad y país del establecimiento.">
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField id={hotelFieldId('city')} label="Ciudad">
                <CitySelect
                  id={hotelFieldId('city')}
                  value={form.city}
                  onChange={(city) => patchForm({ city })}
                />
              </FormField>
              <FormField id={hotelFieldId('country')} label="País" hint="Código ISO de 2 letras">
                <CountrySelect
                  id={hotelFieldId('country')}
                  value={form.country}
                  onChange={(country) => patchForm({ country })}
                />
              </FormField>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow icon={MapPin} label="Ciudad" value={displayValue(hotel?.city)} />
              <InfoRow icon={Building2} label="País" value={countryLabel(hotel?.country)} />
            </div>
          )}
        </FormSection>
      </SectionCard>

      {/* Operación (solo lectura) */}
      <SectionCard>
        <FormSection
          title="Operación"
          description="Horarios y parámetros comerciales. Edítalos en Configuración → Operación del hotel."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <OperationChip icon={Clock} label="Check-in" value={formatHotelTime(hotel?.check_in_time)} />
            <OperationChip icon={Clock} label="Check-out" value={formatHotelTime(hotel?.check_out_time)} />
            <OperationChip icon={Coins} label="Moneda" value={displayValue(hotel?.currency)} />
            <OperationChip icon={Percent} label="IVA" value={formatTaxRate(hotel?.tax_rate)} />
          </div>
          {hotel?.late_checkout_fee && Number.parseFloat(hotel.late_checkout_fee) > 0 && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Recargo por checkout tardío: {formatLateFee(hotel.late_checkout_fee)}
            </p>
          )}
        </FormSection>
      </SectionCard>

      {editing && (
        <SectionCard className="!p-0 overflow-hidden">
          <div className="px-5 sm:px-6 pt-5">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              ¿Listo para guardar?
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Los cambios se aplican al hotel activo de inmediato.
            </p>
          </div>
          <HotelEditActions saving={update.isPending} onSave={save} onCancel={cancel} />
        </SectionCard>
      )}
    </div>
  )
}
