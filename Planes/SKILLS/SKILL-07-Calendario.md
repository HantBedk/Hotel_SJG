# Skill: Calendario y Planificación — Hotel Manager

## Modelo de Datos del Calendario
El calendario NO es una tabla separada; se construye dinámicamente desde:
- `reservations` (status = pending, confirmed)
- `stays` + `stay_rooms` (status = active, extended)
- `houses` reservadas (bloquean sus 4 habitaciones)

## Lógica de Ocupación
Para cada día y cada habitación:
1. Si existe `stay_room` activo que incluya esa fecha → Ocupada (verde).
2. Si existe `reservation` confirmed/pending para esa habitación en esa fecha → Reservada (azul claro).
3. Si la habitación pertenece a una Casa y la Casa está reservada/ocupada en esa fecha → Bloqueada (gris).
4. Si la habitación está en estado `maintenance` → Mantenimiento (naranja).
5. Si la habitación está en estado `cleaning` → Limpieza (amarillo).
6. Si ninguna de las anteriores → Disponible (verde claro/blanco).

## Reglas de Superposición
- Una habitación NO puede tener dos reservas pending/confirmed para fechas que se solapen. El sistema debe validar esto al crear reserva.
- Excepción: override por admin (con alerta y registro en auditoría).
- Una habitación NO puede estar en dos estadías activas simultáneamente.
- Si una habitación de la Casa está reservada individualmente, la Casa completa se marca como bloqueada para ese rango en el calendario.

## Vistas
- **Semana**: grid 7 días × N habitaciones. Scroll vertical.
- **Mes**: grid mensual. Cada celda muestra resumen de ocupación (ej: "8/13" ocupadas). Click en día → detalle.
- **Año**: heatmap de ocupación por mes. Click en mes → vista mes.

## Interacciones
- Click en celda vacía → modal de nueva reserva con fecha prellenada.
- Click en bloque existente → drawer/modal con detalle completo.
- Drag en celda → seleccionar rango de fechas para reserva.
- Reservas masivas: seleccionar múltiples habitaciones en el mismo rango de fechas.

## Colores Oficiales (Tailwind)
- Disponible: `bg-emerald-100 text-emerald-800 border-emerald-300`
- Ocupada: `bg-rose-100 text-rose-800 border-rose-300`
- Limpieza: `bg-amber-100 text-amber-800 border-amber-300`
- Mantenimiento: `bg-orange-100 text-orange-800 border-orange-300`
- Reservada: `bg-sky-100 text-sky-800 border-sky-300`
- Bloqueada (Casa): `bg-slate-200 text-slate-600 border-slate-400`

## Reglas
1. El calendario se actualiza en tiempo real vía Reverb.
2. Nunca mostrar datos inconsistentes (ej: habitación ocupada y disponible al mismo tiempo).
3. Las reservas canceladas o no-show se mantienen visibles en el calendario histórico (rojo), pero no bloquean disponibilidad futura.
