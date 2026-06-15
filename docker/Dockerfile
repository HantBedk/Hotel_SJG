# ─────────────────────────────────────────────
# Stage 1: Build React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# VITE_* se hornean en el build. En VPS usar VITE_REVERB_PORT=0 para que el
# cliente WebSocket use el mismo origen (puerto 80/443) vía proxy nginx /app.
ARG VITE_REVERB_HOST=
ARG VITE_REVERB_PORT=0
ARG VITE_REVERB_SCHEME=
ARG VITE_REVERB_APP_KEY=hotel_reverb_key
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: PHP App + Nginx
# ─────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS app

# System deps + PHP extensions (una sola capa)
RUN apk add --no-cache \
    nginx \
    postgresql-client \
    libpq-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    zip \
    libzip-dev \
    unzip \
    curl \
    bash \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        exif \
        pcntl \
        bcmath \
        opcache

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# PHP config
COPY docker/php/local.ini /usr/local/etc/php/conf.d/local.ini

# Nginx config (plantilla; entrypoint genera http.d/default.conf)
COPY docker/nginx/default.conf /etc/nginx/templates/default.conf

# Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# Copy Laravel backend
WORKDIR /var/www/html
COPY backend/ .

# .env de ejemplo + dependencias PHP
RUN cp .env.example .env \
    && composer install --no-dev --optimize-autoloader --no-interaction

# Copy React build → public/app
COPY --from=frontend-builder /frontend/dist ./public/app
COPY --from=frontend-builder /frontend/dist/favicon.svg ./public/favicon.svg
COPY docker/nginx/spa-index.html ./public/index.html

# Directorios Laravel + carpeta de backups
RUN mkdir -p \
        storage/app/public \
        storage/app/comprobantes \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        /var/www/html/backup \
    && chown -R www-data:www-data storage bootstrap/cache /var/www/html/backup \
    && chmod -R 775 storage bootstrap/cache

# Entrypoint
COPY --chmod=+x docker/entrypoint.sh /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
