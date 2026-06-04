<!--
Documents the backend API endpoints for classification.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Classification Endpoints

Endpoints related to league standings.

## Get Classification
Returns the current league table for a specific competition/season/group.

- **URL:** `/classification`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seasonId` | `number` | No | ID of the season. |
| `competitionId` | `number` | No | ID of the competition. |
| `groupId` | `number` | No | ID of the group. |

### Success Response
Returns a list of teams with their position, points, matches played, won, drawn, lost, goals for, and goals against.
