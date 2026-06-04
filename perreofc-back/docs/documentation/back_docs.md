<!--
Project documentation for the backend area: back docs.
It records setup, API or database notes that support development and deployment.
-->

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección 5)

# 4. Aplicar migraciones SQL en Supabase
# Ejecutar los ficheros de docs/sql/ en orden numérico desde el SQL Editor de Supabase

# 5. Generar tipos TypeScript desde el esquema de Supabase (requiere Supabase CLI)
pnpm run db:types

# 6. Arrancar en modo desarrollo con hot-reload
pnpm run dev

# 7. Build de producción
pnpm run build
pnpm run start
```

### Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Arranca con hot-reload. `tsx` ejecuta TypeScript directamente sin compilar, ideal para desarrollo. |
| `build` | `tsc` | Compila TypeScript a JavaScript en `dist/`. Necesario antes de desplegar en producción. |
| `start` | `node dist/server.js` | Ejecuta el servidor compilado. Requiere haber hecho `build` antes. |
| `typecheck` | `tsc --noEmit` | Comprueba tipos sin generar archivos. Útil en CI para detectar errores sin compilar. |
| `db:types` | `supabase gen types typescript` | Regenera `src/shared/types/database.ts` con los tipos exactos del esquema actual de Supabase. Ejecutar después de cada migración. |

---

## 5. Configuración y variables de entorno

**Archivo:** `src/shared/env.ts`

Todas las variables de entorno se validan con Zod al arrancar la aplicación. Si alguna variable obligatoria falta o tiene un formato incorrecto (por ejemplo, una URL malformada), el proceso falla inmediatamente con un mensaje descriptivo. Esto evita que la aplicación arranque en un estado inválido y falle más tarde de forma opaca.

El objeto `env` exportado está completamente tipado, por lo que el resto del código nunca accede a `process.env` directamente — siempre usa `env.NOMBRE_VARIABLE` con autocompletado y seguridad de tipos.

### `.env.example`

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

API_PORT=3000
NODE_ENV=development
# URL del frontend — obligatoria en producción para restringir CORS al origen correcto
# Ej: https://app.perreofc.com  |  En desarrollo se acepta cualquier origen automáticamente
FRONTEND_URL=

OWN_TEAM_ID=24141910

N8N_WEBHOOK_URL=http://localhost:5678/webhook/perreito-chatbot

GMAIL_USER=
GMAIL_APP_PASSWORD=
```

### Descripción de variables

| Variable | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `SUPABASE_URL` | URL | Sí | Endpoint del proyecto Supabase. Se encuentra en Settings → API del dashboard. |
| `SUPABASE_ANON_KEY` | string | Sí | Clave pública del proyecto. Es seguro incluirla en el cliente, pero en este proyecto solo se usa en el backend. |
| `SUPABASE_SERVICE_KEY` | string | Sí | Clave secreta de servicio con privilegios de superusuario. Nunca debe salir del servidor. |
| `API_PORT` | number | No (def: 3000) | Puerto en el que escucha el servidor HTTP. |
| `NODE_ENV` | enum | No (def: development) | Controla el formato de logs (`development` → pino-pretty coloreado, `production` → JSON) y el comportamiento de CORS. |
| `FRONTEND_URL` | URL | En producción | URL exacta del frontend para la restricción de CORS. Sin esta variable en producción, las peticiones cross-origin quedan bloqueadas. |
| `OWN_TEAM_ID` | number | No (def: 24141910) | ID del equipo principal en la base de datos. Se usa para filtrar datos propios del club. |
| `N8N_WEBHOOK_URL` | URL | Sí | URL del webhook del agente de chat en n8n. El backend le pasa el mensaje y el historial de sesión. |
| `GMAIL_USER` | email | Sí | Dirección Gmail desde la que se envían los emails transaccionales (PINs, alertas). |
| `GMAIL_APP_PASSWORD` | string | Sí | App Password de Google para autenticar Nodemailer. Es distinta a la contraseña de la cuenta de Google y se genera desde la configuración de seguridad de Google. |

---

## 6. Endpoints de la API

> **Base URL:** `http://localhost:3000/api/v1`  
> Los endpoints protegidos esperan la cabecera: `Authorization: Bearer <access_token>`

### 6.1 Health

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Devuelve `{ status: "ok" }`. Lo usan los load balancers para comprobar que la instancia está viva. |

---

### 6.2 Autenticación (`/auth`)

Gestiona todo el ciclo de vida de la sesión de un usuario: crear cuenta, iniciar sesión, recuperar acceso y cambiar credenciales.

| Método | Ruta | Auth | Rate limit | Descripción |
|---|---|---|---|---|
| POST | `/auth/login` | No | **10/min por IP** | Autentica con email y contraseña. Devuelve JWT de acceso + refresh token. |
| POST | `/auth/register` | No | **5/min por IP** | Crea una cuenta nueva de aficionado. Otorga 100 puntos de bienvenida. |
| POST | `/auth/forgot-password` | No | 3/email/h + 5/IP/15min | Solicita un OTP de recuperación por email. Responde siempre 200 aunque el email no exista, para evitar que se pueda usar el endpoint como detector de cuentas registradas. |
| POST | `/auth/reset-password` | Bearer (recovery) | — | Cambia la contraseña usando el token de recovery que Supabase envía en el email. |
| POST | `/auth/reset-password-otp` | No | — | Alternativa al anterior: cambia la contraseña verificando el OTP directamente. |
| POST | `/auth/verify-otp` | No | — | Verifica un OTP de cualquier tipo (signup, recovery, email_change). |
| POST | `/auth/refresh` | No | — | Renueva la sesión usando el refresh token. Devuelve un nuevo JWT de acceso. |
| POST | `/auth/change-password` | Bearer | 3 éxitos/24h, 5 fallos/1h | Cambia la contraseña verificando primero la contraseña actual. El rate limit se persiste en BD para funcionar en multi-instancia. |
| GET | `/auth/change-password/status` | Bearer | — | Devuelve cuántos intentos le quedan al usuario antes de que se bloquee el cambio de contraseña. |
| POST | `/auth/verify-password` | Bearer | — | Comprueba si una contraseña dada es la contraseña actual del usuario. Se usa en el frontend antes de flujos sensibles. |

