# Skill: Modelo de Datos y Reglas de Negocio — Hotel Manager

## Entidades Principales

### 1. Hotel (settings)
- `id` (UUID), `name`, `nit`, `address`, `phone`, `email`, `logo_path`, `check_in_time` (nullable, configurable), `check_out_time` (default 13:00), `iva_enabled` (bool, default true), `iva_rate` (decimal, default 19.0), `currency` (default COP), `country` (default Colombia).
- Solo superadmin y admin pueden editar.

### 2. Users (empleados del sistema)
- `id` (UUID), `name`, `email`, `password`, `role` (superadmin, admin, receptionist, housekeeping, maintenance), `active` (bool).
- Autenticación vía Sanctum tokens.
- Roles manejados con Spatie Permission.

### 3. Guests (huéspedes)
- `id` (UUID), `full_name`, `document_type` (CC, CE, PASAPORTE, NIT), `document_number` (único), `email`, `phone`, `nationality`, `birth_date` (opcional), `notes`.
- Un huésped puede tener múltiples acompañantes (tabla `guest_companions`).
- Un huésped puede tener múltiples estadías y múltiples habitaciones simultáneas.

### 4. Companies (empresas)
- `id` (UUID), `name`, `nit`, `address`, `phone`, `email`, `contact_name`.
- Se crea en el momento si no existe, durante el wizard de check-in o reserva.

### 5. Room Types (tipos de habitación)
- `id` (UUID), `name` (Sencilla, Doble, King, Presidencial), `description`, `base_price` (default), `capacity`.

### 6. Rooms (habitaciones)
- `id` (UUID), `number`, `room_type_id`, `house_id` (nullable, FK a houses), `status` (enum: available, occupied, cleaning, maintenance, reserved), `current_price` (sobrescribe base si aplica), `notes`.
- Estados: SOLO UNO A LA VEZ. Nunca múltiples.
- Después de checkout automático → `cleaning`.
- De `cleaning` a `available` requiere seleccionar empleado de housekeeping y registrar hora de finalización.

### 7. Houses (casas)
- `id` (UUID), `name` (ej: "Casa Principal"), `price` (fijo, configurable), `room_ids` (relación: 4 habitaciones pertenecen a esta casa), `active`.
- Si la Casa está reservada/ocupada en un rango de fechas, esas 4 habitaciones se BLOQUEAN en el calendario (lógica de negocio, no es un estado de room).
- Si UNA habitación de la Casa está reservada individualmente, la Casa se bloquea para ese rango (no se puede reservar la Casa completa en esas fechas). Las otras 3 habitaciones de la Casa SÍ se pueden usar individualmente.
- El admin prioriza llenar el hotel antes de usar la Casa.

### 8. Seasons (temporadas)
- `id` (UUID), `name`, `start_date`, `end_date`, `price_multiplier` o `fixed_price_override`, `active`.
- Notificación anticipada configurable al admin en horarios de baja saturación.

### 9. Reservations (reservas)
- `id` (UUID), `guest_id`, `company_id` (nullable), `room_id` (nullable, se asigna al check-in), `house_id` (nullable, si reserva la Casa), `status` (pending, confirmed, checked_in, cancelled, no_show), `start_date`, `end_date`, `nights`, `agreed_price` (por noche o total), `deposit_amount` (nullable), `payment_status` (pending, partial, paid), `created_by` (user_id), `notes`.
- Una reserva NO bloquea la habitación físicamente hasta el check-in; aparece como "separada" en el calendario.
- Alerta configurable cuando se acerca la fecha/hora de la reserva.
- Vencimiento: modal de alerta, NO cancelación automática. El admin/recepcionista decide.

### 10. Stays (estadías / check-ins activos)
- `id` (UUID), `guest_id`, `company_id` (nullable), `status` (active, extended, checked_out), `check_in_datetime`, `check_out_datetime`, `actual_check_out_datetime` (nullable), `created_by`, `notes`.
- Una estadía puede tener MÚLTIPLES habitaciones (tabla `stay_rooms`).
- Una estadía puede extenderse (cambiar `check_out_datetime`).
- Transferencia de huésped: se crea registro en `room_transfers` (from_room_id, to_room_id, reason, transferred_by, transferred_at). La estadía continúa.

### 11. Stay Rooms (habitaciones por estadía)
- `id` (UUID), `stay_id`, `room_id`, `check_in_date`, `check_out_date`, `price_per_night`, `nights`, `subtotal`.
- Permite que un huésped tenga varias habitaciones.

### 12. Payments (pagos y abonos)
- `id` (UUID), `stay_id`, `amount`, `payment_method` (cash, transfer, card), `payment_type` (deposit, partial, final), `paid_by` (guest, company, mixed), `receptionist_id` (quién recibió el pago), `payment_date`, `notes`.
- Historial completo por estadía.
- Abonos antes del check-in se registran contra la reserva (tabla `reservation_payments`).

### 13. Minibar Products (catálogo de minibar)
- `id` (UUID), `name`, `inventory_product_id` (nullable, link a consumibles), `sale_price`, `cost_price` (del inventario), `description`.

### 14. Room Minibar (inventario por habitación)
- `id` (UUID), `room_id`, `minibar_product_id`, `quantity`, `last_restocked_at`, `restocked_by` (user_id).
- Carga inicial al check-in desde una "plantilla de minibar" configurable.

