# Skill: API y Comunicación Backend-Frontend — Hotel Manager

## Convenciones de API
- Base URL: `/api/v1/`
- Respuesta estándar: `{ success: boolean, data: any, message: string, errors: object }`
- Códigos HTTP estándar: 200, 201, 400, 401, 403, 404, 422, 500.
- Autenticación: Bearer token de Sanctum en header `Authorization`.
- Todos los IDs en URL y body son UUIDs.

## Endpoints Principales (resumen)

### Auth
- POST `/api/v1/login` → token
- POST `/api/v1/logout`
- GET `/api/v1/me` → usuario autenticado

### Dashboard
- GET `/api/v1/dashboard/stats?period=day|week|month|year&metric=money|visits`
- GET `/api/v1/dashboard/chart?period=...&compare=true`
- GET `/api/v1/dashboard/available-rooms`

### Habitaciones
- GET `/api/v1/rooms` (con filtros de estado, tipo, casa)
- GET `/api/v1/rooms/{id}`
- POST `/api/v1/rooms/{id}/check-in` (walk-in)
- POST `/api/v1/rooms/{id}/checkout`
- POST `/api/v1/rooms/{id}/transfer` (cambio de habitación)
- POST `/api/v1/rooms/{id}/set-cleaning`
- POST `/api/v1/rooms/{id}/set-available` (requiere housekeeping_id)
- GET `/api/v1/rooms/{id}/minibar`
- PUT `/api/v1/rooms/{id}/minibar` (recargar)

### Huéspedes
- GET `/api/v1/guests?search=...`
- POST `/api/v1/guests`
- GET `/api/v1/guests/{id}`
- PUT `/api/v1/guests/{id}`

### Empresas
- GET `/api/v1/companies?search=...`
- POST `/api/v1/companies`
- GET `/api/v1/companies/{id}`

### Reservas
- GET `/api/v1/reservations`
- POST `/api/v1/reservations`
- GET `/api/v1/reservations/{id}`
- POST `/api/v1/reservations/{id}/check-in` (check-in inmediato)
- POST `/api/v1/reservations/{id}/cancel`
- PUT `/api/v1/reservations/{id}/extend`

### Estadías
- GET `/api/v1/stays?status=active`
- GET `/api/v1/stays/{id}`
- POST `/api/v1/stays/{id}/extend`
- POST `/api/v1/stays/{id}/add-room`
- GET `/api/v1/stays/{id}/account` (resumen de cuenta)
- POST `/api/v1/stays/{id}/payments`
- GET `/api/v1/stays/{id}/payments`
- POST `/api/v1/stays/{id}/services`
- POST `/api/v1/stays/{id}/minibar-charges`

### Pagos
- POST `/api/v1/payments` (registrar pago/abono)
- GET `/api/v1/payments?stay_id=...`

### Inventario
- GET `/api/v1/inventory/items`
- POST `/api/v1/inventory/items`
- PUT `/api/v1/inventory/items/{id}`
- POST `/api/v1/inventory/items/{id}/restock`
- POST `/api/v1/inventory/items/{id}/deliver` (a housekeeping)
- GET `/api/v1/inventory/assets`
- POST `/api/v1/inventory/assets/{id}/maintenance`
- GET `/api/v1/inventory/minibar-products`

### Calendario
- GET `/api/v1/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD&view=room|house`
- POST `/api/v1/calendar/reservations` (crear desde calendario)

### Configuración
- GET `/api/v1/settings`
- PUT `/api/v1/settings`
- GET `/api/v1/settings/rooms` (configuración de habitaciones y precios)
- PUT `/api/v1/settings/rooms/prices` (edición masiva)

### Notificaciones
- GET `/api/v1/notifications`
- POST `/api/v1/notifications/{id}/dismiss`
- GET `/api/v1/notifications/unread-count`

### Backup
- POST `/api/v1/backup/trigger` (manual)
- POST `/api/v1/backup/restore` (cargar archivo)
- GET `/api/v1/backup/list`

### Historial / Auditoría
- GET `/api/v1/activity-log?date=YYYY-MM-DD`

## WebSockets (Laravel Reverb)
- Canal privado: `hotel.notifications` → notificaciones en tiempo real.
- Canal privado: `hotel.rooms` → cambios de estado de habitaciones.
- Canal privado: `hotel.reservations` → nuevas reservas, check-ins.
- El frontend se suscribe a estos canales y actualiza Zustand sin recargar.

## Reglas de API
1. TODAS las respuestas de listado usan paginación por defecto (15 items).
2. Búsquedas por texto usan índices de PostgreSQL (GIN o trigram).
3. Validación de fechas: check-in < check-out, no superposición de reservas en misma habitación (con excepción de override por admin).
4. Transacciones de base de datos en operaciones críticas (pagos, checkout, check-in).
5. Soft delete en entidades clave (huéspedes, empresas, habitaciones) para preservar historial.
