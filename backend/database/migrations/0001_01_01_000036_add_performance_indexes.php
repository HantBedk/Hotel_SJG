<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // stays: búsquedas por estado + fechas (check-in list, dashboard)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_stays_status_checkin ON stays (status, check_in_date DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_stays_checkout_date ON stays (check_out_date) WHERE deleted_at IS NULL');

        // payments: historial de pagos por fecha
        DB::statement('CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_payments_stay ON payments (stay_id, created_at DESC)');

        // reservations: por estado + fecha inicio
        DB::statement('CREATE INDEX IF NOT EXISTS idx_reservations_status_start ON reservations (status, start_date)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_reservations_room_dates ON reservations (room_id, start_date, end_date) WHERE status != \'cancelled\'');

        // activity_logs: búsqueda por acción + usuario + fecha
        DB::statement('CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action, created_at DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs (user_id, created_at DESC)');

        // rooms: filtro por status (grid de habitaciones)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms (status) WHERE deleted_at IS NULL');

        // inventory_items: stock bajo + vencimiento
        DB::statement('CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items (current_stock, min_stock_threshold)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items (expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL');

        // notifications: no leídas por usuario
        DB::statement('CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at) WHERE read_at IS NULL');

        // guests: búsqueda por documento (pg_trgm para LIKE)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_guests_document_trgm ON guests USING gin (document_number gin_trgm_ops) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        $indexes = [
            'idx_stays_status_checkin',
            'idx_stays_checkout_date',
            'idx_payments_created',
            'idx_payments_stay',
            'idx_reservations_status_start',
            'idx_reservations_room_dates',
            'idx_activity_logs_action',
            'idx_activity_logs_user',
            'idx_rooms_status',
            'idx_inventory_low_stock',
            'idx_inventory_expiry',
            'idx_notifications_user_unread',
            'idx_guests_document_trgm',
        ];

        foreach ($indexes as $index) {
            DB::statement("DROP INDEX IF EXISTS {$index}");
        }
    }
};
