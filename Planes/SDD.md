# Software Design Document (SDD)
# Hotel Manager — Sistema de Gestión Hotelera Local
# Versión: 1.0 | Fecha: 2026-05-30
# Cliente: Hotel San José del Guaviare (13 habitaciones + 1 Casa de 4 habitaciones)

---

## 1. Resumen Ejecutivo

Sistema web local para la gestión integral de un hotel pequeño (13 habitaciones + 1 Casa convertible de 4 habitaciones). El sistema opera 100% offline en red local, con actualización en tiempo real entre dispositivos. Incluye dashboard, control de habitaciones, reservas, calendario, inventario general/minibar/activos, checkout con pago mixto, comprobantes PDF, y módulo de configuración extensivo.

**Stack tecnológico:** React 19 + TypeScript 5.8 + Vite 8 + Laravel 12 + PHP 8.4 + PostgreSQL 16 + Docker + Laravel Reverb.

---

## 2. Alcance y Fases

### Fases del Proyecto
| Fase | Nombre | Entregable |
|------|--------|------------|
| 0 | Fundación | Docker, DB, Auth, Roles, Settings base |
| 1 | Dashboard + Habitaciones + Check-in | Vista principal, estados, wizard de 3 pasos |
| 2 | Reservas + Calendario | Reservas manuales, calendario semana/mes/año, alertas |
| 3 | Checkout + Pagos + Cuenta | Revisión minibar, pagos mixtos, comprobantes PDF |
| 4 | Inventario General + Minibar | Consumibles, activos, traslados, alertas vencimiento/stock |
| 5 | Configuración Completa | Hotel, precios, temporadas, roles, backup, servicios extras |
| 6 | Historial + Auditoría + Sugerencias | Log de actividad, sistema de aprendizaje local |
| 7 | Red Local + Tablets + Optimización | Multi-dispositivo, responsive final, pruebas en red |
| 8 | Facturación Electrónica + Pasarelas | Conexión externa (posterioremente, fuera de alcance inicial) |

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de Componentes
```
┌─────────────────────────────────────────┐
│           PCs Cliente (5-10)            │
│  (React SPA en Browser)                 │
│  http://192.168.1.100                   │
└──────────────┬──────────────────────────┘
               │ LAN
┌──────────────▼──────────────────────────┐
│        PC Maestra (Docker Host)         │
│  ┌─────────────────────────────────┐    │
│  │  Contenedor: app (Nginx+PHP)  │    │
│  │  - Laravel API (/api/v1/*)    │    │
│  │  - React Build (/)            │    │
│  │  - Cron Backup (23:59)        │    │
│  └─────────────┬─────────────────┘    │
│  ┌─────────────▼─────────────────┐    │
│  │  Contenedor: reverb           │    │
│  │  - WebSockets (port 8080)     │    │
│  └─────────────┬─────────────────┘    │
│  ┌─────────────▼─────────────────┐    │
│  │  Contenedor: db (Postgres)    │    │
│  │  - Volúmen persistente          │    │
│  └───────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 3.2 Flujo de Datos en Tiempo Real
1. Recepcionista A hace check-in → Laravel emite evento `RoomOccupied`.
2. Reverb transmite a canal `hotel.rooms`.
3. Todas las PCs conectadas reciben el evento vía WebSocket.
4. Zustand actualiza el estado localmente; UI se refresca sin recarga.

---

## 4. Modelo de Datos (Diagrama Entidad-Relación)

### 4.1 Entidades y Relaciones

```
[Hotel] 1───* [Season]
[Hotel] 1───* [Setting]

[User] 1───* [Stay] (created_by)
[User] 1───* [Payment] (receptionist_id)
[User] 1───* [ActivityLog]
[User] 1───* [Notification] (dismissed_by)
[User] 1───* [InventoryTransaction] (performed_by)
[User] 1───* [Room] (cleaning_marked_by)

