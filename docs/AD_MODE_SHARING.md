# Ads vs Ad-Free Sharing Guide

## Sharing Modes

- **Ads mode:** default game URL with no invite token.
- **Ad-free mode:** URL includes a signed `invite` token that verifies successfully.

## URL Patterns

- Public with ads:
  - `https://water-puzzle-star.pages.dev/`
- Ad-free invite:
  - `https://water-puzzle-star.pages.dev/?invite=<signed_token>`

Optional debug mode override:

- `?mode=ads`
- `?mode=adfree`

## Token Generation Flow

1. Build payload with:
   - `mode: "adfree"`
   - `exp`: unix timestamp seconds
   - `aud`: expected audience ID
   - `campaignId`: optional
2. Base64url-encode payload JSON.
3. Sign encoded payload using HMAC SHA-256 with `AD_MODE_INVITE_SECRET`.
4. Build token as:
   - `<payloadEncoded>.<signatureBase64url>`
5. Share URL with `invite` query param.

## Expiry and Revocation

- Use short expiries for share links.
- Rotate `AD_MODE_INVITE_SECRET` to invalidate all issued links.
- Keep `AD_MODE_INVITE_AUD` stable per environment to prevent cross-environment reuse.

## Failure Behavior

- Invalid signature, wrong audience, bad format, or expired token falls back to ads.
- Verification network failures also fall back to ads.
- Purchased ad-free entitlement still stays ad-free even if invite fails.

## Troubleshooting

- **Link opens with ads instead of ad-free**
  - Check token expiry and signature.
  - Confirm worker endpoint is set in `window.AD_MODE_VERIFY_ENDPOINT`.
  - Confirm worker CORS allowlist includes your site origin.
- **Invite works locally but not in prod**
  - Confirm `aud` claim matches `AD_MODE_INVITE_AUD` in production worker.
- **All old links still active after rotation**
  - Verify worker is deployed with new `AD_MODE_INVITE_SECRET`.
