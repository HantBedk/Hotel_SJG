# ─────────────────────────────────────────────
# Stage 1: Build React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: PHP App + Nginx
# ─────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS app

# System deps
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
    supervisor

# PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
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

# Nginx config
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# Copy Laravel backend
WORKDIR /var/www/html
COPY backend/ .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy React build → public/
COPY --from=frontend-builder /frontend/dist ./public/app
COPY docker/nginx/spa-index.html ./public/index.html

# Crear directorios que Laravel necesita (no depender de .gitkeep)
RUN mkdir -p \
        storage/app/public \
        storage/app/comprobantes \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Backup folder
RUN mkdir -p /var/www/html/backup && chown www-data:www-data /var/www/html/backup

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
