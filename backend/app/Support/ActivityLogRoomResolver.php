<?php

namespace App\Support;

/**
 * Deriva etiqueta de habitación(es) desde payload de activity_logs.
 */
class ActivityLogRoomResolver
{
    public static function fromPayload(?array $payload): ?string
    {
        if (! $payload) {
            return null;
        }

        return self::scalarRoomNumber($payload)
            ?? self::joinedRoomList($payload, 'rooms')
            ?? self::joinedRoomList($payload, 'room_numbers')
            ?? self::transferByNumber($payload)
            ?? self::joinedRoomListFromItems($payload);
    }

    /**
     * @param  array<string, list<string>>  $stayRoomNumbers
     * @param  array<string, string>  $roomNumbers
     */
    public static function fromFallback(?array $payload, array $stayRoomNumbers, array $roomNumbers): ?string
    {
        if (! $payload) {
            return null;
        }

        return self::roomsForStay($payload, $stayRoomNumbers)
            ?? self::roomForId($payload, $roomNumbers)
            ?? self::transferById($payload, $roomNumbers)
            ?? self::roomsForIds($payload, $roomNumbers);
    }

    /**
     * @param  iterable<array{payload?: array|null}|object{payload?: array|null}>  $logs
     * @return array{0: list<string>, 1: list<string>}
     */
    public static function collectLookupIds(iterable $logs): array
    {
        $stayIds = [];
        $roomIds = [];

        foreach ($logs as $log) {
            self::appendLookupIds($log, $stayIds, $roomIds);
        }

        return [array_values(array_unique($stayIds)), array_values(array_unique($roomIds))];
    }

    private static function appendLookupIds(mixed $log, array &$stayIds, array &$roomIds): void
    {
        $payload = self::extractPayload($log);
        if (! is_array($payload) || self::fromPayload($payload) !== null) {
            return;
        }

        if (! empty($payload['stay_id'])) {
            $stayIds[] = (string) $payload['stay_id'];
        }

        foreach (['room_id', 'from_room_id', 'to_room_id'] as $key) {
            if (! empty($payload[$key])) {
                $roomIds[] = (string) $payload[$key];
            }
        }

        if (! empty($payload['room_ids']) && is_array($payload['room_ids'])) {
            foreach ($payload['room_ids'] as $roomId) {
                $roomIds[] = (string) $roomId;
            }
        }
    }

    private static function extractPayload(mixed $log): ?array
    {
        if (is_array($log)) {
            return $log['payload'] ?? null;
        }

        if (is_object($log) && isset($log->payload)) {
            return is_array($log->payload) ? $log->payload : null;
        }

        return null;
    }

    private static function scalarRoomNumber(array $payload): ?string
    {
        if (empty($payload['room_number']) || ! is_scalar($payload['room_number'])) {
            return null;
        }

        return (string) $payload['room_number'];
    }

    private static function joinedRoomList(array $payload, string $key): ?string
    {
        if (empty($payload[$key]) || ! is_array($payload[$key])) {
            return null;
        }

        return self::joinUniqueStrings($payload[$key]);
    }

    private static function transferByNumber(array $payload): ?string
    {
        $from = $payload['from_room_number'] ?? null;
        $to   = $payload['to_room_number'] ?? null;

        if (! $from || ! $to) {
            return null;
        }

        return $from . ' → ' . $to;
    }

    private static function joinedRoomListFromItems(array $payload): ?string
    {
        if (empty($payload['items']) || ! is_array($payload['items'])) {
            return null;
        }

        $rooms = [];
        foreach ($payload['items'] as $item) {
            if (is_array($item) && ! empty($item['room_number'])) {
                $rooms[] = (string) $item['room_number'];
            }
        }

        return self::joinUniqueStrings($rooms);
    }

    /** @param  array<string, list<string>>  $stayRoomNumbers */
    private static function roomsForStay(array $payload, array $stayRoomNumbers): ?string
    {
        $stayId = $payload['stay_id'] ?? null;
        if (! $stayId || ! isset($stayRoomNumbers[$stayId])) {
            return null;
        }

        return self::joinUniqueStrings($stayRoomNumbers[$stayId]);
    }

    /** @param  array<string, string>  $roomNumbers */
    private static function roomForId(array $payload, array $roomNumbers): ?string
    {
        $roomId = $payload['room_id'] ?? null;

        return ($roomId && isset($roomNumbers[$roomId])) ? $roomNumbers[$roomId] : null;
    }

    /** @param  array<string, string>  $roomNumbers */
    private static function transferById(array $payload, array $roomNumbers): ?string
    {
        $fromId = $payload['from_room_id'] ?? null;
        $toId   = $payload['to_room_id'] ?? null;

        if (! $fromId && ! $toId) {
            return null;
        }

        $from = $roomNumbers[$fromId ?? ''] ?? null;
        $to   = $roomNumbers[$toId ?? ''] ?? null;

        if ($from && $to) {
            return "{$from} → {$to}";
        }

        return $from ?? $to;
    }

    /** @param  array<string, string>  $roomNumbers */
    private static function roomsForIds(array $payload, array $roomNumbers): ?string
    {
        if (empty($payload['room_ids']) || ! is_array($payload['room_ids'])) {
            return null;
        }

        $rooms = [];
        foreach ($payload['room_ids'] as $roomId) {
            if (isset($roomNumbers[$roomId])) {
                $rooms[] = $roomNumbers[$roomId];
            }
        }

        return self::joinUniqueStrings($rooms);
    }

    /** @param  list<mixed>  $values */
    private static function joinUniqueStrings(array $values): ?string
    {
        $rooms = array_values(array_unique(array_filter(array_map('strval', $values))));

        return $rooms === [] ? null : implode(', ', $rooms);
    }
}
