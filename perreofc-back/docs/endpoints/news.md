<!--
Documents the backend API endpoints for news.
It summarizes how clients should call the related routes and what responses to expect.
-->

# News Endpoints

Endpoints related to news and updates.

## List News
Returns a list of news articles.

- **URL:** `/news`
- **Method:** `GET`
- **Auth required:** Yes

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | `number` | No | Number of articles to return. |
| `page` | `number` | No | Page number. |

---

## Get News Detail
Returns a specific news article by ID.

- **URL:** `/news/:id`
- **Method:** `GET`
- **Auth required:** Yes

---

## Create News (Admin Only)
Creates a new news article.

- **URL:** `/news`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)

---

## Update News (Admin Only)
Updates an existing news article.

- **URL:** `/news/:id`
- **Method:** `PATCH`
- **Auth required:** Yes (Admin/Superadmin)

---

## Delete News (Superadmin Only)
Deletes a news article.

- **URL:** `/news/:id`
- **Method:** `DELETE`
- **Auth required:** Yes (Superadmin)
