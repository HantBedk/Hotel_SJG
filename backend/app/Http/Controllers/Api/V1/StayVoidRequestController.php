<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Stay;
use App\Models\StayVoidRequest;
use App\Models\User;
use App\Support\StayVoidService;
use App\Traits\ApiResponse;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StayVoidRequestController extends Controller
{
    use ApiResponse, Paginates;

    public function __construct(
        private readonly StayVoidService $stayVoidService,
    ) {}

    public function store(Request $request, Stay $stay): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:5|max:500',
        ]);

        $voidRequest = $this->stayVoidService->requestVoid(
            $stay,
            $request->user(),
            $data['reason'],
        );

        return $this->success($voidRequest, 'Solicitud de anulación registrada. La habitación quedó disponible.', 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = StayVoidRequest::with([
            'stay.guest',
            'stay.stayRooms.room',
            'requestedBy.persona',
            'reviewedBy.persona',
        ])->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $requests = $query->paginate($this->perPage($request, 20));

        return $this->success($requests);
    }

    public function show(Request $request, StayVoidRequest $stayVoidRequest): JsonResponse
    {
        $this->authorizeView($request->user(), $stayVoidRequest);

        $stayVoidRequest->load([
            'stay.guest',
            'stay.company',
            'stay.stayRooms.room.roomType',
            'requestedBy.persona',
            'reviewedBy.persona',
        ]);

        return $this->success($stayVoidRequest);
    }

    public function approve(Request $request, StayVoidRequest $stayVoidRequest): JsonResponse
    {
        $data = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $voidRequest = $this->stayVoidService->approve(
            $stayVoidRequest,
            $request->user(),
            $data['admin_notes'] ?? null,
        );

        return $this->success($voidRequest, 'Anulación aprobada.');
    }

    public function reject(Request $request, StayVoidRequest $stayVoidRequest): JsonResponse
    {
        $data = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $voidRequest = $this->stayVoidService->reject(
            $stayVoidRequest,
            $request->user(),
            $data['admin_notes'] ?? null,
        );

        return $this->success($voidRequest, 'Solicitud de anulación rechazada.');
    }

    private function authorizeView(User $user, StayVoidRequest $voidRequest): void
    {
        if ($voidRequest->requested_by_id === $user->id) {
            return;
        }

        abort_unless(
            $user->can('approve_stay_void'),
            403,
            'No autorizado para ver esta solicitud.',
        );
    }
}
