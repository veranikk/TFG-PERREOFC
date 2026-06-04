# Container or runtime configuration for the scraper project: dockerfile.
# It describes how the scraper service is built, configured or launched.

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm@9.0.0

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY src ./src
COPY tsconfig.json ./

# Compilar TypeScript
RUN pnpm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de Playwright y herramientas necesarias
RUN apk add --no-cache \
    chromium \
    firefox \
    curl

# Instalar pnpm
RUN npm install -g pnpm@9.0.0

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando para iniciar la aplicación
CMD ["node", "dist/server.scrapers.js"]
