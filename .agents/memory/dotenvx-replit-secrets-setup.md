---
name: dotenvx + Replit Secrets setup
description: Por qué los secrets de Vercel no se pueden usar directamente en Replit y cómo se resuelve el bootstrap.
---

# dotenvx encryption vs Replit Secrets

## El problema

Este proyecto usa dotenvx para cifrar secrets en Vercel (formato `{"v":"v2","c":"...","k":[...]}`).  
El script `scripts/pull-secrets.mjs` llama a la API de Vercel con `?decrypt=true`, pero eso solo descifra la capa de Vercel — los valores dotenvx siguen llegando cifrados como blobs base64.

Sin la `DOTENV_PRIVATE_KEY` correcta, `dotenv.config({ path: ".env.local" })` carga los blobs tal cual, lo que rompe cualquier cosa que los use como connection strings o API keys.

## Síntoma más común

El servidor arranca pero falla con `ENOTFOUND base` (hostname inválido al parsear el blob como URL de Postgres) o `password authentication failed` (blob cifrado enviado como password).

## Cómo se detectan los blobs

```ts
function isDotenvxBlob(val: string | undefined): boolean {
  if (!val) return false;
  return val.startsWith("eyJ2IjoidjIi"); // base64 de {"v":"v2"
}
```

Esta función está en `server.ts` y se usa en `resolveDatabaseUrl()` para saltear valores no descifrados.

## Setup correcto para Replit

El único flujo que funciona de forma confiable:

1. Tener `VERCEL_TOKEN` en Replit Secrets (real).
2. Correr `node scripts/pull-secrets.mjs` → genera `.env.local` con blobs.
3. Agregar manualmente en Replit Secrets los secrets críticos con sus valores reales:
   - `NEON_DATABASE_URL` (connection string completo, desde consola de Neon)
   - `GEMINI_API_KEY` (desde Google AI Studio)
   - `SESSION_SECRET`
   - Opcionalmente `GROQ_API_KEY`, `OPENROUTER_API_KEY` para fallback de IA
4. Mantener `.env.local` con `override: false` — los Replit Secrets reales tienen prioridad.

**Por qué:** La `DOTENV_PRIVATE_KEY` que descifra los blobs vive localmente en `.env.keys` (gitignored). Nunca entra a Vercel ni a Replit de forma automática. Sin ella, los blobs son basura.

## Pool de Postgres con SSL

Cuando `databaseUrl` es vacío (sin connection string), `pg` usa las vars `PG*`. Neon requiere SSL aunque se usen vars individuales. El Pool debe ser:

```ts
const pgHostIsExternal = process.env.PGHOST && process.env.PGHOST !== "localhost";
new Pool(databaseUrl ? { connectionString, ssl } : pgHostIsExternal ? { ssl: { rejectUnauthorized: false } } : {})
```

**Why:** Neon rechaza conexiones sin SSL con `connection is insecure (try using sslmode=require)`.
