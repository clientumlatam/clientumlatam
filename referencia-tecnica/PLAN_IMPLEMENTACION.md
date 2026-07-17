# Clientum AI Sales Operating System — Plan de Implementación por Fases

**Stack:** Replit (dev) → GitHub (versiones) → Vercel (prod) → Neon (DB)  
**Regla:** APIs 100% gratuitas o con crédito incluido. Sin servicios externos adicionales.

---

## Estado Actual del Codebase

### ✅ Ya existe
| Componente | Estado |
|---|---|
| Frontend React/Vite con sidebar CRM | ✅ Funcional |
| SalesProspectorDashboard (nav + tabs) | ✅ UI completa |
| IcpBuilder, MeddicCalificacion, OutreachCampaigns | ✅ UI (datos mock) |
| BrochureCRM, CopiloIAPanel, ActividadCRM | ✅ UI (datos mock) |
| OrquestadorIA (chat multi-agente) | ✅ UI (sin motor real) |
| scrapeGooglePlaces via Apify | ✅ Conectado |
| Tablas: users, santi_leads, chatbot_leads, santi_brochures, whatsapp_* | ✅ En Neon |
| API Keys: GEMINI, OPENROUTER, HUNTER, GOOGLE_MAPS, APIFY, GROQ | ✅ Configuradas |

### ❌ Falta construir
- Motor de ejecución de agentes (no existe backend real de agentes)
- Tablas Neon para el OS: companies, leads_enriched, campaigns, agent_tasks, agent_logs, orchestrator_logs, api_usage_logs, proposals, conversations
- Rutas API: `/api/agents/*`, `/api/orchestrator/*`, `/api/campaigns/*`
- Conexión real entre UI y DB (todo va a localStorage o mock data)
- Pipeline de datos: Prospector → Enriquecedor → Analista → Propuesta → Campaign

---

## FASE 1 — Cimientos: Schema de DB + Infraestructura de Agentes
**Duración estimada:** 1 sesión  
**Objetivo:** Base sobre la que corren todos los agentes. Sin esto, nada más funciona.

### 1.1 Tablas Neon (nuevas)
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

-- Campañas de email/outreach
campaigns (id, name, type, status, icp_filter_json, created_at)
campaign_emails (id, campaign_id, lead_id, email_number, subject, body, status, sent_at, opened_at, replied_at)

