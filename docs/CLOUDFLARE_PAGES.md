# Cloudflare Pages Deployment

This repository is configured for static deployment to Cloudflare Pages.

## One-Time Setup

1. Push this repository to GitHub.
2. In Cloudflare Dashboard, create a new Pages project named `water-puzzle-star`.
3. Connect the GitHub repository.
4. Use these build settings:
   - Framework preset: `None`
   - Build command: *(leave empty)*
   - Build output directory: `.`
5. Let Cloudflare complete the first deploy.

## Enable GitHub Actions Deploys

This repo includes `.github/workflows/cloudflare-pages.yml`.

Add these repository secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
  - Create from Cloudflare API Tokens with Pages edit permissions.
- `CLOUDFLARE_ACCOUNT_ID`
  - Copy from Cloudflare account overview.

After secrets are set:

1. Push to `main` to trigger deployment automatically.
2. Or run the workflow manually from GitHub Actions.

## Runtime Notes

- `_headers` is configured for:
  - security headers on all routes
  - no-cache for `index.html`, `sw.js`, and `manifest.json`
- This avoids stale service-worker behavior during rapid user testing.

## Smoke Check After Deploy

1. Open your Pages URL in an incognito window.
2. Verify:
   - game loads and plays normally
   - no critical console errors
   - theme toggle and top utilities function
   - mission panel opens and claims rewards
