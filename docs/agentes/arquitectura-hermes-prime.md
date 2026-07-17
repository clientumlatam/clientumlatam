# Hermes Prime — Arquitectura Definitiva del Sistema de Agentes Clientum

> Última actualización: julio 2026  
> Documento canónico. Fuente de verdad para entender cómo interactúan el CRM, los agentes autónomos y el agente SDR (Santi/Hermes).

---

## ¿Qué es Hermes Prime?

**Hermes Prime** es el nombre del sistema multi-agente completo de Clientum: la combinación del CRM de IA (fuente de verdad de datos), el orquestador autónomo (GitHub Actions + Gemini), y el agente SDR Santi (Hermes Agent / WhatsApp). Los tres operan integrados como una sola máquina de ventas y operaciones.

No es un framework externo: es la arquitectura propia de Clientum, construida sobre herramientas existentes (Hermes Agent de Nous Research, GitHub Actions, Gemini API, la API del CRM).

---

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPA 4 — HUMANO                              │
│                 Jonathan (CEO) — via WhatsApp / GitHub Issues       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ instrucciones + escalaciones
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│             CAPA 3 — SISTEMA MULTI-AGENTE (GitHub Actions)          │
│                                                                     │
│  repo: clientumlatam/clientum-agentes                               │
│  cron: cada 15 min | trigger: GitHub Issue con label agente:*       │
│                                                                     │
│  [Orquestador IA]                                                   │
│     ├── [Agente Técnico]                                            │
│     │     ├── Backend/Infra                                         │
│     │     ├── Frontend/UX                                           │
│     │     └── IA & Automatización                                   │
│     ├── [Agente Ventas]                                             │
│     │     ├── Santi SDR ──────────────────────────────────┐        │
│     │     └── Explorador Patagónico                        │        │
│     ├── [Agente Marketing]                                 │        │
│     │     └── SEO & Contenido                              │        │
│     ├── [Agente Customer Success]                          │        │
│     │     └── Asesor Comercial IA                          │        │
│     └── [Agente Operaciones]                               │        │
│           └── Finanzas & Admin                             │        │
└────────────────────────────────────────────────────────────┼────────┘
                                                             │ ordenes via API
                            ┌────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│           CAPA 2 — HERMES AGENT (Santi SDR — WhatsApp)              │
