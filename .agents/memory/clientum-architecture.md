---
name: Clientum arquitectura completa
description: Stack, schema de DB, rutas API, variables de entorno, flujo dev→deploy y decisiones clave de infraestructura.
---

# Arquitectura Clientum CRM

## Stack
- Frontend: React 19 + Vite 6 + Tailwind v4
- Backend: Express 4, Node 22, TypeScript
- DB: Neon PostgreSQL (pooled), raw `pg`
- IA: Google Gemini (@google/genai), fallback local de alta calidad
- Paquetes: pnpm

## Entrypoints duales
- `server.ts` → dev local + Cloud Run (app.listen en :5000, Vite middleware embebido)
- `api/index.ts` → Vercel serverless (importa server.ts, no llama a app.listen porque VERCEL=1)

## tsconfig duales (crítico)
- raíz: moduleResolution "bundler" (Vite)
- api/tsconfig.json: moduleResolution "node16" (Vercel tsc)
Sin api/tsconfig.json, Vercel falla con "Cannot find module" en los imports de Express.

## Resolución de DATABASE_URL (orden de prioridad)
1. NEON_API_KEY + NEON_PROJECT_ID → llama API Neon, obtiene pooled URL del branch default
2. DATABASE_URL → usa directamente
3. Nada → string vacío → crash en primera query

## Variables de entorno — completas

### Requeridas
- SESSION_SECRET — firma cookies Express
- GEMINI_API_KEY — Google Gemini AI
- CRM_INTERNAL_TOKEN — webhook WordPress plugin → /api/webhooks/chatbot-lead (header X-CRM-Token)
- NEON_API_KEY + NEON_PROJECT_ID (preferido) o DATABASE_URL (fallback)

### Opcionales
- APIFY_API_TOKEN — scraping Google Maps (3 actores con fallback)
- GOOGLE_MAPS_PLATFORM_KEY — Places API (New)
- GOOGLE_MAPS_API_KEY — alias legacy de la anterior (server.ts usa ambas con || fallback)
- HUNTER_API_KEY — Hunter.io contact enrichment
- SANTI_API_KEY — autenticación SDR Santi (header X-Api-Key)
- APP_URL — URL pública del app

### Auto-inyectadas (NO setear manualmente)
- VERCEL=1 (Vercel) — desactiva app.listen() en server.ts
- PORT — default 5000
- NODE_ENV — "production" en Vercel/Cloud Run
- DISABLE_HMR — Replit lo setea cuando es necesario

## Tablas PostgreSQL
users, session, chatbot_leads, santi_leads, santi_brochures, santi_notes
Todas creadas con CREATE TABLE IF NOT EXISTS al startup (sin ORM, sin migraciones).

## Auth
- bcryptjs 12 rondas
- Role re-verificado desde DB en cada request (no se confía en sesión)
- Primer usuario registrado = admin automático (lock de tabla para evitar race condition)

## Middleware de seguridad
- Cache-Control: no-store en TODAS las respuestas API → crítico para Vercel CDN (ver vercel-cookie-cache-stripping.md)
- requireAuth: sesión Express
- requireAdmin: sesión + re-query DB por role
- requireApiKey: X-Api-Key = SANTI_API_KEY (SDR Santi)
- requireCrmToken: X-CRM-Token = CRM_INTERNAL_TOKEN (webhook WP)

## CI/CD
- .github/workflows/ci.yml: tsc --noEmit + vite build en cada push/PR (con pnpm + cache)
- .github/workflows/neon_workflow.yml: branch Neon por PR (expira 14 días), elimina al cerrar
- Vercel: auto-deploy en push a main via GitHub integration (no hace falta workflow adicional)

## Documentación clave en el repo
- docs/ARCHITECTURE.md: referencia técnica completa
- docs/SANTI-SDR.md: integración SDR Santi/Hermes
- .env.example: lista completa de env vars con descripciones y cómo obtenerlas

**Why:** centralizar todo el conocimiento arquitectónico para que cualquier sesión futura pueda orientarse rápido sin explorar el código desde cero.
**How to apply:** leer docs/ARCHITECTURE.md antes de cualquier cambio de infraestructura, DB schema, o env vars.
