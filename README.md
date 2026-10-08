# Stride — running & training dashboard

Stride is a French-language, installable web app for running plans, strength sessions, weight and nutrition tracking, and COROS-derived training trends.

## Run locally

```sh
npm install
npm run dev
```

The app keeps its training log in browser storage. COROS readings are served by a server-side Vercel Function from the server-only `COROS_SNAPSHOT_JSON` environment variable. The production dashboard is accessible without login at the owner’s request. Its metrics are therefore visible to visitors. Keep account data and credentials out of GitHub and never use a `VITE_` variable for private values.

## Architecture and checks

The app shell, navigation, overlays, and shared sport calculations use React, TypeScript, and Vite. Existing training screens and their interactions are kept behind a compatibility runtime while they are migrated feature by feature; their styles live in `src/styles.css`. Shared calculation tests run with `npm test` and the production bundle builds with `npm run build`.

## Deploy to Vercel

The GitHub repository is linked to the Cordon bleu Vercel project. Every push to main deploys production after tests and build pass; other branches receive previews. Use the repository root as the project root. Vercel builds with `npm run build` and serves `dist/`. Static PWA files live in `public/` and are copied into the build output.

## COROS connection boundary

The COROS MCP is available to ChatGPT, not to the website. ChatGPT reads the COROS data and securely updates `COROS_SNAPSHOT_JSON`; the site reads that snapshot through the Vercel Function. No COROS token or Supabase key is sent to the browser. The MCP remains the source of truth for synchronization and workout changes.

## Progressive web app

Deploy over HTTPS, then use the browser's **Add to Home Screen** / **Install app** action. The service worker caches the app shell and built assets for offline launch and offers updates after a new deployment. Exercise images and the web font may need an internet connection.

The app does not include any personal COROS activities or account data in the repository.

The daily ChatGPT automation reads the official COROS MCP, updates the server snapshot, and redeploys the current main commit. It is scheduled at 23:59 Europe/Paris. Refreshing the dashboard or returning to it loads the latest published snapshot.
