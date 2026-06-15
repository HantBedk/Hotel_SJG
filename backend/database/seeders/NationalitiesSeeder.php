<?php

namespace Database\Seeders;

use App\Models\Nationality;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NationalitiesSeeder extends Seeder
{
    /** @var list<array{name: string, iso_code: string, sort_order: int}> */
    private const COUNTRIES = [
        ['name' => 'Colombia', 'iso_code' => 'CO', 'sort_order' => 0],
        ['name' => 'Venezuela', 'iso_code' => 'VE', 'sort_order' => 1],
        ['name' => 'Ecuador', 'iso_code' => 'EC', 'sort_order' => 2],
        ['name' => 'Perú', 'iso_code' => 'PE', 'sort_order' => 3],
        ['name' => 'Brasil', 'iso_code' => 'BR', 'sort_order' => 4],
        ['name' => 'Argentina', 'iso_code' => 'AR', 'sort_order' => 5],
        ['name' => 'Chile', 'iso_code' => 'CL', 'sort_order' => 6],
        ['name' => 'Panamá', 'iso_code' => 'PA', 'sort_order' => 7],
        ['name' => 'México', 'iso_code' => 'MX', 'sort_order' => 8],
        ['name' => 'Estados Unidos', 'iso_code' => 'US', 'sort_order' => 9],
        ['name' => 'España', 'iso_code' => 'ES', 'sort_order' => 10],
        ['name' => 'Francia', 'iso_code' => 'FR', 'sort_order' => 11],
        ['name' => 'Alemania', 'iso_code' => 'DE', 'sort_order' => 12],
        ['name' => 'Reino Unido', 'iso_code' => 'GB', 'sort_order' => 13],
        ['name' => 'Canadá', 'iso_code' => 'CA', 'sort_order' => 14],
        ['name' => 'China', 'iso_code' => 'CN', 'sort_order' => 15],
        ['name' => 'Otro', 'iso_code' => 'XX', 'sort_order' => 99],
    ];

    public function run(): void
    {
        foreach (self::COUNTRIES as $country) {
            Nationality::query()->updateOrCreate(
                ['iso_code' => $country['iso_code']],
                [
                    'name'       => $country['name'],
                    'sort_order' => $country['sort_order'],
                    'is_active'  => true,
                ],
            );
        }
    }

    public static function resolveId(?string $label): ?string
    {
        if ($label === null || trim($label) === '') {
            return null;
        }

        $normalized = Str::lower(trim($label));

        $match = Nationality::query()
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->orWhereRaw('LOWER(iso_code) = ?', [$normalized])
            ->first();

        if ($match) {
            return $match->id;
        }

        $created = Nationality::query()->create([
            'name'       => trim($label),
            'iso_code'   => null,
            'sort_order' => 98,
            'is_active'  => true,
        ]);

        return $created->id;
    }
}
