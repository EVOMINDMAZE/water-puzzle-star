# Ad Mode Invite Worker

This worker verifies signed ad-free invite tokens for frontend mode resolution.

## Route

- `POST /verify-invite`

## Required Variables

- `AD_MODE_INVITE_SECRET`
- `AD_MODE_INVITE_AUD`
- `AD_MODE_ALLOWED_ORIGINS`

## Wrangler Deploy Example

```bash
npx wrangler deploy worker/ad-mode-invite-worker.js --name water-puzzle-ad-mode
```

## Expected Frontend Configuration

Set this value before loading `monetization.js`:

- `window.AD_MODE_VERIFY_ENDPOINT = "https://<worker-domain>/verify-invite"`

# Analytics Ingest Worker

This worker receives analytics event batches and stores them in D1 or KV.

## Route

- `POST /ingest-analytics`

## Required Variables

- `ANALYTICS_ALLOWED_ORIGINS`

## Optional Bindings

- `ANALYTICS_DB` for D1 writes
- `ANALYTICS_EVENT_STORE` for KV fallback writes

## D1 Schema

Apply:

```bash
npx wrangler d1 execute <DB_NAME> --file worker/analytics-ingest-schema.sql
```

## Wrangler Deploy Example

```bash
npx wrangler deploy worker/analytics-ingest-worker.js --name water-puzzle-analytics
```

## Expected Frontend Configuration

Set this value before loading `analytics.js`:

- `window.ANALYTICS_INGEST_ENDPOINT = "https://<worker-domain>/ingest-analytics"`
