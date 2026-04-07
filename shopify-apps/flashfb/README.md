# FlashFB

Facebook & Instagram Pixel & Meta Conversions API integration for Shopify.

## Quick Start

```bash
cd /home/theoffice/mission-control/shopify-apps/flashfb
npm install
npm start
```

App will start on port 3006.

## Features

- **Facebook Pixel** - Track all key commerce events
- **Conversions API (CAPI)** - Server-side tracking for better data accuracy
- **Event Deduplication** - Prevent double-counting between pixel and CAPI
- **Custom Conversions** - Define conversion rules from any event combination
- **Audience Sync** - Sync customers to Facebook Custom Audiences
- **Lookalike Creation** - Build lookalike audiences from purchasers
- **ROAS Analytics** - Track return on ad spend per campaign

## Pages

- **Dashboard** - Overview of pixel status, today's events, conversion value
- **Pixel** - Configure Facebook Pixel ID and CAPI access token
- **Events** - Event log with deduplication status
- **Audiences** - Create and manage custom audiences
- **Conversions** - Define custom conversion rules
- **Analytics** - ROAS by campaign, event timeline
- **Billing** - Plan management ($19 / $49 / $99)

## Tech Stack

- Node.js 20 + Express
- SQLite (better-sqlite3)
- React (CDN)
- Shopify OAuth + Billing API

## Notes

- Default store ID for demo: `demo-store`
- Pixel extension located in `extensions/fb-pixel/`
- CORS enabled for local development
