# Clientum CRM

AI-powered B2B sales CRM orientado a pymes de la Patagonia argentina. Permite descubrir prospectos vía Google Maps / Apify, calificarlos con MEDDIC, generar brochures personalizados en PDF por industria, y automatizar el outreach WhatsApp a través del agente SDR "Santi" (Hermes).

Para la documentación técnica completa → `docs/ARCHITECTURE.md`.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS v4 |
| Backend | Express 4 (Node.js 22) |
| Base de datos | Neon PostgreSQL (serverless, pooled) via `pg` |
| IA | Google Gemini (`@google/genai`) con fallback local |
| PDF | jsPDF + html2canvas-pro |
| Scraping | Apify (3 actores con fallback automático) |
| Enriquecimiento | Hunter.io domain-search |
| Gestión paquetes | pnpm |

---

## Cómo correr

```bash
npm run dev        # Inicia Express + Vite dev en :5000
npm run build      # Vite build + esbuild bundle del servidor
npm run start      # Producción (necesita npm run build primero)
npm run lint       # TypeScript typecheck (tsc --noEmit)
```

---

## Estructura del proyecto

```
/
├── server.ts              # Entrypoint Express (dev + Cloud Run)
├── api/
│   ├── index.ts           # Entrypoint Vercel serverless
│   └── tsconfig.json      # moduleResolution: node16 (requerido por Vercel)
├── src/                   # React frontend
│   ├── App.tsx            # Root: routing condicional SPA
│   ├── components/        # Componentes UI (CRM, Kanban, Brochure, etc.)
│   │   └── crm-full/      # CRM completo (Pipeline, Leads, Dashboard…)
│   ├── data/              # JSON catálogos (servicios, cursos, categorías)
│   ├── services/          # scraperService.ts (cliente HTTP → /api/scrape-places)
│   ├── store/             # sharedStore.ts (estado localStorage-backed)
│   └── utils/             # pdfGenerator.ts
├── public/                # Assets estáticos (logos, imágenes)
├── docs/
│   ├── ARCHITECTURE.md    # Arquitectura técnica completa
│   └── SANTI-SDR.md       # Integración agente SDR Santi/Hermes
├── scripts/
│   └── generate_catalog.py
├── .github/workflows/
│   ├── ci.yml             # TypeScript lint + Vite build en cada PR/push
│   └── neon_workflow.yml  # Branch Neon por PR
├── vercel.json            # Deployment Vercel
├── .env.example           # Referencia completa de variables de entorno
└── replit.md              # ← este archivo
```

---

## Variables de entorno

Ver `.env.example` para descripción completa y cómo obtener cada valor.

### Requeridas
| Variable | Descripción |
|----------|-------------|
| `SESSION_SECRET` | Firma cookies de sesión Express |
| `GEMINI_API_KEY` | Google Gemini — todas las funciones de IA |
| `CRM_INTERNAL_TOKEN` | Token webhook WordPress plugin → CRM |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | Resolución dinámica de DB URL (preferido) |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (fallback si no hay NEON_*) |

### Opcionales
| Variable | Descripción |
|----------|-------------|
| `APIFY_API_TOKEN` | Scraping real de Google Maps |
| `GOOGLE_MAPS_PLATFORM_KEY` | Places API (New) para prospección |
| `HUNTER_API_KEY` | Hunter.io — enriquecimiento de contactos |
| `SANTI_API_KEY` | Autenticación server-to-server SDR Santi |
| `APP_URL` | URL pública del app deployado |

### Auto-inyectadas (no setear manualmente)
`VERCEL`, `PORT`, `NODE_ENV`, `DISABLE_HMR`

---

## Tablas en base de datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del CRM (primer registro = admin automático) |
| `session` | Sesiones Express (connect-pg-simple) |
| `chatbot_leads` | Leads capturados por el Asesor Comercial IA |
| `santi_leads` | Prospectos generados por el Explorador Patagónico / SDR |
| `santi_brochures` | Brochures generados por industria para cada lead |
| `santi_notes` | Notas del agente Santi sobre cada lead |

Las tablas se crean automáticamente al iniciar el servidor (`CREATE TABLE IF NOT EXISTS`).

---

## Flujo de desarrollo y despliegue

```
Desarrollo (Replit)
  npm run dev → Express :5000 + Vite HMR
  Neon DB via NEON_API_KEY + NEON_PROJECT_ID
       │
       │ git push / Pull Request
       ▼
GitHub Actions
  ci.yml:           tsc --noEmit + vite build (bloquea PRs rotos)
  neon_workflow.yml: crea branch Neon "preview/pr-N" (expira 14 días)
       │
       │ PR mergeado a main
       ▼
Vercel (clientum.com.ar) — auto-deploy via GitHub integration
  Build:   pnpm install --frozen-lockfile + vite build
  Runtime: api/index.ts como Vercel Function (Node 22)
  SPA:     dist/ servido como estático desde CDN
```

