# Vendor Portal — Inventory (contract)

HTTP surface: [`src/avendors/vendor-portal/inventory/vendor-inventory.controller.ts`](src/avendors/vendor-portal/inventory/vendor-inventory.controller.ts).

**Base path:** `/api/v1/vendor/inventory`.

**Distinct from admin:** This is supplier-scoped **`AvendorVendorInventoryCategory`** / **`AvendorVendorInventoryMaterial`** (per `vendorId`), **not** the admin shared catalogue (`/api/v1/avendor/inventory` → `AvendorMaterialCategory` / `AvendorMaterial`).

All routes use the authenticated supplier’s **`vendorId`** implicitly in the service.

---

## Domain model (Prisma)

### Category (`AvendorVendorInventoryCategory`)

Per vendor (`vendorId`): `name` (vendor-unique via case-insensitive check), optional `description`, **`skuPrefix`** (2–4 chars uppercase in schema usage; validated 2–5 upper A–Z in DTO on create/update), timestamps. Used to auto-issue SKUs for materials (`{skuPrefix}-{NNN}`).

### Material (`AvendorVendorInventoryMaterial`)

Per vendor: `sku` (**unique per vendor**), `name`, `unit`, optional `description`, `stock`, `reorderLevel`, `pricePerUnit`, optional image fields, FK `categoryId` (must belong to same vendor).

**Computed fields** in shaped responses (`shapeMaterial`): `status` (`in_stock` \| `low_stock` \| `out_of_stock`), `inventoryValue` = `stock × pricePerUnit` rounded.

---

## Categories

Paths under `/api/v1/vendor/inventory/categories`.

### Create category

- **POST** `/categories`
- **JSON body** ([`CreateVendorInventoryCategoryDto`](src/avendors/vendor-portal/inventory/dto/create-category.dto.ts)):

| Field | Required | Rules |
|--------|----------|--------|
| `name` | yes | 2–80 chars |
| `description` | no | max 500 |
| `skuPrefix` | no | omitted → derived from **`name`** (uppercase alphanumeric words / letters—see [`derivePrefixFromName`](src/avendors/vendor-portal/inventory/vendor-inventory.service.ts)); if provided → must match **`^[A-Z]{2,5}$`** after trim/toUpper |

- **Conflict:** duplicate category **`name`** for this vendor (case-insensitive).

- **Success `201`:** `data` = shaped category (`id`, `name`, `description`, `skuPrefix`, `materialsCount`, timestamps).

---

### List categories

- **GET** `/categories`

| Query | Default | Rules |
|--------|---------|--------|
| `page` | `1` | ≥ 1 |
| `limit` | `20` | 1–100 |
| `search` | — | optional; min length 1; substring on **`name`** (case-insensitive) |

Ordering: **`createdAt` desc**.

**Success `200`:** `data` = **array** of shaped categories; **root `meta`** = `{ total, page, limit, totalPages, hasNextPage, hasPrevPage }`.

---

### Get category

- **GET** `/categories/:id`
- Scoped to vendor.CUID `:id`.

---

### Update category

- **PATCH** `/categories/:id`
- **JSON:** partial [`UpdateVendorInventoryCategoryDto`](src/avendors/vendor-portal/inventory/dto/update-category.dto.ts) (`name`, `description`, `skuPrefix`).

---

### Delete category

- **DELETE** `/categories/:id`
- **400** if category still has materials.
- **Success `200`:** `data` ≈ `{ id, name }`.

---

## Materials

Paths under `/api/v1/vendor/inventory/materials`.

**Multipart** (`POST`, `PATCH` without `/stock`): `multipart/form-data`, optional file field **`image`**. **`FileValidationInterceptor`** allows jpeg/png/pdf/docx up to **20MB** per file ([`upload-limits.constants.ts`](src/shared/constants/upload-limits.constants.ts)); the service **[`IMAGE_MIMES`](src/avendors/vendor-portal/inventory/vendor-inventory.service.ts)** only accepts **JPEG, PNG, WebP** — **pdf/docx uploads pass the interceptor but fail service validation.**

---

### Create material

- **POST** `/materials`

Form fields correspond to [`CreateVendorInventoryMaterialDto`](src/avendors/vendor-portal/inventory/dto/create-material.dto.ts):