-- Conversaciones multicanal
conversations (id, lead_id, channel, direction, message, metadata_json, created_at)
```

### 1.2 Motor de Agentes (TypeScript)
- `src/agents/base.ts` — clase `BaseAgent` con: execute(), retry(), log(), reportCost()
- `src/agents/orchestrator.ts` — parsea objetivo → crea plan → delega a agentes → monitorea
- `src/agents/types.ts` — interfaces: AgentTask, AgentResult, AgentLog
- `/api/agent/run` — POST: dispara una tarea de agente
- `/api/agent/tasks` — GET: lista tareas activas/históricas
- `/api/agent/logs/:taskId` — GET: logs de una tarea específica

### 1.3 Rutas de Orquestador
- `/api/orchestrator/objective` — POST: recibe objetivo en lenguaje natural, devuelve plan
- `/api/orchestrator/status` — GET: estado global del sistema (tareas activas, errores, métricas)

---

## FASE 2 — Agentes de Datos: Prospector + Enriquecedor
**Duración estimada:** 1-2 sesiones  
**Objetivo:** Pipeline real de descubrimiento y enriquecimiento de leads.

### 2.1 Agente Prospector (`src/agents/prospector.ts`)
**APIs:**
- Google Places API New (GOOGLE_MAPS_PLATFORM_KEY) — búsqueda de empresas por industria + ciudad
- Apify (APIFY_API_TOKEN) — scraping de Google Maps como fallback
- OpenStreetMap Overpass API — complemento gratuito, sin límite

**Flujo:**
1. Recibe: `{ industry, city, country, limit }`
2. Llama Google Places → lista de empresas con nombre, dirección, teléfono, website, rating
3. Deduplica contra tabla `companies` (por nombre + ciudad)
4. Persiste en `companies` + crea `agent_task` con resultado
5. Devuelve: `{ found: N, new: M, companies: [...] }`

**Conectar UI:** `WpProspector.tsx` → `/api/agent/run` con type=prospector (reemplaza mock data)

### 2.2 Agente Enriquecedor (`src/agents/enricher.ts`)
**APIs:**
- Hunter.io (HUNTER_API_KEY) — emails corporativos por dominio
- RDAP / WHOIS público — info de dominio
- DNS-over-HTTPS (Cloudflare) — verificación de dominio
- Firecrawl (free tier) — scraping del sitio web de la empresa
- Gemini (GEMINI_API_KEY) — extrae info de texto scrapeado

**Flujo:**
1. Recibe: `{ company_id }` (empresa ya en DB)
2. Detecta dominio del website → Hunter.io para emails
3. Firecrawl scraping → Gemini extrae: emails adicionales, teléfonos, redes sociales, decisores
4. Persiste en `leads_enriched`
5. Devuelve: `{ emails: [...], phones: [...], linkedin: [...], decision_makers: [...] }`

**Conectar UI:** `CrmFullLeads.tsx` → muestra leads_enriched reales

---

## FASE 3 — Agentes de Inteligencia y Contenido
**Duración estimada:** 1-2 sesiones  
**Objetivo:** IA que analiza, propone y escribe por cada lead.

### 3.1 Agente Estratega/ICP (`src/agents/strategist.ts`)
**API:** Gemini (GEMINI_API_KEY) + OpenRouter (OPENROUTER_API_KEY) como fallback

**Flujo:**
1. Recibe: `{ product_description, target_market, existing_clients? }`
2. Gemini genera: buyer persona, ICP scorecard (6 dimensiones), dolores, objeciones, propuesta de valor
3. Persiste en Neon (tabla `icp_profiles`)
4. Devuelve JSON estructurado con score weights para el Scoring

**Conectar UI:** `IcpBuilder.tsx` → reemplaza mock data con resultado real del agente

### 3.2 Agente Analista Web (`src/agents/webAnalyst.ts`)
**APIs:** Google PageSpeed Insights API (GOOGLE_API_KEY), Gemini, Firecrawl

**Flujo:**
1. Recibe: `{ company_id, website_url }`
2. PageSpeed → métricas de performance, SEO, accesibilidad
3. Firecrawl → contenido del sitio
4. Gemini → genera diagnóstico: oportunidades comerciales, puntos débiles, cómo Clientum puede ayudar
5. Persiste diagnóstico en `proposals` (status: draft)

### 3.3 Agente Generador de Propuestas (`src/agents/proposalGenerator.ts`)
**APIs:** Gemini, datos de DB (company + leads_enriched + diagnóstico web)

**Flujo:**
1. Recibe: `{ company_id, template? }`
2. Combina: ICP fit score + diagnóstico web + casos de éxito + servicios Clientum
3. Gemini genera: brochure en Markdown, propuesta de valor personalizada, CTA específico
4. Guarda PDF URL en `proposals`

**Conectar UI:** `BrochureCRM.tsx` → muestra propuestas reales de DB

### 3.4 Agente Copywriter (`src/agents/copywriter.ts`)
**API:** Gemini + OpenRouter

**Flujo:**
1. Recibe: `{ lead_id, tone, channel: email|whatsapp|linkedin }`, número de email en secuencia
2. Genera email 1 (intro), email 2 (seguimiento), email 3 (último intento) — cada uno diferente en tono
3. Persiste en `campaign_emails` (status: draft)

**Conectar UI:** `OutreachCampaigns.tsx` → editor con contenido generado por IA real

---

## FASE 4 — Campañas y Conversaciones
**Duración estimada:** 1-2 sesiones  
**Objetivo:** El sistema envía, detecta respuestas y continúa la conversación automáticamente.

### 4.1 Agente de Campañas (`src/agents/campaignRunner.ts`)
**APIs:** Gmail API (OAuth, ya autorizado), Resend (fallback masivo)

**Flujo:**
1. Lee `campaign_emails` con status=draft y scheduled_at <= now
2. Envía via Gmail API (personalizado) o Resend (masivo)
3. Actualiza status → sent, registra sent_at
4. Detecta bounce/respuesta → actualiza `conversations`

**Cron:** Vercel Cron Job cada 15 min (o `setInterval` en Replit dev)

### 4.2 Agente de Seguimiento (`src/agents/followUpAgent.ts`)
**APIs:** Gmail API, Gemini

**Flujo:**
1. Detecta leads con email enviado hace X días sin respuesta
2. Gemini genera mensaje de seguimiento (diferente al anterior)
3. Crea nuevo `campaign_email` y lo encola
4. Escala al Orquestador si 3 intentos sin respuesta

### 4.3 Agente de Conversaciones (`src/agents/conversationAgent.ts`)
**APIs:** Gmail API (polling de inbox), Gemini

**Flujo:**
1. Polling de Gmail inbox cada N minutos
2. Detecta respuestas de leads en campaña activa
3. Gemini genera respuesta contextual (mantiene historial en `conversations`)
4. Opcionalmente: marca para revisión humana si hay señal de interés

---

## FASE 5 — Dashboard del Orquestador (Tiempo Real)
**Duración estimada:** 1 sesión  
**Objetivo:** Vista de control completa para supervisar el sistema autónomo.

### Panel principal (actualizar `OrquestadorIA.tsx`)
Métricas en tiempo real desde Neon:

| Sección | Datos |
|---|---|
| **Objetivo Activo** | Qué está ejecutando el Orquestador ahora mismo |
| **Cola de Tareas** | agent_tasks con status pending/running (con retry count) |
| **Pipeline Comercial** | Empresas → Leads → Propuestas → Campañas → Respuestas → Ventas |
| **Agentes Ejecutándose** | Lista viva con duración y última acción |
| **Costos de IA** | Tokens usados hoy/semana (Gemini + OpenRouter), costo estimado USD |
| **Uso de APIs** | Llamadas a Google Places, Hunter, Firecrawl (vs límites gratis) |
| **Errores y Alertas** | agent_tasks con status=failed, con stack trace expandible |
| **Historial de Decisiones** | orchestrator_logs — "Orquestador reasignó tarea X porque Y" |

### Endpoints necesarios
- `GET /api/orchestrator/status` — snapshot completo del sistema
- `GET /api/orchestrator/metrics` — métricas históricas (últimas 24h, 7d, 30d)
- `GET /api/agent/queue` — cola de tareas en tiempo real
- `GET /api/pipeline/funnel` — conversión en cada etapa del embudo

---

## FASE 6 — Observabilidad + Optimización Continua
**Duración estimada:** 1 sesión  
**Objetivo:** El sistema aprende de cada interacción y mejora solo.

### 6.1 Logging estructurado
- Todo `agent_log` incluye: tokens, costo, duración, API usada, éxito/fallo
- Dashboard de costos diarios en `OrquestadorIA.tsx`
- Alertas automáticas si costo > umbral configurado

### 6.2 Scoring de aprendizaje
- `MeddicCalificacion.tsx` alimenta scores reales de leads
- El Agente Scoring actualiza `icp_fit` en `leads_enriched` con cada respuesta/rebote
- Gemini retroalimenta: "Los leads con X característica responden mejor"

### 6.3 Sentry (free tier)
- Error tracking para fallos de agentes en producción
- Alertas a email cuando un agente falla > 3 veces seguidas

---

## Resumen de Fases

| Fase | Qué se construye | Agentes involucrados | APIs clave |
|---|---|---|---|
| **1** | DB schema + motor de agentes | BaseAgent, Orchestrator | Neon |
| **2** | Datos reales: prospección + enriquecimiento | Prospector, Enriquecedor | Google Places, Apify, Hunter, Firecrawl |
| **3** | IA: análisis + propuestas + copy | Estratega, Analista, Generador, Copywriter | Gemini, OpenRouter, PageSpeed |
| **4** | Campañas automáticas + conversaciones | CampaignRunner, Seguimiento, Conversaciones | Gmail API, Resend |
| **5** | Dashboard real del Orquestador | Orchestrator (frontend) | Neon (métricas) |
| **6** | Observabilidad + aprendizaje | Scoring, Observabilidad | Sentry, Neon |

---

## Orden de Dependencias

```
Fase 1 (cimientos)
  └─► Fase 2 (datos reales)
        └─► Fase 3 (IA sobre datos reales)
              └─► Fase 4 (campañas automáticas)
                    └─► Fase 5 (dashboard con métricas reales)
                          └─► Fase 6 (optimización)
```

**Empezamos por Fase 1.** Todo lo demás depende de ella.

---

*Documento generado: 2026-07-17 | Stack: Replit → GitHub → Vercel → Neon*  
*Fuente de arquitectura: Clientum AI Sales Operating System v12 (ChatGPT export)*
