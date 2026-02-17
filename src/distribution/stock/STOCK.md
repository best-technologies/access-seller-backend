# Stock / Inventory API (Distribution)

**Base path:** `distribution/stock` (prefix with `/api/v1`)  
**Auth:** All endpoints require JWT Bearer token.

Master product catalog for distribution. Add products here, then select them when creating consignments. Stock increases when consignment items (with `productId`) are received; stock decreases when invoices are marked as paid (via `PATCH /distribution/invoicing/:id/mark-paid`).

---

## 1. Stock Dashboard / List All (Paginated with Analysis)

```
GET /distribution/stock
```

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search: sku, name, description, brand, category |
| sku | string | - | Filter by SKU (contains) |
| name | string | - | Filter by name |
| category | string | - | Filter by category |
| isActive | string | - | `true` or `false` |
| lowStock | string | - | `true` = out of stock only |
| fromCreatedAt | string | - | Created from (ISO) |
| toCreatedAt | string | - | Created to (ISO) |
| sortBy | string | createdAt | `createdAt`, `name`, `sku`, `currentStock`, `costPrice`, `category` |
| sortOrder | string | desc | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "message": "Stock retrieved",
  "data": {
    "analysis": {
      "totalProducts": 50,
      "activeProducts": 48,
      "totalQuantity": 12500,
      "totalValue": 1250000,
      "lowStockCount": 5,
      "outOfStockCount": 2,
      "byCategory": [
        {
          "category": "Electronics",
          "count": 20,
          "quantity": 5000,
          "value": 500000
        },
        {
          "category": null,
          "count": 5,
          "quantity": 1200,
          "value": 120000
        }
      ]
    },
    "items": [
      {
        "id": "clxyz...",
        "sku": "PHONE-X-128",
        "name": "Smartphone 128GB",
        "description": "Optional description",
        "brand": "BrandName",
        "model": "X128",
        "category": "Electronics",
        "unit": "pieces",
        "currentStock": 100,
        "costPrice": 85.50,
        "wholesalePrice": 120.00,
        "retailPrice": 110.00,
        "reorderLevel": 10,
        "warehouseLocation": "Lagos Main",
        "isActive": true,
        "createdAt": "2025-02-15T12:00:00.000Z",
        "updatedAt": "2025-02-15T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "statusCode": 200
}
```

**Field reference – analysis:**

| Field | Type | Description |
|-------|------|-------------|
| analysis.totalProducts | number | Total products in filtered set |
| analysis.activeProducts | number | Products with isActive=true |
| analysis.totalQuantity | number | Sum of currentStock across active products |
| analysis.totalValue | number | Sum of (costPrice × currentStock) |
| analysis.lowStockCount | number | Active products where currentStock ≤ reorderLevel |
| analysis.outOfStockCount | number | Active products with currentStock = 0 |
| analysis.byCategory | array | Per-category breakdown |
| analysis.byCategory[].category | string \| null | Category name or null for uncategorized |
| analysis.byCategory[].count | number | Product count in category |
| analysis.byCategory[].quantity | number | Total quantity in category |
| analysis.byCategory[].value | number | Total value in category |

**Field reference – items[] (Product):**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Product ID |
| sku | string | Unique SKU |
| name | string | Product name |
| description | string \| null | Description |
| brand | string \| null | Brand |
| model | string \| null | Model |
| category | string \| null | Category |
| unit | string | Unit (default: "pieces") |
| currentStock | number | Current quantity |
| costPrice | number \| null | Cost for valuation |
| wholesalePrice | number \| null | Wholesale selling price |
| retailPrice | number \| null | Retail selling price |
| reorderLevel | number \| null | Alert when stock below |
| warehouseLocation | string \| null | Location |
| images | array \| null | `[{ secure_url, public_id }]` from Cloudinary |
| isActive | boolean | Active flag |
| createdAt | string | ISO 8601 date |
| updatedAt | string | ISO 8601 date |

**Field reference – meta:**

| Field | Type | Description |
|-------|------|-------------|
| meta.total | number | Total matching products |
| meta.page | number | Current page |
| meta.limit | number | Items per page |
| meta.totalPages | number | Total pages |
| meta.hasNextPage | boolean | Has next page |
| meta.hasPrevPage | boolean | Has previous page |

---

## 2. Search Products

```
GET /distribution/stock/search?q=term
```

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | no | Search term (sku or name) |

**Response:**
```json
{
  "success": true,
  "message": "Products",
  "data": [
    {
      "id": "clxyz...",
      "sku": "PHONE-X-128",
      "name": "Smartphone 128GB",
      "currentStock": 100,
      "unit": "pieces",
      "costPrice": 85.50
    }
  ],
  "statusCode": 200
}
```

**Field reference – data[]:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Product ID |
| sku | string | SKU |
| name | string | Product name |
| currentStock | number | Current quantity |
| unit | string | Unit |
| costPrice | number \| null | Cost price |

---

## 3. Add New Product

```
POST /distribution/stock
```

**Content-Type:** `application/json` or `multipart/form-data`

- **JSON:** Product fields only (no images).
- **Multipart:** Product fields as form fields + optional `images` (up to 10 files, 5MB each). Allowed formats: jpg, jpeg, png.

**Payload (JSON or form fields):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sku | string | yes | Unique SKU |
| name | string | yes | Product name |
| description | string | no | Description |
| brand | string | no | Brand |
| model | string | no | Model |
| category | string | no | Category |
| unit | string | no | Default: "pieces" |
| initialStock | number | no | Default: 0 |
| costPrice | number | no | Cost for valuation |
| wholesalePrice | number | no | Wholesale selling price |
| retailPrice | number | no | Retail selling price |
| reorderLevel | number | no | Alert when stock below |
| warehouseLocation | string | no | Location |
| isActive | boolean | no | Default: true |
| images | file[] | no | Up to 10 images (multipart only). Field name: `images`. |

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "clxyz...",
    "sku": "PHONE-X-128",
    "name": "Smartphone 128GB",
    "description": "Optional description",
    "brand": "BrandName",
    "model": "X128",
    "category": "Electronics",
    "unit": "pieces",
    "currentStock": 0,
    "costPrice": 85.50,
    "wholesalePrice": 120.00,
    "retailPrice": 110.00,
    "reorderLevel": 10,
    "warehouseLocation": "Lagos Main",
    "images": [
      { "secure_url": "https://res.cloudinary.com/.../image.jpg", "public_id": "acces-sellr/distribution-products/xyz" }
    ],
    "isActive": true,
    "createdAt": "2025-02-15T12:00:00.000Z",
    "updatedAt": "2025-02-15T12:00:00.000Z"
  },
  "statusCode": 201
}
```

---

## 4. Get Product by ID

```
GET /distribution/stock/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved",
  "data": {
    "id": "clxyz...",
    "sku": "PHONE-X-128",
    "name": "Smartphone 128GB",
    "description": "Optional description",
    "brand": "BrandName",
    "model": "X128",
    "category": "Electronics",
    "unit": "pieces",
    "currentStock": 100,
    "costPrice": 85.50,
    "wholesalePrice": 120.00,
    "retailPrice": 110.00,
    "reorderLevel": 10,
    "warehouseLocation": "Lagos Main",
    "images": [
      { "secure_url": "https://res.cloudinary.com/.../image.jpg", "public_id": "acces-sellr/distribution-products/xyz" }
    ],
    "isActive": true,
    "createdAt": "2025-02-15T12:00:00.000Z",
    "updatedAt": "2025-02-15T12:00:00.000Z"
  },
  "statusCode": 200
}
```

---

## 5. Add Images to Product

```
POST /distribution/stock/:id/images
```

**Content-Type:** `multipart/form-data`

**Payload:** Form field `images` with one or more files (up to 10 total per product, 5MB each). Allowed formats: jpg, jpeg, png.

**Response:**
```json
{
  "success": true,
  "message": "Images added",
  "data": { /* full product with updated images array */ },
  "statusCode": 200
}
```

---

## 6. Remove Image from Product

```
DELETE /distribution/stock/:id/images?publicId=acces-sellr%2Fdistribution-products%2Fxyz
```

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| publicId | string | yes | Cloudinary public_id (URL-encode if it contains slashes) |

**Response:**
```json
{
  "success": true,
  "message": "Image removed",
  "data": { /* full product with updated images array */ },
  "statusCode": 200
}
```

---

## 7. Update Product

```
PATCH /distribution/stock/:id
```

**Payload (all optional):** Same fields as create.

**Response:**
```json
{
  "success": true,
  "message": "Product updated",
  "data": {
    "id": "clxyz...",
    "sku": "PHONE-X-128",
    "name": "Smartphone 128GB",
    "description": "Updated description",
    "brand": "BrandName",
    "model": "X128",
    "category": "Electronics",
    "unit": "pieces",
    "currentStock": 100,
    "costPrice": 90.00,
    "wholesalePrice": 125.00,
    "retailPrice": 115.00,
    "reorderLevel": 15,
    "warehouseLocation": "Lagos Main",
    "isActive": true,
    "createdAt": "2025-02-15T12:00:00.000Z",
    "updatedAt": "2025-02-15T14:30:00.000Z"
  },
  "statusCode": 200
}
```

---

## 8. Delete Product

```
DELETE /distribution/stock/:id
```

**Response (success):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "clxyz...",
    "sku": "PHONE-X-128",
    "name": "Smartphone 128GB"
  },
  "statusCode": 200
}
```

On delete:
- Product images are removed from Cloudinary
- Consignment items linked to this product have `productId` set to null (keeps consignment history)

---

## 9. Adjust Stock

```
POST /distribution/stock/:id/adjust
```

**Payload:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| quantity | number | yes | Positive = add, negative = reduce |
| reason | string | no | Optional reason |

**Response:**
```json
{
  "success": true,
  "message": "Stock adjusted",
  "data": {
    "id": "clxyz...",
    "sku": "PHONE-X-128",
    "name": "Smartphone 128GB",
    "description": "Optional description",
    "brand": "BrandName",
    "model": "X128",
    "category": "Electronics",
    "unit": "pieces",
    "currentStock": 150,
    "costPrice": 85.50,
    "wholesalePrice": 120.00,
    "retailPrice": 110.00,
    "reorderLevel": 10,
    "warehouseLocation": "Lagos Main",
    "isActive": true,
    "createdAt": "2025-02-15T12:00:00.000Z",
    "updatedAt": "2025-02-15T14:30:00.000Z"
  },
  "statusCode": 200
}
```

---

## Error Responses

All endpoints may return:

```json
{
  "statusCode": 400,
  "message": "Product with SKU PHONE-X-128 already exists",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 400,
  "message": "Cannot reduce stock below 0. Current: 10, requested adjustment: -20",
  "error": "Bad Request"
}
```

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List stock (dashboard) | GET | `/distribution/stock` |
| Search products | GET | `/distribution/stock/search?q=` |
| Add product | POST | `/distribution/stock` (JSON or multipart with images) |
| Get product | GET | `/distribution/stock/:id` |
| Update product | PATCH | `/distribution/stock/:id` |
| Add images | POST | `/distribution/stock/:id/images` (multipart) |
| Remove image | DELETE | `/distribution/stock/:id/images?publicId=` |
| Delete product | DELETE | `/distribution/stock/:id` |
| Adjust stock | POST | `/distribution/stock/:id/adjust` |

**Image upload limits:** Up to 10 images per product, 5MB each. Formats: jpg, jpeg, png. Stored in Cloudinary folder `acces-sellr/distribution-products`.

---

## Stock movement history (audit trail)

Every change to product stock is recorded in `StockMovement` with **stockBefore** and **stockAfter** (like wallet balance before/after in fintech):

| Event | movementType | When |
|-------|--------------|------|
| New consignment created / item added to consignment | `consignment_in` | Product stock is incremented; one row per product line with consignmentId (and consignmentItemId). |
| Invoice marked fully paid / payment recorded (fully paid) | `invoice_out` | Product stock is decremented; one row per invoice line with invoiceId. |
| Invoice unmarked as paid | `invoice_restore` | Stock is restored (incremented); one row per line with invoiceId. |
| Manual stock adjust | `adjust` | One row with optional `reason`. |

Each row has: `productId`, `quantityDelta` (+ or -), `stockBefore`, `stockAfter`, and optional `consignmentId`, `invoiceId`, `reason`. Use these records for tracking and reconciliation.

---

## Consignment Integration

- Use `productId` (from stock catalog) when creating consignments or adding items.
- Stock is auto-incremented when consignment items with `productId` are added.
- Each such change is recorded in `StockMovement` with stockBefore/stockAfter.
- Use `GET /distribution/stock/search?q=...` for product search/autocomplete.
