import { useRef, useState } from 'react'
import { Plus, Download, Upload, Database } from 'lucide-react'
import { useBackups, useBackupMutations } from '@/hooks/useAdmin'
import { getBackupDownloadUrl } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonText } from '@/components/ui/Skeleton'

function formatBytes(bytes: number) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BackupsTab() {
  const { hasPermission } = useAuth()
  const canCreate  = hasPermission('trigger_backup')
  const canRestore = hasPermission('restore_backup')

  const { data: backups = [], isLoading } = useBackups()
  const { create, restore }               = useBackupMutations()

  const fileRef = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)

  const handleCreate = async () => {
    if (!confirm('¿Generar un nuevo backup ahora? Esto puede tardar unos segundos.')) return
    await create.mutateAsync()
  }

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm(`¿Restaurar la base de datos desde "${file.name}"? Esta operación REEMPLAZA todos los datos actuales.`)) {
      e.target.value = ''
      return
    }
    setRestoring(true)
    try {
      await restore.mutateAsync(file)
      alert('Base de datos restaurada exitosamente.')
    } catch {
      alert('Error al restaurar. Revisa los logs del servidor.')
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Backups</h2>
        <div className="flex gap-2">
          {canRestore && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={restoring}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
                <Upload size={12} />
                {restoring ? 'Restaurando…' : 'Restaurar ZIP'}
              </button>
              <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleRestoreFile} />
            </>
          )}
          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={create.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={12} />
              {create.isPending ? 'Generando…' : 'Nuevo backup'}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Los backups se generan como dumps SQL comprimidos en ZIP. Almacenados en el servidor.
      </p>

      {isLoading ? <SkeletonText lines={3} /> : backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Database size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay backups disponibles</p>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
              <th className="text-left py-2 font-medium">Archivo</th>
              <th className="text-left py-2 font-medium">Tamaño</th>
              <th className="text-left py-2 font-medium">Creado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.filename} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td className="py-2 font-mono" style={{ color: 'var(--text-primary)', fontSize: 11 }}>{b.filename}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{formatBytes(b.size)}</td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{formatDate(b.created_at)}</td>
                <td className="py-2">
                  <a
                    href={getBackupDownloadUrl(b.filename)}
                    download={b.filename}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <Download size={12} /> Descargar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
