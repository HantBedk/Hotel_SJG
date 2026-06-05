import { useEffect, useRef, useState } from 'react'
import { Plus, Download, Upload, Database, Archive, AlertTriangle, CheckCircle, XCircle, RefreshCw, FolderOpen, Clock, Save, ChevronDown, RotateCcw } from 'lucide-react'
import { useBackups, useBackupMutations, useBackupPreview, useBackupSettings, useSaveBackupSettings } from '@/hooks/useAdmin'
import { getBackupDownloadUrl, validateBackupFolderApi } from '@/services/admin.service'
import type { BackupSettings, BackupFolderCheck } from '@/services/admin.service'
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

const DEFAULT_SETTINGS: BackupSettings = {
  auto_backup: true,
  auto_backup_time: '23:59',
  auto_backup_folder: '',
  retention_days: 30,
}

export default function BackupsTab() {
  const { hasPermission } = useAuth()
  const canCreate  = hasPermission('trigger_backup')
  const canRestore = hasPermission('restore_backup')

  const { data: backups = [], isLoading } = useBackups()
  const { create, restore }               = useBackupMutations()

  const [showCreate, setShowCreate]     = useState(false)
  const { data: preview, isLoading: previewLoading } = useBackupPreview(showCreate)

  const fileRef = useRef<HTMLInputElement>(null)

  const [restoreFile, setRestoreFile]   = useState<File | null>(null)
  const [restoring, setRestoring]       = useState(false)
  const [result, setResult]             = useState<ResultState>(null)

  // ── Configuración auto-backup ─────────────────────────────────────────────
  const { data: remoteSettings }  = useBackupSettings()
  const saveSettings               = useSaveBackupSettings()
  const [cfg, setCfg]              = useState<BackupSettings>(DEFAULT_SETTINGS)
  const [savedOk, setSavedOk]      = useState(false)
  const [cfgOpen, setCfgOpen]      = useState(false)
  const [folderCheck, setFolderCheck] = useState<BackupFolderCheck | null>(null)
  const [checkingFolder, setCheckingFolder] = useState(false)

  // Cualquier cambio en la ruta limpia el resultado de la verificación previa.
  useEffect(() => { setFolderCheck(null) }, [cfg.auto_backup_folder])

  const handleTestFolder = async () => {
    setCheckingFolder(true)
    try {
      const res = await validateBackupFolderApi(cfg.auto_backup_folder)
      setFolderCheck(res)
    } catch {
      setFolderCheck({
        using_default: false,
        resolved_path: cfg.auto_backup_folder,
        exists: false,
        writable: false,
        message: 'No se pudo validar la carpeta.',
      })
    } finally {
      setCheckingFolder(false)
    }
  }

  const handleResetFolder  = () => setCfg(c => ({ ...c, auto_backup_folder: '' }))
  // Carpeta del container montada como ./backup del proyecto host (docker-compose).
  // Lo que se escriba ahí aparece directamente en C:\…\Hotel_SJG\backup\ del PC.
  const handleSharedFolder = () => setCfg(c => ({ ...c, auto_backup_folder: '/var/www/html/backup' }))

  useEffect(() => {
    if (remoteSettings) setCfg(remoteSettings)
  }, [remoteSettings])

  const handleSaveSettings = async () => {
    await saveSettings.mutateAsync(cfg)
    setSavedOk(true)
    setTimeout(() => {
      setSavedOk(false)
      setCfgOpen(false)
    }, 1200)
  }

  /* ── Crear backup ───────────────────────────────────────────── */
  const confirmCreate = async () => {
    setShowCreate(false)
    const backup = await create.mutateAsync()
    const a = document.createElement('a')
    a.href = getBackupDownloadUrl(backup.filename)
    a.download = backup.filename
    a.click()
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

          {/* Resumen de lo que se incluirá en el backup */}
          <div
            className="w-full rounded-lg px-4 py-3 text-left"
            style={{ background: 'var(--bg-subtle, var(--bg-elevated))' }}
          >
            <p
              className="text-[11px] uppercase font-bold tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Datos que se respaldarán
            </p>

            {previewLoading || !preview ? (
              <div className="flex items-center gap-2 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <RefreshCw size={12} className="animate-spin" />
                Calculando…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {[
                  { label: 'Usuarios',             value: preview.users },
                  { label: 'Huéspedes',            value: preview.guests },
                  { label: 'Empresas',             value: preview.companies },
                  { label: 'Habitaciones',         value: preview.rooms },
                  { label: 'Reservas',             value: preview.reservations },
                  { label: 'Estadías (total)',     value: preview.stays },
                  { label: 'Estadías activas',     value: preview.active_stays },
                  { label: 'Ítems de inventario',  value: preview.inventory_items },
                  { label: 'Productos de minibar', value: preview.minibar_products },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline gap-2">
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {value.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] mt-3 pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)' }}>
              El backup se guardará en el servidor y podrás descargarlo desde esta pantalla.
            </p>
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

      {/* ── Panel: Configuración backup automático ───────────────── */}
      {canCreate && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {/* Header acordeón */}
          <button
            type="button"
            onClick={() => setCfgOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Backup automático
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: cfg.auto_backup ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--bg-elevated)',
                  color: cfg.auto_backup ? 'var(--color-primary)' : 'var(--text-muted)',
                }}
              >
                {cfg.auto_backup ? `Activo · ${cfg.auto_backup_time}` : 'Desactivado'}
              </span>
            </div>
            <ChevronDown
              size={16}
              style={{
                color: 'var(--text-muted)',
                transform: cfgOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {/* Contenido colapsable */}
          {cfgOpen && (
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border-default)' }}>
              <div style={{ height: 4 }} />

          {/* Toggle activar/desactivar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                Activar backup automático diario
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Se generará un backup automáticamente cada día a la hora configurada
              </p>
            </div>
            <label className="flex-shrink-0" style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cfg.auto_backup}
                onChange={e => setCfg(c => ({ ...c, auto_backup: e.target.checked }))}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              {/* track */}
              <span style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: cfg.auto_backup ? 'var(--color-primary)' : '#94a3b8',
                transition: 'background 0.2s',
              }} />
              {/* thumb */}
              <span style={{
                position: 'absolute', top: 3,
                left: cfg.auto_backup ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
                transition: 'left 0.2s',
              }} />
            </label>
          </div>

          {/* Hora del backup */}
          <div className="flex items-center gap-3">
            <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Hora del backup
              </label>
              <input
                type="time"
                value={cfg.auto_backup_time}
                onChange={e => setCfg(c => ({ ...c, auto_backup_time: e.target.value }))}
                disabled={!cfg.auto_backup}
                className="w-36 px-2 py-1.5 rounded-lg text-xs border"
                style={{
                  background: 'var(--bg-input, var(--bg-elevated))',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  opacity: cfg.auto_backup ? 1 : 0.4,
                }}
              />
            </div>
          </div>

          {/* Carpeta de destino */}
          <div className="flex items-start gap-3">
            <FolderOpen size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 22 }} />
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Carpeta de backups
              </label>
              <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Ruta en el servidor. Vacío = carpeta por defecto (<code>storage/app/backups</code>).
                El navegador no puede explorar carpetas del servidor; escribe la ruta y usa
                <strong> Probar </strong> para verificar que existe y es escribible.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cfg.auto_backup_folder}
                  onChange={e => setCfg(c => ({ ...c, auto_backup_folder: e.target.value }))}
                  placeholder="Vacío = carpeta por defecto"
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-xs border font-mono"
                  style={{
                    background: 'var(--bg-input, var(--bg-elevated))',
                    borderColor: folderCheck
                      ? (folderCheck.writable ? '#22c55e' : '#ef4444')
                      : 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestFolder}
                  disabled={checkingFolder}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap disabled:opacity-50"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  title="Verificar que la carpeta existe y es escribible"
                >
                  {checkingFolder ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Probar
                </button>
                <button
                  type="button"
                  onClick={handleResetFolder}
                  disabled={!cfg.auto_backup_folder}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  title="Volver a la carpeta predeterminada (storage/app/backups)"
                >
                  <RotateCcw size={12} />
                  Predeterminada
                </button>
              </div>
              <button
                type="button"
                onClick={handleSharedFolder}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: 'var(--color-primary)' }}
                title="Usa /var/www/html/backup, que en tu docker-compose está mapeado a ./backup del proyecto en tu PC."
              >
                <FolderOpen size={11} />
                Usar carpeta compartida con el PC (./backup del proyecto)
              </button>
              {folderCheck && (
                <div
                  className="mt-2 flex items-start gap-1.5 text-[11px] rounded-md px-2 py-1.5"
                  style={{
                    background: folderCheck.writable ? '#f0fdf4' : '#fef2f2',
                    color:      folderCheck.writable ? '#15803d' : '#b91c1c',
                  }}
                >
                  {folderCheck.writable
                    ? <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                    : <XCircle size={12} className="mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium">{folderCheck.message}</p>
                    {folderCheck.resolved_path && (
                      <p className="font-mono text-[10px] mt-0.5 break-all opacity-80">
                        {folderCheck.resolved_path}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Retención */}
          <div className="flex items-center gap-3">
            <div style={{ width: 14, flexShrink: 0 }} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Retención (días)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={cfg.retention_days}
                  onChange={e => setCfg(c => ({ ...c, retention_days: Number(e.target.value) }))}
                  className="w-20 px-2 py-1.5 rounded-lg text-xs border text-center"
                  style={{
                    background: 'var(--bg-input, var(--bg-elevated))',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>días antes de eliminar backups viejos</span>
              </div>
            </div>
          </div>

          {/* Guardar */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveSettings}
              disabled={saveSettings.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white font-medium"
              style={{ background: savedOk ? '#22c55e' : 'var(--color-primary)' }}
            >
              {savedOk ? <CheckCircle size={12} /> : <Save size={12} />}
              {saveSettings.isPending ? 'Guardando…' : savedOk ? 'Guardado' : 'Guardar configuración'}
            </button>
          </div>
            </div>
          )}
        </div>
      )}

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
                {create.isPending ? 'Generando…' : 'Descargar backup'}
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
