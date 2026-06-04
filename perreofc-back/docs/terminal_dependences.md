<!--
Project documentation for the backend area: terminal dependences.
It records setup, API or database notes that support development and deployment.
-->

# Comandos para arrancar el proyecto desde cero

Estos pasos estan pensados para Windows con PowerShell, despues de clonar el repositorio.

## 1. Instalar Node.js

Instala Node.js LTS desde:

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierra y vuelve a abrir la terminal. Comprueba que se instalo bien:

```powershell
node -v
npm -v
```

## 2. Activar pnpm

El proyecto usa `pnpm`, porque existe `pnpm-lock.yaml`.

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

Si `corepack` no funciona, instalalo con npm:

```powershell
npm install -g pnpm
pnpm -v
```

## 3. Entrar en la carpeta del proyecto

```powershell
cd C:\Users\veram\Desktop\TFG\TFG-PERREOFC-BACK
```

## 4. Instalar dependencias del proyecto

```powershell
pnpm install
```

## 5. Instalar los navegadores de Playwright

El backend usa Playwright para hacer scraping con Chromium.

```powershell
pnpm exec playwright install
```

Si Playwright pide dependencias del sistema, ejecuta tambien:

```powershell
pnpm exec playwright install --with-deps
```

## 6. Crear y rellenar el archivo .env

Si `.env` esta vacio, copia el ejemplo:

```powershell
Copy-Item .env.example .env
```

Despues abre `.env` y rellena las claves de Supabase:

```env
SUPABASE_URL=https://sbgqqnvgywxpemqhiaxa.supabase.co
SUPABASE_ANON_KEY=pon_aqui_la_anon_key (publishable_key)
SUPABASE_SERVICE_KEY=pon_aqui_la_service_key (secret_key)
SCRAPER_PORT=3001
API_PORT=3000
NODE_ENV=development
```

Importante: `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_KEY` no pueden estar vacias, porque el proyecto valida esas variables al arrancar.

## 7. Comprobar TypeScript

```powershell
pnpm run typecheck
```

## 8. Arrancar el servidor

```powershell
pnpm run dev:scrapers
```

El servidor queda levantado en:

```text
http://localhost:3001
```

Puedes comprobar que funciona con:

```powershell
Invoke-RestMethod http://localhost:3001/health
```

Tambien existen rutas publicas bajo:

```text
http://localhost:3001/api/v1
```

## Nota sobre dev:api

En `package.json` existe este script:

```powershell
pnpm run dev:api
```

Pero ahora mismo apunta a `src/server.api.ts`, y ese archivo no existe en el repositorio. Por eso, para ejecutar el backend actualmente hay que usar:

```powershell
pnpm run dev:scrapers
```
