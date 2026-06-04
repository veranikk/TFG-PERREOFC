<!--
Documentation for the scraper project: architecture.
It explains architecture, setup or operational details for maintaining scrapeo.
-->

# Type checking: verifica tipos sin compilar
pnpm typecheck

# Build: compila TypeScript a JavaScript
pnpm build

# Producción: ejecuta JavaScript compilado
pnpm start
```

## Características

### Rutas públicas (`/scrape/*`)
- `POST /scrape/team/:id` - Scrape de equipo
- `POST /scrape/match/:codacta` - Scrape de partido
- `POST /scrape/standings` - Scrape de clasificación
- `POST /scrape/player/:id` - Scrape de jugador
- `POST /scrape/top-scorers` - Scrape de máximos goleadores
- `GET /health` - Health check

### Rutas internas (`/internal/*`) - Requieren header `x-internal-token`
- `POST /internal/scrape/run` - Lanza un job de scrape completo
- `GET /internal/scrape/status/:jobId` - Obtiene el estado de un job

### CORS
- Habilitado para cualquier origen
- Soporta credenciales

### Validación
- Esquemas Zod para entrada de datos
- Manejo de errores centralizado

### Graceful shutdown
- Cierra navegador de Playwright
- Cierra conexión a Fastify
- Maneja SIGINT y SIGTERM

## Migraciones realizadas

1. ✅ Cambio a `pnpm` como package manager
2. ✅ Renombrar `server.ts` → `server.scrapers.ts`
3. ✅ Crear estructura `api/routes/` para rutas
4. ✅ Separar rutas públicas e internas
5. ✅ Refactorizar servidor para usar composición de rutas
6. ✅ Mantener TypeScript + tsx para desarrollo
7. ✅ Compilación a JavaScript para producción
