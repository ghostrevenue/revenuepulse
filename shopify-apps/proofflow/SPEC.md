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

- **Review Collection**
  - Automated email requests after purchase (configurable delay: 1-14 days)
  - Manual review invitation triggers
  - Multi-product follow-up for orders with multiple items
  - Incentive-based review requests (optional discount codes)

- **Social Proof Widgets**
  - Star ratings below product titles
  - Review count badges
  - "X people are viewing this" live counter
  - "Someone in [city] just bought this" purchase notifications
  - Photo review gallery (UGC)
  - Trust badges and review highlights

- **Analytics Dashboard**
  - Average rating trends over time
  - Review volume by product
  - Rating distribution (1-5 stars)
  - Review sources breakdown
  - Helpful votes tracking
  - Conversion lift estimation

- **Product-Level Controls**
  - Per-product review settings
  - Enable/disable widgets per product
  - Hide negative reviews option
  - Featured review pinning

- **Plans:** Starter $19/mo | Growth $49/mo | Pro $99/mo

---

## Tech Stack

- **Runtime:** Node.js 20 + Express
- **Frontend:** React 18 + custom Polaris-inspired CSS (CDN-loaded, no bundler)
- **Database:** SQLite (embedded, per-store)
- **Shopify Integration:** GraphQL Admin API, Webhooks, OAuth 2.0
- **Billing:** Shopify Billing API (recurring subscriptions)

---

## Pricing Tiers

| Feature | Starter ($19/mo) | Growth ($49/mo) | Pro ($99/mo) |
|---------|-----------------|-----------------|--------------|
| Reviews/month | 100 | Unlimited | Unlimited |
| Social Proof Widgets | Basic | All types | All + UGC gallery |
| Email Requests | 100/mo | Unlimited | Unlimited + A/B testing |
| Photo Reviews | - | - | ✓ |
| UGC Gallery | - | - | ✓ |
| AI Review Responses | - | - | ✓ |
| Priority Support | - | - | ✓ |

---

## Project Structure

```
proofflow/
├── app.js                          # Main Express app
├── package.json
├── .env.example
├── SPEC.md                         # This file
├── README.md
├── app/
│   ├── models/
│   │   ├── db.js                   # SQLite setup
│   │   ├── store.js                # Store model
│   │   ├── review.js               # Review model
│   │   └── notification.js         # Social proof notification model
│   ├── routes/
│   │   ├── auth.routes.js          # Shopify OAuth
│   │   ├── reviews.routes.js       # Review CRUD
│   │   ├── products.routes.js      # Product review settings
│   │   ├── analytics.routes.js     # Review metrics
│   │   ├── notifications.routes.js # Social proof notifications
│   │   ├── billing.routes.js       # Shopify Billing API
│   │   └── settings.routes.js      # App settings, email templates
│   ├── services/
│   │   ├── review.service.js       # Review collection logic
│   │   ├── notification.service.js  # Live notification engine
│   │   ├── email.service.js        # Review request email triggers
│   │   └── analytics.service.js    # Review metrics
│   └── frontend/
│       ├── index.html              # React app entry
│       └── src/
│           ├── index.jsx           # React entry point
│           ├── App.jsx             # App shell + sidebar nav
│           ├── api/                # API service layer
│           ├── components/         # Shared components
│           └── pages/              # Dashboard pages
└── extensions/
    └── social-proof-widget/       # Storefront extension
        ├── extension.config.yml
        └── src/
            ├── index.js           # Entry point
            ├── SocialProofEmbed.jsx # Widget embed
            └── NotificationPopup.jsx # Purchase notification popup
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/install` | Start OAuth flow |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/auth/status` | Check auth status |
| GET | `/api/reviews` | List reviews |
| POST | `/api/reviews` | Create review |
| GET | `/api/reviews/:id` | Get review |
| PUT | `/api/reviews/:id` | Update review |
| DELETE | `/api/reviews/:id` | Delete review |
| POST | `/api/reviews/:id/reply` | Reply to review |
| GET | `/api/products` | List products with review stats |
| PUT | `/api/products/:id/reviews-settings` | Update product review settings |
| GET | `/api/analytics` | Get review analytics |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications` | Create notification |
| PUT | `/api/notifications/:id` | Update notification |
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update app settings |
| GET | `/api/settings/email-template` | Get email template |
| PUT | `/api/settings/email-template` | Update email template |
| GET | `/api/billing/plans` | Get plan details |
| GET | `/api/billing/current` | Get current plan |
| POST | `/api/billing/activate` | Activate plan |

---

## Database Schema

### reviews
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| product_id | TEXT | Shopify product ID |
| rating | INTEGER | 1-5 stars |
| title | TEXT | Review title |
| body | TEXT | Review content |
| author_name | TEXT | Reviewer name |
| author_email | TEXT | Reviewer email |
| verified | BOOLEAN | Verified purchase |
| photos | JSON | Array of photo URLs |
| helpful_count | INTEGER | Helpful votes |
| is_public | BOOLEAN | Show on storefront |
| created_at | DATETIME | Creation timestamp |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| store_id | INTEGER | Foreign key to stores |
| type | TEXT | 'purchase' or 'view' |
| product_id | TEXT | Shopify product ID |
| location | TEXT | City/region string |
| session_id | TEXT | Browser session |
| shown | BOOLEAN | Has been displayed |
| created_at | DATETIME | Creation timestamp |

---

## Widget Embed Code

The storefront widget is a JavaScript snippet that:

1. Shows star rating below product title
2. Shows review count badge  
3. Shows "X people viewing this" live counter
4. Triggers "Someone in [city] just bought this" popup randomly within session

```html
<script src="{APP_URL}/widget.js" data-shop="{shop}"></script>
```

---

## License

Proprietary — Carson / AI Office Mission Control
