# Vendor Portal — Dashboard (contract)

HTTP surface: [`src/avendors/vendor-portal/dashboard/vendor-dashboard.controller.ts`](src/avendors/vendor-portal/dashboard/vendor-dashboard.controller.ts).

**Base path:** `/api/v1/vendor/dashboard` ([`vendor-dashboard.controller.ts`](src/avendors/vendor-portal/dashboard/vendor-dashboard.controller.ts) + global prefix `api/v1` from `main.ts`).

All operations scope to the authenticated **linked supplier** (`vendorId` from portal context in the implementation).

---

## Summary

### Get dashboard summary

- **GET** `/api/v1/vendor/dashboard/summary`

**Query**

| Param | Default | Rules |
|--------|---------|--------|
| `recentQuoteLimit` | `5` (service default when omitted; DTO omit = undefined) | optional int **1–20** (validated in [`DashboardSummaryQueryDto`](src/avendors/vendor-portal/dashboard/dto/dashboard-query.dto.ts)); service clamps **1–20** inclusive |

**Success `200`** — `data` is a **built summary object** (not raw Prisma models):

| Block | Contents |
|--------|-----------|
| `kpis` | `activeQuoteRequests` — RFQ assignments whose RFQ is `sent` or `awaiting_selection`; `acceptedQuotes` — RFQs **awarded** to this supplier (`AvendorRfq.awardedVendorId`, status `awarded`); `totalInventory` — count of `AvendorVendorInventoryMaterial` rows; `totalApprovedPayment` — `{ amount, currency: 'NGN' }` summed from **`approved`** vendor payment approvals |
| `profileBanner` | `completionPercent`, `missingItems`, `completedItems`, `message`, `ctaLabel` (derived from weighted profile-completion rules shared with Profile aggregate) |
| `recentQuoteRequests` | Slice of RFQ assignments (newest assignment first): `rfqId`, `reference` (RFQ number), `title`, `itemsCount`, `expectedDelivery`, `submissionDeadline`, `status`, `sentAt` |
| `greeting` | `firstName`, `lastName` (portal user), `companyName` (supplier name) |

---

## Route summary

| Method | Path |
|--------|------|
| GET | `/api/v1/vendor/dashboard/summary` |

---

## Mirror checklist

1. **Recent RFQs**: pool is assignments where RFQ status is **`sent`**, **`awaiting_selection`**, or **`awarded`** (different from KPI “active” which excludes `awarded`).
2. **KPI semantics**: replicate counts from `AvendorRfqVendor` + `AvendorRfq` + inventory + approvals as above.
3. **Profile banner** aligns with **`GET /vendor/profile`** completion logic.
