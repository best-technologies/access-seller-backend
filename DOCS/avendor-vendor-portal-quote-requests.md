# Vendor Portal — Quote requests (contract)

HTTP surface: [`src/avendors/vendor-portal/quote-requests/vendor-quote-requests.controller.ts`](src/avendors/vendor-portal/quote-requests/vendor-quote-requests.controller.ts).

**Base path:** `/api/v1/vendor/quote-requests`.

**Route ordering:** **`GET …/payment-plans`** registered **before** **`GET …/:rfqId`** so the literal segment is never captured as `rfqId`.

---

## List behaviour (shared constraints)

Assignments where:

- **`vendorId`** matches portal supplier **and**
- RFQ **`status`** is **`sent`** or **`awaiting_selection`** (see [`QUOTABLE_RFQ_STATUSES`](src/avendors/vendor-portal/quote-requests/vendor-quote-requests.service.ts)).

**Query** ([`ListVendorQuoteRequestsQueryDto`](src/avendors/vendor-portal/quote-requests/dto/list-quote-requests-query.dto.ts)):

| Param | Default | Rules |
|--------|---------|--------|
| `page` | `1` | 1–… |
| `limit` | `20` | 1–100 |
| `search` | — | optional min 1; RFQ **`title`** or **`rfqNumber`** case-insensitive |
| `view` | `active` | **`open`** — hide rows where supplier already has a **`submitted`** or **`accepted`** quote; **`submitted`** — only rows with a **`submitted`** quote for this supplier; **`active`** (`default`) — no extra vendor-quote predicate |

Ordering: **`AvendorRfqVendor.createdAt` desc**.

**Success `200`:** `data` = **array** shaped list rows (**`shapeListRow`** → `assignmentId`, `rfqId`, `reference`, `title`, …, `myQuote` summary including optional `paymentPlan`).

**Pagination:** root **`meta`**: `{ total, page, limit, totalPages, hasNextPage, hasPrevPage }`.

---

## Catalog (payment plans dropdown)

### List active payment plans

- **GET** `/payment-plans`
- **Implementation note:** Handler does **not** pass `vendorId`; returns **globally active** **`AvendorPaymentPlan`** rows (ordered **`sortOrder`**, then **`name`**).
- Fields: **`id`, `name`, `code`, `description`, `netDays`, `sortOrder`**.

---

## Detail

### Get quote-request detail

- **GET** `/:rfqId`
- **`:rfqId`** = **`AvendorRfq.id`** (internal cuid).

404 if RFQ missing or **`AvendorRfqVendor`** assignment missing.

**Success `200`** — `data`:

| Key | Meaning |
|-----|---------|
| `rfq` | Trimmed headline + `attachments` list + **`expectedDelivery`** maps `dueDate`; **`submissionDeadline`** falls back to `dueDate` when null |
| `items[]` | RFQ lines + flattened first image URL helper + attachments |
| `summary` | `totalItems`, `totalAmount` computed as **`sum(budget × quantity)`**, hard-coded **`currency: 'NGN'`** |
| `quote` | `null` until supplier has quote row; otherwise **`shapeQuote`** payload |

---

## Submit / refresh quote body

[`SubmitVendorQuoteDto`](src/avendors/vendor-portal/quote-requests/dto/submit-quote.dto.ts):

| Field | Rules |
|--------|--------|
| `lines` | min **1**; each line needs **`rfqItemId`** belonging to target RFQ, optional `position`, `quality`, `possibleDeliveryAt` ISO date, **`pricePerUnit` ≥ 0**, optional **`totalPrice`** (omit ⇒ **`pricePerUnit × rfq_item.quantity`**), optional `note` |
| `note` | optional quote-level ≤2000 |
| `currency` | optional ISO code ≤8; defaults **NGN** (and existing currency on update) |
| **`paymentPlanId`** | optional `string` \| **`null`** — see semantics below |

**Payment plan semantics** ([`buildPaymentPlanPatchForSubmit`](src/avendors/vendor-portal/quote-requests/vendor-quote-requests.service.ts)):

- **First submit** (`existingQuote === null`): `undefined` / omitted ⇒ **explicitly clears** FK fields (`paymentPlanId`, `paymentPlanSetBy`, `paymentPlanSetAt` null).
- **`null`** ⇒ clears plan.
- **String id** ⇒ must reference **active** plan; stamps **`vendor`** setter + timestamps.
- **Resubmit**: **`undefined`/omit** ⇒ **omit** touching existing payment plan (**keep unchanged**).

---

### Submit quote (create / replace lines)

- **POST** `/:rfqId/quote`

Behaviour:

1. Loads RFQ **with assignment** validation (403-ish messaging when not invited).
2. **Blocks** edits when quote already **`accepted`** or **`rejected`** (**409** Conflict).
3. RFQ status must remain in **`sent`/`awaiting_selection`** or **400** (**`assertRfqQuotable`**).
4. Deletes old lines inside transaction then recreates (**full replace**) when updating.
5. Status forced **`submitted`**, resets **`withdrawnAt`**, sets **`submittedAt` now**.

**Side-effect:** First time any submission occurs while RFQ is **`sent`**, promote RFQ ⇒ **`awaiting_selection`** (**idempotent** if already awaiting).

Responses:

| Case | HTTP | Message gist |
|------|------|----------------|
| New quote | **201** | `Quote submitted` |
| Replacing draft previous row | **200** | `Quote updated` |

`data` = **`shapeQuote`**: flattened quote header + **`itemQuotes[]`** (grouped **`rfqItemId`**, **`prices`** sorted per `position`).

---

### Set payment plan only

- **PATCH** `/:rfqId/quote/payment-plan`
- **JSON:** [`SetVendorQuotePaymentPlanBodyDto`](src/avendors/shared/dto/set-vendor-quote-payment-plan.dto.ts) **`{ paymentPlanId: string | null }`** (validated string when non-null).
- Quote row must already exist (**404** instructs submit first).
- Same **accepted/rejected** guard + **`assertRfqQuotable`** like submit.
- **`null`** ⇒ disconnect FK and **clears `paymentPlanSetBy`/`paymentPlanSetAt`** (**vendor clears metadata** unlike admin PATCH which marks `admin`).
- Non-null ⇒ active plan lookup or **400**.

---

### Withdraw quote

- **DELETE** `/:rfqId/quote`

Rules:

- Must have existing vendor quote (**404** if none).
- Only **`status === submitted`** movable (**400** otherwise).
- Still requires RFQ **`assertRfqQuotable`**.
- Writes **`withdrawn`** + **`withdrawnAt`**.

**Success `200`:** **`shapeQuote`** showing withdrawn snapshot.

---

## Route summary

| Method | Path |
|--------|------|
| GET | `/api/v1/vendor/quote-requests` |
| GET | `/api/v1/vendor/quote-requests/payment-plans` |
| GET | `/api/v1/vendor/quote-requests/:rfqId` |
| POST | `/api/v1/vendor/quote-requests/:rfqId/quote` |
| PATCH | `/api/v1/vendor/quote-requests/:rfqId/quote/payment-plan` |
| DELETE | `/api/v1/vendor/quote-requests/:rfqId/quote` |

---

## Mirror checklist

1. **List filtering** only ever sees RFQs **`sent`/`awaiting_selection`** (+ assignment).
2. **Payment plan omission** behaves differently **first submit vs resubmit**.
3. **Side-effect RFQ promotion** on first **`sent` → awaiting_selection**.
4. **Payment-plan-only PATCH cannot run** before **`POST`** quote creation.
5. **Withdraw limited to `submitted`**, not drafts (draft rows live only pre-submit path).