**POST `/auth/login`** — Body y respuesta:
```json
// Body
{ "email": "user@example.com", "password": "P4ss!word" }

// 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "perreador99",
    "role": "aficionado",
    "points": 100,
    "banned": false
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}

// Posibles errores:
// 401 INVALID_CREDENTIALS — email o contraseña incorrectos
// 403 ACCOUNT_BANNED      — cuenta suspendida
// 429 RATE_LIMIT_EXCEEDED — demasiados intentos de login
```

---

### 6.3 Perfil propio (`/me`)

Permite al usuario autenticado ver y modificar su propia cuenta. Todos los endpoints requieren JWT válido.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/me` | Devuelve el perfil completo: datos personales, rol, puntos, avatar. |
| PATCH | `/me` | Actualiza campos editables: username, nombre, apellido, URL del avatar. |
| PATCH | `/me/password` | Cambia la contraseña. Requiere la contraseña actual como verificación. |
| GET | `/me/notifications/preferences` | Devuelve las preferencias de notificación del usuario (qué tipos quiere recibir). |
| PATCH | `/me/notifications/preferences` | Actualiza las preferencias de notificación. |
| GET | `/me/notifications/enabled` | Devuelve si las notificaciones push están activadas globalmente para este usuario. |
| PATCH | `/me/notifications/enabled` | Activa o desactiva globalmente las notificaciones push. |
| POST | `/me/push-token` | Registra el token de Expo Push del dispositivo actual para poder enviarle notificaciones push. |

---

### 6.4 Gestión de usuarios (`/users` y `/admin/users`)

Dos grupos de rutas con propósitos distintos: las de `/admin/users` son exclusivas para administradores y gestionan cualquier cuenta, mientras que las de `/users` permiten a cualquier usuario autenticado interactuar con su propia cuenta o ver perfiles públicos.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/admin/users` | admin | Lista todos los usuarios con paginación y filtros (búsqueda por nombre, email, rol, estado). |
| GET | `/admin/users/:userId` | admin | Detalle completo de un usuario, incluyendo el email (que no está en el perfil público). |
| POST | `/admin/users` | admin | Crea una cuenta con rol privilegiado (jugador, admin). El flujo normal de registro es solo para aficionados. |
| PUT | `/admin/users/:userId` | admin | Cambia el rol de un usuario. Un admin no puede asignar el rol superadmin; solo un superadmin puede hacerlo. Auditado en system_logs. |
| PATCH | `/admin/users/:userId/ban` | admin | Banea o desbanea una cuenta, con razón opcional. El usuario baneado recibe 403 en el próximo login. Auditado en system_logs. |
| PATCH | `/admin/users/:userId/points` | superadmin | Ajusta los puntos de un usuario con un delta positivo o negativo. Solo superadmin para evitar abusos. |
| DELETE | `/admin/users/:userId` | superadmin | Elimina permanentemente una cuenta de Supabase Auth y de public.users. Irreversible. Auditado en system_logs. |
| GET | `/admin/players/unlinked` | admin | Lista los jugadores del club que aún no tienen una cuenta de usuario vinculada. |
| GET | `/users/:userId` | Bearer | Perfil público de cualquier usuario: username, avatar, rol. Sin datos sensibles. |
| GET | `/users/:userId/stats` | Bearer | Estadísticas de apuestas del usuario: ganadas, perdidas, puntos ganados. |
| POST | `/users/me/delete-request` | Bearer | Inicia el flujo de eliminación de cuenta propia. Genera un PIN de 8 dígitos, lo envía por email y lo almacena hasheado con TTL de 15 minutos. |
| POST | `/users/me/delete-confirm` | Bearer | Confirma la eliminación con el PIN recibido. Si el hash coincide y no ha expirado, elimina la cuenta permanentemente. |
| GET | `/users/me/email-change/status` | Bearer | Muestra el estado del rate limit de cambio de email (intentos restantes, tiempo hasta reset). |
| POST | `/users/me/email-change/request` | Bearer | Inicia el flujo de cambio de email: verifica la contraseña actual, envía un PIN al nuevo email y una alerta al email actual. |
| POST | `/users/me/email-change/confirm` | Bearer | Confirma el cambio con el PIN. Si es válido, actualiza el email en Supabase Auth. |
| DELETE | `/users/me` | Bearer | Soft delete inmediato: marca la cuenta como eliminada en public.users sin verificación adicional. Flujo legacy, el flujo recomendado es delete-request/confirm. |

**Flujo de eliminación de cuenta (seguro):**
1. `POST /users/me/delete-request` → el backend genera un PIN de 8 dígitos con `crypto.randomInt()` (generador criptográficamente seguro), calcula su SHA-256, lo guarda en base de datos con TTL de 15 minutos, y envía el PIN en texto plano por email al usuario.
2. `POST /users/me/delete-confirm { pin }` → el backend calcula el SHA-256 del PIN recibido, lo compara con el hash almacenado, verifica que no ha expirado, y si todo es correcto elimina la cuenta de Supabase Auth y de public.users.

