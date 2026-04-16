# RevenuePulse Post-Purchase Upsell — Refactor Spec

## Core Mechanic (correct model)

A post-purchase upsell is a **one-click offer shown AFTER payment, BEFORE the thank-you page**. The customer does NOT re-enter payment. Accepting charges the original payment method via Shopify's `CalculateChangeset` / `ApplyChangeset` APIs. It is rendered as a **full-screen interstitial** via Shopify's Post Purchase Checkout UI Extension (`purchase.post.render` target).

---

## What we're building

### Tier 1: Merchant UI (this session)
- Funnel builder (node graph, wiring)
- Offer editor (product picker, discount config, copy, timer)
- Live preview (realistic full-screen post-purchase render)
- Trigger editor (conditions-based)
- Analytics page (funnel graph, real metrics)

### Tier 2: Shopify Extension (next session)
- React extension for `purchase.post.render`
- CalculateChangeset / ApplyChangeset integration
- Extension response routing (accept → next node, decline → next node)

---

## 1. Funnel Data Model

### Funnel (top-level)
```js
{
  id: string,
  name: string,
  status: 'draft' | 'active' | 'archived',
  trigger: Trigger,
  nodes: OfferNode[],        // all nodes in the funnel
  created_at: string,
  updated_at: string,
}
```

### OfferNode
```js
{
  id: string,                    // uuid
  type: 'single_product' | 'bundle' | 'quantity_upgrade' | 'subscription_upgrade',
  // Product
  product: {
    product_id: string,
    variant_id: string,
    title: string,
    image_url: string,
    original_price: string,    // from Shopify variant
    variant_title: string,
  } | null,
  // Discount
  discount: {
    type: 'percentage' | 'fixed_amount' | 'fixed_price',
    value: number,
  },
  // Quantity
  quantity: number,
  // Copy
  headline: string,
  message: string,
  accept_button_text: string,   // default: "Yes, add to my order"
  decline_button_text: string,  // default: "No thanks"
  // Urgency
  countdown_timer: {
    enabled: boolean,
    duration_seconds: number,
  } | null,
  // Wiring (the core mechanic)
  on_accept_node_id: string | 'thank_you',
  on_decline_node_id: string | 'thank_you',
  // Position in the graph editor canvas
  position: { x: number, y: number },
}
```

### Trigger
```js
{
  conditions: Condition[],
  match: 'all' | 'any',   // AND or OR logic
}
```

### Condition
```js
{
  type: 'cart_contains_product' | 'cart_contains_collection' |
        'cart_value_above' | 'cart_value_below' |
        'discount_code_applied' | 'customer_tag' |
        'customer_order_count' | 'shipping_country',
  // type-specific fields
  product_ids: string[],
  collection_ids: string[],
  amount: number,
  codes: string[],
  tags: string[],
  operator: 'eq' | 'gt' | 'lt',
  value: number,
  countries: string[],
}
```

---

## 2. Funnel Builder UI (OfferBuilder.jsx)

### Layout: Three-column
```
[Left: Node Graph Canvas] | [Right: Offer Editor Panel]
```

**Left pane (60% width):** Scrollable canvas with the node graph
**Right pane (40% width):** Offer editor that slides in when a node is selected

### Node Graph Canvas
- Each `OfferNode` renders as a card (product thumbnail, headline, discount badge)
- Two output ports on each node:
  - Green "accept" port (bottom-right) → click to start wiring an accept edge
  - Red "decline" port (bottom-left) → click to start wiring a decline edge
- When wiring: click the port, then click the target node to connect
- Active edge shows a colored line (green=accept, red=decline)
- Click an existing edge to delete it
- "Thank You" is a fixed terminal node (shown as a rounded rect, not editable)
- "Add Node" button spawns a new node in the canvas
- Each node card is draggable (updates `position.x/y`)
- Nodes can be deleted (except the trigger node)
- Canvas pans and zooms (mouse drag on empty space, scroll to zoom)

