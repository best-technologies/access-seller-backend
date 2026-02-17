# Warehouse & Inventory Admin

This module handles onboarding and managing warehouse admins. Use it together with the permissions endpoints to assign specific capabilities when creating or updating users.

---

## Base URL

All endpoints use the API prefix: **`/api/v1`**

---

## Warehouse Admin Endpoints

### Onboard New Warehouse Admin

```
POST /api/v1/auth/warehouse/onboard-warehouse-admin
```

**Auth:** Required (JWT Bearer token)

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

| Field        | Type   | Required | Description                                                       |
|-------------|--------|----------|-------------------------------------------------------------------|
| first_name  | string | Yes      | First name                                                        |
| last_name   | string | Yes      | Last name                                                         |
| email       | string | Yes      | Unique email                                                      |
| phone_number| string | No       | Phone number                                                      |
| password    | string | No       | Min 6 chars. If omitted, a temporary password is generated and returned |

**Response:** Returns the created user with `role: admin` and `usertype: warehouse-admin` (hardcoded server-side, not sent from frontend). If no password was provided, `temporaryPassword` is included in the response.

---

## Permissions Endpoints

These endpoints live under the **admin/customers** module. Use them to retrieve available permissions and assign them to warehouse admins (or any user).

### 1. Retrieve Available Permissions (Categorized)

```
GET /api/v1/admin/customers/permissions/categorized
```

**Auth:** Required (JWT Bearer token)

**Response:** Returns permissions grouped by category (products, orders, shipments, inventory, etc.) with id, name, displayName, and description for each.

**Example response:**
```json
{
  "success": true,
  "message": "Categorized permissions retrieved successfully",
  "data": {
    "categorizedPermissions": {
      "products": [
        { "id": "...", "name": "edit product", "displayName": "Edit Product", "description": "..." },
        { "name": "manage inventory", "displayName": "Manage Inventory", ... }
      ],
      "shipments": [...],
      "orders": [...]
    },
    "categories": ["products", "orders", "shipments", ...],
    "totalPermissions": 45
  }
}
```

### 2. Retrieve Available Permissions (Flat List)

```
GET /api/v1/admin/customers/permissions/flat
```

**Auth:** Required (JWT Bearer token)

**Response:** Returns a flat array of all permission names (e.g. `["edit product", "manage inventory", "view order", ...]`).

### 3. Add or Update User Permissions

```
PATCH /api/v1/admin/customers/edit/:userId
```

**Auth:** Required (JWT Bearer token)

**Params:** `userId` – the user's ID (from onboard response or elsewhere)

**Request body:** Include `permissions` with the full list of permission names you want the user to have. This **replaces** any existing permissions.

```json
{
  "permissions": [
    "view product",
    "edit product",
    "manage inventory",
    "view order",
    "process order",
    "view shipment",
    "track shipment"
  ]
}
```

You can also update other user fields in the same request (first_name, last_name, email, role, status, etc.).

---

## Onboarding Workflow: Warehouse Admin with Permissions

**Step 1 – Onboard the warehouse admin**
```
POST /api/v1/auth/warehouse/onboard-warehouse-admin
Body: { first_name, last_name, email, phone_number?, password? }
```
→ Returns the new user with `id`.

**Step 2 – (Optional) Fetch available permissions**
```
GET /api/v1/admin/customers/permissions/categorized
```
→ Use the response to build the permissions list for the UI or API.

**Step 3 – Assign permissions**
```
PATCH /api/v1/admin/customers/edit/:userId
Body: { permissions: ["view product", "manage inventory", "edit order", ...] }
```
→ Permissions are set for the warehouse admin.

---

## Permission Categories & Examples

Permissions are grouped into categories such as:

| Category   | Example Permissions                                  |
|------------|------------------------------------------------------|
| products   | view product, edit product, create product, manage inventory |
| orders     | view order, edit order, process order, cancel order  |
| shipments  | view shipment, edit shipment, create shipment, track shipment |
| customers  | view customer, edit customer, create customer        |
| categories | view category, edit category, create category        |
| reports    | view reports, export reports, generate reports       |
| settings   | view settings, edit settings, manage system          |

Use `GET /api/v1/admin/customers/permissions/categorized` for the full list.
