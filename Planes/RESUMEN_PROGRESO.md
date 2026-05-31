# ðŸ“‹ RESUMEN DE PROGRESO â€” Hotel Manager
## GuÃ­a Maestra de NavegaciÃ³n | Actualizado: 30/05/2026

> âš ï¸ **REGLA #1 â€” OBLIGATORIA, NO NEGOCIABLE:**
> Antes de escribir UNA SOLA lÃ­nea de cÃ³digo, **LEER TODA la carpeta `Planes/`**.
> Si la IA no lee los planes, puede alucinar decisiones que ya estÃ¡n definidas.
> Este archivo es el **punto de entrada**. Desde aquÃ­ sabes dÃ³nde ir.

---

## ðŸ—ºï¸ Â¿QUÃ‰ NECESITAS SABER? â†’ LEE ESTE ARCHIVO

Esta es la guÃ­a rÃ¡pida. SegÃºn lo que necesites, ve al archivo indicado:

### ðŸ“ Â¿En quÃ© etapa estamos y quÃ© falta hacer?
| Archivo | QuÃ© contiene |
|---------|-------------|
| **Este archivo** (`RESUMEN_PROGRESO.md`) | Estado global, % completado por fase, lista resumida de tareas con checkboxes |
| `PLAN_DE_FASES.md` | â­ **Plan completo y detallado** (~389 tareas checkbox, ~907 lÃ­neas). Cada tarea con descripciÃ³n, campos, conexiones entre fases. **Es la fuente de verdad de TODO lo que se debe hacer.** |

### ðŸŽ¨ Â¿CÃ³mo debe verse el Frontend? (colores, componentes, animaciones, responsive)
| Archivo | QuÃ© contiene |
|---------|-------------|
| `UI_Visual_Guide.md` | â­ **Wireframes pantalla por pantalla**: Login, Dashboard, Habitaciones, Check-in Wizard, Checkout, Reservas, Calendario, Inventario, ConfiguraciÃ³n, PDF. Describe EXACTAMENTE cÃ³mo se ve cada pantalla, quÃ© elementos tiene, quÃ© pasa al hacer click, cÃ³mo se ve en mÃ³vil. |
| `SKILLS/SKILL-10-UXUI-Design.md` | â­ **Design System completo**: Paleta de colores exacta (modo claro + oscuro con hex), tipografÃ­a (fuente, tamaÃ±os, pesos), componentes (RoomCard, WizardModal, DashboardCards, Calendario, Tablas, Formularios, Toasts, Notificaciones), animaciones con duraciones exactas (hover 200ms, modal 250ms, etc.), layout por breakpoint (desktop/tablet/mÃ³vil), accesibilidad WCAG AA, reglas absolutas de UI (NUNCA blanco puro, NUNCA negro puro, etc.) |

### ðŸ—ï¸ Â¿QuÃ© tecnologÃ­as y arquitectura usar?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SDD.md` | **Documento de DiseÃ±o del Sistema**: VisiÃ³n general, stack completo, estructura de carpetas, flujos de datos, decisiones tÃ©cnicas |
| `SKILLS/SKILL-01-Arquitectura.md` | **Stack detallado**: Laravel 12, React 19, TypeScript 5.8, Vite 8, PostgreSQL 16, Docker, Reverb. Estructura de capas, convenciones de archivos |

### ðŸ—„ï¸ Â¿QuÃ© tablas, campos y relaciones tiene la BD?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-02-ModeloDeDatos.md` | **Modelo de datos completo**: Todas las tablas con sus campos, tipos, FKs, relaciones. Diagrama de entidad-relaciÃ³n |
| `PLAN_DE_FASES.md` secciones 0.2b, 1.1, 2.1, 3.1, 4.1 | **Migraciones con campos explÃ­citos**: Cada columna con su tipo y restricciones |

### ðŸ”„ Â¿CÃ³mo funcionan los flujos de usuario paso a paso?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-03-FlujosUI.md` | **Flujos completos**: Check-in walk-in (3 pasos), Check-in desde reserva, Checkout (4 pasos), Reserva nueva, Transferencia, Limpieza, Inventario |

### ðŸ“¡ Â¿QuÃ© endpoints tiene la API?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-04-API.md` | **API reference**: Todos los endpoints por mÃ³dulo, formato de request/response, cÃ³digos HTTP, autenticaciÃ³n, paginaciÃ³n |
| `PLAN_DE_FASES.md` secciones 1.2, 2.2, 3.2, 4.7, 5.x | **Endpoints adicionales** detectados en la auditorÃ­a que no estaban en SKILL-04 |

