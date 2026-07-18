# Roadmap — Plan de Implementación y Módulos Nuevos

# Clientum AI Sales Operating System — Plan de Implementación por Fases
**Actualizado:** 2026-07-17 | Fuente: análisis recursivo completo de referencia-tecnica (1880 archivos) + attached_assets

**Stack:** Replit (dev) → GitHub (versiones) → Vercel (prod) → Neon (DB)  
**Regla:** APIs 100% gratuitas o con crédito incluido. Sin servicios externos adicionales.  
**IA Cascade:** Gemini API (principal) → Groq (respaldo 1) → OpenRouter gratuito (respaldo 2) → fallback local

---

## Infraestructura Paralela — Ya Deployada (No en Replit)

Esta infraestructura existe y funciona **independientemente** del app principal en Replit:

| Componente | Estado | Detalles |
|---|---|---|
| **clientum.com.ar** | ✅ Live | Cloudflare Worker `replit-proxy` → hace proxy inverso a Replit, inyecta favicon SVG, elimina badge Replit, reescribe redirects |
| **WordPress + Plugins** | ✅ Activo | Plugin `ai-marketing-expert-v2`: 4/6 módulos activos (Chatbot IA, Generador de Contenido, Email Marketing, Prospector de Leads) |
| **Vercel deploy** | ✅ Prod | `clientumlatam.vercel.app` / `clientum.com.ar` — dual entrypoint: `server.ts` (dev) + `api/index.ts` (Vercel) |
| **Neon PostgreSQL 16** | ✅ Activo | Resolución dinámica via `NEON_API_KEY` o `NEON_DATABASE_URL`. Branch-per-PR via `neon_workflow.yml` |
| **GitHub Actions — Neon branching** | ✅ Funcionando | Crea/elimina rama Neon por cada PR (expiración 14 días) |
| **GitHub Actions — Loop de Agentes** | ⚠️ Configurado, sin combustible | Corre cada 15 min, lee Issues con labels `agente:*`, ejecuta `run-agentes.mjs`. Falla porque no hay Issues abiertos |
| **Cloudflare Worker proxy** | ✅ Live | `clientum.com.ar` → Replit app con favicon y sin badge |

### WordPress — Plugins activos
| Plugin | Estado | Módulos |
|---|---|---|
| `ai-marketing-expert-v2` | ✅ Activo | Chatbot IA, Generador de Contenido, Email Marketing, Prospector de Leads ✅ / SEO con IA ⚠️ / Redes Sociales ⚠️ |
| `clientum-ai-prospector` | ✅ Existe | Prospección local vía Google Maps |
| `clientum-user-dashboard` | ✅ Existe | Panel de usuario en WP |
| `import-google-sheets` | ✅ Existe | Importa catálogo desde Google Sheets |
| `ai-marketing-expert-v1` | 📦 Archivado | Versión anterior — no usar |

Webhook de integración WP → Clientum CRM: `POST /api/webhooks/chatbot-lead`  
Header: `X-CRM-Token: <CRM_INTERNAL_TOKEN>`

---

## Estado Actual del Codebase (app principal Replit)

### ✅ Ya existe y funciona

**Stack técnico real:**
- Frontend: React 19, Vite 6, Tailwind v4, Radix UI
- Backend: Express 4 (Node 22) — `server.ts` para dev, `api/index.ts` para Vercel
- DB: Neon PostgreSQL 16 — pool `pg` sin ORM, resolución dinámica de URL
- Auth: sesiones Express + bcrypt 12 rondas para UI; API Key (`SANTI_API_KEY`, `CRM_INTERNAL_TOKEN`) para server-to-server
- TS dual: `tsconfig.json` usa `moduleResolution: bundler` (Vite), `api/tsconfig.json` usa `node16` (Vercel)
- Cache: `Cache-Control: no-store` en todas las APIs (crítico para Vercel CDN + Set-Cookie)

**Tablas en Neon (ya existen):**
| Tabla | Contenido |
|---|---|
| `users` | Autenticación local |
| `santi_leads` | Pipeline de ventas con MEDDIC score e ICP fit score |
| `chatbot_leads` | Leads capturados por asesor inbound (WP Chatbot) |
| `santi_brochures` | HTML de brochures personalizados generados por IA |
| `session` | Sesiones Express persistentes en Postgres |

