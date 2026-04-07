# DataVault

Customer data and analytics platform for Shopify merchants.

## Features

- **Customer Profiles** - Unified view of every customer: orders, lifetime value, tags, behavior
- **Segmentation Engine** - Create customer segments based on behavior
- **RFM Analysis** - Recency, Frequency, Monetary scoring
- **Cohort Analysis** - Track customer behavior by acquisition cohort
- **Churn Scoring** - Identify customers likely to churn
- **Custom Reports** - Build custom reports on customer behavior

## Tech Stack

- Node.js 20+
- Express.js
- SQLite (better-sqlite3)
- React 18 (CDN-loaded, no build step)
- ES Modules

## Quick Start

```bash
cd /home/theoffice/mission-control/shopify-apps/datavault
npm install
node app.js
```

App runs on http://localhost:3005

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `SHOPIFY_API_KEY` - Shopify app API key
- `SHOPIFY_API_SECRET` - Shopify app secret
- `SHOPIFY_APP_URL` - Public URL of your app
- `SHOPIFY_SCOPES` - OAuth scopes (default: read_customers,read_orders,read_products)

## Project Structure

```
datavault/
├── app.js                      # Express entry point
├── package.json
├── .env.example
├── SPEC.md                     # Detailed specification
├── README.md
├── app/
│   ├── models/
│   │   └── db.js               # SQLite schema
│   ├── store.js                # Store management
│   ├── customer.js             # Customer model
│   ├── segment.js              # Segment model
│   ├── cohort.js               # Cohort model
│   ├── behavior.js             # Behavior events
│   ├── routes/
│   │   ├── auth.routes.js       # OAuth
│   │   ├── customers.routes.js
│   │   ├── segments.routes.js
│   │   ├── cohorts.routes.js
│   │   ├── reports.routes.js
│   │   ├── analytics.routes.js
│   │   └── billing.routes.js
│   ├── services/
│   │   ├── customer.service.js
│   │   ├── segmentation.service.js
│   │   ├── cohort.service.js
│   │   ├── rfm.service.js
│   │   └── churn.service.js
│   └── frontend/
│       ├── index.html           # React SPA
│       └── src/
│           ├── index.jsx        # All components
│           └── api/
│               ├── customers.js
│               ├── segments.js
│               └── analytics.js
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/login | Initiate Shopify OAuth |
| GET | /api/customers | List customers |
| GET | /api/customers/stats | Dashboard stats |
| GET | /api/segments | List segments |
| POST | /api/segments | Create segment |
| GET | /api/cohorts/report | Cohort analysis |
| GET | /api/analytics/rfm | RFM matrix |
| GET | /api/analytics/churn | Churn distribution |
| POST | /api/reports/generate | Generate report |
| GET | /api/billing/plans | Available plans |

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 1,000 customers, basic segments, RFM |
| Growth | $49/mo | Unlimited, cohorts, reports, API |
| Pro | $99/mo | Predictive churn, behavioral analysis |

## Development

```bash
# Install dependencies
npm install

# Start server
node app.js

# Development mode with auto-reload
npm run dev
```

## License

MIT
