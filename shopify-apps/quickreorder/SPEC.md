# QuickReorder - Shopify Subscription App

## Overview

QuickReorder is a comprehensive Shopify app for managing subscriptions and recurring orders. It enables merchants to offer subscription-based products with configurable delivery frequencies, discount tiers, and full customer management capabilities.

## Features

### Core Features

- [x] **Subscribe & Save** - Customers can subscribe to products with configurable delivery frequencies (weekly, biweekly, monthly, etc.)
- [x] **Subscription Management Portal** - Customers manage their subscriptions via Shopify customer portal
- [x] **Pre-Built Bundle Subscriptions** - Support for subscription boxes with multiple products
- [x] **Discount Tier** - Subscribers get better discounts the longer they stay (retention tool)
- [x] **Skip/Delay** - Customers can skip a delivery or pause their subscription
- [x] **Subscription Analytics** - MRR (monthly recurring revenue), churn rate, LTV

### Dashboard Metrics
- Monthly Recurring Revenue (MRR)
- Active Subscribers count
- Monthly Churn Rate
- Customer Lifetime Value (LTV)
- New Subscribers Today
- Pending Orders

### Plan Management
- Create subscription plans with:
  - Name and description
  - Frequency (7/14/30/60/90 days)
  - Discount percentage (5-30%)
  - Minimum remaining orders (churn prevention)
- Edit and deactivate plans

### Subscription Management
- View all subscriptions with filtering by status
- Pause/Resume/Cancel subscriptions
- Skip next delivery
- Change subscription plan
- View subscription order history
- Automatic retention discount calculation

### Order Management
- View pending, charged, shipped, failed orders
- Retry failed charges
- Mark orders as shipped
- Skip pending orders

### Analytics
- MRR trend over time
- Churn funnel visualization
- Customer LTV metrics
- Subscriber growth trend
- Age distribution
- Plan performance
- Frequency distribution
- Dunning metrics

### Billing Tiers
| Plan | Price | Subscribers | Plans | Features |
|------|-------|-------------|-------|----------|
| Starter | $19/mo | 50 | 1 | Basic analytics |
| Growth | $49/mo | 500 | 5 | Full analytics, skip/delays |
| Pro | $99/mo | Unlimited | Unlimited | Dunning, priority support |

## Technical Specifications

### Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React 18 (CDN-loaded)
- **Module System**: ES Modules

### API Endpoints

#### Auth Routes (`/api/auth`)
- `GET /api/auth/shopify` - Initiate OAuth flow
- `POST /api/auth/shopify/callback` - OAuth callback
- `POST /api/auth/webhook/verify` - Webhook HMAC verification
- `GET /api/auth/store/:shop` - Get store info

#### Subscriptions Routes (`/api/subscriptions`)
- `GET /api/subscriptions/store/:storeId` - Get all subscriptions
- `GET /api/subscriptions/store/:storeId/active` - Get active subscriptions
- `GET /api/subscriptions/customer/:customerId/store/:storeId` - Get customer subscriptions
- `GET /api/subscriptions/:id` - Get subscription details
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/skip` - Skip next delivery
- `POST /api/subscriptions/:id/change-plan` - Change subscription plan
- `POST /api/subscriptions/:id/retention-discount` - Apply retention discount

#### Plans Routes (`/api/plans`)
- `GET /api/plans/store/:storeId` - Get all plans
- `GET /api/plans/:id` - Get plan details
- `POST /api/plans` - Create plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Deactivate plan

#### Orders Routes (`/api/orders`)
- `GET /api/orders/store/:storeId` - Get all orders
- `GET /api/orders/store/:storeId/pending` - Get pending orders
- `GET /api/orders/subscription/:subscriptionId` - Get subscription orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/retry` - Retry failed order

#### Analytics Routes (`/api/analytics`)
- `GET /api/analytics/dashboard/:storeId` - Dashboard metrics
- `GET /api/analytics/mrr/:storeId` - MRR data
- `GET /api/analytics/ltv/:storeId` - LTV data
- `GET /api/analytics/churn-funnel/:storeId` - Churn funnel
- `GET /api/analytics/churn-trend/:storeId` - Churn trend
- `GET /api/analytics/growth/:storeId` - Subscriber growth
- `GET /api/analytics/age-distribution/:storeId` - Age distribution
- `GET /api/analytics/plan-performance/:storeId` - Plan performance
- `GET /api/analytics/frequency-distribution/:storeId` - Frequency distribution
- `GET /api/analytics/dunning/:storeId` - Dunning metrics
- `GET /api/analytics/at-risk/:storeId` - At-risk subscriptions

#### Billing Routes (`/api/billing`)
- `GET /api/billing/pricing` - Get pricing tiers
- `GET /api/billing/store/:storeId` - Get current billing
- `POST /api/billing/store/:storeId/upgrade` - Upgrade/downgrade plan
- `POST /api/billing/store/:storeId/cancel` - Cancel plan
- `GET /api/billing/store/:storeId/limits` - Check limits
- `GET /api/billing/store/:storeId/proration` - Calculate proration
- `GET /api/billing/store/:storeId/features/:feature` - Check feature access

