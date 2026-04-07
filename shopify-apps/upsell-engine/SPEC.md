# RevenuePulse — Post-Purchase Upsell Engine
## Shopify App Specification v1.0

---

## 1. Concept & Vision

**RevenuePulse** is a post-purchase upsell engine that turns the order confirmation moment into a second revenue channel. After customers complete checkout, they see a beautifully crafted upsell offer — relevant products, irresistible pricing, one-click add-on. No friction. No redirect. No cart abandonment.

The app feels premium, fast, and merchant-first: the merchant dashboard is gorgeous and intuitive (Polaris-native), the customer experience is butter-smooth, and the upsell conversion rates are measurably better than any competitor.

**Tagline:** "Your second sale happens automatically."

---

## 2. What Makes This Better Than Everything Else

| Feature | RevenuePulse | Competing Apps |
|---------|-------------|----------------|
| Offer relevance | AI product-to-order matching + manual rules | Manual only |
| Pricing flexibility | Cost+margin, fixed discount, % off, bundle pricing | Fixed % only |
| Customer experience | No redirect, inline on confirmation page | Redirect to checkout |
| Offer frequency cap | Per-customer, per-campaign limits | Basic global limits |
| Analytics | Real-time revenue attribution dashboard | Basic charts |
| Pricing | $19/mo starter → $49/mo growth → $99/mo pro | $49-149/mo |
| Embedding | Checkout UI extension (no page跳转) | Redirects |

---

## 3. Design Language

### Merchant Dashboard (Polaris Design System)
- **Aesthetic:** Professional, data-rich, Shopify-native. Fits seamlessly inside Shopify Admin.
- **Color palette:**
  - Primary: #5C6AC4 (Shopify purple)
  - Success: #008060 (Shopify green)
  - Warning: #F49342
  - Background: #F6F6F7 (light) / #1A1A2E (dark)
  - Text: #202223
- **Typography:** Shopify Sans (Polaris default), monospace for data
- **Spacing:** 8px grid, Polaris spacing scale
- **Motion:** Subtle, functional. Page transitions 200ms ease-out.

### Customer-Facing Upsell Modal
- **Aesthetic:** Clean, high-conversion. Apple-store quality.
- **Color palette:**
  - Background: White with soft shadow overlay
  - Primary CTA: #008060 (green, high contrast)
  - Secondary CTA: #C4C4C4
  - Product image: white background, soft shadow
  - Urgency element: #F49342
- **Typography:** Inter or system-ui (not Polaris — needs to feel native to store)
- **Animation:** Slide-up modal, 300ms ease-out. Product image fades in 150ms.

---

## 4. Product Architecture

### App Stack
- **Runtime:** Node.js 20 + Express
- **Frontend:** React 18 + Polaris (merchant dashboard) + Web Components (customer-facing)
- **Database:** SQLite (embedded, per-store) + Redis for session/caching
- **Shopify Integration:** Shopify CLI scaffold, GraphQL Admin API, Checkout Extensions
- **Billing:** Shopify Billing API (recurring subscriptions)

### App Structure
```
upsell-engine/
├── app/                      # Main Express app
│   ├── routes/
│   │   ├── auth.routes.js    # OAuth flow
│   │   ├── upsell.routes.js  # Offer CRUD
│   │   ├── analytics.routes.js
│   │   └── billing.routes.js
│   ├── services/
│   │   ├── offer.service.js   # Rules engine
│   │   ├── product.service.js # Product matching
│   │   └── analytics.service.js
│   ├── models/
│   │   └── store.js          # SQLite models
│   └── extensions/
│       └── checkout-ui/      # Web pixel + checkout extension
├── extensions/
│   └── checkout-post-purchase/  # Shopify checkout UI extension
├── scripts/
│   └── setup.sh
└── SPEC.md
```

---

## 5. Features & Functionality

