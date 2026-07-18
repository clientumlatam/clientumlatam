# Documentación — Clientum CRM
> Actualizado: 2026-07-17 · **114 archivos · 21 carpetas**  
> Reducido de 1.866 archivos / 271 carpetas originales.

---

## Estructura

```
docs/
├── ARCHITECTURE.md         Stack técnico completo
├── INTEGRATION.md          Integraciones externas (estado actual)
├── BUILD.md                Guía de implementación del sistema de agentes (00–07)
├── hermes-santi.md         Documentación completa del agente Santi SDR
├── SESIONES.md             Bitácora cronológica de sesiones (10–17 jul 2026)
├── INFORMES.md             Análisis consolidado de chats y sesiones
├── ANALISIS-DOCS.md        Auditoría recursiva de docs/ (histórico)
│
├── agentes/                Sistema Hermes Prime — 14 agentes en 14 archivos
├── chats/                  17 exports de sesiones con LLMs
├── sesiones/               Notas de sesiones + archivo MDS
├── negocio/                Brochures, catálogo, logos, propuestas
├── sitio/                  Copy, WordPress, sitemaps
└── proyecto/               Notas técnicas, backups, capturas, config
```

---

## Documentos canónicos

| Archivo | Descripción |
|---------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack: React 19 + Express + Neon PostgreSQL. Rutas, auth, env vars, deploy Vercel/Replit. |
| [INTEGRATION.md](INTEGRATION.md) | Estado de integraciones: Gemini, Apify, Hunter, SMTP, WhatsApp, Stripe, Neon Auth. |
| [BUILD.md](BUILD.md) | 8 guías en orden para replicar el sistema de agentes desde cero. |
| [hermes-santi.md](hermes-santi.md) | Todo sobre el agente Santi SDR: QUICKSTART, SKILL, INTEGRATION, GO-LIVE, scripts. |
| [SESIONES.md](SESIONES.md) | Log cronológico de sesiones 10–17 julio 2026. |
| [INFORMES.md](INFORMES.md) | Análisis de 6 chats exportados + sesiones de trabajo IA (julio 2026). |

---

## `agentes/` — Sistema Hermes Prime

11 agentes autónomos, cada uno en **un solo archivo** (identidad + memoria + proceso + skill fusionados).

| Archivo | Agente | Rol |
|---------|--------|-----|
| [HERMES-PRIME.md](agentes/HERMES-PRIME.md) | Sistema completo | Arquitectura del sistema multi-agente |
| [ORGANIGRAMA.md](agentes/ORGANIGRAMA.md) | — | Jerarquía de los 11 agentes |
| [SANTI-SDR.md](agentes/SANTI-SDR.md) | Santi SDR | Integración Santi ↔ CRM (doc detallada) |
| [SETUP.md](agentes/SETUP.md) | — | Puesta en marcha en GitHub Actions |
| [orquestador.md](agentes/orquestador.md) | Orquestador IA | Chief of Staff — rutea instrucciones de Jonathan |
| [tecnico.md](agentes/tecnico.md) | Agente Técnico | CTO AI — coordina 3 sub-agentes técnicos |
| [tecnico-backend-infra.md](agentes/tecnico-backend-infra.md) | Backend/Infra | APIs, auth, base de datos |
| [tecnico-frontend-ux.md](agentes/tecnico-frontend-ux.md) | Frontend/UX | CRM Kanban, dashboard, UI |
| [tecnico-ia-automatizacion.md](agentes/tecnico-ia-automatizacion.md) | IA & Automatización | Brochures, MEDDIC, enriquecimiento |
| [ventas.md](agentes/ventas.md) | Agente de Ventas | Sales Manager — pipeline completo |
| [ventas-santi-sdr.md](agentes/ventas-santi-sdr.md) | Santi SDR | Outbound WhatsApp — contacta y clasifica leads |
| [ventas-explorador-patagonico.md](agentes/ventas-explorador-patagonico.md) | Explorador Patagónico | Lead gen Google Maps / Apify |
| [marketing.md](agentes/marketing.md) | Agente de Marketing | Contenido, SEO, campañas |
| [marketing-seo-contenido.md](agentes/marketing-seo-contenido.md) | SEO & Contenido | Blogs, landings, keywords Patagonia |
| [customer-success.md](agentes/customer-success.md) | Customer Success | Salud de cuentas, onboarding, churn |
| [customer-success-asesor-comercial.md](agentes/customer-success-asesor-comercial.md) | Asesor Comercial IA | Chatbot inbound del sitio |
| [operaciones.md](agentes/operaciones.md) | Agente de Operaciones | COO AI — métricas, reportes, alertas |
| [operaciones-finanzas-admin.md](agentes/operaciones-finanzas-admin.md) | Finanzas & Admin | MRR, pipeline revenue, reportes semanales |
| [scripts/run-agentes.mjs](agentes/scripts/run-agentes.mjs) | — | Runner principal de GitHub Actions |
| [scripts/agentes-clientum.yml](agentes/scripts/agentes-clientum.yml) | — | Workflow cron de GitHub Actions (15 min) |

---

## `negocio/` — Activos comerciales

