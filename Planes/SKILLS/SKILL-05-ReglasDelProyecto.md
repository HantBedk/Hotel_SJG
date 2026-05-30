# Skill: Reglas del Proyecto — Hotel Manager

## Propósito
Evitar que la IA genere código o decisiones que contradigan lo acordado con el cliente. Cualquier desviación requiere consulta explícita.

## Reglas Absolutas (NO NEGOCIABLES)
1. **Stack fijo**: React 19 + TS 5.8 + Vite 8 + Laravel 12 + PHP 8.4 + PostgreSQL + Docker. NUNCA sugerir cambio de stack sin autorización explícita del usuario.
2. **UUIDs obligatorios**: TODAS las tablas usan UUID como PK. Nunca usar BigInteger auto-increment.
3. **Local/Offline**: El sistema NO depende de internet. Nunca integrar APIs externas (Google Drive, pasarelas de pago, facturación electrónica) hasta que el usuario lo solicite explícitamente en fases futuras.
4. **Un solo estado por habitación**: Nunca implementar estados múltiples simultáneos. Los estados válidos son: available, occupied, cleaning, maintenance, reserved.
5. **La Casa**: Es entidad separada. Precio fijo independiente. Si una habitación de la Casa está reservada, la Casa se bloquea para ese rango. Las otras 3 habitaciones de la Casa siguen disponibles individualmente.
6. **IVA**: Precios almacenados CON IVA incluido. Desglose opcional en checkout según configuración. Tasa default 19% Colombia.
7. **Pagos**: Todo pago se registra en `payments` con método, tipo, recepcionista y fecha. Nunca omitir el historial de pagos.
8. **No cancelación automática**: Las reservas vencen por alerta, NUNCA por sistema automático. La decisión es humana.
9. **Backup**: ZIP diario automático a medianoche (configurable). Incluye BD + archivos (storage). Ruta configurable local.
10. **Roles**: Spatie Permission. Superadmin = todo. Admin = config + operaciones. Receptionist = operaciones (configurable por admin). Housekeeping y maintenance existen en BD pero SIN vistas propias por ahora.
11. **Minibar**: Productos tienen precio costo (inventario) y precio venta (minibar). Al checkout se descuenta del inventario de la habitación y se suma a la cuenta.
12. **Responsive**: Obligatorio. Debe funcionar en desktop, tablet y móvil.
13. **Tiempo real**: Usar Laravel Reverb. Nunca usar MQTT ni polling excesivo.
14. **Códigos de inventario**: Consumibles = auto-secuencial (PROD-XXXXX). Activos = auto (ACT-XXXX). Nunca mezclar.
15. **Wizard de check-in**: Siempre 3 pasos (Huésped → Empresa → Confirmación/Minibar). Nunca omitir pasos ni agregar pasos extra sin consulta.
16. **Checkout**: Siempre incluye revisión de minibar + resumen de cuenta + opciones de pago + comprobante PDF. Nunca saltarse pasos.
17. **Notificaciones**: Modales para admin en horarios de baja saturación (configurable). Todos los modales dejan registro persistente.
18. **Extensión de estadía**: Editar fechas de la estadía existente. Nunca crear nueva estadía.
19. **Transferencia de huésped**: Cambio de habitación sin checkout. Registrar en `room_transfers`. La estadía continúa.
20. **Actividad**: Toda transacción, pago, cambio de estado, abono, checkout, check-in se registra en `activity_log` con usuario, hora e IP.

## Lo que NO debe hacer la IA
- NO agregar módulos no solicitados (ej: restaurante, spa, gym).
- NO cambiar el flujo de check-in/checkout acordado.
- NO usar localStorage para datos sensibles (tokens en memoria de Zustand, localStorage solo para preferencias UI).
- NO implementar autenticación JWT; usar Sanctum.
- NO crear tablas sin UUID.
- NO omitir el campo `created_by` / `updated_by` en tablas de negocio.
- NO hardcodear precios, IVA o configuraciones.
- NO usar imágenes externas (CDN); todo local.

## Proceso de Desarrollo por Fases
1. Nunca saltar una fase sin completar la anterior.
2. Cada fase debe tener su propia rama Git (o al menos su propia carpeta de documentación).
3. Antes de escribir código de una fase, revisar esta skill y el SDD.
4. Cada fase termina con pruebas manuales del flujo completo antes de pasar a la siguiente.
5. Si una decisión técnica contradice estas reglas, detenerse y consultar al usuario.
