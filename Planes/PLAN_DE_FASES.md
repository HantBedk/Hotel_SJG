# Plan de Desarrollo por Fases — Hotel Manager
## Versión 1.1 | Markdown Chuleable
> **v1.1** — Se integran mejoras detectadas en análisis cruzado de SDD, Skills y Borradores (30/05/2026).

---

## 📋 Instrucciones de Uso
- [ ] Marca cada tarea cuando esté **terminada y probada**.
- **NO saltar fases**. Cada fase es base para la siguiente.
- Al final de cada fase, hacer **prueba de flujo completo** antes de pasar a la siguiente.
- Si algo no está claro durante el desarrollo, consultar el **SDD.md** y las **Skills** en `/skills/`.
- Al finalizar cada fase, verificar los **Criterios de Fase Completada** listados al final de las pruebas.

---

## 🗺️ Mapa de Conexiones entre Fases

```
Fase 0 (Fundación)
    ├── Fase 1 (Dashboard + Habitaciones + Check-in)
    │       ├── Fase 2 (Reservas + Calendario)
    │       └── Fase 3 (Checkout + Pagos + PDF)
    │               └── Fase 4 (Inventario + Minibar)
    │                       └── Fase 5 (Configuración)
    │                               └── Fase 6 (Auditoría + Sugerencias)
    │                                       └── Fase 7 (Red Local + Responsive)
    │                                               └── Fase 8 (Facturación + Pasarelas)
    │
    └── Todo el sistema se alimenta de Fase 0 (Auth, DB, Docker, Settings)
```

**Regla de oro**: Si modificas algo en una fase anterior, verificar que no rompes las fases posteriores.

---

## 🏗️ FASE 0: Fundación (Infraestructura, Auth, Base de Datos, Settings)
**Objetivo**: Tener el sistema corriendo en Docker con login funcional, base de datos lista, y configuraciones base.
**Conecta con**: ABSOLUTAMENTE TODAS las demás fases.

### 0.1 Docker y Ambiente
- [ ] Crear `docker-compose.yml` con servicios: `app` (PHP 8.4 + Nginx + Node), `db` (PostgreSQL 16 Alpine), `reverb` (WebSockets).
- [ ] Crear `Dockerfile` para `app` con extensiones PHP: pdo_pgsql, pgsql, gd, zip, exif, pcntl, bcmath.
- [ ] Crear `Dockerfile.reverb` para servicio WebSocket.
- [ ] **Reverb solo en contenedor `reverb`**: NO ejecutar `reverb:start` en el entrypoint del servicio `app`. El servicio `reverb` es independiente.
- [ ] Configurar Nginx para servir React build en `/` y proxy PHP en `/api`.
- [ ] Configurar volúmenes persistentes: `postgres_data`, `storage`, `backup`.
- [ ] Script de entrypoint: migraciones automáticas, seeders condicionales (ver 0.1b), inicio de servicios.
- [ ] **Credenciales vía `.env`**: NUNCA hardcodear credenciales de BD en `docker-compose.yml`. Usar variables de entorno referenciadas desde `.env`.
- [ ] Probar build completo: `docker-compose up --build` sin errores.
- [ ] Documentar IP estática de PC maestra y acceso desde red local.
- [ ] **Docker auto-start en Windows**: configurar Docker Desktop para iniciar al encender PC (Settings → General → "Start Docker Desktop when you log in"). Documentar proceso.

### 0.1b Seeders Seguros (Protección contra reinicio)
- [ ] El entrypoint NO debe ejecutar `db:seed --force` en cada arranque.
- [ ] Implementar lógica condicional: solo ejecutar seeders si la tabla `users` está vacía (primer arranque).
- [ ] Alternativa: usar un flag/archivo de control (ej: `storage/.seeded`) que se crea tras el primer seed.
- [ ] Verificar: reiniciar contenedor 3 veces → los datos NO se duplican.

### 0.1c `.gitignore`
- [ ] Crear `.gitignore` en la raíz del proyecto con al menos:
  - `vendor/`, `node_modules/`, `.env`, `storage/app/backups/`
  - `Planes/Borradores/` (el cliente pidió explícitamente que los borradores no se suban)
  - Datos de prueba y seeders de desarrollo

### 0.2 Laravel Backend Base
- [ ] Instalar Laravel 12 con Composer en contenedor.
- [ ] Configurar `.env` para PostgreSQL (host=db, puerto interno).
- [ ] Instalar y configurar Laravel Sanctum para autenticación API.
  - Expiración de token configurable (default 8 horas).
  - Contraseñas hasheadas con bcrypt.
- [ ] Instalar y configurar Spatie Laravel Permission.
- [ ] Configurar UUIDs como default para todas las migraciones (trait o macro).
- [ ] **Unificar nomenclatura de enums**: Todos los enums en minúsculas y en inglés (`cc`, `ce`, `passport`, `nit` — NO `CC`, `PASAPORTE`). Consistente con el resto del sistema (`available`, `occupied`, etc.).
- [ ] Configurar formato de respuesta API estándar: `{ success, data, message, errors }`.
- [ ] Configurar códigos HTTP estándar: 200, 201, 400, 401, 403, 404, 422, 500.
- [ ] Base URL para todos los endpoints: `/api/v1/`.

### 0.2b Migraciones Base (Fase 0)
- [ ] Migración: tabla `hotels` (UUID PK, name, nit, address, phone, email, logo_path, check_in_time nullable, check_out_time default 13:00, iva_enabled boolean, iva_rate decimal default 19.00, currency COP, country Colombia).
- [ ] Migración: tabla `users` (UUID PK, name, email unique, password, active boolean default true, created_at, updated_at).
- [ ] Migración: tabla `activity_logs` (UUID PK, user_id FK nullable, action enum, entity_type, entity_id UUID, old_values JSON, new_values JSON, ip_address, created_at). → Se usa desde Fase 1 en adelante.
- [ ] Migración: tabla `backups` (UUID PK, file_path, file_size bigint, type enum auto/manual, status enum success/failed, created_at). → Se usa en Fase 5.
- [ ] Migración: tabla `notifications` (UUID PK, type enum, title, message, severity enum info/warning/critical, target_role, is_modal boolean, scheduled_at nullable, dismissed_at nullable, dismissed_by FK nullable, action_url nullable, created_at). → Se usa desde Fase 2 en adelante.
- [ ] Migración: tablas de Spatie Permission adaptadas a UUID.

### 0.2c Seeders Base (Fase 0)
- [ ] Seeder: superadmin por defecto (credenciales desde `.env`).
- [ ] Seeder: roles (superadmin, admin, receptionist, housekeeping, maintenance).
- [ ] Seeder: 17 permisos granulares (view_dashboard, view_rooms, manage_rooms, view_reservations, manage_reservations, check_in, check_out, view_inventory, manage_inventory, view_settings, manage_settings, view_activity_log, manage_users, manage_roles, trigger_backup, restore_backup, view_reports).
- [ ] Seeder: asignación de permisos por rol:
  - superadmin: todos.
  - admin: todos excepto manage_roles.
  - receptionist: view_dashboard, view_rooms, manage_reservations, check_in, check_out, view_inventory.
  - housekeeping: sin permisos UI por ahora.
  - maintenance: sin permisos UI por ahora.
- [ ] Seeder: configuración inicial del hotel en `settings`.

