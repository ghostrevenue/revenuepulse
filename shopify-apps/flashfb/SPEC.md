# FlashFB - Shopify Facebook & Instagram Pixel Integration

## Overview

FlashFB is a Shopify app that integrates Facebook and Instagram tracking via both Facebook Pixel and Meta Conversions API (CAPI). It provides event deduplication, custom conversions, audience sync, and ROAS analytics.

## Features

- [x] Facebook Pixel Integration - Track PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
- [x] Meta Conversions API - Server-side event tracking for better iOS 14+ compatibility
- [x] Event Deduplication - Prevent double-counting of events between pixel and CAPI
- [x] Custom Conversions - Create custom conversion rules from event combinations
- [x] Audience Sync - Sync Shopify customers to Facebook Custom Audiences
- [x] Lookalike Creation - Create lookalike audiences based on purchasers
- [x] ROAS Tracking - Report on campaign performance via Shopify order data

## Architecture

- **Backend**: Express.js on Node.js 20, port 3006
- **Database**: SQLite via better-sqlite3
- **Frontend**: React (CDN-loaded), dark Polaris-inspired design
- **Extension**: Shopify storefront pixel script

## Database Schema

### stores
- id (TEXT PRIMARY KEY)
- shop (TEXT UNIQUE)
- access_token
- fb_pixel_id
- fb_access_token
- scope
- created_at

### pixel_configs
- id (INTEGER PRIMARY KEY)
- store_id (TEXT FK)
- pixel_id
- access_token
- test_event_id
- enabled
- created_at

### events
- id (INTEGER PRIMARY KEY)
- store_id (TEXT FK)
- event_id
- event_name
- event_source (pixel/capi)
- fbp
- fbc
- value
- currency
- order_id
- deduplicated
- payload
- created_at

### audiences
- id (INTEGER PRIMARY KEY)
- store_id (TEXT FK)
- name
- audience_type (custom_audience/lookalike)
- rules (JSON)
- size
- status
- fb_audience_id
- synced_at
- created_at

### custom_conversions
- id (INTEGER PRIMARY KEY)
- store_id (TEXT FK)
- name
- event_names
- rules (JSON)
- count
- created_at

### billing
- id (INTEGER PRIMARY KEY)
- store_id (TEXT FK UNIQUE)
- plan (starter/growth/pro)
- status
- created_at

## API Endpoints

### Auth
- GET /api/auth/shopify - Initiate Shopify OAuth
- POST /api/auth/shopify/callback - OAuth callback
- GET /api/auth/verify - Verify store authentication

### Pixel
- GET /api/pixel/:storeId - List all pixels
- GET /api/pixel/:storeId/config - Get active config
- POST /api/pixel/:storeId - Save pixel configuration
- POST /api/pixel/:storeId/test - Test pixel connection
- DELETE /api/pixel/:storeId/:pixelId - Remove pixel

### Events
- GET /api/events/:storeId - List events
- GET /api/events/:storeId/stats - Get event statistics
- GET /api/events/:storeId/order/:orderId - Get events by order
- POST /api/events/:storeId - Record new event

### Audiences
- GET /api/audiences/:storeId - List audiences
- POST /api/audiences/:storeId - Create audience
- PUT /api/audiences/:storeId/:id - Update audience
- DELETE /api/audiences/:storeId/:id - Delete audience

### Conversions
- GET /api/conversions/:storeId - List conversions
- POST /api/conversions/:storeId - Create conversion
- PUT /api/conversions/:storeId/:id - Update conversion
- DELETE /api/conversions/:storeId/:id - Delete conversion

### Analytics
- GET /api/analytics/:storeId/overview - Dashboard overview
- GET /api/analytics/:storeId/roas - ROAS by campaign
- GET /api/analytics/:storeId/timeline - Event timeline

### Billing
- GET /api/billing/:storeId - Get current plan
- GET /api/billing/plans - List all plans
- POST /api/billing/:storeId/activate - Activate a plan

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 1 pixel, basic events, 5 custom conversions |
| Growth | $49/mo | 5 pixels, audience sync, CAPI, full analytics |
| Pro | $99/mo | Unlimited pixels, lookalikes, full ROAS, priority support |

## Installation

```bash
cd flashfb
npm install
npm start
```

The app runs on port 3006 by default.

## Environment Variables

See .env.example for configuration options.
