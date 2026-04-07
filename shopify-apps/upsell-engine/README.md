# RevenuePulse — Post-Purchase Upsell Engine

A powerful, beautifully-designed Shopify app that turns the order confirmation moment into a second revenue channel. No redirects. No friction. One-click upsells.

---

## What It Does

After customers complete checkout, **RevenuePulse** displays a gorgeous inline upsell offer — relevant products, exclusive pricing, one-click add-on. It runs inside the order confirmation page as a Shopify checkout extension.

**Example:** Customer buys a t-shirt for $30 → sees "Add this matching cap for $12 (normally $18)" → clicks "Add to Order" → done. Extra revenue with zero friction.

---

## Features

### For Merchants
- **Offer Builder** — Create upsell offers with rich trigger rules
  - Min order value thresholds
  - Product/collection targeting
  - Customer tag targeting (first-time buyers, VIPs, etc.)
  - Frequency caps (once per customer, cooldown days, max per order)
  - Schedule (date ranges, specific days of week)
- **AI Product Matching** — Automatically recommends best upsell products based on order contents (co-purchase scoring)
- **Pricing Strategies** — Cost+markup, % off, fixed discount, bundle pricing
- **A/B Testing** — Test two variants of any offer
- **Real-Time Analytics Dashboard**
  - Revenue attribution (daily/weekly/monthly)
  - Conversion funnel (shown → clicked → purchased)
  - Top performing offers
  - AOV lift metrics
- **Plans:** Starter $19/mo | Growth $49/mo | Pro $99/mo

### For Customers
- Slide-up modal — no page redirect
- Product image, savings, pricing — all visible inline
- One-click "Add to Order" — no re-entering payment
- Trust signals (secure checkout, easy returns)
- Graceful dismiss — never asks twice

---

## Tech Stack

- **Runtime:** Node.js 20 + Express
- **Frontend:** React 18 + custom Polaris-inspired CSS (no heavy dependencies)
- **Database:** SQLite (embedded, per-store)
- **Shopify Integration:** GraphQL Admin API, Checkout Extensions, Webhooks, OAuth 2.0
- **Billing:** Shopify Billing API (recurring subscriptions)

---

## Project Structure

```
upsell-engine/
├── app.js                          # Main Express app
├── package.json
├── .env.example
├── SPEC.md                         # Full product specification
├── README.md
├── app/
│   ├── models/store.js             # SQLite database models
│   ├── routes/
│   │   ├── auth.routes.js           # OAuth authentication
│   │   ├── upsell.routes.js         # Offer CRUD
│   │   ├── upsell-evaluate.routes.js # Upsell decision engine
│   │   ├── analytics.routes.js      # Dashboard analytics
│   │   ├── billing.routes.js        # Subscription management
│   │   └── products.routes.js       # Product search
│   ├── services/
│   │   ├── offer.service.js         # Rules engine
│   │   ├── product.service.js       # Product matching algorithm
│   │   ├── analytics.service.js      # Tracking & reporting
│   │   └── webhook.service.js       # Webhook handlers
│   └── frontend/
│       ├── index.html
│       └── src/
│           ├── index.jsx            # React entry
│           ├── App.jsx               # App shell + navigation
│           ├── api/                  # API service layer
│           ├── components/           # Shared components
│           └── pages/               # Dashboard pages
├── extensions/
│   └── checkout-post-purchase/
│       ├── extension.config.yml
│       └── src/
│           ├── index.js             # Extension entry
│           └── UpsellModal.jsx       # Customer-facing modal
└── scripts/
    └── setup.sh                    # Setup script
```

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Shopify Partner account (org ID: **4843015**)
- ngrok or public HTTPS URL for webhooks

### 1. Install Dependencies

```bash
cd upsell-engine
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# SHOPIFY_API_KEY=your_api_key
# SHOPIFY_API_SECRET=your_api_secret
# APP_URL=https://your-ngrok-url.ngrok.io
# SESSION_SECRET=random-32-char-string
```

