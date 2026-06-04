<!--
Documents the backend API endpoints for health.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Health Endpoints

Endpoints for monitoring the API status.

## API Health Check
Returns the status of the API and its dependencies (database, etc.).

- **URL:** `/health`
- **Method:** `GET`
- **Auth required:** No

### Success Response
- **Code:** 200 OK
- **Content:** `{"status": "ok", "timestamp": "..."}`
