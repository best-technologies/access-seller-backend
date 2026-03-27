# Access Sellr Backend — project handbook

Use this document as context when working in Cursor or onboarding. It describes what this codebase is, how it is structured, and how new verticals (like **vendors**) should align with existing patterns.

---

## About the project

**Access Sellr** started as the backend for an e‑commerce / publishing marketplace: stores onboard, list books and related products, customers order, Paystack handles payments, and an **admin** area manages catalog, orders, customers, referrals, depots, and ops.

The operating company does **more than publishing** (e.g. electronics distribution). To avoid running many under‑utilized backends while keeping boundaries clear (and leaving room to split into microservices later), **feature verticals live as separate NestJS module trees** inside this single deployable API.

**Current verticals in this repo:**

| Area | Nest path | Role |
|------|-----------|------|
| Core marketplace | `admin/`, `products/`, `order/`, `user/`, `discount/`, `public/` | Publishing e‑commerce: catalog, orders, customers, referrals, storefront‑facing public APIs |
| Payments | `paystack/`, `paystack/webhook/` | Paystack integration and webhooks |
| Electronics / warehouse distribution | `distribution/` | Consignments from suppliers, stock (`DistributionProduct`), invoicing to bulk buyers, warehouse user management |
| Cross‑cutting | `auth/`, `prisma/`, `shared/`, `shared/audit/` | Auth, DB, storage (S3/Cloudinary), audit |

The API title in Swagger is **Access Sellr API**; the npm package name may still say `sm-backend` — treat that as legacy naming.

---

## Tech stack

- **Runtime:** Node.js  
- **Framework:** NestJS 11  
- **Database:** PostgreSQL via **Prisma** (`prisma/schema.prisma`)  
- **Auth:** JWT (`@nestjs/jwt`, Passport JWT strategy), global `JwtGuard` on protected routes  
- **Validation:** `class-validator` / `class-transformer`, global `ValidationPipe` (whitelist on)  
- **Docs:** Swagger at `/api/docs` (global route prefix does **not** apply to Swagger; see below)  
- **File uploads:** Multer (memory storage), Cloudinary / S3 via `SharedModule`  

---

## API conventions

- **Global prefix:** All HTTP routes (except Swagger) are under **`/api/v1`** (see `main.ts`).  
  Example: `AuthController` is `@Controller('auth')` → **`/api/v1/auth/...`**.  
- **Swagger:** Mounted at **`/api/docs`** (explicitly outside the global prefix).  
- **CORS:** Enabled broadly (`origin: '*'`) with credentials.  
- **Typical auth:** `Authorization: Bearer <jwt>` after login/register flows in `auth/auth.controller.ts`.  
- **Roles:** `UserRole` enum in Prisma (`super_admin`, `admin`, `inventory_manager`, `shipment_manager`, `marketer`, `user`). `RolesGuard` + `@Roles()` can restrict handlers. Distribution also uses **`usertype`** (e.g. `warehouse-admin`) for warehouse staff (see `distribution/user-management/README.md`).

---

## How modules are organized

- **`AppModule`** (`src/app.module.ts`) imports top‑level feature modules. New verticals are registered here (same pattern as `DistributionModule`).  
- **`distribution/`** is the reference pattern for a **business vertical**: a parent `distribution.module.ts` imports and re‑exports submodules (`consignment`, `stock`, `invoicing`, `dashboard`, `homepage`, `user-management`). Controllers use a **URL namespace**, e.g. `@Controller('distribution/consignment')` → `/api/v1/distribution/consignment`.  
- **`admin/`** is another large subtree: dashboard, products, orders, customers, referrals, metadata (categories, depots), cron, config.  
- **`auth/`** is **shared** across all clients (admin app, storefront, distribution UI). It is **not** duplicated inside `distribution/`; distribution controllers import `JwtGuard` from `src/auth/guard`.  
- **`shared/`** exports storage and shared services; feature code imports DTOs and helpers from `src/shared/...` as needed.

---

## Data model (high level)

Prisma schema mixes:

