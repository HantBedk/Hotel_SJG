<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BackupController extends Controller
{
    private const DISK   = 'local';
    private const FOLDER = 'backups';

    public function index(): JsonResponse
    {
        $files = collect(Storage::disk(self::DISK)->files(self::FOLDER))
            ->filter(fn($f) => str_ends_with($f, '.zip'))
            ->map(function ($path) {
                $name = basename($path);
                return [
                    'filename'   => $name,
                    'size'       => Storage::disk(self::DISK)->size($path),
                    'created_at' => date('Y-m-d\TH:i:s\Z', Storage::disk(self::DISK)->lastModified($path)),
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return response()->json(['success' => true, 'data' => $files]);
    }

    public function create(): JsonResponse
    {
        $db   = config('database.connections.pgsql');
        $ts   = now()->format('Y-m-d_H-i-s');
        $sql  = storage_path("app/" . self::FOLDER . "/backup_{$ts}.sql");
        $zip  = storage_path("app/" . self::FOLDER . "/backup_{$ts}.zip");

        Storage::disk(self::DISK)->makeDirectory(self::FOLDER);

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

    public function download(string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $path = self::FOLDER . '/' . $filename;

        abort_unless(
            preg_match('/^backup_[\d_-]+\.zip$/', $filename) && Storage::disk(self::DISK)->exists($path),
            404,
            'Backup no encontrado.'
        );

        return Storage::disk(self::DISK)->download($path, $filename);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:zip|max:102400']);

        $db      = config('database.connections.pgsql');
        $upload  = $request->file('file');
        $zipPath = $upload->store('backups/tmp', self::DISK);
        $zipFull = storage_path('app/' . $zipPath);

        $za      = new ZipArchive();
        if ($za->open($zipFull) !== true) {
            Storage::disk(self::DISK)->delete($zipPath);
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
            Storage::disk(self::DISK)->delete($zipPath);
            return response()->json(['success' => false, 'message' => 'El ZIP no contiene un archivo SQL.'], 422);
        }

        $sqlPath = storage_path('app/backups/tmp/restore.sql');
        file_put_contents($sqlPath, $za->getFromName($sqlName));
        $za->close();
        Storage::disk(self::DISK)->delete($zipPath);

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
