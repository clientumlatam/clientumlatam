# Clientum — Estado de Integraciones

> Última actualización: julio 2026  
> Fuente de verdad para el estado de cada integración externa del CRM y del sistema Hermes Prime.

---

## ✅ Integraciones activas

| Servicio | Uso | Auth | Endpoint / Config |
|---|---|---|---|
| **Neon PostgreSQL** | Base de datos principal | `NEON_DATABASE_URL` (pooled) | Neon serverless driver |
| **Google Gemini** | IA: brochures, ICP, scoring MEDDIC, búsqueda de prospectos | `GEMINI_API_KEY` | `@google/genai` v2 |
| **Apify** | Scraping: Google Maps, directorios | `APIFY_API_TOKEN` | 3 actores con fallback |
| **Hunter.io** | Enriquecimiento de contactos (email lookup) | `HUNTER_API_KEY` | `/api/v2/domain-search` |
| **Google Maps Platform** | Búsqueda de lugares para prospección | `GOOGLE_MAPS_PLATFORM_KEY` | Places API v2 |
| **Vercel** | Deploy de producción (clientum.com.ar) | `VERCEL_TOKEN` | GitHub → auto-deploy |
| **Neon (GitHub Actions)** | Branch DB por PR (CI) | `NEON_API_KEY` + `NEON_PROJECT_ID` | `.github/workflows/neon_workflow.yml` |
| **SMTP** | Emails de notificación | `SMTP_USER` + `SMTP_PASS` | Nodemailer |
| **WordPress** | Inbound leads vía plugin class-crm-proxy | `CRM_INTERNAL_TOKEN` | `/api/webhooks/*` |
| **Groq** | LLM auxiliar (velocidad) | `GROQ_API_KEY` | OpenAI-compatible API |
| **OpenRouter** | LLM con fallback a múltiples modelos | `OPENROUTER_API_KEY` | OpenAI-compatible API |
| **Hermes Agent (Santi SDR)** | SDR outbound WhatsApp | `SANTI_API_KEY` | `/api/leads` (CRM como backend) |

---

## 🔲 Integraciones pendientes

| Servicio | Uso | Estado | Bloqueante |
|---|---|---|---|
| **WhatsApp Cloud API (Meta)** | Mensajería directa desde la API (alternativa a Hermes) | Pendiente | Requiere cuenta Meta for Developers + número dedicado |
| **WordPress publicación** | Post automático de contenido SEO desde agente Marketing | Pendiente | Falta `WORDPRESS_API_USER` / `WORDPRESS_API_PASSWORD` (Application Passwords) |
| **Neon read-only** | Consultas de reportes para agente Finanzas & Admin | Pendiente | Falta usuario Postgres read-only separado en Neon |
| **Google Analytics** | Métricas de tráfico web para agente Marketing | Pendiente | No integrado aún |

---

## API interna del CRM

Consumida por Hermes Agent (Santi) y los agentes de GitHub Actions.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/leads` | `x-api-key: SANTI_API_KEY` | Lista leads (filtros: status, limit) |
| `GET` | `/api/leads/:id/brochure` | `x-api-key` | Brochure IA del lead |
| `PATCH` | `/api/leads/:id` | `x-api-key` | Actualiza status, score, campos |
| `POST` | `/api/leads/:id/notes` | `x-api-key` | Agrega nota / resumen de conversación |
| `POST` | `/api/chatbot-leads` | `X-CRM-Token: CRM_INTERNAL_TOKEN` | Lead inbound desde chatbot del sitio |
| `POST` | `/api/webhooks/*` | `X-CRM-Token` | Inbound desde WordPress plugin |
| `POST` | `/api/generate` | sesión de usuario | Gemini: brochure, ICP, prospectos |
| `POST` | `/api/scrape-places` | sesión de usuario | Scrape Google Maps / Apify |
| `POST` | `/api/enrich-contact` | sesión de usuario | Hunter.io enrichment |
| `POST/GET` | `/api/auth/*` | — | Login / register / logout / me |

---

## Flujo de secrets

Ver `docs/ARCHITECTURE.md` §2 y `replit.md` → "Cómo hacer Remix" para el flujo completo.

```
Replit Secrets
   │
   ├─ node scripts/sync-secrets.mjs  →  Vercel (producción) + GitHub (CI/CD)
   │
   └─ node scripts/pull-secrets.mjs  →  .env.local (Remix / dev local)
```

Los secrets `DATABASE_URL`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `VERCEL_TOKEN` y `REPLIT_DEPLOYMENT` **no se sincronizan** a Vercel/GitHub (ver CHAT sesión 2026-07-17 para el detalle).
