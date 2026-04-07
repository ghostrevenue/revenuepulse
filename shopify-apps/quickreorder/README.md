# QuickReorder - Shopify Subscription & Recurring Orders App

A complete Shopify app for managing subscriptions and recurring orders. Built with Express.js, React, and SQLite.

## Features

- **Subscribe & Save** - Offer products on subscription with configurable frequencies
- **Customer Portal** - Customers manage their own subscriptions
- **Retention Discounts** - Reward long-term subscribers with bigger discounts
- **Skip/Delay** - Let customers skip or pause deliveries
- **Analytics Dashboard** - Track MRR, churn, LTV, and more
- **Tiered Pricing** - Three plans: Starter ($19), Growth ($49), Pro ($99)

## Quick Start

### Prerequisites

- Node.js 20+
- Shopify Partner account
- Shopify development store

### Installation

```bash
# Clone or navigate to the project
cd /home/theoffice/mission-control/shopify-apps/quickreorder

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Shopify credentials
# SHOPIFY_API_KEY=your_key
# SHOPIFY_API_SECRET=your_secret
# APP_URL=https://your-ngrok-url.ngrok.io
```

### Running

```bash
npm start
```

The app will start on **http://localhost:3003**

## Project Structure

```
quickreorder/
├── app.js                    # Express entry point
├── package.json
├── .env.example
├── app/
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── frontend/             # React dashboard
└── extensions/
    └── subscriber-portal/     # Customer-facing extension
```

## API Overview

### Subscriptions
- `GET /api/subscriptions/store/:storeId` - List all subscriptions
- `POST /api/subscriptions/:id/pause` - Pause a subscription
- `POST /api/subscriptions/:id/skip` - Skip next delivery
- `POST /api/subscriptions/:id/cancel` - Cancel subscription

### Plans
- `GET /api/plans/store/:storeId` - List plans
- `POST /api/plans` - Create a plan (frequency + discount)

### Analytics
- `GET /api/analytics/dashboard/:storeId` - Dashboard metrics
- `GET /api/analytics/mrr/:storeId` - MRR trend data

## Pricing Plans

| Plan | Price | Subscribers | Features |
|------|-------|-------------|----------|
| Starter | $19/mo | 50 | Basic analytics |
| Growth | $49/mo | 500 | Full analytics, skip/delays |
| Pro | $99/mo | Unlimited | Dunning, priority support |

## Database

SQLite database (`quickreorder.db`) with tables:
- `stores` - Shopify store connections
- `plans` - Subscription plan definitions
- `subscriptions` - Customer subscriptions
- `subscription_orders` - Order tracking
- `billing` - Plan subscriptions
- `analytics_events` - Event tracking

## Development

### Adding a new API endpoint

1. Add route handler in `app/routes/`
2. Add model methods in `app/models/`
3. Add service methods in `app/services/`
4. Update frontend API client in `app/frontend/src/api/`

### Adding a frontend page

1. Add component to `app/frontend/src/index.jsx`
2. Add navigation item to `Sidebar` component

## Environment Variables

```bash
SHOPIFY_API_KEY=        # Shopify app API key
SHOPIFY_API_SECRET=     # Shopify app secret
APP_URL=                # Public URL (for OAuth)
SCOPES=                # Shopify API scopes
DB_NAME=               # SQLite database name
NODE_ENV=              # development/production
```

## License

MIT
