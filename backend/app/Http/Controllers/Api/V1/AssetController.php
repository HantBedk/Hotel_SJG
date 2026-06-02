<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetMaintenance;
use App\Models\RepairOrder;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetController extends Controller
{
    use Paginates;

    // ── Assets ────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Asset::with('room')->orderBy('asset_code');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(fn($q) => $q->where('name', 'ilike', "%{$search}%")
                ->orWhere('asset_code', 'ilike', "%{$search}%")
                ->orWhere('serial_number', 'ilike', "%{$search}%"));
        }

        return response()->json(['success' => true, 'data' => $query->paginate($this->perPage($request, 30))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:150',
            'brand'         => 'nullable|string|max:100',
            'model'         => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'location_type' => 'required|in:room,general',
            'room_id'       => 'nullable|uuid|exists:rooms,id',
            'purchase_date' => 'nullable|date',
            'warranty_expiry' => 'nullable|date',
        ]);

        $asset = DB::transaction(function () use ($data) {
            $last = Asset::lockForUpdate()->orderByDesc('asset_code')->first();
            $num  = $last ? ((int) ltrim(substr($last->asset_code, 4), '0') ?: 0) + 1 : 1;
            $code = 'ACT-' . str_pad($num, 4, '0', STR_PAD_LEFT);

            return Asset::create(array_merge($data, ['asset_code' => $code]));
        });

        return response()->json(['success' => true, 'data' => $asset->load('room'), 'message' => 'Activo creado.'], 201);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:150',
            'brand'         => 'nullable|string|max:100',
            'model'         => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'location_type' => 'sometimes|in:room,general',
            'room_id'       => 'nullable|uuid|exists:rooms,id',
            'purchase_date' => 'nullable|date',
            'warranty_expiry' => 'nullable|date',
            'status'        => 'sometimes|in:active,maintenance,retired',
        ]);

        $asset->update($data);
        return response()->json(['success' => true, 'data' => $asset->load('room'), 'message' => 'Activo actualizado.']);
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $asset->update(['status' => 'retired']);
        return response()->json(['success' => true, 'message' => 'Activo retirado.']);
    }

    // ── Maintenance ───────────────────────────────────────────────────────────

    public function maintenances(Request $request): JsonResponse
    {
        $query = AssetMaintenance::with(['asset', 'technician'])->orderByDesc('scheduled_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($assetId = $request->query('asset_id')) {
            $query->where('asset_id', $assetId);
        }

        return response()->json(['success' => true, 'data' => $query->paginate($this->perPage($request, 30))]);
    }

    public function addMaintenance(Request $request, Asset $asset): JsonResponse
    {
        $data = $request->validate([
            'scheduled_date'  => 'required|date',
            'description'     => 'required|string',
            'technician_id'   => 'nullable|uuid|exists:users,id',
            'next_maintenance_date' => 'nullable|date',
        ]);

        $maintenance = $asset->maintenances()->create(array_merge($data, ['status' => 'pending']));
        $asset->update(['status' => 'maintenance']);

        return response()->json(['success' => true, 'data' => $maintenance, 'message' => 'Mantenimiento programado.'], 201);
    }

    public function completeMaintenance(Request $request, AssetMaintenance $maintenance): JsonResponse
    {
        abort_if($maintenance->status === 'completed', 409, 'Este mantenimiento ya fue completado.');

        $data = $request->validate([
            'completed_date'        => 'nullable|date',
            'cost'                  => 'nullable|numeric|min:0',
            'notes'                 => 'nullable|string',
            'next_maintenance_date' => 'nullable|date',
        ]);

        $maintenance->update(array_merge($data, [
            'completed_date' => $data['completed_date'] ?? now()->toDateString(),
            'status'         => 'completed',
        ]));

        // Return asset to active if no pending maintenances
        $hasPending = $maintenance->asset->maintenances()->where('status', 'pending')->exists();
        if (!$hasPending) {
            $maintenance->asset->update(['status' => 'active']);
        }

        return response()->json(['success' => true, 'data' => $maintenance->load('asset'), 'message' => 'Mantenimiento completado.']);
    }

    // ── Repair orders ─────────────────────────────────────────────────────────

    public function repairOrders(Request $request): JsonResponse
    {
        $query = RepairOrder::with(['asset', 'room', 'reportedBy', 'assignedTo'])->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json(['success' => true, 'data' => $query->paginate($this->perPage($request, 30))]);
    }

    public function createRepairOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'asset_id'    => 'nullable|uuid|exists:assets,id',
            'room_id'     => 'nullable|uuid|exists:rooms,id',
            'description' => 'required|string',
        ]);

        abort_if(!$data['asset_id'] && !$data['room_id'], 422, 'Debe indicar un activo o una habitación.');

        $order = RepairOrder::create(array_merge($data, ['reported_by' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $order->load('asset', 'room', 'reportedBy'), 'message' => 'Orden creada.'], 201);
    }

    public function assignRepairOrder(Request $request, RepairOrder $repairOrder): JsonResponse
    {
        $data = $request->validate(['assigned_to' => 'required|uuid|exists:users,id']);

        $repairOrder->update(['assigned_to' => $data['assigned_to'], 'status' => 'in_progress']);

        return response()->json(['success' => true, 'data' => $repairOrder->load('assignedTo'), 'message' => 'Orden asignada.']);
    }

    public function closeRepairOrder(Request $request, RepairOrder $repairOrder): JsonResponse
    {
        abort_if($repairOrder->status === 'completed', 409, 'Esta orden ya está cerrada.');

        $data = $request->validate([
            'cost'  => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $repairOrder->update([
            'cost'         => $data['cost'] ?? null,
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $repairOrder->refresh(), 'message' => 'Orden cerrada.']);
    }
}
