<!--
Documentation for the scraper project: scraper docs.
It explains architecture, setup or operational details for maintaining scrapeo.
-->

### 3. Iniciar en modo desarrollo

```bash
pnpm dev
# equivalente: npx tsx watch src/server.scrapers.ts
```

El servidor arranca en `http://localhost:3001`.

### 4. Verificar que funciona

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

### 5. Lanzar un scrape completo

```bash
curl -X POST http://localhost:3001/internal/scrape/run \
  -H "Content-Type: application/json" \
  -H "x-internal-token: TU_TOKEN_AQUI" \
  -d '{
    "season_id": 21,
    "game_type_id": 1,
    "mode": "full",
    "only_active": true
  }'
# Respuesta: { "jobId": "abc-123", "status": "queued" }

# Consultar progreso
curl http://localhost:3001/internal/scrape/status/abc-123/progress \
  -H "x-internal-token: TU_TOKEN_AQUI"
```

### 6. Scrape de entidad individual (útil para tests)

```bash
# Scrape de equipo
curl -X POST http://localhost:3001/scrape/team/24141910

# Scrape de partido específico
curl -X POST http://localhost:3001/scrape/match/99999

# Scrape de clasificación
curl -X POST http://localhost:3001/scrape/standings \
  -H "Content-Type: application/json" \
  -d '{"competition_id": 24037579, "group_id": 24037584, "season_id": 21}'
```

### 7. Compilar para producción

```bash
pnpm build     # compila TypeScript → dist/
pnpm start     # ejecuta dist/server.scrapers.js
```

### 8. Docker

```bash
docker compose up -d
```

El `docker-compose.yaml` incluye `perreofc-scraper` y una instancia PostgreSQL local. Las variables de entorno se inyectan desde `.env`.

---

## 9. Seguridad operativa

### 9.1 Gestión de credenciales

#### SUPABASE_SERVICE_KEY

- Es la **service role key** que bypassa todas las Row Level Security (RLS) policies.
- **Nunca** debe exponerse en frontend, logs, trazas ni repositorios.
- En el código, el cliente se inicializa con `persistSession: false` y `autoRefreshToken: false` (backend-only).
- El comentario en `shared/supabase.ts` advierte explícitamente: _"USAR SOLO en backend (scrapers). NUNCA exponer al frontend."_

#### INTERNAL_TOKEN

- Protege todos los endpoints `/internal/*` mediante la cabecera `x-internal-token`.
- Generar con: `openssl rand -hex 32` (256 bits de entropía).
- El valor **nunca se loguea** — el guard solo registra el tipo del header (`string | undefined`).

#### Recomendaciones de gestión de secretos por entorno

| Entorno | Mecanismo recomendado |
|---------|----------------------|
| Desarrollo local | `.env` (nunca commitear — debe estar en `.gitignore`) |
| Docker/CI | Variables de entorno inyectadas por el orquestador |
| Producción | AWS Secrets Manager / HashiCorp Vault / K8s Secrets |

**Si se sospecha que hay credenciales expuestas:**
1. Revocar la `service_role` key en Supabase → Settings → API.
2. Generar un nuevo `INTERNAL_TOKEN`.
3. Actualizar el `.env` local y los secretos en producción.
4. Revisar los logs de acceso de Supabase en busca de actividad sospechosa.

### 9.2 Aislamiento de contextos Playwright

Cada operación usa un `BrowserContext` propio creado con `withContext()`:
- Cookies, localStorage y sessionStorage son **completamente independientes** entre runs.
- El contexto se cierra siempre en el bloque `finally`, aunque haya errores.
- Esto evita contaminación de sesiones entre scrapes concurrentes o consecutivos.

### 9.3 Seguridad en `page.evaluate()`

El scraper usa `page.evaluate()` exclusivamente con **código estático hardcodeado**:

```typescript
// Siempre así (CORRECTO — código estático, sin interpolación de variables externas):
const raw = await page.evaluate(() => {
  const el = document.getElementById('__NEXT_DATA__');
  return el?.textContent ? JSON.parse(el.textContent) : null;
});
```

Los IDs externos (`codacta`, `teamId`) se pasan como **parámetros de URL**, nunca se concatenan en el string de la función. No hay riesgo de inyección de código.

**Regla crítica para futuras modificaciones:** si se añade un `page.evaluate` que construya código desde variables externas (ej: `` page.evaluate(`return ${userInput}`) ``), sería una inyección de código. **Nunca hacer esto.**

### 9.4 Red y acceso

- El scraper accede únicamente a `https://www.rffm.es` y al endpoint de Supabase.
- No realiza autenticación en rffm.es — todos los datos son públicos.
- No persiste cookies entre sesiones.
- **CORS:** configurable via `CORS_ORIGIN` en `.env`. Si la variable está vacía, permite cualquier origen (útil en desarrollo). En producción, establecer con los dominios de n8n y servicios internos permitidos.

### 9.5 Endpoints peligrosos

| Endpoint | Riesgo | Mitigación actual |
|----------|--------|-------------------|
| `DELETE /internal/db/reset-scraped-data` | Elimina TODO el contenido scrapeado | `x-internal-token` + cabecera de confirmación explícita |
| `DELETE /internal/db/cleanup` | Elimina duplicados (operación destructiva) | `x-internal-token` |
| `POST /internal/scrape/run` | Lanza scrape masivo (carga BD y CPU) | `x-internal-token` + check de job activo (409 si hay otro corriendo) |

**Mejora recomendada:** añadir logging de auditoría en los endpoints DELETE (IP de origen, timestamp, usuario) para trazabilidad.

### 9.6 Aislamiento del proceso Chromium

El scraper visita páginas de rffm.es. Mitigaciones activas frente a contenido malicioso:

