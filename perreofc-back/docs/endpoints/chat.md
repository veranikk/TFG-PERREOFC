<!--
Documents the backend API endpoints for chat.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Chat Endpoints

Endpoints para interactuar con el agente IA de Perreo FC (Perreito).

El sistema mantiene sesiones de chat por usuario. Si el usuario no tiene una sesión activa, se crea automáticamente. El historial de los últimos 20 mensajes se envía al agente en cada petición para mantener el contexto de la conversación.

---

## Enviar mensaje al agente

Envía un mensaje al agente IA y recibe su respuesta. Gestiona automáticamente la sesión de chat del usuario.

- **URL:** `/chat/message`
- **Method:** `POST`
- **Auth required:** Yes (Bearer Token)

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | Yes | Texto del mensaje. No puede estar vacío ni superar 1000 caracteres. |

### Success Response

- **Code:** 200 OK
- **Content:**
```json
{
  "session_id": "uuid-de-la-sesion",
  "message": {
    "id": "uuid-del-mensaje",
    "content": "Respuesta del agente IA",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Error Responses

| Code | Description | `code` |
|------|-------------|--------|
| 400 | Mensaje vacío | `EMPTY_MESSAGE` |
| 400 | Mensaje supera 1000 caracteres | `MESSAGE_TOO_LONG` |
| 401 | Token no proporcionado o inválido | `NO_TOKEN` / `INVALID_TOKEN` |
| 502 | El agente n8n no está disponible o tardó más de 15 s | `AGENT_UNAVAILABLE` |

### CURL

```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Quién es el máximo goleador esta temporada?"}'
```

---

## Notas de implementación

- **Sesión activa:** el endpoint busca una sesión con `is_active = true` para el usuario. Si no existe, crea una nueva automáticamente.
- **Historial:** se envían los últimos 20 mensajes de la sesión al agente para mantener contexto. El mensaje actual no se incluye en el historial (se envía por separado en el campo `message`).
- **Timeout:** si n8n no responde en 15 segundos (`AbortSignal.timeout(15000)`), se devuelve un error 502.
- **Variable de entorno:** `N8N_WEBHOOK_URL` debe apuntar al webhook de n8n (`http://localhost:5678/webhook-test/perreito-chatbot` en desarrollo).

### Payload enviado a n8n

```json
{
  "message": "mensaje actual del usuario",
  "user_rol": "aficionado|jugador|admin|superadmin",
  "user_id": "uuid-del-usuario",
  "session_id": "uuid-de-la-sesion",
  "history": [
    { "role": "user", "content": "mensaje previo del usuario" },
    { "role": "assistant", "content": "respuesta previa del agente" }
  ]
}
```

### Respuesta esperada de n8n

n8n responde con un array de items. El texto del agente se extrae de `body[0].output`:

```json
[
  {
    "output": "Texto de la respuesta del agente"
  }
]
```

### Tablas de base de datos

```
chat_sessions (id uuid PK, user_id uuid FK→users, started_at timestamptz, last_message_at timestamptz, is_active boolean)
chat_messages (id uuid PK, session_id uuid FK→chat_sessions, sender enum('user','assistant'), content text, created_at timestamptz)
```

### Archivos de implementación

| Archivo | Responsabilidad |
|---------|----------------|
| `src/api/features/chat/chatRoutes.ts` | Registro del endpoint, validación del body |
| `src/api/features/chat/chatServices.ts` | Lógica de negocio, llamada a n8n con timeout |
| `src/api/features/chat/chatRepository.ts` | Acceso a Supabase (sesiones y mensajes) |
| `src/api/features/chat/chatTypes.ts` | Tipos TypeScript derivados del schema de DB |
