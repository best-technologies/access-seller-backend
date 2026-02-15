# Invoicing API (Distribution)

**Base path:** `distribution/invoicing` (prefix with `/api/v1`)  
**Auth:** All endpoints require JWT Bearer token.

---

## Endpoints

### 1. Get All Invoices (Paginated with Analysis)

```
GET /distribution/invoicing
```

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| status | string | - | Filter: `draft`, `issued`, `partial`, `paid`, `overdue`, `cancelled` |
| search | string | - | Search: invoiceNumber, customerName, customerCompany |
| invoiceNumber | string | - | Filter by invoice number (contains) |
| customerName | string | - | Filter by customer name |
| fromIssueDate | string | - | Issue date from (ISO) |
| toIssueDate | string | - | Issue date to (ISO) |
| fromCreatedAt | string | - | Created date from |
| toCreatedAt | string | - | Created date to |
| sortBy | string | createdAt | `createdAt`, `issueDate`, `dueDate`, `invoiceNumber`, `totalAmount`, `status` |
| sortOrder | string | desc | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "message": "Invoices retrieved",
  "data": {
    "analysis": {
      "totalInvoices": 50,
      "totalAmount": 1250000,
      "totalPaid": 800000,
      "totalBalance": 450000,
      "totalTax": 50000,
      "byStatus": { "draft": 5, "issued": 20, "partial": 10, "paid": 15 }
    },
    "items": [ /* paginated invoices with items */ ],
    "meta": { "total", "page", "limit", "totalPages", "hasNextPage", "hasPrevPage" }
  },
  "statusCode": 200
}
```

---

### 2. Create Invoice

```
POST /distribution/invoicing
```

**Payload:**
```json
{
  "invoiceNumber": "INV-2025-001",
  "bulkOrderId": "optional-bulk-order-id",
  "customerName": "Acme Corp",
  "customerEmail": "billing@acme.com",
  "customerPhone": "+2348012345678",
  "customerCompany": "Acme Corporation",
  "issueDate": "2025-02-15",
  "dueDate": "2025-03-15",
  "status": "draft",
  "taxAmount": 0,
  "amountPaid": 0,
  "paymentTerms": "Net 30",
  "notes": "Optional notes",
  "items": [
    {
      "description": "Product A",
      "quantity": 10,
      "unit": "pieces",
      "unitPrice": 500,
      "totalAmount": 5000
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| invoiceNumber | string | yes | Unique invoice number |
| bulkOrderId | string | no | Optional link to bulk order |
| customerName | string | yes | Customer name |
| customerEmail | string | no | Customer email |
| customerPhone | string | no | Customer phone |
| customerCompany | string | no | Customer company |
| issueDate | string | yes | ISO date |
| dueDate | string | no | ISO date |
| status | string | no | draft \| issued \| partial \| paid \| overdue \| cancelled (default: draft) |
| taxAmount | number | no | Tax amount |
| amountPaid | number | no | Amount paid |
| paymentTerms | string | no | Payment terms |
| notes | string | no | Notes |
| items | array | yes | Line items |

**Item fields:** description, quantity, unit (default pieces), unitPrice, totalAmount (optional, computed as qty × unitPrice)

**Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": { /* invoice with items */ },
  "statusCode": 201
}
```

---

### 3. Get Invoice by ID

```
GET /distribution/invoicing/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice retrieved",
  "data": {
    "id": "string",
    "invoiceNumber": "string",
    "bulkOrderId": "string | null",
    "customerName": "string",
    "customerEmail": "string | null",
    "customerPhone": "string | null",
    "customerCompany": "string | null",
    "issueDate": "string",
    "dueDate": "string | null",
    "status": "string",
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "amountPaid": 0,
    "balanceDue": 0,
    "paymentTerms": "string | null",
    "notes": "string | null",
    "items": [ /* line items */ ],
    "bulkOrder": { "id", "referenceNumber", "buyerName", "buyerCompany", "totalAmount", "status" } | null
  },
  "statusCode": 200
}
```

---

## Invoice Status Flow

| Status | Description |
|--------|-------------|
| draft | Not yet sent |
| issued | Sent to customer |
| partial | Partially paid |
| paid | Fully paid |
| overdue | Past due date |
| cancelled | Cancelled |

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List invoices | GET | `/distribution/invoicing` |
| Create invoice | POST | `/distribution/invoicing` |
| Get invoice | GET | `/distribution/invoicing/:id` |
