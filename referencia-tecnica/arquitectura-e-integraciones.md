# Arquitectura Técnica e Integraciones — Clientum CRM
> Documento canónico de ingeniería · Julio 2026

---

## Visión general

Clientum es un CRM B2B con IA para pymes de la Patagonia: descubre prospectos, los califica con MEDDIC, genera brochures PDF personalizados por industria, y automatiza outreach vía WhatsApp con el agente SDR Santi.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTES / USUARIOS                             │
│   Browser (React 19 SPA)  ──────  WordPress Plugin (class-crm-proxy)    │
└────────────┬──────────────────────────────────┬─────────────────────────┘
             │ HTTPS                            │ HTTPS (X-CRM-Token)
             ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS API  (server.ts)                           │
│  /api/auth/*          → sesiones, Neon Auth, reset password             │
│  /api/generate        → Gemini AI (brochures, ICP, scoring…)            │
│  /api/scrape-places   → Google Places → Apify → Gemini Search           │
│  /api/enrich-contact  → Hunter.io domain search                         │
│  /api/scrape-employees-bulk → Apify bulk enrichment                     │
│  /api/chatbot-leads   → leads capturados por el asesor IA               │
│  /api/webhooks/chatbot-lead → webhook WordPress plugin                  │
│  /api/leads           → SDR Santi: CRUD + brochures + notas             │
│  /api/orchestrator    → chat IA con 5 agentes + métricas KPI            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             ▼
              ┌──────────────────────────┐
              │     Neon PostgreSQL      │
              │   (pooled · sa-east-1)   │
              │  users · session         │
              │  chatbot_leads           │
              │  santi_leads             │
              │  santi_brochures         │
              │  santi_notes             │
              └──────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22.x |
| Frontend | React + TypeScript | 19 / 5.8 |
| Build frontend | Vite + @tailwindcss/vite | 6.x / 4.x |
| Backend | Express | 4.x |
| Auth | bcryptjs (12 rondas) + express-session + Neon Auth SDK | 3.x |
| ORM | Raw `pg` Pool (sin Drizzle) | 8.x |
| Base de datos | Neon PostgreSQL serverless | Postgres 16 |
| Sesiones | connect-pg-simple → tabla `session` | — |
| IA | Google Gemini `@google/genai` → Groq → OpenRouter → fallback | 2.x |
| PDF | jsPDF + html2canvas-pro | — |
| Scraping | Apify (3 actores con fallback automático) | — |
| Enriquecimiento | Hunter.io domain-search API v2 | — |
| Email | Nodemailer (SMTP Gmail) | — |
| Animaciones | motion (Framer Motion) | 12.x |
| Gráficos | Recharts | 3.x |
| Gestión de paquetes | pnpm | — |

---

## Flujo dev → producción

```
REPLIT (dev, puerto 5000)
  npm run dev → tsx server.ts → Express + Vite HMR
  DB: Neon vía NEON_API_KEY + NEON_PROJECT_ID (resolve URL dinámica)
        │
        │ git push / Pull Request
        ▼
GITHUB ACTIONS
  ci.yml          → tsc --noEmit + vite build (bloquea PRs rotos)
  neon_workflow   → crea branch Neon "preview/pr-N" (expira 14 días)
        │
        │ PR mergeado a main
        ▼
VERCEL (clientum.com.ar) — auto-deploy
  Install: pnpm install --frozen-lockfile
  Build:   vite build → dist/
  Runtime: api/index.ts → Vercel Serverless Function (Node 22, maxDuration: 30s)
  Routing: /api/* → Function · /* → dist/index.html (SPA)
```

---

## Schema de base de datos

Las tablas se crean automáticamente al arrancar (`CREATE TABLE IF NOT EXISTS`). Sin sistema de migraciones — cambios de schema se aplican con `ALTER TABLE`.

### `users`
```sql
id            SERIAL PRIMARY KEY,
email         TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role          VARCHAR(20) DEFAULT 'user',   -- 'user' | 'admin'
created_at    TIMESTAMP DEFAULT NOW()
```

### `session` (connect-pg-simple)
```sql
sid    VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
sess   JSON NOT NULL,
expire TIMESTAMP(6) NOT NULL
```

### `chatbot_leads`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name       TEXT,
email      TEXT,
phone      TEXT,
company    TEXT,
message    TEXT,
source     VARCHAR(60),
status     VARCHAR(20) DEFAULT 'nuevo',  -- 'nuevo' | 'contactado' | 'calificado' | 'descartado'
created_at TIMESTAMP DEFAULT NOW()
```

### `santi_leads`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
company_name  TEXT NOT NULL,
industry      VARCHAR(120),
city          VARCHAR(120),
address       TEXT,
phone         VARCHAR(30),
contact_name  TEXT,
contact_phone VARCHAR(30),
contact_role  VARCHAR(120),
pain_point    TEXT,
fit_score     INTEGER,           -- 0–10
amount_ars    INTEGER DEFAULT 180000,
meddic_score  INTEGER,           -- 0–100
status        VARCHAR(20) DEFAULT 'pendiente',
              -- 'pendiente' | 'contactado' | 'caliente' | 'tibio' | 'frio' | 'agendado'
source        VARCHAR(60),
created_at    TIMESTAMP DEFAULT NOW(),
updated_at    TIMESTAMP DEFAULT NOW()
```

### `santi_brochures`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lead_id    UUID REFERENCES santi_leads(id),
content    TEXT,        -- HTML del brochure generado por IA
hook       TEXT,        -- gancho personalizado principal
created_at TIMESTAMP DEFAULT NOW()
```

### `santi_notes`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lead_id    UUID REFERENCES santi_leads(id),
summary    TEXT NOT NULL,
author     VARCHAR(60) DEFAULT 'santi',
created_at TIMESTAMP DEFAULT NOW()
```

---

## Endpoints API — referencia completa

### Autenticación — sesión Express (`/api/auth/*`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registra usuario; el primero es `admin` automáticamente |
| POST | `/api/auth/login` | — | Inicia sesión con email + password (bcrypt) |
| POST | `/api/auth/logout` | — | Destruye sesión |
| GET  | `/api/auth/me` | sesión | Usuario actual — re-verifica rol en DB en cada llamada |
| POST | `/api/auth/change-password` | sesión | Cambia contraseña del usuario autenticado |
| POST | `/api/auth/forgot-password` | — | Genera token y envía email de reset (SMTP) |
| POST | `/api/auth/reset-password` | — | Valida token y actualiza contraseña |

### Autenticación — Neon Auth SDK

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/neon-register` | — | Registro vía Neon Auth SDK (JWT) |
| POST | `/api/auth/neon-login` | — | Login vía Neon Auth SDK (JWT) |

### Configuración y scraping

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/config/has-google-maps` | — | Verifica si `GOOGLE_MAPS_PLATFORM_KEY` está configurada |
| POST | `/api/scrape-places` | sesión | Prospección: Google Places → Apify → Gemini fallback |
| POST | `/api/enrich-contact` | sesión | Hunter.io: enriquecimiento de email + cargo por dominio |
| POST | `/api/scrape-employees-bulk` | sesión | Apify: scraping masivo de empleados de múltiples empresas |

### IA y generación

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/generate` | — | Gemini multi-acción: brochures, ICP, MEDDIC scoring, copy, chatbot |

### Leads del Asesor Comercial IA

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST  | `/api/chatbot-leads` | sesión | Crea lead desde el chatbot inbound |
| GET   | `/api/chatbot-leads` | sesión | Lista leads del chatbot |
| PATCH | `/api/chatbot-leads/:id` | sesión | Actualiza estado/datos de un lead del chatbot |
| POST  | `/api/webhooks/chatbot-lead` | `X-CRM-Token` | Webhook WordPress plugin → inserta lead |

### Leads SDR Santi — auth por API key (`x-api-key: SANTI_API_KEY`)

| Método | Path | Descripción |
|--------|------|-------------|
| POST  | `/api/leads` | Crea nuevo lead |
| GET   | `/api/leads` | Lista leads (filtrable: `?status=pendiente&limit=20`) |
| PATCH | `/api/leads/:id` | Actualiza estado o campos del lead |
| POST  | `/api/leads/:id/brochure` | Genera brochure con Gemini y lo guarda |
| GET   | `/api/leads/:id/brochure` | Devuelve el brochure HTML del lead |
| POST  | `/api/leads/:id/notes` | Agrega nota/resumen de conversación al lead |

### Orquestador IA

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/orchestrator/metrics` | sesión | KPIs sin IA: leads por estado, pipeline, top leads, industrias |
| POST | `/api/orchestrator` | sesión | Chat con los 5 agentes (Gemini → Groq → OpenRouter); stream de respuesta |

---

## Middleware de autenticación

| Middleware | Descripción | Usado en |
|-----------|-------------|----------|
| `requireAuth` | Verifica `req.session.userId` | Rutas de sesión (scraping, chatbot-leads, orchestrator) |
| `requireApiKey` | Verifica header `x-api-key === SANTI_API_KEY` | `/api/leads/*` |
| `requireCrmToken` | Verifica header `X-CRM-Token === CRM_INTERNAL_TOKEN` | `/api/webhooks/chatbot-lead` |

---

## Estado de integraciones

| Servicio | Estado | Variable(s) |
|----------|--------|-------------|
| Neon PostgreSQL | ✅ activo | `NEON_DATABASE_URL` / `NEON_API_KEY` + `NEON_PROJECT_ID` |
| Google Gemini | ✅ activo (cascada V1 → V2) | `GEMINI_API_KEY`, `GEMINI_API_KEY_V2` |
| Groq | ✅ fallback LLM | `GROQ_API_KEY` |
| OpenRouter | ✅ fallback LLM terciario | `OPENROUTER_API_KEY` |
| Apify | ✅ activo | `APIFY_API_TOKEN` |
| Hunter.io | ✅ activo | `HUNTER_API_KEY` |
| Google Maps Places | ✅ activo | `GOOGLE_MAPS_PLATFORM_KEY` |
| Neon Auth SDK | ✅ configurado | `VITE_NEON_AUTH_URL`, `JWKS_URL` |
| SMTP Gmail | ✅ configurado | `SMTP_USER`, `SMTP_PASS` |
| WordPress Plugin | ✅ webhook activo | `CRM_INTERNAL_TOKEN` |
| WhatsApp Cloud API | 🔲 pendiente (usa Hermes/WA personal) | — |
| MercadoPago | 🔲 pendiente | — |
| AFIP Facturación | 🔲 pendiente | — |

---

## Cascada de IA

```
POST /api/generate  o  POST /api/orchestrator
        │
        ├─▶ Gemini (GEMINI_API_KEY → GEMINI_API_KEY_V2)   [prioridad 1]
        │       modelos: gemini-2.5-flash · gemini-2.0-flash · gemini-2.5-flash-lite
        │
        ├─▶ Groq (GROQ_API_KEY)                           [prioridad 2]
        │       modelo: llama-3.3-70b-versatile
        │
        ├─▶ OpenRouter (OPENROUTER_API_KEY)               [prioridad 3]
        │       modelos: llama-3.1-8b:free · qwen3-8b:free · mistral-7b:free
        │
        └─▶ Fallback local (respuestas heurísticas)       [siempre disponible]
```

Si una key falla o no está configurada, pasa automáticamente a la siguiente. El sistema funciona aunque falte alguna clave.