### Top bar (above canvas)
- Funnel name (inline editable)
- Status badge (Draft / Active)
- "Preview" button (opens full-screen preview modal)
- "Save" button
- Node count: "3 nodes"

### When no nodes exist
Empty state: "Add your first offer node" with a large "+" button

---

## 3. Offer Editor Panel (right pane, slides in when node selected)

### Sections (collapsible, same pattern as current):

**A. Product Section**
- Large "Select Product" button — opens a modal with Shopify product search
- Product search: live search input querying `GET /admin/api/products.json?q=`
- Results show: thumbnail, title, price range
- Click a product → shows variant picker
- Selected product shows: large thumbnail, title, selected variant, price
- "Remove" button to clear
- Quantity input: number stepper (default: 1, max: 10)

**B. Discount Section**
- Three toggle buttons: "% Off" | "$ Off" | "Fixed Price"
- Input field for the value
- Live preview of: original price, discounted price, savings $ and %

**C. Copy Section**
- Headline: text input (max 80 chars)
- Message: textarea (max 200 chars)
- Accept button text: text input (default: "Yes, add to my order")
- Decline button text: text input (default: "No thanks")

**D. Urgency Section**
- Toggle: "Show countdown timer"
- When enabled: duration input in seconds (default: 900 = 15 min)

**E. Node Type Section**
- Four small cards: Single Product | Bundle | Quantity Upgrade | Subscription Upgrade
- Selecting a type changes the icon/badge on the node card

**F. Wiring Section** (at bottom, always visible when node selected)
- "When accepted →" dropdown of other nodes + "Thank You"
- "When declined →" dropdown of other nodes + "Thank You"
- Visual diagram: this node → [accept] → target, this node → [decline] → target

---

## 4. Live Preview (modal, renders what customer actually sees)

### Dimensions
- Centered card, max-width 600px, full viewport height
- White/light background (customers see this outside the dark merchant UI)
- Mobile preview toggle: renders at 375px width

### Layout (top to bottom)
1. **Badge strip**: "ONE-TIME OFFER" purple badge
2. **Product image**: full-width, max 300px tall, object-fit cover
3. **Headline**: large bold text
4. **Message**: body text
5. **Variant name**: if applicable
6. **Quantity row**: "Qty" label + stepper + current qty
7. **Price block**:
   - Original price: ~~$XX.99~~ (strikethrough, red)
   - Discounted price: **$YY.YY** (large, green)
   - Savings: "You save $ZZ.ZZ (XX%)" (green badge)
