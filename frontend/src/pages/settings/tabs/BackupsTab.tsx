import { useRef, useState } from 'react'
import { Plus, Download, Upload, Database, Archive, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useBackups, useBackupMutations } from '@/hooks/useAdmin'
import { getBackupDownloadUrl } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'

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

type ResultState = { ok: true } | { ok: false; msg: string } | null

export default function BackupsTab() {
  const { hasPermission } = useAuth()
  const canCreate  = hasPermission('trigger_backup')
  const canRestore = hasPermission('restore_backup')

  const { data: backups = [], isLoading } = useBackups()
  const { create, restore }               = useBackupMutations()

  const fileRef = useRef<HTMLInputElement>(null)

  const [showCreate, setShowCreate]     = useState(false)
  const [restoreFile, setRestoreFile]   = useState<File | null>(null)
  const [restoring, setRestoring]       = useState(false)
  const [result, setResult]             = useState<ResultState>(null)

  /* ── Crear backup ───────────────────────────────────────────── */
  const confirmCreate = async () => {
    setShowCreate(false)
    await create.mutateAsync()
  }

  /* ── Restaurar backup ───────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setRestoreFile(file)
    e.target.value = ''
  }

  const confirmRestore = async () => {
    if (!restoreFile) return
    setRestoreFile(null)
    setRestoring(true)
    try {
      await restore.mutateAsync(restoreFile)
      setResult({ ok: true })
    } catch {
      setResult({ ok: false, msg: 'Error al restaurar. Revisa los logs del servidor.' })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <>
      {/* ── Modal: Nuevo backup ─────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="sm" ariaLabel="Generar backup">
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
          >
            <Archive size={28} style={{ color: 'var(--color-primary)' }} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Generar nuevo backup
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Se creará un archivo <strong>.zip</strong> con el dump completo de la base de datos.
              El proceso puede tardar unos segundos.
            </p>
          </div>

          <div
            className="w-full rounded-lg px-4 py-3 text-xs text-left"
            style={{ background: 'var(--bg-subtle, var(--bg-elevated))', color: 'var(--text-muted)' }}
          >
            El backup se guardará en el servidor y estará disponible para descargar desde esta pantalla.
          </div>

          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmCreate}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              Generar backup
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Confirmar restaurar ───────────────────────────── */}
      <Modal open={!!restoreFile} onClose={() => setRestoreFile(null)} size="sm" ariaLabel="Restaurar backup">
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50">
            <AlertTriangle size={28} className="text-red-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Restaurar base de datos
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ¿Restaurar desde{' '}
              <span className="font-mono font-medium" style={{ color: 'var(--text-primary)', fontSize: 11 }}>
                {restoreFile?.name}
              </span>
              ?
            </p>
          </div>

          <div className="w-full rounded-lg px-4 py-3 text-xs text-left bg-red-50 text-red-700 border border-red-200">
            <strong>Advertencia:</strong> esta operación reemplazará <em>todos</em> los datos actuales
            y no puede deshacerse.
          </div>

          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={() => setRestoreFile(null)}
              className="flex-1 px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmRestore}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white font-medium bg-red-500 hover:bg-red-600"
            >
              Sí, restaurar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Resultado de restauración ────────────────────── */}
      <Modal open={result !== null} onClose={() => setResult(null)} size="sm" ariaLabel="Resultado">
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          {result?.ok ? (
            <CheckCircle size={48} className="text-green-500" />
          ) : (
            <XCircle size={48} className="text-red-500" />
          )}
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {result?.ok
              ? 'Base de datos restaurada exitosamente.'
              : (result as { ok: false; msg: string })?.msg}
          </p>
          <button
            onClick={() => setResult(null)}
            className="px-6 py-2 rounded-lg text-sm text-white font-medium"
            style={{ background: result?.ok ? '#22c55e' : '#ef4444' }}
          >
            Entendido
          </button>
        </div>
      </Modal>

      {/* ── Contenido principal ──────────────────────────────────── */}
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
                <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFileSelect} />
              </>
            )}
            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
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
    </>
  )
}
