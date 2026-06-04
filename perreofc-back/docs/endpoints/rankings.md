<!--
Documents the backend API endpoints for rankings.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Ranking Endpoints

Endpoints related to user rankings and leaderboards.

## Leaderboard

Returns the ranking of **aficionado** users by points. Users with 0 points are excluded.
The current authenticated user is always included at the end if not in the top results (only if their role is `aficionado`).

- **URL:** `/leaderboard`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type     | Required | Default | Description |
|-----------|----------|----------|---------|-------------|
| `period`  | `string` | No       | `total` | `total` \| `monthly` \| `weekly` |
| `limit`   | `number` | No       | `50`    | Max users to return (1–100) |

### Period behaviour
| Period    | Data source | Range |
|-----------|-------------|-------|
| `total`   | `users.points` | All time |
| `monthly` | `points_transactions` aggregated | From 1st of current month |
| `weekly`  | `points_transactions` aggregated | From Monday of current week |

For `monthly` and `weekly`, only users with at least one positive transaction in the period appear. For all periods, only non-banned, non-deleted aficionados are included.

### Response `200 OK`
```json
{
  "period": "total",
  "data": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "pepe_aficion",
      "avatarUrl": null,
      "points": 4200,
      "isCurrentUser": false
    }
  ]
}
```