### 15. Minibar Consumptions (consumos/daños)
- `id` (UUID), `stay_id`, `room_id`, `minibar_product_id`, `quantity`, `type` (consumed, damaged, missing), `unit_price`, `total`, `registered_at`, `registered_by`.
- Al checkout se revisa y se registran faltantes/consumos. Se suman a la cuenta.

### 16. Inventory Categories (categorías de inventario)
- `id` (UUID), `name` (Consumibles, Activos, Limpieza), `type` (consumable, asset, cleaning).

### 17. Inventory Items (productos del inventario general)
- `id` (UUID), `category_id`, `code` (auto-secuencial para consumibles, formato: PROD-00001), `name`, `brand`, `presentation` (ej: "1.5L", "500ml", "1kg"), `unit`, `cost_price`, `sale_price` (para minibar), `current_stock`, `min_stock_threshold` (default 5, configurable), `expiry_date` (nullable), `supplier`, `invoice_number` (nullable), `location`.
- Para consumibles: al crear, sugerir si ya existe producto con misma marca + presentación. Si es diferente presentación, es producto nuevo con nuevo código.
- Historial de recargas: tabla `inventory_transactions` (type: entry, exit_to_minibar, exit_to_housekeeping, adjustment, sale).

### 18. Assets (activos)
- `id` (UUID), `inventory_item_id` (si aplica), `asset_code` (auto, ej: ACT-0001), `name`, `brand`, `model`, `serial_number`, `location` (room_id o general), `purchase_date`, `warranty_expiry`, `status` (active, maintenance, retired).
- Mantenimientos programados: tabla `asset_maintenances` (asset_id, scheduled_date, completed_date, description, cost, technician_id, next_maintenance_date, status).
- Órdenes de reparación: tabla `repair_orders` (asset_id, room_id, description, reported_by, assigned_to, cost, status, completed_at).

### 19. Extra Services (servicios extras)
- `id` (UUID), `name`, `price`, `description`, `active`.
- CRUD en configuración.

### 20. Stay Services (servicios usados durante estadía)
- `id` (UUID), `stay_id`, `extra_service_id`, `quantity`, `unit_price`, `total`, `applied_at`, `applied_by`.

### 21. Notifications (centro de notificaciones)
- `id` (UUID), `type` (season_alert, expiry_alert, low_stock, reservation_reminder, checkout_reminder, cleaning_alert, maintenance_alert, system), `title`, `message`, `severity` (info, warning, critical), `target_role` (admin, superadmin, receptionist), `is_modal` (bool), `scheduled_at`, `dismissed_at`, `dismissed_by`, `action_url` (ruta interna a la que redirige).
- Modales para admin en horarios de baja saturación (configurable: default 06:00 y 20:00).
- Todos los modales dejan registro en notificaciones.

### 22. Settings / Configuraciones
- Tabla clave-valor o tabla estructurada por categoría: `hotel_info`, `pricing`, `notifications`, `reservations`, `cleaning`, `backup`, `roles_permissions`.
- Solo superadmin y admin pueden editar.

### 23. Activity Log (historial de auditoría)
- `id` (UUID), `user_id`, `action` (create, update, delete, payment, check_in, check_out, transfer, etc.), `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `created_at`.
- Toda transacción, pago, abono, cambio de estado debe quedar aquí.
- Vista tipo calendario: seleccionar día y ver todas las transacciones con hora y usuario.

### 24. Backups
- `id` (UUID), `file_path`, `file_size`, `type` (auto, manual), `created_at`, `status`.
- Configuración: ruta local, hora (default 23:59), retención (configurable, default 30 días o ilimitado hasta que el usuario decida).
- Formato ZIP con dump de PostgreSQL + carpeta `storage/app` (logos, comprobantes).

## Reglas de Negocio Críticas
1. **IVA**: Todos los precios de venta (habitaciones, minibar, servicios) se almacenan CON IVA incluido. Si `iva_enabled=true`, el checkout desglosa subtotal + IVA. Si `iva_enabled=false`, no hay desglose.
2. **Checkout**: Si el huésped se pasa de la hora configurada, el sistema muestra banner amigable: "Recuerde: checkout excedido, calcular cobro adicional". El recepcionista ingresa el monto manualmente como "late checkout fee".
3. **Pagos mixtos**: Al checkout, si hay empresa asociada, opciones: (a) Todo empresa, (b) Todo huésped, (c) Mixto: empresa paga habitación, huésped paga minibar + extras + recargos.
4. **Precios**: Cada habitación tiene `current_price`. El admin puede editar masivamente desde Configuración > Habitaciones.
5. **Casa**: Precio fijo independiente de la suma de habitaciones. Si se reserva la Casa, las 4 habitaciones se bloquean en calendario. Si se reserva 1 habitación de la Casa, la Casa se bloquea para ese rango.
6. **Cancelación**: No hay cancelación automática de reservas. Solo alertas y decisión humana.
7. **Extensión de estadía**: Se edita `check_out_datetime` de la estadía y de `stay_rooms`. Se recalcula automáticamente.
8. **Checkout anticipado**: Se cobran solo las noches efectivamente usadas + consumos + extras. Se hace checkout normal.
