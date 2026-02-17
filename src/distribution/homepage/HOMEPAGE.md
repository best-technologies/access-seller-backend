# Distribution Homepage API

**Base path:** `distribution/homepage` (prefix with `/api/v1`)

**Auth:** None. Endpoints are public for the electronics homepage.

---

## 1. Get products for homepage

Fetch all active distribution stock products to display on the electronics homepage. Returns a formatted list with core product fields.

**Endpoint:** `GET /api/v1/distribution/homepage/products`

**Query params:** None.

**Response (200):**

```json
{
  "success": true,
  "message": "Products retrieved",
  "data": [
    {
      "id": "clxx123abc",
      "sku": "SKU-001",
      "name": "Product name",
      "description": "Product description or null",
      "brand": "Brand or null",
      "model": "Model or null",
      "category": "Category or null",
      "images": [
        {
          "secure_url": "https://res.cloudinary.com/.../image/upload/...",
          "public_id": "acces-sellr/distribution/stocks/xyz"
        }
      ]
    }
  ],
  "length": 1,
  "statusCode": 200
}
```

### Response envelope

| Field       | Type    | Description                          |
|------------|--------|--------------------------------------|
| success    | boolean | Always `true` on success             |
| message    | string  | Human-readable message               |
| data       | array   | List of product objects (see below) |
| length     | number  | Number of items in `data`            |
| statusCode | number  | HTTP status (200)                    |

### Product object (`data[]`)

| Field        | Type          | Description                         |
|-------------|---------------|-------------------------------------|
| id          | string        | CUID                                |
| sku         | string        | Unique SKU                          |
| name        | string        | Product name                        |
| description | string \| null | Product description                 |
| brand       | string \| null | Brand name                          |
| model       | string \| null | Model name                          |
| category    | string \| null | Category (e.g. electronics)         |
| images      | array \| null  | `[{ secure_url, public_id }]` – may be empty array or null |

### Image object (`data[].images[]`)

| Field       | Type   | Description                    |
|------------|--------|--------------------------------|
| secure_url | string | URL to display the image      |
| public_id  | string | Storage identifier (e.g. Cloudinary) |

### Notes for frontend

- Results are ordered by `createdAt` descending (newest first).
- Maximum 500 products are returned per request.
- Only products with `isActive: true` are included.
- This endpoint returns a reduced set of fields (id, sku, name, description, brand, model, category, images). For full details including prices and stock, use the distribution stock API.