[Role] *───* [Permission] (Spatie)
[User] *───* [Role]

[Guest] 1───* [GuestCompanion]
[Guest] 1───* [Stay]
[Guest] 1───* [Reservation]
[Guest] 1───* [Payment] (indirecto via Stay)

[Company] 1───* [Stay]
[Company] 1───* [Reservation]

[RoomType] 1───* [Room]
[House] 1───* [Room] (nullable house_id)
[House] 1───* [Reservation] (house_id)

[Room] 1───* [StayRoom]
[Room] 1───* [Reservation] (room_id)
[Room] 1───* [RoomMinibar]
[Room] 1───* [RoomTransfer] (from/to)
[Room] 1───* [Asset] (location)

[Stay] 1───* [StayRoom]
[Stay] 1───* [Payment]
[Stay] 1───* [StayService]
[Stay] 1───* [MinibarConsumption]
[Stay] 1───* [RoomTransfer]

[Reservation] 1───* [ReservationPayment]

[InventoryCategory] 1───* [InventoryItem]
[InventoryItem] 1───* [InventoryTransaction]
[InventoryItem] 1───* [MinibarProduct]
[InventoryItem] 1───* [Asset] (opcional)

[MinibarProduct] 1───* [RoomMinibar]
[MinibarProduct] 1───* [MinibarConsumption]

[Asset] 1───* [AssetMaintenance]
[Asset] 1───* [RepairOrder]

