# 📚 Índice de documentación — Clientum CRM
> Actualizado: julio 2026 · Carpeta única fuente de verdad: `/docs`

---

## Categorías

1. [🤖 Agentes IA — Arquitectura y organigrama](#1-agentes-ia--arquitectura-y-organigrama)
2. [🧩 Agentes IA — Definiciones por rol](#2-agentes-ia--definiciones-por-rol)
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
| [`agentes/agente-orquestador.md`](agentes/agente-orquestador.md) | Orquestador (Chief of Staff): rol, identidad, proceso |
| [`agentes/setup-agentes-autonomos.md`](agentes/setup-agentes-autonomos.md) | Puesta en marcha del sistema autónomo (repo GitHub + workflows) |
| [`agentes/referencia-api-keys.md`](agentes/referencia-api-keys.md) | Qué API key usa cada agente: Gemini, Groq, OpenRouter, Apify, Hunter, Maps… |
| [`agentes/implementacion-santi-hermes.md`](agentes/implementacion-santi-hermes.md) | Implementación Santi SDR ↔ Hermes: flujo completo |
| [`agentes/integracion-santi-hermes-prospector.md`](agentes/integracion-santi-hermes-prospector.md) | Integración Hermes ↔ AI Prospector; cómo opera Santi sobre la DB |
| [`agentes/clientum-agentes/organigrama-sistema-agentes.md`](agentes/clientum-agentes/organigrama-sistema-agentes.md) | *(repo autónomo)* Mismo organigrama |
| [`agentes/clientum-agentes/setup-agentes-autonomos.md`](agentes/clientum-agentes/setup-agentes-autonomos.md) | *(repo autónomo)* Guía de setup |

---

## 2. 🧩 Agentes IA — Definiciones por rol

### Orquestador
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-orquestador.md`](agentes/agente-orquestador.md) | Punto único de contacto con Jonathan; delega a los 5 departamentos |

### Ventas
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-ventas.md`](agentes/agente-ventas.md) | Supervisión del pipeline: prospección → outreach → calificación → cierre |
| [`agentes/subagente-ventas-santi-sdr.md`](agentes/subagente-ventas-santi-sdr.md) | Santi SDR: primer contacto automatizado vía WhatsApp |
| [`agentes/subagente-ventas-explorador-patagonico.md`](agentes/subagente-ventas-explorador-patagonico.md) | Explorador Patagónico: scraping + Google Maps + Hunter |

### Técnico (CTO IA)
| Archivo | Descripción |
|---------|-------------|
| [`agentes/agente-tecnico.md`](agentes/agente-tecnico.md) | Agente CTO: producto, infra y automatización |
| [`agentes/subagente-tecnico-backend-infra.md`](agentes/subagente-tecnico-backend-infra.md) | Sub-agente backend e infraestructura |
| [`agentes/subagente-tecnico-frontend-ux.md`](agentes/subagente-tecnico-frontend-ux.md) | Sub-agente frontend y UX |
| [`agentes/subagente-tecnico-ia-automatizacion.md`](agentes/subagente-tecnico-ia-automatizacion.md) | Sub-agente IA y automatizaciones |

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
| [`agentes/subagente-operaciones-finanzas-admin.md`](agentes/subagente-operaciones-finanzas-admin.md) | Sub-agente Finanzas y Administración |

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
| [`QUICKSTART.md`](agentes/scaffolds/hermes-santi/QUICKSTART.md) | Inicio rápido paso a paso |
| [`INTEGRATION.md`](agentes/scaffolds/hermes-santi/INTEGRATION.md) | Cómo integrar Hermes al CRM |
| [`GO-LIVE.md`](agentes/scaffolds/hermes-santi/GO-LIVE.md) | Checklist de go-live |
| [`RESUMEN-PROYECTO.md`](agentes/scaffolds/hermes-santi/RESUMEN-PROYECTO.md) | Resumen ejecutivo del proyecto Hermes |
| [`SKILL.md`](agentes/scaffolds/hermes-santi/SKILL.md) | Skill definition de Hermes |
| [`replit-prompt.md`](agentes/scaffolds/hermes-santi/replit-prompt.md) | Prompt base para iniciar en Replit |
| `api-routes-scaffold.ts` | Scaffold de rutas API |
| `schema-reference.ts` | Schema de referencia DB |
| `setup-hermes.sh` / `setup-local.sh` | Scripts de setup |
| [`docs-raiz/implementacion-santi-sdr-hermes.md`](docs-raiz/implementacion-santi-sdr-hermes.md) | Doc completa para levantar Santi SDR desde cero |

---

## 5. 🏗️ Arquitectura técnica

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/architecture.md`](proyecto/architecture.md) | Arquitectura técnica completa (stack, DB, rutas) |
| [`proyecto/arquitectura-e-integraciones.md`](proyecto/arquitectura-e-integraciones.md) | Arquitectura e integraciones externas detalladas |
| [`proyecto/organigrama-y-arquitectura.md`](proyecto/organigrama-y-arquitectura.md) | Organigrama + arquitectura en un solo documento |
| [`proyecto/entorno-plataformas.md`](proyecto/entorno-plataformas.md) | Plataformas del entorno: Replit, Vercel, Neon, GitHub |
| [`proyecto/setup-y-api-keys.md`](proyecto/setup-y-api-keys.md) | Setup completo y referencia de API keys |
| [`docs-raiz/arquitectura-tecnica-crm.md`](docs-raiz/arquitectura-tecnica-crm.md) | Stack, rutas, DB schema, env vars, flujo dev → Vercel |
| [`docs-raiz/guia-build-sistema-agentes.md`](docs-raiz/guia-build-sistema-agentes.md) | Guía de build y despliegue del sistema de agentes |
| [`docs-raiz/estado-integraciones-crm.md`](docs-raiz/estado-integraciones-crm.md) | Integraciones externas del CRM (plugin WP, webhooks, etc.) |
| [`docs-raiz/readme-documentacion-crm.md`](docs-raiz/readme-documentacion-crm.md) | Introducción general al proyecto |

---

## 6. 🔧 Notas técnicas

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
| [`proyecto/remix-limitaciones-free.md`](proyecto/remix-limitaciones-free.md) | Qué NO se transfiere al hacer Remix en cuenta free de Replit |
| [`proyecto/auditoria-y-contexto.md`](proyecto/auditoria-y-contexto.md) | Auditoría de contexto técnico del proyecto |
| [`proyecto/auditoria-secrets-replit.md`](proyecto/auditoria-secrets-replit.md) | Auditoría de los secrets configurados en Replit |
| [`sesiones/historial/exposicion-claves-privadas-HISTORIAL.md`](sesiones/historial/exposicion-claves-privadas-HISTORIAL.md) | Historial de exposición de claves privadas y resolución |

---

## 7. 📅 Proyecto — Estado, plan y pendientes

| Archivo | Descripción |
|---------|-------------|
| [`proyecto/PLAN_IMPLEMENTACION.md`](proyecto/PLAN_IMPLEMENTACION.md) | Plan de implementación completo (468 líneas) |
| [`proyecto/roadmap-modulos-nuevos.md`](proyecto/roadmap-modulos-nuevos.md) | Roadmap de módulos nuevos del CRM |
| [`proyecto/pendientes.md`](proyecto/pendientes.md) | Pendientes y tareas abiertas |
| [`proyecto/departamentos-marketing-cs-ops.md`](proyecto/departamentos-marketing-cs-ops.md) | Estructura de departamentos: Marketing, CS, Ops |
| [`proyecto/departamento-tecnico.md`](proyecto/departamento-tecnico.md) | Estructura del departamento técnico |
| [`proyecto/departamento-ventas.md`](proyecto/departamento-ventas.md) | Estructura del departamento de ventas |
| [`sesiones/MDS-consolidado.md`](sesiones/MDS-consolidado.md) | MDS consolidado de sesiones de trabajo |
| [`sesiones/historial/estructura-proyecto-notas.md`](sesiones/historial/estructura-proyecto-notas.md) | Notas históricas sobre estructura del proyecto |
| [`docs-raiz/SESIONES.md`](docs-raiz/SESIONES.md) | Bitácora cronológica de sesiones de trabajo |
| [`docs-raiz/INFORMES.md`](docs-raiz/INFORMES.md) | Análisis e informes consolidados |

---

## 8. ⚙️ Workflows (GitHub Actions / Neon)

Ubicación: `proyecto/workflows/`

| Archivo | Descripción |
|---------|-------------|
| [`agentes-clientum_1784325706326.yml`](proyecto/workflows/agentes-clientum_1784325706326.yml) | Workflow de agentes Clientum (GitHub Actions) |
| [`ci_1784326778838.yml`](proyecto/workflows/ci_1784326778838.yml) | Workflow CI del repo |
| [`neon_workflow_1784325706326.yml`](proyecto/workflows/neon_workflow_1784325706326.yml) | Workflow Neon: crear/eliminar branch por PR |
| [`agentes/clientum-agentes/.github/workflows/agentes-clientum.yml`](agentes/clientum-agentes/.github/workflows/agentes-clientum.yml) | *(repo autónomo)* Workflow de agentes |

---

## 9. 🏢 Negocio — Copy, brochures y catálogo

### Copy del sitio
| Archivo | Descripción |
|---------|-------------|
| [`sitio/copy-final.md`](sitio/copy-final.md) | Copy completo del sitio clientum.com.ar (v5) — fuente de verdad |
| [`negocio/copy/sitio-copy-referencia-v3.md`](negocio/copy/sitio-copy-referencia-v3.md) | Copy de referencia v3 |
| `negocio/copy/*.txt` | Copy por sección: ecommerce, ERP, integraciones, socios, clientes, brochure… |

### Brochures (PDF)
| Archivo | Descripción |
|---------|-------------|
| `negocio/brochures/brochure-clientum-2026-distribuidora-del-sur-v1.pdf` | Brochure v1 |
| `negocio/brochures/brochure-clientum-2026-distribuidora-del-sur-v2.pdf` | Brochure v2 |
| `negocio/brochures/brochure-clientum-2026-distribuidora-del-sur-v3.pdf` | Brochure v3 |
| `negocio/brochures/brochure-distribuidora-del-sur-v7.pdf` | Brochure v7 (más reciente) |

### PDFs de presentación
| Archivo | Descripción |
|---------|-------------|
| `negocio/pdfs/Clientum_AI_Platform_...pdf` | Clientum AI Platform deck |
| `negocio/pdfs/Clientum_AI_Sales_Operating_System_...pdf` | Sales Operating System deck |
| `negocio/pdfs/Stack_de_APIs_Gratuitas_para_Clientum_AI_...pdf` | Stack de APIs gratuitas |
| `negocio/pdfs/Stack_de_APIs_Ideal_para_Clientum_AI_...pdf` | Stack de APIs ideal |
| `negocio/pdfs/Visión_Final_–_Clientum_AI_Sales_Operating_System_...pdf` | Visión final del sistema |

### Catálogo y contenido
| Archivo | Descripción |
|---------|-------------|
| `negocio/catalogo/clientum-perfil-v4.html` | Perfil de empresa v4 |
| `negocio/contenido-sitio/01-tiles-soluciones.txt` | Tiles de soluciones |
| `negocio/contenido-sitio/02-cursos-destacados.txt` | Cursos destacados |
| `negocio/contenido-sitio/03-pagina-precios.txt` | Página de precios |
| `negocio/contenido-sitio/04-pagina-integraciones.txt` | Página de integraciones |
| `negocio/contenido-sitio/05-tabla-planes-completa.txt` | Tabla de planes completa |
| `negocio/contenido-sitio/clientum-calculadora-planes.php` | Calculadora de planes |
| `negocio/contenido-sitio/clientum-catalogo-consultar.php` | Catálogo consultable |

---

## 10. 🌐 Sitio web — HTML y contenido

### Secciones del sitio
| Archivo | Descripción |
|---------|-------------|
| `sitio/html/sections/hero.html` / `hero_alt.html` | Hero principal |
| `sitio/html/sections/metricas.html` | Sección métricas |
| `sitio/html/sections/testimonios.html` | Testimonios |
| `sitio/html/sections/faq.html` | Preguntas frecuentes |
| `sitio/html/sections/newsletter.html` | Sección newsletter |
| `sitio/html/sections/soluciones_industria.html` | Soluciones por industria |
| `sitio/html/sections/seccion_1..5.html` | Secciones generales 1–5 |

### Servicios
| Archivo | Descripción |
|---------|-------------|
| `sitio/html/servicios/consultoria_empresarial.html` | Consultoría empresarial |
| `sitio/html/servicios/desarrollo_web.html` | Desarrollo web |
| `sitio/html/servicios/erp_personalizado.html` | ERP personalizado |
| `sitio/html/servicios/implementacion_soporte.html` | Implementación y soporte |
| `sitio/html/servicios/integracion_tecnologia.html` | Integración tecnológica |
| `sitio/html/servicios/marketing_digital.html` | Marketing digital |
| `sitio/html/servicios/servicios_generales.html` | Servicios generales |

### Socios / Sitemaps / WordPress
| Archivo | Descripción |
|---------|-------------|
| `sitio/html/socios/programa-socios-final.html` | Programa de socios (final) |
| `sitio/sitemap-clientumlatam.xml` | Sitemap del sitio |
| `sitio/wordpress/content/clientum-content-fusionado.xml` | Export WP fusionado |

---

## 11. 🗂️ Sesiones y bitácora

| Archivo | Descripción |
|---------|-------------|
| [`sesiones/notas-contexto.md`](sesiones/notas-contexto.md) | Fragmentos de contexto entre sesiones |
| [`sesiones/notas-producto.md`](sesiones/notas-producto.md) | Notas de producto: catálogo, logos, menú, rediseño |
| [`sesiones/MDS-consolidado.md`](sesiones/MDS-consolidado.md) | MDS consolidado |
| [`sesiones/historial/estructura-proyecto-notas.md`](sesiones/historial/estructura-proyecto-notas.md) | Historial de estructura del proyecto |
| [`sesiones/historial/exposicion-claves-privadas-HISTORIAL.md`](sesiones/historial/exposicion-claves-privadas-HISTORIAL.md) | Historial de exposición de claves privadas |
| [`docs-raiz/SESIONES.md`](docs-raiz/SESIONES.md) | Bitácora cronológica de todas las sesiones |
| [`docs-raiz/INFORMES.md`](docs-raiz/INFORMES.md) | Informes consolidados |
| [`docs-raiz/analisis-recursivo-docs.md`](docs-raiz/analisis-recursivo-docs.md) | Análisis recursivo de `/docs` |

---

## 12. 💬 Chats exportados con LLMs

| Archivo | Modelo / Fecha | Notas |
|---------|----------------|-------|
| [`chats/README.md`](chats/README.md) | — | Índice de chats |
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
| [`chats/claude-2026-07-17-v3.md`](chats/claude-2026-07-17-v3.md) | Claude · 17 jul | v3 |
| [`chats/misc.md`](chats/misc.md) | varios | Fragmentos varios |

---

## 13. 🖼️ Assets y capturas

Ubicación: `assets/capturas/`

| Carpeta | Contenido |
|---------|-----------|
| `assets/capturas/proceso/` | ~55 capturas del proceso de desarrollo (jul 14–16): Replit, Vercel, Neon Console |
| `assets/capturas/prospector-app/` | Screenshots del AI Prospector: kanban, MEDDIC, WhatsApp bot, brochure |
| `assets/capturas/replit-vercel/` | Capturas de configuración Replit ↔ Vercel |
| `assets/capturas/sitio/` | Capturas del sitio web y clientes (jul 17) |
| `assets/capturas/github/` | Capturas de PRs, workflows y actions en GitHub (jul 17) |
| `assets/` | Organigrama, casos de éxito, favicon, imagen del proyecto |

---

## 🗑️ Historial de limpieza — julio 2026

| Acción | Detalle |
|--------|---------|
| `referencia-tecnica/` eliminada | Todo el contenido útil migrado a `docs/` |
| 35 archivos borrados | `Pasted-*.txt`, `mistral1`, 3 PDFs duplicados |
| `1-wordpress/` descartado | Plugins WP obsoletos, no relevantes al stack actual |
| `2-codigo/` descartado | Backups de raíz (`server-2.ts`, etc.) |
| Fichas antiguas descartadas | Superadas por `docs/agentes/subagente-*.md` (más completas) |