1. **E‑commerce / publishing:** `Store`, `User`, `Product`, `Order`, cart, affiliates, referrals, depots, etc.  
2. **Distribution (electronics):** From `Consignment` onward in the schema — consignments (with **supplier** fields inline: `supplierName`, bank details, payment totals), `DistributionProduct`, stock movements, `BulkOrder`, `Invoice` / `InvoiceItem` / `InvoicePayment`, documents, etc.

So **“supplier” data already appears** on consignments (manufacturer / bank / payment fields). A dedicated **vendors** product may introduce **normalized** tables (e.g. `Vendor`, `VendorContact`, `PurchaseOrder`, `VendorPayment`, `VendorReceipt`) if you need CRM‑style supplier master data, payment history, and receipts **beyond** what consignment rows store — or it may orchestrate reporting/APIs over existing models. That is a product/schema decision; the **module layout** can proceed either way.

---

## Local setup

1. **Requirements:** Node.js (match project’s LTS), PostgreSQL, `npm install`.  
2. **Environment:** Copy and fill `.env` — at minimum `DATABASE_URL`, `JWT_SECRET`, and any mail/storage keys your features need. Prisma loads via `config` + `prisma/use-env.js` for migrations/generate.  
3. **Database:** `npm run prisma:generate` and `npm run prisma:migrate` (see `package.json` scripts; `build` runs generate + migrate + compile).  
4. **Run dev:** `npm run start:dev` (default port from `PORT` or `3000` in config).  
5. **Prisma Studio:** `npm run prisma:studio`  

---

## Adding a **vendors** vertical (recommended alignment)

You are on the **right path** if you mean:

1. **`src/vendors/`** — New folder with `vendors.module.ts` that **aggregates** submodules (`vendors-auth` is optional naming; see below), suppliers, payments, receipts, reports, etc.  
2. **Register** `VendorsModule` in `AppModule` next to `DistributionModule`.  
3. **Use a clear URL prefix**, e.g. `@Controller('vendors/...')` → `/api/v1/vendors/...`, mirroring `distribution/...`.  
4. **Reuse global auth** — Do **not** copy the full `AuthModule` into `vendors/`. Prefer:  
   - Same JWT login/register endpoints under `/api/v1/auth`, **or**  
   - Thin **vendors‑specific** controllers only if you need separate onboarding (e.g. `POST /vendors/auth/register`) that still call `AuthService` / shared guards.  
5. **Authorization:** Use `JwtGuard` + `RolesGuard` and/or `usertype` / permissions (`UserPermission`) the same way distribution protects warehouse routes.  
6. **Prisma:** Add models/migrations for vendor‑specific persistence; keep related files under `prisma/migrations/`.  
7. **Microservices later:** This layout maps cleanly to “one service per vertical” because boundaries are already by folder and route prefix; extraction is mostly packaging and shared libs, not a rewrite.

**Naming note:** The repo uses **distribution** for the electronics warehouse flow. **Vendors** as a name for “people we buy from” is clear; if the team confuses it with “store vendors” in marketplace language, alternatives are `procurement` or `supplier-portal` — pick one glossary and stick to it in routes and docs.

---

## Useful paths for navigation

| Purpose | Location |
|---------|----------|
| App bootstrap, prefix, Swagger | `src/main.ts` |
| Module registration | `src/app.module.ts` |
| JWT / login / store onboard | `src/auth/` |
| Distribution aggregate | `src/distribution/distribution.module.ts` |
| Distribution API examples | `src/distribution/*/controllers` |
| Prisma schema | `prisma/schema.prisma` |
| Env validation | `src/app.module.ts` (Joi) + `src/config/` |

---

## Cursor / AI usage

When asking for changes, specify:

- Vertical: **admin**, **distribution**, **marketplace**, or **vendors** (once added).  
- Whether the route is **public** or needs **`JwtGuard`** / **roles**.  
- Whether data is **new Prisma models** or **extends** existing `Consignment` / payment flows.

This file is the intended **single** high‑level map; deeper API details for distribution user management live in `src/distribution/user-management/README.md`.
