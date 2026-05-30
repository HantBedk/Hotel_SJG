# UI Visual Guide — Hotel Manager
## Descripción visual detallada de cada módulo

---

## 1. Pantalla de Login

```
┌────────────────────────────────────────────┐
│                                            │
│           [LOGO DEL HOTEL]                 │  ← 180x60px, centrado
│           ~ Hotel San José ~               │  ← Nombre del hotel, Inter 24px
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  Email                           │    │  ← Input floating label
│   │  ┌────────────────────────────┐  │    │
│   │  │ recepcionista@hotel.com   │  │    │
│   │  └────────────────────────────┘  │    │
│   │                                  │    │
│   │  Contraseña                    │    │
│   │  ┌────────────────────────────┐  │    │
│   │  │ ••••••••                  │  │    │  ← Icono ojo para mostrar
│   │  └────────────────────────────┘  │    │
│   │                                  │    │
│   │  [        INGRESAR          ]  │    │  ← Botón emerald-600, full width
│   │                                  │    │
│   └──────────────────────────────────┘    │
│                                            │
│   Sistema desarrollado por [TuNombre]     │  ← Texto muted, 12px, abajo
│   [Logo pequeño del creador]              │  ← 24x24px
│                                            │
└────────────────────────────────────────────┘
```

- Fondo: gradiente sutil de `--bg-primary` a un tono más cálido, o imagen del hotel difuminada (opcional, configurable).
- Card central: `--bg-card`, border-radius 16px, shadow-xl.
- En modo oscuro: fondo `#0B1120`, card `#1E293B`.
- No hay sidebar aquí. Es pantalla standalone.

---

## 2. Dashboard (Vista Principal)

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Dashboard                              🌙 👤 Recepcionista ▼  │  ← Header
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │  💰        │  │  🛏️        │  │  👥        │  │  🧹        │     │
│  │  $1.240.000│  │     8/13   │  │    12      │  │     3      │     │
│  │  Ingresos  │  │  Ocupadas  │  │  Huéspedes │  │  Limpieza  │     │
│  │  ↑ 12%    │  │  ↑ 2       │  │  → 0       │  │  ↓ 1       │     │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  📊 Gráfico de Ingresos          [Día ▼] [Dinero ▼]      │    │
│  │                                                            │    │
│  │     ▲                                                     │    │
│  │  2M │    ╭─╮                                               │    │
│  │  1M │   ╭╯ ╰╮  ╭──╮      ← Línea azul: periodo actual      │    │
│  │  500│  ╭╯   ╰──╯  ╰──╮   ← Línea gris: periodo anterior    │    │
│  │   0 └───────────────────                                   │    │
│  │      Lun Mar Mié Jue Vie Sáb Dom                           │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────┐  ┌────────────────────────────────┐     │
│  │  🔔 Alertas Recientes  │  │  🏨 Check-in Rápido          │     │
│  │  • Reserva #123 vence  │  │  [101] [102] [103] [104]     │     │
│  │    en 2 horas          │  │  [105] [106] [107] [108]     │     │
│  │  • Stock bajo: Agua    │  │  [109] [110] [111] [112]     │     │
│  │  • Temporada alta      │  │  [113] [Casa]               │     │
│  │    inicia mañana       │  │                              │     │
│  │                        │  │  Click en habitación →       │     │
│  │  [Ver todas]           │  │  Check-in Walk-in            │     │
│  └────────────────────────┘  └────────────────────────────────┘     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  💡 Sugerencias del Sistema (solo Admin)                 │    │
│  │  • Carlos García suele consumir cervezas → Recargar      │    │
│  │  • Fin de semana ocupación 95% → Revisar precios          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

- Cards del dashboard: border-radius 12px, shadow-sm, hover shadow-md.
- Gráfico: librería Recharts o Chart.js, líneas suaves, área bajo la curva con opacidad 10%.
- Check-in rápido: mini grid de habitaciones disponibles (solo número, color de fondo = estado).
- Alertas: badge rojo en icono de campana si hay no leídas.
- Sugerencias: solo visible para admin/superadmin, fondo `--accent-purple` muy suave.

---