El PIN nunca se almacena en texto plano — solo su hash. Si alguien obtuviera acceso a la base de datos, no podría usar los hashes para eliminar cuentas.

**Flujo de cambio de email:**
1. `POST /users/me/email-change/request { newEmail, currentPassword }` → verifica que la contraseña actual es correcta, genera un PIN, lo envía al nuevo email como verificación y envía una alerta de seguridad al email actual.
2. `POST /users/me/email-change/confirm { pin }` → valida el hash y actualiza el email en Supabase Auth.

---

### 6.5 Notificaciones (`/notifications`)

Sistema de bandeja de entrada in-app. Las notificaciones se crean desde el backend (broadcasts de admin, eventos automáticos) y el usuario las lee y gestiona desde aquí.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/notifications` | Lista todas las notificaciones del usuario con paginación. |
| GET | `/notifications/unread` | Solo las notificaciones no leídas. |
| GET | `/notifications/unread-count` | Número de notificaciones no leídas. Se usa para mostrar el badge en la app. |
| PUT | `/notifications/:notificationId` | Marca una notificación como leída. |
| DELETE | `/notifications/:notificationId` | Soft delete: la oculta del buzón sin eliminarla físicamente de la BD. |
| POST | `/notifications/mark-all-read` | Marca todas las notificaciones del usuario como leídas de una vez. |
| POST | `/notifications/broadcast` | (admin) Envía una notificación a todos los usuarios de un segmento: `all`, `aficionados`, `jugadores`, o `admins`. Crea el registro in-app y también envía push si el usuario tiene token registrado y las notificaciones activadas. |

---

### 6.6 Apuestas (`/bets`)

Sistema de apuestas con puntos virtuales. Los usuarios apuestan al resultado de los partidos y ganan o pierden puntos según el resultado real.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/bets` | Crea una apuesta indicando el partido, la predicción (local/empate/visitante) y los puntos apostados. No se puede apostar a un partido que ya haya empezado. |
| GET | `/bets` | Lista mis apuestas con paginación. Filtro opcional por resultado (`pending`, `won`, `lost`). |
| GET | `/bets/statistics` | Estadísticas personales: total apostado, ganado, perdido, racha actual. |
| GET | `/bets/leaderboard` | Ranking de usuarios por puntos ganados en apuestas. |
| GET | `/bets/match/:matchId` | Mis apuestas para un partido concreto. |
| PATCH | `/bets/:betId` | Edita la predicción o la cantidad apostada. Solo si el partido no ha empezado. |
| DELETE | `/bets/:betId` | Cancela la apuesta y devuelve los puntos apostados. Solo si el partido no ha empezado. |
| POST | `/bets/settle/:matchId` | (admin) Liquida todas las apuestas de un partido. Llama al RPC `settle_match_bets` en PostgreSQL, que actualiza todos los resultados y los puntos en una única transacción atómica. |

---

### 6.7 Votación MVP (`/mvp-votes`)

Permite a los aficionados votar al mejor jugador de cada partido dentro de un plazo configurable.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/mvp-votes` | Emite un voto para el MVP de un partido, indicando el jugador. Solo se puede votar una vez por partido y dentro del plazo. |
| GET | `/mvp-votes/:matchId/result` | Resultados actuales: quién va ganando, distribución de votos por jugador. |
| GET | `/mvp-votes/:matchId/candidates` | Lista de jugadores que participaron en el partido y pueden ser votados. |
| POST | `/mvp-votes/:matchId/deadline` | (admin) Establece la fecha y hora límite para votar en un partido concreto. |

---

### 6.8 Puntos (`/points`)

Gestiona el sistema de puntos virtuales de gamificación.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/points/config` | Devuelve la configuración de recompensas: cuántos puntos da cada acción (registro, login diario, ganar apuesta, etc.). |
| GET | `/points/transactions` | Historial de transacciones de puntos del usuario: qué acción generó cada movimiento. |
| POST | `/points/daily-login` | Reclama el bonus de login diario. El backend verifica que no se haya reclamado ya hoy y añade los puntos correspondientes. |

---

### 6.9 Chat IA (`/chat`)