### Database Schema

#### stores
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| shop | TEXT | Unique shop domain |
| access_token | TEXT | Shopify access token |
| scope | TEXT | Granted scopes |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### plans
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| name | TEXT | Plan name |
| description | TEXT | Plan description |
| frequency_days | INTEGER | Delivery frequency |
| discount_percent | REAL | Discount percentage |
| min_remaining_orders | INTEGER | Churn prevention threshold |
| is_active | INTEGER | Active flag |
| created_at | DATETIME | Creation timestamp |

#### subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| customer_id | TEXT | Shopify customer ID |
| plan_id | INTEGER | Foreign key to plans |
| product_id | TEXT | Shopify product ID |
| variant_id | TEXT | Shopify variant ID |
| quantity | INTEGER | Subscription quantity |
| frequency_days | INTEGER | Delivery frequency |
| status | TEXT | active/paused/cancelled |
| next_billing_date | DATETIME | Next billing date |
| discount_percent | REAL | Applied discount |
| cancelled_at | DATETIME | Cancellation timestamp |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### subscription_orders
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| subscription_id | INTEGER | Foreign key to subscriptions |
| order_id | TEXT | Shopify order ID |
| status | TEXT | pending/charged/shipped/failed/skipped |
| amount | REAL | Order amount |
| charged_at | DATETIME | Charge timestamp |
| created_at | DATETIME | Creation timestamp |

#### billing
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| plan_type | TEXT | starter/growth/pro |
| status | TEXT | active/cancelled/past_due |
| created_at | DATETIME | Creation timestamp |

#### analytics_events
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| event_type | TEXT | Event type |
| event_data | TEXT | JSON event data |
| created_at | DATETIME | Creation timestamp |

## Project Structure

```
quickreorder/
├── app.js                      # Express app entry point (port 3003)
├── package.json
├── .env.example
├── SPEC.md
├── README.md
├── app/
│   ├── models/
│   │   ├── db.js               # SQLite database
│   │   ├── store.js            # Store model
│   │   ├── subscription.js     # Subscription model
│   │   ├── order.js            # Subscription order model
│   │   └── plan.js             # Plan model
│   ├── routes/
│   │   ├── auth.routes.js      # OAuth authentication
│   │   ├── subscriptions.routes.js
│   │   ├── plans.routes.js
│   │   ├── orders.routes.js
│   │   ├── analytics.routes.js
│   │   └── billing.routes.js
│   ├── services/
│   │   ├── subscription.service.js
│   │   ├── billing.service.js
│   │   ├── churn.service.js
│   │   └── analytics.service.js
│   └── frontend/
│       ├── index.html          # React SPA
│       └── src/
│           ├── index.jsx       # Main React app
│           ├── api/
│           │   ├── subscriptions.js
│           │   ├── analytics.js
│           │   └── plans.js
│           └── pages/
│               ├── Dashboard.jsx
│               ├── Subscriptions.jsx
│               ├── Plans.jsx
│               ├── Orders.jsx
│               ├── Analytics.jsx
│               └── Billing.jsx
└── extensions/
    └── subscriber-portal/
        ├── extension.config.yml
        └── src/
            ├── index.js
            ├── SubscriptionWidget.jsx
            └── ManageSubscription.jsx
```

## Environment Variables

```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
APP_URL=https://your-app.ngrok.io
SCOPES=read_orders,write_orders,read_products,write_products,read_customers,write_customers
DB_NAME=quickreorder.db
NODE_ENV=development
```

## Installation

```bash
npm install
```

## Running

```bash
npm start
# App runs on http://localhost:3003
```

## Design System

- **Font**: Inter (Google Fonts)
- **Colors**:
  - Primary: #6366f1 (Indigo)
  - Secondary: #8b5cf6 (Purple)
  - Background: #0f0f12
  - Card Background: #1a1a1f
  - Border: #252530
  - Text Primary: #e8e9eb
  - Text Secondary: #9ca3af
  - Success: #34d399
  - Warning: #fbbf24
  - Error: #f87171
- **Layout**: Fixed sidebar (240px) + main content area
- **Border Radius**: 8px (buttons), 12px (cards)

## Retention Discount Tiers

| Tenure | Discount |
|--------|----------|
| 1+ month | 5% |
| 3+ months | 10% |
| 6+ months | 15% |
| 1+ year | 20% |

## Churn Prevention

- Subscriptions past their billing date by 14+ days are flagged as at-risk
- Retention discounts automatically applied based on tenure
- Win-back offers can be triggered for at-risk subscriptions

## TODO

- [ ] Add Shopify Webhook handlers for orders
- [ ] Implement actual Shopify API integration
- [ ] Add payment gateway integration
- [ ] Email notifications for billing events
- [ ] Advanced dunning automation
- [ ] Bundle subscription support
