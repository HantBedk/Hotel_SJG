<?php

namespace App\Support;

final class PersonNameParser
{
    /**
     * @return array{primer_nombre: string, segundo_nombre: ?string, primer_apellido: string, segundo_apellido: ?string}
     */
    public static function split(string $fullName): array
    {
        $tokens = preg_split('/\s+/u', trim($fullName), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return match (count($tokens)) {
            0 => [
                'primer_nombre'   => '',
                'segundo_nombre'  => null,
                'primer_apellido' => '',
                'segundo_apellido'=> null,
            ],
            1 => [
                'primer_nombre'   => $tokens[0],
                'segundo_nombre'  => null,
                'primer_apellido' => '',
                'segundo_apellido'=> null,
            ],
            2 => [
                'primer_nombre'   => $tokens[0],
                'segundo_nombre'  => null,
                'primer_apellido' => $tokens[1],
                'segundo_apellido'=> null,
            ],
            3 => [
                'primer_nombre'   => $tokens[0],
                'segundo_nombre'  => null,
                'primer_apellido' => $tokens[1],
                'segundo_apellido'=> $tokens[2],
            ],
            default => [
                'primer_nombre'   => $tokens[0],
                'segundo_nombre'  => $tokens[1],
                'primer_apellido' => $tokens[count($tokens) - 2],
                'segundo_apellido'=> $tokens[count($tokens) - 1],
            ],
        };
    }

    public static function join(
        ?string $primerNombre,
        ?string $segundoNombre,
        ?string $primerApellido,
        ?string $segundoApellido,
    ): string {
        return trim(implode(' ', array_filter([
            $primerNombre,
            $segundoNombre,
            $primerApellido,
            $segundoApellido,
        ], fn ($part) => $part !== null && $part !== '')));
    }
}
