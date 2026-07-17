# Clientum CRM

Plataforma B2B SaaS de automatización de ventas orientada a PyMEs de la Patagonia argentina. Combina un CRM Kanban, prospección con IA, generación de brochures PDF por industria, un chatbot de WhatsApp, y un sistema de agentes de IA autónomos que operan ventas, marketing, soporte y operaciones 24/7 bajo la arquitectura **Hermes Prime**.

- **URL producción:** https://clientum.com.ar (Vercel)
- **URL desarrollo:** https://\$REPLIT_DEV_DOMAIN (Replit, puerto 5000)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS v4 |
| Backend | Express 4 + TypeScript (Node.js 22), entrypoint `server.ts` |
| Bundler dev | `tsx` |
| Bundler prod | `esbuild` |
| Base de datos | Neon PostgreSQL serverless (pooled) via `pg` |
| Auth | Neon Auth SDK (`@neondatabase/neon-js`) + sesiones Express (`connect-pg-simple`) |
| IA | Google Gemini (`@google/genai`) — fallback Groq → OpenRouter |
| PDF | jsPDF + html2canvas-pro |
| Scraping | Apify (3 actores con fallback automático) |
| Enriquecimiento | Hunter.io domain-search |
| Email | Nodemailer (SMTP propio) |
| Paquetes | pnpm |

---

## Comandos

```bash
npm run dev      # Express :5000 + Vite HMR (tsx server.ts)
npm run build    # vite build + esbuild bundle del servidor → dist/
npm run start    # Producción (requiere npm run build primero)
npm run lint     # TypeScript typecheck (tsc --noEmit)
```

---

## Estructura del proyecto

```
/
├── server.ts                  # Express entrypoint — todas las rutas API + Vite dev
├── api/
│   ├── index.ts               # Entrypoint Vercel serverless (re-exporta server.ts)
│   └── tsconfig.json          # moduleResolution: node16 (requerido por Vercel)
├── src/
│   ├── main.tsx               # React root (BrowserRouter + NeonAuthUIProvider)
│   ├── App.tsx                # Router: website / prospector / auth / account
│   ├── types.ts               # Tipos globales (BrochureData, CRMDeal, CustomTemplate…)
│   ├── data/                  # Catálogos JSON (serializados en bundle)
│   │   ├── servicios-catalogo.json    # 425 servicios/productos
│   │   ├── categorias-servicios.json  # 14 categorías de industria
│   │   └── cursos-lms.json            # 67 cursos LMS
│   ├── store/
│   │   └── sharedStore.ts     # Estado compartido con localStorage (deals, activity)
│   ├── services/
│   │   └── scraperService.ts  # Cliente HTTP → /api/scrape-places
│   ├── utils/
│   │   └── pdfGenerator.ts    # Exporta brochures a PDF via jsPDF + html2canvas-pro
│   └── components/            # (ver sección Componentes)
├── public/                    # Assets estáticos (logos, imágenes, brochures)
├── docs/                      # (ver sección Documentación)
├── artifacts/
│   └── mockup-sandbox/        # Sandbox Vite separado (puerto 23636) para mockups canvas
├── scripts/
│   ├── generate_catalog.py    # Re-genera servicios-catalogo.json desde fuente nzip2
│   ├── pull-secrets.mjs       # Trae secrets de Vercel → .env.local
│   ├── setup-check.mjs        # Verifica qué secrets están activos
│   └── sync-secrets.mjs       # Sube secrets a Vercel y GitHub
├── .github/workflows/
│   ├── ci.yml                 # tsc --noEmit + vite build en cada PR/push
│   └── neon_workflow.yml      # Crea branch Neon "preview/pr-N" por PR (expira 14 días)
├── vercel.json                # Deploy config (buildCommand, routes, maxDuration: 30s)
└── replit.md                  # ← este archivo
```

---

## Variables de entorno

Todas están en Replit Secrets. Ver también `scripts/pull-secrets.mjs` para sincronizar desde Vercel.

### Requeridas (app no arranca sin ellas)

| Variable | Descripción |
|----------|-------------|
| `SESSION_SECRET` | Firma cookies de sesión Express |
| `DATABASE_URL` | Cadena de conexión PostgreSQL Neon (pooled) |
| `GEMINI_API_KEY` | Google Gemini — generación IA principal |
| `CRM_INTERNAL_TOKEN` | Token webhook WordPress plugin → CRM |