│                                                                     │
│  Runtime: Hermes Agent (Nous Research) — local o servidor Ubuntu    │
│  Skill: ~/.hermes/skills/santi-sdr (ver docs/ia/build/hermes-santi/)│
│  Cron: 10am diario, máx. 15 contactos                              │
│                                                                     │
│  Lee leads de CRM API → manda WA → clasifica → actualiza CRM       │
│  Lead caliente → notifica Jonathan por WA inmediatamente           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ REST API (x-api-key: SANTI_API_KEY)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CAPA 1 — CLIENTUM CRM (fuente de verdad)               │
│                                                                     │
│  URL producción: https://clientum.com.ar (Vercel)                  │
│  Runtime: Express 4 + Neon PostgreSQL (serverless)                 │
│  Frontend: React 19 + Vite + Tailwind v4 (SPA)                     │
│                                                                     │
│  /api/leads           → CRUD de leads (Santi SDR + CRM frontend)   │
│  /api/chatbot-leads   → leads inbound (Asesor Comercial IA)        │
│  /api/scrape-places   → prospección Google Maps / Apify            │
│  /api/generate        → Gemini: brochures, ICP, MEDDIC             │
│  /api/enrich-contact  → Hunter.io enrichment                       │
│  /api/webhooks/*      → inbound WordPress plugin                   │
│  /api/auth/*          → login / register / logout                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ SQL (pg pool, TLS)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CAPA 0 — NEON POSTGRESQL                          │
│                                                                     │
│  Tablas: users · session · chatbot_leads                           │
│          santi_leads · santi_brochures · santi_notes               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Regla de oro: el CRM es la única fuente de verdad

Ningún agente mantiene estado fuera de la base de datos del CRM. Hermes/Santi no guarda leads localmente. El orquestador no tiene memoria de qué lead está en qué estado. Todo se lee y escribe en Neon vía la API del CRM.

---

## Flujo completo de ventas end-to-end

```
1. [Explorador Patagónico] → scrape Google Maps/Apify → crea lead en CRM
2. [IA & Automatización]   → genera brochure personalizado con Gemini
3. [Santi SDR / Hermes]    → lee lead + brochure → manda primer WA
4. [Santi SDR / Hermes]    → clasifica respuesta:
       CALIENTE / AGENDAR  → PATCH status + POST note + WA a Jonathan
       TIBIO               → follow-up en 3 días (máx 2 intentos)
       FRÍO                → PATCH status:frio, cierra conversación
5. [Jonathan]              → recibe el lead caliente, agenda, cierra contrato
6. [Backend/Infra]         → da de alta al cliente en el sistema
7. [Asesor Comercial IA]   → atiende inbound del cliente nuevo en el sitio
8. [Operaciones/Finanzas]  → reporta MRR, churn, métricas cada semana
```

---

## Capa 3 en detalle — Sistema multi-agente (GitHub Actions)

### Motor de ejecución

```
Jonathan abre Issue → label agente:orquestador
     ↓ (< 15 min)
Orquestador lee instrucción con Gemini → re-etiqueta → agente:X
     ↓ (< 15 min)
Agente X lee identidad+memoria+proceso+skill → ejecuta con Gemini
  → comenta resultado en el issue
  → si ESTADO: DONE → cierra issue + actualiza memoria.md
  → si tarea cruza áreas → abre issue nuevo para agente Y
  → si BLOQUEADO → notifica a Jonathan por WA
```

### Roster de agentes

| Carpeta (label) | Tipo | Herramientas | Estado |
|---|---|---|---|
| `orquestador` | Orquestador | Gemini, GitHub API | ✅ Implementado |
| `tecnico` | Coordinador | GitHub API | ✅ Implementado |
| `tecnico/backend-infra` | Ejecutor (modo propuesta) | GitHub API | ✅ Implementado |
| `tecnico/frontend-ux` | Ejecutor (modo propuesta) | GitHub API | ✅ Implementado |
| `tecnico/ia-automatizacion` | Ejecutor | Gemini, Hunter API, CRM API | ✅ Implementado |
| `ventas` | Coordinador | GitHub API | ✅ Implementado |
| `ventas/santi-sdr` | Ejecutor | Hermes Agent, WhatsApp, CRM API | ⚠️ Delega a Hermes |
| `ventas/explorador-patagonico` | Ejecutor | Google Maps API, Apify, Gemini | ✅ Implementado |
| `marketing` | Coordinador | GitHub API | ✅ Implementado |
| `marketing/seo-contenido` | Ejecutor | WordPress API, Gemini | 🔲 Pendiente integración |
| `customer-success` | Coordinador | GitHub API | ✅ Implementado |
| `customer-success/asesor-comercial-ia` | Ejecutor | CRM API webhook | ✅ Implementado |
| `operaciones` | Coordinador | GitHub API | ✅ Implementado |
| `operaciones/finanzas-admin` | Ejecutor | Neon DB (read-only) | 🔲 Pendiente integración |

> **⚠️ Nota sobre Santi SDR**: el agente en GitHub Actions solo *coordina* — las acciones de WhatsApp las ejecuta Hermes Agent (Capa 2). El issue de GitHub funciona como mecanismo de control/logging, pero el contacto real ocurre en Hermes.

### Contrato de archivos por agente

Cada carpeta de agente tiene exactamente estos 4 archivos (leídos en orden por `run-agentes.mjs`):

| Archivo | Propósito | Quién lo escribe |
|---|---|---|
| `identidad.md` | Rol, personalidad, límites | Equipo (manual) |
| `memoria.md` | Historial de ejecuciones, aprendizajes | El script (auto-append) |
| `proceso.md` | Pasos de trabajo, paso a paso | Equipo (manual) |
| `skill.md` | Herramientas disponibles y cómo usarlas | Equipo (manual) |

---

## Capa 2 en detalle — Hermes Agent / Santi SDR

### Setup

```bash
# Instalar Hermes (Nous Research)
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

# Instalar skill de Santi
cp -r docs/ia/build/hermes-santi ~/.hermes/skills/santi-sdr

# Configurar conexión al CRM
hermes secrets set AI_PROSPECTOR_BASE_URL "https://clientum.com.ar/api"
hermes secrets set SANTI_API_KEY "<valor de SANTI_API_KEY en Replit Secrets>"

# Conectar WhatsApp
hermes gateway add whatsapp   # escaneás un QR

# Programar cron diario (10am, 15 contactos máx)
hermes
> Todos los días a las 10am, usá la skill santi-sdr para contactar hasta 15 
  prospectos en estado pendiente. Si hay un lead CALIENTE avisame por WA inmediatamente.
```

### API que Santi consume del CRM

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/leads?status=pendiente&limit=15` | x-api-key | Lista leads a contactar |
| GET | `/api/leads/:id/brochure` | x-api-key | Brochure IA para personalizar mensaje |
| PATCH | `/api/leads/:id` | x-api-key | Actualiza status: contactado/caliente/tibio/frio/agendado |
| POST | `/api/leads/:id/notes` | x-api-key | Loguea resumen de conversación |

### Límites operativos (no negociables)

- Máximo **15-20 primeros contactos por día** (protege el número de WhatsApp de baneo)
- Máximo **2 follow-ups** por prospecto, separados 3-4 días
- **Nunca** cerrar precio ni condiciones — solo calificar y escalar a Jonathan (+54 298 451-0883)
- Si el prospecto pide no ser contactado → `status: frio`, no volver a escribirle jamás

---

## Estado de implementación — julio 2026

### ✅ Implementado y funcionando

- CRM completo con API de 6 endpoints para Santi
- Sistema multi-agente (GitHub Actions) con Orquestador + 13 agentes
- `run-agentes.mjs` — motor de ejecución autónoma
- Skill de Santi SDR (`docs/ia/build/hermes-santi/SKILL.md`)
- Brochure IA por lead (Gemini)
- Explorador Patagónico (Google Maps + Apify)
- Asesor Comercial IA (chatbot inbound)
- Producción en Vercel (`clientum.com.ar`) con Neon PostgreSQL

### 🔲 Pendiente de implementar

- `scripts/lib/integraciones/whatsapp.mjs` — WhatsApp Cloud API (Meta)
- `scripts/lib/coordinacion.mjs` — disparos cruzados entre agentes
- `scripts/lib/integraciones/notificaciones.mjs` — resumen de corrida a Jonathan
- `scripts/lib/integraciones/wordpress.mjs` — publicación SEO
- `scripts/lib/integraciones/neon.mjs` — reportes Finanzas (read-only)
- Usuario Postgres **read-only** separado para agentes de reportes
- `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_ID` — dar de alta en Meta for Developers
- `JONATHAN_WHATSAPP_NUMBER` — cargar como secret en repo `clientum-agentes`

---

## Repos involucrados

| Repo | Contenido | Deploy |
|---|---|---|
| `clientumlatam/clientumlatam` | CRM (Express + React) | Vercel (auto desde main) |
| `clientumlatam/clientum-agentes` | Sistema multi-agente | GitHub Actions (cron 15 min) |

El contenido del repo `clientum-agentes` vive en `docs/ia/agentes/clientum-agentes/` de este proyecto como referencia. **No se despliega desde acá** — debe subirse a su propio repo separado en GitHub.

---

## Variables de entorno — mapa completo

### CRM (Vercel / Replit)

| Variable | Dónde | Estado |
|---|---|---|
| `SESSION_SECRET` | Replit Secrets + Vercel | ✅ |
| `GEMINI_API_KEY` | Replit Secrets + Vercel | ✅ |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | Replit Secrets + Vercel | ✅ |
| `DATABASE_URL` | Replit Secrets + Vercel | ✅ (fallback) |
| `CRM_INTERNAL_TOKEN` | Replit Secrets + Vercel | ✅ |
| `SANTI_API_KEY` | Replit Secrets + Vercel | ✅ |
| `APIFY_API_TOKEN` | Replit Secrets + Vercel | ✅ |
| `GOOGLE_MAPS_PLATFORM_KEY` | Replit Secrets + Vercel | ✅ |
| `HUNTER_API_KEY` | Replit Secrets + Vercel | ✅ |
| `GROQ_API_KEY` | Replit Secrets + Vercel | ✅ |
| `OPENROUTER_API_KEY` | Replit Secrets + Vercel | ✅ |

### Hermes Agent (servidor Ubuntu / local)

| Variable | Cómo setear |
|---|---|
| `AI_PROSPECTOR_BASE_URL` | `hermes secrets set AI_PROSPECTOR_BASE_URL "https://clientum.com.ar/api"` |
| `SANTI_API_KEY` | igual que CRM (misma key) |

### repo `clientum-agentes` (GitHub Secrets)

| Secret | Fuente |
|---|---|
| `GEMINI_API_KEY` | igual que CRM |
| `SANTI_API_KEY` | igual que CRM |
| `CRM_INTERNAL_TOKEN` | igual que CRM |
| `GOOGLE_MAPS_PLATFORM_KEY` | igual que CRM |
| `APIFY_API_TOKEN` | igual que CRM |
| `HUNTER_API_KEY` | igual que CRM |
| `WHATSAPP_CLOUD_API_TOKEN` | 🔲 nuevo — Meta for Developers |
| `WHATSAPP_PHONE_ID` | 🔲 nuevo — Meta for Developers |
| `JONATHAN_WHATSAPP_NUMBER` | +54 298 451-0883 |
| `DATABASE_URL` (read-only) | 🔲 nuevo usuario Postgres en Neon |
| `WORDPRESS_API_USER` / `WORDPRESS_API_PASSWORD` | WordPress → Application Passwords |

---

## Documentos relacionados

| Documento | Contenido |
|---|---|
| `docs/ARCHITECTURE.md` | Arquitectura técnica del CRM (Express, Neon, Vercel) |
| `docs/SANTI-SDR.md` | Manual operativo de Santi + referencia de endpoints |
| `docs/ia/agentes/clientum-agentes/ORGANIGRAMA.md` | Organigrama de los 13 agentes |
| `docs/ia/agentes/clientum-agentes/SETUP.md` | Puesta en marcha del repo clientum-agentes |
| `docs/ia/build/hermes-santi/SKILL.md` | Skill completa de Santi (personalidad, flujo, límites) |
| `docs/ia/build/hermes-santi/QUICKSTART.md` | Setup paso a paso de Hermes + WhatsApp |
| `docs/ia/build/00-INDICE-Y-ORDEN-DE-BUILD.md` | Índice de implementación del sistema multi-agente |