### `negocio/brochures/`
| Archivo | Descripción |
|---------|-------------|
| `brochure-sitio.html` | Brochure HTML del sitio (v7, final) |
| `brochure-2026.html` | Brochure HTML corporativo 2026 |
| `brochure-corporativo-2026.mhtml` | Brochure corporativo en MHTML |
| `brochure-distribuidora-del-sur.pdf` | PDF propuesta Distribuidora del Sur |
| `brochure-distribuidora-del-sur-detalle.pdf` | PDF con detalle técnico |
| `brochure-clientum.pdf` | Brochure genérico PDF |

### `negocio/catalogo/`
Catálogo de servicios y productos WooCommerce.

| Archivo | Descripción |
|---------|-------------|
| `catalogo-final.csv` | ⭐ Catálogo canónico de servicios Clientum |
| `catalogo-nucleo.csv` | Núcleo reducido del catálogo |
| `catalogo-referencia.xlsx` | Excel con formato para presentaciones |
| `catalogo-reestructurado.xlsx` | Restructuración v3b para WooCommerce |
| `woocommerce-573.csv` | ⭐ CSV WooCommerce más completo (573 productos) |
| `woocommerce-versiones-anteriores.zip` | Versiones 499/509/521 archivadas |
| `leads-general-roca-distribuidora.csv` | Leads de prospección General Roca |
| `paginas-web.csv` | Mapa de páginas del sitio |
| `textos-paginas.csv` | Textos por página |

### `negocio/propuestas/`
`propuesta-ecommerce-unificada.html` · `propuesta-gaman-v2.pdf` · `propuesta-koala.pdf` · `propuesta-koala.mhtml`

### `negocio/logos/`
Logos de clientes (`clientes/`) y partners para brochures y el sitio.

---

## `sitio/` — Sitio web clientum.com.ar

| Archivo / Carpeta | Descripción |
|-------------------|-------------|
| `copy-final.md` | ⭐ Copy completo del sitio (v5, fuente de verdad) |
| `copy-textos.zip` | Copys por sección (ERP, ecommerce, integraciones, etc.) |
| `web-html.zip` | HTMLs del sitio: paginas/, sections/, servicios/, comparativas/ |
| `sitemaps.zip` | Sitemaps XML del sitio (varios formatos) |
| `wordpress/content/clientum-content-fusionado.xml` | Contenido WordPress para importar |
| `wordpress/plugins/plugins-activos.zip` | Plugins activos: AI Marketing Expert v2, AI Prospector, User Dashboard, Google Sheets |
| `wordpress/plugins/ai-marketing-expert-v1-archivado.zip` | Plugin v1 archivado |
| `wordpress/themes/clientum-theme.zip` | Tema WordPress personalizado |
| `wordpress/wp-config.php` | Configuración WordPress |

---

## `sesiones/` — Contexto de sesiones

| Archivo | Descripción |
|---------|-------------|
| `notas-contexto.md` | Análisis de docs, contexto inicial, stack, snapshot replit.md |
| `notas-producto.md` | Notas sobre catálogo, logos, menú, historial del plugin CRM |
| `MDS-consolidado.zip` | Consolidado de 108 archivos del MDS.zip (comprimido, 516KB) |

---

## `chats/` — Exports de sesiones con LLMs

Ver [`chats/README.md`](chats/README.md) para el índice completo.  
17 archivos nombrados `modelo-fecha.md` (Claude, ChatGPT, Gemini, Replit Agent).

---

## `proyecto/` — Artefactos técnicos

| Archivo / Carpeta | Descripción |
|-------------------|-------------|
| `capturas.zip` | 266 capturas de Vercel, Neon, Replit, sitio web (53 MB) |
| `backups/` | 4 ZIPs de backup del repl y attached_assets |
| `assets/` | favicon.svg, image.png |
| `codigo.zip` | Scripts Python y PHP de utilidad |
| `logs.zip` | Logs de app en producción (Vercel) + dedup |
| `config/env-completo.env` | Variables de entorno de referencia (sin valores) |
| `SECRETS-AUDITORIA.md` | Auditoría de los 32 secrets configurados en Replit |
| `REMIX-LIMITACIONES-FREE.md` | Qué no se transfiere al hacer Remix en cuenta free de Replit |
| `notas-tecnicas/` | Ver tabla abajo |

### `proyecto/notas-tecnicas/`

| Archivo | Descripción |
|---------|-------------|
| `neon.md` | Quickstart, connection string, snippets de Neon Auth |
| `vercel.md` | Deploy, dashboard, seguridad, integraciones Vercel |
| `replit.md` | Docs, skills, env vars, chat de estado Replit |
| `cloudflare-worker.md` | Proxy, HTML brochure, origen en Replit |
| `github-actions.md` | Workflow PR y deduplicación |
| `errores-ts.md` | Errores TypeScript resueltos (ok-property, session, vite) |
| `agentes-prompts.md` | Prompt del Orquestador + estrategia de outreach |
| `estructura-proyecto-replit.md` | Snapshot de estructura del proyecto (v4 final) |
| `leaked-env-keys-HISTORIAL.txt` | ⚠️ Registro de claves filtradas (auditoría) |
| `archivos-historicos.zip` | Conversaciones de ChatGPT/Gemini + historial de claves expuestas |
| `neon-console-exports.zip` | Exports HTML de la consola Neon |

---

_Para regenerar `DOCS-INDEX.md` con el detalle de cada archivo: correr el script de generación desde la raíz del proyecto._
