# LaunchPad - Product Launch Waitlist & Countdown App

## Overview

LaunchPad is a Shopify app that helps merchants build anticipation and capture leads before product launches. It provides pre-launch waitlists, countdown timers, referral-based viral sharing, early access management, and launch analytics.

## Features

### Core Features
1. **Pre-Launch Waitlist** - Collect emails for products not yet available
2. **Countdown Timers** - Show launch countdown on product pages via storefront widget
3. **Launch Notifications** - Email waitlist subscribers when product goes live
4. **Viral Sharing** - Refer-a-friend to move up the waitlist
5. **Early Access** - Give waitlist subscribers early access before public
6. **Launch Analytics** - Signup rate, referral rate, launch day traffic spike

### Pricing Tiers
- **Starter** ($19/mo): 1 campaign, 500 subscribers, basic analytics
- **Growth** ($49/mo): 5 campaigns, unlimited subscribers, referral system, early access
- **Pro** ($99/mo): Unlimited campaigns, viral sharing (rewards), full analytics, priority support

## Tech Stack
- Node.js 20, Express 4, better-sqlite3, dotenv
- ES modules, Shopify OAuth + Billing API
- CDN-loaded React frontend
- Port 3007

## Data Models

### Campaign
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| store_id | TEXT | Shopify store domain |
| product_id | TEXT | Shopify product ID |
| name | TEXT | Campaign name |
| headline | TEXT | Campaign headline |
| description | TEXT | Campaign description |
| launch_date | TEXT | ISO date for launch |
| status | TEXT | draft/active/launched/ended |
| signup_count | INTEGER | Total signups |
| created_at | TEXT | ISO timestamp |

### WaitlistSubscriber
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| campaign_id | TEXT | FK to Campaign |
| email | TEXT | Subscriber email |
| referred_by | TEXT | FK to subscriber who referred |
| position | INTEGER | Waitlist position |
| notified | INTEGER | 0/1 notified at launch |
| converted | INTEGER | 0/1 converted to buyer |
| created_at | TEXT | ISO timestamp |

### Referral
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| subscriber_id | TEXT | FK to WaitlistSubscriber |
| campaign_id | TEXT | FK to Campaign |
| code | TEXT | Unique referral code |
| click_count | INTEGER | Times shared |
| signup_count | INTEGER | Referred signups |
| created_at | TEXT | ISO timestamp |

## API Routes

### Auth
- `GET /auth` - Initiate Shopify OAuth
- `GET /auth/callback` - OAuth callback handler

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Waitlist
- `GET /api/campaigns/:id/waitlist` - List subscribers
- `POST /api/campaigns/:id/waitlist` - Add subscriber
- `GET /api/waitlist/export/:campaignId` - Export CSV

### Notifications
- `POST /api/campaigns/:id/notify` - Send launch notification
- `GET /api/campaigns/:id/preview` - Preview email

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/campaign/:id` - Campaign analytics

### Billing
- `GET /api/billing/plans` - List plans
- `POST /api/billing/subscribe` - Subscribe to plan

## Storefront Widget (Extension)
- `WaitlistEmbed` - Email signup form
- `CountdownTimer` - Days/hours/minutes to launch
- `ShareWidget` - Refer-a-friend social sharing
