# Vendor Portal — Profile (contract)

HTTP surface: [`src/avendors/vendor-portal/profile/vendor-profile.controller.ts`](src/avendors/vendor-portal/profile/vendor-profile.controller.ts).

**Base path:** `/api/v1/vendor/profile`.

All operations use the authenticated portal **`userId`** / linked **`vendorId`** in services.

---

## Profile aggregate

### Get profile

- **GET** `/api/v1/vendor/profile`

**Success `200`** — `data`:

| Block | Notes |
|--------|--------|
| `user` | `id`, `email`, `firstName`, `lastName`, `phone`, `displayPicture`, `companyPosition` (camelCase map from [`vendor-profile.service.ts`](src/avendors/vendor-portal/profile/vendor-profile.service.ts)) |
| `company` | Full `AvendorVendor` headline: `name`, `email`, `phone`, address fields, **`status`**, **`complianceStatus`**, KPIs (`rating`, `totalOrders`, `totalSpend`), timestamps |
| `bank` | Single bank row or **`null`** |
| `compliance.documents[]` | All vendor documents with **`imageUrl`**, **`status`**, **`expiresAt`**, etc. |
| `security` | `{ hasPassword }` derived from **`user.password`** non-null (**hash never returned**) |
| `profileCompletion` | Same shape computed for dashboard banner (`completionPercent`, **`missingItems`**, **`completedItems`**, weighted rules in [`vendor-profile-completion.constants`](src/avendors/vendor-portal/profile/vendor-profile-completion.constants.ts)) |

**404:** missing supplier row or portal user row.

---

## Company

### Update company

- **PATCH** `/company`
- **JSON** partial [`UpdateVendorCompanyDto`](src/avendors/vendor-portal/profile/dto/update-company.dto.ts): `name`, `industry`, `phone`, `address`, `city`, `country`.

Must include **≥1 field** (**400** *Provide at least one company field to update*). If `name` is sent it must be **non-empty** after validation.

Empty strings trimmed to **`null`** where transform applies (`industry`/address fields nullable).

**Not editable:** company **`email`** — remains from linked `AvendorVendor` / onboarding; login email stays on **`User`** (dashboard shows user email separately).

---

## Bank

### Upsert bank

- **PUT** `/bank`
- **JSON** [`UpsertVendorPortalBankDto`](src/avendors/vendor-portal/profile/dto/upsert-bank.dto.ts): `bankName` (≤200), `accountNumber` (≤30), `accountName` (≤200). **Required every call** (full overwrite semantics).

---

### Delete bank

- **DELETE** `/bank`
- **404** if no bank row.
- **Success `200`:** `data` ≈ `{ vendorId }`.

---

## Compliance documents

**Folder / MIME** ([`vendor-profile-compliance.service.ts`](src/avendors/vendor-portal/profile/services/vendor-profile-compliance.service.ts)): uploads to `avendors/vendors/documents`; allowed **JPEG, PNG, WebP, PDF**. **`FileValidationInterceptor`** still allows jpeg/png/**pdf**/docx globally — docx reaches service only to be rejected unless type matches.

Multipart field name **`image`**.

Upload sets `documentType` **uppercased**, initial **`pending`** status, optional **`expiresAt`**. After mutations, **`recomputeCompliance`** runs unless admin **`complianceOverride`** blocks — same rollup as admin/vendor visibility.

---

### Upload document

- **POST** `/compliance/documents`
- **multipart**: `documentType` (≤50), `label` (≤200), optional **`expiresAt`** ISO, file **`image`** **required**.
- **Success `201`:** raw document row (`AvendorVendorDocument`).

---

### Update document

- **PATCH** `/compliance/documents/:docId`
- **multipart**: optional `documentType`, `label`, `expiresAt`; optional **`image`**.
- Require **≥1 meta field OR new file** or **400**.
- New **`image`** ⇒ status reset **`pending`**; deletes old blob after successful save.
- **Success `200`:** updated row.

---

### Delete document

- **DELETE** `/compliance/documents/:docId`

---

## Security

### Change password

- **POST** `/security/change-password`
- **JSON** [`ChangeVendorPasswordDto`](src/avendors/vendor-portal/profile/dto/change-password.dto.ts):
  - `currentPassword`
  - `newPassword` — min **8**, must satisfy [`PASSWORD_POLICY_REGEX`](src/avendors/vendor-portal/profile/dto/change-password.dto.ts) (lower + upper + allowed special chars)
  - `confirmNewPassword` — **must equal** `newPassword` (**400** if not)
  - New must differ from current (**400**)
- **401** if current Argon verify fails.
- **400** if user has **`password`** null (SSO/no password path).
- **Success `200`:** `data` ≈ `{ id: userId }`.

---

## Route summary

| Method | Path |
|--------|------|
| GET | `/api/v1/vendor/profile` |
| PATCH | `/api/v1/vendor/profile/company` |
| PUT | `/api/v1/vendor/profile/bank` |
| DELETE | `/api/v1/vendor/profile/bank` |
| POST | `/api/v1/vendor/profile/compliance/documents` |
| PATCH | `/api/v1/vendor/profile/compliance/documents/:docId` |
| DELETE | `/api/v1/vendor/profile/compliance/documents/:docId` |
| POST | `/api/v1/vendor/profile/security/change-password` |

---

## Mirror checklist

1. **`GET /vendor/profile`** is the only endpoint returning **`profileCompletion`** + **`security.hasPassword`** + nested cards.
2. **Bank PUT** replaces the whole triple (not partial PATCH).
3. **Compliance PATCH** resets **`pending`** on file swap; rollup respects **`complianceOverride`** flag on supplier.
4. **Password**: confirm match + regex policy + Argon verification.
