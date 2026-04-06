# RevenuePulse - Shopify Revenue Analytics App

## Overview

RevenuePulse is an embedded Shopify app that provides real-time revenue analytics dashboards for Shopify merchants. It tracks daily revenue, orders, and average order values with trend analysis.

## Features

### Core Features
- **Revenue Dashboard** - 30/60/90-day revenue summaries with daily breakdowns
- **Trend Analytics** - Period-over-period comparisons and growth indicators
- **GDPR Compliance** - Three mandatory webhook handlers for data privacy
- **Billing Integration** - Shopify Billing API for subscription management ($19-99/mo)

### Plans
| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 30-day history, daily summaries, email reports |
| Growth | $49/mo | 90-day history, real-time alerts, CSV export |
| Pro | $99/mo | Unlimited history, API access, webhooks, priority support |

## Technical Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: SQLite (dev) → PostgreSQL on Railway (prod)
- **Frontend**: React 18 (CDN-loaded, no build step)
- **Authentication**: Shopify session token validation (replaces cookie-based)
- **Port**: 3000

## API Endpoints

### Authentication
- `POST /api/auth/session/verify` - Verify Shopify session token
- `GET /api/auth/callback` - OAuth callback

### Revenue
- `GET /api/revenue/summary?days=30` - Revenue summary
- `GET /api/revenue/daily?days=30` - Daily revenue data
- `GET /api/revenue/latest` - Most recent day
- `POST /api/revenue/seed` - Generate demo data
- `POST /api/revenue/sync` - Sync revenue from Shopify

### Billing
- `GET /api/billing/plan` - Current plan
- `POST /api/billing/plan` - Update plan
- `GET /api/billing/plans` - All plans
- `POST /api/billing/charges` - Create Shopify billing charge

### GDPR Webhooks (mandatory)
- `POST /webhooks/customers/data_request` - Customer data export request
- `POST /webhooks/customers/redact` - Customer data deletion
- `POST /webhooks/shop/redact` - Shop data deletion

## Environment Variables

```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
APP_URL=https://revenuepulse.up.railway.app
APP_PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...  # Railway Postgres
```

## Database Schema

### stores
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| shop | TEXT UNIQUE | myshopify.com domain |
| access_token | TEXT | Shopify API token |
| scope | TEXT | OAuth scope |
| created_at | TIMESTAMP | Creation time |

### revenue_data
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| store_id | TEXT FK | References stores |
| date | DATE | Revenue date |
| revenue | REAL | Total revenue |
| orders | INTEGER | Order count |
| average_order_value | REAL | AOV |

### billing
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| store_id | TEXT FK | References stores |
| plan | TEXT | starter/growth/pro |
| status | TEXT | active/trial |

### gdpr_logs
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| store_id | TEXT | Shop domain |
| webhook_type | TEXT | GDPR webhook type |
| received_at | TIMESTAMP | Receipt time |
| status | TEXT | Processing status |

## Deployment

Deployed on Railway with PostgreSQL (free tier).

```bash
# Local development
npm install
npm run dev

# Production
npm start
```
