# Skill: Sistema de Aprendizaje / Sugerencias — Hotel Manager

## Alcance
Sugerencias basadas en patrones históricos. NO es IA predictiva compleja; es análisis de datos locales.

## Sugerencias Implementables
1. **Minibar personalizado**: Si un huésped recurrente siempre consume cervezas, sugerir al recepcionista recargar cervezas extras en su minibar al check-in.
2. **Precios dinámicos sugeridos**: Si el calendario muestra que los fines de semana de diciembre tienen >90% ocupación histórica, sugerir al admin revisar precios.
3. **Paquetes corporativos**: Si una empresa reserva 3+ habitaciones mensualmente, sugerir crear tarifa especial o paquete.
4. **Reposición automática de minibar**: Si el historial muestra que la habitación 101 consume 2 aguas diarias, sugerir mantener stock de 4 aguas (2 de consumo + 2 de seguridad).

## Implementación Técnica
- Tabla `suggestions`: `id`, `type`, `title`, `description`, `confidence_score`, `dismissed`, `created_at`.
- Job de Laravel que corre periódicamente (diario) analizando tablas `stays`, `minibar_consumptions`, `reservations`.
- Mostrar en Dashboard como "Sugerencias del día" con opción de descartar.
- Solo visible para admin y superadmin.

## Reglas
1. Nunca tomar decisiones automáticas; solo sugerencias.
2. Nunca enviar datos fuera del sistema local.
3. Las sugerencias deben explicar el porqué (ej: "Carlos García ha consumido cerveza en 4 de 5 visitas").
