<!--
Documents the backend API endpoints for home.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Home Endpoints

Endpoints for the main dashboard view.

## Get Home Data
Returns a summary of data for the home screen, including upcoming matches, recent news, and top rankings.

- **URL:** `/home`
- **Method:** `GET`
- **Auth required:** Yes

### Success Response
Returns an object containing:
- `nextMatch`: The next scheduled match for the user's team or the league.
- `latestNews`: A list of recent news articles.
- `leaderboardPreview`: A snippet of the current rankings.
- `userPoints`: Current user's points.
