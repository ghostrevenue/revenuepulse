# ProofFlow — Social Proof & Product Review App

A powerful Shopify app that helps merchants collect and display product reviews and social proof widgets to increase conversion rates and customer trust.

---

## What It Does

**ProofFlow** enables merchants to:

1. **Collect Product Reviews** — Automated review request emails after purchase
2. **Display Social Proof Widgets** — Star ratings, review counts, "X people viewing this" live counters
3. **Show Recent Purchase Notifications** — "Someone in NYC just bought this!" popups
4. **Display User-Generated Content** — Photos from reviews integrated into product pages
5. **Review Q&A Section** — Customers can ask questions about products

---

## Features

### For Merchants
- **Review Collection** — Automated email requests after purchase (configurable delay)
- **Social Proof Widgets** — Star ratings, review counts, live counters, purchase notifications
- **Photo Reviews** — Display customer photos from reviews (Pro plan)
- **UGC Gallery** — Showcase user-generated content (Pro plan)
- **Analytics Dashboard** — Rating trends, review volume, conversion metrics
- **Per-Product Controls** — Enable/disable widgets, manage which products to ask for reviews

### Pricing
- **Starter** $19/mo: 100 reviews/month, basic widgets, email requests
- **Growth** $49/mo: Unlimited reviews, all widget types, A/B testing
- **Pro** $99/mo: Photo reviews, UGC gallery, AI-powered review responses, priority support

---

## Tech Stack

- **Runtime:** Node.js 20 + Express
- **Frontend:** React 18 + custom Polaris-inspired CSS (no bundler needed)
- **Database:** SQLite (embedded)
- **Shopify Integration:** GraphQL Admin API, Webhooks, OAuth 2.0
- **Billing:** Shopify Billing API

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Shopify Partner account
- ngrok or public HTTPS URL for webhooks

### 1. Install Dependencies

```bash
cd proofflow
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start the Server

```bash
npm start
# Server runs on http://localhost:3001
```

### 4. Register in Shopify Partner Dashboard

1. Go to partners.shopify.com → your organization
2. Create App → App name: "ProofFlow"
3. Copy API Key and API Secret into `.env`
4. Configure app URL and redirect URL
5. Set up webhooks:
   - `orders/create` → `/webhooks/orders/create`
   - `app/uninstalled` → `/webhooks/app/uninstalled`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/install` | Start OAuth flow |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/reviews` | List reviews |
| POST | `/api/reviews` | Create review |
| GET | `/api/products` | List products with stats |
| GET | `/api/analytics` | Get analytics |
| GET | `/api/notifications` | List notifications |
| GET | `/api/settings` | Get settings |
| GET | `/api/billing/plans` | Get plans |
| POST | `/api/billing/activate` | Activate plan |

---

## License

Proprietary — Carson / AI Office Mission Control
