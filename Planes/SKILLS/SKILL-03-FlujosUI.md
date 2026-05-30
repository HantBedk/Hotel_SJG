# Skill: Flujos de Usuario y UI/UX — Hotel Manager

## Estructura de Vistas
1. **Dashboard** (principal)
2. **Habitaciones** (grid de habitaciones con colores de estado)
3. **Reservas** (listado y creación)
4. **Calendario** (ocupación semana/mes/año)
5. **Inventario** (general, minibar, activos, mantenimientos)
6. **Configuración** (hotel, habitaciones, precios, temporadas, roles, backup, notificaciones, servicios extras)
7. **Historial / Auditoría** (log de actividad con calendario)
8. **Checkout / Cuenta** (proceso de checkout y pago)

## Dashboard
- Cards: Ingresos del día (solo cobrado), Ventas (cantidad de transacciones), Huéspedes activos, Habitaciones disponibles/ocupadas/en limpieza.
- Gráfico principal: selector de métrica (dinero o visitas) y periodo (día, semana, mes, año) con comparación periodo anterior.
- Atajo rápido: "Check-in inmediato" que abre modal wizard.
- Lista de habitaciones disponibles con botón de check-in directo.
- Actualización en tiempo real vía Reverb.

## Vista Habitaciones
- Grid visual: cada habitación es una tarjeta con color según estado:
  - Verde: Disponible
  - Rojo: Ocupada
  - Amarillo: En limpieza
  - Naranja: Mantenimiento
  - Azul claro: Reservada (para hoy o próxima)
- Habitaciones de la Casa tienen indicador visual especial (icono de casa pequeño).
- Click en habitación disponible → opción "Check-in" (walk-in sin reserva).
- Click en habitación ocupada → opción "Ver estadía", "Checkout", "Transferir huésped".
- Click en habitación en limpieza → opción "Marcar disponible" (seleccionar housekeeping).
- Actualización en tiempo real sin recargar.

## Wizard de Check-in (3 pasos)
### Paso 1: Huésped
- Buscar huésped por nombre, documento o teléfono.
- Si no existe: formulario de creación rápida (nombre, documento, email, teléfono, nacionalidad).
- Opción "Agregar acompañantes" (nombre y documento de cada uno).
- Opción "Asignar múltiples habitaciones" (seleccionar N habitaciones disponibles).
- Checkbox: "Viene por empresa" (si sí, habilita Paso 2; si no, salta al Paso 3).

### Paso 2: Empresa
- Buscar empresa por NIT o nombre.
- Si no existe: formulario de creación (nombre, NIT, dirección, teléfono, email, contacto).
- Seleccionar empresa.

### Paso 3: Confirmación y Minibar
- Resumen: huésped, empresa (si aplica), habitaciones asignadas.
- Fechas: entrada (ahora o configurable), salida (fecha y hora).
- Detalle de minibar: lista de productos que tendrá la habitación (desde plantilla configurable).
- Precio por noche por habitación.
- Botón "Confirmar Check-in".
- Al confirmar: habitación pasa a "Ocupada", se genera comprobante (PDF opcional), se notifica.

## Wizard de Check-in Inmediato (desde Reserva)
- Desde la lista de reservas o alerta de reserva próxima: botón "Check-in Inmediato".
- Precarga datos del huésped y empresa.
- Solo confirma habitación (si la reserva tenía una asignada) o permite reasignar si está ocupada (con alerta al admin).
- Paso 3 igual que el check-in normal.

## Checkout
1. Click en habitación ocupada → "Iniciar Checkout".
2. Modal de revisión de minibar: lista de productos esperados vs. realidad.
   - Marcar consumidos (cantidad).
   - Marcar dañados (cantidad + costo de reposición).
   - Marcar faltantes.
   - Todo se suma a la cuenta.
3. Banner si checkout excedió la hora límite: "Recuerde: checkout excedido, calcular cobro adicional".
4. Servicios extras usados: lista editable (agregar/quitar).
5. Resumen de cuenta:
   - Habitación(es): noches × precio.
   - Minibar: consumos + daños.
   - Servicios extras.
   - Recargos (late checkout, etc.).
   - Subtotal, IVA (si aplica), TOTAL.
6. Opciones de pago:
   - Método: efectivo, transferencia, tarjeta.
   - Responsable: Todo empresa / Todo huésped / Mixto (detallar qué paga quién).
