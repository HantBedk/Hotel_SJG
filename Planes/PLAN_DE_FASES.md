# Plan de Desarrollo por Fases — Hotel Manager
## Versión 1.0 | Markdown Chuleable

---

## 📋 Instrucciones de Uso
- [ ] Marca cada tarea cuando esté **terminada y probada**.
- **NO saltar fases**. Cada fase es base para la siguiente.
- Al final de cada fase, hacer **prueba de flujo completo** antes de pasar a la siguiente.
- Si algo no está claro durante el desarrollo, consultar el **SDD.md** y las **Skills** en `/skills/`.

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
- [ ] Configurar Nginx para servir React build en `/` y proxy PHP en `/api`.
- [ ] Configurar volúmenes persistentes: `postgres_data`, `storage`, `backup`.
- [ ] Script de entrypoint: migraciones automáticas, seeders, inicio de Reverb.
- [ ] Probar build completo: `docker-compose up --build` sin errores.
- [ ] Documentar IP estática de PC maestra y acceso desde red local.

### 0.2 Laravel Backend Base
- [ ] Instalar Laravel 12 con Composer en contenedor.
- [ ] Configurar `.env` para PostgreSQL (host=db, puerto interno).
- [ ] Instalar y configurar Laravel Sanctum para autenticación API.
- [ ] Instalar y configurar Spatie Laravel Permission.
- [ ] Configurar UUIDs como default para todas las migraciones (trait o macro).
- [ ] Crear migraciones de tablas base: `users`, `roles`, `permissions`, `model_has_roles`, `model_has_permissions`.
- [ ] Crear seeders: superadmin por defecto (credenciales configurables en `.env`), roles base.

### 0.3 React Frontend Base
- [ ] Inicializar proyecto React 19 + TypeScript 5.8 + Vite 8.
- [ ] Instalar dependencias: React Router v7, Zustand 5, Tailwind CSS v4, Axios, Framer Motion, Lucide React, React Hot Toast, clsx, tailwind-merge.
- [ ] Configurar Tailwind con tema personalizado (colores del hotel).
- [ ] Configurar Axios con interceptor para Bearer token y manejo de errores 401/403.
- [ ] Crear store Zustand base: `authStore` (token, user, login, logout).
- [ ] Crear layout base: Sidebar responsive, Header con notificaciones, área de contenido.
- [ ] Crear pantalla de Login con validación.
- [ ] Probar login completo: frontend → API → token → redirección a Dashboard.

### 0.4 Settings / Configuración Base
- [ ] Migración y modelo `settings` (category, key, value JSON).
- [ ] Seeder con valores por defecto: IVA 19%, check-out 13:00, moneda COP, país Colombia.
- [ ] Endpoint `GET/PUT /api/v1/settings` (solo admin/superadmin).
- [ ] Pantalla base de Configuración (sidebar item visible solo para admin+).

### 0.5 Laravel Reverb (Tiempo Real)
- [ ] Instalar y configurar Laravel Reverb.
- [ ] Crear canales: `hotel.rooms`, `hotel.notifications`, `hotel.reservations`.
- [ ] Frontend: hook `useReverb` para suscribirse a canales y actualizar Zustand.
- [ ] Probar evento simple: cambiar estado de habitación en backend → ver cambio en frontend sin recargar.

### 0.6 Pruebas de Fase 0
- [ ] Build de Docker exitoso en PC limpia.
- [ ] Login funciona desde 2 navegadores diferentes (simulando 2 PCs).
- [ ] Token expira correctamente.
- [ ] Reverb transmite eventos entre navegadores.
- [ ] Superadmin puede acceder a Configuración; receptionist NO.

**Entregable Fase 0**: Sistema base corriendo en Docker, login funcional, roles separados, settings editables, tiempo real activo.

---

## 🏨 FASE 1: Dashboard + Habitaciones + Check-in
**Objetivo**: Ver habitaciones en tiempo real, hacer check-in walk-in completo.
**Depende de**: Fase 0.
**Conecta con**: Fase 2 (reservas alimentan calendario), Fase 3 (checkout cierra lo que se abre aquí), Fase 4 (minibar se carga aquí).

