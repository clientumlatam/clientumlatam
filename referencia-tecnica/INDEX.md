# Índice de Documentación — Clientum CRM
> Julio 2026 · Estructura limpia y depurada

---

## Estructura completa

```
docs/
├── INDEX.md                              ← este archivo
│
├── agentes/                              ← sistema de agentes IA autónomos
│   ├── README.md                         — estado real vs. visión + árbol de agentes
│   ├── organigrama-y-arquitectura.md     — canónico: árbol completo + Hermes Prime
│   ├── departamento-ventas.md
│   ├── departamento-tecnico.md
│   ├── departamentos-marketing-cs-ops.md
│   ├── setup-y-api-keys.md               — puesta en marcha + API keys por agente
│   ├── fichas/ (14 fichas operativas)
│   └── scripts/
│       ├── agentes-clientum.yml          — GitHub Actions cron 15 min
│       └── run-agentes.mjs              — lógica de ejecución del orquestador
│
├── referencia-tecnica/                   ← arquitectura y guías técnicas
│   ├── README.md
│   ├── arquitectura-e-integraciones.md   — canónico: stack, schema, endpoints
│   ├── implementacion-santi-hermes.md    — canónico: manual completo SDR Santi
│   ├── entorno-plataformas.md            — Vercel, Neon, Replit, GitHub Actions
│   └── auditoria-y-contexto.md           — secrets, Remix, errores TS conocidos
│
├── catalogo/                             ← datos de productos, servicios y leads
│   ├── README.md
│   ├── servicios-y-productos.csv         — CANÓNICO (456 registros)
│   ├── cursos.csv                        — CANÓNICO (289 registros · CSV multilínea)
│   ├── planes.csv                        — 5 planes de suscripción
│   ├── fuentes/
│   │   ├── catalogo-maestro-425.txt      — fuente maestro (~425 registros, txt plano)
│   │   ├── woocommerce-573.csv           — 573 productos WooCommerce (fuente primaria)
│   │   └── talleres_donweb.csv           — 140 talleres DonWeb (CSV multilínea)
│   └── leads/
│       ├── leads-general-roca-distribuidora.csv  — 19 prospectos reales Gral. Roca
│       └── ai-client-prospector-pipeline-v2.csv  — pipeline ejemplo formato Santi
│
└── sitio/                                ← contenido del sitio clientum.com.ar
    ├── README.md
    ├── sitio-copy-completo-v5.md         — CANÓNICO: copy completo (fuente de verdad)
    ├── sitio-copy.csv                    — copy estructurado por página (12 registros · CSV multilínea)
    ├── sitemap.csv                       — 132 URLs unificadas (3 dominios)
    └── fuentes/
        ├── clientum-content-fusionado.xml        — WXR WordPress (36 páginas)
        ├── sitemap-clientumlatam-v2.xml           — sitemap XML clientum.com.ar
        └── sitemap-mysitemapgenerator-generado.xml — sitemap XML talleres.donweb.com
```

> **Nota sobre recuentos CSV:** `cursos.csv`, `talleres_donweb.csv` y `sitio-copy.csv` usan campos multilínea entre comillas — `wc -l` da valores inflados (5 766, 5 662, 287 líneas respectivamente). Los recuentos en esta documentación refieren a **registros reales**, verificados con parser CSV.

---

## 1. 🤖 Agentes IA

### Documentos de diseño del sistema

| Archivo | Descripción |
|---------|-------------|
| [`agentes/README.md`](agentes/README.md) | Estado real vs. visión (julio 2026) — Santi Hermes es el canónico; loop de Issues es simulador de texto |
| [`agentes/organigrama-y-arquitectura.md`](agentes/organigrama-y-arquitectura.md) | Organigrama completo + arquitectura Hermes Prime — **canónico** |
| [`agentes/departamento-ventas.md`](agentes/departamento-ventas.md) | Ventas: Sales Manager AI + Santi SDR + Explorador Patagónico |
| [`agentes/departamento-tecnico.md`](agentes/departamento-tecnico.md) | Técnico: CTO AI + Backend/Infra + Frontend/UX + IA & Automatización |
| [`agentes/departamentos-marketing-cs-ops.md`](agentes/departamentos-marketing-cs-ops.md) | Marketing · Customer Success · Operaciones |
| [`agentes/setup-y-api-keys.md`](agentes/setup-y-api-keys.md) | Setup del repo autónomo + referencia completa de API keys por agente |

### Scripts del sistema autónomo

| Archivo | Descripción |
|---------|-------------|
| [`agentes/scripts/agentes-clientum.yml`](agentes/scripts/agentes-clientum.yml) | GitHub Actions workflow (cron 15 min) |
| [`agentes/scripts/run-agentes.mjs`](agentes/scripts/run-agentes.mjs) | Lógica de ejecución del Orquestador y los 5 agentes |

### Fichas operativas (14 agentes)