- **Chromium headless** tiene sandboxing de proceso habilitado por defecto.
- Los datos se extraen del JSON de `__NEXT_DATA__`, no se ejecutan como código.
- No se siguen enlaces externos ni se navega a URLs dinámicas construidas desde datos scrapeados.

Para mayor aislamiento en producción: ejecutar el contenedor Docker con `--cap-drop=ALL` y sin acceso a la red del host.

---

## 10. Troubleshooting

### Error: `__NEXT_DATA__ no encontrado en URL`

**Síntoma:** `Error: __NEXT_DATA__ no encontrado en https://www.rffm.es/...`

**Causas posibles:**
1. rffm.es devolvió una página de error (503, mantenimiento).
2. La URL de la página cambió (rffm.es reestructuró su sitio).
3. Next.js migró de SSR a CSR (ya no hay datos en `__NEXT_DATA__`).

**Diagnóstico:**
```bash
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://www.rffm.es/competicion/resultados-y-jornadas?temporada=21&tipojuego=1" \
  | grep "__NEXT_DATA__"
```

**Solución:**
- Si es temporal (503): reintentar más tarde.
- Si la URL cambió: actualizar la constante `BASE_URL` en el scraper correspondiente.
- Si Next.js migró: revisar si los datos están en un endpoint de API separado (`/api/competitions`).

---

### Error: `dropdown GRUPO no encontrado`

**Síntoma:** `scrapeGroupsForCompetition: dropdown GRUPO no encontrado (competicion=XXX)`

**Causas posibles:**
1. El overlay de cookies bloqueó el clic (`dismissConsentOverlay` falló).
2. rffm.es cambió la estructura de los filtros MUI (nuevo selector, orden distinto).
3. La competición no tiene grupos (copa con fase eliminatoria directa).

**Diagnóstico:** cambiar temporalmente a `headless: false` en `browser.ts` y observar el navegador durante el scrape.

**Solución:**
- Si es el overlay: verificar que `#qc-cmp2-container` sigue siendo el ID del CMP en rffm.es.
- Si es cambio de MUI: inspeccionar el nuevo selector con DevTools → Elements.
- Si no hay grupos: añadir manejo para competiciones sin selector de grupo.

---

### Timeout en `page.goto` (60s)

**Síntoma:** `TimeoutError: page.goto: Timeout 60000ms exceeded.`

**Diagnóstico:** verificar la latencia de rffm.es desde el servidor del scraper.

**Solución:**
- Aumentar el timeout en `browser.ts`: `ctx.setDefaultNavigationTimeout(90_000)`.
- Añadir reintentos (ver sección 5.3).

---

### El scrape no encuentra a Perreo FC en ningún grupo

**Síntoma:** Todos los grupos se skipean con `"Skipping group: target team not found in standings"`.

**Causas posibles:**
1. `OWN_TEAM_ID` incorrecto en `.env`.
2. Temporada recién comenzada — las standings aún tienen `estado !== '1'`.
3. El equipo no está inscrito en ninguna competición activa del `game_type_id` indicado.

**Solución:**
- Verificar `OWN_TEAM_ID` contra `https://www.rffm.es/fichaequipo/{id}`.
- Probar en modo `calendars` si las standings no están disponibles aún.
- Scrape manual de standings: `POST /scrape/standings` con los IDs correctos.

---

### Job en estado `running` que nunca termina

**Causa probable:** el proceso Chromium se colgó en una página.

**Solución:**
```bash
# Reiniciar el servidor (SIGTERM → graceful shutdown → closeBrowser)
kill -SIGTERM {PID_DEL_SERVIDOR}

# Verificar que no queden procesos Chromium zombi
pkill -f chromium
```

---

### Duplicados en `classification_entries` o `top_scorers`

**Solución:**
```bash
curl -X DELETE http://localhost:3001/internal/db/cleanup \
  -H "x-internal-token: TU_TOKEN"
```

---

### Error de upsert: violación de FK

**Síntoma:** `Error: Match: insert or update on table "matches" violates foreign key constraint`

**Causa típica:** el `team_id` del partido no existe en la tabla `teams`.

**Solución:** el `ensureTeamExists()` debería haberlo creado antes. Revisar si el scrape de equipo falló. Ejecutar manualmente:
```bash
curl -X POST http://localhost:3001/scrape/team/{team_id_que_falta}
```

---

## 11. Limitaciones conocidas

### Solo una temporada activa a la vez
El sistema requiere `season_id` como parámetro explícito en todos los endpoints. No hay detección automática de la temporada activa; es responsabilidad del caller (n8n) pasar el `season_id` correcto.

### Job store en memoria
El historial de jobs (scrapes anteriores, errores, duraciones) se pierde al reiniciar el servidor. No hay persistencia histórica de ejecuciones.

### Estimación de progreso imprecisa
El `matchesTotal` se estima como `grupos × 306`. Competiciones con diferente número de equipos mostrarán porcentajes incorrectos durante el scrape.

### Actas solo de partidos de Perreo FC
El calendario completo del grupo se guarda en `matches`, pero las actas detalladas (lineups, goles, tarjetas) solo se scrapean para partidos donde participa Perreo FC.

### Sin tests automatizados
El proyecto no tiene tests unitarios ni de integración. La validación se basa en TypeScript estricto + pruebas manuales contra la API.

### Singleton browser puede quedar en estado inconsistente
Si Chromium crashea durante un scrape, el singleton `_browser` en `lib/browser.ts` queda en mal estado. Los siguientes intentos fallan hasta reiniciar el servidor. No hay health check ni reconexión automática del browser.

---

*Documentación generada el 2026-06-03 mediante análisis completo del código fuente v0.1.0.*
