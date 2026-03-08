# Ad Mode Invite Verification Contract

## Endpoint

- `POST /verify-invite`
- Content-Type: `application/json`

## Request Body

```json
{
  "token": "string"
}
```

## Success Response

```json
{
  "valid": true,
  "mode": "adfree",
  "expiresAt": "2026-03-15T12:00:00.000Z",
  "campaignId": "creator_campaign_001",
  "reason": ""
}
```

## Rejected Response

```json
{
  "valid": false,
  "mode": "ads",
  "expiresAt": null,
  "campaignId": "",
  "reason": "expired_token"
}
```

## Token Payload Shape

The signed token payload must include:

- `mode`: `"adfree"`
- `exp`: unix epoch seconds
- `aud`: expected audience/project identifier
- `campaignId`: optional campaign label

## Environment Variables

- `AD_MODE_INVITE_SECRET`: HMAC signing secret
- `AD_MODE_INVITE_AUD`: required audience string
- `AD_MODE_ALLOWED_ORIGINS`: comma-separated CORS allowlist

## Failure Behavior

- Signature mismatch, invalid format, audience mismatch, or expiry returns `valid: false`.
- API must never return signing secret or raw signature details.
