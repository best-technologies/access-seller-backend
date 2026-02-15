# Auth API – Frontend Integration Guide

Base URL: `{API_BASE}/auth` (e.g. `https://your-api.com/api/v1/auth`)

All endpoints below are relative to the auth controller. Prefix with your API base (including `/api/v1`).

---

## 1. Login (Regular Users)

**Endpoint:** `POST /auth/sign-in`

**Payload:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (user with role `user`):**
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "access_token": "string",
    "role": "user"
  },
  "statusCode": 200
}
```

**Response (admin/other roles – OTP required):**
```json
{
  "success": true,
  "message": "OTP sent to email. Please verify to continue.",
  "data": {
    "role": "admin"
  },
  "statusCode": 200
}
```
→ Then call **Admin Verify Login OTP** with the OTP sent to email.

**Error responses:** `404` User not found, `400` Passwords do not match

---

## 2. Admin Login – Request OTP

**Endpoint:** `POST /auth/admin-login-otp`

**Payload:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP successfully sent",
  "data": null,
  "statusCode": 200
}
```

---

## 3. Admin Login – Verify OTP & Sign In

**Endpoint:** `POST /auth/admin-verify-login-otp`

**Payload:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "string",
    "role": "admin"
  },
  "statusCode": 200
}
```

---

## 4. Register

**Endpoint:** `POST /auth/register`

**Payload:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "referral_code": "string (optional)"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "createdAt": "string (ISO date)"
  }
}
```

**Response (user already exists):**
```json
{
  "success": false,
  "message": "User already exist"
}
```

---

## 5. Register New Warehouse Admin

**Endpoint:** `POST /auth/warehouse/onboard-warehouse-admin`  
**Auth:** Required (JWT Bearer token)

**Payload:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone_number": "string (optional)",
  "password": "string (optional, min 6 chars)"
}
```
If `password` is omitted, a temporary password is generated and returned.

**Response (with custom password):**
```json
{
  "success": true,
  "message": "Warehouse admin onboarded successfully",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "admin",
    "createdAt": "string (ISO date)"
  },
  "statusCode": 201
}
```

**Response (with generated password):**
```json
{
  "success": true,
  "message": "Warehouse admin onboarded successfully",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "admin",
    "createdAt": "string (ISO date)",
    "temporaryPassword": "string",
    "message": "Please share the temporary password with the warehouse admin securely. They should change it on first login."
  },
  "statusCode": 201
}
```

---

## 6. Forgot Password – Request OTP

**Endpoint:** `POST /auth/request-password-reset-email`

**Payload:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "string"
  },
  "statusCode": 200
}
```

---

## 7. Forgot Password – Verify OTP & Reset Password

**Endpoint:** `POST /auth/verify-password-reset-email`

**Payload:**
```json
{
  "email": "string",
  "otp": "string",
  "new_password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 8. Get User Profile

**Endpoint:** `GET /auth/fetch-user-details`  
**Auth:** Required (JWT Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User details successfully retrieved",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string",
    "profile_picture": "string | null",
    "role": "string",
    "status": "active | suspended | inactive",
    "permissions": ["string"],
    "is_affiliate": "boolean",
    "affiliate_status": "string",
    "joined_date": "string",
    "address": "string",
    "stats": {
      "totalOrders": "number",
      "totalCartItems": "number"
    },
    "promoted_products": [
      {
        "product_image": "string | null",
        "product_name": "string",
        "affiliate_commission": "number",
        "earning_per_sale": "number",
        "all_time_earning": "number",
        "sales": "number",
        "status": "string",
        "affiliate_link": "string"
      }
    ],
    "commission_payouts": [
      {
        "payout_id": "string",
        "amount": "number",
        "status": "string",
        "method": "string",
        "reference": "string",
        "requestedAt": "string (ISO date)",
        "paidAt": "string | null (ISO date)"
      }
    ]
  }
}
```

---

## Distribution Dashboard API

**Endpoint:** `GET /distribution/dashboard`  
**Auth:** JWT Bearer token required

**Full documentation:** See `src/distribution/dashboard/README.md`

Returns paginated consignments and bulk orders with filtering, search, and full analysis (totals, byStatus, bySupplier, documents). Query params: `consignmentPage`, `consignmentLimit`, `bulkOrderPage`, `bulkOrderLimit`, `consignmentStatus`, `bulkOrderStatus`, `consignmentSearch`, `bulkOrderSearch`, `consignmentFromDate`, `consignmentToDate`, `fromCreatedAt`, `toCreatedAt`, etc.

---

## Consignment API

**Base path:** `distribution/consignment` (prefix with `/api/v1`)  
**Auth:** All endpoints require JWT Bearer token.

**Full documentation:** See `src/distribution/consignment/CONSIGNMENT.md`

**Endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Create consignment (with or without items) | POST | `/distribution/consignment` |
| Add item to consignment | POST | `/distribution/consignment/:id/items` |
| Update item | PATCH | `/distribution/consignment/:id/items/:itemId` |
| Delete item | DELETE | `/distribution/consignment/:id/items/:itemId` |
| List consignments (paginated, filterable, with analysis) | GET | `/distribution/consignment?page=1&limit=20&status=&search=&...` |
| Get consignment by ID | GET | `/distribution/consignment/:id` |

### Invoicing API

**Base path:** `distribution/invoicing`  
**Full documentation:** `src/distribution/invoicing/INVOICING.md`

| Action | Method | Endpoint |
|--------|--------|----------|
| List invoices (paginated, filterable, with analysis) | GET | `/distribution/invoicing?page=1&limit=20&...` |
| Create invoice | POST | `/distribution/invoicing` |
| Get invoice by ID | GET | `/distribution/invoicing/:id` |

### Stock / Inventory API

**Base path:** `distribution/stock`  
**Full documentation:** `src/distribution/stock/STOCK.md`

| Action | Method | Endpoint |
|--------|--------|----------|
| List stock (dashboard, paginated, with analysis) | GET | `/distribution/stock` |
| Search products (for consignment dropdown) | GET | `/distribution/stock/search?q=` |
| Add product | POST | `/distribution/stock` |
| Get product | GET | `/distribution/stock/:id` |
| Update product | PATCH | `/distribution/stock/:id` |
| Adjust stock | POST | `/distribution/stock/:id/adjust` |

**Two workflows supported:**
1. **Single-shot:** Create consignment with `items` array in one request.
2. **Two-step:** Create consignment without items, then add/edit/delete items via the item endpoints. Backend auto-calculates totals.

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/auth/sign-in` |
| Admin request OTP | POST | `/auth/admin-login-otp` |
| Admin verify OTP | POST | `/auth/admin-verify-login-otp` |
| Register | POST | `/auth/register` |
| Onboard warehouse admin | POST | `/auth/warehouse/onboard-warehouse-admin` |
| Request password reset OTP | POST | `/auth/request-password-reset-email` |
| Verify OTP & reset password | POST | `/auth/verify-password-reset-email` |
| Get user profile | GET | `/auth/fetch-user-details` |