Proxy al agente de inteligencia artificial alojado en n8n. El backend se ocupa de mantener el estado de la sesión y pasar el historial al agente.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/chat/message` | Envía un mensaje al agente. El backend busca o crea una sesión activa, guarda el mensaje, recupera los últimos 6 mensajes como contexto y llama al webhook de n8n. Si n8n no responde en 30 segundos, devuelve 502. |
| GET | `/chat/session` | Devuelve la sesión de chat activa del usuario (id, fecha de inicio). |
| DELETE | `/chat/session` | Cierra la sesión actual. El próximo mensaje iniciará una sesión nueva sin historial. |

El timeout de 30 segundos existe porque los modelos de IA pueden tardar. Si se supera, el backend devuelve un error controlado en lugar de dejar la petición colgada indefinidamente.

---

### 6.10 Otros módulos

| Módulo | Ruta base | Descripción |
|---|---|---|
| Partidos | `/matches` | Listado de partidos, detalle, alineación titular, eventos del partido (goles, tarjetas) y estadísticas. Los datos los genera el scraper. |
| Clasificación | `/classification` | Tabla de posiciones de la liga con todos los equipos. |
| Top goleadores | `/top-scorers` | Ranking de jugadores por goles marcados en la temporada. |
| Leaderboard | `/leaderboard` | Rankings de usuarios por puntos: total histórico, semanal y mensual. |
| Eventos | `/events` | Eventos del equipo (entrenamientos, médicos, etc.). Solo visibles para jugadores y admins. |
| Noticias | `/news` | Artículos editoriales del club con categorías. |
| Home | `/home` | Endpoint agregado que devuelve los datos necesarios para la pantalla de inicio en una sola petición: próximo partido, últimas noticias, posición en clasificación. |
| Uploads | `/upload` | Subida de imágenes a Supabase Storage. Devuelve la URL pública del archivo subido. |
| Imágenes | `/images` | Gestión de imágenes ya subidas (listado, eliminación). |
| Convocatorias | `/squad-calls` | Convocatorias de partido: qué jugadores están citados para cada partido. |
| Álbumes | `/albums` | Álbumes de fotos del club. |
| Temporadas | `/seasons` | Datos de la temporada actual y anteriores. |
| Competiciones | `/competitions` | Competiciones en las que participa el club. |
| Grupos | `/groups` | Grupos dentro de una competición (para ligas con fase de grupos). |
| Equipos | `/teams` | Perfiles de los equipos rivales. |
| Jugadores | `/players` | Perfiles de los jugadores del club con estadísticas. |
| Logs admin | `/admin/logs` | Historial de acciones de auditoría del sistema. Solo accesible para superadmin. |

---

## 7. Autenticación y Autorización (AuthN/AuthZ)

### Cómo funciona el JWT

Supabase Auth genera tokens JWT firmados con RS256 (clave privada de Supabase, clave pública disponible via JWKS). El backend **verifica la firma criptográficamente** en cada petición usando la librería `jose` y el endpoint JWKS remoto de Supabase — nunca confía solo en el contenido del token.

```
1. POST /auth/login { email, password }
   └── supabase.auth.signInWithPassword()
   └── devuelve access_token (JWT RS256, 1h) + refresh_token

Peticiones siguientes:
2. Cliente envía: Authorization: Bearer <access_token>
3. requireAuth():
   ├── Extrae el token del header
   ├── jwtVerify(token, JWKS_remoto, { issuer, audience: 'authenticated' })
   │   └── Si la firma no es válida → 401 INVALID_TOKEN
   │   └── Si el token ha expirado → 401 TOKEN_EXPIRED
   ├── Consulta public.users con el id del token
   │   └── Si la cuenta está baneada → 403 ACCOUNT_BANNED
   │   └── Si la cuenta está eliminada → 401 ACCOUNT_DELETED
   └── Puebla req.user con { id, email, role, points, username, ... }
4. El handler recibe req.user completamente tipado y enriquecido
```

Cuando el access token expira (1 hora), el cliente usa el refresh token para obtener uno nuevo en `POST /auth/refresh`. El refresh token tiene una vida mucho más larga y se almacena de forma segura en el dispositivo.

### Sistema de roles

El rol de un usuario determina a qué endpoints puede acceder. El middleware `requireRole(...roles)` se aplica como `preHandler` en las rutas que lo necesitan.

| Rol | Quién lo tiene | Acceso adicional |
|---|---|---|
| `aficionado` | Usuarios normales registrados desde la app | Contenido público, apuestas, votos MVP, gestión de su perfil |
| `jugador` | Miembros del club que también tienen cuenta | Todo lo de aficionado + eventos del equipo y convocatorias |
| `admin` | Gestores del club | Todo lo anterior + gestión de contenido, usuarios, broadcasts |
| `superadmin` | Administrador técnico | Todo lo de admin + cambio de roles, eliminación de cuentas, logs de auditoría, ajuste de puntos |

**Por qué existe la separación admin/superadmin:** separa las tareas de gestión diaria del club (que puede hacer un admin) de las operaciones de alto riesgo e irreversibles (que solo puede hacer un superadmin). Un admin no puede borrar usuarios ni ver los logs de auditoría.

**Guard de escalada de privilegios:** el endpoint `PUT /admin/users/:userId` verifica explícitamente que quien hace la petición sea `superadmin` si intenta asignar el rol `superadmin`. Sin este guard, un admin podría auto-promoverse a superadmin.

### Verificación de contraseña para operaciones sensibles

Para cambiar contraseña, cambiar email o eliminar la cuenta, el backend verifica que el usuario conoce su contraseña actual. La verificación se hace llamando a `supabase.auth.signInWithPassword()` con el email real obtenido de la Admin API — no del JWT, que podría estar desactualizado si el email cambió recientemente.

---

## 8. Validación y contratos de datos

### Política de contraseñas — `src/shared/validators.ts`

La función `validatePassword()` es la **única fuente de verdad** para las reglas de contraseña. Está en un módulo compartido para que todas las partes de la aplicación apliquen exactamente las mismas reglas, sin posibilidad de que un punto de entrada sea más permisivo que otro.

```
Reglas de contraseña:
  ✓ Mínimo 8 caracteres
  ✓ Al menos 1 letra mayúscula (A-Z)
  ✓ Al menos 1 letra minúscula (a-z)
  ✓ Al menos 1 dígito (0-9)
  ✓ Al menos 1 carácter especial: !@#$%^&*
