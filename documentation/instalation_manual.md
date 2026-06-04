# Manual de Instalación — PerreoFC

> **Para quién es este manual:** cualquier persona que quiera clonar el proyecto y ponerlo en marcha desde cero, sin conocimientos previos del sistema.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el proyecto](#2-clonar-el-proyecto)
3. [Configuración del entorno](#3-configuración-del-entorno)
   - 3.1 [⚠️ API Keys y credenciales (CRÍTICO — leer antes de nada)](#31-️-api-keys-y-credenciales-crítico--leer-antes-de-nada)
   - 3.2 [Supabase](#32-supabase)
   - 3.3 [Gmail (envío de correo)](#33-gmail-envío-de-correo)
   - 3.4 [Expo (frontend móvil)](#34-expo-frontend-móvil)
   - 3.5 [Rellenar el `.env` raíz](#35-rellenar-el-env-raíz)
4. [Base de datos (Supabase)](#4-base-de-datos-supabase)
5. [Levantar el stack completo con Docker](#5-levantar-el-stack-completo-con-docker)
6. [n8n — Workflows de automatización](#6-n8n--workflows-de-automatización)
7. [Scraper](#7-scraper)
8. [Frontend (Expo React Native)](#8-frontend-expo-react-native)
9. [Verificación del sistema](#9-verificación-del-sistema)
10. [Referencia rápida de puertos](#10-referencia-rápida-de-puertos)
11. [Solución de problemas frecuentes](#11-solución-de-problemas-frecuentes)

---

## 1. Requisitos previos

Instala las siguientes herramientas antes de continuar. Se indica la versión mínima recomendada.

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Git | 2.x | https://git-scm.com |
| Node.js | 20.x LTS | https://nodejs.org |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| Docker Compose | incluido en Docker Desktop | — |
| Expo Go (móvil) | última versión | App Store / Google Play |

### Verificar instalaciones

```bash
node --version        # debe mostrar v20.x.x
pnpm --version        # debe mostrar 9.x.x
docker --version      # debe mostrar 24.x o superior
docker compose version
```

> Si cualquiera de estos comandos falla, instala la herramienta antes de continuar.

---

## 2. Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd TFG-PERREOFC
```

### Estructura del monorepo

```
TFG-PERREOFC/
├── .env.example              ← plantilla maestra de variables de entorno
├── docker-compose.dev.yml    ← orquestación completa del stack
├── perreofc-back/            ← API backend (Fastify + TypeScript)
├── perreofc-front/           ← App móvil (Expo React Native)
├── TFG-PERREOFC-SCRAPEO/     ← Scraper web (Playwright)
├── n8n-local/                ← Motor de workflows + chat server
└── documentation/            ← Documentación del proyecto
```

---

## 3. Configuración del entorno

### 3.1 ⚠️ API Keys y credenciales (CRÍTICO — leer antes de nada)

> **ATENCIÓN: sin este paso la aplicación NO arranca.**

El proyecto **no incluye ninguna credencial preconfigurada**. Cada persona que instale el sistema debe crear sus propias cuentas y obtener sus propias claves. Esto afecta a:

| Servicio | Variable | Dónde obtenerla |
|---|---|---|
| Supabase (base de datos) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` | https://supabase.com → nuevo proyecto |
| Gmail (correo) | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Cuenta Gmail con 2FA activado → App Passwords |
| Expo (frontend) | `EXPO_TOKEN` | https://expo.dev → cuenta gratuita |

**Nunca compartas estas claves ni las subas al repositorio.** El archivo `.env` está en `.gitignore` exactamente por esto.

Ejemplo de lo que verás en `.env.example` (son solo placeholders, no funcionan):

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_KEY=<tu-service-key>
GMAIL_USER=<tu-cuenta-gmail>
GMAIL_APP_PASSWORD=<tu-app-password-de-gmail>
EXPO_TOKEN=<tu-expo-token>
```

---

### 3.2 Supabase

Supabase es la base de datos del proyecto (PostgreSQL gestionado en la nube).

**Pasos:**

- [ ] Entra en https://supabase.com y crea una cuenta gratuita.
- [ ] Crea un nuevo proyecto (elige cualquier nombre, región Europa recomendada).
- [ ] Espera a que el proyecto se provisione (1-2 minutos).
- [ ] Ve a **Project Settings → API** y copia los tres valores:
  - **Project URL** → `SUPABASE_URL`
  - **anon / public key** → `SUPABASE_ANON_KEY`
  - **service_role key** → `SUPABASE_SERVICE_KEY` *(trátala como una contraseña)*

---

### 3.3 Gmail (envío de correo)

El backend usa Gmail para enviar correos de verificación y notificaciones.

**Pasos:**

- [ ] Usa una cuenta Gmail existente o crea una nueva en https://gmail.com.
- [ ] Activa la **verificación en dos pasos** en la cuenta (requisito de Google para app passwords).
- [ ] Ve a **Cuenta de Google → Seguridad → Contraseñas de aplicaciones**.
- [ ] Genera una contraseña de aplicación para "Correo / Otro dispositivo".
- [ ] Copia la contraseña de 16 caracteres → `GMAIL_APP_PASSWORD`.
- [ ] El email de la cuenta → `GMAIL_USER`.

---

### 3.4 Expo (frontend móvil)

- [ ] Crea una cuenta gratuita en https://expo.dev.
- [ ] Ve a **Account Settings → Access Tokens**.
- [ ] Crea un nuevo token → `EXPO_TOKEN`.
- [ ] Instala **Expo Go** en tu móvil desde la App Store o Google Play.
- [ ] Asegúrate de que el móvil y el ordenador están en la **misma red WiFi**.
- [ ] Averigua la IP local de tu ordenador:
  - Windows: `ipconfig` → busca "IPv4" (ej. `192.168.1.50`)
  - Mac/Linux: `ifconfig` o `ip a`

---

### 3.5 Rellenar el `.env` raíz

- [ ] Copia la plantilla:

```bash
cp .env.example .env
```

- [ ] Abre `.env` con cualquier editor de texto y rellena **todos** los valores. Guía campo a campo:

```env
# ── Supabase ────────────────────────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...  (clave larga)
SUPABASE_SERVICE_KEY=eyJ... (clave larga, no la expongas)

# ── Backend ─────────────────────────────────────────────────────
API_PORT=3000
NODE_ENV=development
OWN_TEAM_ID=24141910         # ID del equipo en la RFFM (no cambiar)
GMAIL_USER=tu.correo@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
N8N_WEBHOOK_URL=http://n8n:5678/webhook/perreito-chatbot  # no cambiar

# ── Scraper ─────────────────────────────────────────────────────
SCRAPER_PORT=3001
INTERNAL_TOKEN=genera_un_token_aleatorio_largo_aqui  # ej: openssl rand -hex 32

# ── PostgreSQL (base de datos interna de n8n) ───────────────────
POSTGRES_USER=n8n
POSTGRES_PASSWORD=elige_una_contraseña_segura
POSTGRES_DB=n8n

# ── n8n ─────────────────────────────────────────────────────────
N8N_ENCRYPTION_KEY=genera_una_clave_aleatoria_de_32_chars_minimo
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=elige_una_contraseña_para_n8n
GENERIC_TIMEZONE=Europe/Madrid
TZ=Europe/Madrid
N8N_PORT=5678

# ── Chat server ─────────────────────────────────────────────────
CHAT_PORT=3002
N8N_CHAT_WEBHOOK_URL=http://n8n:5678/webhook/perreito-chatbot  # no cambiar

# ── Frontend ────────────────────────────────────────────────────
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1  # ← tu IP LAN aquí
LAN_IP=192.168.1.50                                   # ← tu IP LAN aquí
EXPO_TOKEN=tu_expo_token_aqui
```

> **Tokens aleatorios** para `INTERNAL_TOKEN` y `N8N_ENCRYPTION_KEY` puedes generarlos con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 4. Base de datos (Supabase)

El esquema de la base de datos se aplica mediante 39 scripts SQL secuenciales.

**Pasos:**

- [ ] Ve al panel de Supabase de tu proyecto: https://supabase.com/dashboard
- [ ] Abre **SQL Editor** (menú lateral izquierdo).
- [ ] Ejecuta los scripts en orden, uno a uno, desde la carpeta `perreofc-back/docs/sql/`:

```
001_initial_schema.sql
002_...
003_...
...hasta...
039_...
```

> **Importante:** ejecuta los scripts en orden numérico estricto. Saltarte uno o ejecutarlos desordenados causará errores de dependencias.

Para ejecutarlos de forma rápida desde el SQL Editor:
- [ ] Abre cada archivo con un editor de texto.
- [ ] Copia el contenido completo.
- [ ] Pégalo en el SQL Editor de Supabase y pulsa **Run**.
- [ ] Verifica que aparece "Success" o "No rows returned" (sin errores en rojo).

---

## 5. Levantar el stack completo con Docker

Una vez rellenado el `.env` y aplicadas las migraciones SQL, levanta todos los servicios con un solo comando desde la raíz del proyecto.

- [ ] Asegúrate de que Docker Desktop está abierto y en ejecución.
- [ ] Desde la carpeta raíz del proyecto:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Este comando:
1. Construye las imágenes Docker de backend, scraper, chat server y frontend.
2. Arranca PostgreSQL (para n8n).
3. Arranca n8n.
4. Arranca el chat server.
5. Arranca el scraper.
6. Arranca el backend.
7. Arranca el frontend (servidor Expo).

La primera vez tarda **5-10 minutos** porque descarga imágenes y construye las dependencias.

### Levantar en segundo plano (recomendado tras la primera vez)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Ver logs de un servicio específico

```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f scraper
docker compose -f docker-compose.dev.yml logs -f n8n
```

### Parar todos los servicios

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 6. n8n — Workflows de automatización

n8n gestiona los workflows del chatbot y las automatizaciones del sistema.

### Acceder al panel de n8n

- [ ] Abre el navegador y ve a: http://localhost:5678
- [ ] Inicia sesión con las credenciales que configuraste en `.env`:
  - Usuario: valor de `N8N_BASIC_AUTH_USER`
  - Contraseña: valor de `N8N_BASIC_AUTH_PASSWORD`

### Importar workflows

- [ ] En el panel de n8n, ve a la sección **Workflows**.
- [ ] Haz clic en **Import from file** (o el botón de importar).
- [ ] Importa los archivos de workflow que se encuentran en `n8n-local/` (archivos `.json` si los hay).
- [ ] Activa cada workflow importado con el interruptor **Active**.

### Configurar credenciales en n8n

Algunos workflows requieren credenciales externas (OpenAI, Gemini, etc.). Si el proyecto las usa:

- [ ] Ve a **Settings → Credentials** en n8n.
- [ ] Crea las credenciales necesarias según los nodos que uses en los workflows.

> **Nota:** las credenciales guardadas en n8n están cifradas con `N8N_ENCRYPTION_KEY`. Si cambias esta clave después de haber guardado credenciales, las perderás.

---

## 7. Scraper

El scraper extrae datos de la web de la RFFM (federación de fútbol) y los persiste en Supabase.

### Verificar que el scraper está activo

- [ ] Comprueba que el contenedor está corriendo:

```bash
docker compose -f docker-compose.dev.yml ps scraper
```

- [ ] Comprueba el endpoint de salud:

```
GET http://localhost:3001/health
```

Respuesta esperada: `{ "status": "ok" }`

### Ejecutar un scraping manual

El scraper expone endpoints REST. Para lanzar un scraping completo manualmente:

```bash
# Scraping de clasificación
curl http://localhost:3001/scrape/standings

# Scraping de un equipo por ID
curl http://localhost:3001/scrape/team/24141910

# Scraping de máximos goleadores
curl http://localhost:3001/scrape/top-scorers
```

### Endpoint interno (requiere token)

Para operaciones internas (llamadas desde backend o n8n):

```bash
curl -H "x-internal-token: <tu_INTERNAL_TOKEN>" \
     http://localhost:3001/internal/scrape/run
```

### Automatización vía n8n

El scraper está diseñado para ser invocado por los workflows de n8n en intervalos programados. Una vez importados y activados los workflows en n8n, el scraping se ejecutará automáticamente.

---

## 8. Frontend (Expo React Native)

El frontend es una aplicación React Native con Expo que funciona en Android, iOS y web.

### Opción A — Frontend dentro de Docker (configuración por defecto)

El frontend arranca automáticamente junto con el resto del stack en el paso 5. Busca en los logs la URL de Expo:

```bash
docker compose -f docker-compose.dev.yml logs -f frontend
```

Verás algo como:

```
› Metro waiting on exp://192.168.1.50:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

- [ ] Escanea el QR con la app **Expo Go** en tu móvil (Android) o con la cámara (iOS).
- [ ] La app se abrirá en tu móvil.

### Opción B — Frontend local (fuera de Docker)

Si prefieres ejecutar el frontend directamente en tu máquina para un hot-reload más rápido:

- [ ] Instala dependencias:

```bash
cd perreofc-front
pnpm install
```

- [ ] Crea el `.env` del frontend:

```bash
cp .env.example .env
```

- [ ] Edita `perreofc-front/.env` con tu IP LAN:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1
```

- [ ] Arranca el servidor de desarrollo:

```bash
pnpm start
```

- [ ] Escanea el QR con Expo Go.

### Abrir en navegador web

```bash
pnpm web
# o
pnpm start --web
```

---

## 9. Verificación del sistema

Tras levantar todo el stack, verifica que cada servicio responde correctamente.

### Checklist de verificación

- [ ] **PostgreSQL (n8n):** comprueba que el contenedor `postgres` está `healthy`:
  ```bash
  docker compose -f docker-compose.dev.yml ps
  ```

- [ ] **n8n:** abre http://localhost:5678 → debe mostrar el panel de login.

- [ ] **Backend API:**
  ```bash
  curl http://localhost:3000/api/v1/health
  ```
  Respuesta esperada: `{ "status": "ok" }`

- [ ] **Scraper:**
  ```bash
  curl http://localhost:3001/health
  ```
  Respuesta esperada: `{ "status": "ok" }`

- [ ] **Chat server:**
  ```bash
  curl http://localhost:3002/health
  ```

- [ ] **Frontend:** QR visible en los logs de Expo / app cargando en el móvil.

- [ ] **Supabase:** ve al panel de Supabase → Table Editor → comprueba que existen las tablas (`teams`, `users`, `matches`, etc.).

### Orden correcto de arranque

Los servicios tienen dependencias entre sí. Docker Compose las gestiona automáticamente, pero si arrancas servicios manualmente, el orden correcto es:

```
1. PostgreSQL
2. n8n (depende de PostgreSQL)
3. Chat server (depende de n8n)
4. Scraper (independiente)
5. Backend (depende de n8n y scraper)
6. Frontend (depende de backend)
```

---

## 10. Referencia rápida de puertos

| Servicio | Puerto local | URL |
|---|---|---|
| Backend API | 3000 | http://localhost:3000 |
| Scraper | 3001 | http://localhost:3001 |
| Chat server | 3002 | http://localhost:3002 |
| n8n editor | 5678 | http://localhost:5678 |
| Expo Metro bundler | 8081 | http://localhost:8081 |
| Expo DevTools | 19000 | http://localhost:19000 |
| PostgreSQL (interno) | 5432 | solo accesible dentro de Docker |

---

## 11. Solución de problemas frecuentes

### "Error: Cannot find module" o dependencias no encontradas

```bash
# Reconstruye los contenedores borrando la caché
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

### El backend no conecta con Supabase

- Verifica que `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_KEY` en `.env` sean correctos.
- Comprueba que el proyecto de Supabase está activo en https://supabase.com/dashboard.

### El móvil no carga la app (Expo)

- Verifica que el móvil y el ordenador están en la **misma red WiFi**.
- Comprueba que `EXPO_PUBLIC_API_URL` en `.env` tiene la IP LAN correcta de tu máquina.
- Ejecuta `ipconfig` (Windows) o `ifconfig` (Mac/Linux) para confirmar tu IP.

### n8n no arranca o muestra errores de base de datos

- Verifica que `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` en `.env` sean correctos.
- Comprueba que el contenedor `postgres` está `healthy` antes de que n8n intente conectar:
  ```bash
  docker compose -f docker-compose.dev.yml ps postgres
  ```

### El scraper devuelve errores de Playwright

- El contenedor del scraper instala Chromium en el build. Si ves errores de navegador, reconstruye la imagen:
  ```bash
  docker compose -f docker-compose.dev.yml build scraper
  ```

### Los cambios en el código no se reflejan

El stack está configurado con hot-reload mediante volúmenes de Docker. Si los cambios no se aplican:

```bash
# Reinicia solo el servicio afectado
docker compose -f docker-compose.dev.yml restart backend
# o
docker compose -f docker-compose.dev.yml restart frontend
```

### Ver todos los logs en tiempo real

```bash
docker compose -f docker-compose.dev.yml logs -f
```

---

> **Recuerda:** si compartes el proyecto con otra persona, **nunca incluyas el archivo `.env`** en el repositorio. Cada instalador debe crear sus propias credenciales siguiendo la sección [3.1](#31-️-api-keys-y-credenciales-crítico--leer-antes-de-nada) de este manual.
