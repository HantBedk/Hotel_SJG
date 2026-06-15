<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use ZipArchive;

class CreateAutoBackup extends Command
{
    protected $signature   = 'backup:auto';
    protected $description = 'Genera el backup automático diario si está habilitado';

    public function handle(): int
    {
        if (! Setting::get('backup.auto_backup', true)) {
            $this->info('Auto-backup deshabilitado en configuración.');
            return Command::SUCCESS;
        }

        $db  = config('database.connections.pgsql');
        $ts  = now()->format('Y-m-d_H-i-s');
        $dir = $this->resolveDir();
        $sql = "{$dir}/backup_{$ts}.sql";
        $zip = "{$dir}/backup_{$ts}.zip";

        File::ensureDirectoryExists($dir);

        $result = Process::env(['PGPASSWORD' => $db['password']])->run(sprintf(
            'pg_dump -h %s -p %s -U %s -F p -f %s %s',
            escapeshellarg($db['host']),
            escapeshellarg($db['port']),
            escapeshellarg($db['username']),
            escapeshellarg($sql),
            escapeshellarg($db['database']),
        ));

        if (! $result->successful()) {
            $this->error('pg_dump falló: ' . $result->errorOutput());
            return Command::FAILURE;
        }

        $za = new ZipArchive();
        $za->open($zip, ZipArchive::CREATE);
        $za->addFile($sql, "backup_{$ts}.sql");
        $za->close();
        @unlink($sql);

        $this->pruneOldBackups($dir);

        $this->info("Backup creado: backup_{$ts}.zip");
        return Command::SUCCESS;
    }

    private function resolveDir(): string
    {
        $custom = Setting::get('backup.auto_backup_folder', '');
        return ! empty($custom) ? rtrim($custom, '/\\') : storage_path('app/backups');
    }

    private function pruneOldBackups(string $dir): void
    {
        $days = (int) Setting::get('backup.retention_days', 30);
        if ($days <= 0) {
            return;
        }

        $cutoff = now()->subDays($days)->timestamp;
        collect(File::files($dir))
            ->filter(fn($f) => str_ends_with($f->getFilename(), '.zip') && $f->getMTime() < $cutoff)
            ->each(fn($f) => @unlink($f->getPathname()));
    }
}
