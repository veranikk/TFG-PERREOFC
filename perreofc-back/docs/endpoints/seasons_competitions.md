<!--
Documents the backend API endpoints for seasons competitions.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Seasons and Competitions Endpoints

Endpoints related to seasons and their associated competitions.

## List Seasons
Returns a list of all seasons.

- **URL:** `/seasons`
- **Method:** `GET`
- **Auth required:** No

---

## Get Season Detail
Returns a specific season by ID.

- **URL:** `/seasons/:id`
- **Method:** `GET`
- **Auth required:** No

---

## List Competitions for Season
Returns a list of competitions within a specific season.

- **URL:** `/seasons/:seasonId/competitions`
- **Method:** `GET`
- **Auth required:** No

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameTypeId` | `number` | No | Filter by game type (e.g. F7, F11). |

---

## Get Competition Detail
Returns detailed information about a competition.

- **URL:** `/competitions/:competitionId`
- **Method:** `GET`
- **Auth required:** No

---

## Get Competition Standings
Returns the standings (classification) for a competition.

- **URL:** `/competitions/:competitionId/standings`
- **Method:** `GET`
- **Auth required:** No

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roundNumber` | `number` | No | Filter by a specific round. |

---

## Get Competition Top Scorers
Returns the top goal scorers for a competition.

- **URL:** `/competitions/:competitionId/top-scorers`
- **Method:** `GET`
- **Auth required:** No

---

## Get Competition Disciplinary Stats
Returns yellow and red card rankings for a competition.

- **URL:** `/competitions/:competitionId/most-yellow-cards`
- **URL:** `/competitions/:competitionId/most-red-cards`
- **Method:** `GET`
- **Auth required:** No