8. **Accept button**: Full-width, large, purple (#8b5cf6), white text
   - Text from `accept_button_text`
   - Shows price: "Add to order — $XX.XX"
9. **Decline link**: "No thanks" as text link below button
10. **Timer** (if enabled): countdown at top of page, "Offer expires in MM:SS"

---

## 5. Trigger Editor (separate section, always visible in left pane above the node graph)

### Header
"Trigger — when does this funnel activate?"

### Conditions builder
- "Match" toggle: ALL / ANY (AND/OR logic)
- Each condition is a row:
  - Type dropdown
  - Value input(s) depending on type
  - Remove button
- "Add Condition" button
- Supported types with their inputs:
  - Cart contains product(s) → multi-select product picker
  - Cart contains collection → multi-select collection picker
  - Cart value above $ → number input
  - Cart value below $ → number input
  - Discount code applied → text input (comma-separated)
  - Customer has tag(s) → multi-select tag input
  - Customer order count → operator dropdown + number
  - Shipping country → multi-select country dropdown

---

## 6. Analytics Page (funnel visualization + metrics)

### Funnel Graph
- Render the actual node graph (same node cards as builder)
- Show on each edge: conversion % (e.g., "42% accepted")
- Show per node:
  - Impressions: customers who reached this node
  - Acceptance rate: accepts / reached
  - Revenue: sum of accepted offer values (post-discount)

### Stats row (top)
Four stat cards:
- **Impressions**: total customers who saw any offer
- **Accept Rate**: total accepts / total impressions
- **Revenue**: total additional revenue generated
- **AOV Lift**: (avg order value with upsell) / (avg order value baseline) - 1

### Node table
Columns: Node #, Product, Impressions, Accept %, Revenue, Actions
- Rows are clickable → highlight that node in the funnel graph above

---

## 7. Shopify Post Purchase Extension (separate from merchant UI)

### Where it lives
- `app/frontend/src/extensions/post-purchase/`
- This is a separate React app bundled for Shopify's extension runtime

### Shopify Extension Manifest (`shopify.extension.toml`)
```toml
api_version = "2024-01"
name = "RevenuePulse Post Purchase"
[target.purchase.post.render]
resource = "checkout"
```

### Extension React component (`PostPurchaseExtension.tsx`)
```tsx
import { useEffect, useState } from 'react';
import { render, extend, BlockStack, Text, Image, Button, useQuantity, useApplyChangeset, useCartLines } from '@shopify/checkout-ui-extensions';

extend('purchase.post.render', (root) => {
  // Fetch offer from RevenuePulse API using checkout token
  // Render offer UI
  // On accept: call CalculateChangeset then ApplyChangeset
  // On decline: call extension.done() to proceed to thank you
  root.appendChild(/* ... */);
  root.forceUpdate();
});
```

### Key implementation points
- Use `useCartLines()` to read current cart
- Use `useApplyChangeset()` to apply the accepted offer
- On accept: `changeset.create({ type: 'add_variant', variantId, quantity, discount })`
- Handle errors: out of stock, payment declined → route to decline branch
- The extension itself returns the next node to render — chain offers by re-rendering with next node

---

## 8. Backend API Changes

### Database schema
New table `funnels`:
```sql
CREATE TABLE funnels (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  trigger_json TEXT,          -- JSON string of Trigger
  nodes_json TEXT,             -- JSON string of OfferNode[]
  created_at DATETIME,
  updated_at DATETIME
);
```

Rename `upsell_offers` to `funnels` or create as new — keeping existing for backwards compat during transition.

### API routes
```
GET    /api/funnels           → list all funnels
POST   /api/funnels           → create funnel
GET    /api/funnels/:id       → get funnel
PUT    /api/funnels/:id       → update funnel
DELETE /api/funnels/:id       → delete funnel

POST   /api/funnels/:id/publish   → set status=active
POST   /api/funnels/:id/unpublish → set status=draft
```

### Analytics route
```
GET /api/analytics/funnel/:id
→ returns per-node metrics: impressions, accepts, declines, revenue
```

---

## 9. File changes summary

| File | Action |
|------|--------|
| `app/frontend/src/pages/OfferBuilder.jsx` | Rewrite as funnel builder (graph + editor) |
| `app/frontend/src/components/OfferEditor.jsx` | Rewrite as offer editor (product picker, discount, copy) |
| `app/frontend/src/components/VisualPreview.jsx` | Rewrite as full-screen post-purchase preview |
| `app/frontend/src/components/NodeGraph.jsx` | NEW: graph canvas with wiring |
| `app/frontend/src/components/ProductPicker.jsx` | NEW: Shopify product search + variant picker modal |
| `app/frontend/src/components/TriggerEditor.jsx` | NEW: conditions-based trigger builder |
| `app/frontend/src/pages/Analytics.jsx` | Rewrite with funnel graph + metrics |
| `app/routes/funnel.routes.js` | NEW: CRUD for funnels + analytics |
| `app/models/db.js` | Add funnels table |
| `app/frontend/src/extensions/post-purchase/` | NEW: Shopify extension React app |
| `app/frontend/dist/` | Built extension output |

---

## 10. Dependencies to add
- `uuid` (already in package.json)
- No new frontend deps needed — use native React + CSS
- Shopify extension uses `@shopify/checkout-ui-extensions` (dev dep for types)

---

## Constraints
- Keep dark theme with purple (#8b5cf6) accent
- Keep existing routing (Dashboard, Offers, Analytics, Billing, Settings)
- Keep existing auth (Express routes with verifyShop middleware)
- Railway auto-deploys on push to GitHub (no token needed)
- Extension must complete within 60 seconds
