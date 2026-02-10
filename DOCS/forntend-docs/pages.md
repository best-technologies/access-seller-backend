Here’s your `PAGES.md` file written in clean Markdown format—structured so **Cursor or any dev can follow step-by-step** while building the pages.

---

```markdown
# 📄 Pages Specification – E-commerce Platform (SmartEduBooks)

This document outlines **all user-facing and admin-facing pages** needed for the project, covering MVP and future features.

---

## 👤 USER-FACING PAGES

### 🏠 General Pages

| Page        | Path          | Description                                  |
|-------------|---------------|----------------------------------------------|
| Homepage    | `/`           | Landing page: products, categories, referrals, etc. |
| About       | `/about`      | Optional: About the company, mission, vision. |
| Contact     | `/contact`    | Optional: Contact form, support details.     |
| FAQs        | `/faq`        | Optional: Answers to common questions.       |

---

### 🔐 Auth Pages

| Page              | Path                 | Description                                |
|-------------------|----------------------|--------------------------------------------|
| Login             | `/login`             | User login page.                           |
| Register          | `/register`          | Sign up with referral code support.        |
| Forgot Password   | `/forgot-password`   | Request reset link via email.              |
| Reset Password    | `/reset-password`    | Set new password from email token.         |

---

### 🛍️ Shopping Pages

| Page              | Path                | Description                                |
|-------------------|---------------------|--------------------------------------------|
| All Products      | `/products`         | Product listing with filters/search.       |
| Single Product    | `/products/[slug]`  | Product details, price, and "Add to Cart". |
| Cart              | `/cart`             | View and manage items in cart.             |
| Checkout          | `/checkout`         | Input address, pay with gateway.           |
| Order Success     | `/order-success`    | After successful payment.                  |
| Order Cancelled   | `/order-cancelled`  | If payment was cancelled or failed.        |

---

### 📦 Orders & Tracking

| Page           | Path               | Description                                |
|----------------|--------------------|--------------------------------------------|
| My Orders      | `/orders`          | List of all past orders by user.           |
| Order Details  | `/orders/[id]`     | View specific order and track status.      |

---

### 💰 Referral System

| Page                 | Path                     | Description                                |
|----------------------|--------------------------|--------------------------------------------|
| Referral Dashboard   | `/referrals`             | See referral code/link, stats, earnings.   |
| Referral Settings    | `/referrals/settings`    | Optional: Edit code or payout options.     |

---

### 🙍‍♂️ Account & Profile

| Page                  | Path               | Description                                |
|-----------------------|--------------------|--------------------------------------------|
| Account Settings      | `/account`         | Change name, email, password.              |
| Notifications (opt.)  | `/account/notifications` | Toggle referral/order alerts.         |

---

## 🛠️ ADMIN PAGES

### 🔐 Auth

| Page         | Path           | Description                                |
|--------------|----------------|--------------------------------------------|
| Admin Login  | `/admin/login` | Secure login for admin/staff only.         |

---

### 📊 Dashboard

| Page         | Path       | Description                                |
|--------------|------------|--------------------------------------------|
| Dashboard    | `/admin`   | Overview: orders, top users, metrics.      |

---

### 📚 Product Management

| Page              | Path                          | Description                                |
|-------------------|-------------------------------|--------------------------------------------|
| All Products      | `/admin/products`             | View all products with status toggle.      |
| Add Product       | `/admin/products/new`         | Upload new product, price, images, etc.    |
| Edit Product      | `/admin/products/[id]/edit`   | Update product details.                    |

---

### 👥 User & Marketer Management

| Page          | Path               | Description                                |
|---------------|--------------------|--------------------------------------------|
| All Users     | `/admin/users`     | View all users.                            |
| Marketers     | `/admin/marketers` | Filter users with referrals/earnings.      |

---

### 💸 Referrals & Commissions

| Page                 | Path                         | Description                                |
|----------------------|------------------------------|--------------------------------------------|
| Referral Payouts     | `/admin/referrals`           | Track commissions, mark payouts.           |
| Referral Settings    | `/admin/referrals/settings`  | Set % commission, enable multi-level.      |

---

### 📦 Order Management

| Page           | Path                 | Description                                |
|----------------|----------------------|--------------------------------------------|
| All Orders     | `/admin/orders`      | List all orders by status/date.            |
| Order Details  | `/admin/orders/[id]` | Fulfillment, status updates.               |

---

### ⚙️ System Settings (Optional)

| Page              | Path               | Description                                |
|-------------------|--------------------|--------------------------------------------|
| General Settings  | `/admin/settings`  | Configure gateway keys, toggles, etc.      |

---

## 🚀 MVP PRIORITY PAGES

### ✅ User MVP
- `/`
- `/products`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/referrals`
- `/orders`
- `/login`
- `/register`

### ✅ Admin MVP
- `/admin/login`
- `/admin`
- `/admin/products`
- `/admin/products/new`
- `/admin/orders`
- `/admin/referrals`

---

> This file is used to guide the entire project build and can be expanded as new features are prioritized.
```

---

✅ **Ready to copy-paste into `docs/PAGES.md` or your main project repo.**
Let me know when you're ready for component structure, database modeling, or full route protection.
