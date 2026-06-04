Etapa 1A — Docker Desktop en Windows
Qué hicimos: Instalado Docker Desktop con backend WSL2 en Windows.
Por qué: Docker permite ejecutar n8n y su base de datos PostgreSQL en contenedores aislados, idénticos a los que correrán en producción. Esto elimina el "en mi PC funciona" y reduce la migración futura a un VPS a copiar la carpeta del proyecto y ejecutar el mismo comando.
Verificación: docker run --rm hello-world debe imprimir el mensaje de bienvenida de Docker.
Comandos útiles:
powershelldocker --version            # Versión de Docker
docker compose version      # Versión de Docker Compose
docker ps                   # Contenedores corriendo
docker images               # Imágenes descargadas

Estructura final que tendrás
n8n-local/
├── docker-compose.yml      ← config de servicios
├── .env                    ← secretos (NO se sube a git)
├── .env.example            ← plantilla pública
├── .gitignore
├── README.md
└── data/                   ← se creará sola al arrancar Docker
    ├── postgres/
    └── n8n/

Etapa 1B — n8n + PostgreSQL en Docker
Qué hicimos: Levantado n8n con PostgreSQL en Docker Compose. n8n accesible en http://localhost:5678 con autenticación básica. Datos persistentes en ./data/ (bind mounts) para portabilidad.
Por qué Postgres y no SQLite: SQLite (la opción por defecto de n8n) es un fichero único, frágil ante corrupciones y sin migración limpia a producción. Postgres es el mismo motor que usarás en VPS, así que evitamos sorpresas al desplegar.
Por qué bind mounts (./data/) y no volúmenes con nombre: Los datos viven dentro de la carpeta del proyecto. Migrar a otro PC o al VPS = copiar la carpeta. Con volúmenes nombrados habría que hacer dump/restore manual.
Archivos:

docker-compose.yml: definición de servicios.
.env: valores sensibles (no se sube a git).
.env.example: plantilla pública.
data/postgres/: datos de la BBDD de n8n.
data/n8n/: ficheros internos de n8n.

Credenciales (guardar en gestor de contraseñas):

Basic auth del editor: admin / <la que pusiste>
Usuario interno de n8n: <el email/nombre que pusiste al entrar>
N8N_ENCRYPTION_KEY: imprescindible para recuperar credenciales en otra instalación.

Email *
superadmin@perreofc.com
First Name *
SuperAdmin
Last Name *
PerreoFC
Password *
Perreofc@2026


Etapa 1C — Conectividad n8n → backend
Qué hicimos: Verificamos que el contenedor de n8n puede alcanzar al host (tu Windows) usando la dirección host.docker.internal. Esta es la URL que n8n usará para llamar al backend Fastify cuando se ejecuten los workflows.
Por qué host.docker.internal y no ngrok: Tanto n8n como el backend viven en la misma máquina. No tiene sentido salir a internet con ngrok cuando hay una ruta directa interna. Más simple, más rápido, funciona offline.
URL que se usará en n8n: http://host.docker.internal:3000
El día de la migración a VPS: Esta URL desaparece. n8n y backend tendrán URLs propias, y n8n llamará al backend por la URL pública real (por ejemplo https://api.tudominio.com).

Etapa 2.5 — Modo asíncrono con cola en memoria
Problema detectado: El modo competitions-only tardaba 5 segundos (síncrono OK), pero calendars y full tardan 20-60 minutos. Mantenerlo síncrono hace que n8n bloquee la ejecución durante todo ese tiempo sin visibilidad ni recuperación.
Solución: Migración a patrón asíncrono con cola en memoria (Map<jobId, JobInfo>) y polling. El endpoint POST encola y responde en <100ms; un endpoint GET separado permite consultar el progreso paso a paso.
Decisiones de diseño:

Cola en memoria, no BullMQ/Redis: para un scrapeo semanal con un solo job activo a la vez, una cola externa sería sobre-ingeniería. Coste de mantenimiento mínimo.
Único job activo global: dos scrapeos concurrentes contra la misma BBDD podrían introducir condiciones de carrera. El endpoint POST responde 409 si ya hay uno corriendo.
TTL de 24h para jobs terminados: permite consultar resultados pasados sin saturar memoria.
Trade-off conocido: si el backend reinicia con un job en curso, ese job se pierde. Aceptable porque (1) los upserts son idempotentes (la BBDD no queda inconsistente, solo "parcialmente actualizada"), (2) la frecuencia es semanal, y (3) n8n detectará "jobId not found" en el siguiente poll y podrá relanzar.
Patrón estándar de la industria: job + polling es lo que usan AWS, Stripe, GitHub Actions, etc. para cualquier operación larga.

Endpoints resultantes:

POST /api/v1/internal/scrape/run → 202 con jobId, o 409 si ya hay uno activo.
GET /api/v1/internal/scrape/status/:jobId → 200 con estado, progreso y resultado.



Qué vamos a construir
┌──────────────────┐
│ Schedule Trigger │  Cada lunes a las 4:00 AM
│  (cron)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HTTP Request     │  POST /scrape/run
│ "Lanzar scrapeo" │  → recibe { jobId, status }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Wait             │  Esperar 1 minuto
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HTTP Request     │  GET /scrape/status/{{jobId}}
│ "Consultar"      │  → recibe { status, progress, ... }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ IF               │  ¿status == "running" o "queued"?
│ ¿sigue?          │
└──┬────────────┬──┘
   │ Sí         │ No (done o failed)
   │            │
   │ (vuelve    ▼
   │ a Wait)  ┌──────────────────┐
   │         │ IF                │  ¿status == "done"?
   │         └──┬────────────┬───┘
   │            │ Sí         │ No (failed)
   │            ▼            ▼
   │   ┌─────────────┐  ┌─────────────┐
   │   │ (opcional)  │  │ Notificar   │
   │   │ Notificar OK│  │ FALLO       │
   │   └─────────────┘  └─────────────┘

   Etapa 3A — Workflow mínimo en n8n
Qué hicimos: Workflow manual con tres nodos: Manual Trigger → HTTP POST /scrape/run → HTTP GET /scrape/status/:jobId. Demuestra conectividad bidireccional entre n8n (dentro de Docker) y backend (en el host), con autenticación por header.
Credencial creada: Backend Internal Token (tipo Header Auth, header X-Internal-Token).
Decisión clave: uso de host.docker.internal para llegar al backend desde dentro del contenedor de n8n; resuelto en Etapa 1C.

Etapa 3B — Polling automático con bucle
Qué hicimos: Añadido un bucle de polling al workflow: Wait (1 min) → GET /status → IF. El IF reenvía al Wait si el job sigue activo, o sale del bucle si terminó. Patrón estándar de polling en n8n.
Configuración relevante:

Wait: 1 minuto en producción, 15 segundos durante pruebas.
Expresión del jobId: $('POST scrape/run').item.json.jobId, accediendo al output de un nodo no inmediato.
Workflow timeout: 3600 segundos (1 hora) para cubrir el modo full.

Decisión: loop tradicional con conexión hacia atrás (no sub-workflow recursivo) por simplicidad y porque es el patrón más común.