### 1.1 Modelo de Datos: Habitaciones
- [ ] Migraciones: `room_types`, `houses`, `rooms`.
- [ ] Seeder: 13 habitaciones + 1 Casa con 4 habitaciones asignadas.
- [ ] Relación: `rooms.house_id` nullable.
- [ ] Estados validados en modelo: available, occupied, cleaning, maintenance, reserved.

### 1.2 API de Habitaciones
- [ ] Endpoints: `GET /api/v1/rooms`, `GET /api/v1/rooms/{id}`.
- [ ] Filtros por estado, tipo, casa.
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-available` (requiere `housekeeping_id`).
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-cleaning` (automático al checkout).
- [ ] Endpoint `POST /api/v1/rooms/{id}/set-maintenance`.

### 1.3 Vista de Habitaciones (Frontend)
- [ ] Grid responsive: 1 col móvil, 2 tablet, 4+ desktop.
- [ ] `RoomCard` con colores según estado (verde=disponible, rojo=ocupada, amarillo=limpieza, naranja=mantenimiento, azul=reservada).
- [ ] Indicador visual para habitaciones de Casa (icono pequeño).
- [ ] Actualización en tiempo real vía Reverb.
- [ ] Click en disponible → opción "Check-in".
- [ ] Click en limpieza → opción "Marcar disponible" (modal para escoger housekeeping).

### 1.4 Dashboard Principal
- [ ] Cards: Ingresos hoy (cobrado), transacciones hoy, huéspedes activos, habitaciones disponibles/ocupadas/limpieza.
- [ ] Gráfico: selector de métrica (dinero o visitas) + periodo (día/semana/mes/año) + comparación con periodo anterior.
- [ ] Configuración del gráfico desde Settings (qué métrica mostrar por defecto).
- [ ] Lista rápida de habitaciones disponibles con botón de check-in directo.
- [ ] Atajo "Check-in inmediato" (para walk-ins).

### 1.5 Wizard de Check-in Walk-in (3 Pasos)
- [ ] **Paso 1 - Huésped**:
  - Buscador con sugerencias (nombre, documento, teléfono).
  - Si no existe: formulario de creación rápida (nombre, documento, email, teléfono, nacionalidad).
  - Checkbox "Agregar acompañantes" (lista dinámica).
  - Checkbox "Asignar múltiples habitaciones" (selector de habitaciones disponibles).
  - Checkbox "Viene por empresa" (si sí, habilita Paso 2).
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
  - `Room.status` → `occupied`.
  - Emitir evento Reverb.
  - Opción de generar comprobante PDF (placeholder si Fase 3 no está lista).
  - Registrar en `ActivityLog`.

### 1.6 Vista de Huéspedes (básica)
- [ ] Listado de huéspedes con búsqueda.
- [ ] Modal de creación/edición rápida.
- [ ] API: `GET/POST/PUT /api/v1/guests`.

### 1.7 Pruebas de Fase 1
- [ ] Crear check-in walk-in completo con 1 habitación.
- [ ] Crear check-in con múltiples habitaciones.
- [ ] Verificar que habitación pasa a ocupada en tiempo real en otra pestaña.
- [ ] Marcar habitación en limpieza → disponible (con housekeeping).
- [ ] Dashboard muestra datos correctos.

**Entregable Fase 1**: Se puede ver el hotel, hacer check-in de personas que llegan sin reserva, y ver el estado de todas las habitaciones en tiempo real.

---

## 📅 FASE 2: Reservas + Calendario
**Objetivo**: Crear reservas manuales, ver ocupación en calendario, alertas de reservas próximas.
**Depende de**: Fase 1 (habitaciones y huéspedes deben existir).
**Conecta con**: Fase 1 (check-in inmediato desde reserva), Fase 3 (checkout de reservas), Fase 5 (configuración de alertas y temporadas).

### 2.1 Modelo de Datos: Reservas
- [ ] Migración `reservations` con todos los campos (ver SDD).
- [ ] Migración `reservation_payments` para abonos antes del check-in.
- [ ] Validación: no solapamiento de reservas en misma habitación (con opción de override por admin).
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
- [ ] Eje Y: lista de habitaciones (con indicador de Casa).
- [ ] Colores: azul claro=pending, verde=ocupada, rojo=cancelada, gris=bloqueada por Casa.
- [ ] Tooltip al hover con datos del huésped.
- [ ] Click en celda vacía → modal nueva reserva con fecha prellenada.
- [ ] Click en bloque existente → drawer con detalle completo.
- [ ] Reservas masivas se muestran como bloque grande con número de habitaciones.

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

