<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $group    = $request->query('group');
        $query    = Setting::query();

        if ($group) {
            $query->where('group', $group);
        }

        $settings = $query->get()->keyBy('key')->map(fn($s) => $s->value);

        return $this->success($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings'         => ['required', 'array'],
            'settings.*.key'   => ['required', 'string', 'exists:settings,key'],
            'settings.*.value' => ['required'],
        ]);

        foreach ($data['settings'] as $item) {
            $setting = Setting::findOrFail($item['key']);
            $setting->update(['value' => (string) $item['value']]);
        }

        return $this->success(null, 'Configuración actualizada.');
    }
}
