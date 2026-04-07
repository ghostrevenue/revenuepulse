# CartGuard — Shopify Cart Abandonment Recovery & Exit Intent App

A Shopify app that recovers abandoned carts and captures leaving visitors through intelligent exit-intent detection.

## Features

- **Exit Intent Detection** — Detect when visitors try to leave and show a compelling offer
- **Cart Abandonment Recovery** — Track abandoned carts and trigger recovery emails/SMS via Shopify Flow
- **Automatic Coupon Injection** — Show or auto-apply discounts when cart value exceeds threshold
- **Email Capture** — Capture emails before visitors leave, even without checkout
- **Abandoned Checkout Recovery** — Leverage Shopify's native abandoned checkout emails + custom sequences

## Tech Stack

- Node.js 20, Express, better-sqlite3
- ES modules
- React frontend (CDN-loaded)
- Shopify OAuth + Billing API
- SQLite database

## Getting Started

```bash
cd cartguard
npm install
node app.js
```

App runs on **port 3002**.

## Configuration

Copy `.env.example` to `.env` and fill in:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
APP_URL=http://localhost:3002
DB_PATH=./cartguard.db
```

## Project Structure

```
cartguard/
├── app.js                      # Express server
├── package.json
├── .env.example
├── SPEC.md
├── README.md
├── app/
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   └── frontend/                # React dashboard
└── extensions/
    └── exit-intent-widget/      # Storefront extension
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth` | OAuth flow |
| GET/POST | `/api/campaigns` | Campaign CRUD |
| GET | `/api/visitors` | Visitor list |
| POST | `/api/visitors/email` | Capture email |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/funnel` | Funnel data |
| GET/POST | `/api/coupons` | Coupon CRUD |
| POST | `/api/billing/activate` | Activate plan |

## Pricing

- **Starter** $19/mo — 500 emails/mo, 1 active campaign, basic analytics
- **Growth** $49/mo — Unlimited emails, 5 campaigns, A/B test offers
- **Pro** $99/mo — Unlimited everything, SMS recovery, priority support

## License

Proprietary
