<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Support\HotelAccess;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminHotelController extends Controller
{
    private const MSG_NO_ACTIVE_HOTEL = 'Selecciona un hotel activo.';

    public function indexHotels(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => HotelAccess::accessibleHotels($request->user()),
        ]);
    }

    public function storeHotel(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('manage_hotels'), 403);

        $data = $request->validate([
            'name'              => 'required|string|max:150',
            'nit'               => 'required|string|max:30|unique:hotels,nit',
            'address'           => 'nullable|string|max:200',
            'phone'             => 'nullable|string|max:30',
            'email'             => 'nullable|email|max:100',
            'city'              => 'nullable|string|max:100',
            'country'           => 'nullable|string|max:100',
            'check_in_time'     => 'nullable|date_format:H:i',
            'check_out_time'    => 'nullable|date_format:H:i',
            'late_checkout_fee' => 'nullable|numeric|min:0',
            'currency'          => 'nullable|string|max:5',
            'tax_rate'          => 'nullable|numeric|min:0|max:1',
        ]);

        $hotel = Hotel::create($data);

        return response()->json(['success' => true, 'data' => $hotel, 'message' => 'Hotel creado.'], 201);
    }

    public function updateHotel(Request $request, Hotel $hotel): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $user->can('manage_hotels') || ($user->can('view_hotels') && HotelAccess::canAccess($user, $hotel->id)),
            403,
            'No tienes permiso para editar este hotel.',
        );

        $data = $request->validate([
            'name'              => 'sometimes|string|max:150',
            'nit'               => 'sometimes|string|max:30|unique:hotels,nit,' . $hotel->id,
            'address'           => 'nullable|string|max:200',
            'phone'             => 'nullable|string|max:30',
            'email'             => 'nullable|email|max:100',
            'city'              => 'nullable|string|max:100',
            'country'           => 'nullable|string|max:100',
            'check_in_time'     => 'nullable|date_format:H:i',
            'check_out_time'    => 'nullable|date_format:H:i',
            'late_checkout_fee' => 'nullable|numeric|min:0',
            'currency'          => 'nullable|string|max:5',
            'tax_rate'          => 'nullable|numeric|min:0|max:1',
        ]);

        $hotel->update($data);

        return response()->json(['success' => true, 'data' => $hotel, 'message' => 'Hotel actualizado.']);
    }

    public function destroyHotel(Request $request, Hotel $hotel): JsonResponse
    {
        abort_unless($request->user()->can('manage_hotels'), 403);
        abort_if(Hotel::count() <= 1, 409, 'Debe existir al menos un hotel.');

        $hotel->delete();

        return response()->json(['success' => true, 'message' => 'Hotel eliminado.']);
    }

    public function getHotelInfo(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->requireActiveHotel()]);
    }

    public function updateHotelInfo(Request $request): JsonResponse
    {
        $hotel = $this->requireActiveHotel();

        $user = $request->user();
        abort_unless(
            $user->can('manage_settings') && HotelAccess::canAccess($user, $hotel->id),
            403,
        );

        $data = $request->validate([
            'name'    => 'sometimes|string|max:150',
            'nit'     => 'sometimes|string|max:30',
            'address' => 'nullable|string|max:200',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email|max:100',
            'city'    => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
        ]);

        $hotel->update($data);

        return response()->json(['success' => true, 'data' => $hotel, 'message' => 'Información del hotel actualizada.']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $hotel = $this->requireActiveHotel();

        $request->validate(['logo' => 'required|image|max:2048']);

        $old  = $hotel->logo_path;
        $path = $request->file('logo')->store('logos', 'public');
        $hotel->update(['logo_path' => $path]);

        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        return response()->json([
            'success' => true,
            'data'    => ['logo_path' => $hotel->logo_path, 'logo_url' => $hotel->logo_url],
            'message' => 'Logo actualizado.',
        ]);
    }

    private function requireActiveHotel(): Hotel
    {
        $hotel = TenantContext::hotel();
        abort_unless($hotel, 400, self::MSG_NO_ACTIVE_HOTEL);

        return $hotel;
    }
}
