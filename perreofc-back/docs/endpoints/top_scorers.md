<!--
Documents the backend API endpoints for top scorers.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Top Scorers Endpoints

Endpoints related to player goals rankings.

## Get Top Scorers
Returns the list of players with the most goals in a specific competition/season/group.

- **URL:** `/top-scorers`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seasonId` | `number` | No | ID of the season. |
| `competitionId` | `number` | No | ID of the competition. |
| `groupId` | `number` | No | ID of the group. |
| `limit` | `number` | No | Max number of players to return. |
