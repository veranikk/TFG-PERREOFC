<!--
Documents the backend API endpoints for points.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Points Endpoints

Endpoints related to user points, rewards, and history.

## Get Points Configuration
Returns the system configuration for points (how many points are awarded for each action).

- **URL:** `/points/config`
- **Method:** `GET`
- **Auth required:** Yes

---

## Claim Daily Login Bonus
Awards points to the user for their daily login. Can only be claimed once every 24 hours.

- **URL:** `/me/daily-login`
- **Method:** `POST`
- **Auth required:** Yes (Role: `aficionado`)

### Success Response
- **Code:** 200 OK
- **Content:** `{"message": "Bonus reclamado correctamente", "pointsAwarded": 10, "newTotal": 110}`

### Error Responses
- **Code:** 409 Conflict (Already claimed today)
- **Code:** 403 Forbidden (If user is not `aficionado`)

---

## Get Points History
Returns a history of point transactions for the current user.

- **URL:** `/me/points`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | `number` | No | Number of transactions to return. |
| `page` | `number` | No | Page number. |
