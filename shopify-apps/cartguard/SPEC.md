# CartGuard — Shopify Cart Abandonment Recovery & Exit Intent App

## 1. Concept & Vision

CartGuard is a Shopify app that recovers abandoned carts and captures leaving visitors through intelligent exit-intent detection. It feels like a vigilant store assistant — catching visitors at the door with a compelling offer before they leave. The tone is confident, conversion-focused, and data-driven.

## 2. Design Language

**Aesthetic:** Polaris-inspired dark dashboard. Deep slate backgrounds, crisp white text, electric blue accents. Professional SaaS — not flashy.

**Color Palette:**
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Border: `#334155` (slate-700)
- Primary: `#3b82f6` (blue-500)
- Primary Hover: `#2563eb` (blue-600)
- Accent: `#10b981` (emerald-500) — for positive metrics/recovery
- Warning: `#f59e0b` (amber-500)
- Danger: `#ef4444` (red-500)
- Text Primary: `#f8fafc` (slate-50)
- Text Secondary: `#94a3b8` (slate-400)
- Text Muted: `#64748b` (slate-500)

**Typography:** Inter (Google Fonts), system-ui fallback. Monospace for codes/numbers.

**Motion:** Subtle transitions (150ms ease). No distracting animations.

## 3. Layout & Structure

**Sidebar Navigation (240px):**
- Logo: CartGuard icon + wordmark
- Nav items: Dashboard, Campaigns, Visitors, Analytics, Settings, Billing
- Active state: blue left border, lighter background
- Collapsed on mobile (hamburger)

**Content Area:**
- Page header with title + primary action button
- Cards/grids for data
- Tables for lists
- Modals for forms

## 4. Features & Interactions

### Exit Intent Detection
- JS snippet embedded in storefront via theme app extension
- Detects `mouseleave` on viewport (desktop) or `scroll-up` gesture (mobile)
- Fires once per session per visitor
- Configurable delay (default 5 seconds after page load)
- Triggers modal with configured offer

### Cart Abandonment Recovery
- Tracks cart state via storefront events
- Identifies abandonment when: visitor adds to cart → leaves without purchasing
- Sends webhook to Shopify Flow for email/SMS recovery sequence
- Reports recovered vs abandoned

### Automatic Coupon Injection
- When cart value ≥ configured threshold, show modal with coupon
- Option to auto-apply discount at checkout
- Supports percentage, fixed amount, free shipping

### Email Capture
- If checkout lacks email, prompt capture before exit
- Store in visitors table with cart contents
- Sync to Shopify Customer (create if new)

### Abandoned Checkout Recovery
- Leverage Shopify's native abandoned checkout emails
- Trigger custom recovery sequence via Flow webhook

## 5. Component Inventory

### Exit Intent Modal
- Headline (customizable)
- Subtext/offer description
- Discount display (code or auto-apply toggle)
- Email capture field (optional)
- CTA button ("Stay & Save" / "Apply Discount")
- Close button (X)
- States: loading, success (code revealed), error

### Campaign Card
- Type badge (exit-intent / abandoned-cart / price-threshold)
- Status indicator (active/paused/draft)
- Trigger config summary
- Offer summary
- Quick actions: edit, pause, delete, duplicate

### Visitor Row
- Email (or "Anonymous" + timestamp)
- Cart value
- Status (browsing / abandoned / recovered)
- Captured date
- Campaign associated

### Analytics Dashboard Cards
- Abandonment Rate (percentage)
- Recovery Rate (percentage)
- Revenue Recovered ($)
- Emails Captured (count)
- Funnel chart: visited → added cart → abandoned → recovered

### Settings Panel
- Exit intent delay slider (1-30s)
- Session frequency (once per session / once per hour)
- Offer trigger threshold ($)
- Modal appearance (slide-in / fade / pop)
- Custom CSS override

## 6. Technical Approach

**Stack:** Node.js 20, Express, better-sqlite3, ES modules

**Database:** SQLite via better-sqlite3
- `stores` — shop installation data
- `campaigns` — campaign configurations
- `visitors` — anonymous + known visitor tracking
- `coupons` — discount codes
- `analytics_events` — funnel tracking

**API Endpoints:**
- `GET/POST /api/auth` — OAuth start/callback
- `GET/POST /api/campaigns` — CRUD campaigns
- `GET /api/campaigns/:id` — single campaign
- `PUT/DELETE /api/campaigns/:id`
- `GET /api/visitors` — list with pagination
- `POST /api/visitors/email` — capture email
- `GET /api/analytics/dashboard` — summary stats
- `GET /api/analytics/funnel` — funnel data
- `GET/POST /api/coupons` — coupon CRUD
- `GET/POST /api/billing/activate` — plan activation

**Billing Tiers:**
- Starter $19/mo: 500 emails/mo, 1 active campaign, basic analytics
- Growth $49/mo: Unlimited emails, 5 campaigns, A/B test offers
- Pro $99/mo: Unlimited everything, SMS recovery, priority support

**Extension:** Shopify app extension for storefront exit-intent widget (CDN-bundled React)

**Port:** 3002
