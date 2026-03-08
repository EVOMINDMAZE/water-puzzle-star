# Analytics Ingest API

## Endpoint

- `POST /ingest-analytics`
- Content-Type: `application/json`

## Request

```json
{
  "schemaVersion": "1.1.0",
  "playerId": "player_xxx",
  "sessionId": "analytics_xxx",
  "events": [
    {
      "schemaVersion": "1.1.0",
      "eventType": "level_complete",
      "category": "progression",
      "timestamp": 1773000000000,
      "sessionId": "analytics_xxx",
      "playerId": "player_xxx",
      "sessionIndex": 3,
      "acquisition": {
        "source": "reddit",
        "medium": "blog",
        "campaign": "launch_week",
        "content": "post_a",
        "referrer": "https://reddit.com"
      },
      "payload": {
        "levelIndex": 12,
        "moves": 18,
        "stars": 2
      }
    }
  ]
}
```

## Response

```json
{
  "accepted": 40,
  "rejected": 0,
  "capped": false,
  "storedWith": "d1"
}
```

## CORS

Set `ANALYTICS_ALLOWED_ORIGINS` to a comma-separated origin allowlist.

## Storage bindings

- Preferred: `ANALYTICS_DB` (D1 database binding)
- Fallback: `ANALYTICS_EVENT_STORE` (KV namespace)

## Limits

- Request payload target limit: 256 KB.
- Events capped to first 200 per request.