**Entregable Fase 2**: Se puede reservar manualmente, ver ocupación en calendario, y hacer check-in desde reservas.

---

## 💰 FASE 3: Checkout + Pagos + Cuenta + Comprobantes PDF
**Objetivo**: Cerrar estadías correctamente, cobrar todo, generar comprobantes.
**Depende de**: Fase 1 (check-in crea estadías), Fase 2 (reservas se convierten en estadías).
**Conecta con**: Fase 4 (minibar se revisa aquí), Fase 5 (configuración de IVA y horarios), Fase 6 (auditoría de pagos).

### 3.1 Modelo de Datos: Estadías y Pagos
- [ ] Revisar migraciones `stays`, `stay_rooms`, `payments`, `stay_services`.
- [ ] Agregar campo `late_checkout_fee` a `stays` (nullable).
- [ ] Agregar campo `payment_split_details` a `payments` (JSON, para mixto).

### 3.2 API de Checkout
- [ ] Endpoint `POST /api/v1/rooms/{id}/checkout` inicia proceso.
- [ ] Endpoint `GET /api/v1/stays/{id}/account` devuelve desglose completo:
  - Habitaciones: noches × precio por cada stay_room.
  - Minibar: consumos + daños + faltantes (desde Fase 4).
  - Servicios extras (desde Fase 5/6).
  - Recargos (late checkout, etc.).
  - Subtotal, IVA (si aplica), TOTAL.
- [ ] Endpoint `POST /api/v1/stays/{id}/payments` registra pago final.
- [ ] Endpoint `POST /api/v1/stays/{id}/extend` para extender estadía (cambiar fechas).

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
- [ ] Endpoint `GET /api/v1/stays/{id}/receipt` genera PDF.
- [ ] Guardar copia en `storage/app/comprobantes/{año}/{mes}/{uuid}.pdf`.
- [ ] Frontend: botones "Ver PDF" (nueva pestaña) y "Descargar PDF".
- [ ] Comprobante de check-in (opcional, más simple) también disponible.

### 3.6 Pagos Parciales y Abonos
- [ ] Durante estadía: botón "Registrar Abono" en vista de estadía activa.
  - Monto, método, recepcionista (automático), fecha.
  - Se resta del total pendiente.
- [ ] Abonos antes del check-in (desde reserva): ya implementado en Fase 2, aquí solo verificar que se transfieren correctamente al checkout.

### 3.7 Pruebas de Fase 3
- [ ] Check-in → consumir minibar (simulado) → checkout completo con pago mixto.
- [ ] Verificar que PDF se genera y guarda.
- [ ] Verificar que habitación pasa a limpieza y luego a disponible.
- [ ] Verificar que abonos durante estadía se reflejan en cuenta final.
- [ ] Verificar desglose de IVA correcto.

**Entregable Fase 3**: Se puede cerrar cualquier estadía, cobrar de forma mixta, revisar minibar, y generar comprobante PDF.

---

## 📦 FASE 4: Inventario General + Minibar + Activos + Mantenimientos
**Objetivo**: Control total de todo lo que entra y sale del hotel.
**Depende de**: Fase 3 (checkout consume del minibar aquí).
**Conecta con**: Fase 1 (minibar se carga al check-in), Fase 5 (configuración de umbrales), Fase 6 (auditoría de movimientos).

### 4.1 Modelo de Datos: Inventario
- [ ] Migraciones: `inventory_categories`, `inventory_items`, `inventory_transactions`, `minibar_products`, `room_minibars`, `minibar_consumptions`, `assets`, `asset_maintenances`, `repair_orders`.
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
- [ ] `room_minibars`: stock actual por habitación.
  - Carga inicial desde "plantilla de minibar" configurable (Settings).
  - Registro de quién rellenó y cuándo.
- [ ] Traslado desde inventario general a minibar:
  - Seleccionar producto del inventario general.
  - Seleccionar habitación destino.
  - Cantidad.
  - Descuenta de inventario general, suma a room_minibar.
  - Registro en `inventory_transactions` tipo `exit_to_minibar`.
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
- [ ] Crear notificaciones en tabla `notifications`.
- [ ] Mostrar en Dashboard y NotificationCenter.

