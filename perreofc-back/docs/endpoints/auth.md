<!--
Documents the backend API endpoints for auth.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Auth Endpoints

Endpoints related to user authentication and session management.

## Login
Authenticates a user and returns a JWT session.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth required:** No

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address. |
| `password` | `string` | Yes | User's password. |

### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "avatarUrl": "https://...",
    "points": 0,
    "banned": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "...",
    "user": { ... }
  }
}
```

### Error Responses
- **Code:** 400 Bad Request (Missing fields)
- **Code:** 401 Unauthorized (Invalid credentials or profile not found)

### CURL
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

## Register
Registers a new user in the system.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth required:** No

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address. |
| `password` | `string` | Yes | User's password (min 6 chars). |
| `username` | `string` | Yes | Unique username. |
| `firstName` | `string` | No | User's first name. |
| `lastName` | `string` | No | User's last name. |

### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "user": { ... },
  "session": { ... },
  "message": "Usuario registrado exitosamente"
}
```

### Error Responses
- **Code:** 400 Bad Request (Invalid fields or registration failed)

### CURL
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "username": "newuser",
    "firstName": "New",
    "lastName": "User"
  }'
```

---

## Forgot Password
Sends a password reset email to the user.

- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Auth required:** No

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address. |
| `redirectTo` | `string` | No | URL to redirect after clicking the link. |

### Success Response
- **Code:** 200 OK
- **Content:** `{"message": "Correo de recuperación enviado si el usuario existe."}`

### Error Responses
- **Code:** 400 Bad Request

### CURL
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## Reset Password
Updates the password for the currently authenticated user (usually via a recovery token).

- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Auth required:** Yes (Bearer Token)

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | `string` | Yes | New password. |

### Success Response
- **Code:** 200 OK
- **Content:** `{"message": "Contraseña actualizada correctamente"}`

### Error Responses
- **Code:** 400 Bad Request
- **Code:** 401 Unauthorized

### CURL
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"password": "newpassword123"}'
```
