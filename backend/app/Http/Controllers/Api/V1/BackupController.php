<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\BackupPaths;
use App\Models\Company;
use App\Models\Persona;
use App\Models\InventoryItem;
use App\Models\MinibarProduct;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use ZipArchive;

class BackupController extends Controller
{
    /** ZIP de restauración (KB). Alineado con upload_max_filesize/post_max_size (50M) en docker/php/local.ini. */
    private const MAX_RESTORE_UPLOAD_KB = 51_200;

    private function backupsDir(): string
    {
        return BackupPaths::resolve();
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
        $defaultPath = BackupPaths::resolve();

        // Vacío = se usará la carpeta por defecto.
        if ($path === '') {
            File::ensureDirectoryExists($defaultPath);
            $exists   = File::isDirectory($defaultPath);
            $writable = $exists && is_writable($defaultPath);

            return response()->json([
                'success' => true,
                'data'    => [
                    'using_default' => true,
                    'resolved_path' => $defaultPath,
                    'exists'        => $exists,
                    'writable'      => $writable,
                    'message'       => 'Se usará la carpeta por defecto: ' . $defaultPath,
                ],
            ]);
        }

        $exists   = File::isDirectory($path);
        $writable = $exists && is_writable($path);

        // Si la ruta es la carpeta compartida con el PC, mostramos al usuario
        // el path real de su computador (no /var/www/html/backup que es del container).
        $isShared = rtrim($path, '/\\') === BackupPaths::SHARED_CONTAINER_PATH;
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
                'retention_days'      => Setting::get('backup.retention_days', 7),
                'shared_container_path' => BackupPaths::SHARED_CONTAINER_PATH,
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
                'guests'           => Persona::guests()->count(),
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

        // --clean --if-exists: el SQL incluye DROP TABLE IF EXISTS antes de cada CREATE,
        // para que la restauración sobre una BD ya inicializada no choque con tablas existentes.
        $cmd = sprintf(
            'pg_dump -h %s -p %s -U %s -F p --clean --if-exists -f %s %s',
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
            if (preg_match('/^backup_[\d_-]+\.zip$/', $name) && @unlink($f->getPathname())) {
                $deleted++;
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
        $request->validate([
            'file' => 'required|file|mimes:zip|max:' . self::MAX_RESTORE_UPLOAD_KB,
        ]);

        $db     = config('database.connections.pgsql');
        $upload = $request->file('file');
        $tmpDir = $this->backupsDir() . '/tmp';
        File::ensureDirectoryExists($tmpDir);

        $zipFull = $tmpDir . '/' . uniqid('restore_') . '.zip';
        $upload->move(dirname($zipFull), basename($zipFull));

        $za = new ZipArchive();
        if ($za->open($zipFull) !== true) {
            @unlink($zipFull);
            $this->restoreFailed('No se pudo abrir el ZIP.');
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
            $this->restoreFailed('El ZIP no contiene un archivo SQL.');
        }

        $sqlPath = $tmpDir . '/restore.sql';
        file_put_contents($sqlPath, $za->getFromName($sqlName));
        $za->close();
        @unlink($zipFull);

        $env = ['PGPASSWORD' => $db['password']];

        // ON_ERROR_STOP=1: detiene psql al primer error en lugar de continuar silenciosamente.
        // --single-transaction: si algo falla, se hace ROLLBACK completo (no quedan datos parciales).
        $cmd = sprintf(
            'psql -h %s -p %s -U %s -d %s --single-transaction -v ON_ERROR_STOP=1 -f %s',
            escapeshellarg($db['host']),
            escapeshellarg($db['port']),
            escapeshellarg($db['username']),
            escapeshellarg($db['database']),
            escapeshellarg($sqlPath),
        );

        $result = Process::env($env)->run($cmd);
        @unlink($sqlPath);

        if (! $result->successful()) {
            $this->restoreFailed('Error al restaurar: ' . $result->errorOutput(), 500);
        }

        return response()->json(['success' => true, 'message' => 'Base de datos restaurada exitosamente.']);
    }

    private function restoreFailed(string $message, int $status = 422): never
    {
        throw new HttpResponseException(
            response()->json(['success' => false, 'message' => $message], $status),
        );
    }

    public function wipeDatabase(Request $request): JsonResponse
    {
        $data = $request->validate([
            'confirm'    => 'required|string|in:BORRAR',
            'keep_users' => 'sometimes|boolean',
        ]);

        $keepUsers = (bool) ($data['keep_users'] ?? false);

        try {
            // 1) Snapshot SIEMPRE de los superadmins (nunca se borran).
            //    Si keep_users=true, además captura el resto de usuarios.
            $userQuery = User::query()->with(['persona.roles', 'persona']);
            if (! $keepUsers) {
                $userQuery->whereHas('persona.roles', fn ($q) => $q->where('name', 'superadmin'));
            }
            $preserved = $userQuery->get()->map(fn ($u) => [
                'id'                => $u->id,
                'person_id'         => $u->person_id,
                'email'             => $u->email,
                'email_verified_at' => $u->email_verified_at,
                'password'          => $u->password,
                'remember_token'    => $u->remember_token,
                'is_active'         => $u->is_active,
                'created_at'        => $u->created_at,
                'updated_at'        => $u->updated_at,
                '_persona'          => $u->persona?->getAttributes(),
                '_roles'            => $u->getRoleNames()->all(),
            ])->all();

            // 2) Drop + recreate estructura.
            Artisan::call('migrate:fresh', ['--force' => true]);

            // 3) Reseed: roles/permisos + datos base. NO SuperAdminSeeder
            //    porque restauramos los superadmins reales desde el snapshot.
            Artisan::call('db:seed', ['--class' => 'NationalitiesSeeder',    '--force' => true]);
            Artisan::call('db:seed', ['--class' => 'RolesPermissionsSeeder', '--force' => true]);
            Artisan::call('db:seed', ['--class' => 'HotelSeeder',            '--force' => true]);
            Artisan::call('db:seed', ['--class' => 'SettingsSeeder',         '--force' => true]);

            // 4) Restaurar usuarios preservados con sus IDs y roles originales.
            //    Inserción directa para preservar UUIDs y evitar re-hash de password.
            foreach ($preserved as $row) {
                $roles   = $row['_roles'];
                $persona = $row['_persona'] ?? null;
                unset($row['_roles'], $row['_persona']);

                if ($persona) {
                    DB::table('personas')->insertOrIgnore($persona);
                }

                DB::table('users')->insert($row);

                $user = User::find($row['id']);
                if (! $user || empty($roles)) {
                    continue;
                }
                $user->syncRoles($roles);
            }
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al borrar la base de datos: ' . $e->getMessage(),
            ], 500);
        }

        $preservedCount = count($preserved);
        return response()->json([
            'success'        => true,
            'keep_users'     => $keepUsers,
            'preserved_users'=> $preservedCount,
            'message'        => $keepUsers
                ? "Datos borrados. Se conservaron {$preservedCount} usuario(s) — podés seguir trabajando."
                : "Datos y usuarios borrados. Se conservaron {$preservedCount} superadmin(s) — podés seguir trabajando.",
        ]);
    }
}
