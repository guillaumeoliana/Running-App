# Stride — running & training dashboard

Stride is a French-language, installable web app for running plans, strength sessions, weight and nutrition tracking, and COROS-derived training trends.

## Run locally

Serve this directory over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000`. The dashboard keeps its training log in browser storage. Supabase login and cross-device storage use the public project URL and publishable key in `config.json`.

## Deploy to Vercel

Import this repository and use the repository root as the project root. It is a static site: no build command or output directory is required. Vercel serves `index.html`, `config.json`, the manifest, icons, and service worker from the root.

For Supabase Auth, set the deployed HTTPS URL as the Site URL and add it to the allowed redirect URLs. The `supabase/schema.sql` migration defines the tables and row-level security policies used by the app. Apply it only if those objects are not already present in the connected Supabase project.

`config.json` contains only a Supabase publishable key. Never add a `service_role` key or other server secret to this public static site or repository.

## COROS connection boundary

The COROS connector available in ChatGPT is not an API connection for this static web app. Running-session reads, daily synchronization, and writing a revised training week to COROS still need to happen through ChatGPT and its COROS connector. The app can display imported or cloud-stored observations and training decisions; it does not independently call the COROS MCP.

## Progressive web app

Deploy over HTTPS, then use the browser's **Add to Home Screen** / **Install app** action. The service worker caches the app shell for offline launch and offers updates after a new deployment. Exercise images and the web font may need an internet connection.

The app does not include any personal COROS activities or account data in the repository.
