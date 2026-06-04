<!--
Documents the backend API endpoints for matches.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Match Endpoints

Endpoints related to match data, lineups, and events.

## Get Match Details
Returns detailed information about a match, including basic stats and status.

- **URL:** `/matches/:matchId`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Match Lineups
Returns the starting lineups and substitutes for both teams.

- **URL:** `/matches/:matchId/lineups`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Match Events
Returns a chronological list of events during the match (goals, cards, substitutions).

- **URL:** `/matches/:matchId/events`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Match Statistics
Returns detailed technical statistics (possession, shots, etc.) for a match.

- **URL:** `/matches/:matchId/stats`
- **Method:** `GET`
- **Auth required:** Yes