### 0.3 React Frontend Base
- [ ] Inicializar proyecto React 19 + TypeScript 5.8 + Vite 8.
- [ ] Instalar dependencias: React Router v7, Zustand 5, Tailwind CSS v4, Axios, Framer Motion, Lucide React, React Hot Toast, clsx, tailwind-merge, Zod.
- [ ] Configurar Tailwind con tema personalizado (paleta de colores SKILL-10: emerald, rose, amber, sky, slate, orange, purple).
- [ ] **Implementar Design System CSS** según SKILL-10:
  - Variables CSS para modo claro (`--bg-primary: #F8FAFC`, `--accent-primary: #10B981`, etc.).
  - Variables CSS para modo oscuro (`--bg-primary-dark: #0B1120`, etc.).
  - Tipografía: Inter como fuente principal, tamaños definidos (título 28px/700, dashboard 48px/700, label 14px/500, input 15px/400, badge 12px/600).
  - NUNCA blanco puro (#FFFFFF) como fondo en modo claro; NUNCA negro puro (#000000) en modo oscuro.
- [ ] Configurar Axios con interceptor para Bearer token y manejo de errores 401/403.
- [ ] Crear store Zustand base: `authStore` (token en MEMORIA, user, login, logout). **NUNCA token en localStorage.**
- [ ] **Guards de ruta**: proteger rutas por autenticación y por permisos/rol.
- [ ] Crear layout base: Sidebar fijo 240px desktop, colapsable 72px tablet, bottom navigation móvil.
- [ ] Header: título página + campana notificaciones (badge rojo) + usuario actual + toggle dark mode.
- [ ] **Dark mode toggle**: icono Sun/Moon en header, persistir preferencia en localStorage, transición `duration-300`.
- [ ] **Skeleton screens**: implementar como patrón global para estados de carga (NUNCA spinners genéricos).
- [ ] **Toasts**: configurar React Hot Toast como patrón global (éxito/error/warning, 4 segundos, barra de progreso).
- [ ] **Validación Zod**: configurar validación de formularios en tiempo real.
- [ ] Crear pantalla de Login (card centrada, logo 180x60px, floating labels, fondo gradiente, créditos creador).
- [ ] **Logo/info del creador**: quemado en código en footer sidebar + login + comprobantes PDF. Color `--text-muted`, no intrusivo.
- [ ] Probar login completo: frontend → API → token → redirección a Dashboard.

### 0.3b Accesibilidad (A11y) — Base
- [ ] Contraste mínimo WCAG AA: 4.5:1 texto normal, 3:1 texto grande.
- [ ] Todos los inputs con `label` asociado.
- [ ] Botones con `aria-label` si son solo iconos.
- [ ] Modales con `role="dialog"`, `aria-modal="true"`, focus trap.
- [ ] Tamaño mínimo touch target: 44×44px en móvil.
- [ ] Respetar `prefers-reduced-motion` (desactivar animaciones si el usuario lo pide).

### 0.4 Settings / Configuración Base
- [ ] Migración y modelo `settings` (category, key, value JSON).
- [ ] Seeder con valores por defecto: IVA 19%, check-out 13:00, moneda COP, país Colombia.
- [ ] Endpoint `GET/PUT /api/v1/settings` (solo admin/superadmin).
- [ ] Endpoints de autenticación: `POST /api/v1/login`, `POST /api/v1/logout`, `GET /api/v1/me`.
- [ ] Middleware de autenticación Bearer en todas las rutas protegidas.
- [ ] Middleware de autorización por permisos Spatie en cada endpoint.
- [ ] Pantalla base de Configuración (sidebar item visible solo para admin+).

### 0.5 Laravel Reverb (Tiempo Real)
- [ ] Instalar y configurar Laravel Reverb.
- [ ] Crear canales: `hotel.rooms`, `hotel.notifications`, `hotel.reservations`.
- [ ] Frontend: hook `useReverb` para suscribirse a canales y actualizar Zustand.
- [ ] Probar evento simple: cambiar estado de habitación en backend → ver cambio en frontend sin recargar.

### 0.6 Estrategia de Concurrencia
- [ ] Definir política de concurrencia para operaciones críticas (2 recepcionistas intentando la misma habitación al mismo tiempo).
- [ ] Implementar **lock pesimista** (`SELECT FOR UPDATE`) en transacciones de check-in y checkout.
- [ ] Alternativa: **lock optimista** con campo `version` o verificación de `updated_at` antes de confirmar.
- [ ] Reverb notifica el cambio en tiempo real, pero la protección DEBE ser a nivel de BD.
- [ ] Probar: abrir 2 pestañas, intentar check-in en la misma habitación → solo 1 debe tener éxito, la otra recibe error claro.

### 0.7 Pruebas de Fase 0
- [ ] Build de Docker exitoso en PC limpia.
- [ ] Login funciona desde 2 navegadores diferentes (simulando 2 PCs).
- [ ] Token expira correctamente.
- [ ] Reverb transmite eventos entre navegadores.
- [ ] Superadmin puede acceder a Configuración; receptionist NO.
- [ ] Reiniciar contenedores 3 veces → datos NO se duplican (seeders seguros).
- [ ] Credenciales de BD vienen de `.env`, NO hardcodeadas en YAML.
- [ ] `.gitignore` existe y excluye lo correcto.

**Criterios de Fase 0 Completada:**
- ✅ Docker levanta sin errores en PC limpia
- ✅ Login/logout funciona con token que expira
- ✅ Roles y permisos separan acceso correctamente
- ✅ Reverb transmite eventos entre 2+ navegadores
- ✅ Settings se leen/escriben desde API
- ✅ Seeders son idempotentes (reinicio seguro)

**Entregable Fase 0**: Sistema base corriendo en Docker, login funcional, roles separados, settings editables, tiempo real activo.

---

## 🏨 FASE 1: Dashboard + Habitaciones + Check-in
**Objetivo**: Ver habitaciones en tiempo real, hacer check-in walk-in completo.
**Depende de**: Fase 0.
**Conecta con**: Fase 2 (reservas alimentan calendario), Fase 3 (checkout cierra lo que se abre aquí), Fase 4 (minibar se carga aquí).

### 1.1 Modelo de Datos: Habitaciones y Entidades Relacionadas
- [ ] Migraciones: `room_types` (UUID PK, name, description nullable, base_price decimal(12,2), capacity int).
- [ ] Migración: `houses` (UUID PK, name, price decimal(12,2), active boolean default true).
- [ ] Migración: `rooms` (UUID PK, number, room_type_id FK, house_id FK nullable, status enum, current_price decimal(12,2), notes nullable).
- [ ] Migración: `guests` (UUID PK, full_name, document_type enum cc/ce/passport/nit, document_number unique, email nullable, phone nullable, nationality nullable, birth_date nullable, notes nullable).
- [ ] Migración: `companies` (UUID PK, name, nit unique, address nullable, phone nullable, email nullable, contact_name nullable).
- [ ] Migración: `stays` (UUID PK, guest_id FK, company_id FK nullable, reservation_id FK nullable, status enum active/extended/checked_out, check_in_datetime, check_out_datetime, actual_check_out_datetime nullable, late_checkout_fee decimal(12,2) nullable, total_amount nullable, paid_amount nullable, created_by FK, notes nullable).
- [ ] Migración: `stay_rooms` (UUID PK, stay_id FK, room_id FK, check_in_date, check_out_date, price_per_night decimal(12,2), nights int, subtotal decimal(12,2)).
- [ ] Migración: `payments` (UUID PK, stay_id FK, amount decimal(12,2), payment_method enum cash/transfer/card, payment_type enum deposit/partial/final, paid_by enum guest/company/mixed, payment_split_details JSON nullable, receipt_path nullable, receptionist_id FK, payment_date, notes nullable).
- [ ] Migración: `guest_companions` (UUID PK, guest_id FK, name, document_type, document_number nullable, relationship, age nullable, created_at, updated_at).
- [ ] Migración: `room_transfers` (UUID PK, stay_id FK, from_room_id FK, to_room_id FK, transferred_by FK→users, reason nullable, transferred_at timestamp, notes nullable, created_at).
- [ ] Migración: `extra_services` (UUID PK, name, price decimal(12,2), description nullable, active boolean default true).
- [ ] Migración: `stay_services` (UUID PK, stay_id FK, extra_service_id FK, quantity int, unit_price decimal(12,2), total decimal(12,2), applied_at, applied_by FK).
- [ ] Seeder: tipos de habitación (Sencilla, Doble, King, Presidencial).
- [ ] Seeder: 13 habitaciones + 1 Casa con 4 habitaciones asignadas.
- [ ] Relación: `rooms.house_id` nullable.
- [ ] Estados validados en modelo: available, occupied, cleaning, maintenance, reserved.
- [ ] Implementar soft deletes en: Guest, Company, Room (preservar historial).

### 1.1b Índices de Base de Datos
- [ ] Habilitar extensión `pg_trgm` en PostgreSQL.
- [ ] Índice en `guests.document_number`.
- [ ] Índice trigram (pg_trgm) para búsqueda parcial en `guests` (nombre, teléfono).
- [ ] Índice en `rooms.status`.
- [ ] Índice en `stays.check_in_datetime`.
- [ ] Índice en `reservations.start_date` / `end_date` (Fase 2, pero definir aquí).
- [ ] Índice en `inventory_items.code` (Fase 4, pero definir aquí).

### 1.1c Eventos WebSocket Específicos
- [ ] Evento `RoomStatusChanged` → canal `hotel.rooms` (cuando cambia estado de cualquier habitación).
- [ ] Evento `NewCheckIn` → canal `hotel.rooms` (al confirmar check-in).
- [ ] Evento `NewNotification` → canal `hotel.notifications` (al crear notificación).
- [ ] Frontend: suscribirse a canales y actualizar Zustand sin recargar página.

### 1.2 API de Habitaciones
- [ ] Endpoints: `GET /api/v1/rooms`, `GET /api/v1/rooms/{id}`.
- [ ] Filtros por estado, tipo, casa.
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-available` (requiere `housekeeping_id`).
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-cleaning` (automático al checkout).
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-maintenance`.
- [ ] Endpoint `POST /api/v1/rooms/{id}/transfer` (transferir huésped a otra habitación sin checkout).
- [ ] **Concurrencia**: Todas las operaciones de cambio de estado deben usar transacciones con `SELECT FOR UPDATE` (definido en Fase 0.6).

### 1.3 Vista de Habitaciones (Frontend)
- [ ] Grid responsive: 1 col móvil, 2 tablet, 4+ desktop.
- [ ] `RoomCard` según SKILL-10: border-radius 12px, borde izquierdo 4px del color del estado, hover scale(1.02) + shadow 200ms.
- [ ] Colores por estado según SKILL-10: emerald-50=disponible, rose-50=ocupada, amber-50=limpieza, orange-50=mantenimiento, sky-50=reservada.
- [ ] Iconos Lucide por estado: CheckCircle, User, Sparkles, Wrench, Calendar, Home.
- [ ] Indicador visual para habitaciones de Casa (icono Home en purple, agrupación con borde punteado `--accent-purple`).
- [ ] Actualización en tiempo real vía Reverb.
- [ ] Click en disponible → opción "Check-in".
- [ ] Click en ocupada → opciones "Ver estadía", "Checkout", "Transferir huésped".
- [ ] Click en limpieza → opción "Marcar disponible" (modal para escoger housekeeping).

### 1.4 Dashboard Principal
- [ ] 4 DashboardCards según SKILL-10: icono con fondo circular + número grande (48px/700) + label + trend (↑↓) vs periodo anterior.
- [ ] Cards: Ingresos hoy (cobrado), transacciones hoy, huéspedes activos, habitaciones disponibles/ocupadas/limpieza.
- [ ] Gráfico (Recharts o Chart.js): selector de métrica (dinero o visitas) + periodo (día/semana/mes/año) + línea actual vs línea gris periodo anterior.
- [ ] Configuración del gráfico desde Settings (qué métrica mostrar por defecto).
- [ ] Panel "Alertas Recientes": lista de últimas alertas con enlace "Ver todas".
- [ ] Lista rápida de habitaciones disponibles con botón de check-in directo.
- [ ] Atajo "Check-in inmediato" (para walk-ins).
- [ ] Panel "Sugerencias del Sistema" (solo admin/superadmin, fondo `--accent-purple` suave). Placeholder hasta Fase 6.
- [ ] API: `GET /api/v1/dashboard/stats`, `GET /api/v1/dashboard/chart`, `GET /api/v1/dashboard/available-rooms`.

### 1.5 Wizard de Check-in Walk-in (3 Pasos)
- [ ] **Paso 1 - Huésped**:
  - Buscador con sugerencias (nombre, documento, teléfono).
  - Si no existe: formulario de creación rápida (nombre, documento, email, teléfono, nacionalidad).
  - Checkbox "Agregar acompañantes" (lista dinámica). Guardar en tabla `guest_companions`.
  - Checkbox "Asignar múltiples habitaciones" (selector de habitaciones disponibles).
  - Checkbox "Viene por empresa" (si sí, habilita Paso 2).
  - **Nota**: Si la reserva se creó con datos mínimos, al hacer check-in se deben completar los campos obligatorios (documento, teléfono, etc.).
- [ ] **Paso 2 - Empresa** (condicional):
  - Buscador de empresa por NIT/nombre.
  - Si no existe: formulario de creación (nombre, NIT, dirección, teléfono, email, contacto).
- [ ] **Paso 3 - Confirmación**:
  - Resumen: huésped, empresa, habitaciones.
  - Fechas: entrada (default ahora), salida (fecha + hora configurable).
  - Detalle de minibar: lista de productos desde plantilla (Fase 4 define plantilla, por ahora hardcodear o dejar vacío).
  - Precio por noche por habitación.
  - Botón "Confirmar Check-in".
- [ ] Al confirmar:
  - Crear `Stay` + `StayRooms`.
  - **Usar transacción con lock** (Fase 0.6) para evitar check-in simultáneo en la misma habitación.
  - `Room.status` → `occupied`.
  - Emitir evento Reverb.
  - Opción de generar comprobante PDF (placeholder si Fase 3 no está lista).
  - Registrar en `ActivityLog`.

### 1.6 Vista de Huéspedes (básica)
- [ ] Listado de huéspedes con búsqueda y paginación.
- [ ] Modal de creación/edición rápida.
- [ ] API: `GET/POST/PUT /api/v1/guests`.
- [ ] API: `GET/POST/PUT/DELETE /api/v1/guests/{id}/companions` (acompañantes).
- [ ] **Wireframe necesario**: Diseñar pantalla de listado de huéspedes (no hay wireframe en UI_Visual_Guide — crear uno siguiendo el estilo de la vista de Reservas: tabla con filas alternadas, badges, acciones al hover).

### 1.6b Vista de Empresas (básica)
- [ ] Listado de empresas con búsqueda y paginación.
- [ ] Modal de creación/edición rápida.
- [ ] API: `GET/POST/PUT /api/v1/companies`.
- [ ] **Wireframe necesario**: Diseñar pantalla de listado de empresas (misma observación que huéspedes).

### 1.7 Transferencia de Huésped
- [ ] Desde habitación ocupada: opción "Transferir huésped" → seleccionar habitación destino (solo disponibles).
- [ ] Crear registro en `room_transfers` con motivo y usuario.
- [ ] Habitación origen → `cleaning`, habitación destino → `occupied`.
- [ ] Actualizar `stay_rooms` (cerrar la anterior, crear la nueva).
- [ ] Emitir evento Reverb.
- [ ] Registrar en `ActivityLog`.
- [ ] **Wireframe necesario**: Diseñar modal/drawer de transferencia (no hay wireframe en UI_Visual_Guide).

### 1.8 Drawer Lateral de Detalle de Estadía
- [ ] Al hacer click en habitación ocupada → drawer lateral con:
  - Datos del huésped, acompañantes, empresa.
  - Fechas de estadía, noches transcurridas.
  - Consumos de minibar (si Fase 4 está lista, sino placeholder).
  - Servicios extras.
  - Total acumulado.
  - Botones: Extender, Transferir, Checkout.
  - **Botón "+ Agregar Servicio Extra"** (agregar servicios durante la estadía, no solo al checkout). El cliente pidió explícitamente que se puedan agregar "al inicio o durante la estadía" (R115).
- [ ] **Wireframe necesario**: Diseñar drawer lateral (mencionado en UI_Visual_Guide pero no dibujado).

### 1.9 Pruebas de Fase 1
- [ ] Crear check-in walk-in completo con 1 habitación.
- [ ] Crear check-in con múltiples habitaciones.
- [ ] Verificar que habitación pasa a ocupada en tiempo real en otra pestaña.
- [ ] Marcar habitación en limpieza → disponible (con housekeeping).
- [ ] Dashboard muestra datos correctos.
- [ ] Transferir huésped de habitación 101 a 102 → verificar estados y registro.
- [ ] Intentar check-in simultáneo en misma habitación desde 2 pestañas → solo 1 éxito.

**Criterios de Fase 1 Completada:**
- ✅ Check-in walk-in funciona end-to-end (1 y múltiples habitaciones)
- ✅ Grid de habitaciones se actualiza en tiempo real vía Reverb
- ✅ Dashboard muestra KPIs correctos
- ✅ Transferencia de huésped funciona sin checkout
- ✅ Concurrencia protegida a nivel de BD
- ✅ Responsive probado en 3 breakpoints (desktop, tablet, móvil)

**Entregable Fase 1**: Se puede ver el hotel, hacer check-in de personas que llegan sin reserva, y ver el estado de todas las habitaciones en tiempo real.

---

## 📅 FASE 2: Reservas + Calendario
**Objetivo**: Crear reservas manuales, ver ocupación en calendario, alertas de reservas próximas.
**Depende de**: Fase 1 (habitaciones y huéspedes deben existir).
**Conecta con**: Fase 1 (check-in inmediato desde reserva), Fase 3 (checkout de reservas), Fase 5 (configuración de alertas y temporadas).

### 2.1 Modelo de Datos: Reservas
- [ ] Migración `reservations` con todos los campos (ver SDD).
- [ ] Migración `reservation_payments` para abonos antes del check-in. Campos: id UUID, reservation_id FK, amount decimal(12,2), method (cash/transfer/card), received_by FK→users, notes nullable, created_at.
- [ ] Migración `seasons` (temporadas): id UUID, name, start_date, end_date, multiplier decimal(4,2) nullable, fixed_price decimal(12,2) nullable, is_active boolean, notify_days_before int default 7, created_at, updated_at.
- [ ] Validación: no solapamiento de reservas en misma habitación (con opción de override por admin, con registro en auditoría).
- [ ] Lógica de Casa: si una habitación de la Casa está reservada, bloquear la Casa para ese rango.

### 2.2 API de Reservas
- [ ] Endpoints CRUD: `GET/POST/PUT/DELETE /api/v1/reservations`.
- [ ] Filtros: fecha, estado, huésped, empresa, habitación.
- [ ] Endpoint `POST /api/v1/reservations/{id}/check-in` (check-in inmediato).
- [ ] Endpoint `POST /api/v1/reservations/{id}/cancel`.
- [ ] Endpoint `POST /api/v1/reservations/{id}/extend`.
- [ ] Validación de solapamiento con mensaje claro al frontend.

### 2.3 Vista de Reservas
- [ ] Listado con filtros y paginación.
- [ ] Badge de estado (pendiente, confirmada, check-in, cancelada, no-show).
- [ ] Botón "Check-in Inmediato" visible en reservas confirmadas/pendientes.
- [ ] Wizard de nueva reserva:
  - Similar a check-in pero sin asignar físicamente (solo "separar" en calendario).
  - Selección de tipo de habitación o Casa.
  - Fechas inicio/fin.
  - Precio acordado.
  - Abono opcional (registrar pago contra reserva).
- [ ] Opción de reserva masiva/grupal:
  - Seleccionar múltiples habitaciones.
  - Opción: factura única (empresa) o individual (cada huésped paga).

### 2.4 Calendario
- [ ] Componente `CalendarGrid` con vistas: Semana, Mes, Año.
- [ ] Eje Y: lista de habitaciones (con indicador de Casa). Columna fija al scroll horizontal.
- [ ] Cabecera de días fija al scroll vertical.
- [ ] Colores según SKILL-07/10: sky=pending, rose=ocupada, slate=cancelada, gris=bloqueada por Casa.
- [ ] Línea de "hoy" en rojo punteado vertical (`--accent-danger`).
- [ ] Bloques: border-radius 6px, texto truncado con ellipsis.
- [ ] Tooltip al hover con datos del huésped/empresa.
- [ ] Click en celda vacía → modal nueva reserva con fecha prellenada.
- [ ] Click en bloque existente → drawer con detalle completo.
- [ ] Drag en celda → seleccionar rango de fechas para reserva.
- [ ] Reservas masivas se muestran como bloque grande con badge "Grupo".
- [ ] Leyenda de colores visible en la parte inferior.
- [ ] Navegación: botones Anterior/Hoy/Siguiente + selector de vista.
- [ ] API calendario: `GET /api/v1/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` con carga lazy solo del rango visible.
- [ ] Vista Mes: cada celda muestra resumen de ocupación (ej: "8/13").
- [ ] Vista Año: heatmap de ocupación por mes.
- [ ] En móvil: vista simplificada como lista de eventos del día.

### 2.5 Alertas de Reservas
- [ ] Job/Command de Laravel que corre cada hora.
- [ ] Detecta reservas próximas a fecha de entrada (configurable: 24h antes).
- [ ] Crea notificación en tabla `notifications`.
- [ ] Si está habilitada "auto-asignación" (Settings), modal al admin preguntando si asigna.
- [ ] Si está deshabilitada, solo notificación.
- [ ] Alerta de vencimiento: modal si huésped no llegó a la hora de la reserva. NO cancela automáticamente.

### 2.6 Pruebas de Fase 2
- [ ] Crear reserva para habitación normal.
- [ ] Crear reserva para Casa completa (verificar bloqueo de 4 habitaciones).
- [ ] Crear reserva individual en habitación de Casa (verificar que Casa se bloquea solo para ese rango).
- [ ] Hacer check-in inmediato desde reserva.
- [ ] Verificar que calendario muestra colores correctos.
- [ ] Probar alerta de reserva próxima.
- [ ] Intentar crear 2 reservas solapadas en la misma habitación → la segunda debe fallar (o pedir override admin).

**Criterios de Fase 2 Completada:**
- ✅ Reservas CRUD funciona con validación de solapamiento
- ✅ Calendario muestra ocupación correcta en las 3 vistas (semana/mes/año)
- ✅ Check-in inmediato desde reserva funciona end-to-end
- ✅ Lógica de Casa/bloqueo funciona correctamente
- ✅ Alertas de reservas próximas se generan y muestran
- ✅ Responsive probado en 3 breakpoints

**Entregable Fase 2**: Se puede reservar manualmente, ver ocupación en calendario, y hacer check-in desde reservas.

---

## 💰 FASE 3: Checkout + Pagos + Cuenta + Comprobantes PDF
**Objetivo**: Cerrar estadías correctamente, cobrar todo, generar comprobantes.
**Depende de**: Fase 1 (check-in crea estadías), Fase 2 (reservas se convierten en estadías).
**Conecta con**: Fase 4 (minibar se revisa aquí), Fase 5 (configuración de IVA y horarios), Fase 6 (auditoría de pagos).

### 3.1 Modelo de Datos: Estadías y Pagos
- [ ] Revisar migraciones `stays`, `stay_rooms`, `payments`, `stay_services` (ya creadas en Fase 1.1 con todos los campos incluyendo `reservation_id`, `late_checkout_fee`, `payment_split_details`, `receipt_path`).
- [ ] Migración: `minibar_consumptions` (UUID PK, stay_id FK, room_id FK, minibar_product_id FK, quantity int, type enum consumed/damaged/missing, unit_price decimal(12,2), total decimal(12,2), registered_at, registered_by FK). → Conecta minibar real con checkout.

### 3.2 API de Checkout y Estadías
- [ ] Endpoint `POST /api/v1/rooms/{id}/checkout` inicia proceso.
- [ ] Endpoint `GET /api/v1/stays/{id}/account` devuelve desglose completo:
  - Habitaciones: noches × precio por cada stay_room.
  - Minibar: consumos + daños + faltantes (desde Fase 4).
  - Servicios extras (desde Fase 5/6).
  - Recargos (late checkout, etc.).
  - Subtotal, IVA (si aplica), TOTAL.
- [ ] Endpoint `POST /api/v1/stays/{id}/payments` registra pago final.
- [ ] Endpoint `POST /api/v1/stays/{id}/extend` para extender estadía (cambiar fechas, NUNCA crear nueva estadía).
- [ ] Endpoint `POST /api/v1/stays/{id}/add-room` — agregar habitación a estadía existente.
- [ ] Endpoint `POST /api/v1/stays/{id}/services` — agregar servicio extra durante estadía.
- [ ] Endpoint `POST /api/v1/stays/{id}/minibar-charges` — registrar consumos de minibar.
- [ ] Endpoint `GET /api/v1/stays/{id}/payments` — historial de pagos por estadía.
- [ ] Checkout anticipado: cobrar solo noches usadas + consumos + extras (recalcular automáticamente).

### 3.3 Wizard de Checkout
- [ ] Paso 1 - Revisión Minibar:
  - Lista de productos esperados en la habitación (desde `room_minibars`).
  - Input para marcar consumidos (cantidad).
  - Input para marcar dañados (cantidad + costo de reposición).
  - Input para marcar faltantes.
  - Todo se suma automáticamente a la cuenta.
- [ ] Paso 2 - Servicios Extras:
  - Lista de servicios usados durante la estadía (editable, agregar/quitar).
- [ ] Paso 3 - Resumen de Cuenta:
  - Tabla desglosada con cada concepto.
  - Subtotal, IVA (19% si aplica), TOTAL.
  - Banner amigable si checkout excedió hora límite: "Recuerde: checkout excedido, calcular cobro adicional". Input para monto extra.
- [ ] Paso 4 - Pago:
  - Método: efectivo, transferencia, tarjeta.
  - Responsable: Todo empresa / Todo huésped / Mixto.
  - Si Mixto: asignar qué conceptos paga empresa (ej: solo habitación) y qué paga huésped (minibar + extras).
  - Botón "Registrar Pago".

### 3.4 Post-Checkout
- [ ] Al pagar:
  - `Stay.status` → `checked_out`.
  - `Room.status` → `cleaning`.
  - Descontar consumidos del `room_minibars`.
  - Crear `inventory_transactions` tipo `sale`.
  - Registrar en `ActivityLog`.
  - Emitir evento Reverb.
- [ ] Habitación en limpieza hasta que admin/recepcionista la marque disponible (con selección de housekeeping).

### 3.5 Comprobantes PDF
- [ ] Instalar librería PDF en Laravel (DomPDF o BrowserShot).
- [ ] Diseño de comprobante: logo, datos hotel, huésped/empresa, detalle de habitaciones, noches, precios, minibar, servicios, IVA, total, fechas.
- [ ] **Formato de número de comprobante**: auto-secuencial con formato `COMP-{AAAAMM}-{SECUENCIAL}` (ej: `COMP-202601-0042`). Guardar secuencia en `settings`.
- [ ] Asociar comprobante PDF al registro de `payments` (campo `receipt_path` en `payments`).
- [ ] Endpoint `GET /api/v1/stays/{id}/receipt` genera PDF.
- [ ] Guardar copia en `storage/app/comprobantes/{año}/{mes}/{uuid}.pdf`.
- [ ] Frontend: botones "Ver PDF" (nueva pestaña) y "Descargar PDF".
- [ ] **Checkboxes de gastos en PDF**: Al generar comprobante, permitir incluir/excluir conceptos (ej: quitar minibar del comprobante de empresa, dejar solo habitación). El cliente pidió explícitamente esta funcionalidad (R31).
- [ ] Comprobante de check-in (opcional, más simple) también disponible.

### 3.6 Pagos Parciales y Abonos
- [ ] Durante estadía: botón "Registrar Abono" en vista de estadía activa.
  - Monto, método, recepcionista (automático), fecha.
  - Se resta del total pendiente.
- [ ] Abonos antes del check-in (desde reserva): ya implementado en Fase 2, aquí solo verificar que se transfieren correctamente al checkout.

### 3.7 Pruebas de Fase 3
- [ ] Check-in → consumir minibar (simulado) → checkout completo con pago mixto.
- [ ] Verificar que PDF se genera y guarda con número de comprobante correcto.
- [ ] Verificar que habitación pasa a limpieza y luego a disponible.
- [ ] Verificar que abonos durante estadía se reflejan en cuenta final.
- [ ] Verificar desglose de IVA correcto.
- [ ] Verificar que `stays.reservation_id` se llena correctamente al hacer check-in desde reserva.

**Criterios de Fase 3 Completada:**
- ✅ Checkout completo funciona end-to-end (minibar → servicios → cuenta → pago)
- ✅ Pagos mixtos (empresa + huésped) se registran correctamente
- ✅ PDF se genera con formato correcto y número secuencial
- ✅ Late checkout fee se calcula y muestra
- ✅ Abonos parciales se descuentan del total
- ✅ Habitación pasa a limpieza automáticamente post-checkout
- ✅ Responsive probado en 3 breakpoints

**Entregable Fase 3**: Se puede cerrar cualquier estadía, cobrar de forma mixta, revisar minibar, y generar comprobante PDF.

---

## 📦 FASE 4: Inventario General + Minibar + Activos + Mantenimientos
**Objetivo**: Control total de todo lo que entra y sale del hotel.
**Depende de**: Fase 3 (checkout consume del minibar aquí).
**Conecta con**: Fase 1 (minibar se carga al check-in), Fase 5 (configuración de umbrales), Fase 6 (auditoría de movimientos).

### 4.1 Modelo de Datos: Inventario
- [ ] Migración: `inventory_categories` (UUID PK, name, type enum consumable/asset/cleaning).
- [ ] Migración: `inventory_items` (UUID PK, category_id FK, code unique auto PROD-XXXXX, name, brand nullable, presentation nullable, unit, cost_price decimal(12,2), sale_price decimal(12,2) nullable, current_stock int, min_stock_threshold int default 5, expiry_date nullable, supplier nullable, invoice_number nullable, location nullable).
- [ ] Migración: `inventory_transactions` (UUID PK, inventory_item_id FK, type enum entry/exit_to_minibar/exit_to_housekeeping/adjustment/sale, quantity int, unit_price decimal(12,2), total_value decimal(12,2), performed_by FK, destination_room_id FK nullable, notes nullable, created_at).
- [ ] Migración: `minibar_products` (UUID PK, name, inventory_item_id FK nullable, sale_price decimal(12,2), cost_price decimal(12,2), damage_price decimal(12,2) nullable, description nullable).
- [ ] Migración: `room_minibars` (UUID PK, room_id FK, minibar_product_id FK, quantity int, last_restocked_at, restocked_by FK nullable).
- [ ] Migración: `assets` (UUID PK, asset_code unique auto ACT-XXXX, name, brand nullable, model nullable, serial_number nullable, location_type enum room/general, room_id FK nullable, purchase_date nullable, warranty_expiry nullable, status enum active/maintenance/retired).
- [ ] Migración: `asset_maintenances` (UUID PK, asset_id FK, scheduled_date, completed_date nullable, description, cost decimal(12,2) nullable, technician_id FK nullable, next_maintenance_date nullable, status enum pending/completed/cancelled).
- [ ] Migración: `repair_orders` (UUID PK, asset_id FK nullable, room_id FK nullable, description, reported_by FK, assigned_to FK nullable, cost decimal(12,2) nullable, status enum pending/in_progress/completed, completed_at nullable).
- [ ] Seeder: categorías (Consumibles, Activos, Limpieza).

### 4.2 Consumibles
- [ ] Código auto-secuencial: `PROD-00001`, `PROD-00002`, etc.
- [ ] Al crear producto: sugerir si ya existe por marca + presentación.
- [ ] Campos: nombre, marca, presentación, unidad, precio costo, precio venta, stock, mínimo, vencimiento, proveedor, factura, ubicación.
- [ ] Acciones: recargar stock (con precio unitario), ajustar stock, entregar a housekeeping.
- [ ] Historial de movimientos en `inventory_transactions`.

### 4.3 Minibar
- [ ] Catálogo `minibar_products`: productos que PUEDEN ir a minibares.
  - Relacionados con `inventory_items` (opcional).
  - Precio venta independiente.
  - **Precio daño/reposición**: campo adicional para cuando un producto es dañado (ej: vaso roto, cobro de reposición). Puede ser igual al precio venta o diferente.
- [ ] `room_minibars`: stock actual por habitación.
  - Carga inicial desde "plantilla de minibar" configurable (Settings).
  - Registro de quién rellenó y cuándo.
- [ ] **Auditoría de reposición minibar**: Registrar en `inventory_transactions` quién repuso, cuándo, qué productos y cantidades. El cliente pidió explícitamente saber "quién rellenó el minibar".

### 4.3b Entrega de Inventario a Housekeeping (Flujo Detallado)
- [ ] Crear flujo de entrega de inventario a personal de housekeeping:
  - Seleccionar empleado de housekeeping (de lista de usuarios con rol housekeeping).
  - Seleccionar productos y cantidades a entregar.
  - Registrar en `inventory_transactions` tipo `exit_to_housekeeping` con `destination_user_id`.
  - Historial de entregas consultable (quién recibió, cuándo, qué, cuánto).
- [ ] Frontend: botón "Entregar a Housekeeping" en pestaña Consumibles, abre modal con el flujo.

- [ ] Traslado desde inventario general a minibar:
  - Seleccionar producto del inventario general.
  - Seleccionar habitación destino.
  - Cantidad.
  - Descuenta de inventario general, suma a room_minibar.
  - Registro en `inventory_transactions` tipo `exit_to_minibar` con `user_id` del responsable.
- [ ] Revisión al checkout (ya implementado en Fase 3, aquí conectar datos reales).

### 4.4 Activos
- [ ] Código auto: `ACT-0001`.
- [ ] Campos: nombre, marca, modelo, serial, ubicación (habitación o general), fecha compra, garantía, estado.
- [ ] Programar mantenimiento: fecha, descripción.
- [ ] Completar mantenimiento: fecha real, costo, técnico, próxima fecha.
- [ ] Alertas de mantenimiento próximo (notificación).

### 4.5 Reparaciones
- [ ] Crear orden de reparación: activo o habitación, descripción, reportado por.
- [ ] Asignar a técnico (usuario con rol maintenance).
- [ ] Cerrar orden: descripción de trabajo, costo, fecha.
- [ ] Historial por activo/habitación.

### 4.6 Alertas de Inventario
- [ ] Job diario que revisa:
  - Productos por vencer (umbral configurable, default 3 días).
  - Stock bajo (umbral configurable, default 5 unidades).
  - Mantenimientos próximos.
- [ ] Crear notificaciones en tabla `notifications`.
- [ ] Mostrar en Dashboard y NotificationCenter.

### 4.6b Centro de Notificaciones (Frontend)
- [ ] Componente `NotificationCenter`: drawer lateral con historial de notificaciones.
- [ ] Contador de no leídas en campana del header (badge rojo).
- [ ] API: `GET /api/v1/notifications`, `POST /api/v1/notifications/{id}/dismiss`, `GET /api/v1/notifications/unread-count`.
- [ ] Modales de alerta para admin: solo aparecen en horarios configurados (default 06:00 y 20:00). Backdrop blur, botón "Recordarme más tarde".
- [ ] Todos los modales dejan registro persistente en notificaciones.

### 4.7 Vista de Inventario (Frontend)
- [ ] Pestañas estilo pills: Consumibles | Activos | Minibar | Mantenimientos | Reparaciones. Activa con fondo `--accent-primary`.
- [ ] Tablas según SKILL-10: header oscuro, filas alternadas, bordes solo horizontales.
- [ ] Alertas visuales: ⚠️ amarillo por vencer, 🔴 rojo stock bajo.
- [ ] Modales de creación/edición/traslado.
- [ ] API inventario: `GET/POST/PUT /api/v1/inventory/items`, `POST .../restock`, `POST .../deliver`.
- [ ] API activos: `GET /api/v1/inventory/assets`, `POST .../maintenance`.
- [ ] API minibar: `GET /api/v1/inventory/minibar-products`.
- [ ] Responsive: en móvil cada fila se convierte en card apilada.

### 4.8 Pruebas de Fase 4
- [ ] Crear producto consumible, verificar código auto.
- [ ] Trasladar producto a minibar de habitación 101.
- [ ] Hacer check-in en 101 → verificar minibar cargado.
- [ ] Checkout con consumo → verificar stock descontado y alerta si bajo.
- [ ] Programar mantenimiento de aire acondicionado → verificar alerta.
- [ ] Verificar que la reposición de minibar registra quién la hizo.
- [ ] Registrar daño en minibar → verificar cobro de reposición diferenciado.

**Criterios de Fase 4 Completada:**
- ✅ Inventario CRUD funciona con códigos auto-secuenciales
- ✅ Minibar end-to-end: traslado → check-in → consumo → checkout → descuento
- ✅ Activos con mantenimientos programados y alertas
- ✅ Reparaciones con ciclo completo (crear → asignar → cerrar)
- ✅ Alertas de stock bajo y vencimiento se generan
- ✅ Auditoría de reposición registra responsable
- ✅ Responsive probado en 3 breakpoints

**Entregable Fase 4**: Control completo de inventario, minibar funcional end-to-end, activos con mantenimientos.

---

## ⚙️ FASE 5: Configuración Completa
**Objetivo**: Todo configurable desde UI, sin tocar código.
**Depende de**: Fases 1-4 (necesita saber qué configurar).
**Conecta con**: Todas las fases anteriores (settings gobiernan comportamiento).

> **⚠️ Endpoints API faltantes**: Varios CRUDs de esta fase no tenían endpoints definidos en SKILL-04.
> Agregar los siguientes endpoints al implementar:

### 5.1 Información del Hotel
- [ ] Formulario: nombre, NIT, dirección, teléfono, email, logo (upload).
- [ ] Preview del logo en comprobantes.

### 5.2 Habitaciones y Precios
- [ ] CRUD de habitaciones (número, tipo, Casa asignada, precio actual).
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/rooms`.
- [ ] CRUD de Casas (nombre, precio, asignar/desasignar habitaciones).
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/houses`.
- [ ] CRUD de Tipos de Habitación.
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/room-types`.
- [ ] **Edición masiva de precios**: seleccionar múltiples habitaciones + Casa, aplicar nuevo precio.
- [ ] Edición individual de precio por habitación.

### 5.3 Temporadas
- [ ] CRUD de temporadas: nombre, fechas inicio/fin, multiplicador de precio o precio fijo.
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/seasons`.
  - Usar tabla `seasons` creada en Fase 2.1.
- [ ] Notificación anticipada configurable (días antes).
- [ ] Modal al admin en horario de baja saturación (configurable: default 06:00 y 20:00).

### 5.4 Servicios Extras
- [ ] CRUD: nombre, precio, descripción, activar/desactivar.
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/extra-services`.

### 5.5 IVA y Precios
- [ ] Toggle "Incluir IVA en precios".
- [ ] Input "Tasa IVA" (default 19%).
- [ ] Afecta inmediatamente todos los desgloses de checkout.

### 5.6 Horarios
- [ ] Hora de checkout (default 13:00).
- [ ] Hora de check-in (opcional, habilitable con toggle).

### 5.7 Reservas
- [ ] Toggle "Habilitar reservas".
- [ ] Toggle "Auto-asignación de reservas" (con alerta al admin).
- [ ] Configuración de alertas de vencimiento (horas antes).

### 5.8 Limpieza
- [ ] Toggle "Alertas de limpieza".
- [ ] Hora de limpieza general (para alerta).
- [ ] Toggle "Notificar admin al finalizar limpieza".

### 5.9 Notificaciones
- [ ] Umbral de vencimiento de productos (días, default 3).
- [ ] Umbral de stock bajo (unidades, default 5).
- [ ] Horarios de modales para admin (múltiples horarios seleccionables).

### 5.10 Roles y Permisos
- [ ] Matriz visual: filas = permisos, columnas = roles.
- [ ] Superadmin edita todo.
- [ ] Admin edita permisos de receptionist (no de superadmin).
- [ ] CRUD de usuarios (empleados): nombre, email, rol, activo.
  - Endpoints: `GET/POST/PUT/DELETE /api/v1/admin/users`.
  - Endpoints: `GET/PUT /api/v1/admin/roles/{id}/permissions`.

### 5.11 Backup
- [ ] Input "Ruta de respaldo" (default `./backup/`).
- [ ] Input "Hora automática" (default 23:59).
- [ ] Input "Retención" (días, default **ilimitado**). El cliente dijo explícitamente: "quiero uno diario, sin importar que me cree 30 o 31 al mes" — conservar todos por defecto. Toggle "Limitar retención" solo si admin quiere borrar antiguos.
- [ ] Botón "Respaldar ahora" (manual).
- [ ] Botón "Cargar respaldo" (subir ZIP y restaurar).
- [ ] Lista de respaldos existentes con tamaño y fecha.
- [ ] **Placeholder para backup externo**: Texto en configuración: "Próximamente: enviar backups a Google Drive u otro servidor". El cliente lo mencionó como deseo futuro (R127). NO implementar aún.

### 5.12 Pruebas de Fase 5
- [ ] Cambiar precio de 5 habitaciones masivamente → verificar en check-in.
- [ ] Cambiar IVA a 0% → verificar checkout sin desglose.
- [ ] Crear temporada alta → verificar notificación y multiplicador aplicado.
- [ ] Hacer backup manual → verificar archivo ZIP.
- [ ] Restaurar backup → verificar datos intactos.
- [ ] CRUD de usuarios: crear recepcionista, asignar permisos, verificar acceso limitado.
- [ ] CRUD de servicios extras: crear servicio → verificar que aparece en checkout.

**Criterios de Fase 5 Completada:**
- ✅ Todos los CRUDs de configuración funcionan (habitaciones, casas, tipos, temporadas, servicios, usuarios)
- ✅ Edición masiva de precios se refleja correctamente
- ✅ IVA toggle funciona y afecta checkout
- ✅ Temporadas con multiplicador se aplican
- ✅ Backup manual + restauración funciona
- ✅ Roles y permisos se editan visualmente
- ✅ Responsive probado en 3 breakpoints

**Entregable Fase 5**: Admin puede configurar todo sin desarrollador.

---

## 📊 FASE 6: Historial + Auditoría + Sugerencias
**Objetivo**: Trazabilidad total y sugerencias basadas en datos.
**Depende de**: Fases 1-5 (necesita datos históricos).
**Conecta con**: Fase 5 (configuración de alertas), Fase 7 (logs de red).

### 6.1 Activity Log / Auditoría
- [ ] Registrar automáticamente en `activity_logs`:
  - Check-in, check-out, pagos, abonos, cancelaciones, transferencias.
  - Cambios de estado de habitación.
  - Modificaciones de inventario.
  - Login/logout.
- [ ] Campos: usuario, acción, entidad, valores antiguos/nuevos, IP, fecha/hora.

### 6.2 Vista de Historial
- [ ] Calendario mensual.
- [ ] Click en día → lista de todas las transacciones de ese día.
- [ ] Filtros: tipo de acción, usuario, entidad.
- [ ] Detalle expandible con diff de valores.

### 6.3 Pagos y Abonos (Vista Histórica)
- [ ] Listado de todos los pagos con filtros (fecha, método, recepcionista, huésped).
- [ ] Exportable a PDF (listado simple).

### 6.4 Sistema de Sugerencias
- [ ] Job diario que analiza:
  - Huéspedes recurrentes + consumos de minibar → sugerir recarga personalizada.
  - Ocupación histórica por día de semana/mes → sugerir ajuste de precios.
  - Empresas frecuentes → sugerir tarifa corporativa.
  - Consumo histórico por habitación → sugerir reposición automática de minibar.
- [ ] Tabla `suggestions` con score de confianza (campos: id UUID, type, title, description, confidence_score decimal, data JSON, dismissed boolean default false, dismissed_by FK nullable, created_at).
- [ ] Endpoints: `GET /api/v1/suggestions`, `POST /api/v1/suggestions/{id}/dismiss`.
- [ ] Mostrar en Dashboard como "Sugerencias del día" (solo admin/superadmin).
- [ ] Opción de descartar sugerencia con registro de quién la descartó.
- [ ] Cada sugerencia incluye explicación del "porqué" (ej: "Este huésped ha visitado 5 veces y siempre consume agua y snacks").

### 6.5 Vista de Historial / Auditoría (Frontend)
- [ ] **Wireframe necesario**: Diseñar pantalla de Historial/Auditoría (no hay wireframe en UI_Visual_Guide).
  - Propuesta: Calendario mensual (similar a Reservas) + tabla de eventos filtrable.
  - Filtros: tipo de acción, usuario, entidad, rango de fechas.
  - Detalle expandible con diff de valores (old → new).
  - Exportar a PDF.

### 6.6 Pruebas de Fase 6
- [ ] Hacer 3 check-ins, 2 pagos, 1 checkout → verificar que todo queda en historial.
- [ ] Verificar que sugerencia aparece después de datos suficientes.
- [ ] Descartar sugerencia → verificar que no reaparece.
- [ ] Exportar pagos históricos a PDF → verificar formato.
- [ ] Filtrar auditoría por usuario y por tipo de acción → verificar resultados.

**Criterios de Fase 6 Completada:**
- ✅ Todas las acciones críticas quedan en activity_log automáticamente
- ✅ Vista de historial muestra eventos con filtros y diff de valores
- ✅ Pagos históricos exportables a PDF
- ✅ Sugerencias se generan con job diario y se muestran en dashboard
- ✅ Sugerencias se pueden descartar
- ✅ Responsive probado en 3 breakpoints

**Entregable Fase 6**: Todo movimiento queda registrado. El sistema empieza a "aprender" patrones.

---

## 🌐 FASE 7: Red Local + Responsive + Optimización
**Objetivo**: Funcionar perfectamente en múltiples dispositivos locales.
**Depende de**: Fases 0-6 (sistema completo).
**Conecta con**: Fase 0 (Docker y red).

### 7.1 Red Local
- [ ] Configurar Docker para escuchar en IP de red local (`0.0.0.0:80`).
- [ ] Probar acceso desde 3 computadoras diferentes simultáneamente.
- [ ] Probar desde tablet/celular en la misma red WiFi.
- [ ] Verificar que Reverb funciona cross-device (todos ven cambios en tiempo real).
- [ ] Documentar: "Cómo acceder desde otro dispositivo".

### 7.2 Responsive Final
- [ ] Sidebar se convierte en menú hamburguesa en móvil.
- [ ] Grid de habitaciones: 1 columna en móvil, 2 en tablet.
- [ ] Modales de check-in/checkout: pantalla completa en móvil, centrados en desktop.
- [ ] Calendario: vista simplificada en móvil (lista de eventos del día).
- [ ] Tablas de inventario: scroll horizontal con headers fijos.
- [ ] Touch-friendly: botones grandes, inputs con zoom desactivado.

### 7.3 Optimización
- [ ] Lazy loading de rutas en React.
- [ ] Paginación en todas las APIs (verificar que frontend respeta page size).
- [ ] Índices de PostgreSQL revisados y optimizados.
- [ ] Compresión gzip en Nginx.
- [ ] Imágenes comprimidas (logo < 200KB).

### 7.4 Estrategia de Actualización del Sistema
- [ ] Documentar proceso de actualización post-despliegue (el sistema es offline, no se puede actualizar remotamente).
- [ ] Proceso propuesto: backup automático → copiar nueva versión vía USB o red local → `docker-compose down && docker-compose up --build`.
- [ ] Crear script `update.sh` / `update.bat` que automatice: backup → pull/copy → rebuild → migrate.
- [ ] Documentar rollback: restaurar backup anterior si la actualización falla.

### 7.5 Pruebas de Fase 7
- [ ] 5 dispositivos simultáneos haciendo check-in/checkout sin errores.
- [ ] Prueba de carga: 20 requests/segundo durante 1 minuto (herramienta sugerida: Apache Bench `ab` o `hey`).
- [ ] Uso en tablet: check-in completo solo con touch.
- [ ] Proceso de actualización simulado: backup → rebuild → verificar datos intactos.

**Criterios de Fase 7 Completada:**
- ✅ 5+ dispositivos simultáneos sin errores ni degradación
- ✅ Responsive funciona correctamente en todos los flujos
- ✅ Prueba de carga pasada (20 req/s × 1 min)
- ✅ Proceso de actualización documentado y probado
- ✅ Compresión gzip activa, lazy loading funcional
- ✅ Índices PostgreSQL optimizados

**Entregable Fase 7**: Sistema estable en red local, responsive, listo para producción.

---

## 🔌 FASE 8: Facturación Electrónica + Pasarelas de Pago
**Objetivo**: Conectar con sistemas externos de Colombia.
**Depende de**: Fases 0-7.
**Estado**: FUTURA. NO iniciar hasta que el usuario lo solicite explícitamente.

### 8.1 Preparación (ya hecha en fases anteriores)
- [x] Campos NIT en hotel, empresas, huéspedes.
- [x] Desglose de IVA en checkout.
- [x] Comprobantes PDF generados.
- [x] Historial de pagos completo.

### 8.2 Pendiente (cuando el usuario autorice)
- [ ] Integración DIAN (facturación electrónica Colombia).
- [ ] Pasarela de pago (PayU, MercadoPago, etc.).
- [ ] Envío automático de comprobantes por email.
- [ ] Sincronización con Booking/Airbnb (calendario bidireccional).

**Entregable Fase 8**: Conexiones externas funcionando.

---

## 📎 Anexos

### A. Checklist de Conexiones entre Fases
Antes de declarar una fase "terminada", verificar:

| Desde | Hacia | Qué se conecta |
|-------|-------|----------------|
| Fase 0 | Todas | Auth, roles, settings, Docker, Reverb |
| Fase 1 | Fase 2 | Habitaciones disponibles para reservas |
| Fase 1 | Fase 3 | Check-in crea estadías que se cierran en checkout |
| Fase 1 | Fase 4 | Minibar se carga al check-in |
| Fase 2 | Fase 1 | Reservas se convierten en check-in inmediato |
| Fase 2 | Fase 3 | Reservas generan estadías que se pagan al checkout |
| Fase 2 | Fase 5 | Configuración de reservas y alertas |
| Fase 3 | Fase 4 | Checkout consume del minibar |
| Fase 3 | Fase 5 | IVA, horarios, comprobantes PDF |
| Fase 3 | Fase 6 | Pagos quedan en auditoría |
| Fase 4 | Fase 5 | Umbrales de stock y vencimiento configurables |
| Fase 4 | Fase 6 | Movimientos de inventario en auditoría |
| Fase 5 | Todas | Settings gobiernan comportamiento global |
| Fase 6 | Todas | Logs registran todo |
| Fase 7 | Todas | Multi-dispositivo y responsive |

### B. Notas para el Desarrollador
1. **Nunca modificar una migración ya aplicada en producción** (aunque ahora es local). Crear nueva migración si se necesita cambio.
2. **Siempre usar transacciones de DB** en operaciones críticas: pagos, checkout, check-in.
3. **Validar fechas**: check-in < check-out, no solapamiento sin override.
4. **Probar en modo incógnito** para simular segundo dispositivo.
5. **Backup antes de cambios grandes** en Fase 5+.
6. **Concurrencia**: Usar `SELECT FOR UPDATE` en transacciones de check-in/checkout/transferencia (definido en Fase 0.6).
7. **Enums en minúsculas e inglés**: `cc`, `ce`, `passport`, `nit`, `available`, `occupied`, etc. Nunca mezclar idiomas o cases.
8. **Colores de estado**: SKILL-10 (UX/UI Design System) es la fuente de verdad para colores. Si hay conflicto con SKILL-07, usar SKILL-10.
9. **Rama Git por fase**: Cada fase se desarrolla en su propia rama (`fase-0`, `fase-1`, etc.) y se mergea a `main` al completar.
10. **Soft delete** en entidades clave: Guest, Company, Room. Preservar historial.
11. **Campo `created_by`/`updated_by`** en tablas de negocio (stays, payments, reservations, etc.).
12. **Respuesta API estándar**: siempre `{ success, data, message, errors }`. Definido en Fase 0.2.

### B2. ⚠️ REGLA OBLIGATORIA: Leer Planes antes de cada fase
> **Antes de iniciar cualquier tarea de desarrollo**, el desarrollador (o la IA) DEBE leer TODA la carpeta `Planes/` para:
> 1. Saber en qué fase estamos y qué tareas faltan.
> 2. Consultar el SDD, Skills y UI Guide antes de codificar.
> 3. Verificar que no se está duplicando trabajo o contradiciendo decisiones previas.
> 4. Usar el archivo `RESUMEN_PROGRESO.md` como punto de entrada rápido.
>
> **Esta regla NO es negociable.** Si la IA no lee los planes, puede alucinar decisiones que ya están definidas.

### C. Glosario
- **Casa**: Entidad separada de 4 habitaciones con precio fijo propio.
- **Estadía (Stay)**: Período de ocupación activa de un huésped.
- **Reserva separada**: Reserva pendiente que aparece en calendario pero no bloquea físicamente la habitación hasta check-in.
- **Check-in inmediato**: Conversión de reserva a estadía ocupada.
- **Check-in walk-in**: Check-in de persona sin reserva previa.
- **Pago mixto**: Empresa paga unos conceptos, huésped otros.
- **Lock pesimista**: Bloqueo a nivel de BD (`SELECT FOR UPDATE`) que impide que dos procesos modifiquen el mismo registro simultáneamente.
- **Seeder idempotente**: Seeder que puede ejecutarse múltiples veces sin duplicar datos.

### D. Estimaciones de Tiempo Aproximadas

| Fase | Estimación | Notas |
|------|-----------|-------|
| Fase 0 | ~3-4 días | Docker + Auth + Settings + Reverb + Concurrencia |
| Fase 1 | ~5-7 días | Dashboard + Grid + Wizard check-in + Transferencia |
| Fase 2 | ~4-5 días | Reservas + Calendario 3 vistas + Alertas |
| Fase 3 | ~5-6 días | Checkout wizard + Pagos mixtos + PDF |
| Fase 4 | ~5-6 días | Inventario completo + Minibar end-to-end + Activos |
| Fase 5 | ~4-5 días | Configuración completa + Backup |
| Fase 6 | ~3-4 días | Auditoría + Historial + Sugerencias |
| Fase 7 | ~3-4 días | Red local + Responsive final + Optimización |
| **Total** | **~32-41 días** | Sin contar Fase 8 (futura) |

> **Nota**: Estas estimaciones son aproximadas y asumen un desarrollador dedicado. Incluyen desarrollo + pruebas. Ajustar según experiencia y disponibilidad.

---

*Plan generado como guía de desarrollo. Marca las casillas a medida que avanzas. ¡Éxito!*