### Autenticación Neon

| Variable | Descripción |
|----------|-------------|
| `NEON_API_KEY` | API Neon para resolver DB URL dinámica |
| `NEON_PROJECT_ID` | ID del proyecto Neon |
| `NEON_DATABASE_URL` | URL alternativa DB Neon |
| `JWKS_URL` | URL JWKS para validar tokens Neon Auth |
| `VITE_NEON_AUTH_URL` | URL del proxy auth (expuesto al cliente vía Vite) |

### Servicios externos opcionales

| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY_V2` | Segunda key Gemini (rotación/fallback) |
| `GROQ_API_KEY` | Groq — fallback de IA si Gemini falla |
| `OPENROUTER_API_KEY` | OpenRouter — fallback terciario de IA |
| `APIFY_API_TOKEN` | Scraping real de Google Maps / LinkedIn |
| `GOOGLE_MAPS_PLATFORM_KEY` | Places API (New) para prospección |
| `HUNTER_API_KEY` | Hunter.io — enriquecimiento de contactos |
| `SANTI_API_KEY` | Auth server-to-server del agente SDR Santi (Hermes) |
| `APP_URL` | URL pública del app deployado |

### Email y deploy

| Variable | Descripción |
|----------|-------------|
| `SMTP_USER` | Usuario SMTP (reset de contraseña) |
| `SMTP_PASS` | Password SMTP |
| `VERCEL_TOKEN` | Token Vercel — usarlo con `scripts/pull-secrets.mjs` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | PAT GitHub para scripts de automatización |

### Auto-inyectadas (no setear manualmente)

`PORT`, `NODE_ENV`, `REPLIT_DEPLOYMENT`, `DISABLE_HMR`

---

## Base de datos

Las tablas se crean automáticamente al iniciar el servidor (`CREATE TABLE IF NOT EXISTS`).

| Tabla | Descripción |
|-------|-------------|
| `users` | Cuentas del CRM — primer registro = admin automático |
| `session` | Sesiones Express (connect-pg-simple) |
| `chatbot_leads` | Leads capturados por el Asesor Comercial IA (chatbot inbound) |
| `santi_leads` | Prospectos generados por el Explorador Patagónico / SDR Santi |
| `santi_brochures` | Brochures PDF generados por industria para cada lead |
| `santi_notes` | Notas del agente Santi sobre cada lead |

---

## API — Rutas del servidor

### Autenticación (`/api/auth/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (primer usuario = admin) |
| POST | `/api/auth/login` | Login con bcrypt |
| POST | `/api/auth/logout` | Destruye sesión |
| GET | `/api/auth/me` | Devuelve usuario de sesión actual |
| POST | `/api/auth/change-password` | Cambia contraseña (requiere auth) |
| POST | `/api/auth/forgot-password` | Envía email con token de reset |
| POST | `/api/auth/reset-password` | Valida token y actualiza contraseña |
| POST | `/api/auth/neon-register` | Registro vía Neon Auth SDK |
| POST | `/api/auth/neon-login` | Login vía Neon Auth SDK |

### Prospección y scraping
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/config/has-google-maps` | Verifica si Google Maps API está configurada |
| POST | `/api/scrape-places` | Scraping de locales (Google Maps / Apify) |
| POST | `/api/enrich-contact` | Enriquecimiento vía Hunter.io |
| POST | `/api/scrape-employees-bulk` | Scraping masivo de empleados |

### IA y generación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/generate` | Generación genérica con Gemini (brochures, scoring, copy) |

### Leads (SDR Santi — autenticación por API key)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/leads` | Crea nuevo lead |
| GET | `/api/leads` | Lista leads (filtrable por `status`, `limit`) |
| PATCH | `/api/leads/:id` | Actualiza estado/datos del lead |
| POST | `/api/leads/:id/brochure` | Genera y guarda brochure para el lead |
| GET | `/api/leads/:id/brochure` | Recupera brochure del lead |
| POST | `/api/leads/:id/notes` | Agrega nota al lead |

### Leads chatbot (autenticación por sesión)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/chatbot-leads` | Crea lead desde chatbot |
| GET | `/api/chatbot-leads` | Lista leads del chatbot |
| PATCH | `/api/chatbot-leads/:id` | Actualiza lead del chatbot |
| POST | `/api/webhooks/chatbot-lead` | Webhook entrada desde WordPress plugin (token CRM) |

