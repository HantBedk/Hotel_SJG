# Skill: Docker y Despliegue Local — Hotel Manager

## Arquitectura Docker Compose
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    volumes:
      - ./storage:/var/www/html/storage
      - ./backup:/var/www/html/backup
    environment:
      - APP_ENV=local
      - DB_HOST=db
    depends_on:
      - db
      - reverb
    networks:
      - hotel-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hotel_db
      POSTGRES_USER: hotel_user
      POSTGRES_PASSWORD: hotel_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hotel-network

  reverb:
    build:
      context: .
      dockerfile: Dockerfile.reverb
    ports:
      - "8080:8080"
    networks:
      - hotel-network

volumes:
  postgres_data:

networks:
  hotel-network:
    driver: bridge
```

## Dockerfile (App)
- Base: `php:8.4-fpm-alpine`
- Instalar extensiones: pdo_pgsql, pgsql, gd, zip, exif, pcntl, bcmath
- Instalar Composer
- Instalar Node.js 20+ para build de React
- Copiar Laravel backend y React frontend
- Build del frontend: `npm run build`
- Nginx sirve el build de React en `/` y proxy a PHP-FPM en `/api`
- Script de entrypoint: `php artisan migrate --force && php artisan db:seed --force && php artisan reverb:start & nginx -g 'daemon off;'`

## Consideraciones de Red Local
- La PC maestra debe tener IP estática en la red local (ej: 192.168.1.100).
- Las PCs cliente acceden por `http://192.168.1.100`.
- El contenedor `app` escucha en 0.0.0.0:80.
- PostgreSQL NO expone puerto externo; solo accesible dentro de la red Docker.
- Windows: Docker Desktop con WSL2 backend. Activar "Start Docker Desktop when you log in".

## Backup dentro de Docker
- Cron job dentro del contenedor `app` (o script PHP ejecutado por scheduler de Laravel) a la hora configurada.
- Comando: `pg_dump` + `tar` de storage/app → ZIP en `/var/www/html/backup/`.
- El volumen `backup` se mapea a carpeta local del host (configurable en `.env`).
- Retención: eliminar archivos más antiguos que N días (configurable).

## Restauración
- Endpoint `/api/v1/backup/restore` recibe archivo ZIP.
- Proceso: descomprimir, restaurar BD con `psql`, restaurar archivos a storage/app.
- Requiere confirmación modal en frontend y validación de superadmin.

## Reglas Docker
1. Nunca exponer PostgreSQL al exterior (sin puerto mapeado o con IP restringida).
2. El contenedor debe ser auto-suficiente: al reiniciar la PC, Docker Desktop inicia y el contenedor `app` arranca automáticamente.
3. Usar volúmenes nombrados para persistencia de BD y backups.
4. El build del frontend debe hacerse en build time, no en runtime.
