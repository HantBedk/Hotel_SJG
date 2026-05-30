# Skill: Facturación y Comprobantes — Hotel Manager (Fase Futura)

## Estado Actual
Por ahora NO se implementa facturación electrónica ni pasarelas de pago. Solo comprobantes internos PDF.

## Preparación para Futuro
- Tablas y campos ya preparados:
  - `companies.nit` (para facturar a empresa)
  - `guests.document_number` (para facturar a persona)
  - `hotel.nit` (emisor)
  - `payments` con método y tipo
  - `settings.iva_enabled`, `settings.iva_rate`
- El checkout ya desglosa subtotal + IVA, listo para factura electrónica.

## Comprobante PDF (Actual)
- Generado con librería PHP (ej: DomPDF o BrowserShot).
- Contiene: logo del hotel, datos del huésped/empresa, detalle de habitaciones, noches, precios, minibar, servicios extras, IVA, total, fechas de check-in/out, número de comprobante.
- Opciones: "Ver PDF" (en nueva pestaña) o "Descargar PDF".
- No se envía por email/WhatsApp por ahora.

## Reglas
1. Nunca implementar pasarela de pago sin autorización explícita del usuario.
2. Nunca conectar con DIAN/SAT/efactura hasta fase específica.
3. El PDF debe ser generado en el backend y servido como blob/stream.
4. Guardar copia del PDF en `storage/app/comprobantes/{año}/{mes}/` para auditoría.
