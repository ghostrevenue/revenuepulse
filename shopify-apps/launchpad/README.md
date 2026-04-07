# LaunchPad

Pre-launch waitlist & product launch countdown app for Shopify.

## Features

- **Pre-Launch Waitlist** - Collect emails for upcoming products
- **Countdown Timers** - Live countdown on your store
- **Launch Notifications** - Email waitlist when you launch
- **Viral Sharing** - Refer-a-friend to move up the waitlist
- **Early Access** - Give subscribers early purchasing access
- **Analytics** - Track signup rates, referral performance, and launch day spikes

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Starter | $19/mo | 1 campaign, 500 subscribers, basic analytics |
| Growth | $49/mo | 5 campaigns, unlimited subscribers, referral system, early access |
| Pro | $99/mo | Unlimited campaigns, viral sharing, full analytics, priority support |

## Setup

```bash
npm install
cp .env.example .env
# Fill in your Shopify credentials in .env
npm start
```

App runs on **port 3007**.

## Project Structure

```
launchpad/
├── app.js                      # Express entry point
├── package.json
├── .env.example
├── SPEC.md
├── README.md
├── app/
│   ├── models/db.js            # SQLite setup
│   ├── store.js                # Session store
│   ├── campaign.js             # Campaign model
│   ├── waitlist.js             # Waitlist model
│   ├── referral.js             # Referral model
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   └── frontend/               # React dashboard
└── extensions/
    └── launch-widget/          # Storefront widget
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth | Shopify OAuth login |
| GET | /auth/callback | OAuth callback |
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns/:id | Get campaign |
| PUT | /api/campaigns/:id | Update campaign |
| DELETE | /api/campaigns/:id | Delete campaign |
| GET | /api/campaigns/:id/waitlist | List subscribers |
| POST | /api/campaigns/:id/waitlist | Add subscriber |
| POST | /api/campaigns/:id/notify | Send launch email |
| GET | /api/analytics/dashboard | Dashboard stats |
| GET | /api/billing/plans | List pricing plans |
