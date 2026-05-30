# Skill: Arquitectura y Stack Tecnológico — Hotel Manager

## Contexto
Sistema de gestión hotelera local (red LAN, sin dependencia de internet). Dockerizado, multi-dispositivo (máx. 10), responsive. Una PC maestra corre Docker y las demás se conectan por red local.

## Stack Confirmado
### Frontend
- React 19 (stable)
- TypeScript 5.8
- Vite 8 (build tool)
- React Router v7
- Zustand 5 (state management)
- Tailwind CSS v4
- Axios (HTTP client)
- Framer Motion (animaciones)
- Lucide React (iconografía)
- React Hot Toast (notificaciones toast)
- clsx + tailwind-merge (utilidades de clases CSS)

### Backend
- Laravel 12 (framework PHP)
- PHP 8.4
- PostgreSQL 16 (base de datos)
- Laravel Sanctum (autenticación API por tokens)
- Spatie Laravel Permission (roles y permisos granulares)
- Laravel Reverb (WebSockets nativo para notificaciones en tiempo real y estados de habitación sin recargar página)
- UUIDs como identificadores primarios en TODAS las tablas (sin excepción)

### Infraestructura
- Docker + Docker Compose
- Alpine Linux (imagen base)
- Nginx (servidor web dentro del contenedor app)
- PostgreSQL volumen persistente
- Servicios Docker: `app` (PHP-FPM + Nginx + React build), `db` (PostgreSQL), `reverb` (WebSockets)

## Reglas de Arquitectura
1. NUNCA usar MQTT; usar Laravel Reverb para tiempo real.
2. TODAS las tablas usan UUID primary key. Nunca usar auto-increment integers.
3. El backend expone API RESTful con Sanctum. El frontend es SPA que consume la API.
4. Docker Compose debe permitir acceso por IP de red local (puertos expuestos: 80 para app, 5432 solo interno o restringido).
5. La PC maestra inicia Docker automáticamente (Windows Docker Desktop auto-start).
6. El sistema debe funcionar 100% offline después del primer despliegue.
7. Responsive design obligatorio: desktop, tablet y móvil.
8. Nunca hardcodear configuraciones; todo debe venir de la tabla `settings` o tablas de configuración.