### 4.7 Vista de Inventario (Frontend)
- [ ] Pestañas: Consumibles | Activos | Minibar | Mantenimientos | Reparaciones.
- [ ] Tablas con filtros y paginación.
- [ ] Modales de creación/edición/traslado.
- [ ] Responsive: tablas scrollables horizontalmente en móvil.

### 4.8 Pruebas de Fase 4
- [ ] Crear producto consumible, verificar código auto.
- [ ] Trasladar producto a minibar de habitación 101.
- [ ] Hacer check-in en 101 → verificar minibar cargado.
- [ ] Checkout con consumo → verificar stock descontado y alerta si bajo.
- [ ] Programar mantenimiento de aire acondicionado → verificar alerta.

**Entregable Fase 4**: Control completo de inventario, minibar funcional end-to-end, activos con mantenimientos.

---

## ⚙️ FASE 5: Configuración Completa
**Objetivo**: Todo configurable desde UI, sin tocar código.
**Depende de**: Fases 1-4 (necesita saber qué configurar).
**Conecta con**: Todas las fases anteriores (settings gobiernan comportamiento).

### 5.1 Información del Hotel
- [ ] Formulario: nombre, NIT, dirección, teléfono, email, logo (upload).
- [ ] Preview del logo en comprobantes.

### 5.2 Habitaciones y Precios
- [ ] CRUD de habitaciones (número, tipo, Casa asignada, precio actual).
- [ ] CRUD de Casas (nombre, precio, asignar/desasignar habitaciones).
- [ ] CRUD de Tipos de Habitación.
- [ ] **Edición masiva de precios**: seleccionar múltiples habitaciones + Casa, aplicar nuevo precio.
- [ ] Edición individual de precio por habitación.

### 5.3 Temporadas
- [ ] CRUD de temporadas: nombre, fechas inicio/fin, multiplicador de precio o precio fijo.
- [ ] Notificación anticipada configurable (días antes).
- [ ] Modal al admin en horario de baja saturación (configurable: default 06:00 y 20:00).

### 5.4 Servicios Extras
- [ ] CRUD: nombre, precio, descripción, activar/desactivar.

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

### 5.11 Backup
- [ ] Input "Ruta de respaldo" (default `./backup/`).
- [ ] Input "Hora automática" (default 23:59).
- [ ] Input "Retención" (días, default 30).
- [ ] Botón "Respaldar ahora" (manual).
- [ ] Botón "Cargar respaldo" (subir ZIP y restaurar).
- [ ] Lista de respaldos existentes con tamaño y fecha.

### 5.12 Pruebas de Fase 5
- [ ] Cambiar precio de 5 habitaciones masivamente → verificar en check-in.
- [ ] Cambiar IVA a 0% → verificar checkout sin desglose.
- [ ] Crear temporada alta → verificar notificación.
- [ ] Hacer backup manual → verificar archivo ZIP.
- [ ] Restaurar backup → verificar datos intactos.

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
- [ ] Tabla `suggestions` con score de confianza.
- [ ] Mostrar en Dashboard como "Sugerencias del día" (solo admin/superadmin).
- [ ] Opción de descartar sugerencia.

### 6.5 Pruebas de Fase 6
- [ ] Hacer 3 check-ins, 2 pagos, 1 checkout → verificar que todo queda en historial.
- [ ] Verificar que sugerencia aparece después de datos suficientes.

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

### 7.4 Pruebas de Fase 7
- [ ] 5 dispositivos simultáneos haciendo check-in/checkout sin errores.
- [ ] Prueba de carga: 20 requests/segundo durante 1 minuto (simulado).
- [ ] Uso en tablet: check-in completo solo con touch.

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

### C. Glosario
- **Casa**: Entidad separada de 4 habitaciones con precio fijo propio.
- **Estadía (Stay)**: Período de ocupación activa de un huésped.
- **Reserva separada**: Reserva pendiente que aparece en calendario pero no bloquea físicamente la habitación hasta check-in.
- **Check-in inmediato**: Conversión de reserva a estadía ocupada.
- **Check-in walk-in**: Check-in de persona sin reserva previa.
- **Pago mixto**: Empresa paga unos conceptos, huésped otros.

---

*Plan generado como guía de desarrollo. Marca las casillas a medida que avanzas. ¡Éxito!*