### â›” Â¿QuÃ© NO debo hacer? (reglas anti-alucinaciÃ³n)
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-05-ReglasDelProyecto.md` | â­ **CRÃTICO**: Reglas absolutas que NUNCA se deben romper: UUIDs, enums en inglÃ©s, NUNCA MQTT, NUNCA localStorage para tokens, NUNCA mÃ³dulos no solicitados, NUNCA facturaciÃ³n electrÃ³nica sin autorizaciÃ³n, etc. |

### ðŸ³ Â¿CÃ³mo configurar Docker, red local y backups?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-06-Docker.md` | **Docker completo**: docker-compose.yml, Dockerfile, Dockerfile.reverb, red LAN, volÃºmenes, auto-start Windows, backup cron, restauraciÃ³n |

### ðŸ“… Â¿CÃ³mo funciona el calendario y la lÃ³gica de ocupaciÃ³n?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-07-Calendario.md` | **LÃ³gica del calendario**: CÃ³mo se calcula disponibilidad (reservas + stays + casas), colores por estado, vistas semana/mes/aÃ±o, reglas de superposiciÃ³n, bloqueo de Casa |

### ðŸ“„ Â¿CÃ³mo funcionan los comprobantes PDF y el IVA?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-08-Facturacion.md` | **FacturaciÃ³n**: Comprobante PDF (contenido, formato, almacenamiento), IVA (incluido en precios, toggle, tasa configurable), preparaciÃ³n para facturaciÃ³n electrÃ³nica futura |

### ðŸ§  Â¿CÃ³mo funciona el sistema de sugerencias?
| Archivo | QuÃ© contiene |
|---------|-------------|
| `SKILLS/SKILL-09-Aprendizaje.md` | **Sugerencias**: Minibar personalizado, precios dinÃ¡micos, paquetes corporativos, tabla `suggestions`, job diario, solo admin/superadmin |

---

## ðŸ“Š Estado Global del Proyecto

| Fase | Nombre | Tareas | âœ… | Estado |
|------|--------|--------|----|--------|
| **0** | FundaciÃ³n (Docker, Auth, BD, Settings, Reverb) | ~74 | 0 | â¬œ No iniciada |
| **1** | Dashboard + Habitaciones + Check-in | ~92 | 0 | â¬œ No iniciada |
| **2** | Reservas + Calendario | ~57 | 0 | â¬œ No iniciada |
| **3** | Checkout + Pagos + Comprobantes PDF | ~47 | 0 | â¬œ No iniciada |
| **4** | Inventario + Minibar + Activos + Mantenimientos | ~57 | 0 | â¬œ No iniciada |
| **5** | ConfiguraciÃ³n Completa | ~42 | 0 | â¬œ No iniciada |
| **6** | Historial + AuditorÃ­a + Sugerencias | ~19 | 0 | â¬œ No iniciada |
| **7** | Red Local + Responsive + OptimizaciÃ³n | ~24 | 0 | â¬œ No iniciada |
| **8** | FacturaciÃ³n ElectrÃ³nica (FUTURA) | ~4+4âœ… | 4 | ðŸ”® Futura |
| | **TOTAL** | **~389+4** | **4** | **~1%** |

### ðŸŽ¯ Fase Actual: `FASE 0` â€” FundaciÃ³n
**Siguiente acciÃ³n**: Iniciar secciÃ³n 0.1 Docker y Ambiente.

---

## ðŸ“ GuÃ­a Visual RÃ¡pida â€” Â¿CÃ³mo se ve cada pantalla?

> **Fuente de verdad**: `UI_Visual_Guide.md` + `SKILLS/SKILL-10-UXUI-Design.md`

### Paleta de Colores (de SKILL-10)
```
MODO CLARO                          MODO OSCURO
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Fondo general:    #F8FAFC           Fondo general:    #0B1120
Tarjetas/modales: #FFFFFF           Tarjetas/modales: #1E293B
Sidebar:          #0F172A           Sidebar:          #020617
Texto principal:  #0F172A           Texto principal:  #F1F5F9
Texto secundario: #64748B           Texto secundario: #94A3B8
Borde:            #E2E8F0           Borde:            #334155
Acento principal: #10B981 (emerald) Acento principal: #34D399
Acento secundario:#3B82F6 (blue)    Acento secundario:#60A5FA
Warning:          #F59E0B (amber)   Warning:          #FBBF24
Danger:           #EF4444 (red)     Danger:           #F87171
Purple:           #8B5CF6           Orange:           #F97316
```