7. Botón "Registrar Pago".
8. Al pagar: generar comprobante PDF, descargar/ver. Habitación pasa a "En limpieza".
9. Registro de quién hizo el checkout y quién recibió el pago.

## Reservas
- Listado con filtros (fecha, estado, huésped, empresa).
- Crear reserva: wizard similar al check-in pero sin asignar físicamente la habitación (solo "separar" en calendario).
- Campos: huésped (crear si no existe), empresa (opcional), tipo de habitación o Casa, fechas, noches, precio acordado, abono (opcional), notas.
- Estado inicial: `pending`.
- Alertas automáticas cuando se acerca la fecha.
- Desde calendario: click en fecha → crear reserva con fecha inicio prellenada, luego seleccionar fecha fin.
- Reservas masivas/grupos: opción de crear múltiples habitaciones bajo un mismo huésped principal (factura única) o independientes (cada uno paga).

## Calendario
- Vistas: Semana, Mes, Año.
- Eje Y: Habitaciones (numeradas, con indicador de Casa).
- Bloques de color:
  - Azul claro: Reserva pendiente.
  - Verde: Check-in confirmado / ocupada.
  - Rojo: Cancelada / No-show.
  - Gris: Bloqueada por Casa.
- Click en celda vacía → crear reserva.
- Click en bloque existente → ver detalle.
- Tooltip con datos del huésped al hover.

## Inventario
### Pestañas: Consumibles | Activos | Minibar | Mantenimientos | Reparaciones
- **Consumibles**: tabla con código, nombre, marca, presentación, stock, precio costo, precio venta, fecha vencimiento. Acciones: recargar, ajustar, entregar a housekeeping.
- **Activos**: tabla con código, nombre, ubicación, estado. Acciones: programar mantenimiento, ver historial.
- **Minibar**: catálogo de productos que PUEDEN ir a minibares. Acciones: asignar a habitación, ver stock por habitación.
- **Mantenimientos**: lista de próximos y completados. Acciones: marcar como hecho, asignar técnico, costo, próxima fecha.
- **Reparaciones**: órdenes de trabajo. Crear, asignar, cerrar con costo y descripción.

## Configuración
### Secciones:
1. **Información del Hotel**: nombre, NIT, dirección, teléfono, email, logo, país, moneda.
2. **Habitaciones**: CRUD de habitaciones (número, tipo, Casa a la que pertenece, precio actual). Edición masiva de precios.
3. **Casas**: CRUD de casas (nombre, precio, asignar habitaciones).
4. **Tipos de Habitación**: CRUD.
5. **Temporadas**: fechas, multiplicador de precio o precio fijo. Notificaciones anticipadas.
6. **Servicios Extras**: CRUD (nombre, precio).
7. **IVA y Precios**: tasa IVA, habilitar/deshabilitar IVA.
8. **Horarios**: check-out (default 13:00), check-in (opcional, habilitable).
9. **Reservas**: habilitar/deshabilitar reservas, auto-asignación (habilitable), alertas de vencimiento.
10. **Limpieza**: horario de limpieza general, alertas (habilitable), notificación a admin.
11. **Notificaciones**: umbral de vencimiento (días), umbral de stock bajo (unidades), horarios de modales para admin.
12. **Roles y Permisos**: matriz de qué puede ver/hacer cada rol. Superadmin edita todo.
13. **Backup**: ruta local, hora automática, retención, botón "Respaldar ahora", botón "Cargar respaldo".
14. **Usuarios**: CRUD de empleados (solo admin/superadmin).

## Responsive
- Sidebar colapsable en móvil.
- Grid de habitaciones: 1 columna en móvil, 2 en tablet, 4+ en desktop.
- Modales adaptados a pantalla completa en móvil.
- Calendario: vista simplificada en móvil (lista en vez de grid si es necesario).

## Reglas de UI
1. NUNCA recargar la página para cambios de estado; usar Reverb + Zustand.
2. Toda acción destructiva (checkout, cancelar reserva, eliminar) requiere confirmación modal.
3. Formularios con validación en tiempo real (Zod o similar).
4. Estados de carga (skeletons) en todas las vistas.
5. Toasts de éxito/error en todas las mutaciones.
6. Colores de estado de habitación SIEMPRE consistentes en toda la app.
