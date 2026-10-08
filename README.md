# Stride — running & training dashboard

Stride is a French-language, installable web app for running plans, strength sessions, weight and nutrition tracking, and COROS-derived training trends.

## Run locally

```sh
npm install
npm run dev
```

The app keeps its training log in browser storage. Supabase login and cross-device storage use the public project URL and publishable key in `public/config.json`.

## Architecture and checks

The app shell, navigation, overlays, and shared sport calculations use React, TypeScript, and Vite. Existing training screens and their interactions are kept behind a compatibility runtime while they are migrated feature by feature; their styles live in `src/styles.css`. Shared calculation tests run with `npm test` and the production bundle builds with `npm run build`.

## Deploy to Vercel

Use the repository root as the project root. Vercel builds with `npm run build` and serves `dist/`. Static PWA files live in `public/` and are copied into the build output.

For Supabase Auth, set the deployed HTTPS URL as the Site URL and add it to the allowed redirect URLs. The `supabase/schema.sql` migration defines the tables and row-level security policies used by the app. Apply it only if those objects are not already present in the connected Supabase project.

`public/config.json` contains only a Supabase publishable key. Never add a `service_role` key or other server secret to this public site or repository.

## COROS connection boundary

The COROS connector available in ChatGPT is not an API connection for this web app. Running-session reads, daily synchronization, and writing a revised training week to COROS still need to happen through ChatGPT and its COROS connector. The app can display imported or cloud-stored observations and training decisions; it does not independently call the COROS MCP.

## Progressive web app

Deploy over HTTPS, then use the browser's **Add to Home Screen** / **Install app** action. The service worker caches the app shell and built assets for offline launch and offers updates after a new deployment. Exercise images and the web font may need an internet connection.

The app does not include any personal COROS activities or account data in the repository.
