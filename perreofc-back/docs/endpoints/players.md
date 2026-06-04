<!--
Documents the backend API endpoints for players.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Player Endpoints

Endpoints related to players and their performance.

## Get Player Details
Returns basic information about a player.

- **URL:** `/players/:playerId`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Player Statistics
Returns detailed statistics for a player in a specific season (goals, cards, mvps, etc.).

- **URL:** `/players/:playerId/statistics`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seasonId` | `number` | No | ID of the season (defaults to current). |

---

## Get Player Matches
Returns matches where the player participated.

- **URL:** `/players/:playerId/matches`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `seasonId` | `number` | - | Filter by season. |
| `page` | `number` | 1 | Page number. |
| `limit` | `number` | 20 | Items per page. |
