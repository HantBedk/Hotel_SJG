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
        'stay.service'           => 'Servicio agregado',
        'stay.transfer'          => 'Transferencia de habitación',
        'stay.extended'          => 'Estadía extendida',
        'reservation.created'    => 'Reserva creada',
        'reservation.cancelled'  => 'Reserva cancelada',
        'reservation.updated'    => 'Reserva actualizada',
        'reservation.checkin'    => 'Check-in desde reserva',
        'room_created'           => 'Habitación creada',
        'room.status_changed'    => 'Cambio de estado de habitación',
        'inventory.restock'      => 'Reposición de inventario',
        'inventory.adjust'       => 'Ajuste de inventario',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user')
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
        $query = Payment::with(['stay.guest', 'receptionist'])
            ->orderByDesc('payment_date');

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
            'id'             => $p->id,
            'stay_id'        => $p->stay_id,
            'guest_name'     => $p->stay?->guest?->full_name ?? '—',
            'amount'         => $p->amount,
            'payment_method' => $p->payment_method,
            'payment_type'   => $p->payment_type,
            'paid_by'        => $p->paid_by,
            'receptionist'   => $p->receptionist?->name ?? '—',
            'payment_date'   => $p->payment_date,
            'notes'          => $p->notes,
        ]);

        return response()->json(['success' => true, 'data' => $payments]);
    }
}
