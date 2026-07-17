# 📚 Índice categorizado de documentación — Clientum CRM
> Generado: julio 2026 · 170 archivos · 7 carpetas principales en `/docs`

---

## Categorías

1. [🤖 Agentes IA — Arquitectura y organigrama](#1-agentes-ia--arquitectura-y-organigrama)
2. [🧩 Agentes IA — Definiciones por rol](#2-agentes-ia--definiciones-por-rol)
3. [📋 Agentes IA — Fichas detalladas (identidad / memoria / proceso / skill)](#3-agentes-ia--fichas-detalladas)
4. [🏗️ Arquitectura técnica](#4-arquitectura-técnica)
5. [🔧 Notas técnicas](#5-notas-técnicas)
6. [🌐 Sitio y producto](#6-sitio-y-producto)
7. [🗂️ Sesiones y bitácora](#7-sesiones-y-bitácora)
8. [💬 Chats exportados con LLMs](#8-chats-exportados-con-llms)
9. [⚠️ Duplicados detectados](#9-duplicados-detectados)

---

## 1. 🤖 Agentes IA — Arquitectura y organigrama

Visión general del sistema de agentes, cómo están organizados y cómo arrancarlo.

| Archivo | Descripción |
|---------|-------------|
| [`agentes/organigrama-sistema-agentes.md`](agentes/organigrama-sistema-agentes.md) | Estructura completa del sistema de agentes IA de Clientum (julio 2026) |
| [`agentes/arquitectura-hermes-prime.md`](agentes/arquitectura-hermes-prime.md) | Arquitectura definitiva del sistema: cómo interactúan CRM, agentes y Santi/Hermes |
| [`agentes/agente-orquestador.md`](agentes/agente-orquestador.md) | Definición del Orquestador (Chief of Staff): rol, identidad, proceso |
| [`agentes/setup-agentes-autonomos.md`](agentes/setup-agentes-autonomos.md) | Guía de puesta en marcha de los agentes autónomos (repo GitHub + workflows) |
| [`agentes/referencia-api-keys.md`](agentes/referencia-api-keys.md) | Qué API key usa cada agente: Gemini, Groq, OpenRouter, Apify, Hunter, Maps… |
| [`agentes/clientum-agentes/organigrama-sistema-agentes.md`](agentes/clientum-agentes/organigrama-sistema-agentes.md) | *(subcarpeta repo autónomo)* Mismo organigrama |
| [`agentes/clientum-agentes/setup-agentes-autonomos.md`](agentes/clientum-agentes/setup-agentes-autonomos.md) | *(subcarpeta repo autónomo)* Guía de setup |

---

## 2. 🧩 Agentes IA — Definiciones por rol

Un archivo por agente o sub-agente con su rol, responsabilidades y stack.

### Orquestador
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-orquestador.md`](agentes/agente-orquestador.md) | Punto único de contacto con Jonathan; delega a los 5 departamentos |

### Ventas
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-ventas.md`](agentes/agente-ventas.md) | Supervisión del pipeline: prospección → outreach → calificación → cierre |
| [`agentes/subagente-ventas-santi-sdr.md`](agentes/subagente-ventas-santi-sdr.md) | Santi SDR: primer contacto automatizado vía WhatsApp |
| [`agentes/integracion-santi-hermes-prospector.md`](agentes/integracion-santi-hermes-prospector.md) | Integración Hermes ↔ AI Prospector; cómo opera Santi sobre la DB |
| [`agentes/subagente-ventas-explorador-patagonico.md`](agentes/subagente-ventas-explorador-patagonico.md) | Explorador Patagónico: scraping + Google Maps + Hunter para prospección |

### Técnico (CTO IA)
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-tecnico.md`](agentes/agente-tecnico.md) | Agente CTO: producto, infra y automatización |
| [`agentes/subagente-tecnico-backend-infra.md`](agentes/subagente-tecnico-backend-infra.md) | Sub-agente de backend e infraestructura |
| [`agentes/subagente-tecnico-frontend-ux.md`](agentes/subagente-tecnico-frontend-ux.md) | Sub-agente de frontend y UX |
| [`agentes/subagente-tecnico-ia-automatizacion.md`](agentes/subagente-tecnico-ia-automatizacion.md) | Sub-agente de IA y automatizaciones |

### Marketing
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-marketing.md`](agentes/agente-marketing.md) | Agente de Marketing: SEO, contenido y leads vía chatbot |
| [`agentes/subagente-marketing-seo-contenido.md`](agentes/subagente-marketing-seo-contenido.md) | Sub-agente SEO y generación de contenido |

### Customer Success
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-customer-success.md`](agentes/agente-customer-success.md) | Agente CS: onboarding y retención de clientes |
| [`agentes/subagente-cs-asesor-comercial.md`](agentes/subagente-cs-asesor-comercial.md) | Sub-agente Asesor Comercial IA |

### Operaciones
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-operaciones.md`](agentes/agente-operaciones.md) | Agente COO: KPIs, MRR y reporting |
| [`agentes/subagente-operaciones-finanzas-admin.md`](agentes/subagente-operaciones-finanzas-admin.md) | Sub-agente de Finanzas y Administración |

---

## 3. 📋 Agentes IA — Fichas detalladas

Cada agente tiene 4 archivos estructurados: `identidad`, `memoria`, `proceso`, `skill`.
Están en `agentes/clientum-agentes/<rol>/` — son la fuente para el repo autónomo de GitHub.

```
agentes/clientum-agentes/
├── orquestador/
│   ├── orquestador-identidad.md   — quién es, qué rol cumple
│   ├── orquestador-memoria.md     — contexto persistente del agente
│   ├── orquestador-proceso.md     — flujo de trabajo paso a paso
│   └── orquestador-skill.md       — herramientas y capacidades
│
├── ventas/
│   ├── ventas-identidad / ventas-memoria / ventas-proceso / ventas-skill
│   ├── santi-sdr/
│   │   └── santi-sdr-identidad / santi-sdr-memoria / santi-sdr-proceso / santi-sdr-skill
│   └── explorador-patagonico/
│       └── explorador-identidad / explorador-memoria / explorador-proceso / explorador-skill
│
├── tecnico/
│   ├── tecnico-identidad / tecnico-memoria / tecnico-proceso / tecnico-skill
│   ├── backend-infra/     → backend-infra-identidad / …-memoria / …-proceso / …-skill
│   ├── frontend-ux/       → frontend-ux-identidad / …-memoria / …-proceso / …-skill
│   └── ia-automatizacion/ → ia-automatizacion-identidad / …-memoria / …-proceso / …-skill
│
├── marketing/
│   ├── marketing-identidad / marketing-memoria / marketing-proceso / marketing-skill
│   └── seo-contenido/ → seo-contenido-identidad / …-memoria / …-proceso / …-skill
│
├── customer-success/
│   ├── cs-identidad / cs-memoria / cs-proceso / cs-skill
│   └── asesor-comercial-ia/ → asesor-identidad / asesor-memoria / asesor-proceso / asesor-skill
│
└── operaciones/
    ├── operaciones-identidad / operaciones-memoria / operaciones-proceso / operaciones-skill
    └── finanzas-admin/ → finanzas-admin-identidad / …-memoria / …-proceso / …-skill
```

> **Total:** 56 fichas (14 agentes × 4 archivos) · Convención: `{agente}-{tipo}.md`

---

## 4. 🏗️ Arquitectura técnica

Documentos de referencia del stack y la infraestructura del CRM.

| Archivo | Descripción |
|---------|-------------|
| [`docs-raiz/arquitectura-tecnica-crm.md`](docs-raiz/arquitectura-tecnica-crm.md) | Stack completo, rutas, DB schema, env vars, flujo dev → Vercel |
| [`docs-raiz/guia-build-sistema-agentes.md`](docs-raiz/guia-build-sistema-agentes.md) | Guía de build y despliegue del sistema de agentes |
| [`docs-raiz/estado-integraciones-crm.md`](docs-raiz/estado-integraciones-crm.md) | Integraciones externas del CRM (plugin WP, webhooks, etc.) |
| [`docs-raiz/readme-documentacion-crm.md`](docs-raiz/readme-documentacion-crm.md) | Introducción general al proyecto |
| [`docs-raiz/indice-docs-generado-anterior.md`](docs-raiz/indice-docs-generado-anterior.md) | Índice anterior generado automáticamente (114 archivos) |
| [`docs-raiz/analisis-recursivo-docs.md`](docs-raiz/analisis-recursivo-docs.md) | Análisis recursivo de `/docs` — reducción del 89,7% vs v1 |
| [`docs-raiz/implementacion-santi-sdr-hermes.md`](docs-raiz/implementacion-santi-sdr-hermes.md) | Documentación completa para levantar Santi SDR desde cero |
| [`proyecto/auditoria-secrets-replit.md`](proyecto/auditoria-secrets-replit.md) | Auditoría de los 32 secrets configurados en Replit |
| [`proyecto/replit-remix-limitaciones-free.md`](proyecto/replit-remix-limitaciones-free.md) | Qué NO se transfiere al hacer Remix en cuenta free de Replit |

---

## 5. 🔧 Notas técnicas

Guías y referencias por tecnología o problema específico.

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/notas-tecnicas/vercel-deploy-notas.md`](proyecto/notas-tecnicas/vercel-deploy-notas.md) | Deploy en Vercel: guías, errores comunes, variables de entorno |
| [`proyecto/notas-tecnicas/neon-postgres-referencia.md`](proyecto/notas-tecnicas/neon-postgres-referencia.md) | Neon Postgres: consola, configuración, conexiones pooled |
| [`proyecto/notas-tecnicas/replit-entorno-notas.md`](proyecto/notas-tecnicas/replit-entorno-notas.md) | Particularidades del entorno Replit (puertos, secrets, workflows) |
| [`proyecto/notas-tecnicas/cloudflare-worker-proxy.md`](proyecto/notas-tecnicas/cloudflare-worker-proxy.md) | Cloudflare Worker: proxy y configuración |
| [`proyecto/notas-tecnicas/github-actions-ci-cd.md`](proyecto/notas-tecnicas/github-actions-ci-cd.md) | GitHub Actions: workflows CI/CD del repo de agentes |
| [`proyecto/notas-tecnicas/typescript-errores-resueltos.md`](proyecto/notas-tecnicas/typescript-errores-resueltos.md) | Errores TypeScript frecuentes y sus soluciones |
| [`proyecto/notas-tecnicas/estructura-carpetas-replit.md`](proyecto/notas-tecnicas/estructura-carpetas-replit.md) | Estructura de carpetas del proyecto en Replit |
| [`proyecto/notas-tecnicas/agentes-prompts-y-estrategias.md`](proyecto/notas-tecnicas/agentes-prompts-y-estrategias.md) | Prompts base y estrategias de los agentes IA |

---

## 6. 🌐 Sitio y producto

Contenido y notas sobre el sitio público y el producto.

| Archivo | Descripción |
|---------|-------------|
| [`sitio/copy-final.md`](sitio/copy-final.md) | Copy completo del sitio clientum.com.ar (v5, julio 2026) — fuente de verdad |
| [`sesiones/notas-producto.md`](sesiones/notas-producto.md) | Notas de producto: catálogo, logos, menú, rediseño |

---

## 7. 🗂️ Sesiones y bitácora

Registro cronológico de trabajo y contexto acumulado entre sesiones.

| Archivo | Descripción |
|---------|-------------|
| [`docs-raiz/SESIONES.md`](docs-raiz/SESIONES.md) | Bitácora cronológica de sesiones de trabajo |
| [`docs-raiz/INFORMES.md`](docs-raiz/INFORMES.md) | Análisis e informes consolidados de sesiones y chats |
| [`sesiones/notas-contexto.md`](sesiones/notas-contexto.md) | Fragmentos de contexto y notas entre sesiones |

---

## 8. 💬 Chats exportados con LLMs

Exports de conversaciones de trabajo con distintos modelos.

| Archivo | Modelo / Fecha | Descripción |
|---------|----------------|-------------|
| [`chats/README.md`](chats/README.md) | — | Índice de todos los chats exportados |
| [`chats/claude-2026-07-13.md`](chats/claude-2026-07-13.md) | Claude · 13 jul | — |
| [`chats/chatgpt-2026-07-13.md`](chats/chatgpt-2026-07-13.md) | ChatGPT · 13 jul | — |
| [`chats/claude-2026-07-14-mistral.md`](chats/claude-2026-07-14-mistral.md) | Claude/Mistral · 14 jul | — |
| [`chats/claude-2026-07-14-vercel.md`](chats/claude-2026-07-14-vercel.md) | Claude · 14 jul | Deploy Vercel |
| [`chats/chatgpt-2026-07-14.md`](chats/chatgpt-2026-07-14.md) | ChatGPT · 14 jul | — |
| [`chats/gemini-2026-07-14.md`](chats/gemini-2026-07-14.md) | Gemini · 14 jul | — |
| [`chats/chat-2026-07-17.md`](chats/chat-2026-07-17.md) | Chat · 17 jul | — |
| [`chats/chat-agente-2026-07-17.md`](chats/chat-agente-2026-07-17.md) | Chat agente · 17 jul | — |
| [`chats/chat-agente-2026-07-17-cont.md`](chats/chat-agente-2026-07-17-cont.md) | Chat agente cont. · 17 jul | — |
| [`chats/claude-2026-07-17.md`](chats/claude-2026-07-17.md) | Claude · 17 jul | — |
| [`chats/claude-2026-07-17-mds.md`](chats/claude-2026-07-17-mds.md) | Claude · 17 jul | Docs/MDs |
| [`chats/claude-2026-07-17-v2.md`](chats/claude-2026-07-17-v2.md) | Claude · 17 jul | v2 |
| [`chats/misc.md`](chats/misc.md) | varios | Fragmentos varios |

---

## 9. ✅ Limpieza realizada — julio 2026

| Acción | Detalle |
|--------|---------|
| 7 carpetas `(2)` eliminadas | `customer-success (2)`, `marketing (2)`, `operaciones (2)`, `orquestador (2)`, `tecnico (2)`, `ventas (2)`, `ORGANIGRAMA (2).md` |
| 19 archivos raíz renombrados | Convención `{tipo}-{agente}.md` en minúscula kebab-case |
| 56 fichas renombradas | Convención `{agente}-{tipo}.md` dentro de cada subcarpeta |
