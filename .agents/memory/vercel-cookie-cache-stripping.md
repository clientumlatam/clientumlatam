---
name: vercel-cookie-cache-stripping
description: Vercel serverless functions default to public/cacheable Cache-Control, and its edge CDN strips Set-Cookie from cacheable responses.
---

Vercel serverless functions (Node runtime) default to `Cache-Control: public, max-age=0, must-revalidate` when the app doesn't set its own Cache-Control header. Vercel's edge CDN treats that as cacheable and strips the `Set-Cookie` header before the response reaches the browser.

**Why:** Diagnosed on Clientum CRM (clientum.com.ar) — login/register returned 200/201 in production but no Set-Cookie ever arrived, so every subsequent authenticated request failed with "No autenticado" even though the same code worked fine in local/Replit dev (no such CDN layer there). Confirmed via curl: prod response had no set-cookie header at all; after the fix it appeared correctly.

**How to apply:** Any Express (or similar) app deployed to Vercel that relies on session cookies must explicitly set `Cache-Control: no-store` (or otherwise disable caching) on API responses — don't rely on framework/runtime defaults. Add it as global middleware near the top of the app if the whole app is API-only in that deployment.