```

Se aplica en: registro (`authController`), reset de contraseña (`authController`), cambio de contraseña desde perfil (`meSchema` via Zod `superRefine`), y cambio de contraseña desde auth.

### Estrategia de validación

La mayoría de endpoints usan **Zod** para validar el body, query y params. El patrón es:

```typescript
const parsed = miSchema.safeParse(req.body);
if (!parsed.success) {
  return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
}
// A partir de aquí, parsed.data está tipado y validado
```

Los endpoints de auth usan **validación manual** en algunos casos porque permiten mensajes de error más específicos y personalizados que los que genera Zod automáticamente.

### Paginación estándar

Los endpoints que devuelven listas usan paginación basada en página y límite:

```
GET /endpoint?page=1&limit=20
```
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 9. Manejo de errores

### Clases de error personalizadas — `src/api/errors.ts`

En lugar de devolver respuestas de error directamente desde los servicios, se lanzan excepciones tipadas. Los controllers las capturan con `handleError()` y las convierten al código HTTP apropiado.

| Clase | HTTP | Cuándo usarla |
|---|---|---|
| `NotFoundError` | 404 | El recurso solicitado no existe (usuario, partido, apuesta...) |
| `ConflictError` | 409 | Ya existe algo que impide la operación (username duplicado, apuesta ya existente) |
| `BadRequestError` | 400 | El input es técnicamente válido pero infringe una regla de negocio (apostar a un partido ya terminado, etc.) |
| `ForbiddenError` | 403 | El usuario está autenticado pero no tiene permisos para esta operación concreta |

### Error handler global — `src/server.ts`

Fastify permite registrar un `setErrorHandler` que captura cualquier error no tratado en los handlers. Su función es doble:

1. **Loguear** el error completo con el stack trace y el id del usuario, para que se pueda investigar en los logs.
2. **Responder** al cliente con un mensaje genérico que no revele detalles internos de la implementación.

Para errores 4xx el mensaje es descriptivo (el cliente lo puede mostrar al usuario). Para errores 5xx el mensaje es siempre `"Internal server error"` — el detalle solo queda en los logs del servidor.

### Catálogo de códigos de error

| Código | HTTP | Descripción |
|---|---|---|
| `MISSING_FIELDS` | 400 | Campos obligatorios ausentes en el body |
| `PASSWORD_REQUIREMENTS` | 400 | La contraseña no cumple la política de seguridad |
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos |
| `NO_TOKEN` | 401 | Falta el header `Authorization` |
| `INVALID_TOKEN` | 401 | JWT malformado o con firma inválida |
| `TOKEN_EXPIRED` | 401 | JWT caducado — el cliente debe renovar con /auth/refresh |
| `ACCOUNT_DELETED` | 401 | La cuenta ha sido eliminada |
| `ACCOUNT_BANNED` | 403 | La cuenta está suspendida |
| `FORBIDDEN` | 403 | Rol insuficiente para esta operación |
| `RATE_LIMIT_EXCEEDED` | 429 | Se ha superado el límite de peticiones |
| `INTERNAL_ERROR` | 500 | Error interno no controlado |

---

## 10. Logging y monitorización

### Pino (Fastify integrado)

Fastify usa **Pino** como logger por defecto. Pino escribe logs en formato JSON estructurado, lo que permite indexarlos y buscarlos eficientemente en herramientas como Datadog, Logtail o cualquier agregador compatible con JSON.

| Entorno | Nivel | Formato |
|---|---|---|
| `development` | `debug` | Coloreado y legible con `pino-pretty`. Muestra cada request/response en la terminal. |
| `production` | `info` | JSON puro por stdout. Cada línea es un objeto JSON independiente. Los niveles debug no se emiten para reducir ruido. |

Los campos sensibles se **redactan automáticamente** antes de escribirse en el log: `req.headers.authorization` (para no loguear el JWT completo) y `body.password` (para no loguear contraseñas). Esto significa que aunque alguien acceda a los logs, no encontrará tokens ni contraseñas.

### Logger standalone — `src/shared/logger.ts`

Los servicios (como `usersServices.ts`, `mailer.ts` o `chatServices.ts`) no tienen acceso a `req.log` porque se ejecutan fuera del contexto de una request Fastify. Para estos casos existe una instancia de Pino standalone con la misma configuración que la del servidor.

Todos los módulos del proyecto usan este logger o `req.log`. No hay llamadas directas a `console.log`, `console.error` o similares en el código de producción. Esto garantiza que todos los logs pasan por Pino con el nivel y formato correcto.

### Logs de auditoría — tabla `system_logs`

Para operaciones críticas de administración, el backend registra quién hizo qué y cuándo en la tabla `system_logs` de PostgreSQL. Esto proporciona un rastro de auditoría independiente de los logs del servidor.

La función `logAction()` se llama después de que la operación principal haya tenido éxito. Está diseñada para **nunca lanzar excepciones** — si falla la escritura del log de auditoría, la operación principal no se revierte. Esto evita que un fallo al escribir un log bloquee, por ejemplo, el ban de un usuario.

| Acción | Cuándo se registra |
|---|---|
| `user.update_profile` | Un usuario actualiza su perfil |
| `user.change_password` | Un usuario cambia su contraseña |
| `user.ban` / `user.unban` | Un admin banea o desbanea una cuenta |
| `user.update_role` | Un admin cambia el rol de un usuario |
| `user.hard_delete` | Un superadmin elimina permanentemente una cuenta |
| `event.create` | Se crea un evento del equipo |
| `event.update` | Se modifica un evento del equipo |
| `event.delete` | Se elimina un evento del equipo |

---

## 11. Seguridad

### Cabeceras HTTP — `@fastify/helmet`

`@fastify/helmet` se registra al arrancar el servidor y añade automáticamente un conjunto de cabeceras HTTP de seguridad en todas las respuestas. Estas cabeceras instruyen al navegador (o al cliente HTTP) sobre cómo manejar el contenido de forma segura:

- **`X-Content-Type-Options: nosniff`** — impide que el navegador intente adivinar el tipo MIME de una respuesta. Sin esta cabecera, un atacante podría subir un archivo con extensión inocua pero contenido ejecutable.
- **`X-Frame-Options: SAMEORIGIN`** — previene que la aplicación se incruste en un `<iframe>` de otro dominio. Protege contra ataques de clickjacking.
- **`Strict-Transport-Security`** (HSTS) — le dice al navegador que solo acceda a este dominio por HTTPS, nunca por HTTP. Protege contra ataques de downgrade.
- **`X-DNS-Prefetch-Control`** — controla la precarga DNS del navegador, reduciendo filtraciones de información.

### CORS — `@fastify/cors`

CORS (Cross-Origin Resource Sharing) define qué orígenes pueden hacer peticiones a la API desde un navegador. Sin configuración adecuada, cualquier web maliciosa podría llamar a la API usando las cookies del usuario.

El comportamiento varía según el entorno:

- **Desarrollo** (`NODE_ENV=development`): acepta cualquier origen. Necesario para poder usar el frontend en `localhost:3001` mientras el backend está en `localhost:3000`.
- **Producción**: solo acepta el origen definido en `FRONTEND_URL`. Si la variable no está configurada, bloquea todas las peticiones cross-origin. Así se evita que webs de terceros llamen a la API de producción usando la sesión del usuario.

### Rate limiting — `@fastify/rate-limit`

El rate limiting limita cuántas peticiones puede hacer un cliente en un período de tiempo. Tiene dos propósitos: proteger contra ataques de fuerza bruta y proteger la disponibilidad del servidor.

El rate limit global (200 req/min por IP) protege contra abusos generales. Los límites más estrictos en login y registro protegen específicamente contra:

- **Fuerza bruta de contraseñas:** si un atacante prueba miles de contraseñas, será bloqueado tras 10 intentos por minuto.
- **Creación masiva de cuentas:** impide crear spam de cuentas automatizado.

| Ruta | Límite | Por qué este límite |
|---|---|---|
| Todas las rutas | 200 req/min por IP | Cota general contra abuso |
| `POST /auth/login` | 10 req/min por IP | Previene fuerza bruta de contraseñas |
| `POST /auth/register` | 5 req/min por IP | Previene creación masiva de cuentas spam |
| `POST /auth/forgot-password` | 3/email/h + 5/IP/15min | Persiste en BD — funciona en multi-instancia |
| `POST /auth/change-password` | 3 éxitos/24h + 5 fallos/1h | Persiste en BD — funciona en multi-instancia |

Los límites de las dos últimas rutas se almacenan en PostgreSQL en lugar de en memoria porque son operaciones críticas que deben respetarse aunque el proceso se reinicie o haya múltiples instancias del servidor.

### Control de acceso

**Autenticación:** cada petición a un endpoint protegido pasa por `requireAuth()`, que verifica la firma criptográfica del JWT contra el JWKS remoto de Supabase. Un JWT modificado o falsificado tiene una firma inválida y es rechazado con 401.

**Autorización:** `requireRole(...roles)` se aplica en las rutas que lo requieren. Si el rol del usuario no está en la lista permitida, la petición es rechazada con 403 antes de llegar al handler.

**Ownership:** para recursos propios del usuario (sus apuestas, sus notificaciones), los servicios filtran por `userId` del JWT. Un usuario no puede leer ni modificar los recursos de otro usuario aunque conozca el ID.

**Escalada de privilegios:** el endpoint de cambio de rol incluye una verificación explícita: si el rol a asignar es `superadmin`, el solicitante debe ser `superadmin`. Sin esta comprobación, un admin podría auto-promoverse.

### Criptografía

**JWT con RS256:** Supabase firma los tokens con su clave privada. El backend los verifica con la clave pública del JWKS. Esto es más seguro que un secreto compartido porque la clave privada nunca sale de Supabase.

**Generación de PINs con CSPRNG:** los PINs de 8 dígitos para confirmar eliminación de cuenta y cambio de email se generan con `crypto.randomInt()`, el generador de números aleatorios criptográficamente seguro de Node.js. Un generador no seguro como `Math.random()` es predecible si se conoce el estado interno, lo que permitiría a un atacante adivinar el PIN.

**Almacenamiento de PINs con SHA-256:** los PINs nunca se almacenan en texto plano en la base de datos, solo su hash SHA-256. Si alguien obtuviera acceso a la base de datos, los hashes no le servirían para confirmar la operación porque necesita el PIN original.

**`SUPABASE_SERVICE_KEY` exclusiva del servidor:** esta clave tiene privilegios de superusuario en la base de datos. Solo existe en el servidor, nunca en el cliente. Si se filtrara, un atacante tendría acceso total a todos los datos.

### Protección contra inyección

- El SDK de Supabase usa queries parametrizadas internamente — no hay concatenación de strings SQL en ningún punto del código.
- Todas las entradas externas (body, query, params) pasan por validación Zod antes de usarse.
- No hay uso de `child_process`, `eval` ni ejecución dinámica de código.

---

## 12. Limitaciones conocidas

Aspectos del código que funcionan pero que tienen margen de mejora o deuda técnica acumulada:

| # | Problema | Dónde | Solución recomendada |
|---|---|---|---|
| 1 | `getNotificationsTable()` es un workaround para esquivar tipos desactualizados | `notificationsServices.ts:7` | Regenerar `database.ts` con `pnpm run db:types` ejecutando la Supabase CLI correctamente |
| 2 | `as any` diseminado por el código para sortear tipos de BD obsoletos | Múltiples servicios | Regenerar los tipos periódicamente tras cada migración SQL |
| 3 | `listAllUsers` carga hasta 1000 cuentas de Supabase Auth en memoria para filtrar por email | `usersServices.ts:88` | Mover la columna email a `public.users` para poder hacer la búsqueda directamente en PostgreSQL |
| 4 | Variables `emailMatches` y `alreadyMatched` declaradas pero sin uso real | `usersServices.ts:134,142` | Limpiar el código residual de una implementación anterior |
| 5 | El plazo de votación MVP usa UTC+2 hardcodeado (horario de verano español) | `mvpVotesServices.ts:257` | En invierno (UTC+1) el cierre ocurre una hora antes de lo esperado. Usar una librería de timezone o al menos documentar la limitación visiblemente |
| 6 | RLS de Supabase no está activado en las tablas principales | Dashboard de Supabase | Activar RLS como segunda capa de defensa. Como el backend usa `service_role`, no afecta al funcionamiento actual, pero protegería si alguien accediera con `anon_key` |
| 7 | No hay documentación OpenAPI/Swagger | — | Añadir `@fastify/swagger` + `@fastify/swagger-ui` para documentación interactiva y generación automática de clientes |
| 8 | No existen tests | — | Añadir Vitest + `fastify.inject()` para tests de integración (ver sección 14) |
| 9 | No hay pipeline CI/CD | — | GitHub Actions con typecheck + audit en cada PR (ver sección 15) |

---

## 13. Dependencias y política de actualizaciones

### Dependencias de producción

| Paquete | Versión | Por qué se usa |
|---|---|---|
| `fastify` | ^5.8.5 | Framework HTTP principal. Más rápido que Express, sistema de plugins encapsulados, logger Pino integrado, soporte TypeScript de primera clase. |
| `@fastify/cors` | ^11.2.0 | Plugin oficial para gestionar CORS. Se configura una vez en el servidor y aplica a todas las rutas. |
| `@fastify/helmet` | ^13.0.2 | Plugin oficial para añadir cabeceras de seguridad HTTP. Basado en `helmet` de Express. |
| `@fastify/multipart` | ^9.0.1 | Soporte para recibir archivos en peticiones `multipart/form-data`. Necesario para las rutas de upload. |
| `@fastify/rate-limit` | ^10.3.0 | Plugin oficial de rate limiting para Fastify. Soporta límites globales y por ruta. |
| `@supabase/supabase-js` | ^2.46.1 | SDK oficial de Supabase. Proporciona acceso a Auth, PostgreSQL (via PostgREST) y Storage. |
| `jose` | ^6.2.3 | Librería para verificación de JWT y JWKS. Se usa para verificar los tokens de Supabase criptográficamente. |
| `zod` | ^3.23.8 | Librería de validación y parsing de esquemas con inferencia de tipos TypeScript. Se usa para variables de entorno y bodies de requests. |
| `nodemailer` | ^8.0.10 | Librería para envío de emails. Se configura con Gmail + App Password para enviar PINs y alertas. |
| `dotenv` | ^16.4.5 | Carga las variables del archivo `.env` en `process.env` al arrancar. |

### Dependencias de desarrollo

| Paquete | Versión | Por qué se usa |
|---|---|---|
| `typescript` | ^5.6.3 | El proyecto está escrito en TypeScript. Esta es la versión del compilador. |
| `tsx` | ^4.19.2 | Ejecuta archivos TypeScript directamente sin compilar. Se usa en `pnpm run dev` para hot-reload. |
| `pino-pretty` | ^13.1.3 | Formatea los logs JSON de Pino en un formato legible y coloreado para desarrollo. Solo se usa cuando `NODE_ENV=development`. |
| `@types/node` | ^22.9.0 | Tipos TypeScript para las APIs de Node.js (fs, crypto, process, etc.). |
| `@types/nodemailer` | ^8.0.0 | Tipos TypeScript para Nodemailer. |

### Política de actualizaciones

Las dependencias de seguridad (`@fastify/helmet`, `@fastify/rate-limit`, `jose`) deben actualizarse prioritariamente cuando se publican parches de seguridad.

1. Ejecutar `pnpm audit --audit-level=high` antes de cada release para detectar vulnerabilidades conocidas.
2. Configurar Dependabot o Renovate en GitHub para recibir PRs automáticos de actualizaciones de parches.
3. Commitear siempre `pnpm-lock.yaml` para que todos los entornos (local, CI, producción) usen exactamente las mismas versiones.
4. Al actualizar Fastify o `@supabase/supabase-js`, revisar el changelog antes de aplicar — ambas librerías tienen historial de breaking changes en versiones menores.

---

## 14. Testing

**No existen tests en el repositorio actualmente.**

La ausencia de tests es la mayor deuda técnica del proyecto. Sin tests es difícil modificar el código con confianza — cualquier refactor puede romper comportamiento existente sin que nadie lo detecte hasta producción.

### Framework recomendado: Vitest + `fastify.inject()`

**Por qué Vitest:** compatible con ESM de forma nativa, configuración mínima, API idéntica a Jest si ya se conoce. Es el estándar actual para proyectos TypeScript modernos.

**Por qué `fastify.inject()`:** permite enviar peticiones HTTP a la aplicación Fastify directamente en memoria, sin levantar un servidor TCP real. Las peticiones pasan por todo el lifecycle de Fastify (plugins, rate-limit, preHandlers, handlers) exactamente igual que en producción, pero sin overhead de red y sin necesidad de un puerto disponible.

```bash
pnpm add -D vitest @vitest/coverage-v8
```

```typescript
// tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { apiPlugin } from '../src/api/index.js';

