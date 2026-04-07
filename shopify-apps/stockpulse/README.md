# StockPulse - Shopify Inventory Management

Inventory management and low stock alerts for Shopify stores.

## Features

- 📊 **Dashboard** - Real-time inventory overview with stock alerts
- 📦 **Products** - Manage stock levels, reorder points, bulk updates
- 🔔 **Alerts** - Configure email/SMS/webhook notifications
- 🏭 **Suppliers** - Track lead times and minimum orders
- 📍 **Locations** - Multi-warehouse inventory tracking
- 📈 **Analytics** - Sales velocity, restock predictions, stock history
- 💳 **Billing** - $19/Starter, $49/Growth, $99/Pro plans

## Quick Start

```bash
# Install dependencies
npm install

# Start the app (port 3004)
npm start

# Development mode with auto-reload
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
APP_URL=https://your-app-url.ngrok.io
APP_PORT=3004
NODE_ENV=development
```

## Tech Stack

- Node.js 20+
- Express.js
- SQLite (better-sqlite3)
- React 18 (CDN)
- ES Modules

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products with stock |
| GET | /api/products/status/low-stock | Products below reorder point |
| GET | /api/alerts/configs | Get alert configurations |
| POST | /api/alerts/test | Send test alert |
| GET | /api/analytics/predictions | Stockout predictions |
| GET | /api/billing/plans | Available plans |

See [SPEC.md](./SPEC.md) for complete API documentation.

## Project Structure

```
stockpulse/
├── app.js              # Express entry point
├── app/
│   ├── models/         # SQLite models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── frontend/       # React UI
```

## License

MIT