### 3. Start the Server

```bash
npm start
# Server runs on http://localhost:3000
```

### 4. Register the App in Shopify Partner Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com) → your organization
2. Create App → App name: "RevenuePulse"
3. Copy API Key and API Secret into your `.env`
4. Configure app URL and redirect URL:
   - App URL: `https://your-ngrok-url.ngrok.io`
   - Redirect URL: `https://your-ngrok-url.ngrok.io/api/auth/callback`
5. Set up webhooks:
   - `orders/create` → `/webhooks/orders/create`
   - `orders/updated` → `/webhooks/orders/updated`
   - `app/uninstalled` → `/webhooks/app/uninstalled`

### 5. Install the Checkout Extension

```bash
# Build the extension
shopify app build --extension extensions/checkout-post-purchase

# Deploy (requires Shopify CLI login)
shopify app deploy --extension extensions/checkout-post-purchase
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/start` | Start OAuth flow |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/offers` | List all offers |
| POST | `/api/offers` | Create offer |
| GET | `/api/offers/:id` | Get offer |
| PUT | `/api/offers/:id` | Update offer |
| DELETE | `/api/offers/:id` | Delete offer |
| POST | `/api/offers/:id/duplicate` | Duplicate offer |
| POST | `/api/offers/:id/activate` | Activate offer |
| POST | `/api/offers/:id/pause` | Pause offer |
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/products/search?q=` | Search products |
| POST | `/api/upsell/evaluate` | Evaluate upsell for order |
| POST | `/api/upsell/accept` | Accept upsell |
| POST | `/api/upsell/dismiss` | Dismiss upsell |
| POST | `/api/analytics/track` | Track event |
| POST | `/api/billing/activate` | Activate plan |
| GET | `/api/billing/plans` | Get plan details |
| GET | `/api/billing/current` | Get current plan |

---

## The Offer Object

```json
{
  "name": "Summer Upsell Bundle",
  "description": "Upsell complementary products",
  "status": "active",
  "trigger_config": {
    "min_order_value": 50,
    "product_ids": [],
    "required_tags": [],
    "excluded_tags": ["VIP"],
    "first_time_buyer": false
  },
  "product_config": {
    "product_ids": ["gid://shopify/Product/123"],
    "pricing_type": "percentage_off",
    "discount_percentage": 25
  },
  "display_config": {
    "headline": "Complete Your Look",
    "subheadline": "Add these items at a special price",
    "cta_text": "Add to Order",
    "dismiss_text": "No thanks"
  },
  "frequency_cap": {
    "max_seen_count": 3,
    "cooldown_days": 7,
    "max_per_order": 1
  },
  "schedule": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "days_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```

---

## Pricing Strategies

| Strategy | Description |
|----------|-------------|
| `percentage_off` | X% off original price |
| `fixed_discount` | $X off original price |
| `cost_plus` | Cost + X% markup |
| `bundle_price` | Fixed bundle price |
| `fixed_price` | Set exact price |

---

## Competitive Advantages

| Feature | RevenuePulse | Zipify | OneClickUpsell |
|---------|-------------|--------|----------------|
| Price | $19-99/mo | $89/mo | $49/mo |
| Redirect | No | Yes | Yes |
| AI Matching | Yes | No | No |
| Real-time Analytics | Yes | Basic | Basic |
| Polaris Dashboard | Yes | No | No |
| A/B Testing | Yes | No | No |
| 14-day Trial | Yes | No | No |

---

## Known Limitations (v1.0)

- The `orders/updated` webhook handler for tracking conversions is a scaffold — in production, it needs to compare the order's previous vs. current line items to detect upsell acceptance
- The `/api/upsell/accept` endpoint is a placeholder — in production, it calls Shopify's Orders API to add the line item
- AI product matching uses a rule-based scoring algorithm — full AI would require Shopify's Commerce Components API

---

## License

Proprietary — Carson / AI Office Mission Control
