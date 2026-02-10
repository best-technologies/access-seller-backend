📁 Folder Structure: booksellr-frontend

booksellr-frontend/
├── app/                       # Next.js App Router entry point
│   ├── api/                   # API routes (for forms, auth proxies, etc.)
│   ├── (auth)/                # Route group for auth
│   │   ├── login/             # /login page
│   │   └── register/          # /register page
│   ├── (dashboard)/           # Route group for dashboards
│   │   ├── admin/             # /admin dashboard
│   │   └── marketer/          # /marketer dashboard
│   ├── (shop)/                # Route group for public e-commerce views
│   │   ├── cart/              # /cart page
│   │   ├── checkout/          # /checkout page
│   │   └── product/           # /product/[slug] dynamic page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage (shop landing)
│   └── globals.css           # Global styles
│
├── components/               # All shared components
│   ├── ui/                   # Shadcn UI wrappers/extensions
│   ├── layout/               # Navbar, Footer, Sidebar, etc.
│   ├── product/              # ProductCard, ProductList, ProductDetail
│   ├── cart/                 # CartItem, CartSummary, etc.
│   └── common/               # Buttons, loaders, badges, etc.
│
├── constants/                # Static enums, config values
│   └── roles.ts              # 'admin' | 'marketer' | 'buyer'
│
├── context/                  # Global app context providers
│   ├── AuthContext.tsx       # Auth + user info
│   ├── CartContext.tsx       # Shopping cart context
│   └── ReferralContext.tsx   # Referral tracking
│
├── hooks/                    # Custom reusable hooks
│   ├── useAuth.ts            # Auth state
│   ├── useCart.ts            # Cart logic
│   └── useReferral.ts        # Parse/save referral code
│
├── lib/                      # App utilities/helpers
│   ├── api.ts                # Axios instance with interceptors
│   ├── auth.ts               # Auth functions (login, logout)
│   ├── cart.ts               # Cart helpers (calculate total, etc.)
│   └── referrals.ts          # Referral helpers
│
├── types/                    # Global TS types and interfaces
│   ├── index.d.ts            # Declare module types
│   ├── product.ts            # Product interface
│   ├── user.ts               # User & marketer/admin types
│   └── order.ts              # Order/commission models
│
├── public/                   # Static assets (images, favicon)
│   └── logo.svg
│
├── .env.local                # Local env variables
├── tailwind.config.ts        # Tailwind config
├── shadcn.config.ts          # Shadcn UI config
├── postcss.config.js         # PostCSS config
├── tsconfig.json             # TypeScript config
├── next.config.js            # Next.js config
├── package.json              # NPM scripts & deps
└── README.md                 # Project instructions