### Orquestador IA
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/orchestrator/metrics` | KPIs rápidos sin IA (leads, deals, pipeline) |
| POST | `/api/orchestrator` | Chat con el Orquestador — delega a 5 agentes departamentales |

---

## Frontend — Rutas y modos

`App.tsx` maneja 4 modos via URL:

| URL | Modo | Componente |
|-----|------|------------|
| `/` | `website` | `PublicWebsite` — sitio público completo |
| `/prospector` o `/crm` | `prospector` | `SalesProspectorDashboard` — CRM + brochures |
| `/auth` o `/auth/*` | `auth` | `AuthView` (Neon Auth SDK) |
| `/account` o `/account/*` | `account` | `NeonAccountView` (Neon Auth SDK) |

---

## Componentes principales

### `PublicWebsite.tsx` (5 300+ líneas)
SPA del sitio público con tabs laterales. Una URL, toda la navegación por estado interno.

**Tabs disponibles:**

| Tab ID | Descripción |
|--------|-------------|
| `inicio` | Hero + formulario de demo |
| `servicios` | Catálogo de soluciones Clientum |
| `catalogo` | Catálogo completo (requiere auth) |
| `planes` | Planes de precios (Inicial → Corporativo → Especializado) |
| `nosotros` | Sobre Clientum + OrganigramaClientum (Equipo + Agentes IA) |
| `clientes` | Testimonios y logos |
| `casos` | Casos de éxito |
| `academia` | Cursos y campus virtual |
| `blog` | Blog y recursos |
| `contacto` | Formulario de contacto |
| `integraciones` | Ecosistema — 63 integraciones en 10 categorías |
| `asociacion` | Programa de afiliados y partners |
| `ayuda` | Centro de ayuda |
| `privacidad` | Política de privacidad |
| `chatbot` | Demo del chatbot WhatsApp |
| `crm_inteligente` | Demo del CRM |
| `asistente_ia` | Demo del Asistente IA |
| `reportes` | Demo de reportes |
| `automatizacion` | Demo de flujos de automatización |
| `afip` | Integración facturación AFIP |
| `mercadopago` | Integración MercadoPago |
| `leads` | Demo gestión de leads |
| `portal_cliente` | Demo portal del cliente |
| `desarrollo_web` | Servicios de desarrollo web |

### `SalesProspectorDashboard.tsx`
Panel principal del CRM. Integra:
- `CrmFullApp` — CRM completo (10 sub-tabs)
- `SidebarEditor` — Editor de brochures con presets por industria
- `BrochurePreview` — Preview/export PDF del brochure
- `AsistenteIA` — Asistente IA lateral
- `OrquestadorIA` — Chat con los 5 agentes autónomos
- `WpSetup` / `WpModulos` — Configuración WordPress

### `crm-full/CrmFullApp.tsx`
CRM completo con 10 sub-tabs (estado en `localStorage`):

| Tab | Componente | Descripción |
|-----|-----------|-------------|
| `dashboard` | `CrmFullDashboard` | KPIs: MRR, leads, conversión, churn |
| `crm` | `CrmFullPipeline` | Pipeline Kanban drag & drop |
| `products` | `CrmFullProducts` | Catálogo de productos/servicios |
| `usecases` | `CrmFullUseCases` | Casos de uso por industria |
| `sellers` | `CrmFullSellers` | Gestión de vendedores |
| `branches` | `CrmFullBranches` | Gestión de sucursales |
| `conversations` | `CrmFullConversations` | Conversaciones / historial |
| `leads` | `CrmFullLeads` | Leads del SDR (santi_leads) |
| `bot` | `CrmFullBotConfig` | Configuración del chatbot |
| `cmdb` | `CrmFullCMDB` | Inventario de infraestructura IT |

### Otros componentes

| Componente | Descripción |
|-----------|-------------|
| `OrganigramaClientum.tsx` | Organigrama interactivo — árbol colapsable con agentes IA (paleta navy/gold) |
| `OrquestadorIA.tsx` | Chat con el Orquestador — delega a 5 agentes departamentales vía `/api/orchestrator` |
| `AsistenteIA.tsx` | Asistente IA conversacional — análisis de CRM y sugerencias |
| `BrochurePreview.tsx` | Preview multi-página + export PDF; soporta presets por industria y temas de color |
| `SidebarEditor.tsx` | Panel de edición del brochure (datos empresa, deals, contacto) |
| `InteractiveCRMKanban.tsx` | Kanban demo embebible (sin backend) |
| `InteractiveAIChat.tsx` | Chat IA embebible (demo) |
| `ChatbotSim.tsx` | Simulador de chatbot WhatsApp |
| `SalesAssistantChat.tsx` | Asistente de ventas en contexto |
| `SidebarCRM.tsx` | Sidebar de navegación del CRM |
| `AuthGate.tsx` | Guard de rutas (sesión Express) |
| `NeonAuthGate.tsx` | Guard de rutas (Neon Auth SDK) |
| `AccountView.tsx` | Perfil de usuario — cambio de contraseña |
| `wordpress/WpSetup.tsx` | Configuración del plugin WordPress |
| `wordpress/WpModulos.tsx` | Módulos de integración WordPress |
| `sidebar-tabs/ActivityTab.tsx` | Tab de actividad reciente en sidebar |
| `sidebar-tabs/QuickCreateTab.tsx` | Creación rápida desde sidebar |

---

## Agentes de IA — Arquitectura Hermes Prime

Jonathan dirige la empresa vía chat con el Orquestador. El sistema corre en un repo separado (`clientum-agentes`) con GitHub Actions (cron 15 min).

```
Jonathan (CEO)
    └── Orquestador IA (Chief of Staff) — cron 15 min
            ├── Agente Técnico (CTO AI)
            │       ├── Backend / Infra (Node.js · Express · Neon)
            │       ├── Frontend / UX (React 19 · Tailwind v4)
            │       └── IA & Automatización (Gemini · Apify · Hunter)
            ├── Agente de Ventas (Sales Manager AI)
            │       ├── Explorador Patagónico (Google Maps · Apify · Gemini)
            │       ├── Santi SDR (WhatsApp · Hermes Agent · 15 contactos/día)
            │       └── Jonathan (Closer — reuniones y cierres)
            ├── Agente de Marketing (Marketing Manager AI)
            │       └── SEO & Contenido (WordPress · Gemini)
            ├── Agente Customer Success (CS Manager AI)
            │       └── Asesor Comercial IA (chatbot inbound del sitio)
            └── Agente de Operaciones (COO AI)
                    └── Finanzas & Admin (MRR · AFIP · MercadoPago)
```

**Documentación de agentes:** `docs/agentes/`  
**Scripts del cron:** `docs/agentes/scripts/`

---

## Documentación (`docs/`)

| Carpeta | Contenido |
|---------|-----------|
| `docs/agentes/` | Organigrama, fichas operativas (14 agentes), scripts del cron autónomo, setup de API keys |
| `docs/referencia-tecnica/` | Arquitectura + integraciones, implementación Santi/Hermes, entorno de plataformas, auditoría y contexto |
| `docs/catalogo/` | CSVs de servicios (456 filas), cursos (289 filas), talleres DonWeb (140), planes, WooCommerce, leads |
| `docs/negocio/propuestas/` | Propuestas comerciales en PDF/HTML (Gaman, Koala, E-commerce) |
| `docs/chats/` | Exports de conversaciones por fecha (13, 14, 16, 17 julio 2026) |
| `docs/sitio/` | Copy completo v5, sitemaps XML (talleres.donweb.com), WordPress WXR export, CSVs sitemap + copy |

**Archivos canónicos de referencia:**
- `docs/INDEX.md` — índice completo de docs
- `docs/referencia-tecnica/arquitectura-e-integraciones.md` — arquitectura técnica
- `docs/agentes/organigrama-y-arquitectura.md` — organigrama y Hermes Prime
- `docs/referencia-tecnica/implementacion-santi-hermes.md` — manual SDR Santi
- `docs/sitio/sitio-copy-completo-v5.md` — copy del sitio (fuente de verdad)

---

## Catálogo de datos (`docs/catalogo/`)

| Archivo | Descripción |
|---------|-------------|
| `servicios-y-productos.csv` | 456 filas — servicios/productos unificados (WooCommerce + nucleo + integraciones) |
| `cursos.csv` | 289 filas — cursos unificados (140 DonWeb talleres + 129 WooCommerce + 20 Academia) |
| `talleres_donweb.csv` | 140 talleres scrapeados de talleres.donweb.com via WordPress REST API |
| `woocommerce-573.csv` | 573 productos WooCommerce originales (fuente primaria) |
| `planes.csv` | 5 planes de suscripción (Inicial $20 → Especializado $250 USD/mes) |
| `leads-general-roca-distribuidora.csv` | Leads reales prospectados General Roca |

---

## Datos en `src/data/`

| Archivo | Items | Descripción |
|---------|-------|-------------|
| `servicios-catalogo.json` | 425 | Catálogo principal de servicios/productos (bundle cliente) |
| `categorias-servicios.json` | 14 | Categorías e industrias (filtros del catálogo) |
| `cursos-lms.json` | 67 | Cursos del campus virtual |

---

## Flujo de desarrollo y despliegue

```
Desarrollo (Replit, puerto 5000)
  npm run dev — Express + Vite HMR
  DB: Neon vía NEON_API_KEY + NEON_PROJECT_ID
        │
        │ git push / Pull Request
        ▼
  GitHub Actions
    ci.yml:            tsc --noEmit + vite build (bloquea PRs con errores)
    neon_workflow.yml: crea branch Neon "preview/pr-N" (expira 14 días)
        │
        │ PR mergeado a main
        ▼
  Vercel (clientum.com.ar) — auto-deploy
    Install: pnpm install --frozen-lockfile
    Build:   vite build
    API:     api/index.ts → Vercel Function Node 22 (maxDuration: 30s)
    SPA:     dist/ desde CDN edge
```

---

## Cómo hacer Remix de este proyecto

Los secrets **no se copian** al hacer Remix — se traen desde Vercel con un comando.

```bash
# 1. Agregar solo VERCEL_TOKEN en Replit Secrets
# 2. Traer todos los secrets:
node scripts/pull-secrets.mjs
# Crea .env.local con todos los valores

# 3. Levantar:
npm run dev

# Verificar qué secrets están activos:
node scripts/setup-check.mjs

# Migrar secrets a Replit definitivamente (copiar de .env.local a Secrets) y luego:
rm .env.local
```

---

## Integraciones externas

| Servicio | Uso |
|---------|-----|
| **Google Gemini** | Generación de brochures, scoring MEDDIC, copy de ventas, chat orquestador |
| **Groq** | Fallback de IA (velocidad) |
| **OpenRouter** | Fallback terciario de IA |
| **Apify** | Scraping Google Maps, LinkedIn, directorios (3 actores con fallback) |
| **Google Maps Places API** | Prospección directa de locales comerciales |
| **Hunter.io** | Enriquecimiento de contactos (email por dominio) |
| **Neon PostgreSQL** | Base de datos serverless + Neon Auth SDK |
| **Nodemailer/SMTP** | Reset de contraseña por email |
| **Hermes Agent** (externo) | Servidor Ubuntu — SDR Santi outbound WhatsApp |
| **Vercel** | Hosting producción + Serverless Functions |
| **GitHub Actions** | CI (lint + build) + cron de agentes + branches Neon por PR |

---

## Artefactos

| Artefacto | Descripción |
|-----------|-------------|
| `artifacts/mockup-sandbox/` | Servidor Vite separado (puerto 23636) para mockups del canvas de Replit. Componentes demo en `src/components/mockups/`. |

---

## User preferences

- Hablar siempre en español (Argentina) en el chat con el agente
- Mantener la estructura del proyecto y el stack existente
- No cambiar lógica de negocio ni funcionalidades sin confirmación explícita
- Paleta de color oficial del header: `#1A3461` (azul Clientum)
- Los brochures usan paleta navy/gold como tema principal
- El catálogo de servicios se re-genera desde la fuente `nzip2` (repo GitHub), nunca editar `servicios-catalogo.json` a mano — usar `scripts/generate_catalog.py`
- Priorizar documentación, automatización e infraestructura sobre nuevas features
- Todos los cambios de rol de usuario deben re-consultarse en DB (no confiar en sesión activa)
- Las respuestas de API con `Set-Cookie` deben incluir `Cache-Control: no-store` (Vercel CDN strip issue)