describe('POST /api/v1/auth/login', () => {
  const app = Fastify();
  beforeAll(async () => { await app.register(apiPlugin, { prefix: '/api/v1' }); });
  afterAll(async () => { await app.close(); });

  it('devuelve 401 con credenciales incorrectas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      body: { email: 'noexiste@test.com', password: 'WrongPass1!' },
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).code).toBe('INVALID_CREDENTIALS');
  });

  it('devuelve 429 tras 10 intentos desde la misma IP', async () => {
    for (let i = 0; i < 10; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: { email: 'x@x.com', password: 'X' },
      });
    }
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      body: { email: 'x@x.com', password: 'X' },
    });
    expect(res.statusCode).toBe(429);
  });
});
```

### Áreas prioritarias de cobertura

| Área | Prioridad | Por qué |
|---|---|---|
| Auth flows + rate limits | Alta | Son la puerta de entrada; un bug aquí bloquea a todos los usuarios |
| `requireRole()` checks | Alta | Garantizan que las rutas admin no son accesibles por usuarios normales |
| Betting logic (crear / editar / cancelar / liquidar) | Alta | Implica transacciones de puntos — un bug puede generar puntos gratis o pérdidas incorrectas |
| Points system (daily login / bet win / MVP vote) | Media | Lógica de recompensas que afecta a todos los usuarios |
| Notifications (inbox / push / broadcast) | Media | Especialmente el broadcast, que afecta a muchos usuarios a la vez |
| Admin operations (ban / role / delete) | Media | Operaciones irreversibles que merecen tests de regresión |

---

## 15. Despliegue y CI/CD

**No existe pipeline CI/CD configurado en el repositorio.**

### GitHub Actions recomendado

Un pipeline básico debería ejecutarse en cada push a `main` o `develop` y en cada pull request. El objetivo mínimo es detectar errores de tipos y vulnerabilidades de dependencias antes de que lleguen a producción.

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck       # Detecta errores de tipos
      - run: pnpm audit --audit-level=high  # Detecta vulnerabilidades en dependencias
      # Cuando existan tests:
      # - run: pnpm test
```

