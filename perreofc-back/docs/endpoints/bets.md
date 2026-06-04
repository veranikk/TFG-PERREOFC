<!--
Documents the backend API endpoints for bets.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Bet Endpoints

Endpoints related to match predictions and betting system.

## Place Bet
Creates a new bet for a match.

- **URL:** `/bets`
- **Method:** `POST`
- **Auth required:** Yes

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matchId` | `number` | Yes | ID of the match. |
| `prediction` | `string` | Yes | `home`, `draw`, or `away`. |
| `pointsWagered` | `number` | Yes | Amount of points to bet. |

---

## Get My Bets
Returns a list of bets placed by the current user.

- **URL:** `/bets`
- **Method:** `GET`
- **Auth required:** Yes

---

## Edit Bet
Updates an existing bet before the match starts.

- **URL:** `/bets/:betId`
- **Method:** `PUT`
- **Auth required:** Yes

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prediction` | `string` | Yes | `home`, `draw`, or `away`. |
| `pointsWagered` | `number` | Yes | New amount of points. |

---

## Cancel Bet
Deletes a bet before the match starts.

- **URL:** `/bets/:betId`
- **Method:** `DELETE`
- **Auth required:** Yes

---

## Settle Bets (Admin Only)
Manually triggers the settlement of bets for finished matches.

- **URL:** `/bets/settle`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)

---

## Get My Bet Statistics
Returns statistics about the current user's betting history.

- **URL:** `/users/me/bets/statistics`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Match Bets (Specific)
Returns the bets placed by the current user for a specific match.

- **URL:** `/matches/:matchId/bets`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Bets Leaderboard
Returns the ranking of users based on their betting success.

- **URL:** `/leaderboard/bets`
- **Method:** `GET`
- **Auth required:** Yes
