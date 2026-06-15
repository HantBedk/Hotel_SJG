<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\Room;
use App\Models\Stay;
use App\Support\ActivityLogRoomResolver;
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
        'stay.minibar'           => 'Venta de productos (estadía)',
        'minibar_sale.created'   => 'Venta de productos creada',
        'minibar_sale.paid'      => 'Venta de productos pagada',
        'minibar_sale.cancelled' => 'Venta de productos cancelada',
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

        // Si el usuario actual es recepcionista (sin escalar a admin/superadmin),
        // solo puede ver actividades de OTROS recepcionistas.
        $current = $request->user();
        if ($current && $current->hasRole('receptionist') && ! $current->hasAnyRole(['admin', 'superadmin'])) {
            $query->whereHas('user.roles', fn($q) => $q->where('name', 'receptionist'));
        }

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

        $paginator = $query->paginate($this->perPage($request, 50));
        $items     = $paginator->getCollection();

        [$stayIds, $roomIds] = ActivityLogRoomResolver::collectLookupIds($items);
        $stayRoomNumbers     = $this->resolveStayRoomNumbers($stayIds);
        $roomNumbers         = $this->resolveRoomNumbers($roomIds);

        $paginator->setCollection($items->map(function ($log) use ($stayRoomNumbers, $roomNumbers) {
            $payload   = $log->payload ?? [];
            $roomLabel = ActivityLogRoomResolver::fromPayload($payload)
                ?? ActivityLogRoomResolver::fromFallback($payload, $stayRoomNumbers, $roomNumbers);

            return [
                'id'           => $log->id,
                'action'       => $log->action,
                'action_label' => self::ACTION_LABELS[$log->action] ?? $log->action,
                'user_id'      => $log->user_id,
                'user_name'    => $log->user?->name ?? 'Sistema',
                'user_role'    => $log->user?->roles->first()?->name,
                'room_label'   => $roomLabel,
                'payload'      => $log->payload,
                'created_at'   => $log->created_at,
            ];
        }));

        return response()->json(['success' => true, 'data' => $paginator]);
    }

    /** @return array<string, list<string>> */
    private function resolveStayRoomNumbers(array $stayIds): array
    {
        if ($stayIds === []) {
            return [];
        }

        $map = [];
        Stay::query()
            ->with(['stayRooms.room:id,number'])
            ->whereIn('id', $stayIds)
            ->get()
            ->each(function (Stay $stay) use (&$map) {
                $map[$stay->id] = $stay->stayRooms
                    ->map(fn ($sr) => $sr->room?->number)
                    ->filter()
                    ->values()
                    ->all();
            });

        return $map;
    }

    /** @return array<string, string> */
    private function resolveRoomNumbers(array $roomIds): array
    {
        if ($roomIds === []) {
            return [];
        }

        return Room::query()
            ->whereIn('id', $roomIds)
            ->pluck('number', 'id')
            ->all();
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
        $query = Payment::with(['stay.guest', 'receptionist.persona', 'cancelledBy.persona'])
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
            $query->whereHas('stay.guest', fn ($q) => $q->search($guestName));
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
