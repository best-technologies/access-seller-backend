# Consignment API

Tracks bulk electronics shipments received at the warehouse from producers (e.g. Chinese manufacturers). Consignments are separate from retail products—they represent incoming stock for the distribution channel.

**Base path:** `distribution/consignment` (prefix with `/api/v1`)

**Auth:** All endpoints require JWT Bearer token.

---

## Two ways to work with consignments

### Approach 1: Single-shot (create with items)

Create a consignment and add all items in one request. Best for bulk imports or when you have all data at once.

1. `POST /distribution/consignment` — with `items` array in the body

### Approach 2: Two-step (create first, add items later)

Create a consignment with header info only, then add/edit/delete items one by one. Backend recalculates totals whenever items change. Best for manual data entry.

1. `POST /distribution/consignment` — without `items` or with empty `items`
2. `POST /distribution/consignment/:id/items` — add item
3. `PATCH /distribution/consignment/:id/items/:itemId` — edit item
4. `DELETE /distribution/consignment/:id/items/:itemId` — delete item

---

## Endpoints

### 1. Create Consignment

```
POST /distribution/consignment
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Payload:**

| Section | Field | Type | Required | Description |
|---------|-------|------|----------|-------------|
| **Reference** | referenceNumber | string | no | Optional. Omit to auto-generate (e.g. CONS-2025-001, CONS-2025-002). Must be unique if provided. |
| | supplierName | string | yes | Manufacturer/supplier name |
| | supplierReference | string | no | Supplier reference |
| **Sales person** | salesPersonName | string | no | Sales person name |
| | salesPersonPhone | string | no | Sales person phone |
| | salesPersonEmail | string | no | Sales person email (valid email) |
| **Invoice & delivery** | invoiceNumber | string | no | Invoice number |
| | deliveryNote | string | no | Delivery note |
| | deliveryDate | string | no | ISO date (e.g. 2025-02-10) |
| | deliveryTime | string | no | Time in HH:mm format |
| | paymentModeTerms | string | no | Mode/terms of payment |
| | manufacturerOrderNumber | string | no | Order number from manufacturer |
| | dispatchDocumentNumber | string | no | Dispatch document number |
| **Overall totals** | overallTotalCartons | number | no | Auto-computed from items if omitted |
| | overallTotalQuantity | number | no | Auto-computed from items if omitted |
| | overallTotalCost | number | no | Auto-computed from items if omitted |
| **Payment** | bankName | string | no | Bank name (account paid to) |
| | bankAccountNumber | string | no | Account number |
| | bankAccountName | string | no | Account name |
| | totalPaid | number | no | Total amount paid |
| | balanceToPay | number | no | Balance to pay |
| | amountToPayInWords | string | no | Amount to pay in words |
| | amountPaidInWords | string | no | Amount paid in words |
| **Other** | receivedAt | string | no | ISO datetime when received |
| | warehouseLocation | string | no | Warehouse location |
| | notes | string | no | General notes |
| **Items** | items | array | no | Line items (optional). Omit or use `[]` for two-step flow |

**Item (when using `items` in create):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
**Every item must have `productId`** (from the stock catalog). If any item is missing `productId`, the request is rejected with 400. Use `GET /distribution/stock/search?q=...` to find product ids.

**Item prices:** `unitPrice` = cost from supplier; `wholesalePrice` = wholesale selling price per unit; `retailPrice` = retail selling price per unit. All optional except `unitPrice` for cost.

| productId | string | **yes** | Required. Select from stock catalog (`GET /distribution/stock/search?q=`). productName/sku are filled from the product. |
| productName | string | no | Filled from product when productId is set; optional override. |
| cartons | number | yes | Number of cartons |
| quantity | number | yes | Quantity |
| unit | string | no | Unit (default: "pieces") |
| unitPrice | number | yes | Cost price per unit (from supplier) |
| totalCost | number | no | Computed as qty × unitPrice if omitted |
| wholesalePrice | number | no | Wholesale selling price per unit |
| retailPrice | number | no | Retail selling price per unit |
| sku | string | no | SKU |
| description | string | no | Description |
| brand | string | no | Brand |
| model | string | no | Model |
| condition | string | no | Condition (default: "new") |

**Example – Create without items (two-step):**
```json
{
  "referenceNumber": "CONS-2025-003",
  "supplierName": "Shenzhen Electronics Co",
  "salesPersonName": "John Doe",
  "salesPersonPhone": "+2348012345678",
  "salesPersonEmail": "john@example.com",
  "invoiceNumber": "INV-2025-101",
  "deliveryNote": "DN-2025-051",
  "deliveryDate": "2025-02-10",
  "deliveryTime": "14:30",
  "paymentModeTerms": "Bank Transfer - 30 days",
  "manufacturerOrderNumber": "ORD-MFG-12345",
  "dispatchDocumentNumber": "DISP-002",
  "bankName": "GTBank",
  "bankAccountNumber": "0123456789",
  "bankAccountName": "Shenzhen Electronics Co",
  "totalPaid": 50000,
  "balanceToPay": 25000,
  "amountToPayInWords": "Seventy Five Thousand Naira Only",
  "amountPaidInWords": "Fifty Thousand Naira Only",
  "warehouseLocation": "Lagos Main",
  "notes": "Consignment created first, items added separately"
}
```

**Example – Create with items (single-shot):**
```json
{
  "referenceNumber": "CONS-2025-002",
  "supplierName": "Shenzhen Electronics Co",
  "supplierReference": "MFG-PO-789",
  "salesPersonName": "John Doe",
  "salesPersonPhone": "+2348012345678",
  "salesPersonEmail": "john@example.com",
  "invoiceNumber": "INV-2025-100",
  "deliveryNote": "DN-2025-050",
  "deliveryDate": "2025-02-10",
  "deliveryTime": "14:30",
  "paymentModeTerms": "Bank Transfer - 30 days",
  "manufacturerOrderNumber": "ORD-MFG-12345",
  "dispatchDocumentNumber": "DISP-001",
  "bankName": "GTBank",
  "bankAccountNumber": "0123456789",
  "bankAccountName": "Shenzhen Electronics Co",
  "totalPaid": 50000,
  "balanceToPay": 25000,
  "amountToPayInWords": "Seventy Five Thousand Naira Only",
  "amountPaidInWords": "Fifty Thousand Naira Only",
  "warehouseLocation": "Lagos Main",
  "notes": "First professional consignment",
  "items": [
    {
      "productName": "Smartphone 128GB Black",
      "cartons": 10,
      "quantity": 500,
      "unitPrice": 85.50,
      "totalCost": 42750,
      "wholesalePrice": 110.00,
      "retailPrice": 135.00
    },
    {
      "productName": "Tablet 64GB Silver",
      "sku": "TAB-Y-64-SLV",
      "cartons": 5,
      "quantity": 200,
      "unitPrice": 120.00,
      "totalCost": 24000,
      "wholesalePrice": 150.00,
      "retailPrice": 179.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consignment created successfully",
  "data": {
    "id": "clxyz...",
    "referenceNumber": "CONS-2025-003",
    "supplierName": "string",
    "salesPersonName": "string | null",
    "salesPersonPhone": "string | null",
    "salesPersonEmail": "string | null",
    "invoiceNumber": "string | null",
    "deliveryNote": "string | null",
    "deliveryDate": "string | null",
    "deliveryTime": "string | null",
    "paymentModeTerms": "string | null",
    "manufacturerOrderNumber": "string | null",
    "dispatchDocumentNumber": "string | null",
    "overallTotalCartons": 0,
    "overallTotalQuantity": 0,
    "overallTotalCost": 0,
    "bankName": "string | null",
    "bankAccountNumber": "string | null",
    "bankAccountName": "string | null",
    "totalPaid": 50000,
    "balanceToPay": 25000,
    "amountToPayInWords": "string | null",
    "amountPaidInWords": "string | null",
    "receivedAt": "string | null",
    "status": "pending | received",
    "warehouseLocation": "string | null",
    "notes": "string | null",
    "createdAt": "string",
    "updatedAt": "string",
    "items": []
  },
  "statusCode": 201
}
```

---

### 2. Add Item to Consignment

```
POST /distribution/consignment/:id/items
```

Add a single item. **Backend computes `totalCost` from `quantity × unitPrice`** and updates consignment totals (`overallTotalCartons`, `overallTotalQuantity`, `overallTotalCost`).

**Payload:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | **yes** | Required. Select from stock catalog (`GET /distribution/stock/search?q=`). |
| cartons | number | yes | Number of cartons |
| quantity | number | yes | Quantity |
| unitPrice | number | yes | Cost price per unit (from supplier) |
| wholesalePrice | number | no | Wholesale selling price per unit |
| retailPrice | number | no | Retail selling price per unit |
| unit | string | no | Unit (default: "pieces") |
| sku | string | no | SKU |
| description | string | no | Description |
| brand | string | no | Brand |
| model | string | no | Model |
| condition | string | no | Condition (default: "new") |

**Example:**
```json
{
  "productName": "Smartphone 128GB Black",
  "cartons": 10,
  "quantity": 500,
  "unitPrice": 85.50,
  "wholesalePrice": 110.00,
  "retailPrice": 135.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to consignment",
  "data": {
    "item": {
      "id": "clxyz...",
      "consignmentId": "clabc...",
      "productName": "Smartphone 128GB Black",
      "cartons": 10,
      "quantity": 500,
      "unitPrice": 85.5,
      "totalCost": 42750,
      "wholesalePrice": 110,
      "retailPrice": 135,
      "sku": null,
      "description": null,
      "brand": null,
      "model": null
    },
    "consignment": {
      "id": "clabc...",
      "overallTotalCartons": 10,
      "overallTotalQuantity": 500,
      "overallTotalCost": 42750,
      "items": [...]
    }
  },
  "statusCode": 201
}
```

---

### 3. Update Item in Consignment

```
PATCH /distribution/consignment/:id/items/:itemId
```

Edit an item. All fields are optional (partial update). **Backend recalculates `totalCost` and consignment totals** when quantity or unitPrice changes.

**Payload (all optional):** You can also set **productId** here to link this item to a product from the stock catalog (e.g. to fix items that were created without a product link). When productId is sent, backend validates it and fills productName/sku from the product.

| Field | Type | Description |
|-------|------|-------------|
| productId | string | Link to product from catalog (GET /distribution/stock/search?q=...). When set, productName/sku are filled from the product. |
| productName | string | Product/item name |
| cartons | number | Number of cartons |
| quantity | number | Quantity |
| unitPrice | number | Cost price per unit |
| wholesalePrice | number | Wholesale selling price per unit |
| retailPrice | number | Retail selling price per unit |
| unit | string | Unit |
| sku | string | SKU |
| description | string | Description |
| brand | string | Brand |
| model | string | Model |
| condition | string | Condition |

**Example (link item to product):**
```json
{ "productId": "clxyz123..." }
```

**Example (other fields):**
```json
{
  "quantity": 600,
  "unitPrice": 82.00,
  "wholesalePrice": 108.00,
  "retailPrice": 132.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item updated",
  "data": {
    "item": {
      "id": "clxyz...",
      "productName": "Smartphone 128GB Black",
      "quantity": 600,
      "unitPrice": 82,
      "totalCost": 49200,
      "wholesalePrice": 108,
      "retailPrice": 132
    },
    "consignment": {
      "id": "clabc...",
      "overallTotalCartons": 10,
      "overallTotalQuantity": 600,
      "overallTotalCost": 49200,
      "items": [...]
    }
  },
  "statusCode": 200
}
```

---

### 4. Delete Item from Consignment

```
DELETE /distribution/consignment/:id/items/:itemId
```

Remove an item. **Backend recalculates consignment totals** after deletion.

**Response:**
```json
{
  "success": true,
  "message": "Item deleted",
  "data": {
    "consignment": {
      "id": "clabc...",
      "overallTotalCartons": 0,
      "overallTotalQuantity": 0,
      "overallTotalCost": 0,
      "items": []
    }
  },
  "statusCode": 200
}
```

---

### 5. Update consignment status

```
PATCH /distribution/consignment/:id/status
```

Change consignment status. **Stock is updated only for items linked to a product** (items with `productId` from the stock catalog).

- **Status set to `received`:** Product stock is **increased** for every item that has a `productId`. If the consignment has items but **none** have a `productId`, the API returns **400** with a message asking you to link items to products from the catalog (`GET /distribution/stock/search?q=...`). Response includes `stockUpdatedCount` (number of products whose stock was updated).
- **Status set to `pending`** (from `received`): Product stock is **reduced** for every item with a `productId`. Fails with 400 if any product would go below zero. `receivedAt` is set to `null`.
- **Any other status** (`inspected`, `available`, `partial_out`, `closed`): Only the status (and optionally `receivedAt`) is updated; no stock change.

**Important:** When creating a consignment or adding items, set `productId` (from the stock catalog) on each line that should affect inventory. Items with only `productName` (no `productId`) will not update stock when status is set to received.

**Payload:**

| Field  | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| status | string | yes      | One of: `pending`, `received`, `inspected`, `available`, `partial_out`, `closed` |

**Example (mark as received):**
```json
{ "status": "received" }
```

**Example (revert to pending):**
```json
{ "status": "pending" }
```

**Response:**
```json
{
  "success": true,
  "message": "Consignment status updated",
  "data": {
    "id": "clabc...",
    "referenceNumber": "CONS-2025-001",
    "status": "received",
    "receivedAt": "2025-02-17T12:00:00.000Z",
    "items": [...],
    "receivedBy": { "id": "...", "first_name": "...", "last_name": "...", "email": "..." }
  },
  "statusCode": 200
}
```

---

### 6. List Consignments (Paginated with Analysis)

```
GET /distribution/consignment
```

**Query params:**

| Param         | Type   | Default | Description                                                                 |
|---------------|--------|---------|-----------------------------------------------------------------------------|
| page          | number | 1       | Page number                                                                 |
| limit         | number | 20      | Items per page (max 100)                                                    |
| status        | string | -       | Filter by: `pending`, `received`, `inspected`, `available`, `partial_out`, `closed` |
| search        | string | -       | Search across: referenceNumber, invoiceNumber, supplierName, deliveryNote, manufacturerOrderNumber, dispatchDocumentNumber, salesPersonName |
| referenceNumber | string | -     | Filter by reference number (contains, case-insensitive)                     |
| invoiceNumber | string | -       | Filter by invoice number (contains)                                         |
| supplierName  | string | -       | Filter by supplier/manufacturer name (contains)                             |
| fromDate      | string | -       | Delivery date from (ISO date, e.g. 2025-02-01)                              |
| toDate        | string | -       | Delivery date to (ISO date)                                                 |
| fromCreatedAt | string | -       | Created date from (ISO date)                                                |
| toCreatedAt   | string | -       | Created date to (ISO date)                                                  |
| sortBy        | string | createdAt | Sort field: `createdAt`, `deliveryDate`, `referenceNumber`, `overallTotalCost`, `status` |
| sortOrder     | string | desc    | Sort order: `asc` or `desc`                                                 |

**Example requests:**
```
GET /distribution/consignment?page=1&limit=20
GET /distribution/consignment?status=received&page=2
GET /distribution/consignment?search=CONS-2025
GET /distribution/consignment?referenceNumber=CONS&supplierName=Shenzhen
GET /distribution/consignment?fromDate=2025-02-01&toDate=2025-02-28&sortBy=overallTotalCost&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Consignments retrieved",
  "data": {
    "analysis": {
      "totalConsignments": 50,
      "totalLineItems": 320,
      "totalCartons": 450,
      "totalQuantity": 12500,
      "totalCost": 1250000,
      "totalPaid": 800000,
      "totalBalanceToPay": 450000,
      "byStatus": {
        "pending": 5,
        "received": 25,
        "inspected": 10,
        "available": 8,
        "partial_out": 2,
        "closed": 0
      },
      "bySupplier": [
        {
          "supplierName": "Shenzhen Electronics Co",
          "count": 15,
          "totalCost": 500000,
          "totalQuantity": 5000
        },
        {
          "supplierName": "Guangzhou Tech Ltd",
          "count": 8,
          "totalCost": 300000,
          "totalQuantity": 3000
        }
      ]
    },
    "items": [
      {
        "id": "string",
        "referenceNumber": "string",
        "supplierName": "string",
        "salesPersonName": "string | null",
        "invoiceNumber": "string | null",
        "deliveryDate": "string | null",
        "overallTotalCartons": 15,
        "overallTotalQuantity": 700,
        "overallTotalCost": 66750,
        "status": "string",
        "createdAt": "string",
        "items": [...]
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

**Notes:**
- `analysis` reflects the **filtered set** (all matching consignments), not just the current page.
- `items` is the paginated list for the current page.
- `bySupplier` returns top 10 suppliers by total cost.

---

### 7. Get Consignment by ID

```
GET /distribution/consignment/:id
```

**Response structure:**
```json
{
  "success": true,
  "message": "Consignment retrieved",
  "data": {
    "id": "clabc...",
    "referenceNumber": "CONS-2025-001",
    "supplierName": "string",
    "supplierReference": "string | null",
    "salesPersonName": "string | null",
    "salesPersonPhone": "string | null",
    "salesPersonEmail": "string | null",
    "invoiceNumber": "string | null",
    "deliveryNote": "string | null",
    "deliveryDate": "2025-02-10T00:00:00.000Z",
    "deliveryTime": "string | null",
    "paymentModeTerms": "string | null",
    "manufacturerOrderNumber": "string | null",
    "dispatchDocumentNumber": "string | null",
    "overallTotalCartons": 15,
    "overallTotalQuantity": 700,
    "overallTotalCost": 66750,
    "bankName": "string | null",
    "bankAccountNumber": "string | null",
    "bankAccountName": "string | null",
    "totalPaid": 50000,
    "balanceToPay": 25000,
    "amountToPayInWords": "string | null",
    "amountPaidInWords": "string | null",
    "receivedAt": "2025-02-17T12:00:00.000Z | null",
    "status": "pending | received | inspected | available | partial_out | closed",
    "warehouseLocation": "string | null",
    "notes": "string | null",
    "receivedById": "string | null",
    "createdAt": "2025-02-17T10:00:00.000Z",
    "updatedAt": "2025-02-17T10:00:00.000Z",
    "items": [
      {
        "id": "clxyz...",
        "consignmentId": "clabc...",
        "productId": "clprod... | null",
        "productName": "string | null",
        "sku": "string | null",
        "description": "string | null",
        "brand": "string | null",
        "model": "string | null",
        "cartons": 10,
        "quantity": 500,
        "unit": "pieces",
        "unitPrice": 85.5,
        "totalCost": 42750,
        "wholesalePrice": 110 | null,
        "retailPrice": 135 | null,
        "condition": "new | null",
        "metadata": null,
        "createdAt": "2025-02-17T10:00:00.000Z",
        "updatedAt": "2025-02-17T10:00:00.000Z"
      }
    ],
    "documents": [
      {
        "id": "cldoc...",
        "consignmentId": "clabc...",
        "documentType": "invoice",
        "secure_url": "https://...",
        "public_id": "string",
        "createdAt": "2025-02-17T10:00:00.000Z"
      }
    ],
    "receivedBy": {
      "id": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string"
    }
  },
  "statusCode": 200
}
```

- **data.receivedBy** is `null` if no user is linked (receivedById is null).
- **data.items[].productId** is the catalog product id when the item is linked; `null` if not linked.

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create consignment (with or without items) | POST | `/distribution/consignment` |
| Add item to consignment | POST | `/distribution/consignment/:id/items` |
| Update item | PATCH | `/distribution/consignment/:id/items/:itemId` |
| Delete item | DELETE | `/distribution/consignment/:id/items/:itemId` |
| List consignments (paginated, filterable, with analysis) | GET | `/distribution/consignment?page=1&limit=20&...` |
| Get consignment | GET | `/distribution/consignment/:id` |

---

## Consignment Status Flow

| Status        | Description                  |
|---------------|------------------------------|
| `pending`     | Expected / in transit        |
| `received`    | Arrived at warehouse         |
| `inspected`   | Quality check done           |
| `available`   | Ready for bulk buyers        |
| `partial_out` | Some items allocated         |
| `closed`      | Fully allocated / done       |

---

## Summary

- **List consignments:** Paginated with `page`, `limit`. Supports filtering by `status`, `search`, `referenceNumber`, `invoiceNumber`, `supplierName`, `fromDate`, `toDate`, etc. Returns `analysis` (totals, byStatus, bySupplier) and `items` plus `meta`.
- **Create consignment:** `items` is optional. Omit or pass `[]` for the two-step flow.
- **Add item:** Backend computes `totalCost = quantity × unitPrice` and updates consignment totals.
- **Update/delete item:** Backend recalculates `overallTotalCartons`, `overallTotalQuantity`, `overallTotalCost` after every change.
- **referenceNumber** is auto-generated (CONS-YYYY-NNN) if omitted; if provided, must be unique.
- **invoiceNumber** must be unique when provided.
