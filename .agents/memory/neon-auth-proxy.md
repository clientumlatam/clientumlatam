---
name: Neon Auth proxy integration
description: How Neon Auth (Better Auth) REST API is integrated server-side without the blocked SDK.
---

## Rule
Never call Neon Auth REST API from the frontend. Always proxy through the Express backend.

**Why:** The `@neondatabase/neon-js` SDK is blocked by Replit's firewall (it pulls in `better-auth`). Direct frontend calls to `neonauth.sa-east-1.aws.neon.tech` hit CORS without the correct origin. Backend proxy solves both.

## How to apply
- `NEON_AUTH_BASE = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL`
- All fetch calls to Neon Auth **must** include `Origin: https://clientum.com.ar` (or APP_URL). Better Auth rejects requests without Origin header with HTTP 400 "MISSING_ORIGIN".
- Sign-up: `POST {NEON_AUTH_BASE}/sign-up/email` body `{ email, password, name? }`
- Sign-in: `POST {NEON_AUTH_BASE}/sign-in/email` body `{ email, password }`
- Response: `{ user: { id, email, name, ... }, session: { token, ... } }`
- After Neon Auth success → call `upsertNeonAuthUser()` to sync into local `users` table (keyed by `neon_auth_id` or `email`), then create Express session.
- Fallback: if `NEON_AUTH_BASE` is empty, use local bcrypt auth against `users` table.

## DB columns required
`users` table needs `email VARCHAR(255) UNIQUE` and `neon_auth_id TEXT UNIQUE` — added via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `initUsersTable()`.

## Dev vs Prod
- `VITE_NEON_AUTH_URL` is set in Replit env → proxy uses Neon Auth in dev too.
- `APP_URL` is empty in Replit dev → fallback to `https://clientum.com.ar` as Origin (accepted by Neon Auth since it's a registered domain).
- `NEON_AUTH_BASE_URL` and `VITE_NEON_AUTH_URL` are set in Vercel for prod.
