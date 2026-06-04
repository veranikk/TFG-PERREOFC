<!--
Documents the backend API endpoints for mvp votes.
It summarizes how clients should call the related routes and what responses to expect.
-->

# MVP Vote Endpoints

Endpoints related to voting for the Most Valuable Player of a match.

## Cast MVP Vote
Casts a vote for a player in a specific match.

- **URL:** `/mvp-votes`
- **Method:** `POST`
- **Auth required:** Yes

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matchId` | `number` | Yes | ID of the match. |
| `playerId` | `number` | Yes | ID of the player being voted for. |

---

## Get MVP Results
Returns the voting results for a specific match.

- **URL:** `/mvp-votes/:matchId`
- **Method:** `GET`
- **Auth required:** Yes
