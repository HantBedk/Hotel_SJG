# Hotel Manager — Despliegue All-in-One

Modo alternativo que mete **todo** (Postgres + Nginx + PHP-FPM + Laravel Reverb + Scheduler + Frontend) en un único contenedor Docker.

> El setup multi-contenedor original (`docker-compose.yml`) sigue intacto. Este modo es independiente.

## Archivos

| Archivo | Función |
|---------|---------|
| `docker/Dockerfile.allinone` | Imagen única con Postgres + Nginx + PHP-FPM + Reverb |
| `docker/supervisord.allinone.conf` | Coordina los 5 procesos dentro del contenedor |
| `docker/entrypoint.allinone.sh` | Inicializa Postgres en el primer arranque, corre migraciones/seeders |
| `docker/compose/docker-compose.allinone.yml` | Compose con un único servicio |

## Cómo correrlo

```powershell
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml up -d --build
```

- **Web** → http://localhost
- **WebSocket** → ws://localhost:8080 (automático, el frontend lo apunta al mismo host)

Para detenerlo:

```powershell
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml down
```

## Persistencia

| Volumen | Qué guarda |
|---------|-----------|
| `hotel_pgdata` | Base de datos Postgres completa |
| `hotel_storage` | `storage/` de Laravel (logs, cache, comprobantes, `.app_key`, `.seeded`) |
| `${BACKUP_HOST_PATH:-./backup}` | Carpeta de backups visible desde el PC |

**NO borrar `hotel_pgdata`** o pierdes toda la base de datos. Si quieres reiniciar desde cero:

```powershell
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml down -v
```

## Variables de entorno

Las mismas del `.env` original. Las críticas:

- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` — solo importan en el **primer arranque** (cuando se crea el cluster). Después el cluster ya tiene esas credenciales.
- `APP_KEY` — si está vacía, el contenedor genera una y la persiste en `storage/.app_key`.

## Trade-offs vs. multi-contenedor

**Pros:**
- 1 sola imagen para distribuir.
- `up` único, sin orquestación.
- Más simple para demos / instalaciones en PC del cliente.

**Contras:**
- Antipatrón Docker (1 contenedor = varios procesos). Si Postgres falla, todo se reinicia.
- No puedes escalar partes independientes.
- Logs mezclados (supervisord redirige todo al stdout del contenedor).
- Backups de Postgres requieren `pg_dump` desde dentro del contenedor.

## Diferencias con el setup original

| Aspecto | Multi-contenedor | All-in-one |
|---------|------------------|------------|
| Servicios docker compose | `app` + `db` + `reverb` | `hotel` (uno solo) |
| `DB_HOST` | `db` | `127.0.0.1` (forzado en entrypoint) |
| `REVERB_HOST` env | `reverb` | `127.0.0.1` |
| Puertos expuestos | 80, 8080 | 80, 8080 |
| Postgres data | Volumen `postgres_data` | Volumen `hotel_pgdata` |

## Build & smoke test

```powershell
# Build
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml build

# Run
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml up -d

# Logs
docker compose --project-directory . -f docker/compose/docker-compose.allinone.yml logs -f

# Verificar que Postgres arrancó
docker exec hotel_all su-exec postgres pg_isready -U hotel_user -d hotel_sjg

# Verificar que Reverb escucha
docker exec hotel_all netstat -tnlp | grep 8080
```
