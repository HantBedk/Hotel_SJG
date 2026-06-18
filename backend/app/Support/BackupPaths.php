<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\File;

final class BackupPaths
{
    public const SHARED_CONTAINER_PATH = '/var/www/html/backup';

    public static function resolve(?string $customFolder = null): string
    {
        $custom = $customFolder ?? Setting::get('backup.auto_backup_folder', '');
        if ($custom !== '' && $custom !== null) {
            return rtrim($custom, '/\\');
        }

        if (File::isDirectory(self::SHARED_CONTAINER_PATH) && is_writable(self::SHARED_CONTAINER_PATH)) {
            return self::SHARED_CONTAINER_PATH;
        }

        return storage_path('app/backups');
    }
}
