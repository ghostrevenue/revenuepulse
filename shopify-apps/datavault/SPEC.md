# DataVault - Specification

## Overview

DataVault is a Shopify app providing customer data and analytics for merchants. It helps merchants understand their customers through unified profiles, segmentation, RFM analysis, cohort tracking, churn scoring, and custom reports.

## Architecture

### Technology Stack
- **Runtime**: Node.js 20+
- **Backend**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React 18 (CDN-loaded, no build step)
- **Port**: 3005

### Project Structure
```
datavault/
├── app.js                      # Express entry point
├── package.json
├── .env.example
├── SPEC.md
├── README.md
├── app/
│   ├── models/
│   │   └── db.js               # SQLite schema & initialization
│   ├── store.js                # Store management
│   ├── customer.js             # Customer model functions
│   ├── segment.js              # Segment model functions
│   ├── cohort.js               # Cohort model functions
│   ├── behavior.js             # Behavior events model
│   ├── routes/
│   │   ├── auth.routes.js       # OAuth endpoints
│   │   ├── customers.routes.js # Customer CRUD
│   │   ├── segments.routes.js   # Segment CRUD
│   │   ├── cohorts.routes.js   # Cohort analysis
│   │   ├── reports.routes.js    # Custom reports
│   │   ├── analytics.routes.js  # RFM, churn, LTV
│   │   └── billing.routes.js   # Subscription management
│   ├── services/
│   │   ├── customer.service.js
│   │   ├── segmentation.service.js
│   │   ├── cohort.service.js
│   │   ├── rfm.service.js
│   │   └── churn.service.js
│   └── frontend/
│       ├── index.html           # React SPA entry
│       └── src/
│           ├── index.jsx        # All React components
│           ├── App.jsx
│           └── api/
│               ├── customers.js
│               ├── segments.js
│               └── analytics.js
```

## Database Schema

### Tables

**stores**
- id (INTEGER PRIMARY KEY)
- shop (TEXT UNIQUE)
- access_token (TEXT)
- scope (TEXT)
- created_at (DATETIME)

**customers**
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER FK)
- shopify_customer_id (TEXT)
- email, first_name, last_name
- total_orders, total_spent, avg_order_value
- first_order_date, last_order_date
- tags (JSON array)
- churn_score (0-100)
- rfm_score (1-555)
- created_at, updated_at

**segments**
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER FK)
- name, description
- rules (JSON array of conditions)
- created_at, updated_at

**behavior_events**
- id (INTEGER PRIMARY KEY)
- store_id, customer_id (INTEGER FKs)
- event_type (purchase/abandon/browse)
- product_id, amount
- metadata (JSON)
- created_at

**cohort_groups**
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER FK)
- name, start_date, end_date
- created_at

**cohort_data**
- id, cohort_group_id, customer_id
- month_0_retained through month_6_retained

**subscriptions**
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER FK)
- plan (starter/growth/pro)
- status, started_at, expires_at

**reports**
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER FK)
- name, metrics (JSON), group_by, filters (JSON)
- created_at

## Features

### 1. Customer Profiles
- View all customers with sortable table
- Search by email or name
- Click for detailed profile modal
- Shows contact info, order metrics, behavior summary, churn risk

### 2. Segmentation Engine
- Create segments with visual rule builder
- Rules are AND conditions: field + operator + value
- Preview matching count before saving
- Supported fields: total_spent, total_orders, avg_order_value, churn_score

### 3. RFM Analysis
- Recency, Frequency, Monetary scoring (1-5 each)
- Combined RFM score (e.g., 543 = best customers)
- Customer segments: Champions, Loyal, Potential, At Risk, Lost
- Distribution charts by R, F, M dimension

### 4. Cohort Analysis
- Monthly cohort groups based on first order date
- Retention tracking: Month 0-6
- Color-coded percentage cells (green/yellow/red)
- Cohort size tracking

### 5. Churn Scoring
- Score 0-100 based on multiple factors
- Days since last order (max 40 points)
- Declining order frequency (max 30 points)
- Low AOV with many orders (max 20 points)
- Risk tags (max 10 points)
- Distribution: High (>70), Medium (40-70), Low (<40)

### 6. Custom Reports
- Select from metrics: orders, spent, AOV, count, new
- Results displayed in table format
- Export capability to CSV

### 7. Billing
- Three tiers: Starter ($19), Growth ($49), Pro ($99)
- Starter: 1,000 customers, basic segments, RFM
- Growth: Unlimited, cohorts, custom reports, API
- Pro: Predictive churn, behavioral analysis, support

## API Endpoints

### Auth
- GET /auth/login?shop=xxx - Initiate OAuth
- GET /auth/callback - OAuth callback

### Customers
- GET /api/customers?sort=&limit=&offset=&search= - List customers
- GET /api/customers/stats - Dashboard stats
- GET /api/customers/:id - Customer detail
- POST /api/customers/sync - Sync from Shopify

### Segments
- GET /api/segments - List segments
- GET /api/segments/:id - Segment detail
- GET /api/segments/:id/customers - Segment customers
- POST /api/segments - Create segment
- POST /api/segments/preview - Preview match count
- PUT /api/segments/:id - Update segment
- DELETE /api/segments/:id - Delete segment

### Cohorts
- GET /api/cohorts - List cohort groups
- GET /api/cohorts/report - Full cohort report
- GET /api/cohorts/:id - Cohort detail with analysis
- POST /api/cohorts - Create cohort group

### Reports
- GET /api/reports - List saved reports
- POST /api/reports/generate - Generate report
- POST /api/reports - Save report config
- GET /api/reports/:id/export - Export CSV

### Analytics
- GET /api/analytics/rfm - RFM matrix
- GET /api/analytics/rfm/scores - All RFM scores
- GET /api/analytics/churn - Churn distribution
- GET /api/analytics/churn/summary - Churn summary
- GET /api/analytics/churn/at-risk - At-risk customers
- GET /api/analytics/ltv/distribution - LTV histogram
- GET /api/analytics/overview - Combined dashboard data

### Billing
- GET /api/billing/plans - Available plans
- GET /api/billing/subscription - Current subscription
- POST /api/billing/subscribe - Subscribe to plan
- POST /api/billing/cancel - Cancel subscription

## Frontend Components

### Pages
- **Dashboard**: Stats cards (total, LTV, revenue, at-risk)
- **Customers**: Searchable table, click for profile modal
- **Segments**: List with create modal, rule builder
- **Cohorts**: Retention table with color coding
- **Analytics**: Tabbed (RFM, Churn, LTV)
- **Reports**: Metric selector, generate button
- **Billing**: Plan cards with subscribe buttons

### Navigation
- Sidebar with icons and labels
- Dark theme (#0f0f1a background)
- Active state highlighting (#6366f1 accent)

## Environment Variables

```
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
SHOPIFY_APP_URL=http://localhost:3005
SHOPIFY_SCOPES=read_customers,read_orders,read_products
PORT=3005
NODE_ENV=development
SESSION_SECRET=xxx
```

## Development

```bash
npm install
node app.js
```

App runs on http://localhost:3005 with demo mode when no shop parameter.