**UI completamente construida (datos mock o parciales):**
| Componente | Estado |
|---|---|
| `SalesProspectorDashboard` — sidebar + tabs | ✅ Funcional |
| `IcpBuilder` — perfil ICP con score de fit | ✅ UI (mock) |
| `MeddicCalificacion` — scoring 6 dimensiones /30 | ✅ UI (mock) |
| `OutreachCampaigns` — WhatsApp/Email/LinkedIn con Santi SDR | ✅ UI (mock) |
| `BrochureCRM` — catálogo de brochures con Ver/PDF/Compartir | ✅ UI (mock) |
| `CopiloIAPanel` — chat de generación de contenido | ✅ UI (mock) |
| `ActividadCRM` — feed timeline con filtros | ✅ UI (mock) |
| `CreacionRapidaCRM` — formulario rápido de deals | ✅ UI (mock) |
| `OrquestadorIA` — chat multi-agente con 5 agentes activos | ✅ UI funcional (datos reales parciales) |
| Organigrama árbol (16 nodos) | ✅ UI construida |
| Organigrama radial | ✅ UI construida |
| Organigrama por Ownership | ✅ UI construida |
| Roster de agentes (16/16) | ✅ UI construida |
| Pipeline Flow "Del Lead al Cliente" (7 etapas) | ✅ UI construida |
| Leads del Chatbot | ✅ UI construida (0 leads reales) |
| Configuración Plugin WP | ✅ UI construida |
| `PublicWebsite` — sitio público completo | ✅ Funcional |

**Integraciones con backend real:**
| Integración | Estado |
|---|---|
| `scrapeGooglePlaces` via Apify | ✅ Conectado y funcional |
| Chatbot lead capture → Neon | ✅ Webhook activo |
| Generación de brochures con Gemini | ✅ Funcional |
| Santi SDR via Hermes Agent | ✅ Activo (SANTI_API_KEY configurada) |