[ExtraService] 1───* [StayService]
```

### 4.2 Diccionario de Datos (Tablas Clave)

#### `hotels`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | Nombre del hotel |
| nit | string | NIT Colombia |
| address | text | |
| phone | string | |
| email | string | |
| logo_path | string nullable | Ruta en storage |
| check_in_time | time nullable | Hora oficial check-in |
| check_out_time | time | Default 13:00 |
| iva_enabled | boolean | Default true |
| iva_rate | decimal(5,2) | Default 19.00 |
| currency | string | Default COP |
| country | string | Default Colombia |
| created_at / updated_at | timestamp | |

#### `users`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | |
| email | string unique | |
| password | string hashed | |
| active | boolean | Default true |
| created_at / updated_at | timestamp | |

#### `guests`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| full_name | string | |
| document_type | enum: cc, ce, passport, nit | |
| document_number | string unique | |
| email | string nullable | |
| phone | string nullable | |
| nationality | string nullable | |
| birth_date | date nullable | |
| notes | text nullable | |
| created_at / updated_at | timestamp | |

#### `companies`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | |
| nit | string unique | |
| address | text nullable | |
| phone | string nullable | |
| email | string nullable | |
| contact_name | string nullable | |
| created_at / updated_at | timestamp | |

#### `room_types`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | Sencilla, Doble, King... |
| description | text nullable | |
| base_price | decimal(12,2) | |
| capacity | integer | |
| created_at / updated_at | timestamp | |

#### `houses`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | Ej: Casa Principal |
| price | decimal(12,2) | Precio fijo por noche |
| active | boolean | Default true |
| created_at / updated_at | timestamp | |

#### `rooms`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| number | string | Ej: 101, 102 |
| room_type_id | UUID FK | |
| house_id | UUID FK nullable | Si pertenece a una Casa |
| status | enum | available, occupied, cleaning, maintenance, reserved |
| current_price | decimal(12,2) | Sobrescribe base_price |
| notes | text nullable | |
| created_at / updated_at | timestamp | |

#### `reservations`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| guest_id | UUID FK | |
| company_id | UUID FK nullable | |
| room_id | UUID FK nullable | Si es habitación individual |
| house_id | UUID FK nullable | Si es Casa completa |
| status | enum | pending, confirmed, checked_in, cancelled, no_show |
| start_date | date | |
| end_date | date | |
| nights | integer | Calculado |
| agreed_price | decimal(12,2) | Precio acordado por noche o total |
| deposit_amount | decimal(12,2) nullable | Abono inicial |
| payment_status | enum | pending, partial, paid |
| created_by | UUID FK | Usuario que creó la reserva |
| notes | text nullable | |
| created_at / updated_at | timestamp | |

#### `stays`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| guest_id | UUID FK | |
| company_id | UUID FK nullable | |
| status | enum | active, extended, checked_out |
| check_in_datetime | datetime | |
| check_out_datetime | datetime | Fecha/hora estimada |
| actual_check_out_datetime | datetime nullable | Fecha/hora real |
| total_amount | decimal(12,2) nullable | Calculado al checkout |
| paid_amount | decimal(12,2) nullable | Sumatoria de payments |
| created_by | UUID FK | |
| notes | text nullable | |
| created_at / updated_at | timestamp | |

#### `stay_rooms`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| stay_id | UUID FK | |
| room_id | UUID FK | |
| check_in_date | date | |
| check_out_date | date | |
| price_per_night | decimal(12,2) | |
| nights | integer | |
| subtotal | decimal(12,2) | price_per_night * nights |
| created_at / updated_at | timestamp | |

#### `payments`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| stay_id | UUID FK | |
| amount | decimal(12,2) | |
| payment_method | enum | cash, transfer, card |
| payment_type | enum | deposit, partial, final |
| paid_by | enum | guest, company, mixed |
| receptionist_id | UUID FK | Quién recibió |
| payment_date | datetime | |
| notes | text nullable | |
| created_at / updated_at | timestamp | |

#### `minibar_products`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | |
| inventory_item_id | UUID FK nullable | Link a inventario general |
| sale_price | decimal(12,2) | Precio al huésped |
| cost_price | decimal(12,2) | Precio de costo |
| description | text nullable | |
| created_at / updated_at | timestamp | |

#### `room_minibars`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| room_id | UUID FK | |
| minibar_product_id | UUID FK | |
| quantity | integer | Stock actual en la habitación |
| last_restocked_at | datetime | |
| restocked_by | UUID FK nullable | |
| created_at / updated_at | timestamp | |

#### `minibar_consumptions`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| stay_id | UUID FK | |
| room_id | UUID FK | |
| minibar_product_id | UUID FK | |
| quantity | integer | |
| type | enum | consumed, damaged, missing |
| unit_price | decimal(12,2) | Precio al momento del consumo |
| total | decimal(12,2) | quantity * unit_price |
| registered_at | datetime | |
| registered_by | UUID FK | |
| created_at / updated_at | timestamp | |

#### `inventory_items`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| category_id | UUID FK | |
| code | string unique | PROD-XXXXX (consumibles), auto |
| name | string | |
| brand | string nullable | |
| presentation | string nullable | Ej: 1.5L, 500ml |
| unit | string | unidad de medida |
| cost_price | decimal(12,2) | |
| sale_price | decimal(12,2) nullable | Para minibar |
| current_stock | integer | |
| min_stock_threshold | integer | Default 5 |
| expiry_date | date nullable | |
| supplier | string nullable | |
| invoice_number | string nullable | |
| location | string nullable | |
| created_at / updated_at | timestamp | |

#### `inventory_transactions`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| inventory_item_id | UUID FK | |
| type | enum | entry, exit_to_minibar, exit_to_housekeeping, adjustment, sale |
| quantity | integer | Positivo o negativo |
| unit_price | decimal(12,2) | Precio al momento |
| total_value | decimal(12,2) | |
| performed_by | UUID FK | |
| destination_room_id | UUID FK nullable | Si va a minibar |
| destination_user_id | UUID FK nullable | Si va a housekeeping |
| notes | text nullable | |
| created_at | timestamp | |

#### `assets`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| inventory_item_id | UUID FK nullable | |
| asset_code | string unique | ACT-XXXX |
| name | string | |
| brand | string nullable | |
| model | string nullable | |
| serial_number | string nullable | |
| location_type | enum | room, general |
| room_id | UUID FK nullable | |
| purchase_date | date nullable | |
| warranty_expiry | date nullable | |
| status | enum | active, maintenance, retired |
| created_at / updated_at | timestamp | |

#### `asset_maintenances`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| asset_id | UUID FK | |
| scheduled_date | date | |
| completed_date | date nullable | |
| description | text | |
| cost | decimal(12,2) nullable | |
| technician_id | UUID FK nullable | |
| next_maintenance_date | date nullable | |
| status | enum | pending, completed, cancelled |
| created_at / updated_at | timestamp | |

#### `repair_orders`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| asset_id | UUID FK nullable | |
| room_id | UUID FK nullable | |
| description | text | |
| reported_by | UUID FK | |
| assigned_to | UUID FK nullable | |
| cost | decimal(12,2) nullable | |
| status | enum | pending, in_progress, completed |
| completed_at | datetime nullable | |
| created_at / updated_at | timestamp | |

#### `extra_services`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | |
| price | decimal(12,2) | |
| description | text nullable | |
| active | boolean | Default true |
| created_at / updated_at | timestamp | |

#### `stay_services`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| stay_id | UUID FK | |
| extra_service_id | UUID FK | |
| quantity | integer | Default 1 |
| unit_price | decimal(12,2) | |
| total | decimal(12,2) | |
| applied_at | datetime | |
| applied_by | UUID FK | |
| created_at / updated_at | timestamp | |

#### `notifications`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| type | enum | season_alert, expiry_alert, low_stock, reservation_reminder, checkout_reminder, cleaning_alert, maintenance_alert, system |
| title | string | |
| message | text | |
| severity | enum | info, warning, critical |
| target_role | enum | superadmin, admin, receptionist |
| is_modal | boolean | Default false |
| scheduled_at | datetime nullable | |
| dismissed_at | datetime nullable | |
| dismissed_by | UUID FK nullable | |
| action_url | string nullable | Ruta interna |
| created_at / updated_at | timestamp | |

#### `activity_logs`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK nullable | |
| action | enum | create, update, delete, payment, check_in, check_out, transfer, login, logout |
| entity_type | string | Nombre de la tabla |
| entity_id | UUID | |
| old_values | json nullable | |
| new_values | json nullable | |
| ip_address | string nullable | |
| created_at | timestamp | |

#### `backups`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| file_path | string | |
| file_size | integer | bytes |
| type | enum | auto, manual | |
| status | enum | success, failed | |
| created_at | timestamp | |

#### `settings`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| category | string | Ej: hotel, pricing, notifications, backup |
| key | string | |
| value | text | JSON o string |
| created_at / updated_at | timestamp | |

---

## 5. Diseño de API (Endpoints Detallados)

Ver SKILL-04-API.md para especificación completa. Resumen de grupos:

- **Auth**: `/api/v1/login`, `/api/v1/logout`, `/api/v1/me`
- **Dashboard**: Stats, chart, available rooms
- **Rooms**: CRUD, check-in, checkout, transfer, cleaning flow
- **Guests**: Búsqueda, CRUD
- **Companies**: Búsqueda, CRUD
- **Reservations**: CRUD, check-in inmediato, cancel, extend
- **Stays**: CRUD, extend, add room, account summary, payments, services, minibar charges
- **Payments**: CRUD
- **Inventory**: Items, transactions, assets, maintenances, repairs, minibar products
- **Calendar**: Ocupación dinámica, crear reserva
- **Settings**: Configuración global, precios masivos
- **Notifications**: Listado, dismiss, unread count
- **Backup**: Trigger manual, restore, list
- **Activity Log**: Auditoría por fecha

---

## 6. Flujos de Usuario (Diagramas de Secuencia)

### 6.1 Check-in Walk-in (sin reserva)
```
Recepcionista → Click Habitación Disponible
  → Modal Wizard Paso 1: Buscar/Crear Huésped + Acompañantes + Checkbox Empresa
  → (Si empresa) Paso 2: Buscar/Crear Empresa
  → Paso 3: Confirmar fechas, ver minibar, precios, resumen
  → Confirmar
    → Backend: Crear Stay + StayRooms + Payments (si abono) + RoomMinibar (cargar plantilla)
    → Room.status → occupied
    → Emitir evento Reverb
    → Generar comprobante PDF (opcional)
    → Registrar en ActivityLog
  → Frontend: Actualizar Dashboard y Vista Habitaciones en tiempo real
