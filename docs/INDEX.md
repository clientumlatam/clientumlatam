# 📚 Índice de documentación — Clientum CRM
> Actualizado: 18 julio 2026 · Fuente de verdad: `/docs`

---

## Categorías

1. [🤖 Agentes IA — Arquitectura y organigrama](#1-agentes-ia--arquitectura-y-organigrama)
2. [🧩 Agentes IA — Definiciones por departamento](#2-agentes-ia--definiciones-por-departamento)
3. [📋 Agentes IA — Fichas detalladas](#3-agentes-ia--fichas-detalladas)
4. [🚀 Agentes IA — Scaffold Hermes/Santi](#4-agentes-ia--scaffold-hermessanti)
5. [🏗️ Arquitectura técnica](#5-arquitectura-técnica)
6. [🔧 Notas técnicas](#6-notas-técnicas)
7. [📅 Proyecto — Estado, plan y pendientes](#7-proyecto--estado-plan-y-pendientes)
8. [⚙️ Workflows (GitHub Actions / Neon)](#8-workflows-github-actions--neon)
9. [🏢 Negocio — Copy, brochures y catálogo](#9-negocio--copy-brochures-y-catálogo)
10. [🌐 Sitio web — HTML y contenido](#10-sitio-web--html-y-contenido)
11. [🗂️ Sesiones y bitácora](#11-sesiones-y-bitácora)
12. [💬 Chats exportados con LLMs](#12-chats-exportados-con-llms)
13. [🖼️ Assets y capturas](#13-assets-y-capturas)

---

## 1. 🤖 Agentes IA — Arquitectura y organigrama

| Archivo | Descripción |
|---------|-------------|
| [`agentes/organigrama-sistema-agentes.md`](agentes/organigrama-sistema-agentes.md) | Estructura completa del sistema de agentes IA (julio 2026) |
| [`agentes/arquitectura-hermes-prime.md`](agentes/arquitectura-hermes-prime.md) | Arquitectura definitiva: CRM ↔ agentes ↔ Santi/Hermes |
| [`agentes/setup-agentes-autonomos.md`](agentes/setup-agentes-autonomos.md) | Puesta en marcha del sistema autónomo (repo GitHub + workflows) |
| [`agentes/referencia-api-keys.md`](agentes/referencia-api-keys.md) | Qué API key usa cada agente: Gemini, Groq, OpenRouter, Apify, Hunter, Maps… |
| [`agentes/santi-hermes.md`](agentes/santi-hermes.md) | Implementación e integración completa Santi SDR ↔ Hermes ↔ AI Prospector |

---

## 2. 🧩 Agentes IA — Definiciones por departamento

Cada archivo incluye el agente principal y sus sub-agentes.

| Archivo | Agentes incluidos |
|---------|-------------------|
| [`agentes/orquestador.md`](agentes/orquestador.md) | Orquestador (Chief of Staff IA) |
| [`agentes/ventas.md`](agentes/ventas.md) | Agente Ventas · Santi SDR · Explorador Patagónico |
| [`agentes/tecnico.md`](agentes/tecnico.md) | Agente Técnico (CTO IA) · Backend/Infra · Frontend/UX · IA & Automatización |
| [`agentes/marketing.md`](agentes/marketing.md) | Agente Marketing · SEO & Contenido |
| [`agentes/customer-success.md`](agentes/customer-success.md) | Agente CS · Asesor Comercial IA |
| [`agentes/operaciones.md`](agentes/operaciones.md) | Agente Operaciones (COO IA) · Finanzas & Admin |

---

## 3. 📋 Agentes IA — Fichas detalladas

Cada agente tiene 4 archivos: `identidad`, `memoria`, `proceso`, `skill`.
Ubicación: `agentes/clientum-agentes/<rol>/`

```
agentes/clientum-agentes/
├── orquestador/         → orquestador-{identidad,memoria,proceso,skill}.md
├── ventas/
│   ├── ventas-{identidad,memoria,proceso,skill}.md
│   ├── santi-sdr/       → santi-sdr-{identidad,memoria,proceso,skill}.md
│   └── explorador-patagonico/ → explorador-{identidad,memoria,proceso,skill}.md
├── tecnico/
│   ├── tecnico-{identidad,memoria,proceso,skill}.md
│   ├── backend-infra/   → backend-infra-{identidad,memoria,proceso,skill}.md
│   ├── frontend-ux/     → frontend-ux-{identidad,memoria,proceso,skill}.md
│   └── ia-automatizacion/ → ia-automatizacion-{identidad,memoria,proceso,skill}.md
├── marketing/
│   ├── marketing-{identidad,memoria,proceso,skill}.md
│   └── seo-contenido/   → seo-contenido-{identidad,memoria,proceso,skill}.md
├── customer-success/
│   ├── cs-{identidad,memoria,proceso,skill}.md
│   └── asesor-comercial-ia/ → asesor-{identidad,memoria,proceso,skill}.md
└── operaciones/
    ├── operaciones-{identidad,memoria,proceso,skill}.md
    └── finanzas-admin/  → finanzas-admin-{identidad,memoria,proceso,skill}.md
```
> **56 fichas** (14 agentes × 4 archivos)

---

## 4. 🚀 Agentes IA — Scaffold Hermes/Santi

Código y documentación para levantar Hermes + Santi SDR desde cero.
Ubicación: `agentes/scaffolds/hermes-santi/`

| Archivo | Descripción |
|---------|-------------|
| `QUICKSTART.md` | Inicio rápido paso a paso |
| `INTEGRATION.md` | Cómo integrar Hermes al CRM |
| `GO-LIVE.md` | Checklist de go-live |
| `RESUMEN-PROYECTO.md` | Resumen ejecutivo del proyecto Hermes |
| `SKILL.md` | Skill definition de Hermes |
| `replit-prompt.md` | Prompt base para iniciar en Replit |
| `api-routes-scaffold.ts` | Scaffold de rutas API |
| `schema-reference.ts` | Schema de referencia DB |
| `setup-hermes.sh` / `setup-local.sh` | Scripts de setup |

---

## 5. 🏗️ Arquitectura técnica

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/arquitectura.md`](proyecto/arquitectura.md) | Stack completo, rutas API, DB schema, env vars, flujo dev → Vercel |
| [`proyecto/entorno.md`](proyecto/entorno.md) | Plataformas del entorno (Replit, Vercel, Neon, GitHub) + API keys |
| [`proyecto/departamentos.md`](proyecto/departamentos.md) | Estructura de los 5 departamentos: agentes, roles, herramientas |
| [`proyecto/agentes-build.md`](proyecto/agentes-build.md) | Guía de build + implementación Santi SDR desde cero |

---

## 6. 🔧 Notas técnicas

Ubicación: `proyecto/notas-tecnicas/`

| Archivo | Descripción |
|---------|-------------|
| [`vercel-deploy-notas.md`](proyecto/notas-tecnicas/vercel-deploy-notas.md) | Deploy en Vercel: guías, errores comunes, variables de entorno |
| [`neon-postgres-referencia.md`](proyecto/notas-tecnicas/neon-postgres-referencia.md) | Neon Postgres: consola, configuración, conexiones pooled |
| [`replit-entorno-notas.md`](proyecto/notas-tecnicas/replit-entorno-notas.md) | Particularidades del entorno Replit (puertos, secrets, workflows) |
| [`cloudflare-worker-proxy.md`](proyecto/notas-tecnicas/cloudflare-worker-proxy.md) | Cloudflare Worker: proxy inverso para clientum.com.ar |
| [`github-actions-ci-cd.md`](proyecto/notas-tecnicas/github-actions-ci-cd.md) | GitHub Actions: workflows CI/CD del repo de agentes |
| [`typescript-errores-resueltos.md`](proyecto/notas-tecnicas/typescript-errores-resueltos.md) | Errores TypeScript frecuentes y sus soluciones |
| [`estructura-carpetas-replit.md`](proyecto/notas-tecnicas/estructura-carpetas-replit.md) | Estructura de carpetas del proyecto en Replit |
| [`agentes-prompts-y-estrategias.md`](proyecto/notas-tecnicas/agentes-prompts-y-estrategias.md) | Prompts base y estrategias de los agentes IA |
| [`proyecto/auditoria.md`](proyecto/auditoria.md) | Auditoría de secrets + contexto técnico del proyecto |
| [`proyecto/remix-limitaciones-free.md`](proyecto/remix-limitaciones-free.md) | Qué NO se transfiere al hacer Remix en cuenta free de Replit |
| [`sesiones/historial/exposicion-claves-privadas-HISTORIAL.md`](sesiones/historial/exposicion-claves-privadas-HISTORIAL.md) | Historial de exposición de claves privadas y resolución |

---

## 7. 📅 Proyecto — Estado, plan y pendientes

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/roadmap.md`](proyecto/roadmap.md) | Plan de implementación completo + roadmap de módulos nuevos |
| [`proyecto/estado.md`](proyecto/estado.md) | Estado de integraciones + pendientes y tareas abiertas |
| [`proyecto/sesiones-informes.md`](proyecto/sesiones-informes.md) | Bitácora cronológica de sesiones + análisis e informes consolidados |
| [`sesiones/MDS-consolidado.md`](sesiones/MDS-consolidado.md) | MDS consolidado de sesiones de trabajo |
| [`sesiones/notas.md`](sesiones/notas.md) | Notas de contexto y de producto entre sesiones |
| [`sesiones/historial/estructura-proyecto-notas.md`](sesiones/historial/estructura-proyecto-notas.md) | Notas históricas sobre estructura del proyecto |

---

## 8. ⚙️ Workflows (GitHub Actions / Neon)

Ubicación: `proyecto/workflows/`

| Archivo | Descripción |
|---------|-------------|
| [`agentes-clientum.yml`](proyecto/workflows/agentes-clientum.yml) | Workflow de agentes Clientum (cron cada 15 min) |
| [`ci.yml`](proyecto/workflows/ci.yml) | Workflow CI: typecheck + build en todo push/PR |
| [`neon.yml`](proyecto/workflows/neon.yml) | Workflow Neon: crear/eliminar branch por PR |
| [`agentes/clientum-agentes/.github/workflows/agentes-clientum.yml`](agentes/clientum-agentes/.github/workflows/agentes-clientum.yml) | *(repo autónomo)* Workflow de agentes |

---

## 9. 🏢 Negocio — Copy, brochures y catálogo

### Copy del sitio
| Archivo | Descripción |
|---------|-------------|
| [`sitio/copy-final.md`](sitio/copy-final.md) | Copy completo del sitio clientum.com.ar — fuente de verdad |
| [`negocio/copy/sitio-copy-referencia-v3.md`](negocio/copy/sitio-copy-referencia-v3.md) | Copy de referencia v3 |
| `negocio/copy/*.txt` | Copy por sección: ecommerce, ERP, integraciones, socios, clientes… |

### Brochures (PDF)
| Archivo | Descripción |
|---------|-------------|
| `negocio/brochures/brochure-distribuidora-del-sur-v7.pdf` | Brochure **más reciente** (v7) |
| `negocio/brochures/brochure-clientum-2026-distribuidora-del-sur-v{1,2,3}.pdf` | Versiones anteriores |

### PDFs de presentación
| Archivo | Descripción |
|---------|-------------|
| `negocio/pdfs/Clientum_AI_Platform_...pdf` | Clientum AI Platform deck |
| `negocio/pdfs/Clientum_AI_Sales_Operating_System_...pdf` | Sales Operating System deck |
| `negocio/pdfs/Stack_de_APIs_Gratuitas_...pdf` | Stack de APIs gratuitas |
| `negocio/pdfs/Visión_Final_...pdf` | Visión final del sistema |

### Catálogo y propuestas
| Archivo | Descripción |
|---------|-------------|
| `negocio/catalogo/clientum-perfil-v4.html` | Perfil de empresa v4 |
| `negocio/contenido-sitio/01-05-*.txt` | Tiles, cursos, precios, integraciones, planes |
| `negocio/propuestas/propuesta-gaman-v2.pdf` | Propuesta Gaman v2 |
| `negocio/propuestas/propuesta-koala.pdf` | Propuesta Koala |
| `negocio/propuestas/propuesta-ecommerce-unificada.html` | Propuesta ecommerce unificada |

---

## 10. 🌐 Sitio web — HTML y contenido

### Secciones del sitio (`sitio/html/sections/`)
`hero.html` · `hero_alt.html` · `metricas.html` · `testimonios.html` · `faq.html` · `newsletter.html` · `soluciones_industria.html` · `seccion_1..5.html` · `caracteristicas.html` · `contacto.html` · `todos.html`

### Servicios (`sitio/html/servicios/`)
`consultoria_empresarial.html` · `desarrollo_web.html` · `erp_personalizado.html` · `implementacion_soporte.html` · `integracion_tecnologia.html` · `marketing_digital.html` · `servicios_generales.html`

### Socios / Sitemaps / WordPress
| Archivo | Descripción |
|---------|-------------|
| `sitio/html/socios/programa-socios-final.html` | Programa de socios |
| `sitio/sitemap-clientumlatam.xml` | Sitemap del sitio |
| `sitio/wordpress/content/clientum-content-fusionado.xml` | Export WP fusionado |
| `sitio/wordpress/informe-sitio.csv` | Informe de páginas del sitio (18 jul 2026) |

---

## 11. 🗂️ Sesiones y bitácora

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/sesiones-informes.md`](proyecto/sesiones-informes.md) | Bitácora jul 10–17 + análisis de chats exportados |
| [`sesiones/notas.md`](sesiones/notas.md) | Notas de contexto y producto entre sesiones |
| [`sesiones/MDS-consolidado.md`](sesiones/MDS-consolidado.md) | MDS consolidado (archivo grande) |
| [`sesiones/historial/estructura-proyecto-notas.md`](sesiones/historial/estructura-proyecto-notas.md) | Historial de estructura del proyecto |
| [`sesiones/historial/exposicion-claves-privadas-HISTORIAL.md`](sesiones/historial/exposicion-claves-privadas-HISTORIAL.md) | Historial de exposición de claves privadas |

---

## 12. 💬 Chats exportados con LLMs

Organizados por fuente en `chats/<fuente>/`.

### Claude (`chats/claude/`)
| Archivo | Fecha | Tema |
|---------|-------|------|
| `claude-2026-07-13.md` | 13 jul | — |
| `claude-2026-07-14-mistral.md` | 14 jul | Mistral / arquitectura |
| `claude-2026-07-14-vercel.md` | 14 jul | Deploy Vercel |
| `claude-2026-07-17.md` | 17 jul | — |
| `claude-2026-07-17-mds.md` | 17 jul | Docs / MDs |
| `claude-2026-07-17-v2.md` | 17 jul | v2 |
| `claude-2026-07-17-v3.md` | 17 jul | v3 |

### ChatGPT (`chats/chatgpt/`)
`chatgpt-2026-07-13.md` · `chatgpt-2026-07-14.md`

### Gemini (`chats/gemini/`)
`gemini-2026-07-14.md`

### Replit Agent (`chats/replit/`)
`replit-2026-07-14-estado.txt` · `replit-2026-07-14-secrets.txt` · `replit-2026-07-16-alerta.txt` · `replit-2026-07-16-orquestador.txt`

### Agente / Varios (`chats/agente/`)
`chat-2026-07-17.md` · `chat-agente-2026-07-17.md` · `chat-agente-2026-07-17-cont.md` · `misc.md`

---

## 13. 🖼️ Assets y capturas

Ubicación: `assets/capturas/`

| Carpeta | Contenido |
|---------|-----------|
| `assets/capturas/proceso/` | ~55 capturas del proceso de desarrollo (jul 14–16) |
| `assets/capturas/prospector-app/` | Screenshots del AI Prospector: kanban, MEDDIC, brochure |
| `assets/capturas/replit-vercel/` | Capturas de configuración Replit ↔ Vercel |
| `assets/capturas/sitio/` | Capturas del sitio web y clientes (jul 17) |
| `assets/capturas/github/` | Capturas de PRs, workflows y actions en GitHub |

---

## 🗑️ Historial de limpieza — julio 2026

| Acción | Detalle |
|--------|---------|
| `referencia-tecnica/` eliminada | Todo el contenido útil migrado a `docs/` |
| `agentes/` consolidado | 20 archivos → 11: agente + subagentes fusionados por departamento |
| `proyecto/` consolidado | 26 archivos → 9 fusionados temáticamente |
| `chats/` reorganizado | Subfolders por fuente: claude/, chatgpt/, gemini/, replit/, agente/ |
| `sesiones/` consolidado | notas-contexto + notas-producto → notas.md |
| Workflows renombrados | Timestamps eliminados: agentes-clientum.yml, ci.yml, neon.yml |
| Sheets organizadas | sheets/2026-07/ → catalogo/, leads/, sitio/, logs/ |
