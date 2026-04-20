# PostPurchasePro - Shopify Post-Purchase Upsell App

## Overview

PostPurchasePro is an embedded Shopify app that enables merchants to create and manage post-purchase upsell funnels. Merchants define trigger conditions (products, collections, order value thresholds) and build multi-step funnel sequences with discount offers shown to customers immediately after checkout.

## Features

### Core Features
- **Upsell Funnel Builder** — Multi-step funnel sequences with trigger conditions and discount nodes
- **Dashboard** — Overview of funnel performance and store metrics
- **Analytics** — Funnel conversion tracking and revenue attribution
- **Single Plan** — Unlimited funnels at $20/mo
- **GDPR Compliance** — Three mandatory webhook handlers for data privacy

### Plans
| Plan | Price | Features |
|------|-------|----------|
| Pro | $20/mo | Unlimited upsell funnels, A/B testing, real-time analytics, priority support |

## Technical Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: SQLite (dev) → PostgreSQL on Railway (prod)
- **Frontend**: React 18 (CDN-loaded, no build step)
- **Authentication**: Shopify session token validation (embedded app)
- **Port**: 3000

## API Endpoints

### Authentication
- `POST /api/auth/session/verify` - Verify Shopify session token
- `GET /api/auth/callback` - OAuth callback

### Funnels
- `GET /api/funnels` - List all funnels for a store
- `POST /api/funnels` - Create a new funnel
- `GET /api/funnels/:id` - Get funnel details
- `PUT /api/funnels/:id` - Update a funnel
- `DELETE /api/funnels/:id` - Delete a funnel

### Dashboard
- `GET /api/dashboard/summary` - Dashboard summary metrics
- `GET /api/dashboard/revenue-history` - Revenue history data

### Billing
- `GET /api/billing/plan` - Current plan ($20/mo Pro)
- `POST /api/billing/plan` - Activate subscription
- `GET /api/billing/plans` - Available plans (single Pro plan)

### GDPR Webhooks (mandatory)
- `POST /webhooks/customers/data_request` - Customer data export request
- `POST /webhooks/customers/redact` - Customer data deletion
- `POST /webhooks/shop/redact` - Shop data deletion

## Environment Variables

```
SHOPIFY_API_KEY=your_s..._key
SHOPIFY_API_SECRET=your_s...cret
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

### funnels
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| store_id | TEXT FK | References stores |
| name | TEXT | Funnel name |
| status | TEXT | active/draft |
| trigger | JSONB | Trigger conditions |
| nodes | JSONB | Funnel step nodes |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

### billing
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| store_id | TEXT FK | References stores |
| plan | TEXT | pro |
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
