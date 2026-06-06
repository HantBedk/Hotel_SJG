<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Guest;
use App\Models\InventoryItem;
use App\Models\MinibarProduct;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use ZipArchive;

class BackupController extends Controller
{
    private const FOLDER = 'backups';

    /** Ruta dentro del container donde Docker monta la carpeta del PC del host. */
    private const SHARED_CONTAINER_PATH = '/var/www/html/backup';

    private function backupsDir(): string
    {
        $custom = Setting::get('backup.auto_backup_folder', '');
        return ! empty($custom) ? rtrim($custom, '/\\') : storage_path('app/' . self::FOLDER);
    }

    /**
     * Ruta del PC del host (Windows/Linux/Mac) que corresponde a SHARED_CONTAINER_PATH.
     * Viene del env BACKUP_HOST_PATH (docker-compose), o './backup' como default.
     * Útil para mostrar al usuario dónde aparecerán los .zip en su computador.
     */
    private function sharedHostPath(): string
    {
        return env('BACKUP_HOST_PATH', './backup');
    }

    /**
     * Verifica una ruta del servidor: ¿existe?, ¿es escribible? Útil para que
     * el usuario reciba feedback inmediato al configurar la carpeta del backup.
     */
    public function validateFolder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'path' => 'nullable|string|max:500',
        ]);

        $path = trim($data['path'] ?? '');
        $defaultPath = storage_path('app/' . self::FOLDER);

        // Vacío = se usará la carpeta por defecto.
        if ($path === '') {
            return response()->json([
                'success' => true,
                'data'    => [
                    'using_default' => true,
                    'resolved_path' => $defaultPath,
                    'exists'        => File::isDirectory($defaultPath) || true, // se crea on-demand
                    'writable'      => true,
                    'message'       => 'Se usará la carpeta por defecto: ' . $defaultPath,
                ],
            ]);
        }

        $exists   = File::isDirectory($path);
        $writable = $exists && is_writable($path);

        // Si la ruta es la carpeta compartida con el PC, mostramos al usuario
        // el path real de su computador (no /var/www/html/backup que es del container).
        $isShared = rtrim($path, '/\\') === self::SHARED_CONTAINER_PATH;
        $displayPath = $isShared ? $this->sharedHostPath() : $path;

        if (! $exists) {
            $msg = 'La carpeta no existe en el servidor.';
        } elseif (! $writable) {
            $msg = 'La carpeta existe pero no tiene permisos de escritura.';
        } elseif ($isShared) {
            $msg = "Carpeta válida. Los backups aparecerán en tu PC en: {$displayPath}";
        } else {
            $msg = 'Carpeta válida y escribible.';
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'using_default' => false,
                'resolved_path' => $displayPath,
                'exists'        => $exists,
                'writable'      => $writable,
                'message'       => $msg,
            ],
        ]);
    }

    public function getSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'auto_backup'         => Setting::get('backup.auto_backup', true),
                'auto_backup_time'    => Setting::get('backup.auto_backup_time', '23:59'),
                'auto_backup_folder'  => Setting::get('backup.auto_backup_folder', ''),
                'retention_days'      => Setting::get('backup.retention_days', 30),
                'shared_container_path' => self::SHARED_CONTAINER_PATH,
                'shared_host_path'      => $this->sharedHostPath(),
            ],
        ]);
    }

    public function saveSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'auto_backup'        => 'required|boolean',
            'auto_backup_time'   => ['required', 'regex:/^\d{2}:\d{2}$/'],
            'auto_backup_folder' => 'nullable|string|max:500',
            'retention_days'     => 'required|integer|min:1|max:365',
        ]);

        Setting::set('backup.auto_backup',        $data['auto_backup'],               'boolean', 'backup');
        Setting::set('backup.auto_backup_time',   $data['auto_backup_time'],           'string',  'backup');
        Setting::set('backup.auto_backup_folder', $data['auto_backup_folder'] ?? '',   'string',  'backup');
        Setting::set('backup.retention_days',     (int) $data['retention_days'],       'integer', 'backup');

        return response()->json(['success' => true, 'message' => 'Configuración guardada.']);
    }

    /**
     * Resumen de cuántos registros se incluirían en un nuevo backup. Se usa
     * para mostrar al usuario antes de confirmar la creación, así sabe que
     * está respaldando los datos correctos.
     */
    public function preview(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'users'            => User::count(),
                'guests'           => Guest::count(),
                'companies'        => Company::count(),
                'rooms'            => Room::count(),
                'reservations'     => Reservation::count(),
                'stays'            => Stay::count(),
                'active_stays'     => Stay::where('status', 'active')->count(),
                'inventory_items'  => InventoryItem::count(),
                'minibar_products' => MinibarProduct::count(),
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        $dir = $this->backupsDir();
        if (! File::isDirectory($dir)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $files = collect(File::files($dir))
            ->filter(fn($f) => str_ends_with($f->getFilename(), '.zip'))
            ->map(fn($f) => [
                'filename'   => $f->getFilename(),
                'size'       => $f->getSize(),
                'created_at' => date('Y-m-d\TH:i:s\Z', $f->getMTime()),
            ])
            ->sortByDesc('created_at')
            ->values();

        return response()->json(['success' => true, 'data' => $files]);
    }

    public function create(): JsonResponse
    {
        $db  = config('database.connections.pgsql');
        $ts  = now()->format('Y-m-d_H-i-s');
        $dir = $this->backupsDir();
        $sql = "{$dir}/backup_{$ts}.sql";
        $zip = "{$dir}/backup_{$ts}.zip";

        File::ensureDirectoryExists($dir);

        $env = [
            'PGPASSWORD' => $db['password'],
        ];

        $cmd = sprintf(
            'pg_dump -h %s -p %s -U %s -F p -f %s %s',
            escapeshellarg($db['host']),
            escapeshellarg($db['port']),
            escapeshellarg($db['username']),
            escapeshellarg($sql),
            escapeshellarg($db['database']),
        );

        $result = Process::env($env)->run($cmd);

        if (! $result->successful()) {
            return response()->json(['success' => false, 'message' => 'Error al generar el dump: ' . $result->errorOutput()], 500);
        }

        $za = new ZipArchive();
        $za->open($zip, ZipArchive::CREATE);
        $za->addFile($sql, "backup_{$ts}.sql");
        $za->close();

        @unlink($sql);

        $filename = "backup_{$ts}.zip";
        return response()->json([
            'success' => true,
            'data'    => [
                'filename'   => $filename,
                'size'       => filesize($zip),
                'created_at' => now()->toIso8601String(),
            ],
            'message' => 'Backup creado exitosamente.',
        ], 201);
    }

    public function download(string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $path = $this->backupsDir() . '/' . $filename;

        abort_unless(
            preg_match('/^backup_[\d_-]+\.zip$/', $filename) && File::exists($path),
            404,
            'Backup no encontrado.'
        );

        return response()->download($path, $filename);
    }

    /**
     * Arma al vuelo un ZIP con el script .bat y el README para que el usuario
     * pueda llevarlo al PC nuevo y cambiar la carpeta de backups con doble click.
     */
    public function downloadMigrationKit(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $kitSrcDir = resource_path('migration-kit');
        abort_unless(File::isDirectory($kitSrcDir), 500, 'El kit de migración no está disponible.');

        $tmpZip = storage_path('app/migration-kit-' . uniqid() . '.zip');
        $za = new ZipArchive();
        if ($za->open($tmpZip, ZipArchive::CREATE) !== true) {
            abort(500, 'No se pudo generar el ZIP.');
        }

        foreach (File::files($kitSrcDir) as $file) {
            $za->addFile($file->getPathname(), $file->getFilename());
        }
        $za->close();

        return response()
            ->download($tmpZip, 'kit-migracion-backups.zip')
            ->deleteFileAfterSend(true);
    }

    /**
     * Elimina todos los archivos backup_*.zip de la carpeta configurada.
     * Operación destructiva — la ruta debe estar restringida a superadmin.
     */
    public function deleteAll(): JsonResponse
    {
        $dir = $this->backupsDir();
        if (! File::isDirectory($dir)) {
            return response()->json(['success' => true, 'data' => ['deleted' => 0]]);
        }

        $deleted = 0;
        foreach (File::files($dir) as $f) {
            $name = $f->getFilename();
            if (preg_match('/^backup_[\d_-]+\.zip$/', $name)) {
                if (@unlink($f->getPathname())) {
                    $deleted++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => ['deleted' => $deleted],
            'message' => "Se eliminaron {$deleted} backups.",
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:zip|max:102400']);

        $db     = config('database.connections.pgsql');
        $upload = $request->file('file');
        $tmpDir = $this->backupsDir() . '/tmp';
        File::ensureDirectoryExists($tmpDir);

        $zipFull = $tmpDir . '/' . uniqid('restore_') . '.zip';
        $upload->move(dirname($zipFull), basename($zipFull));

        $za = new ZipArchive();
        if ($za->open($zipFull) !== true) {
            @unlink($zipFull);
            return response()->json(['success' => false, 'message' => 'No se pudo abrir el ZIP.'], 422);
        }

        $sqlName = null;
        for ($i = 0; $i < $za->numFiles; $i++) {
            $entry = $za->getNameIndex($i);
            if (str_ends_with($entry, '.sql')) {
                $sqlName = $entry;
                break;
            }
        }

        if (! $sqlName) {
            $za->close();
            @unlink($zipFull);
            return response()->json(['success' => false, 'message' => 'El ZIP no contiene un archivo SQL.'], 422);
        }

        $sqlPath = $tmpDir . '/restore.sql';
        file_put_contents($sqlPath, $za->getFromName($sqlName));
        $za->close();
        @unlink($zipFull);

        $env = ['PGPASSWORD' => $db['password']];
        $cmd = sprintf(
            'psql -h %s -p %s -U %s -d %s -f %s',
            escapeshellarg($db['host']),
            escapeshellarg($db['port']),
            escapeshellarg($db['username']),
            escapeshellarg($db['database']),
            escapeshellarg($sqlPath),
        );

        $result = Process::env($env)->run($cmd);
        @unlink($sqlPath);

        if (! $result->successful()) {
            return response()->json(['success' => false, 'message' => 'Error al restaurar: ' . $result->errorOutput()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Base de datos restaurada exitosamente.']);
    }
}