### Consideraciones para producción

1. **Secretos:** usar el gestor de secrets de la plataforma de despliegue (Railway, Render, Fly.io...). Nunca poner secretos reales en archivos del repositorio.
2. **`FRONTEND_URL`:** configurar con la URL exacta del frontend. Sin esta variable el CORS en producción bloquea todas las peticiones del frontend.
3. **`NODE_ENV=production`:** activa los logs en formato JSON (en vez de pino-pretty), desactiva el nivel debug y ajusta otros comportamientos dependientes del entorno.
4. **HTTPS:** terminar TLS en el proxy inverso (Nginx, Caddy) o en el load balancer de la plataforma, no en Node.js directamente.
5. **Health check:** configurar el load balancer para hacer polling a `GET /health` y retirar instancias que no respondan.
6. **Logs:** redirigir stdout a un agregador de logs (Logtail, Datadog, etc.) para poder buscar y alertar sobre errores en producción.

---

## 16. Decisiones de diseño y roadmap

### Decisiones tomadas

**Supabase como BaaS completo**

Se eligió Supabase para concentrar Auth, base de datos PostgreSQL y Storage en una única plataforma. Esto elimina la necesidad de gestionar una base de datos propia, un servicio de autenticación separado y un bucket de almacenamiento. El trade-off es el vendor lock-in, que está controlado: el esquema completo está en `docs/sql/` y los datos se pueden exportar.