## 3. Vista de Habitaciones (Grid Principal)

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Habitaciones        [Filtros: Todos ▼] [Tipo ▼] [Buscar 🔍]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 🏠 101   │ │    102   │ │    103   │ │    104   │              │
│  │          │ │  👤 Juan │ │ 🧹 Limp. │ │ 🔧 Mant. │              │
│  │ Doble    │ │  Pérez   │ │          │ │          │              │
│  │ $180k    │ │  2 noches│ │          │ │          │              │
│  │          │ │          │ │          │ │          │              │
│  │[Check-in]│ │[Checkout]│ │[Dispble] │ │[Detalle] │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │    105   │ │    106   │ │    107   │ │    108   │              │
│  │ 📅 Resv. │ │  👤 Ana  │ │  👤 Pedro│ │    108   │              │
│  │  Mañana  │ │  García  │ │  López   │ │          │              │
│  │          │ │  3 noches│ │  1 noche │ │          │              │
│  │[Check-in]│ │[Checkout]│ │[Checkout]│ │[Check-in]│              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  🏡 CASA (4 habitaciones)                                  │    │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                             │    │
│  │  │109 │ │110 │ │111 │ │112 │  ← Indicador visual que son  │    │
│  │  │Disp│ │Disp│ │Disp│ │Disp│    parte de la Casa         │    │
│  │  └────┘ └────┘ └────┘ └────┘                             │    │
│  │  Precio Casa: $650.000/noche  [Reservar Casa]            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

- Filtros arriba: dropdowns limpios, búsqueda con icono lupa.
- Tarjetas: border izquierdo grueso del color del estado.
- Habitación ocupada: muestra nombre del huésped principal + noches.
- Habitación reservada: muestra "Reserva" + fecha próxima.
- Casa: agrupación visual con borde punteado morado (`--accent-purple`).
- Hover en card: scale 1.02, sombra aumenta, cursor pointer.
- Click en ocupada: drawer lateral con detalle completo de la estadía (huésped, empresa, cuenta, servicios, minibar).

---

## 4. Wizard de Check-in (Modal de 3 Pasos)

```
┌────────────────────────────────────────────────────────────────────┐
│  Check-in Walk-in                                    [X]          │
│  ─────────────────────────────────────────────────────────────   │
│  ◉──────◯──────◯                                                 │
│  Huésped  Empresa  Confirmar                                      │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Buscar huésped existente                                  │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │ 🔍 Nombre, documento o teléfono...                │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  │                                                            │    │
│  │  Resultados:                                               │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │ 👤 Carlos García · CC 12345678 · 3101234567       │    │    │
│  │  │ 👤 Carlos Gómez   · CC 87654321 · 3209876543      │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  │                                                            │    │
│  │  ──────── o registrar nuevo ────────                      │    │
│  │                                                            │    │
│  │  Nombre completo *                                         │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │                                                    │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  │                                                            │    │
│  │  Documento *          Tipo: [CC ▼]                       │    │
│  │  ┌────────────────┐                                    │    │
│  │  │ 123456789      │                                    │    │
│  │  └────────────────┘                                    │    │
│  │                                                            │    │
│  │  Email                 Teléfono                           │    │
│  │  ┌──────────────┐      ┌──────────────┐                  │    │
│  │  │              │      │              │                  │    │
│  │  └──────────────┘      └──────────────┘                  │    │
│  │                                                            │    │
│  │  ☑️ Agregar acompañantes                                   │    │
│  │  ☑️ Asignar múltiples habitaciones                         │    │
│  │  ☑️ Viene por empresa → habilita Paso 2                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│              [Cancelar]            [Siguiente →]                    │
└────────────────────────────────────────────────────────────────────┘
```

- Paso 2 (Empresa): igual layout, buscador + formulario de creación si no existe.
- Paso 3 (Confirmación):
  ```
  ┌────────────────────────────────────────────────────────────────────┐
  │  Resumen del Check-in                                            │
  │  ─────────────────────────────────────────────────────────────     │
  │                                                                    │
  │  👤 Huésped: Carlos García · CC 12345678                        │
  │  🏢 Empresa: Constructora ABC · NIT 900123456                    │
  │                                                                    │
  │  🏨 Habitaciones asignadas:                                      │
  │  • 101 - Doble - $180.000/noche                                  │
  │  • 102 - Doble - $180.000/noche                                  │
  │                                                                    │
  │  📅 Entrada: Hoy 14:30    📅 Salida: 03/06/2026 13:00           │
  │                                                                    │
  │  🍾 Minibar incluido:                                            │
  │  • Agua x2 · Gaseosa x2 · Cerveza x2 · Snacks x1               │
  │                                                                    │
  │  💰 Total estimado: $720.000 (4 noches x 2 hab x $180k)        │
  │                                                                    │
  │  [✓ Generar comprobante PDF]                                     │
  │                                                                    │
  │              [← Anterior]            [Confirmar Check-in ✓]      │
  └────────────────────────────────────────────────────────────────────┘
  ```
