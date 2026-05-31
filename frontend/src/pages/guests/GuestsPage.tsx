import { useState } from 'react'
import { Search, Plus, User, Edit2, Trash2 } from 'lucide-react'
import { useGuests } from '@/hooks/useGuests'
import { useAuth } from '@/hooks/useAuth'
import { GuestModal, GuestFormData } from './components/GuestModal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Guest } from '@/types'

const DOC_LABELS: Record<string, string> = {
  cc: 'CC', ce: 'CE', passport: 'Pasaporte', nit: 'NIT',
}

export default function GuestsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_reservations')

  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState<{ guest: Guest | null } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { guests, isLoading, createGuest, updateGuest, deleteGuest, isCreating, isUpdating, isDeleting } = useGuests(
    search.length >= 2 ? search : undefined
  )

  const handleSave = (form: GuestFormData) => {
    if (modal?.guest) {
      updateGuest({ id: modal.guest.id, payload: form }, { onSuccess: () => setModal(null) })
    } else {
      createGuest(form, { onSuccess: () => setModal(null) })
    }
  }

  const handleDelete = (id: string) => {
    if (deleting !== id) { setDeleting(id); return }
    deleteGuest(id, { onSuccess: () => setDeleting(null) })
  }

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
        {canEdit && (
          <button
            onClick={() => setModal({ guest: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={16} /> Nuevo huésped
          </button>
        )}
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : guests.length === 0 ? (
          <div className="p-12 text-center">
            <User size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search.length >= 2 ? 'No se encontraron huéspedes.' : 'Sin huéspedes registrados.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Nombre', 'Documento', 'Teléfono', 'Email', 'Estadías', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr
                  key={guest.id}
                  className="hover:opacity-90 transition-opacity"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {guest.full_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {DOC_LABELS[guest.document_type] ?? guest.document_type} {guest.document_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {guest.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {guest.email ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {guest.stays_count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setModal({ guest })}
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(guest.id)}
                          disabled={isDeleting}
                          className="p-1.5 rounded hover:opacity-80 transition-colors"
                          style={{ color: deleting === guest.id ? 'var(--status-occupied)' : 'var(--text-muted)' }}
                          aria-label={deleting === guest.id ? 'Confirmar eliminación' : 'Eliminar'}
                          title={deleting === guest.id ? 'Haz clic de nuevo para confirmar' : 'Eliminar'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <GuestModal
          guest={modal.guest}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isCreating || isUpdating}
        />
      )}
    </div>
  )
}
