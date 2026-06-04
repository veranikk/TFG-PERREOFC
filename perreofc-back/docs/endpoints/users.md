<!--
Documents the backend API endpoints for users.
It summarizes how clients should call the related routes and what responses to expect.
-->

# User Endpoints

Endpoints related to user profiles, statistics, and administration.

## Get Current User (Me)
Returns the profile of the currently authenticated user.

- **URL:** `/me`
- **Method:** `GET`
- **Auth required:** Yes

### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "avatarUrl": "...",
  "points": 150,
  "banned": false,
  "createdAt": "..."
}
```

### CURL
```bash
curl -X GET http://localhost:3000/me -H "Authorization: Bearer <TOKEN>"
```

---

## Update Profile
Updates current user's profile information.

- **URL:** `/me`
- **Method:** `PATCH`
- **Auth required:** Yes

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | `string` | No | New username. |
| `firstName` | `string` | No | New first name. |
| `lastName` | `string` | No | New last name. |
| `avatarUrl` | `string` | No | New avatar image URL. |

### Success Response
- **Code:** 200 OK
- **Content:** Updated user profile.

### CURL
```bash
curl -X PATCH http://localhost:3000/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Johnny"}'
```

---

## Change Password
Changes the current user's password.

- **URL:** `/me/password`
- **Method:** `PATCH`
- **Auth required:** Yes

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | `string` | Yes | Current password. |
| `newPassword` | `string` | Yes | New password. |

### Success Response
- **Code:** 200 OK
- **Content:** `{"message": "Contraseña actualizada"}`

---

## Get Notification Preferences
Returns notification settings for the current user.

- **URL:** `/me/notifications/preferences`
- **Method:** `GET`
- **Auth required:** Yes

---

## Update Notification Preferences
Updates notification settings.

- **URL:** `/me/notifications/preferences`
- **Method:** `PATCH`
- **Auth required:** Yes

---

## Get Public User Profile
Returns public information about any user.

- **URL:** `/users/:userId`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get User Stats
Returns betting statistics for a specific user.

- **URL:** `/users/:userId/stats`
- **Method:** `GET`
- **Auth required:** Yes

---

## Delete Account (Soft Delete)
Deletes the currently authenticated user's account.

- **URL:** `/users/me`
- **Method:** `DELETE`
- **Auth required:** Yes

---

# Admin Endpoints

## List Users
Lists all users with pagination and filtering.

- **URL:** `/admin/users`
- **Method:** `GET`
- **Auth required:** Yes (Admin/Superadmin)

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | 1 | Page number. |
| `limit` | `number` | 20 | Items per page. |
| `search` | `string` | - | Search by username or email. |
| `role` | `string` | - | Filter by role. |

---

## Update User Role
Changes a user's role.

- **URL:** `/admin/users/:userId`
- **Method:** `PUT`
- **Auth required:** Yes (Admin/Superadmin)

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | `string` | Yes | New role (`user`, `admin`, `superadmin`). |

---

## Hard Delete User
Permanently deletes a user from the system.

- **URL:** `/admin/users/:userId`
- **Method:** `DELETE`
- **Auth required:** Yes (Superadmin)