- Transición entre pasos: slide horizontal suave (Framer Motion).
- Botón "Confirmar": `--accent-primary`, grande, con icono check.

---

## 5. Checkout (Wizard de Cierre)

```
┌────────────────────────────────────────────────────────────────────┐
│  Checkout — Habitación 101 · Carlos García           [X]          │
│  ─────────────────────────────────────────────────────────────     │
│                                                                    │
│  ⚠️  Recuerde: checkout excedido (14:30 vs límite 13:00)         │
│      Agregar cobro adicional: [________ COP]                      │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  🍾 Revisión del Minibar                                   │    │
│  │                                                            │    │
│  │  Producto          Esperado   Real      Consumido  Daño   │    │
│  │  ─────────────────────────────────────────────────────     │    │
│  │  Agua 500ml        2          0         [2]        [0]     │    │
│  │  Gaseosa Uva       2          1         [1]        [0]     │    │
│  │  Cerveza           2          2         [0]        [0]     │    │
│  │  Vaso de cristal   1          0         [0]        [1] $15k│    │
│  │                                                            │    │
│  │  Total Minibar: $45.000                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ➕ Servicios Extras Usados                                │    │
│  │  • Cena romántica — $50.000  [🗑️]                        │    │
│  │  • Transporte aeropuerto — $30.000  [🗑️]                 │    │
│  │  [+ Agregar servicio extra]                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  📋 RESUMEN DE CUENTA                                      │    │
│  │                                                            │    │
│  │  Habitación 101 (3 noches x $180.000)        $540.000     │    │
│  │  Habitación 102 (3 noches x $180.000)        $540.000     │    │
│  │  Minibar                                     $45.000       │    │
│  │  Servicios extras                            $80.000       │    │
│  │  Recargo checkout tardío                     $50.000       │    │
│  │  ─────────────────────────────────────────────────         │    │
│  │  Subtotal                                    $1.255.000    │    │
│  │  IVA (19%)                                   $238.450       │    │
│  │  ─────────────────────────────────────────────────         │    │
│  │  TOTAL A PAGAR                               $1.493.450    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  💳 FORMA DE PAGO                                          │    │
│  │                                                            │    │
│  │  Método: [Efectivo ▼]                                     │    │
│  │                                                            │    │
│  │  Responsable del pago:                                     │    │
│  │  ○ Todo a la empresa (Constructora ABC)                    │    │
│  │  ○ Todo al huésped (Carlos García)                         │    │
│  │  ● Mixto                                                   │    │
│  │    └─ Empresa paga: [☑ Habitaciones] [☐ Minibar] [☐ Extras]│    │
│  │    └─ Huésped paga:  [☐ Hab] [☑ Minibar] [☑ Extras] [☑ Recargo]│
│  │                                                            │    │
│  │    Empresa: $1.080.000    Huésped: $413.450                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│              [Cancelar]            [💰 Registrar Pago]            │
└────────────────────────────────────────────────────────────────────┘
```

- Banner de checkout excedido: fondo `--accent-warning` suave, texto amigable, NO agresivo.
- Tabla de minibar: inputs numéricos pequeños, fáciles de editar.
- Resumen: números alineados a la derecha, moneda formateada (COP).
- Pago mixto: checkboxes claros, totales se recalculan en tiempo real.
- Al pagar: toast de éxito, modal de "¿Imprimir comprobante?", habitación pasa a limpieza.

---

## 6. Vista de Reservas

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Reservas     [+ Nueva Reserva]  [Filtros ▼]  [Buscar 🔍]     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  #   Huésped          Habitación  Entrada    Salida   Estado │    │
│  │  ─────────────────────────────────────────────────────────   │    │
│  │  123 Carlos García   101         01/06      04/06    🔵 Pen │    │
│  │  124 Ana Martínez    Casa        05/06      10/06    🔵 Pen │    │
│  │  125 Pedro López     103         02/06      03/06    🟢 Chk │    │
│  │  126 María Ruiz      105         01/06      02/06    🔴 Can │    │
│  │                                                            │    │
│  │  [Check-in]  [Editar]  [Cancelar]  [Ver]                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [1] [2] [3] ... [10]  ← Paginación                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