---

## Features

- **CRM Kanban** — pipeline drag & drop con stages y scoring MEDDIC
- **ICP Builder** — perfil de cliente ideal generado por IA
- **Explorador Patagónico** — prospección vía Google Maps / Apify / Gemini Search
- **Calificador MEDDIC** — scoring asistido por IA
- **Campañas de outreach** — WhatsApp / email automation
- **Generador de Brochures** — PDFs personalizados por prospecto e industria con IA
- **Santi SDR** — agente WhatsApp automatizado (ver `docs/SANTI-SDR.md`)
- **Asesor Comercial IA** — chatbot demo para captura de leads
- **Sitio web público** — landing page por industria integrada en el mismo app

---

## User preferences

- Keep the existing project structure and stack
- Hablar siempre en español (Argentina) en el chat con el agente
- No cambiar lógica de negocio ni funcionalidades existentes sin confirmación
- Priorizar documentación, automatización e infraestructura


https://linear.app/docs/linear-agent https://linear.app/docs/agents-in-linear https://linear.app/docs/assigning-issues https://linear.app/docs/triage-intelligence https://linear.app/docs/code-intelligence https://linear.app/docs/coding-sessions https://linear.app/docs/mcp https://linear.app/docs/integration-directory https://linear.app/docs/third-party-application-approvals https://linear.app/docs/api-and-webhooks https://linear.app/docs/import-issues https://linear.app/docs/exporting-data https://linear.app/docs/mcp#claude
28 minutes ago

The app is failing to connect to PostgreSQL at localhost — it's not picking up the DATABASE_URL secret. Let me check the database configuration and restart the server.

The app is back up and running. What would you like to work on?

https://linear.app/clientumlatam/issue/CLI-3/import-your-data https://linear.app/docs/workspaces https://linear.app/clientumlatam/settings/ai https://linear.app/docs/teams https://linear.app/integrations/agents https://linear.app/clientumlatam/settings/integrations/github https://linear.app/clientumlatam/settings/integrations/slack https://linear.app/switch/migration-guide https://linear.app/integrations/agents https://linear.app/developers/agents https://linear.app/integrations https://linear.app/integrations/github https://linear.app/clientumlatam/settings/ai https://linear.app/integrations/replit
27 minutes ago

The Linear integration exists as a Replit connector — it handles OAuth securely so no API keys are needed. I'll connect it now so the app can query issues, projects, and cycles directly via Linear's GraphQL API.
Linear
Proposed integration Linear
Connect Linear
LinearLinear
Not connected
Cancelled by the agent.

https://v0.app/settings/mcp-connections https://linear.app/integrations/v0 https://v0.app/clientumlatam-4461s-projects/settings/mcp-connections https://v0.app/clientumlatam-4461s-projects/settings/mcp-connections https://linear.app/integrations/github https://linear.app/clientumlatam/settings/integrations/github https://linear.app/clientumlatam/settings/account/connections#connection-github https://linear.app/clientumlatam/settings/integrations/github https://linear.app/download https://linear.app/clientumlatam/team/CLI/active https://mcp.linear.app/authorize?client_id=rZhglERActdQFTAG&response_type=code&redirect_uri=https%3A%2F%2Fcallback.mistral.ai%2Fv1%2Fintegrations_auth%2Foauth2_callback&state=4ec01187-c131-48a7-9389-ffc9541a819f&code_challenge=_NMr-WmoQ849tJZs4LcJvMuwujg6eMxU9OE7LPJOkvU&code_challenge_method=S256&resource=https%3A%2F%2Fmcp.linear.app%2F&prompt=consent https://github.com/settings/installations/146197720
27 minutes ago
Exploring integrations
What would you like to build or connect?
What do you want to do?
Something else
Additional comments
docs/PLAN_IMPLEMENTACION.md
Anything else to add?
referencia-tecnica/4-agentes/fichas

https://chat.mistral.ai/chat/8cd3b491-c35c-4e07-a1c8-0287ea77864c https://mistral.ai/news/workflows/ https://docs.mistral.ai/studio-api/conversations/function-calling https://console.mistral.ai/build/connectors/019f6143-c93e-774a-b712-e1c5ba6d8b5c?connector=019f6143-c93e-774a-b712-e1c5ba6d8b5c&integration_id=019f6143-c93e-774a-b712-e1c5ba6d8b5c&success=true
24 minutes ago
Exploring Mistral AI integration
What would you like me to build with Mistral?Declined.
Ignoring irrelevant input

