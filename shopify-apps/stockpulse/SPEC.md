# StockPulse - Shopify Inventory Management App

## Overview

StockPulse is a Shopify app that provides inventory management and low stock alerts. It helps merchants track stock levels, predict restock needs, and manage suppliers and warehouse locations.

## Features

### Core Features
- **Low Stock Alerts** - Email/SMS notifications when inventory drops below threshold
- **Inventory Dashboard** - Real-time view of all product stock levels
- **Restock Predictions** - AI-powered predictions for when you'll run out of stock
- **Multi-location Tracking** - Track inventory across multiple warehouses
- **Supplier Management** - Link products to suppliers with lead times
- **Auto-Reorder Triggers** - Trigger purchase orders at reorder points
- **Historical Stock Levels** - Track stock changes over time

### Dashboard
- Total products count
- Low stock count (items at or below reorder point)
- Out of stock count
- Total units in inventory
- Restock urgency predictions

### Products Management
- Searchable product list with stock levels
- Quantity editor with inline editing
- Bulk CSV import/export capability
- Per-product reorder point configuration

### Alerts System
- Configurable alert thresholds (per-product or global)
- Email and SMS notification support
- Webhook integration for custom alerts
- Alert history with acknowledgment tracking

### Supplier Management
- Supplier CRUD operations
- Lead time tracking (days)
- Minimum order requirements
- Associated product linking

### Location Management
- Multiple warehouse locations
- Address tracking
- Location-based inventory assignment

### Analytics
- Sales velocity (units sold per week)
- Days until stockout predictions
- Suggested reorder date calculation
- Stock level history charts

### Billing Tiers
| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 100 products, email alerts, basic analytics |
| Growth | $49/mo | Unlimited products, SMS alerts, predictions, suppliers |
| Pro | $99/mo | Auto-reorder, multi-location, full analytics, priority support |

## Technical Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React 18 (CDN loaded)
- **API**: RESTful JSON
- **Authentication**: Shopify OAuth 2.0
- **Port**: 3004

## API Endpoints

### Authentication
- `GET /api/auth/mock-login?shop=store.myshopify.com` - Mock login for testing
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/verify` - Verify auth token

### Products
- `GET /api/products` - List all products with stock
- `GET /api/products/status/low-stock` - Products below reorder point
- `GET /api/products/status/out-of-stock` - Out of stock products
- `POST /api/products/bulk-update` - Bulk update stock levels
- `PUT /api/products/:id` - Update product stock

### Alerts
- `GET /api/alerts/configs` - Get alert configurations
- `POST /api/alerts/configs` - Create alert config
- `PUT /api/alerts/configs/:id` - Update alert config
- `GET /api/alerts/history` - Alert history
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/test` - Send test alert

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Analytics
- `GET /api/analytics/velocity` - Sales velocity data
- `GET /api/analytics/predictions` - Stockout predictions
- `GET /api/analytics/summary` - Stock summary
- `GET /api/analytics/history` - Stock history

### Billing
- `GET /api/billing/plan` - Current plan info
- `POST /api/billing/plan` - Update plan
- `GET /api/billing/plans` - All available plans

## Database Schema

### Tables
- `stores` - Shopify store information
- `product_stocks` - Product inventory levels and reorder points
- `alerts` - Alert history
- `alert_configs` - Alert configuration settings
- `suppliers` - Supplier information
- `locations` - Warehouse locations
- `stock_history` - Historical stock level changes
- `billing` - Subscription and plan information

## Environment Variables

```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
APP_URL=https://your-app-url.ngrok.io
APP_PORT=3004
NODE_ENV=development
```

## Installation

```bash
npm install
npm start
```

## Development

```bash
npm run dev  # Uses node --watch for auto-reload
```

## Project Structure

```
stockpulse/
├── app.js                      # Express app entry point
├── package.json
├── .env.example
├── SPEC.md
├── README.md
├── app/
│   ├── models/
│   │   ├── db.js              # SQLite setup
│   │   ├── store.js           # Store model
│   │   ├── product.js         # Product stock model
│   │   ├── alert.js           # Alert model
│   │   ├── supplier.js        # Supplier model
│   │   └── location.js       # Location model
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── products.routes.js
│   │   ├── alerts.routes.js
│   │   ├── suppliers.routes.js
│   │   ├── locations.routes.js
│   │   ├── analytics.routes.js
│   │   └── billing.routes.js
│   ├── services/
│   │   ├── inventory.service.js
│   │   ├── alert.service.js
│   │   ├── prediction.service.js
│   │   └── analytics.service.js
│   └── frontend/
│       ├── index.html
│       └── src/
│           ├── index.jsx
│           ├── App.jsx
│           ├── api/
│           │   ├── products.js
│           │   ├── analytics.js
│           │   └── alerts.js
│           └── pages/
│               ├── Dashboard.jsx
│               ├── Products.jsx
│               ├── Alerts.jsx
│               ├── Suppliers.jsx
│               ├── Locations.jsx
│               ├── Analytics.jsx
│               └── Billing.jsx
```

## License

MIT