### Colores de Estado de HabitaciÃ³n
```
Disponible:    emerald (bg-emerald-50 / emerald-900/30)  â†’ icono CheckCircle
Ocupada:       rose    (bg-rose-50    / rose-900/30)     â†’ icono User
Limpieza:      amber   (bg-amber-50  / amber-900/30)    â†’ icono Sparkles
Mantenimiento: orange  (bg-orange-50 / orange-900/30)   â†’ icono Wrench
Reservada:     sky     (bg-sky-50    / sky-900/30)       â†’ icono Calendar
Bloqueada:     slate   (bg-slate-100 / slate-800)        â†’ icono Home
```

### Layout por Dispositivo
```
DESKTOP (â‰¥1280px)          TABLET (768-1279px)        MÃ“VIL (<768px)
â”Œâ”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚Sidebarâ”‚           â”‚      â”‚Iconsâ”‚          â”‚          â”‚  Header  â”‚
â”‚ 240px â”‚  Content  â”‚      â”‚72pxâ”‚ Content  â”‚          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚       â”‚  scroll   â”‚      â”‚    â”‚ scroll   â”‚          â”‚          â”‚
â”‚       â”‚           â”‚      â”‚    â”‚          â”‚          â”‚ Content  â”‚
â”‚       â”‚           â”‚      â”‚    â”‚          â”‚          â”‚  scroll  â”‚
â”‚Creatorâ”‚           â”‚      â”‚    â”‚          â”‚          â”‚          â”‚
â””â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                                                      â”‚ BottomNavâ”‚
                                                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Componentes Clave (de SKILL-10)
| Componente | EspecificaciÃ³n rÃ¡pida | Detalle en |
|------------|----------------------|------------|
| **RoomCard** | border-radius 12px, borde izq 4px color estado, hover scale(1.02) 200ms | SKILL-10 |
| **WizardModal** | Desktop: max-width 720px centrado. MÃ³vil: fullscreen. Pasos 1-2-3 con barra progreso. Slide horizontal (Framer Motion) | SKILL-10 + UI_Visual_Guide |
| **DashboardCards** | 4 cards (4 cols desktop, 2Ã—2 tablet, 1 col mÃ³vil). Icono + nÃºmero 48px + label + trend â†‘â†“ | SKILL-10 |
| **CalendarGrid** | Grid semana: cabecera fija, habitaciones fijas. LÃ­nea "hoy" roja punteada. Bloques radius 6px | SKILL-07 + SKILL-10 |
| **Tablas** | Header fondo oscuro, filas alternadas, bordes horizontales. MÃ³vil: cards apiladas | SKILL-10 |
| **Formularios** | Inputs radius 8px, focus ring emerald 2px, floating labels. NUNCA placeholder como label | SKILL-10 |
| **Toasts** | Top-right desktop, top-center mÃ³vil. 4 segundos + barra progreso. Slide-in + fade-out | SKILL-10 |
| **Dark Mode** | Toggle Sun/Moon en header. localStorage. Transition 300ms. NUNCA #000000 | SKILL-10 |

### TipografÃ­a
```
Fuente:           Inter (fallback: system-ui, sans-serif)
TÃ­tulo pÃ¡gina:    28px / peso 700
NÃºmero dashboard: 48px / peso 700
SubtÃ­tulo:        16px / peso 500
Label formulario: 14px / peso 500
Input texto:      15px / peso 400
BotÃ³n principal:  15px / peso 600, texto blanco
Badge estado:     12px / peso 600
Sidebar item:     14px / peso 500 (color #CBD5E1)
Sidebar activo:   14px / peso 600 (color #FFFFFF)
```

### Animaciones
```
Hover RoomCard:        scale(1.02) + shadow â†‘     200ms
Cambio estado hab:     Pulse color                 400ms
Abrir modal:           Fade + scale(0.95â†’1)        250ms
Cerrar modal:          Fade + scale(1â†’0.95)        200ms
Wizard paso:           Slide horizontal             300ms
Toast entrada:         Slide-in-right              300ms
Toast salida:          Fade-out                     200ms
Sidebar colapsar:      Width transition             300ms
Dark mode toggle:      Color transition global      300ms
Carga de pÃ¡gina:       Skeleton screens (NO spinners)
```

---

## ðŸ—ï¸ DETALLE POR FASE (Checkboxes)

### FASE 0: FundaciÃ³n â€” `PLAN_DE_FASES.md` lÃ­neas 36-184
**Leer antes**: `SKILL-01`, `SKILL-05`, `SKILL-06`, `SKILL-10`

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 0.1 | 11 | Docker y Ambiente (docker-compose, Dockerfile, Nginx, volÃºmenes, auto-start Windows) |
| 0.1b | 4 | Seeders Seguros (no duplicar datos al reiniciar) |
| 0.1c | 1 | .gitignore |
| 0.2 | 9 | Laravel Backend (Sanctum, Spatie, UUIDs, enums, formato API) |
| 0.2b | 6 | Migraciones Base (hotels, users, activity_logs, backups, notifications, Spatie) |
| 0.2c | 5 | Seeders Base (superadmin, roles, 17 permisos, asignaciÃ³n, settings) |
| 0.3 | 15 | React Frontend (Vite, Tailwind, Design System CSS, dark mode, skeletons, login) |
| 0.3b | 6 | Accesibilidad A11y (WCAG AA, aria-labels, focus trap) |
| 0.4 | 7 | Settings + Auth Endpoints (login, logout, me, middleware) |
| 0.5 | 4 | Laravel Reverb (canales, hook, test) |
| 0.6 | 5 | Concurrencia (SELECT FOR UPDATE, test 2 pestaÃ±as) |
| 0.7 | 8 | Pruebas Fase 0 |
| **Total** | **~74** | |

---

### FASE 1: Dashboard + Habitaciones + Check-in â€” `PLAN_DE_FASES.md` lÃ­neas 186-316
**Leer antes**: `SKILL-02`, `SKILL-03`, `SKILL-04`, `SKILL-10`, `UI_Visual_Guide`

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 1.1 | 17 | Migraciones (room_types, houses, rooms, guests, companies, stays, payments, companions, transfers, services) |
| 1.1b | 7 | Ãndices PostgreSQL (pg_trgm, document_number, status, fechas) |
| 1.1c | 4 | Eventos WebSocket (RoomStatusChanged, NewCheckIn, NewNotification) |
| 1.2 | 7 | API Habitaciones (CRUD, set-available, set-cleaning, transfer) |
| 1.3 | 9 | Vista Habitaciones Frontend (RoomCard, colores, iconos, Casa) |
| 1.4 | 9 | Dashboard (cards, grÃ¡fico, alertas, check-in rÃ¡pido, sugerencias) |
| 1.5 | 4 | Wizard Check-in Walk-in (3 pasos: huÃ©spedâ†’empresaâ†’confirmaciÃ³n) |
| 1.6 | 5 | Vista HuÃ©spedes (listado, CRUD, wireframe) |
| 1.6b | 4 | Vista Empresas (listado, CRUD, wireframe) |
| 1.7 | 7 | Transferencia de HuÃ©sped (room_transfers, estados, Reverb) |
| 1.8 | 2 | Drawer Lateral EstadÃ­a (detalle + botÃ³n Agregar Servicio Extra) |
| 1.9 | 7 | Pruebas Fase 1 |
| **Total** | **~92** | |

---

### FASE 2: Reservas + Calendario â€” `PLAN_DE_FASES.md` lÃ­neas 319-402
**Leer antes**: `SKILL-07`, `SKILL-03`, `UI_Visual_Guide` secciÃ³n Calendario

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 2.1 | 5 | Modelo (reservations, reservation_payments, seasons, validaciÃ³n, Casa) |
| 2.2 | 6 | API Reservas (CRUD, check-in desde reserva, cancel, extend) |
| 2.3 | 4 | Vista Reservas (listado, badges, wizard, masivas) |
| 2.4 | 17 | Calendario (3 vistas, cabecera fija, lÃ­nea hoy, drag, lazy loading) |
| 2.5 | 6 | Alertas Reservas (job horario, notificaciones, vencimiento NO automÃ¡tico) |
| 2.6 | 7 | Pruebas Fase 2 |
| **Total** | **~57** | |

---

### FASE 3: Checkout + Pagos + PDF â€” `PLAN_DE_FASES.md` lÃ­neas 405-490
**Leer antes**: `SKILL-08`, `SKILL-03`, `UI_Visual_Guide` secciÃ³n Checkout

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 3.1 | 2 | Modelo (revisiÃ³n stays/payments + minibar_consumptions) |
| 3.2 | 11 | API Checkout y EstadÃ­as (checkout, account, extend, add-room, services, anticipado) |
| 3.3 | 4 | Wizard Checkout (minibarâ†’extrasâ†’cuentaâ†’pago) |
| 3.4 | 2 | Post-Checkout (estados, inventory_transactions, Reverb) |
| 3.5 | 9 | Comprobantes PDF (DomPDF, formato COMP-AAAAMM-SEQ, checkboxes gastos) |
| 3.6 | 2 | Pagos Parciales/Abonos |
| 3.7 | 6 | Pruebas Fase 3 |
| **Total** | **~47** | |

---

### FASE 4: Inventario + Minibar + Activos â€” `PLAN_DE_FASES.md` lÃ­neas 494-600
**Leer antes**: `SKILL-02`, `UI_Visual_Guide` secciÃ³n Inventario

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 4.1 | 9 | Migraciones inventario (categories, items, transactions, minibar, assets, repairs) |
| 4.2 | 5 | Consumibles (cÃ³digo PROD-XXXXX, sugerencia duplicados, campos completos) |
| 4.3 | 5 | Minibar (catÃ¡logo, room_minibars, auditorÃ­a reposiciÃ³n) |
| 4.3b | 2 | Entrega a Housekeeping (flujo detallado: empleado+productos+historial) |
| 4.4 | 5 | Activos (cÃ³digo ACT-XXXX, mantenimiento programado) |
| 4.5 | 4 | Reparaciones (Ã³rdenes de trabajo) |
| 4.6 | 3 | Alertas Inventario (vencimiento, stock bajo, mantenimiento) |
| 4.6b | 5 | Centro de Notificaciones Frontend (drawer, badge, modales admin) |
| 4.7 | 8 | Vista Inventario (5 pestaÃ±as, tablas SKILL-10, API endpoints) |
| 4.8 | 7 | Pruebas Fase 4 |
| **Total** | **~57** | |

---

### FASE 5: ConfiguraciÃ³n Completa â€” `PLAN_DE_FASES.md` lÃ­neas 607-690
**Leer antes**: `SKILL-06` (backup), `UI_Visual_Guide` secciÃ³n ConfiguraciÃ³n

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 5.1-5.10 | 28 | CRUDs: Hotel, Habitaciones, Casas, Tipos, Temporadas, Servicios, IVA, Horarios, Reservas, Limpieza, Notificaciones, Roles/Permisos |
| 5.11 | 7 | Backup (retenciÃ³n ilimitada, placeholder Google Drive) |
| 5.12 | 7 | Pruebas Fase 5 |
| **Total** | **~42** | |

---

### FASE 6: Historial + AuditorÃ­a + Sugerencias â€” `PLAN_DE_FASES.md` lÃ­neas 700-750
**Leer antes**: `SKILL-09`

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 6.1-6.3 | 8 | Activity Log + Vista Historial + Pagos HistÃ³ricos |
| 6.4 | 6 | Sistema de Sugerencias (job diario, tabla suggestions, dashboard) |
| 6.5-6.6 | 6 | Vista Frontend + Pruebas |
| **Total** | **~19** | |

---

### FASE 7: Red Local + Responsive + OptimizaciÃ³n â€” `PLAN_DE_FASES.md` lÃ­neas 757-800
**Leer antes**: `SKILL-06`, `SKILL-10` (responsive)

| SecciÃ³n | Tareas | Tema |
|---------|--------|------|
| 7.1 | 5 | Red Local (Docker 0.0.0.0:80, 3+ PCs, Reverb cross-device) |
| 7.2 | 6 | Responsive Final (sidebar, grid, modales, calendario, touch) |
| 7.3 | 5 | OptimizaciÃ³n (lazy loading, paginaciÃ³n, gzip, Ã­ndices) |
| 7.4 | 4 | Estrategia ActualizaciÃ³n (script update, rollback) |
| 7.5 | 4 | Pruebas Fase 7 |
| **Total** | **~24** | |

---

### FASE 8: FacturaciÃ³n ElectrÃ³nica â€” FUTURA
- [x] Campos NIT preparados âœ…
- [x] Desglose IVA preparado âœ…
- [x] Comprobantes PDF preparados âœ…
- [x] Historial de pagos preparado âœ…
- [ ] DIAN, Pasarela de pago, Email, Booking/Airbnb â†’ **NO iniciar sin autorizaciÃ³n**

---

## âš ï¸ Reglas Absolutas (Extracto de SKILL-05)

1. **SIEMPRE leer `Planes/` antes de codificar** â€” Esta regla NO es negociable.
2. **Todos los IDs son UUID** â€” NUNCA auto-increment.
3. **Enums en minÃºsculas e inglÃ©s** â€” `available`, NO `DISPONIBLE`.
4. **Token en memoria (Zustand)** â€” NUNCA en localStorage.
5. **NUNCA usar MQTT** â€” Solo Laravel Reverb.
6. **Respuesta API**: `{ success, data, message, errors }`.
7. **Rama Git por fase**: `fase-0`, `fase-1`, etc.
8. **NUNCA agregar mÃ³dulos no solicitados** (restaurante, spa, gym).
9. **NUNCA blanco puro (#FFFFFF) como fondo** â€” usar #F8FAFC.
10. **NUNCA negro puro (#000000) en dark mode** â€” usar #0B1120.
11. **Skeleton screens** para carga â€” NUNCA spinners genÃ©ricos.
12. **Soft delete** en: Guest, Company, Room.
13. **SELECT FOR UPDATE** en: check-in, checkout, transferencia.

---

## ðŸ“Ž Ãndice Completo de Archivos

| # | Archivo | Para quÃ© sirve |
|---|---------|----------------|
| 1 | `RESUMEN_PROGRESO.md` | **ESTE ARCHIVO** â€” Punto de entrada, estado global, guÃ­a de navegaciÃ³n |
| 2 | `PLAN_DE_FASES.md` | **PLAN DETALLADO** â€” ~389 tareas checkbox con campos, conexiones, pruebas |
| 3 | `SDD.md` | Documento de DiseÃ±o del Sistema â€” visiÃ³n general, stack, estructura |
| 4 | `UI_Visual_Guide.md` | **CÃ“MO SE VE** cada pantalla â€” wireframes escritos pantalla por pantalla |
| 5 | `SKILLS/SKILL-01-Arquitectura.md` | Stack, capas, estructura de carpetas |
| 6 | `SKILLS/SKILL-02-ModeloDeDatos.md` | Tablas, campos, relaciones, diagrama ER |
| 7 | `SKILLS/SKILL-03-FlujosUI.md` | Flujos paso a paso (check-in, checkout, reserva) |
| 8 | `SKILLS/SKILL-04-API.md` | Endpoints, request/response, auth |
| 9 | `SKILLS/SKILL-05-ReglasDelProyecto.md` | âš ï¸ REGLAS â€” anti-alucinaciÃ³n, prohibiciones |
| 10 | `SKILLS/SKILL-06-Docker.md` | Docker, red LAN, backup, restauraciÃ³n |
| 11 | `SKILLS/SKILL-07-Calendario.md` | LÃ³gica de ocupaciÃ³n, colores, vistas |
| 12 | `SKILLS/SKILL-08-Facturacion.md` | PDF, IVA, preparaciÃ³n facturaciÃ³n electrÃ³nica |
| 13 | `SKILLS/SKILL-09-Aprendizaje.md` | Sistema de sugerencias basado en historial |
| 14 | `SKILLS/SKILL-10-UXUI-Design.md` | **DESIGN SYSTEM** â€” colores, tipografÃ­a, componentes, animaciones |
| 15-18 | `Borradores/` (5 archivos) | Conversaciones originales con el cliente (solo referencia) |

---

## ðŸ”„ Historial de Actualizaciones

| Fecha | VersiÃ³n | Cambio |
|-------|---------|--------|
| 30/05/2026 | v1.0 | Plan inicial creado |
| 30/05/2026 | v1.1 | IntegraciÃ³n de mejoras (concurrencia, seeders, docker, etc.) |
| 30/05/2026 | v1.2 | AuditorÃ­a cruzada: +92 tareas, cierre de 11 brechas, campos explÃ­citos |
| 30/05/2026 | v1.3 | GuÃ­a de navegaciÃ³n maestra: quÃ© archivo leer para quÃ©, design system rÃ¡pido |

---

*Confirma que todo estÃ¡ correcto y da la orden de inicio para arrancar con **Fase 0**.*
