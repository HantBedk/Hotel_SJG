import { useState } from 'react'
import { Search, Plus, Building2, Edit2, Trash2 } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { useAuth } from '@/hooks/useAuth'
import { CompanyModal, CompanyFormData } from './components/CompanyModal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Company } from '@/types'

export default function CompaniesPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('manage_reservations')

  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState<{ company: Company | null } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { companies, isLoading, createCompany, updateCompany, deleteCompany, isCreating, isUpdating, isDeleting } = useCompanies(
    search.length >= 2 ? search : undefined
  )

  const handleSave = (form: CompanyFormData) => {
    const payload = {
      name:         form.name,
      nit:          form.nit,
      address:      form.address || null,
      phone:        form.phone || null,
      email:        form.email || null,
      contact_name: form.contact_name || null,
      notes:        form.notes || null,
    }
    if (modal?.company) {
      updateCompany({ id: modal.company.id, payload }, { onSuccess: () => setModal(null) })
    } else {
      createCompany(payload, { onSuccess: () => setModal(null) })
    }
  }

  const handleDelete = (id: string) => {
    if (deleting !== id) { setDeleting(id); return }
    deleteCompany(id, { onSuccess: () => setDeleting(null) })
  }

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
        {canEdit && (
          <button
            onClick={() => setModal({ company: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={16} /> Nueva empresa
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search.length >= 2 ? 'No se encontraron empresas.' : 'Sin empresas registradas.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Razón social', 'NIT', 'Contacto', 'Teléfono', 'Email', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:opacity-90 transition-opacity"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {company.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {company.nit}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {company.contact_name ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {company.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {company.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setModal({ company })}
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          disabled={isDeleting}
                          className="p-1.5 rounded hover:opacity-80 transition-colors"
                          style={{ color: deleting === company.id ? 'var(--status-occupied)' : 'var(--text-muted)' }}
                          aria-label={deleting === company.id ? 'Confirmar eliminación' : 'Eliminar'}
                          title={deleting === company.id ? 'Haz clic de nuevo para confirmar' : 'Eliminar'}
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
        <CompanyModal
          company={modal.company}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isCreating || isUpdating}
        />
      )}
    </div>
  )
}
