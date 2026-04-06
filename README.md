# RevenuePulse

Revenue analytics dashboard for Shopify merchants.

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Railway

1. Push to GitHub
2. Connect Railway to repo
3. Add environment variables:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `APP_URL`
   - `DATABASE_URL` (auto-provisioned by Railway Postgres)
4. Deploy

## Tech Stack

- Node.js + Express
- React 18 (CDN)
- SQLite (dev) → PostgreSQL (prod)

## License

MIT