**Cliente admin bypasa RLS**

Toda la lógica de autorización está centralizada en el middleware y los servicios del backend, por lo que no se necesita RLS para el funcionamiento normal. Usar el cliente admin simplifica las queries (sin necesidad de policies de RLS para cada operación) a cambio de requerir más disciplina al escribir código nuevo — quien añada un endpoint debe asegurarse de aplicar los preHandlers correctos.

**Rate limiting en BD para operaciones sensibles**

Los rate limits de operaciones críticas (cambio de contraseña, reset, cambio de email) se persisten en PostgreSQL. La razón es que el rate limit en memoria se pierde al reiniciar el proceso o desplegar una nueva versión, y en un despliegue con múltiples instancias cada una tendría sus propios contadores. El rate limit en BD es más lento pero correcto en todos los escenarios de despliegue.

**Política de contraseñas en módulo compartido**

`src/shared/validators.ts` existe para que la política de contraseñas sea la misma en todos los puntos de entrada (registro, cambio de contraseña, reset). Sin este módulo, sería fácil que al modificar la política en un sitio se olvidara actualizar los demás, creando inconsistencias donde el login acepta contraseñas que el registro rechazaría.

**Chat IA via n8n como proxy**

La lógica de IA está completamente externalizada a n8n. El backend solo gestiona el historial de sesión y hace de proxy. Esto permite cambiar el modelo de IA, el proveedor o la lógica del agente en n8n sin tocar el backend. El timeout de 30 segundos en la petición a n8n evita que requests lentas de la IA bloqueen el servidor indefinidamente.

### Roadmap

| Área | Tarea |
|---|---|
| Testing | Añadir tests de integración con Vitest + `fastify.inject()` |
| CI/CD | GitHub Actions con typecheck + audit en cada PR |
| Tipos | Regenerar `database.ts` con `pnpm run db:types` tras instalar Supabase CLI |
| Seguridad | Activar RLS en tablas críticas de Supabase como segunda capa de defensa |
| Seguridad | Configurar `FRONTEND_URL` en el entorno de producción |
| Arquitectura | Mover el campo email a `public.users` para eliminar la carga de 1000 usuarios en memoria |
| Funcionalidad | Paginar la llamada a `listUsers` de Supabase Auth (límite actual: 1000 usuarios) |
| Documentación | Swagger/OpenAPI con `@fastify/swagger` para documentación interactiva de la API |
| Infraestructura | Entornos separados en Supabase (dev / staging / producción) |