- Tabla con filas alternadas, hover suave.
- Badge de estado con color + texto (no solo color).
- Acciones: iconos que aparecen al hover de la fila (para no saturar).
- Nueva reserva: abre wizard similar al check-in pero sin asignar físicamente.

---

## 7. Calendario

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Calendario    [Semana ▼] [< Anterior] [Hoy] [Siguiente >]     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│         Lunes 1    Martes 2    Miércoles 3  Jueves 4  Viernes 5  │
│  ─────────────────────────────────────────────────────────────     │
│  101    │          │  🟢 Juan   │  🟢 Juan   │  🟢 Juan   │        │
│         │          │  Pérez     │  Pérez     │  Pérez     │        │
│  ─────────────────────────────────────────────────────────────     │
│  102    │  🔵 Res  │  🔵 Res    │  🟢 Ana    │  🟢 Ana    │  🟢 Ana│
│         │  García  │  García    │  Martínez  │  Martínez  │        │
│  ─────────────────────────────────────────────────────────────     │
│  Casa   │          │            │  🔵 Res    │  🔵 Res    │  🔵 Res│
│         │          │            │  Grupo XYZ │  Grupo XYZ │        │
│  ─────────────────────────────────────────────────────────────     │
│  109    │          │            │  ⬜️ Bloq   │  ⬜️ Bloq   │  ⬜️ Bloq│
│  (Casa) │          │            │  por Casa  │  por Casa  │        │
│  ─────────────────────────────────────────────────────────────     │
│                                                                    │
│  🟢 Ocupada  🔵 Reservada  ⬜️ Bloqueada  🟡 Limpieza  🟠 Mant.  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

- Cabecera de días fija al hacer scroll vertical.
- Columna de habitaciones fija al hacer scroll horizontal.
- Línea de "hoy" en rojo punteado vertical.
- Bloques: border-radius 4px, padding interno 4px, texto truncado con ellipsis.
- Hover: tooltip con datos completos del huésped/empresa.
- Click en celda vacía: modal nueva reserva con fechas prellenadas.
- Reserva masiva: bloque ancho que abarca múltiples días, con badge "Grupo".

---

## 8. Inventario

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Inventario    [Consumibles] [Activos] [Minibar] [Mant.] [Rep.]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [+ Nuevo Producto]  [Recargar]  [Entregar a Housekeeping]        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Código    Nombre        Marca      Stock  Mín  Vence      │    │
│  │ ─────────────────────────────────────────────────────────  │    │
│  │ PROD-001  Agua 500ml    Cristal    45     5    12/2026   │    │
│  │ PROD-002  Gaseosa Uva   Postobón   12     5    08/2026 ⚠️│    │
│  │ PROD-003  Cerveza       Águila     3      5    —    🔴   │    │
│  │ PROD-004  Cloro 1L      Clorox     20     5    —          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Leyenda: ⚠️ Por vencer  🔴 Stock bajo                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

- Pestañas: estilo pills, activa con fondo `--accent-primary` y texto blanco.
- Alertas visuales: icono warning amarillo para vencimiento, icono alerta rojo para stock bajo.
- En móvil: cada fila se convierte en card apilada.

---

## 9. Configuración

```
┌────────────────────────────────────────────────────────────────────┐
│ ≡  Configuración                                                  │
├────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────────────────────────────────────┐   │
│  │ 🏨 Hotel   │  │  INFORMACIÓN DEL HOTEL                     │   │
│  │ 🛏️ Hab.    │  │                                            │   │
│  │ 💰 Precios │  │  Nombre: [Hotel San José del Guaviare    ] │   │
│  │ 📅 Temp.   │  │  NIT:    [900.123.456-7                  ] │   │
│  │ ➕ Servicios│  │  Logo:   [📁 Cargar imagen]  [Preview]    │   │
│  │ ⚙️ General │  │                                            │   │
│  │ 🔔 Notif.  │  │  [Guardar Cambios]                         │   │
│  │ 👥 Usuarios│  │                                            │   │
│  │ 💾 Backup  │  └────────────────────────────────────────────┘   │
│  └────────────┘                                                   │
└────────────────────────────────────────────────────────────────────┘
```

- Sidebar interno de configuración: lista vertical, item activo con fondo `--accent-primary` y texto blanco.
- Formularios: secciones con título y línea divisoria.
- Guardar: toast de confirmación, botón deshabilitado mientras guarda.
- Backup: lista de archivos ZIP con botón "Restaurar" (con confirmación modal de advertencia).

---