| Ficha | Agente |
|-------|--------|
| [`fichas/orquestador.md`](agentes/fichas/orquestador.md) | Orquestador IA — Chief of Staff |
| [`fichas/ventas.md`](agentes/fichas/ventas.md) | Agente de Ventas — Sales Manager AI |
| [`fichas/ventas-santi-sdr.md`](agentes/fichas/ventas-santi-sdr.md) | Santi SDR — SDR Outbound AI |
| [`fichas/ventas-explorador-patagonico.md`](agentes/fichas/ventas-explorador-patagonico.md) | Explorador Patagónico — Lead Generation AI |
| [`fichas/tecnico.md`](agentes/fichas/tecnico.md) | Agente Técnico — CTO AI |
| [`fichas/tecnico-backend-infra.md`](agentes/fichas/tecnico-backend-infra.md) | Backend / Infra |
| [`fichas/tecnico-frontend-ux.md`](agentes/fichas/tecnico-frontend-ux.md) | Frontend / UX |
| [`fichas/tecnico-ia-automatizacion.md`](agentes/fichas/tecnico-ia-automatizacion.md) | IA & Automatización |
| [`fichas/marketing.md`](agentes/fichas/marketing.md) | Agente de Marketing — Marketing Manager AI |
| [`fichas/marketing-seo-contenido.md`](agentes/fichas/marketing-seo-contenido.md) | SEO & Contenido — Content AI |
| [`fichas/customer-success.md`](agentes/fichas/customer-success.md) | Agente Customer Success — CS Manager AI |
| [`fichas/customer-success-asesor.md`](agentes/fichas/customer-success-asesor.md) | Asesor Comercial IA — Inbound Chatbot |
| [`fichas/operaciones.md`](agentes/fichas/operaciones.md) | Agente de Operaciones — COO AI |
| [`fichas/operaciones-finanzas-admin.md`](agentes/fichas/operaciones-finanzas-admin.md) | Finanzas & Admin |

---

## 2. 🔧 Referencia técnica

| Archivo | Descripción |
|---------|-------------|
| [`referencia-tecnica/arquitectura-e-integraciones.md`](referencia-tecnica/arquitectura-e-integraciones.md) | Stack completo, schema DB, endpoints API, estado de integraciones — **canónico** |
| [`referencia-tecnica/implementacion-santi-hermes.md`](referencia-tecnica/implementacion-santi-hermes.md) | Manual operativo completo de Santi: schema, endpoints, checklist go-live — **canónico** |
| [`referencia-tecnica/entorno-plataformas.md`](referencia-tecnica/entorno-plataformas.md) | Vercel · Neon · Replit · Cloudflare · GitHub Actions — notas y errores conocidos |
| [`referencia-tecnica/auditoria-y-contexto.md`](referencia-tecnica/auditoria-y-contexto.md) | Auditoría de secrets · Remix · Errores TypeScript conocidos |

---

## 3. 📦 Catálogo

Ver [`catalogo/README.md`](catalogo/README.md) para descripción detallada de cada archivo.

| Tipo | Archivo | Registros |
|------|---------|-----------|
| Servicios/productos | `catalogo/servicios-y-productos.csv` | 456 |
| Cursos + talleres | `catalogo/cursos.csv` | 289 (CSV multilínea) |
| Planes de suscripción | `catalogo/planes.csv` | 5 |
| Leads prospectados | `catalogo/leads/leads-general-roca-distribuidora.csv` | 19 |
| Pipeline ejemplo Santi | `catalogo/leads/ai-client-prospector-pipeline-v2.csv` | — |
| Catálogo maestro (fuente) | `catalogo/fuentes/catalogo-maestro-425.txt` | ~425 |
| WooCommerce (fuente) | `catalogo/fuentes/woocommerce-573.csv` | 573 |
| Talleres DonWeb (fuente) | `catalogo/fuentes/talleres_donweb.csv` | 140 (CSV multilínea) |

---

## 4. 🌐 Sitio

Ver [`sitio/README.md`](sitio/README.md) para descripción detallada.

| Archivo | Descripción |
|---------|-------------|
| [`sitio/sitio-copy-completo-v5.md`](sitio/sitio-copy-completo-v5.md) | Copy completo clientum.com.ar v5 — **fuente de verdad** |
| [`sitio/sitio-copy.csv`](sitio/sitio-copy.csv) | Copy estructurado por página (12 registros · CSV multilínea) |
| [`sitio/sitemap.csv`](sitio/sitemap.csv) | 132 URLs unificadas (clientum.com.ar + talleres.donweb.com + WXR) |
| [`sitio/fuentes/clientum-content-fusionado.xml`](sitio/fuentes/clientum-content-fusionado.xml) | WXR WordPress — 36 páginas listas para importar |
| [`sitio/fuentes/sitemap-clientumlatam-v2.xml`](sitio/fuentes/sitemap-clientumlatam-v2.xml) | Sitemap XML de clientum.com.ar |
| [`sitio/fuentes/sitemap-mysitemapgenerator-generado.xml`](sitio/fuentes/sitemap-mysitemapgenerator-generado.xml) | Sitemap XML de talleres.donweb.com |
