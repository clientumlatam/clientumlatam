---
name: Replit Postgres setup
description: How to connect to Replit's built-in PostgreSQL without SSL issues
---

# Replit internal PostgreSQL

**Rule:** Create `new Pool({ host: PGHOST, port: PGPORT, user: PGUSER, password: PGPASSWORD, database: PGDATABASE, ssl: false })` — do NOT use the DATABASE_URL connection string; it includes ssl params the internal server rejects.

**Why:** Replit's internal Postgres (hostname `helium`) does not support SSL. The DATABASE_URL string has `?ssl=...` which causes errors. Using PG* env vars with `ssl: false` works reliably.

**How to apply:** In any Node.js app on Replit without an external DB provider:
```ts
new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false,
  connectionTimeoutMillis: 5000,
})
```