**API Keys configuradas en Replit Secrets:**
`GEMINI_API_KEY`, `GEMINI_API_KEY_V2`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GOOGLE_MAPS_PLATFORM_KEY`, `GOOGLE_API_KEY`, `HUNTER_API_KEY`, `APIFY_API_TOKEN`, `SANTI_API_KEY`, `CRM_INTERNAL_TOKEN`, `NEON_DATABASE_URL`, `NEON_API_KEY`, `NEON_PROJECT_ID`, `SESSION_SECRET`, `SMTP_USER`, `SMTP_PASS`, `JWKS_URL`, `VERCEL_TOKEN`, `GITHUB_PERSONAL_ACCESS_TOKEN`

### ❌ Falta construir (motor real de agentes)

- Motor de ejecución de agentes con backend real (el loop de GitHub Actions está configurado pero sin Issues que procesar)
- Tablas Neon para el OS completo: `companies`, `leads_enriched`, `campaigns`, `agent_tasks`, `agent_logs`, `orchestrator_logs`, `api_usage_logs`, `proposals`, `conversations`
- Rutas API: `/api/agents/*`, `/api/orchestrator/*`, `/api/campaigns/*`
- Conexión real entre UI y DB (ICP Builder, MEDDIC, Outreach, Brochure — todos van a mock data)
- Pipeline de datos: Prospector → Enriquecedor → Analista → Propuesta → Campaign
- Módulos WP pendientes: SEO con IA, Redes Sociales (por configurar)
- `run-agentes.mjs` — script que el GitHub Actions loop ya llama pero no existe
- Fichas de agentes en `docs/referencia-tecnica/agentes/fichas/` (directorio esperado por el workflow)

### ⚠️ Pendientes críticos de infraestructura

- **Rotar API Keys expuestas** en conversaciones/chats de sesiones anteriores (Gemini, Google Maps, Hunter, Santi, Apify, Session Secret)
- **Merge de rama `fix/pnpm-hoisting`** para estabilizar deploy en Vercel
- **Resolver `NEON_DATABASE_URL` vacío en Replit** — el app crashea al inicio porque la variable no tiene valor en el entorno de desarrollo (ver error ECONNREFUSED 127.0.0.1:5432)

---

## FASE 0 — Deuda técnica urgente (antes de todo)
**Duración estimada:** 1 sesión  
**Objetivo:** Estabilizar el entorno de desarrollo. Sin esto, ninguna sesión puede arrancar sin crasheo.

### 0.1 Fix variable de DB en Replit
El servidor crashea porque `NEON_DATABASE_URL` está vacío en el entorno Replit dev. La función `resolveDatabaseUrl()` en `server.ts` ya tiene la lógica correcta — el problema es que el secret no tiene valor.

**Acción:** Confirmar/recargar `NEON_DATABASE_URL` en Replit Secrets con la URL de conexión pooled de Neon.

### 0.2 Crear estructura de fichas de agentes
El GitHub Actions loop (`agentes-clientum.yml`) ya está en el repo y corre cada 15 min. Espera:
- `docs/referencia-tecnica/agentes/scripts/run-agentes.mjs` — script ejecutor
- `docs/referencia-tecnica/agentes/fichas/*.md` — fichas de cada agente con sección `## Memoria`

**Acción:** Crear el directorio y al menos la ficha del Orquestador para que el loop no falle en vacío.

### 0.3 Completar módulos WP pendientes
- SEO con IA → configurar `GOOGLE_API_KEY` en plugin
- Redes Sociales → configurar credenciales OAuth

---

## FASE 1 — Cimientos: Schema de DB + Infraestructura de Agentes
**Duración estimada:** 1 sesión  
**Objetivo:** Base sobre la que corren todos los agentes. Sin esto, nada más funciona.  
**Dependencia:** Fase 0 completa.

### 1.1 Tablas Neon (nuevas — además de las existentes)
```sql
-- Empresas prospectadas
companies (id, name, industry, city, address, phone, website, rating, source, status, created_at)

-- Leads enriquecidos (personas + empresa)
leads_enriched (id, company_id, name, email, phone, linkedin, whatsapp, role, source, score, icp_fit, created_at)

-- Cola de tareas de agentes
agent_tasks (id, type, agent_name, status, input_json, output_json, error, retries, started_at, finished_at, created_at)

-- Log de ejecución de cada agente
agent_logs (id, task_id, agent_name, action, detail, tokens_used, api_used, cost_usd, duration_ms, created_at)

-- Log del Orquestador
orchestrator_logs (id, objective, plan_json, status, started_at, finished_at, created_at)

-- Uso de APIs externas
api_usage_logs (id, api_name, endpoint, cost_usd, tokens_in, tokens_out, created_at)

-- Propuestas generadas
proposals (id, company_id, lead_id, content_md, pdf_url, status, sent_at, created_at)

-- ICP profiles (para conectar IcpBuilder real)
icp_profiles (id, user_id, product_desc, target_market, buyer_persona_json, score_weights_json, created_at)

-- Campañas de email/outreach
campaigns (id, name, type, status, icp_filter_json, created_at)
campaign_emails (id, campaign_id, lead_id, email_number, subject, body, status, sent_at, opened_at, replied_at, scheduled_at)

-- Conversaciones multicanal
conversations (id, lead_id, channel, direction, message, metadata_json, created_at)
```

### 1.2 Motor de Agentes (TypeScript)
```
src/agents/
  base.ts          — clase BaseAgent: execute(), retry(), log(), reportCost()
  orchestrator.ts  — parsea objetivo → plan → delega → monitorea
  types.ts         — AgentTask, AgentResult, AgentLog, interfaces
```

**Rutas API:**
- `POST /api/agent/run` — dispara una tarea
- `GET /api/agent/tasks` — lista tareas activas/históricas
- `GET /api/agent/logs/:taskId` — logs de una tarea
- `POST /api/orchestrator/objective` — recibe objetivo en lenguaje natural
- `GET /api/orchestrator/status` — snapshot global del sistema

### 1.3 Crear `run-agentes.mjs` para GitHub Actions
El loop de 15 min ya está configurado en `.github/workflows/agentes-clientum.yml`. El script esperado en `docs/referencia-tecnica/agentes/scripts/run-agentes.mjs` debe:
1. Leer Issues abiertos con label `agente:*`
2. Llamar al Orquestador vía `/api/orchestrator/objective`
3. Comentar el resultado en el Issue
4. Actualizar la sección `## Memoria` de la ficha del agente

### 1.4 Almacenamiento de PDFs
- Usar **Vercel Blob Storage** (nativo con Vercel, sin configuración extra) para guardar PDFs de brochures y propuestas
- URL de acceso pública → guardar en `proposals.pdf_url`

---

## FASE 2 — Agentes de Datos: Prospector + Enriquecedor
**Duración estimada:** 1-2 sesiones  
**Objetivo:** Pipeline real de descubrimiento y enriquecimiento de leads.  
**Dependencia:** Fase 1 completa.

### 2.1 Agente Prospector (`src/agents/prospector.ts`)
**APIs:**
- Google Places API New (`GOOGLE_MAPS_PLATFORM_KEY`) — búsqueda por industria + ciudad
- Apify (`APIFY_API_TOKEN`) — scraping Google Maps como fallback (**ya funciona** en el codebase)
- OpenStreetMap Overpass API — complemento gratuito, sin límite

**Flujo:**
1. Recibe: `{ industry, city, country, limit }`
2. Llama Google Places → lista: nombre, dirección, teléfono, website, rating
3. Deduplica contra tabla `companies` (por nombre + ciudad)
4. Persiste en `companies` + crea `agent_task`
5. Devuelve: `{ found: N, new: M, companies: [...] }`

**Conectar UI:** `WpProspector.tsx` → `/api/agent/run` con type=prospector (reemplaza mock)

### 2.2 Agente Enriquecedor (`src/agents/enricher.ts`)
**APIs:**
- Hunter.io (`HUNTER_API_KEY`) — emails corporativos por dominio (**ya configurado**)
- RDAP / WHOIS público — info de dominio (gratuito)
- DNS-over-HTTPS (Cloudflare) — verificación de dominio (gratuito)
- Firecrawl (free tier) — scraping del sitio web
- Gemini (`GEMINI_API_KEY`) — extrae info estructurada del texto scrapeado

**Flujo:**
1. Recibe: `{ company_id }`
2. Detecta dominio → Hunter.io para emails
3. Firecrawl scraping → Gemini extrae: emails, teléfonos, redes sociales, decisores, tecnologías
4. Persiste en `leads_enriched`
5. Devuelve: `{ emails: [...], phones: [...], linkedin: [...], decision_makers: [...] }`

**Conectar UI:** `CrmFullLeads.tsx` → muestra `leads_enriched` reales

---

## FASE 3 — Agentes de Inteligencia y Contenido
**Duración estimada:** 1-2 sesiones  
**Objetivo:** IA que analiza, propone y escribe por cada lead.  
**Dependencia:** Fase 2 completa.

### 3.1 Agente Estratega/ICP (`src/agents/strategist.ts`)
**IA Cascade:** Gemini → Groq → OpenRouter  

**Flujo:**
1. Recibe: `{ product_description, target_market, existing_clients? }`
2. Gemini genera: buyer persona, ICP scorecard (6 dimensiones), dolores, objeciones, propuesta de valor
3. Persiste en `icp_profiles`
4. Devuelve JSON con score weights para el Scoring Agent

**Conectar UI:** `IcpBuilder.tsx` → reemplaza mock con resultado real del agente

### 3.2 Agente Analista Web (`src/agents/webAnalyst.ts`)
**APIs:** Google PageSpeed Insights (`GOOGLE_API_KEY`), Gemini, Firecrawl  

**Flujo:**
1. Recibe: `{ company_id, website_url }`
2. PageSpeed → métricas de performance, SEO, accesibilidad
3. Firecrawl → contenido del sitio
4. Gemini → diagnóstico: oportunidades comerciales, puntos débiles, cómo Clientum puede ayudar
5. Persiste diagnóstico en `proposals` (status: draft)

### 3.3 Agente Generador de Propuestas (`src/agents/proposalGenerator.ts`)
**IA:** Gemini + datos de DB  

**Flujo:**
1. Recibe: `{ company_id, template? }`
2. Combina: ICP fit score + diagnóstico web + casos de éxito + servicios Clientum
3. Gemini genera: brochure en Markdown, propuesta personalizada, CTA específico
4. Guarda PDF en Vercel Blob Storage → URL en `proposals.pdf_url`

**Conectar UI:** `BrochureCRM.tsx` → propuestas reales de DB

### 3.4 Agente Copywriter (`src/agents/copywriter.ts`)
**IA Cascade:** Gemini → Groq → OpenRouter  

**Flujo:**
1. Recibe: `{ lead_id, tone, channel: email|whatsapp|linkedin }`, número en secuencia
2. Genera: email 1 (intro), email 2 (seguimiento), email 3 (último intento) — tono progresivo
3. Persiste en `campaign_emails` (status: draft)

**Conectar UI:** `OutreachCampaigns.tsx` → editor con contenido real generado

### 3.5 Agente Scoring (`src/agents/scoringAgent.ts`)
Conecta con `MeddicCalificacion.tsx` — calcula score MEDDIC real por lead y actualiza `santi_leads.meddic_score` + `leads_enriched.icp_fit`.

---

## FASE 4 — Campañas y Conversaciones
**Duración estimada:** 1-2 sesiones  
**Objetivo:** El sistema envía, detecta respuestas y continúa la conversación automáticamente.  
**Dependencia:** Fase 3 completa.

### 4.1 Agente de Campañas (`src/agents/campaignRunner.ts`)
**APIs:** Gmail API (SMTP ya configurado: `SMTP_USER`, `SMTP_PASS`), Resend (fallback masivo gratuito)

**Flujo:**
1. Lee `campaign_emails` con status=draft y `scheduled_at <= now`
2. Envía via Gmail SMTP (personalizado) o Resend (masivo)
3. Actualiza status → sent, registra `sent_at`
4. Detecta bounce/respuesta → actualiza `conversations`

**Cron:** Vercel Cron Job cada 15 min (ya soportado en Vercel) o `setInterval` en Replit dev

### 4.2 Agente de Seguimiento (`src/agents/followUpAgent.ts`)
**APIs:** Gmail API, Gemini

**Flujo:**
1. Detecta leads con email enviado hace X días sin respuesta
2. Gemini genera mensaje de seguimiento diferenciado
3. Crea nuevo `campaign_email` y encola
4. Escala al Orquestador si 3 intentos sin respuesta

### 4.3 Agente de Conversaciones (`src/agents/conversationAgent.ts`)
**APIs:** Gmail API (polling de inbox), Gemini  
**Canal secundario:** Evolution API (WhatsApp) — `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` (variables en .env template, pendientes de configurar)

**Flujo:**
1. Polling de Gmail inbox cada N minutos
2. Detecta respuestas de leads en campaña activa
3. Gemini genera respuesta contextual (mantiene historial en `conversations`)
4. Marca para revisión humana si detecta señal de interés alta

### 4.4 Santi SDR — Integración real
- Santi ya existe y está conectado via `SANTI_API_KEY` / Hermes Agent
- Conectar `OutreachCampaigns.tsx` con el motor real de Santi
- Máximo 15 contactos/día (límite ya documentado en el organigrama)
- Canal principal: WhatsApp. Canal secundario: email.

---

## FASE 5 — Dashboard del Orquestador (Tiempo Real)
**Duración estimada:** 1 sesión  
**Objetivo:** Vista de control completa para supervisar el sistema autónomo.  
**Dependencia:** Fase 4 completa.

### Panel principal (actualizar `OrquestadorIA.tsx`)
Métricas en tiempo real desde Neon:

| Sección | Datos |
|---|---|
| **Objetivo Activo** | Qué ejecuta el Orquestador ahora |
| **Cola de Tareas** | `agent_tasks` pending/running (con retry count) |
| **Pipeline Comercial** | Empresas → Leads → Propuestas → Campañas → Respuestas → Ventas |
| **Agentes Ejecutándose** | Lista viva con duración y última acción |
| **Costos de IA** | Tokens hoy/semana (Gemini + Groq + OpenRouter), costo estimado USD |
| **Uso de APIs** | Llamadas a Google Places, Hunter, Firecrawl (vs límites free) |
| **Errores y Alertas** | `agent_tasks` con status=failed, stack trace expandible |
| **Historial del Orquestador** | `orchestrator_logs` — "Orquestador reasignó tarea X porque Y" |
| **GitHub Issues activos** | Issues con label `agente:*` en proceso |

### Endpoints necesarios
- `GET /api/orchestrator/status` — snapshot completo
- `GET /api/orchestrator/metrics` — métricas históricas (24h, 7d, 30d)
- `GET /api/agent/queue` — cola de tareas en tiempo real
- `GET /api/pipeline/funnel` — conversión en cada etapa

### Conectar GitHub Actions loop al dashboard
- El dashboard debe poder crear Issues con label `agente:orquestador` para disparar trabajo autónomo
- Ver en tiempo real el resultado de cada loop de 15 min

---

## FASE 6 — Observabilidad + Optimización Continua
**Duración estimada:** 1 sesión  
**Objetivo:** El sistema aprende de cada interacción y mejora solo.  
**Dependencia:** Fase 5 completa.

### 6.1 Logging estructurado
- Todo `agent_log` incluye: tokens, costo, duración, API usada, éxito/fallo
- Dashboard de costos diarios en `OrquestadorIA.tsx`
- Alertas automáticas si costo > umbral

### 6.2 Scoring de aprendizaje
- `MeddicCalificacion.tsx` alimenta scores reales de leads
- Agente Scoring actualiza `icp_fit` en `leads_enriched` con cada respuesta/rebote
- Gemini retroalimenta: "Los leads con X característica responden mejor"

### 6.3 Módulos WP pendientes de activar
- SEO con IA → conectar `GOOGLE_API_KEY` en plugin
- Redes Sociales → OAuth con Instagram, Facebook, LinkedIn

### 6.4 Sentry (free tier)
- Error tracking para fallos de agentes en producción
- Alertas cuando un agente falla > 3 veces seguidas

### 6.5 Integrar fichas de agentes (desde `referencia-tecnica/5-docs/`)
Los docs de departamentos ya existen y son detallados:
- `departamento-ventas.md` → ficha de Santi SDR + Explorador Patagónico + Jonathan Closer
- `departamento-tecnico.md` → ficha de Agente Técnico + Backend/Infra + Frontend/UX + IA & Automatización
- `departamentos-marketing-cs-ops.md` → fichas de Marketing, CS, Operaciones

Migrar a `docs/referencia-tecnica/agentes/fichas/` con formato compatible con el GitHub Actions loop.

---

## Resumen de Fases

| Fase | Qué se construye | Agentes involucrados | APIs clave |
|---|---|---|---|
| **0** | Deuda técnica: fix DB, crear fichas, completar WP | — | Neon, Replit Secrets |
| **1** | Schema completo + motor de agentes + run-agentes.mjs | BaseAgent, Orchestrator | Neon, Vercel Blob |
| **2** | Datos reales: prospección + enriquecimiento | Prospector, Enriquecedor | Google Places, Apify, Hunter, Firecrawl |
| **3** | IA: análisis + propuestas + copy + scoring | Estratega, Analista, Generador, Copywriter, Scoring | Gemini→Groq→OpenRouter, PageSpeed |
| **4** | Campañas automáticas + conversaciones | CampaignRunner, Seguimiento, Conversacional, Santi SDR real | Gmail SMTP, Resend, Evolution WhatsApp |
| **5** | Dashboard real del Orquestador + GitHub Issues loop | Orchestrator (frontend) | Neon métricas, GitHub API |
| **6** | Observabilidad + aprendizaje + WP módulos restantes | Scoring, Observabilidad | Sentry, Neon, Google OAuth |

---

## Orden de Dependencias

```
Fase 0 (deuda técnica urgente)
  └─► Fase 1 (cimientos: DB + motor)
        └─► Fase 2 (datos reales)
              └─► Fase 3 (IA sobre datos reales)
                    └─► Fase 4 (campañas automáticas)
                          └─► Fase 5 (dashboard con métricas reales)
                                └─► Fase 6 (optimización + WP completo)
```

**Empezamos por Fase 0.** El servidor actualmente crashea (ECONNREFUSED 127.0.0.1:5432) porque `NEON_DATABASE_URL` está vacío en Replit. Todo lo demás depende de resolver esto primero.

---

## Clientes reales documentados (de referencia-tecnica/6-assets/)

| Cliente | Sector | Proyecto documentado |
|---|---|---|
| Morgado Hogar | Retail | E-Commerce + CRM Inteligente |
| Farmacia San Martín | Salud | Bot WhatsApp + Gestión de Stock |
| Mafacha Ferretería Pinturería | Retail | E-Commerce + Facturación AFIP |
| Terbay Propiedades | Inmobiliaria | CRM Inmobiliario + Bot WhatsApp |
| Forestal Norte | Agroindustria | ERP + AFIP + Cartas de Porte |
| Consorcio de Riego General Roca | Agroindustria | Portal Institucional + Gestión de Turnos |
| Hábitat Sur | Inmobiliaria | Sitio Web + CRM Inmobiliario |
| Municipio de 25 de Mayo | Institucional | Portal Municipal + Gestión de Trámites |
| Canal 10 TV | Medios | Portal Web + Streaming Digital |
| Cabarcos Motores SRL | Automotriz | E-Commerce + CRM Automotriz |
| KJ Logística | Logística | ERP + Rastreo de Flota |
| Poliservice Suministros | Industrial | Sitio Web + CRM de Distribución Zonal |
| SCT Patagonia | Industrial | Sitio Web + Catálogo de Servicios |
| AFP Service | Industrial | E-Commerce + Catálogo de Productos |
| Centro Empleados de Comercio | Institucional | Portal + Gestión de Novedades |
| Distribuidora del Sur | — | Brochures v1-v3 generados (Santi SDR activo) |
| Gaman / Koala | — | Propuestas en proceso |

---

## Variables de entorno completas (`.env` template documentado)

Las siguientes variables están en el template documentado en `referencia-tecnica/` pero **aún no configuradas** en Replit Secrets o Vercel:

| Variable | Uso | Prioridad |
|---|---|---|
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE` | WhatsApp Business via Evolution API | Alta (Fase 4) |
| `REDIS_URL` | Caché de estado de agentes | Media (Fase 1) |
| `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` | Pagos Mercado Pago | Media (Fase 6) |
| `AFIP_CUIT` / `AFIP_CERT` / `AFIP_PRIVATE_KEY` | Facturación AFIP | Baja (si se implementa) |
| `ERP_URL` / `ERP_API_KEY` | Integración ERPNext/Dolibarr | Baja |

---

*Documento actualizado: 2026-07-17*  
*Basado en análisis de: attached_assets (38 archivos) + referencia-tecnica (1880 archivos recursivos)*  
*Stack: Replit → GitHub → Vercel → Neon | IA: Gemini → Groq → OpenRouter*

---

# Roadmap — Módulos Nuevos Clientum CRM
> Basado en la arquitectura actual del proyecto (julio 2026)  
> Stack: React 19 + TypeScript + Vite 6 + Express 4 + Neon PostgreSQL + Gemini AI

---

## Estado actual — lo que ya existe

| Módulo | Archivo | Estado |
|--------|---------|--------|
| Prospección Google Maps | `src/services/scraperService.ts` + `/api/scrape-places` | ✅ Funciona (Apify fallback) |
| CRM Pipeline Kanban | `src/components/crm-full/CrmFullPipeline.tsx` | ✅ Funciona |
| Leads SDR Santi | `src/components/crm-full/CrmFullLeads.tsx` + `/api/leads` | ✅ Funciona |
| Orquestador IA (5 agentes) | `src/components/OrquestadorIA.tsx` + `/api/orchestrator` | ✅ Funciona |
| Brochures PDF | `src/components/BrochurePreview.tsx` | ✅ Funciona |
| Chatbot WhatsApp (sim) | `src/components/ChatbotSim.tsx` | ⚠️ Demo/simulación — sin backend real |
| Patagonia Explorer | `SalesProspectorDashboard.tsx` (tab `search`) | ✅ Funciona |
| Scraper de Empleados | `SalesProspectorDashboard.tsx` (tab `employees`) | ✅ Funciona |

---

## Módulo 1 — Google Maps Intelligence (mejora del existente)

### Objetivo
Convertir el scraper básico en un **Motor de Inteligencia Comercial** con scoring automático y enriquecimiento.

### Estado actual
- `/api/scrape-places` existe y usa Apify/Google Maps Places API
- `scraperService.ts` maneja la llamada HTTP
- No hay scoring, no hay persistencia de prospectos por búsqueda, no hay análisis de reseñas

### Qué agregar

#### Backend (`server.ts`)

```typescript
// Nuevas rutas a agregar:
POST /api/places/search          // búsqueda con parámetros (rubro, ciudad, radio)
POST /api/places/:id/score       // calcular score IA para un lugar
POST /api/places/:id/enrich      // enriquecimiento Hunter.io + web check
POST /api/places/bulk-import     // importar selección al CRM como deals
GET  /api/places/history         // historial de búsquedas por usuario
```

#### Base de datos — nueva tabla

```sql
CREATE TABLE IF NOT EXISTS prospecting_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query JSONB,           -- { rubro, ciudad, radio, timestamp }
  results JSONB,         -- array de locales encontrados
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `google_maps` → etiqueta "🗺️ Google Maps"
- Componente: `src/components/crm-full/CrmFullGoogleMaps.tsx` (nuevo)
- Posición: después de `leads` en el array de tabs

#### Componente `CrmFullGoogleMaps.tsx`

Secciones:
1. **Búsqueda** — inputs: rubro, ciudad, radio (km). Botón "Explorar".
2. **Resultados** — tabla con: nombre, dirección, rating, reseñas, teléfono, web, categoría.
3. **Score IA** — columna con badge de probabilidad (%) calculado por Gemini.
4. **Acciones** — checkbox múltiple → "Importar al CRM" → crea deals en `santi_leads`.
5. **Historial** — últimas búsquedas del usuario.

#### Scoring IA (prompt para Gemini)

```
Dado este negocio de Google Maps:
- Nombre: {name}
- Categoría: {category}
- Rating: {rating}/5
- Reseñas: {review_count}
- Tiene web: {has_website}
- Tiene teléfono: {has_phone}

Calcula un score del 0 al 100 de probabilidad de que sea un buen prospecto
para servicios de software CRM/automatización. Devuelve JSON: { score, reason, action }
donde action es uno de: llamar | whatsapp | email | ignorar
```

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/crm-full/CrmFullGoogleMaps.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `google_maps` |
| Modificar | `server.ts` — agregar rutas `/api/places/*` |
| Modificar | `src/services/scraperService.ts` — exponer función de scoring |

### Esfuerzo estimado: **2–3 días**

---

## Módulo 2 — WhatsApp AI (bandeja + copilot)

### Objetivo
Panel de conversaciones WhatsApp reales con IA copilot que sugiere respuestas.

### Arquitectura

El backend de WhatsApp real (`Hermes Agent`) corre en un servidor Ubuntu externo.  
Este módulo se conecta a ese servidor vía webhook / API.

```
WhatsApp Cloud API
      ↓
Hermes Agent (Ubuntu externo)
      ↓ webhook
/api/whatsapp/webhook (nuevo, en server.ts)
      ↓
DB: tabla whatsapp_conversations
      ↓
Frontend: CrmFullWhatsApp.tsx
      ↑
Gemini AI (sugerencias de respuesta)
```

#### Backend — nuevas rutas

```typescript
POST /api/whatsapp/webhook        // recibe mensajes del Hermes Agent (auth: SANTI_API_KEY)
GET  /api/whatsapp/conversations  // lista conversaciones activas
GET  /api/whatsapp/conversations/:id/messages  // mensajes de una conv.
POST /api/whatsapp/conversations/:id/reply     // enviar respuesta
POST /api/whatsapp/conversations/:id/suggest   // Gemini sugiere respuesta
PATCH /api/whatsapp/conversations/:id/bot      // toggle bot ON/OFF
```

#### Base de datos — nuevas tablas

```sql
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  lead_id INTEGER REFERENCES santi_leads(id),
  bot_active BOOLEAN DEFAULT TRUE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES whatsapp_conversations(id),
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  sent_by VARCHAR(50),  -- 'bot' | 'human' | 'ai_suggestion'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `whatsapp` → etiqueta "💬 WhatsApp"
- Componente: `src/components/crm-full/CrmFullWhatsApp.tsx` (nuevo)
- Posición: después de `conversations`

#### Componente `CrmFullWhatsApp.tsx`

Layout tipo Telegram/WhatsApp Web:
- **Panel izq** (30%): lista de conversaciones, indicador bot ON/OFF, búsqueda
- **Panel der** (70%): mensajes de la conversación seleccionada
  - Burbuja de sugerencia IA (se puede aceptar con 1 clic)
  - Input de texto manual
  - Toggle "Bot activo / Bot pausado"

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/crm-full/CrmFullWhatsApp.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `whatsapp` |
| Modificar | `server.ts` — agregar rutas `/api/whatsapp/*` |

### Nota crítica
`SANTI_API_KEY` ya existe en los secrets. El webhook debe validar ese token.  
Las respuestas de estos endpoints deben incluir `Cache-Control: no-store` (Vercel CDN issue).

### Esfuerzo estimado: **3–4 días** (depende de disponibilidad del Hermes Agent externo)

---

## Módulo 3 — Dashboard de Estado de Servicios (pnpm doctor)

### Objetivo
Verificador de integraciones que funciona tanto desde CLI (`pnpm doctor`) como desde el CRM (tab visual).

#### Script CLI: `scripts/doctor.mjs`

```javascript
// Verifica y reporta el estado de cada servicio:
checks:
  - DATABASE_URL → hace SELECT 1
  - GEMINI_API_KEY → llama a la API con prompt mínimo
  - GROQ_API_KEY → idem
  - OPENROUTER_API_KEY → idem
  - APIFY_API_TOKEN → llama al endpoint de usuario
  - GOOGLE_MAPS_PLATFORM_KEY → hace una búsqueda de prueba
  - HUNTER_API_KEY → llama al endpoint de info
  - SMTP_USER/SMTP_PASS → verifica conexión SMTP
  - SANTI_API_KEY → GET /api/leads con esa key
  - VERCEL_TOKEN → GET /v9/projects (Vercel API)
  - GITHUB_PERSONAL_ACCESS_TOKEN → GET /user (GitHub API)
```

Output en terminal:
```
✅ DATABASE      OK  (Neon — 12ms)
✅ GEMINI        OK  (gemini-1.5-flash — 340ms)
❌ GROQ          FAIL (invalid API key)
⚠️  GOOGLE_MAPS  WARN (key configurada, sin verificar cuota)
✅ APIFY         OK  (plan free — 5 runs restantes)
...
```

#### Backend — nueva ruta

```typescript
GET /api/admin/health   // requiere sesión + rol admin
// Devuelve JSON con el resultado de cada check
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `config` → etiqueta "⚙️ Configuración"
- Componente: `src/components/crm-full/CrmFullConfig.tsx` (nuevo)
- Secciones: Estado de servicios (tarjetas) + Variables de entorno detectadas (sin mostrar valores)

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `scripts/doctor.mjs` |
| Crear | `src/components/crm-full/CrmFullConfig.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `config` |
| Modificar | `server.ts` — agregar ruta `/api/admin/health` |
| Modificar | `package.json` — agregar `"doctor": "node scripts/doctor.mjs"` |

### Esfuerzo estimado: **1 día**

---

## Módulo 4 — Enriquecimiento de Leads (mejora del existente)

### Objetivo
Mejorar el flujo de enriquecimiento que ya existe (`/api/enrich-contact` + Hunter.io) para que sea accesible desde el panel de leads y Google Maps.

### Qué ya existe
- `/api/enrich-contact` → usa Hunter.io `domain-search`
- No hay UI dedicada en el CRM para enriquecimiento masivo

### Qué agregar

#### Mejoras en `CrmFullLeads.tsx`
- Botón "Enriquecer" por lead individual → llama a `/api/enrich-contact`
- Botón "Enriquecer seleccionados" (bulk) → llama a `/api/scrape-employees-bulk`
- Columnas nuevas: Email, Dominio, LinkedIn (si se encuentra)

#### Nuevo endpoint `/api/leads/bulk-enrich`
- Acepta array de IDs
- Procesa en serie (rate limit Hunter: 50 req/mes en plan free)
- Actualiza `santi_leads` con los datos encontrados

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Modificar | `src/components/crm-full/CrmFullLeads.tsx` — agregar botones de enriquecimiento |
| Modificar | `server.ts` — agregar `/api/leads/bulk-enrich` |

### Esfuerzo estimado: **1 día**

---

## Orden de implementación recomendado

```
Fase 1 (1 semana)
├── Módulo 3: pnpm doctor + tab Configuración   (1 día, bajo riesgo)
├── Módulo 4: Enriquecimiento bulk              (1 día, bajo riesgo)
└── Módulo 1: Google Maps Intelligence          (2–3 días)

Fase 2 (1–2 semanas)
└── Módulo 2: WhatsApp AI                       (3–4 días, depende de Hermes Agent externo)

Fase 3 (futuro)
├── Módulo Marketing: Campañas email/WhatsApp
├── Módulo Finanzas: MercadoPago + AFIP
└── Módulo Automatizaciones: n8n/Make webhooks
```

---

## Convenciones a mantener en todos los módulos

- **Paleta:** `#1A3461` (azul Clientum) como color primario del header/tabs
- **Auth:** todos los endpoints del CRM requieren sesión Express (`requireAuth` middleware)
- **Cache-Control:** todos los endpoints API con cookies deben retornar `Cache-Control: no-store`
- **Tabs:** los nuevos tabs se agregan al array en `CrmFullApp.tsx`, no como rutas nuevas
- **Estado local:** usar `localStorage` vía `sharedStore.ts` para estado persistente del cliente
- **IA:** usar siempre el cascade Gemini → Groq → OpenRouter (ya implementado en el orquestador)
- **Secrets:** nunca exponer valores, solo verificar existencia y conectividad desde el backend

---

*Generado: julio 2026 — basado en el código real del proyecto*
