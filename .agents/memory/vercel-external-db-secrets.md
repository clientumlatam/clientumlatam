---
name: Vercel deploy uses Replit's internal DB / secrets don't transfer
description: Why an external deploy (Vercel etc.) of a Replit project fails auth/DB/API-key features even though everything works in the Replit dev preview.
---

This project (server.ts, Express + Postgres sessions) is also deployed externally to
Vercel (custom domain, not Replit's own Publish). Two structural gaps cause "no
autentica usuarios" / "no andan las secret keys" on that external deploy:

1. **DATABASE_URL points at Replit's internal Postgres host** (`...@helium/heliumdb?sslmode=disable`
   at the time this was diagnosed). That hostname only resolves inside Replit's
   network. A Vercel serverless function cannot reach it, so every DB-backed
   feature (login, sessions via connect-pg-simple, leads, notes) fails silently
   or with connection errors that look like "auth doesn't work."
   **How to apply:** if a user reports auth/DB failures only on an external host
   (Vercel/Railway/etc.), check whether DATABASE_URL is Replit's managed DB
   before debugging session/cookie code — it's almost certainly a reachability
   issue, not a logic bug. The fix is a separately provisioned public Postgres
   (Neon/Supabase) with its own connection string set as that platform's env var.

2. **Replit Secrets/env vars never propagate to Vercel.** They're two separate
   secret stores; every key (SESSION_SECRET, GEMINI_API_KEY, etc.) must be
   copied manually into the Vercel project's Environment Variables UI.

**Why:** Replit's own Publish/Deploy keeps the same managed Postgres and syncs
secrets automatically — that whole class of bug only exists because this project
opted into an external host instead.

Follow-up code change made: `pgPool` in server.ts now sets `ssl: { rejectUnauthorized: false }`
unless the connection string has `sslmode=disable`, since external providers
(Neon/Supabase) require SSL and Replit's internal DB explicitly disables it.

3. **Playwright as a dependency hangs/times out `npm install` on Vercel's build.**
   It was removed from this project entirely (unused) to fix Vercel install
   failures. **Why:** Playwright's postinstall downloads browser binaries,
   which is slow/blocked in Vercel's build sandbox and isn't needed for a
   plain Express+Vite app. **How to apply:** if a Vercel build for this project
   hangs or times out during install, check for heavy postinstall deps
   (Playwright, Puppeteer, Chromium downloads) before assuming a code bug.
