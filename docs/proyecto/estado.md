# Estado e Integraciones — Pendientes

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

---

# Pendientes y próximos pasos — sesión 15 de julio de 2026

Lista completa de acciones que quedaron abiertas al cierre de la sesión.

---

## 🔴 Crítico — hacer antes del próximo deploy

### 1. Pushear la rama `fix/pnpm-hoisting` a GitHub

El commit `1b74bbce` existe localmente pero **no está en GitHub**.

**Cómo:** Abrir el panel Git del editor → Push → rama `fix/pnpm-hoisting`

Si falla por credenciales: en Replit, ir a Configuración → Conectar cuenta de GitHub.

---

### 2. Mergear `fix/pnpm-hoisting` → `main`

Una vez pusheado, abrir el PR en GitHub y mergearlo.

**Por qué urgente:** Vercel auto-deploya desde `main`. Hasta que no esté el merge, `clientum.com.ar` no recibe:
- El fix del `api/tsconfig.json` (TypeScript en Vercel)
- El nuevo `.env.example`
- El CI workflow
- `docs/ARCHITECTURE.md`

---

### 3. Rotar la contraseña de Neon

La contraseña `npg_VQvXb6sPOK0p` quedó expuesta en una captura de pantalla de una sesión anterior.

**Cómo:** Neon Console → proyecto → Settings → Reset password → actualizar `DATABASE_URL` en Replit Secrets y en las variables de Vercel.

---

## 🟡 Importante — hacer pronto

### 4. Limpiar `REPLIT_DEPLOYMENT` en Replit Secrets

El secret `REPLIT_DEPLOYMENT` tiene guardado el valor de una Gemini API key vieja (configuración incorrecta de una sesión anterior).

**Cómo:** Replit → Secrets → `REPLIT_DEPLOYMENT` → eliminar el valor (o setearlo a `true` si es necesario para alguna lógica).

---

### 5. Verificar `APP_URL` en Vercel

Confirmar que `APP_URL` en las variables de entorno de Vercel apunta a `https://www.clientum.com.ar` y NO a `localhost` o al dominio `.replit.dev`.

**Dónde:** Vercel Dashboard → proyecto clientum → Settings → Environment Variables.

---

### 6. Verificar `NEON_PROJECT_ID` en GitHub repo variables

El workflow `.github/workflows/neon_workflow.yml` lo lee como `vars.NEON_PROJECT_ID` (variable de repositorio, no secret). Confirmar que está seteado.

**Dónde:** GitHub → repo clientumlatam → Settings → Secrets and variables → Actions → Variables.

---

## 🟢 Validación post-merge

Una vez que `fix/pnpm-hoisting` esté mergeado en `main`:

- [ ] El CI de GitHub Actions (`ci.yml`) corre automáticamente — verificar que pasa (`tsc --noEmit` + `vite build`)
- [ ] Vercel inicia un deploy desde `main` — verificar que termina sin errores
- [ ] Verificar login en `https://www.clientum.com.ar` — las cookies deben funcionar (fix de `Cache-Control: no-store` ya estaba en `main`)

---

## 📝 Notas de infraestructura para futuras sesiones

- **Rama de trabajo activa:** `fix/pnpm-hoisting` (hasta que se mergee)
- **Vercel** auto-deploya desde `main` vía integración GitHub — no se necesita workflow adicional
- **Documentación técnica completa:** `docs/ARCHITECTURE.md`
- **Resumen de arquitectura en memoria:** `.agents/memory/clientum-architecture.md`
- **El push HTTP desde Replit** requiere que la cuenta GitHub esté conectada en Configuración de Replit
