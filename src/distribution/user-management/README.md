# User Management API (Distribution)

**Base path:** `distribution/user-management` (prefix with `/api/v1`)  
**Auth:** All endpoints require JWT Bearer token.

---

## Endpoints

### 1. Users Dashboard

```
GET /distribution/user-management
```

Returns full analysis and max 10 most recent users for dashboard display.

**Response:**
```json
{
  "success": true,
  "message": "Users dashboard retrieved",
  "data": {
    "analysis": {
      "totalUsers": 150,
      "activeUsers": 120,
      "suspendedUsers": 5,
      "inactiveUsers": 25,
      "byRole": { "user": 140, "admin": 8, "super_admin": 2 },
      "byLevel": { "bronze": 80, "silver": 40, "gold": 20, "platinum": 8, "vip": 2 }
    },
    "recentUsers": [
      {
        "id": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "phone_number": "string | null",
        "role": "string",
        "status": "string",
        "level": "string",
        "usertype": "string | null",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  },
  "statusCode": 200
}
```

---

### 2. All Users (Paginated with Filters & Analysis)

```
GET /distribution/user-management/all
```

Returns paginated users with full analysis, filtering, and search.

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search: email, first_name, last_name, phone_number |
| email | string | - | Filter by email (contains) |
| role | string | - | Filter by role |
| status | string | - | `active`, `suspended`, or `inactive` |
| fromCreatedAt | string | - | Created date from (ISO) |
| toCreatedAt | string | - | Created date to (ISO) |
| sortBy | string | createdAt | `createdAt`, `email`, `first_name`, `last_name`, `role`, `status` |
| sortOrder | string | desc | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "analysis": {
      "totalUsers": 150,
      "activeUsers": 120,
      "suspendedUsers": 5,
      "inactiveUsers": 25,
      "byRole": { "user": 140, "admin": 8, "super_admin": 2 },
      "byLevel": { "bronze": 80, "silver": 40, "gold": 20, "platinum": 8, "vip": 2 }
    },
    "items": [
      {
        "id": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "phone_number": "string | null",
        "role": "string",
        "status": "string",
        "level": "string",
        "usertype": "string | null",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "statusCode": 200
}
```

---

### 3. Onboard Warehouse Admin

```
POST /auth/warehouse/onboard-warehouse-admin
```

*Full path: `/api/v1/auth/warehouse/onboard-warehouse-admin`*

Creates a new warehouse admin user. The user is created with `role: admin` and `usertype: warehouse-admin` (hardcoded server-side, not sent from frontend).

**Request body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "warehouse.admin@example.com",
  "phone_number": "+2348012345678",
  "password": "optional-custom-password"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | Yes | First name |
| last_name | string | Yes | Last name |
| email | string | Yes | Unique email |
| phone_number | string | No | Phone number |
| password | string | No | Min 6 chars. If omitted, a temporary password is generated and returned in the response |

**Response:** Returns the created user with `role`, `usertype`, `id`, `email`, etc. If no password was provided, `temporaryPassword` and a `message` are included.

---

### 4. Get User by ID

```
GET /distribution/user-management/:id
```

Returns full user profile with all DB fields (except `password`, `otp`), permissions, and related data.

**Response:**
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string | null",
    "display_picture": "string | null",
    "address": "string | null",
    "gender": "string",
    "role": "string",
    "status": "string",
    "usertype": "string | null",
    "is_active": true,
    "level": "string",
    "is_email_verified": true,
    "is_otp_verified": true,
    "allowedPartialPayment": 0,
    "referralPercentage": null,
    "referralPaymentCount": null,
    "isAffiliate": false,
    "affiliateStatus": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "legacyPermissions": ["permission1", "permission2"],
    "permissions": [
      {
        "id": "string",
        "name": "string",
        "displayName": "string",
        "category": "string",
        "description": "string | null",
        "isActive": true,
        "grantedAt": "string",
        "grantedBy": "string | null"
      }
    ],
    "store": { "id", "first_name", "last_name", "email", "phone", "address", "status", "description" } | null,
    "affiliate": { "id", "userName", "userEmail", "status", "requestedAt", "reviewedAt", "category", "reason", "notes" } | null,
    "banks": [{ "id", "bankName", "bankCode", "accountNumber", "accountName" }],
    "shippingAddresses": [...],
    "wallet": { "id", "total_earned", "available_for_withdrawal", "total_withdrawn" } | null,
    "counts": {
      "orders": 0,
      "commissionReferrals": 0,
      "commissions": 0
    }
  },
  "statusCode": 200
}
```

---

### 5. Permission CRUD

#### Get All Permissions

```
GET /distribution/user-management/permissions
```

Returns all active permissions (flat list and by category) for use when editing user permissions.

**Response:**
```json
{
  "success": true,
  "message": "Permissions retrieved",
  "data": {
    "permissions": [
      {
        "id": "string",
        "name": "edit user",
        "displayName": "Edit User",
        "category": "users",
        "description": "string | null"
      }
    ],
    "categorized": {
      "users": [{ "id", "name", "displayName", "description" }],
      "products": [{ "id", "name", "displayName", "description" }]
    }
  },
  "statusCode": 200
}
```

#### Create Permission

```
POST /distribution/user-management/permissions
```

**Request body:**
```json
{
  "name": "manage warehouse",
  "displayName": "Manage Warehouse",
  "category": "distribution",
  "description": "Full warehouse access",
  "isActive": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique identifier (stored lowercase) |
| displayName | string | Yes | Human-readable label |
| category | string | Yes | Category for grouping (e.g. users, products, distribution) |
| description | string | No | Optional description |
| isActive | boolean | No | Default: true |

#### Edit Permission

```
PATCH /distribution/user-management/permissions/:permissionId
```

**Request body (all optional):**
```json
{
  "name": "manage warehouse",
  "displayName": "Manage Warehouse",
  "category": "distribution",
  "description": "Updated description",
  "isActive": false
}
```

#### Delete Permission

```
DELETE /distribution/user-management/permissions/:permissionId
```

Deletes the permission. Cascades to `UserPermission` (removes from all users).

---

### 6. Edit User

```
PATCH /distribution/user-management/:id
```

Updates any editable user fields. All fields are optional; only provided fields are updated.

**Request body (all optional):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+2348012345678",
  "address": "123 Main St",
  "display_picture": "https://...",
  "gender": "male",
  "role": "admin",
  "status": "active",
  "level": "gold",
  "is_active": true,
  "allowedPartialPayment": 50,
  "usertype": "warehouse-admin",
  "store_id": "store-id-or-null",
  "permissions": ["edit user", "view user"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| first_name, last_name | string | Name |
| email | string | Unique email (validated) |
| phone_number, address | string | Contact info |
| display_picture | string | Profile image URL |
| gender | string | male, female, other |
| role | string | super_admin, admin, inventory_manager, shipment_manager, marketer, user |
| status | string | active, suspended, inactive |
| level | string | bronze, silver, gold, platinum, vip |
| is_active | boolean | Account active flag |
| allowedPartialPayment | number | Allowed partial payment % |
| usertype | string | e.g. warehouse-admin |
| store_id | string | Link to store (null to clear) |
| permissions | string[] | Legacy permission names array |

**Response:** Returns the updated user (same shape as Get User by ID).

---

### 7. Edit User Permissions

```
PATCH /distribution/user-management/:id/permissions
```

Replaces all permissions for a user with the provided set. Uses `UserPermission` (database) and keeps `User.permissions` (legacy array) in sync.

**Request body:**
```json
{
  "permissionIds": ["permission-id-1", "permission-id-2"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| permissionIds | string[] | Yes | Array of Permission IDs from the Permission table. Empty array clears all permissions. |

**Response:** Returns the updated user (same shape as Get User by ID).

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Dashboard (analysis + 10 recent) | GET | `/distribution/user-management` |
| All users (paginated, filtered, analysis) | GET | `/distribution/user-management/all` |
| Onboard warehouse admin | POST | `/auth/warehouse/onboard-warehouse-admin` |
| Get all permissions | GET | `/distribution/user-management/permissions` |
| Create permission | POST | `/distribution/user-management/permissions` |
| Edit permission | PATCH | `/distribution/user-management/permissions/:permissionId` |
| Delete permission | DELETE | `/distribution/user-management/permissions/:permissionId` |
| Get user by ID (full profile + permissions) | GET | `/distribution/user-management/:id` |
| Edit user | PATCH | `/distribution/user-management/:id` |
| Edit user permissions | PATCH | `/distribution/user-management/:id/permissions` |
