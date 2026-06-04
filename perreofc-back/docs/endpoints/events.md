<!--
Documents the backend API endpoints for events.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Event Endpoints

Endpoints related to social events or specific league events.

## List Events
Returns a list of upcoming and past events.

- **URL:** `/events`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Event Detail
Returns a specific event by ID.

- **URL:** `/events/:id`
- **Method:** `GET`
- **Auth required:** Yes

---

## Create Event (Admin Only)
Creates a new event.

- **URL:** `/events`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)

---

## Update Event (Admin Only)
Updates an existing event.

- **URL:** `/events/:id`
- **Method:** `PATCH`
- **Auth required:** Yes (Admin/Superadmin)

---

## Delete Event (Superadmin Only)
Deletes an event.

- **URL:** `/events/:id`
- **Method:** `DELETE`
- **Auth required:** Yes (Superadmin)
