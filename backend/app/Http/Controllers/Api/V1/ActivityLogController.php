<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use Paginates;

    private const ACTION_LABELS = [
        'login'                  => 'Inicio de sesión',
        'login_failed'           => 'Login fallido',
        'logout'                 => 'Cierre de sesión',
        'stay.checkin'           => 'Check-in',
        'stay.checkout'          => 'Check-out',
        'stay.payment'           => 'Pago registrado',
        'stay.payment_cancelled' => 'Pago anulado',
        'stay.service'           => 'Servicio agregado',
        'stay.transfer'          => 'Transferencia de habitación',
        'stay.extended'          => 'Estadía extendida',
        'stay.minibar_cancelled' => 'Consumo de minibar anulado',
        'reservation.created'    => 'Reserva creada',
        'reservation.cancelled'  => 'Reserva cancelada',
        'reservation.payment_cancelled' => 'Pago de reserva anulado',
        'reservation.updated'    => 'Reserva actualizada',
        'reservation.group_created' => 'Reserva grupal creada',
        'reservation.checkin'    => 'Check-in desde reserva',
        'room_created'           => 'Habitación creada',
        'room_updated'           => 'Habitación actualizada',
        'room_deactivated'       => 'Habitación desactivada',
        'room.status_changed'    => 'Cambio de estado',
        'room.cleaning'          => 'Habitación en limpieza',
        'room.maintenance'       => 'Habitación en mantenimiento',
        'inventory.restock'      => 'Reposición de inventario',
        'inventory.adjust'       => 'Ajuste de inventario',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user.roles')
            ->orderByDesc('created_at');

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->paginate($this->perPage($request, 50))->through(fn($log) => [
            'id'         => $log->id,
            'action'     => $log->action,
            'action_label' => self::ACTION_LABELS[$log->action] ?? $log->action,
            'user_id'    => $log->user_id,
            'user_name'  => $log->user?->name ?? 'Sistema',
            'user_role'  => $log->user?->roles->first()?->name,
            'payload'    => $log->payload,
            'created_at' => $log->created_at,
        ]);

        return response()->json(['success' => true, 'data' => $logs]);
    }

    public function actions(): JsonResponse
    {
        $actions = ActivityLog::distinct()->pluck('action')->map(fn($a) => [
            'value' => $a,
            'label' => self::ACTION_LABELS[$a] ?? $a,
        ]);

        return response()->json(['success' => true, 'data' => $actions]);
    }

    // ── Payments history ───────────────────────────────────────────────────────

    public function payments(Request $request): JsonResponse
    {
        $query = Payment::with(['stay.guest', 'receptionist', 'cancelledBy:id,name'])
            ->orderByDesc('payment_date');

        // Por defecto el historial muestra TODOS los pagos (anulados con badge).
        // Filtro opcional: ?status=active|cancelled para acotar.
        if (($status = $request->query('status')) === 'active') {
            $query->whereNull('cancelled_at');
        } elseif ($status === 'cancelled') {
            $query->whereNotNull('cancelled_at');
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('payment_date', '>=', $from);
        }

        if ($to = $request->query('date_to')) {
            $query->whereDate('payment_date', '<=', $to);
        }

        if ($method = $request->query('method')) {
            $query->where('payment_method', $method);
        }

        if ($receptionist = $request->query('receptionist_id')) {
            $query->where('receptionist_id', $receptionist);
        }

        if ($guestName = $request->query('guest')) {
            $query->whereHas('stay.guest', fn($q) =>
                $q->where('full_name', 'ilike', "%{$guestName}%")
            );
        }

        $payments = $query->paginate($this->perPage($request, 50))->through(fn($p) => [
            'id'                  => $p->id,
            'stay_id'             => $p->stay_id,
            'guest_name'          => $p->stay?->guest?->full_name ?? '—',
            'amount'              => $p->amount,
            'payment_method'      => $p->payment_method,
            'payment_type'        => $p->payment_type,
            'paid_by'             => $p->paid_by,
            'receptionist'        => $p->receptionist?->name ?? '—',
            'payment_date'        => $p->payment_date,
            'notes'               => $p->notes,
            'cancelled_at'        => $p->cancelled_at,
            'cancelled_by'        => $p->cancelledBy?->name,
            'cancellation_reason' => $p->cancellation_reason,
        ]);

        return response()->json(['success' => true, 'data' => $payments]);
    }
}