```

### 6.2 Check-in Inmediato (desde reserva)
```
Admin/Recepcionista → Ver Reserva Pendiente (o alerta automática)
  → Click "Check-in Inmediato"
  → Precarga huésped y empresa de la reserva
  → Verifica habitación:
    - Si disponible: continúa
    - Si ocupada: alerta admin, opción de reasignar o forzar (con auditoría)
  → Paso 3: Confirmar fechas, minibar, resumen
  → Confirmar
    → Reservation.status → checked_in
    → Crear Stay + StayRooms
    → Room.status → occupied
    → Transferir abono de ReservationPayment a Payment (si aplica)
```

### 6.3 Checkout Completo
```
Recepcionista → Click Habitación Ocupada → "Iniciar Checkout"
  → Modal Revisión Minibar:
    - Lista esperada vs real
    - Marcar consumidos, dañados, faltantes
    - Calcular totales de minibar
  → Banner late checkout (si aplica)
  → Lista servicios extras usados (editable)
  → Resumen de cuenta:
    - Habitaciones: noches × precio
    - Minibar: consumos + daños
    - Servicios extras
    - Recargos (manual, con justificación)
    - Subtotal, IVA (si aplica), TOTAL
  → Opciones de pago:
    - Método: cash, transfer, card
    - Responsable: guest | company | mixed
    - Si mixed: asignar qué conceptos paga empresa vs huésped
  → Registrar pago(s)
    → Stay.status → checked_out
    → Room.status → cleaning
    → Actualizar RoomMinibar (descontar consumidos)
    → InventoryTransaction (sale)
    → Generar comprobante PDF
    → Registrar en ActivityLog
  → Notificación a admin (si pago mixto o monto alto)
