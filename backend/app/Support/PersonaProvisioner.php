<?php

namespace App\Support;

use App\Models\Persona;
use App\Models\User;
use App\Support\EmailNormalizer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class PersonaProvisioner
{
    /**
     * @param  array<string, mixed>  $personFields
     * @param  array<string, mixed>  $userFields
     */
    public static function ensureStaffUser(array $personFields, array $userFields, string $role): User
    {
        $persona = self::findOrCreatePersona($personFields);
        if (! $persona->hasRole($role)) {
            $persona->assignRole($role);
        }

        $user = User::firstOrCreate(
            ['email' => EmailNormalizer::normalize($userFields['email']) ?? ''],
            [
                'person_id' => $persona->id,
                'password'  => $userFields['password'] ?? Hash::make('password'),
                'is_active' => $userFields['is_active'] ?? true,
            ],
        );

        if ($user->person_id !== $persona->id) {
            $user->update(['person_id' => $persona->id]);
        }

        if (! empty($userFields['password']) && ! $user->wasRecentlyCreated) {
            $user->update(['password' => $userFields['password']]);
        }

        return $user->fresh(['persona']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function findOrCreateGuest(array $data): Persona
    {
        $personFields = self::extractPersonFields($data);
        $persona = Persona::withTrashed()
            ->where('document_number', $personFields['document_number'])
            ->first();

        if ($persona) {
            if ($persona->trashed()) {
                $persona->restore();
            }
            $persona->update($personFields);
        } else {
            $persona = Persona::create($personFields);
        }

        if (! $persona->hasRole('guest')) {
            $persona->assignRole('guest');
        }

        return $persona->fresh(['nationality']);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function extractPersonFields(array $data): array
    {
        if (! empty($data['full_name']) && empty($data['primer_nombre'])) {
            $data = array_merge($data, PersonNameParser::split($data['full_name']));
        }

        return [
            'primer_nombre'    => $data['primer_nombre'] ?? '',
            'segundo_nombre'   => $data['segundo_nombre'] ?? null,
            'primer_apellido'  => $data['primer_apellido'] ?? '',
            'segundo_apellido' => $data['segundo_apellido'] ?? null,
            'document_type'    => $data['document_type'],
            'document_number'  => $data['document_number'],
            'is_minor'         => $data['is_minor'] ?? false,
            'relationship'     => $data['relationship'] ?? null,
            'email'            => $data['email'] ?? null,
            'phone'            => $data['phone'] ?? null,
            'nationality_id'   => $data['nationality_id'] ?? null,
            'birth_date'       => $data['birth_date'] ?? null,
            'notes'            => $data['notes'] ?? null,
        ];
    }

    /**
     * Vincula o crea la cuenta de usuario con correo real (sin placeholders).
     */
    public static function ensureUserForHotelAccess(Persona $persona, string $email): User
    {
        self::assertRealStaffEmail($email);
        $email = EmailNormalizer::normalize($email) ?? '';

        if ($persona->user) {
            abort_if(
                User::where('email', $email)->where('id', '!=', $persona->user->id)->exists(),
                422,
                'Ese correo ya está registrado en otra cuenta.',
            );

            if ($persona->user->email !== $email) {
                $persona->user->update(['email' => $email]);
            }

            return $persona->user->fresh();
        }

        abort_if(
            User::where('email', $email)->exists(),
            422,
            'Ese correo ya está registrado en otra cuenta.',
        );

        return User::create([
            'person_id' => $persona->id,
            'email'     => $email,
            'password'  => Hash::make(Str::random(40)),
            'is_active' => true,
        ]);
    }

    public static function assertRealStaffEmail(?string $email): void
    {
        abort_if(
            ! filled($email),
            422,
            'Los roles de personal requieren un correo electrónico real.',
        );

        abort_if(
            str_ends_with(strtolower(trim($email)), '@personal.local'),
            422,
            'Indica un correo electrónico real; el administrador debe proporcionarlo.',
        );
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private static function findOrCreatePersona(array $fields): Persona
    {
        $document = $fields['document_number'] ?? null;

        if ($document) {
            $existing = Persona::query()->where('document_number', $document)->first();
            if ($existing) {
                $existing->update($fields);

                return $existing->fresh();
            }
        }

        return Persona::create($fields);
    }
}