No problem — just let me know what you'd like to work on when you're ready.

Entendido — el plan es claro. Arrancamos por Fase 1: schema de DB + motor de agentes. Déjame revisar las fichas restantes y el estado actual del codebase en paralelo.

Mucho ya está construido. Déjame ver exactamente qué hay en los archivos de agentes y las rutas API existentes antes de duplicar trabajo.

La Fase 1 ya está mayormente construida. Déjame ver exactamente qué hay en los agentes y el estado completo de las rutas para saber qué falta.

Déjame mapear exactamente qué rutas ya existen vs. qué falta, y qué UI ya tiene conexión real vs. mock.

Déjame ver los componentes UI que el plan menciona conectar a datos reales.

El panorama está claro. Fase 1 está completa. Fase 2 empieza con conectar los componentes mock a los runners reales. Voy con los tres más críticos en paralelo:

    WpProspector → /api/agent/run/prospect (ya existe el runner)
    MeddicCalificacion → leads_enriched table (necesita endpoint GET)
    IcpBuilder → nuevo agente Estratega + endpoint

Primero leo los tres componentes mock en paralelo:

Voy a verificar qué endpoints ya existen para companies y leads antes de agregar nada nuevo.

Todos los endpoints ya existen. Ahora conecto los tres componentes a datos reales en paralelo.

Tengo todo lo que necesito. Implemento los tres componentes y el endpoint PATCH que falta, todo en paralelo.

Agrego el endpoint PATCH faltante y reescribo los tres componentes en paralelo.

Los errores de TypeScript son preexistentes (archivos de referencia y agentes anteriores, no mis cambios). La app levantó limpia. Resumen de lo que se conectó:

WpProspector — ahora llama a /api/agent/run/prospect real (Google Maps + Apify), carga empresas de Neon con paginación, y actualiza el status via PATCH /api/companies/:id. Los stats reflejan datos reales de la DB.

MeddicCalificacion — carga leads desde /api/leads-enriched (con join a companies), mapea scores MEDDIC desde enrichment_data JSON, y persiste cambios vía el nuevo PATCH /api/leads-enriched/:id que agregué al servidor.

IcpBuilder — llama a Gemini real via /api/agent/ai/gemini con un system prompt del Agente Estratega, parsea JSON estructurado (señales, objeciones, propuesta de valor), guarda en /api/icp-profiles, y carga el historial de perfiles anteriores al abrir.

El único prerequisito para ver datos reales en MEDDIC es tener leads enriquecidos en la DB — eso se produce corriendo el Prospector (busca empresas) → luego el Enriquecedor (Hunter.io saca contactos). Ese pipeline ya tiene backend completo; la Fase 3 (Propuestas + Campañas) es el siguiente bloque.

queremos incluir cada una de estas patanlllas, pero de modo claro , en el dashboard de usuarios clientum
3 minutes ago
Displaying org chart views

Las 4 pantallas ya están en el código. El nav group "Organigrama" ya quedó agregado en el edit anterior. Verifico que se ve bien:

El CRM requiere login para verse — el nav group de Organigrama quedó correctamente agregado. Verifico el estado final de la sección de navegación:

Listo. En el sidebar del dashboard ahora aparece el grupo "Organigrama" con las 5 pantallas accesibles directamente:
Tab	Pantalla
Organigrama General	Árbol jerárquico completo Estructura Organizacional + Agentes IA
Roster de Agentes	Grid 16/16 con búsqueda, filtros por dept/tipo/estado
Swimlanes por Dept.	Organigrama por Ownership, columnas Técnico / Ventas / Marketing / CS / Ops
Pipeline Flow	Del Lead al Cliente — 7 etapas con agente responsable de cada una
Hub Radial	Vista radial centrada en CEO

Cada una ocupa pantalla completa (sin padding extra) al seleccionarla. El componente de cada vista ya existía — solo faltaba conectarlos a la navegación.

AgentMail es el único disponible como conector OAuth directo. Los otros tres (Retell AI, AgentPhone, BlandAI) son connector_catalog — requieren setup manual a través de sus plataformas propias, no tienen OAuth de Replit todavía.

Propongo AgentMail primero (el más crítico para las campañas de email):
AgentMail
Proposed integration AgentMail
Connect AgentMail
AgentMailAgentMail
Not connected
Cancelled by the agent.

You've reached your daily free quota limit. It will reset at 12:00 AM UTC.