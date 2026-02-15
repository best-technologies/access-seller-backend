# Distribution Dashboard API

**Endpoint:** `GET /api/v1/distribution/dashboard`  
**Auth:** Required (JWT Bearer token)

Returns a comprehensive view of the distribution channel with **pagination**, **filtering**, **search**, and **full professional analysis** for consignments, bulk orders, payments, invoices, and documents.

---

## Query Parameters

### Consignment pagination

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| consignmentPage | number | 1 | Page number for consignments |
| consignmentLimit | number | 20 | Items per page (max 100) |

### Bulk order pagination

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| bulkOrderPage | number | 1 | Page number for bulk orders |
| bulkOrderLimit | number | 20 | Items per page (max 100) |

### Consignment filters

| Param | Type | Description |
|-------|------|-------------|
| consignmentStatus | string | Filter by: `pending`, `received`, `inspected`, `available`, `partial_out`, `closed` |
| consignmentSearch | string | Search across: referenceNumber, invoiceNumber, supplierName, deliveryNote, manufacturerOrderNumber, dispatchDocumentNumber, salesPersonName |
| consignmentReferenceNumber | string | Filter by reference number (contains) |
| consignmentInvoiceNumber | string | Filter by invoice number |
| consignmentSupplierName | string | Filter by supplier name |
| consignmentFromDate | string | Delivery date from (ISO date) |
| consignmentToDate | string | Delivery date to (ISO date) |

### Bulk order filters

| Param | Type | Description |
|-------|------|-------------|
| bulkOrderStatus | string | Filter by: `pending`, `confirmed`, `packing`, `completed`, `cancelled` |
| bulkOrderSearch | string | Search across: referenceNumber, buyerName, buyerCompany, invoiceNumber |
| bulkOrderReferenceNumber | string | Filter by reference number |
| bulkOrderBuyerName | string | Filter by buyer name |
| bulkOrderInvoiceNumber | string | Filter by invoice number |

### Shared date filters

| Param | Type | Description |
|-------|------|-------------|
| fromCreatedAt | string | Created date from (ISO date) – applied to both consignments and bulk orders |
| toCreatedAt | string | Created date to (ISO date) |

### Sort

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| consignmentSortBy | string | createdAt | `createdAt`, `deliveryDate`, `referenceNumber`, `overallTotalCost`, `status` |
| consignmentSortOrder | string | desc | `asc` or `desc` |
| bulkOrderSortBy | string | createdAt | `createdAt`, `referenceNumber`, `totalAmount`, `status` |
| bulkOrderSortOrder | string | desc | `asc` or `desc` |

**Example requests:**
```
GET /distribution/dashboard
GET /distribution/dashboard?consignmentPage=2&consignmentLimit=20
GET /distribution/dashboard?consignmentStatus=received&bulkOrderStatus=completed
GET /distribution/dashboard?consignmentSearch=CONS-2025
GET /distribution/dashboard?consignmentFromDate=2025-02-01&consignmentToDate=2025-02-28&fromCreatedAt=2025-01-01
```

---

## Response Structure

```json
{
  "success": true,
  "message": "Distribution dashboard retrieved",
  "data": {
    "analysis": {
      "consignments": {
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
          }
        ]
      },
      "bulkOrders": {
        "totalBulkOrders": 30,
        "totalRevenue": 950000,
        "totalPaid": 700000,
        "totalPending": 250000,
        "byStatus": {
          "pending": 5,
          "confirmed": 10,
          "packing": 5,
          "completed": 8,
          "cancelled": 2
        },
        "byPaymentStatus": {
          "pending": 8,
          "partial": 5,
          "paid": 17
        }
      },
      "documents": {
        "consignmentDocs": 120,
        "bulkOrderDocs": 80,
        "consignmentByType": {
          "invoice": 60,
          "packing_list": 60
        },
        "bulkOrderByType": {
          "invoice": 40,
          "delivery_note": 25,
          "receipt": 15
        }
      }
    },
    "consignments": {
      "items": [
        {
          "id": "string",
          "referenceNumber": "string",
          "supplierName": "string",
          "status": "string",
          "receivedAt": "string | null",
          "itemCount": 15,
          "totalQuantity": 700,
          "totalValue": 66750,
          "documentCount": 2,
          "items": [...],
          "documents": [...],
          "receivedBy": { "id": "string", "first_name": "string", "last_name": "string", "email": "string" } | null
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
    "bulkOrders": {
      "items": [
        {
          "id": "string",
          "referenceNumber": "string",
          "buyerName": "string",
          "buyerCompany": "string | null",
          "status": "string",
          "totalAmount": 50000,
          "amountPaid": 30000,
          "paymentStatus": "partial",
          "invoiceNumber": "string | null",
          "itemCount": 5,
          "documentCount": 2,
          "items": [...],
          "documents": [...]
        }
      ],
      "meta": {
        "total": 30,
        "page": 1,
        "limit": 20,
        "totalPages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    },
    "recentConsignmentDocuments": [
      {
        "id": "string",
        "consignmentId": "string",
        "documentType": "string",
        "secure_url": "string",
        "public_id": "string",
        "createdAt": "string (ISO date)"
      }
    ],
    "recentBulkOrderDocuments": [
      {
        "id": "string",
        "bulkOrderId": "string",
        "documentType": "string",
        "secure_url": "string",
        "public_id": "string",
        "createdAt": "string (ISO date)"
      }
    ]
  },
  "statusCode": 200
}
```

---

## Summary

- **analysis** – Full breakdown of the **filtered set** (not just current page): consignments (totals, byStatus, bySupplier), bulk orders (totals, byStatus, byPaymentStatus), documents (counts by type).
- **consignments** – Paginated list with `items` and `meta` (total, page, limit, totalPages, hasNextPage, hasPrevPage).
- **bulkOrders** – Paginated list with `items` and `meta`.
- **recentConsignmentDocuments** / **recentBulkOrderDocuments** – Latest 20 documents (filtered by the same criteria as consignments/bulk orders).
- **ConsignmentItem** fields include: `productName`, `cartons`, `quantity`, `unitPrice`, `totalCost`, `sku`, `description`, etc.

---

## Schema Reference (BulkOrder)

| Field | Type | Description |
|-------|------|-------------|
| totalAmount | Float? | Order total (or computed from items) |
| amountPaid | Float? | Amount paid so far |
| paymentStatus | Enum? | pending \| partial \| paid |
| paymentMethod | String? | bank_transfer, cash, etc. |
| paidAt | DateTime? | When payment was completed |
| invoiceNumber | String? | Unique invoice reference |

## BulkOrderDocument

| Field | Type | Description |
|-------|------|-------------|
| bulkOrderId | String | FK to BulkOrder |
| documentType | String | invoice, delivery_note, receipt |
| secure_url | String | Document URL |
| public_id | String | Storage public ID |
