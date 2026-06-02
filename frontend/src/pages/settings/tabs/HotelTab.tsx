import { useRef, useState } from 'react'
import { Edit2, Save, X, Upload, Image } from 'lucide-react'
import { useHotelInfo, useHotelMutations } from '@/hooks/useAdmin'
import { SkeletonText } from '@/components/ui/Skeleton'

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: 'name',    label: 'Nombre del hotel' },
  { key: 'nit',     label: 'NIT' },
  { key: 'address', label: 'Dirección' },
  { key: 'phone',   label: 'Teléfono' },
  { key: 'email',   label: 'Email', type: 'email' },
  { key: 'city',    label: 'Ciudad' },
  { key: 'country', label: 'País' },
]

export default function HotelTab() {
  const { data: hotel, isLoading } = useHotelInfo()
  const { update, uploadLogo }    = useHotelMutations()

  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState<Record<string, string>>({})
  const fileRef               = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setForm({
      name:    hotel?.name    ?? '',
      nit:     hotel?.nit     ?? '',
      address: hotel?.address ?? '',
      phone:   hotel?.phone   ?? '',
      email:   hotel?.email   ?? '',
      city:    hotel?.city    ?? '',
      country: hotel?.country ?? '',
    })
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
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Edit2 size={13} /> Editar
          </button>
        )}
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}
        >
          {hotel?.logo_url ? (
            <img src={hotel.logo_url} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Image size={24} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadLogo.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <Upload size={12} />
            {uploadLogo.isPending ? 'Subiendo…' : 'Cambiar logo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PNG, JPG, max 2 MB</p>
        </div>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, type }) => (
          <div key={key} className={key === 'address' ? 'col-span-2' : ''}>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
            {editing ? (
              <input
                type={type ?? 'text'}
                value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--color-primary)',
                }}
              />
            ) : (
              <p className="text-sm py-2" style={{ color: 'var(--text-primary)' }}>
                {(hotel as Record<string, string>)?.[key] || '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={update.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Save size={14} />
            {update.isPending ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
