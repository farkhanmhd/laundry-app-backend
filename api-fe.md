# API Integration for Assets & Drivers

## Base URL

```
{{NEXT_PUBLIC_API_URL}}
```

All endpoints require authentication. Include the session token in the `Authorization` header as a Bearer token.

---

## Assets

### GET /assets — List Assets

**Query params:**

| Param    | Type    | Default | Description        |
| -------- | ------- | ------- | ------------------ |
| `search` | string  | `""`    | Search by name/plate |
| `page`   | integer | `1`     | Page number        |
| `rows`   | integer | `50`    | Items per page     |

**Response `200`:**

```json
{
  "status": "success",
  "message": "Assets retrieved",
  "messageKey": "asset.retrieved",
  "data": {
    "assets": [
      {
        "id": "uuid",
        "name": "string",
        "licensePlate": "string"
      }
    ],
    "total": 0
  }
}
```

**Pages:**
- **List page** at `/assets` — table with columns: Name, License Plate, Actions (Edit / Delete)
- **Add button** linking to `/assets/new`
- Each row has an **Edit** button linking to `/assets/:id/edit`

---

### POST /assets — Create Asset

**Required role:** superadmin

**Request body:**

```json
{
  "name": "string (1-255 chars)",
  "licensePlate": "string (1-11 chars)"
}
```

**Response `201`:**

```json
{
  "status": "success",
  "message": "Asset created",
  "messageKey": "asset.created",
  "data": {
    "id": "uuid",
    "name": "string",
    "licensePlate": "string"
  }
}
```

**Page:** `/assets/new` — form with Name and License Plate fields. On success, redirect to `/assets`.

---

### PATCH /assets/:id — Update Asset

**Required role:** superadmin

**Request body** (all fields optional):

```json
{
  "name": "string (1-255 chars)",
  "licensePlate": "string (1-11 chars)"
}
```

**Response `200`:**

```json
{
  "status": "success",
  "message": "Asset updated",
  "messageKey": "asset.updated",
  "data": null
}
```

**Response `404`:**

```json
{
  "status": "error",
  "message": "Asset not found",
  "messageKey": "asset.notFound",
  "messageParams": { "id": "uuid" },
  "data": null
}
```

**Page:** `/assets/:id/edit` — pre-filled form with current values. On success, redirect to `/assets`.

---

### DELETE /assets/:id — Soft Delete Asset

**Required role:** superadmin

**Response `200`:**

```json
{
  "status": "success",
  "message": "Asset deleted",
  "messageKey": "asset.deleted",
  "data": null
}
```

**Response `404`:**

```json
{
  "status": "error",
  "message": "Asset not found",
  "messageKey": "asset.notFound",
  "messageParams": { "id": "uuid" },
  "data": null
}
```

---

## Notes

- **Search query** supports `search`, `page` (default 1), `rows` (default 50).
- **Auth guards:** `GET /assets` requires any authenticated user (`auth: true`). Mutations (`POST`, `PATCH`, `DELETE`) on assets require `isSuperAdmin`.
- **Soft delete:** `DELETE /assets/:id` sets a `deleted_at` timestamp; the record is not physically removed. Listing endpoints automatically exclude soft-deleted items.
