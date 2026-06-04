<!--
Documents the backend API endpoints for images.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Image Management Endpoints

Endpoints for managing images associated with players, staff members, and news articles. All operations require authentication; write operations require Admin or Superadmin role.

---

## Player Images

### List Player Images
Returns all non-deleted images for a player, ordered by most recent first.

- **URL:** `/players/:id/images`
- **Method:** `GET`
- **Auth required:** Yes

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Player ID |

#### Success Response `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "url": "https://...",
      "thumbnailUrl": null,
      "description": null,
      "isProfile": true,
      "takenAt": null,
      "uploadedBy": "uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Add Player Image
Inserts a new image record for a player.

- **URL:** `/players/:id/images`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Player ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Public URL of the image |
| `is_profile` | `boolean` | No | Set as profile image. Defaults to `false` |
| `description` | `string` | No | Optional description |
| `taken_at` | `string` | No | ISO datetime when the photo was taken |

#### Success Response `201`
```json
{
  "success": true,
  "data": { "id": "uuid", "url": "https://...", "isProfile": false, ... }
}
```

---

### Set Profile Image
Sets one image as the player's profile photo, resets all others to `is_profile=false`, and syncs `players.photo_url`.

- **URL:** `/players/:id/images/:imageId/set-profile`
- **Method:** `PATCH`
- **Auth required:** Yes (Admin/Superadmin)

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Player ID |
| `imageId` | `string (uuid)` | Image ID |

#### Success Response `200`
```json
{ "success": true, "data": null }
```

---

### Delete Player Image
Soft-deletes an image by setting `deleted_at`. The image is excluded from future GET requests.

- **URL:** `/players/:id/images/:imageId`
- **Method:** `DELETE`
- **Auth required:** Yes (Admin/Superadmin)

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Player ID |
| `imageId` | `string (uuid)` | Image ID |

#### Success Response `200`
```json
{ "success": true, "data": null }
```

---

## Staff Images

Same four endpoints as Player Images, but under `/staff/:id/images`.

### List Staff Images
- **URL:** `/staff/:id/images`
- **Method:** `GET`
- **Auth required:** Yes

### Add Staff Image
- **URL:** `/staff/:id/images`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)
- **Body:** Same as Add Player Image

### Set Staff Profile Image
Sets profile photo and syncs `staff_members.photo_url`.

- **URL:** `/staff/:id/images/:imageId/set-profile`
- **Method:** `PATCH`
- **Auth required:** Yes (Admin/Superadmin)

### Delete Staff Image
- **URL:** `/staff/:id/images/:imageId`
- **Method:** `DELETE`
- **Auth required:** Yes (Admin/Superadmin)

---

## News Image

### Set News Article Image
Updates the `image_url` field of a news article.

- **URL:** `/news/:id/image`
- **Method:** `POST`
- **Auth required:** Yes (Admin/Superadmin)

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Article ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Public URL of the image |

#### Success Response `200`
```json
{ "success": true, "data": { "imageUrl": "https://..." } }
```

---

### Clear News Article Image
Sets `image_url` to `null` on the news article.

- **URL:** `/news/:id/image`
- **Method:** `DELETE`
- **Auth required:** Yes (Admin/Superadmin)

#### Success Response `200`
```json
{ "success": true, "data": null }
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `400` | — | Invalid parameters or request body |
| `401` | `NO_TOKEN` / `INVALID_TOKEN` | Missing or invalid JWT |
| `403` | `FORBIDDEN` | Insufficient role permissions |
| `404` | — | Image not found or already deleted |
