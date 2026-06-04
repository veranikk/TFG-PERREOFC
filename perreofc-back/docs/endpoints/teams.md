<!--
Documents the backend API endpoints for teams.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Team Endpoints

Endpoints related to teams and their data.

## Get Team Details
Returns detailed information about a specific team.

- **URL:** `/teams/:teamId`
- **Method:** `GET`
- **Auth required:** Yes

### Parameters
- `teamId` (Path): ID of the team.

---

## Get Team Squad
Returns the list of players currently in the team's squad.

- **URL:** `/teams/:teamId/squad`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Team Matches
Returns a paginated list of matches for the team.

- **URL:** `/teams/:teamId/matches`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | 1 | Page number. |
| `limit` | `number` | 20 | Items per page (max 100). |
| `seasonId` | `number` | - | Filter by season. |

---

## Get Team Statistics
Returns statistical data for the team in a given season.

- **URL:** `/teams/:teamId/statistics`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seasonId` | `number` | No | ID of the season (defaults to current). |