```

### 6.4 Reserva Manual
```
Recepcionista → Nueva Reserva
  → Wizard: Huésped (crear si no existe) → Empresa (opcional)
  → Seleccionar tipo de habitación o Casa
  → Fechas inicio/fin
  → Precio acordado
  → Abono opcional (registrar pago contra reserva)
  → Guardar
    → Reservation.status = pending
    → ReservationPayment (si abono)
    → Calendario muestra como "separada" (azul claro)
    → Alerta programada para fecha próxima
```

### 6.5 Transferencia de Huésped
```
Admin → Click Habitación Ocupada → "Transferir Huésped"
  → Seleccionar habitación destino (debe estar available)
  → Motivo (opcional)
  → Confirmar
    → Crear RoomTransfer
    → StayRoom actual: marcar check_out_date = ahora
    → Crear nuevo StayRoom con habitación destino
    → Room origen.status → cleaning
    → Room destino.status → occupied
    → Notificar en tiempo real
```

---

## 7. Diseño de Interfaz de Usuario (UI)

### 7.1 Paleta de Colores (Tailwind)
- Fondo principal: `bg-slate-50`
- Sidebar: `bg-slate-900 text-white`
- Primario: `emerald-600` (acciones positivas, disponible)
- Peligro: `rose-600` (ocupada, cancelar, eliminar)
- Advertencia: `amber-500` (limpieza, alertas)
- Info: `sky-500` (reservas, notificaciones)
- Texto principal: `slate-900`
- Texto secundario: `slate-500`

### 7.2 Layout
- **Desktop**: Sidebar fijo (240px) + Área de contenido scrollable.
- **Tablet**: Sidebar colapsable a iconos.
- **Móvil**: Bottom navigation o hamburger menu.

### 7.3 Componentes Clave
- `RoomCard`: Tarjeta de habitación con color de estado, número, tipo, ícono de Casa si aplica, badge de estado.
- `WizardModal`: Modal de 3 pasos con indicador de progreso.
- `MinibarCheck`: Lista tipo checklist para revisión de minibar.
- `AccountSummary`: Tabla desglosada de cuenta con IVA.
- `CalendarGrid`: Grid interactivo con drag-selection.
- `NotificationCenter`: Drawer lateral con historial de notificaciones.
- `ActivityLogCalendar`: Calendario mensual donde cada día muestra contador de actividades; click para ver detalle.

---

## 8. Seguridad

### 8.1 Autenticación
- Sanctum tokens con expiración configurable (default 8 horas).
- Login con email + password.
- Logout invalida token.

### 8.2 Autorización (Spatie)
- Permisos granulares definidos en config:
  - `view_dashboard`, `view_rooms`, `manage_rooms`, `view_reservations`, `manage_reservations`, `check_in`, `check_out`, `view_inventory`, `manage_inventory`, `view_settings`, `manage_settings`, `view_activity_log`, `manage_users`, `manage_roles`, `trigger_backup`, `restore_backup`
- Roles por defecto:
  - `superadmin`: all permissions
  - `admin`: all except `manage_roles` (solo si superadmin se lo asigna explícitamente)
  - `receptionist`: `view_dashboard`, `view_rooms`, `manage_reservations`, `check_in`, `check_out`, `view_inventory` (solo lectura de minibar)
  - `housekeeping`: (en BD, sin permisos de UI por ahora)
  - `maintenance`: (en BD, sin permisos de UI por ahora)

### 8.3 Datos
- Contraseñas hasheadas con bcrypt.
- Tokens almacenados en memoria (Zustand), NO en localStorage.
- PostgreSQL accesible solo dentro de la red Docker.
- Backups ZIP protegidos en carpeta local.

---

## 9. Rendimiento y Escalabilidad

- Índices PostgreSQL en: `guests.document_number`, `rooms.status`, `reservations.start_date/end_date`, `stays.check_in_datetime`, `inventory_items.code`.
- Búsqueda de huéspedes y empresas con índice trigram (`pg_trgm`) para búsqueda parcial rápida.
- Paginación en todos los listados (15 items por página).
- Carga lazy de calendario: solo fetch rango visible.
- Imágenes comprimidas y logo en formato webp.
- WebSockets solo transmiten diffs (cambio de estado), no datasets completos.

---

## 10. Plan de Pruebas por Fase

| Fase | Pruebas |
|------|---------|
| 0 | Docker build, migraciones, seeders, login, roles |
| 1 | Check-in walk-in, estados de habitación, wizard completo, tiempo real |
| 2 | Crear reserva, calendario, alertas, check-in desde reserva |
| 3 | Checkout completo, minibar, pagos mixtos, comprobante PDF |
| 4 | Inventario, traslados a minibar, alertas vencimiento, stock bajo |
| 5 | Configuración masiva de precios, temporadas, backup manual |
| 6 | Auditoría, sugerencias, historial de pagos |
| 7 | Acceso desde 3+ dispositivos simultáneos, responsive en tablet |

---

## 11. Documentación de Mantenimiento

- **Actualización de dependencias**: Revisar trimestralmente versiones de Laravel y React.
- **Limpieza de logs**: ActivityLog mayor a 2 años puede archivarse a backup.
- **Backup**: Verificar diariamente que el ZIP se genera y tiene tamaño razonable.
- **Reverb**: Monitorear que el servicio WebSocket está activo (`docker ps`).

---

*Documento generado como base para el desarrollo. Cualquier cambio debe ser aprobado por el cliente y reflejado en las Skills del proyecto.*
