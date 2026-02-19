# Invoicing API (Distribution)

**Base path:** `distribution/invoicing` (prefix with `/api/v1`)  
**Auth:** All endpoints require JWT Bearer token.

**Flow:** New invoices are created with status `issued` (payment pending). No stock is reduced on create. Users can pay in parts via `POST :id/payments` (with optional receipt upload for bank payments). Stock is reduced only when the invoice becomes fully paid. You can also use `PATCH :id/mark-paid` for a quick full/partial payment without history.

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
  "customerName": "Acme Corp",
  "customerEmail": "billing@acme.com",
  "customerPhone": "+2348012345678",
  "customerCompany": "Acme Corporation",
  "issueDate": "2025-02-15",
  "dueDate": "2025-03-15",
  "taxAmount": 0,
  "paymentTerms": "Net 30",
  "notes": "Optional notes",
  "companyAddress": "121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan",
  "companyPhone": "08038086862, 08174615808",
  "managerSignedBy": "Manager Name",
  "customerSignedBy": "Customer Name",
  "items": [
    {
      "description": "Product A",
      "productId": "distribution-product-id",
      "quantity": 10,
      "unit": "pieces",
      "unitPrice": 500,
      "totalAmount": 5000,
      "priceType": "wholesale"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| invoiceNumber | string | no | **Auto-generated** if omitted (format: `INV-YYYY-NNNN`, e.g. INV-2025-0001) |
| bulkOrderId | string | no | Optional link to bulk order |
| customerName | string | yes | Customer name |
| customerEmail | string | no | Customer email |
| customerPhone | string | no | Customer phone |
| customerCompany | string | no | Customer company |
| issueDate | string | yes | ISO date |
| dueDate | string | no | ISO date |
| status | string | no | draft \| issued \| partial \| paid \| overdue \| cancelled (default: **issued**) |
| taxAmount | number | no | Tax amount |
| paymentTerms | string | no | Payment terms |
| notes | string | no | Notes |
| companyAddress | string | no | Default: `121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan` |
| companyPhone | string | no | Default: `08038086862, 08174615808` |
| managerSignedBy | string | no | Manager name (signature) |
| customerSignedBy | string | no | Customer name (signature) |
| items | array | yes | Line items |

**Item fields:** description, productId (optional), quantity, unit (default pieces), unitPrice, totalAmount (optional), priceType (optional, e.g. `"wholesale"` or `"retail"` – which price was used for the customer).

**Auto-computed:** `amountInWords` (e.g. "One Hundred and Twenty-Five Thousand Naira Only"). New invoices: `amountPaid=0`, `balanceDue=totalAmount`. No stock reduction on create.

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

### 3. Record Payment (with History & Receipt)

```
POST /distribution/invoicing/:id/payments
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | yes | Payment amount (must be &gt; 0 and ≤ balance due) |
| paymentMethod | string | no | e.g. `bank_transfer`, `cash`, `cheque`, `pos` |
| reference | string | no | Transaction ref, cheque number, etc. |
| notes | string | no | Optional notes |
| receipt | file | no | Payment receipt (jpg, jpeg, png, pdf; max 5MB) – e.g. bank transfer slip |

**Behavior:**
- Creates an `InvoicePayment` record (audit trail).
- Updates `Invoice.amountPaid`, `balanceDue`, `status` (partial or paid).
- **Stock is reduced only when fully paid** (same as mark-paid).
- Receipts are uploaded to Cloudinary (`acces-sellr/invoice-receipts`).

**Example (cURL with receipt):**
```bash
curl -X POST /api/v1/distribution/invoicing/INV_ID/payments \
  -H "Authorization: Bearer TOKEN" \
  -F "amount=50000" \
  -F "paymentMethod=bank_transfer" \
  -F "reference=TXN123456" \
  -F "notes=First installment" \
  -F "receipt=@/path/to/receipt.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded",
  "data": {
    "payment": { "id", "invoiceId", "amount", "paidAt", "paymentMethod", "reference", "notes", "receiptUrl", "receiptPublicId" },
    "invoice": { /* updated invoice with payments */ }
  },
  "statusCode": 201
}
```

---

### 4. Get Payment History

```
GET /distribution/invoicing/:id/payments
```

**Response:**
```json
{
  "success": true,
  "message": "Payment history retrieved",
  "data": [
    {
      "id": "string",
      "invoiceId": "string",
      "amount": 50000,
      "paidAt": "2025-02-15T10:00:00.000Z",
      "paymentMethod": "bank_transfer",
      "reference": "TXN123",
      "notes": "First installment",
      "receiptUrl": "https://res.cloudinary.com/.../receipt.jpg",
      "receiptPublicId": "acces-sellr/invoice-receipts/xyz",
      "recordedById": "string | null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "statusCode": 200
}
```

---

### 5. Mark Invoice as Paid (Legacy)

```
PATCH /distribution/invoicing/:id/mark-paid
```

**Payload:**
```json
{
  "amountPaid": 5000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amountPaid | number | no | Payment amount. If omitted, treats as full payment. |

**Behavior:**
- Records the payment and updates `amountPaid`, `balanceDue`, and `status`.
- **Stock is reduced only when the invoice becomes fully paid** (balanceDue = 0).
- For items with `productId`, reduces `DistributionProduct.currentStock` by `quantity`.
- If any product would go negative, the operation fails with an error.

**Response (full payment – stock reduced):**
```json
{
  "success": true,
  "message": "Invoice marked as paid and stock reduced",
  "data": { /* updated invoice */ },
  "statusCode": 200
}
```

**Response (partial payment – no stock change):**
```json
{
  "success": true,
  "message": "Payment recorded",
  "data": { /* updated invoice */ },
  "statusCode": 200
}
```

---

### 5b. Unmark as Paid

```
PATCH /distribution/invoicing/:id/unmark-paid
```

Reverts a **mark-as-paid** operation: restores `amountPaid`, `balanceDue`, `status` (to `partial` or `issued`) and **restores stock** (adds back the quantities that were deducted).

**Rules:**
- Only works when invoice `status` is `paid`.
- If the invoice was fully paid via **payment records** (InvoicePayment), not via mark-paid, the request fails with an error.

**Response:**
```json
{
  "success": true,
  "message": "Invoice unmarked as paid. Stock restored.",
  "data": { /* updated invoice */ },
  "statusCode": 200
}
```

---

### 6. Update Invoice (Company Info & Signatures)

```
PATCH /distribution/invoicing/:id
```

**Payload (all optional):**
```json
{
  "companyAddress": "121/123, Obafemi Awolowo Way, Oke-Ado, Ibadan",
  "companyPhone": "08038086862, 08174615808",
  "managerSignedBy": "Manager Name",
  "managerSignedAt": "2025-02-15T10:00:00Z",
  "customerSignedBy": "Customer Name",
  "customerSignedAt": "2025-02-15T10:05:00Z"
}
```

Use this to add or update company details and signatures after invoice creation.

---

### 7. Delete Invoice

```
DELETE /distribution/invoicing/:id
```

Permanently deletes the invoice and **reverts all side effects**:

1. **Stock:** If any payment was recorded (`amountPaid > 0`), restores stock for every line item that has a `productId`: increments `DistributionProduct.currentStock` by the item quantity and creates an `invoice_restore` `StockMovement` record. This undoes the reduction that was done when the first payment was recorded (or when the invoice was marked paid).
2. **Invoice:** The invoice is deleted. All related `InvoiceItem` and `InvoicePayment` rows are removed (cascade). Existing `StockMovement` rows that referenced this invoice have `invoiceId` set to `null`.
3. **Receipts:** Receipt files (e.g. Cloudinary/S3) for each payment are deleted from storage (best-effort; invoice delete still succeeds if storage delete fails).

**Response (200):**
```json
{
  "success": true,
  "message": "Invoice deleted. Stock restored for all items that had been reduced by payments.",
  "data": { "deletedInvoiceNumber": "INV-2026-0001" },
  "statusCode": 200
}
```

If the invoice had no payments, `message` is `"Invoice deleted."` and no stock changes are made.

---

### 8. Download Invoice as PDF

```
GET /distribution/invoicing/:id/pdf
```

Returns the invoice as a downloadable PDF with:
- Btech logo (from `public/images/btech-logo.jpg`)
- Lemon green accent (primary brand color)
- Company address and phone
- Customer details, line items table, totals
- Amount in words
- Manager and customer signature fields

**Response:** Binary PDF file (`Content-Disposition: attachment; filename="invoice-INV-2025-0001.pdf"`).

---

### 9. Get Invoice by ID

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
    "companyAddress": "string | null",
    "companyPhone": "string | null",
    "amountInWords": "string | null",
    "managerSignedBy": "string | null",
    "managerSignedAt": "string | null",
    "customerSignedBy": "string | null",
    "customerSignedAt": "string | null",
    "paymentTerms": "string | null",
    "notes": "string | null",
    "items": [ /* line items */ ],
    "payments": [
      {
        "id": "string",
        "invoiceId": "string",
        "amount": 50000,
        "paidAt": "2025-02-15T10:00:00.000Z",
        "paymentMethod": "bank_transfer",
        "reference": "TXN123",
        "notes": "First installment",
        "receiptUrl": "https://res.cloudinary.com/.../receipt.jpg",
        "receiptPublicId": "acces-sellr/invoice-receipts/xyz",
        "recordedById": "string | null",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
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
| **issued** | Payment pending (default on create) – no stock reduction |
| partial | Partially paid |
| paid | Fully paid – stock reduced |
| overdue | Past due date |
| cancelled | Cancelled |

---

## Stock Integration

- **Create:** No stock change.
- **Mark as paid (full):** For each line item with `productId`, `DistributionProduct.currentStock` is decremented by `quantity`. Fails if any product would go negative.
- **Mark as paid (partial):** No stock change until fully paid.

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List invoices | GET | `/distribution/invoicing` |
| Create invoice | POST | `/distribution/invoicing` |
| Record payment (with receipt) | POST | `/distribution/invoicing/:id/payments` |
| Get payment history | GET | `/distribution/invoicing/:id/payments` |
| Update invoice (signatures, company) | PATCH | `/distribution/invoicing/:id` |
| Delete invoice (reverts stock, removes receipts) | DELETE | `/distribution/invoicing/:id` |
| Mark as paid (legacy) | PATCH | `/distribution/invoicing/:id/mark-paid` |
| Unmark as paid | PATCH | `/distribution/invoicing/:id/unmark-paid` |
| Download PDF | GET | `/distribution/invoicing/:id/pdf` |
| Get invoice | GET | `/distribution/invoicing/:id` |
