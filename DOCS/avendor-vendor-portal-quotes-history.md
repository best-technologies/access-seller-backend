# Vendor Portal — Quotes history (contract)

HTTP surface: [`src/avendors/vendor-portal/quotes-history/vendor-quotes-history.controller.ts`](src/avendors/vendor-portal/quotes-history/vendor-quotes-history.controller.ts).

**Base path:** `/api/v1/vendor/quotes-history`.

Quotes are **`AvendorVendorQuote`** rows **`vendorId`**-scoped (**`:quoteId` is quote row cuid, not quoteNumber**).

**Visibility rule:** statuses included = **`submitted`, `accepted`, `rejected`, `withdrawn`** — **`draft` excluded** deliberately ([`HISTORY_STATUSES`](src/avendors/vendor-portal/quotes-history/vendor-quotes-history.service.ts)).

---

## List

### Quotes history list

- **GET** `/`

**Query** ([`ListVendorQuoteHistoryQueryDto`](src/avendors/vendor-portal/quotes-history/dto/list-quotes-history-query.dto.ts)):

| Param | Default | Rules |
|--------|---------|--------|
| `page` | `1` | |
| `limit` | `20` | 1–100 |
| `search` | — | optional min 1; **`quoteNumber`**, **`rfq.rfqNumber`**, **`rfq.title`** case-insensitive |
| `view` | `all` | **`all`** — any `HISTORY_STATUSES`; **`awarded`** — only **`accepted`**; **`pending`** — only **`submitted`** awaiting admin |

Ordering: **`submittedAt desc`**, then **`createdAt desc`**.

**Success `200`:**

- **`data`** = shaped row array (RFQ teaser, totals, badges, **`order`** stage preview when awarded, etc.—see **`shapeHistoryRow`** in service).

- **`meta`** merges standard pagination **`{total,page,limit,totalPages,hasNextPage,hasPrevPage}`** **plus**:

```json
"tabs": {
  "all": 0,
  "awarded": 0,
  "pending": 0,
  "rejected": 0,
  "withdrawn": 0
}
```

Counts aggregated **without** respecting current `search`/`view` filter (global chip totals for vendor-owned history-status quotes).

---

## Detail

### Quote detail overview

- **GET** `/:quoteId`

Validates **`quoteId`** belongs to **`vendorId`**.

Loads RFQ (+ items attachments), **`paymentPlan`**, ordered **`lines`**, **`order`** row.

**Lazy order creation:** Accepted quotes (**`accepted`**) lazily **`ensureOrderForAcceptedQuote`** when missing (**unique `(quoteId)`** race-safe retry).

Returned payload includes **`displayStatus`**, **`itemRows`** keyed per RFQ line with accepted/rejected tiers, approvals summary scaffolding—see **`getHistoryDetail`** return object in service (~`Quote detail retrieved` payload).

404 when quote not owned / missing.

---

## Fulfillment timeline

Endpoints require quote **`status === accepted`** (award to this supplier).

### Fetch fulfillment timeline

- **GET** `/:quoteId/fulfillment`
- Loads order (creates **`AvendorVendorOrder`** at **`stage: created`** if absent, same helper as detail), builds **`timeline`** (**stages + payment milestones** mixing stage/payment pseudo entries), attaches **`payments[]`**, **`totals`** (**`totalQuoted`**, **`totalApproved`**, **`outstanding` clamp ≥0**, currency).

Errors:

- **`400`** **`Order fulfillment is only available for awarded quotes`** otherwise.

---

### Advance fulfillment stage

- **PATCH** `/:quoteId/fulfillment/stage`
- **JSON** [`UpdateVendorFulfillmentStageDto`](src/avendors/vendor-portal/quotes-history/dto/update-fulfillment-stage.dto.ts):
  - **`stage`**: **`in_production`** \| **`in_transit`** \| **`delivered`** (enum excludes **`created`**/`cancelled` — admins own cancel).
  - **`note`** optional ≤500 trims; **persisted overwrite** merges with `.trim() || order.note` (**null note not wiped** explicitly—see [`updateFulfillmentStage`](src/avendors/vendor-portal/quotes-history/vendor-quotes-history.service.ts) patch merging).

Guards ([`updateFulfillmentStage`](src/avendors/vendor-portal/quotes-history/vendor-quotes-history.service.ts)):

| Condition | Effect |
|-----------|--------|
| Quote not **`accepted`** | **400** |
| Order **`cancelled`** | **409** |
| Already **`delivered`** | **409** |
| New stage index **≤** current index in **`STAGE_ORDER`** (**no backward**, **no staying on same**) | **400** |

Allowed vendor targets are only **`in_production` \| `in_transit` \| `delivered`** (DTO). Internal order baseline can be **`created`**. **`STAGE_ORDER`:** `created → in_production → in_transit → delivered`. Because **`assertForwardTransition`** only requires **`nextIdx > currIdx`**, the vendor **may skip** intermediates (**e.g. `created → delivered`** is valid).

Timestamp side-effects (`productionStartedAt`, `shippedAt`, `deliveredAt`) stamped `now` when entering relevant stages missing prior values.

---

## Route summary

| Method | Path |
|--------|------|
| GET | `/api/v1/vendor/quotes-history` |
| GET | `/api/v1/vendor/quotes-history/:quoteId` |
| GET | `/api/v1/vendor/quotes-history/:quoteId/fulfillment` |
| PATCH | `/api/v1/vendor/quotes-history/:quoteId/fulfillment/stage` |

---

## Mirror checklist

1. **History excludes `draft`**; still-submitted-but-not-visible-as-draft handled via quote-requests UX.
2. **List meta.tabs** ignores search filter (distinct from page `total`).
3. **Fulfillment gated on `accepted`**, not arbitrary statuses.
4. **Stage PATCH** forbids regressions & equality; **`cancelled`** only admin-side narrative.
5. **`:quoteId` always internal quote id.**