### 5.1 Offer Builder (Merchant)
- Create upsell offers with:
  - Offer name + description
  - Trigger conditions (order total ≥ $X, product in cart, customer tag, first-time buyer)
  - Product(s) to upsell (single product OR product collection)
  - Pricing: cost + markup %, fixed discount amount, percentage off, bundle price
  - Display settings: headline, subheadline, CTA text
  - Frequency cap: show once per customer, max N times per order, cooldown days
  - Scheduling: active dates, specific days of week
- Duplicate, pause, archive offers
- A/B test two offer variants

### 5.2 Product Matcher
- Manual product/collection selection
- AI-powered: "match products likely bought with items in this order"
- Exclusion list: exclude products already in the order
- Variant selection: upsell specific variants

### 5.3 Customer-Facing Upsell (Checkout Extension)
- Appears inline on order confirmation page (checkout-post-purchase extension)
- Shows: product image, name, price, savings, CTA
- One-click "Add to Order" — no re-entering payment
- Dismiss button (X) — doesn't ask twice
- Mobile-first responsive design
- Supports: Add to existing order (additional line item at upsell price)

### 5.4 Analytics Dashboard
- Total upsell revenue (daily/weekly/monthly)
- Upsell conversion rate (% of orders that accepted)
- Average order increase ($ and %)
- Top performing offers
- Revenue per visitor
- Funnel: shown → clicked → purchased

### 5.5 Billing Plans
| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 1 offer, 100 orders/mo, basic analytics |
| Growth | $49/mo | Unlimited offers, 1,000 orders/mo, A/B testing, full analytics |
| Pro | $99/mo | Unlimited everything, AI product matching, priority support |

Free 14-day trial on all plans.

---

## 6. Technical Deep Dive

### 6.1 OAuth Flow
- Standard Shopify OAuth 2.0
- Scopes: `read_orders`, `write_orders`, `read_products`, `read_checkouts`, `write_checkouts`
- App installed per-store, stores organization-level app record

### 6.2 Checkout Post-Purchase Extension
- Uses Shopify's `checkout.brand` and `ui-extension` approach
- Rendered as iframe on order confirmation page
- No redirect — inline upsell
- Accepts: adds additional line item to the order via API
- Uses `orders/{order_id}/discounts` and `orders/{order_id}/metafields` for tracking

### 6.3 Webhook Events
- `orders/create` — trigger offer evaluation
- `orders/updated` — track upsell acceptance
- `app/uninstalled` — cleanup

### 6.4 Rules Engine (Offer Service)
```
Trigger Evaluation:
  IF order.total >= offer.min_order_value
  AND order.products intersect offer.product_ids (if specified)
  AND customer not in offer.excluded_tags (if specified)
  AND customer has not seen this offer in last N days
  AND offer is within active schedule
THEN: Display offer
```

### 6.5 Product Matching Algorithm
```
AI Product Score = (co-purchase frequency) + (same category) + (complementary use-case)
Sort products by score DESC
Return top N products not already in order
```

---

## 7. Edge Cases & Error Handling

- If upsell product is out of stock → don't show offer
- If Shopify checkout session expires → graceful fail, no double-charge
- If API rate limit hit → queue and retry with backoff
- If store has no products → prompt merchant to add products first
- If customer already purchased upsell product → don't show repeat offer
- Network failure on "Add to Order" → show retry button with error

---

## 8. Success Metrics

- RevenuePulse converts ≥ 8% of order confirmations into upsell accepts
- Merchants see ≥ 15% AOV increase on orders where upsell shown
- App Store rating ≥ 4.8 stars
- Dashboard load time < 1 second
- Upsell modal render time < 300ms

---

## 9. Competitive Analysis Notes

Top competitors to beat:
- **Zipify Pages** — $89/mo, complex, redirects
- **OneClickUpsell** — $49/mo, redirect-based
- **Upsell Cross-sell Engine** — $39/mo, limited rules
- **Bump:** $9.99/mo, limited to one product

RevenuePulse wins on: price (lower), no redirect (better UX), AI matching (smarter), real-time analytics (more data), Polaris-native dashboard (better merchant experience).