## 10. Footer del Sidebar (Info del Creador)

```
┌────────────────────────┐
│                        │
│  [Logo Hotel]          │
│  ─────────────────     │
│  Dashboard             │
│  Habitaciones          │
│  ...                   │
│  ─────────────────     │
│                        │
│  ┌──────────────────┐│
│  │ [Logo 24x24]      ││  ← Logo del creador
│  │ Desarrollado por   ││
│  │ [TuNombre]         ││  ← Nombre del creador
│  │ tuweb.com          ││  ← Link opcional
│  └──────────────────┘│
│                        │
│  🌙 Modo Oscuro      │
│  [Logout]            │
│                        │
└────────────────────────┘
```

- Siempre visible en la parte inferior del sidebar.
- Fondo ligeramente diferente (`--bg-sidebar-hover`) para separar visualmente.
- Texto: 11px, `--text-muted` (gris suave), no compite con el contenido.
- En móvil: esta info va al menú drawer, al final, en una sección "Acerca de".

---

## 11. Comprobante PDF (Vista Previa)

```
┌────────────────────────────────────────┐
│         [LOGO HOTEL]                   │
│     Hotel San José del Guaviare        │
│     NIT: 900.123.456-7                 │
│     San José del Guaviare, Colombia    │
│  ───────────────────────────────────── │
│                                        │
│  COMPROBANTE DE ESTADÍA                │
│  #CMP-2026-001234                      │
│                                        │
│  Huésped: Carlos García                │
│  Documento: CC 12345678                │
│  Empresa: Constructora ABC             │
│                                        │
│  Habitación: 101 · Tipo: Doble         │
│  Entrada: 01/06/2026 14:30            │
│  Salida:  04/06/2026 13:00            │
│  Noches: 3                             │
│  ───────────────────────────────────── │
│  CONCEPTO                    VALOR     │
│  Habitación (3 noches)      $540.000   │
│  Minibar                    $45.000    │
│  Servicios extras           $80.000    │
│  Recargo checkout           $50.000    │
│  ───────────────────────────────────── │
│  Subtotal                   $715.000   │
│  IVA (19%)                  $135.850   │
│  ───────────────────────────────────── │
│  TOTAL PAGADO               $850.850   │
│                                        │
│  Método: Efectivo                      │
│  Atendido por: Recepcionista María     │
│  Fecha: 04/06/2026 14:45              │
│                                        │
│  ───────────────────────────────────── │
│  Sistema desarrollado por [TuNombre]   │
│  [Logo pequeño del creador]            │
│                                        │
└────────────────────────────────────────┘
```

- Diseño limpio, tipo ticket/factura.
- Bordes sutiles, tipografía monoespaciada para los números (tabulados).
- Logo del hotel centrado arriba.
- Info del creador abajo, pequeña, en gris.

---

## 12. Responsive: Móvil

### Dashboard en Móvil
```
┌────────────────────────┐
│ ≡  Dashboard    🔔 👤  │  ← Header compacto
├────────────────────────┤
│                        │
│  ┌──────────────────┐  │
│  │  💰 $1.240.000   │  │  ← Cards apiladas, 1 columna
│  │  Ingresos hoy    │  │
│  │  ↑ 12%           │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  🛏️ 8/13         │  │
│  │  Ocupadas        │  │
│  └──────────────────┘  │
│  ...                   │
│                        │
│  ┌──────────────────┐  │
│  │  📊 Gráfico      │  │  ← Scroll horizontal si es ancho
│  │  (swipeable)     │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │  🏨 Check-in     │  │
│  │  [101] [102]     │  │  ← Mini grid 2 columnas
│  │  [103] [104]     │  │
│  └──────────────────┘  │
│                        │
├────────────────────────┤
│  🏠  📅  📦  ⚙️  ➕   │  ← Bottom navigation
└────────────────────────┘
```

### Wizard en Móvil
- Pantalla completa (100vh), sin overlay.
- Header fijo con título y paso actual.
- Body scrollable.
- Footer fijo con botones grandes (ocupan 50% cada uno).
- Inputs con font-size 16px (evita zoom de iOS).

### Bottom Navigation
- 5 iconos: Dashboard, Habitaciones, Reservas, Calendario, Más (drawer).
- Icono activo: color `--accent-primary`, con badge si hay notificaciones.
- Drawer "Más": Inventario, Historial, Configuración, Logout.

---

*Este documento es la guía visual maestra. Cualquier desviación requiere aprobación.*
