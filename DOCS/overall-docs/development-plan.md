Thanks for the reminder! Let’s continue from where we stopped and build out the **complete backend and frontend roadmap** phase-by-phase.

---

## ✅ GENERAL OVERVIEW

### 🛒 Core Features:

* Product listing (books)
* Unique slug-based product pages
* Referral system (referral link/code)
* Commission system (product-level or global)
* Marketer push rights (per product or global)
* Inventory tracking and alerts
* Commission payout timing options
* Manual referral code entry at checkout
* Bulk vs per-item commission logic
* Multi-level referral (toggleable)
* Shipping tracking and updates

---

## 📍 PHASED DEVELOPMENT ROADMAP

---

## ⚙️ BACKEND ROADMAP (NestJS + Prisma + PostgreSQL)

### ✅ PHASE 1: Project Setup & Core Modules

* [x] Initialize NestJS project
* [x] Install & configure Prisma with PostgreSQL
* [x] Define `.env` for DB and secrets
* [x] Generate modules:

  * `auth` (login, JWT, password hashing)
  * `users` (admin, marketers, buyers)
  * `products`
  * `referrals`
  * `orders`
  * `commissions`
  * `inventory`
  * `shipping`
* [x] Global auth guard using JWT strategy

---

### ✅ PHASE 2: Product & Inventory

* Product CRUD:

  * `title`, `slug`, `description`, `price`, `imageUrl`, `inventoryQty`
  * `productCommissionOverride` (nullable %)
* Inventory:

  * Automatically decrement on order
  * Replenishment function (manual)
  * Low stock alert service

---

### ✅ PHASE 3: User & Role Management

* Create roles: Admin, Marketer, Buyer
* RBAC: Restrict routes based on roles
* Admin panel endpoints to:

  * Grant marketers push rights
  * Set global commission percentage

---

### ✅ PHASE 4: Referral System

* Referral link = `product.slug + ?ref=code`
* Referral code generation per user
* Resolve referral at checkout via:

  * referral link
  * manually entered code
* Save referral data per order
* Track first-level and (if enabled) second-level referrals

---

### ✅ PHASE 5: Commission Logic

* Global commission setting (e.g., 10%)
* Product-level override (e.g., 5% on Book A)
* Admin toggle:

  * Commission on total basket vs per-item
  * When to pay: immediately vs delayed (X days)
* Commission table:

  * userId, orderId, amount, status, level (1/2)

---

### ✅ PHASE 6: Orders & Checkout

* Cart → Checkout → Order
* Order schema:

  * items\[], subtotal, total, referralCode, status
* Payment simulation (or real integration later)
* Associate order with commission/referral

---

### ✅ PHASE 7: Multi-Level Referral

* Admin toggle: enable/disable
* Store referral tree (basic two levels)
* Commission calculation logic for both levels
* Define 2nd-level commission percent (e.g., 2%)

---

### ✅ PHASE 8: Shipping & Fulfillment

* Order shipping info:

  * status: pending, shipped, delivered
  * tracking ID, carrier, history\[]
* Admin endpoints to update tracking
* Buyer can view shipping progress

---

### ✅ PHASE 9: Commission Payouts

* Admin panel: pending commissions
* Trigger payout: manual or auto (delayed logic)
* Mark as paid with timestamp

---

## 💻 FRONTEND ROADMAP (Next.js + Tailwind + Shadcn UI)

### ✅ PHASE 1: Project Setup

* Set up project with TailwindCSS + Shadcn UI
* Configure absolute imports, auth context
* Route structure:

  * `/` – homepage
  * `/product/[slug]` – product details
  * `/checkout` – cart + checkout
  * `/dashboard` – marketer dashboard
  * `/admin` – admin dashboard

---

### ✅ PHASE 2: Public Site

* Home page: list of products
* Product page:

  * Load via slug
  * Referral support via `?ref=CODE`
  * Add to cart
* Cart page: list items, enter referral code if any
* Checkout:

  * Collect details
  * Simulate payment
  * Show order confirmation

---

### ✅ PHASE 3: Authentication & Role-Based UI

* Auth (login/signup) flows
* Auth context with role detection
* Redirects for protected pages (admin, dashboard)

---

### ✅ PHASE 4: Marketer Dashboard

* See:

  * Allowed products
  * Referral links + stats
  * Commissions earned
* Copyable product URLs with embedded referral code

---

### ✅ PHASE 5: Admin Panel

* Product management (CRUD)
* Assign marketers to products or globally
* Set commissions
* View orders, referral stats, commissions
* Shipping updates
* Commission payout triggers

---

### ✅ PHASE 6: Shipping Tracker UI

* Buyer order history
* Shipping status view
* Admin update interface

---

## 🧠 OPTIONAL ENHANCEMENTS

* Webhooks for payment provider
* Notification system (email, Telegram)
* CSV export of commissions/orders
* Affiliate tier badges

---

Would you like me to generate a **Kanban-style checklist** (e.g. for Trello/Notion), or generate file structure and first few backend modules for you in code?