| Field | Required | Rules |
|--------|----------|--------|
| `name` | yes | 2–200 chars |
| `categoryId` | yes | belongs to vendor |
| `unit` | yes | max 50 |
| `sku` | no | omit → **`generateNextSku(vendorId, category.skuPrefix)`** `{PREFIX}-{pad 3 digits}`; if sent → **`^[A-Z0-9]{2,5}-\d{1,6}$`** after upper-case trim; **unique per vendor** |
| `description` | no | max 1000 |
| `stock` | no | int ≥ 0; default **0** |
| `reorderLevel` | no | int ≥ 0; default **10** |
| `pricePerUnit` | no | number ≥ 0; default **0** |

- **Success `201`:** `data` = shaped material (includes nested `category` summary).

---

### List materials

- **GET** `/materials`

| Query | Default | Rules |
|--------|---------|--------|
| `page` | `1` | ≥ 1 |
| `limit` | `20` | 1–100 |
| `search` | — | optional min 1; SKU / name / description (case-insensitive) |
| `categoryId` | — | vendor category id filter |
| `status` | — | **`in_stock`** \| **`low_stock`** \| **`out_of_stock`** — **actually applied** (`low_stock` / `in_stock` use raw SQL comparing `stock` vs `reorderLevel`) |
| `sortBy` | `createdAt` | `createdAt` \| `name` \| **`sku`** \| `stock` \| `pricePerUnit` |
| `sortOrder` | `desc` | `asc` \| `desc` |

**Success `200`:**

- `data`:

```json
{
  "summary": {
    "totalMaterials": 0,
    "totalCategories": 0,
    "totalStock": 0,
    "totalInventoryValue": 0,
    "totalUnitPriceSum": 0
  },
  "statusCounts": {
    "inStock": 0,
    "lowStock": 0,
    "outOfStock": 0
  },
  "items": []
}
```

- **`summary`** / **`statusCounts`** are computed over **all** materials for the vendor (not limited to filtered page).

- Root **`meta`**: `{ total, page, limit, totalPages, hasNextPage, hasPrevPage }` for **current filtered** list.

---

### Get material

- **GET** `/materials/:id`

---

### Update material

- **PATCH** `/materials/:id`
- Partial multipart + body; must send **≥1 field or an image**, else **400**.
- SKU change validates uniqueness; category change validates vendor ownership.
- Replacing **`image`** deletes previous storage asset then uploads.

---

### Adjust stock

- **PATCH** `/materials/:id/stock`
- **JSON** [`AdjustStockDto`](src/avendors/vendor-portal/inventory/dto/adjust-stock.dto.ts):

| Field | Rules |
|--------|--------|
| `action` | `increment` \| `decrement` \| `set` |
| `quantity` | int **`≥ 1`** for **`increment`** / **`decrement`** (`set` requires **`≥ 0`** to zero out) |
| `note` | optional max 255 |

- **Decrement** cannot drive stock negative.

---

### Delete material

- **DELETE** `/materials/:id`
- Removes image from storage when present.
- **Success `200`:** `data` ≈ `{ id, sku, name }`.

---

## Route summary

| Method | Path |
|--------|------|
| POST | `/api/v1/vendor/inventory/categories` |
| GET | `/api/v1/vendor/inventory/categories` |
| GET | `/api/v1/vendor/inventory/categories/:id` |
| PATCH | `/api/v1/vendor/inventory/categories/:id` |
| DELETE | `/api/v1/vendor/inventory/categories/:id` |
| POST | `/api/v1/vendor/inventory/materials` |
| GET | `/api/v1/vendor/inventory/materials` |
| GET | `/api/v1/vendor/inventory/materials/:id` |
| PATCH | `/api/v1/vendor/inventory/materials/:id` |
| PATCH | `/api/v1/vendor/inventory/materials/:id/stock` |
| DELETE | `/api/v1/vendor/inventory/materials/:id` |

---

## Mirror checklist

1. **Models:** use vendor-scoped Prisma tables, not admin `AvendorMaterial*`.
2. **Materials list**: nested **`data.summary`** + **`data.statusCounts`** + **`data.items`**; pagination **`meta` at root**.
3. **`status` filter** on list is real (unlike dormant admin `lowStock` param).
4. **SKU**: auto-generation uses category **`skuPrefix`** + zero-padded 3-digit sequence.
5. **Images**: multipart field name **`image`**; MIME mismatch between interceptor and service for non-image types.
