# Arquitectura — Clientum CRM

# Clientum CRM — Arquitectura Técnica

> Documento de referencia para el equipo de ingeniería.  
> Última actualización: julio 2026.

---

## 1. Visión general

Clientum es un CRM B2B con IA orientado a pymes de la Patagonia. Permite descubrir prospectos, calificarlos con MEDDIC, generar brochures en PDF, y automatizar el outreach vía WhatsApp a través del agente SDR "Santi".

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENTES / USUARIOS                           │
│   Browser (React SPA)  ──────  WordPress Plugin (class-crm-proxy)    │
└────────────┬───────────────────────────────┬─────────────────────────┘
             │ HTTPS                         │ HTTPS (X-CRM-Token)
             ▼                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    EXPRESS API  (server.ts)                         │
│                                                                     │
│  /api/auth/*          → login · register · logout · me             │
│  /api/generate        → Gemini AI (brochures, ICP, prospectos…)    │
│  /api/scrape-places   → Google Places API / Apify / Gemini Search  │
│  /api/enrich-contact  → Hunter.io domain search                    │
│  /api/chatbot-leads   → leads capturados desde asesor IA           │
│  /api/webhooks/…      → inbound webhook WordPress plugin           │
│  /api/leads           → SDR Santi: CRUD leads + brochures + notas  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Neon PostgreSQL    │
              │  (pooled connection) │
              │                     │
              │  users              │
              │  session            │
              │  chatbot_leads      │
              │  santi_leads        │
              │  santi_brochures    │
              │  santi_notes        │
              └──────────────────────┘
```

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22.x |
| Frontend | React + TypeScript | 19 / 5.8 |
| Build frontend | Vite + @tailwindcss/vite | 6.x / 4.x |
| CSS | Tailwind CSS v4 | 4.x |
| Componentes UI | Radix UI (Dialog, Select) | — |
| Gráficos | Recharts | 3.x |
| Animaciones | Framer Motion (motion) | 12.x |
| Backend | Express | 4.x |
| Sesiones | express-session + connect-pg-simple | — |
| Auth | bcryptjs (12 rondas) | 3.x |
| ORM | Raw `pg` Pool | 8.x |
| Base de datos | Neon PostgreSQL (serverless) | Postgres 16 |
| IA | Google Gemini via `@google/genai` | 2.x |
| PDF | jsPDF + html2canvas-pro | — |
| Scraping | Apify (3 actores con fallback) | — |
| Enriquecimiento | Hunter.io domain-search API | v2 |
| Gestión de paquetes | pnpm | — |

---

## 3. Estructura de directorios

```
/
├── server.ts                 # Entrypoint Express (dev + Cloud Run)
├── api/
│   ├── index.ts              # Entrypoint Vercel serverless
│   └── tsconfig.json         # moduleResolution: node16 (requerido por Vercel)
├── src/                      # React frontend
│   ├── App.tsx               # Root: routing condicional SPA
│   ├── main.tsx              # Punto de entrada Vite
│   ├── data.ts               # Datos estáticos + presets por industria (~50KB)
│   ├── types.ts              # Tipos globales TypeScript
│   ├── components/
│   │   ├── AuthGate.tsx      # Login/Register modal
│   │   ├── PublicWebsite.tsx # Landing page pública
│   │   ├── SalesProspectorDashboard.tsx  # Dashboard prospección
│   │   ├── BrochurePreview.tsx           # Preview + export PDF
│   │   ├── ChatbotSim.tsx               # Asesor comercial IA
│   │   ├── AsistenteIA.tsx              # Asistente de consultas
│   │   ├── InteractiveAIChat.tsx
│   │   ├── InteractiveCRMKanban.tsx
│   │   ├── SalesAssistantChat.tsx
│   │   ├── SidebarCRM.tsx
│   │   ├── SidebarEditor.tsx
│   │   ├── crm-full/         # CRM completo (Pipeline, Leads, Dashboard…)
│   │   ├── sidebar-tabs/
│   │   └── ui/               # Primitivos UI (button, card, badge…)
│   ├── data/
│   │   ├── servicios-catalogo.json   # 425 servicios curados (deriva de nzip2)
│   │   ├── categorias-servicios.json
│   │   └── cursos-lms.json
│   ├── lib/utils.ts          # cn() helper (tailwind-merge + clsx)
│   ├── services/
│   │   └── scraperService.ts # Cliente HTTP → /api/scrape-places
│   ├── store/
│   │   └── sharedStore.ts    # Estado compartido (localStorage-backed)
│   └── utils/
│       └── pdfGenerator.ts   # Export PDF vía jsPDF + html2canvas-pro
├── public/                   # Assets estáticos (logos, imágenes clientes)
├── docs/                     # Documentación técnica (no es parte del app)
│   ├── ARCHITECTURE.md       # ← este archivo
│   ├── SANTI-SDR.md          # Integración agente SDR Santi/Hermes
│   └── …
├── scripts/
│   └── generate_catalog.py   # Genera CSV WooCommerce desde servicios-catalogo.json
├── .github/workflows/
│   ├── ci.yml                # TypeScript lint + Vite build en cada PR
│   └── neon_workflow.yml     # Crea/elimina branch Neon por PR
├── vercel.json               # Configuración deployment Vercel
├── vite.config.ts
├── tsconfig.json             # Config Vite/frontend (moduleResolution: bundler)
├── api/tsconfig.json         # Config backend Vercel (moduleResolution: node16)
├── package.json
├── .env.example              # Referencia completa de variables de entorno
└── replit.md                 # Descripción del proyecto + preferencias
```

---

## 4. Diagrama de base de datos

```sql
-- Autenticación y sesiones
users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(32) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- bcryptjs, 12 rondas
  role          VARCHAR(20) DEFAULT 'user',  -- 'admin' | 'user'
  created_at    TIMESTAMP DEFAULT NOW()
)

session (                               -- gestionada por connect-pg-simple
  sid    VARCHAR PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMP NOT NULL
)

-- Leads capturados por el Asesor Comercial IA (ChatbotSim)
chatbot_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  phone        VARCHAR(40),
  email        VARCHAR(200),
  company      TEXT,
  notes        TEXT,
  conversation TEXT,                    -- JSON de la conversación completa
  status       VARCHAR(20) DEFAULT 'nuevo',  -- nuevo|contactado|calificado|descartado
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
)

-- Leads prospectados por el Explorador Patagónico / Santi SDR
santi_leads (
  id            UUID PRIMARY KEY,
  company_name  TEXT NOT NULL,
  industry      VARCHAR(120),
  city          VARCHAR(120),
  address       TEXT,
  contact_name  TEXT,
  contact_phone VARCHAR(30),
  contact_role  VARCHAR(120),
  pain_point    TEXT,
  fit_score     INTEGER,
  amount_ars    INTEGER DEFAULT 180000,
  meddic_score  INTEGER,
  guiacores_url TEXT,
  status        VARCHAR(20) DEFAULT 'pendiente',
  source        VARCHAR(60) DEFAULT 'patagonia_explorer',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
)

santi_brochures (
  id         UUID PRIMARY KEY,
  lead_id    UUID REFERENCES santi_leads(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,            -- HTML del brochure
  hook       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

santi_notes (
  id         UUID PRIMARY KEY,
  lead_id    UUID REFERENCES santi_leads(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  author     VARCHAR(60) DEFAULT 'santi',
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Inicialización de tablas
Las tablas se crean automáticamente en el arranque del servidor (`CREATE TABLE IF NOT EXISTS`), implementado en `initUsersTable()`, `initChatbotLeadsTable()` e `initSantiTables()`. No hay sistema de migraciones; los cambios de schema deben aplicarse manualmente o con un ALTER TABLE.

---

## 5. Endpoints API

### Autenticación (sin clave — cookie de sesión)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registra usuario; el primero se vuelve admin |
| POST | `/api/auth/login` | — | Inicia sesión; devuelve `{ user }` |
| POST | `/api/auth/logout` | — | Destruye la sesión |
| GET | `/api/auth/me` | sesión | Devuelve el usuario actual (re-verifica rol en DB) |

### IA y prospección (sesión de usuario requerida)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/generate` | sesión | Multi-acción Gemini: brochures, ICP, traducción, prospectos, MEDDIC |
| POST | `/api/scrape-places` | sesión | Prospección de Google Maps (Places API → Apify → Gemini fallback) |
| POST | `/api/enrich-contact` | sesión | Hunter.io domain-search: devuelve emails + cargos |

### Chatbot leads (sesión de usuario)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/chatbot-leads` | sesión | Guarda lead capturado por el asesor IA |
| GET | `/api/chatbot-leads` | sesión | Lista todos los chatbot leads |
| PATCH | `/api/chatbot-leads/:id` | sesión | Actualiza status del lead |

### Webhook WordPress (X-CRM-Token)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/webhooks/chatbot-lead` | CRM_INTERNAL_TOKEN | Plugin WP → lead a chatbot_leads |

### Santi SDR (X-Api-Key = SANTI_API_KEY)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/leads` | API key | Crea un lead en santi_leads |
| GET | `/api/leads` | API key | Lista santi_leads |
| POST | `/api/leads/:id/brochure` | API key | Genera y guarda brochure para el lead |
| GET | `/api/leads/:id/brochure` | API key | Obtiene el último brochure del lead |
| PATCH | `/api/leads/:id` | API key | Actualiza status / datos del lead |
| POST | `/api/leads/:id/notes` | API key | Agrega nota al lead |

---

## 6. Conexión a base de datos

El servidor resuelve la URL de conexión en este orden de prioridad:

```
1. NEON_API_KEY + NEON_PROJECT_ID presentes
   → llama a la API de Neon y obtiene la pooled connection string del branch default
   → ventaja: nunca stale, rota automáticamente si Neon regenera la password

2. DATABASE_URL presente
   → usa directamente esa cadena de conexión
   → útil para desarrollo local o entornos sin acceso a la API de Neon

3. Ninguno de los dos → DATABASE_URL es string vacío → pgPool falla en la primera query
```

Siempre se usa SSL en producción (`rejectUnauthorized: false` para Neon's self-signed certs). Se desactiva SSL solo si la URL contiene `sslmode=disable`.

---

## 7. Flujo de desarrollo

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESARROLLO LOCAL / REPLIT                                              │
│                                                                         │
│  npm run dev                                                            │
│    → tsx server.ts                                                      │
│    → Express arranca en :5000                                           │
│    → Vite middleware embebido (HMR en dev, desactivado si DISABLE_HMR) │
│    → Neon Postgres vía NEON_API_KEY + NEON_PROJECT_ID                  │
└─────────────────────────────────────────────────────────────────────────┘
             │  git push / Pull Request
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS                                                         │
│                                                                         │
│  ci.yml — en todo push/PR:                                             │
│    1. tsc --noEmit (typecheck)                                          │
│    2. vite build (verifica que el frontend compila)                     │
│                                                                         │
│  neon_workflow.yml — en PRs:                                           │
│    • PR opened/reopened/sync → crea branch Neon "preview/pr-N-branch"  │
│    • PR closed               → elimina branch Neon                     │
└─────────────────────────────────────────────────────────────────────────┘
             │  PR mergeado a main
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  VERCEL (producción — clientum.com.ar)                                  │
│                                                                         │
│  Trigger: push a main via GitHub integration (auto)                    │
│                                                                         │
│  Build:                                                                 │
│    pnpm install --frozen-lockfile                                       │
│    vite build           → dist/ (SPA estático)                         │
│                                                                         │
│  Runtime (serverless):                                                  │
│    api/index.ts         → Vercel Function (Node.js 22)                 │
│    • importa server.ts → registra todas las rutas Express              │
│    • corre initUsersTable + initChatbotLeadsTable + initSantiTables    │
│    • exporta app como default handler                                   │
│                                                                         │
│  Routing (vercel.json):                                                 │
│    /api/*  → api/index.ts (serverless)                                 │
│    /*      → dist/index.html (SPA)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Variables de entorno — referencia completa

Ver `.env.example` para descripción y cómo obtener cada valor.

| Variable | Requerida | Usada en | Descripción |
|----------|-----------|----------|-------------|
| `SESSION_SECRET` | ✅ | server.ts:81 | Firma cookies de sesión |
| `GEMINI_API_KEY` | ✅ | server.ts:291 | Google Gemini AI |
| `DATABASE_URL` | ✅ (fallback) | server.ts:56 | Cadena de conexión PostgreSQL |
| `NEON_API_KEY` | ✅ (preferido) | server.ts:38 | Resolución dinámica de DB URL |
| `NEON_PROJECT_ID` | ✅ (preferido) | server.ts:39 | ID proyecto Neon |
| `CRM_INTERNAL_TOKEN` | ✅ | server.ts:141 | Webhook WordPress → CRM |
| `SANTI_API_KEY` | opcional | server.ts:128 | Autenticación SDR Santi |
| `APIFY_API_TOKEN` | opcional | server.ts:1095 | Scraping Google Maps |
| `GOOGLE_MAPS_PLATFORM_KEY` | opcional | server.ts:1672, vite.config.ts:10 | Places API (New) |
| `GOOGLE_MAPS_API_KEY` | opcional | server.ts:1672 | Alias legacy de la anterior |
| `HUNTER_API_KEY` | opcional | server.ts:1275 | Hunter.io contact enrichment |
| `APP_URL` | opcional | — | URL pública del app |
| `PORT` | auto | server.ts:28 | Puerto TCP (default: 5000) |
| `NODE_ENV` | auto | server.ts:86, 2488 | "production" en Vercel/Cloud Run |
| `VERCEL` | auto | server.ts:2556 | Seteada por Vercel; desactiva app.listen() |
| `DISABLE_HMR` | auto | vite.config.ts:18 | Seteada por Replit cuando es necesario |

---

## 9. Notas de despliegue importante

### Vercel — por qué tiene su propio tsconfig
`tsconfig.json` raíz usa `moduleResolution: "bundler"` (requerido por Vite). Las funciones serverless de Vercel usan `tsc` estándar que no soporta ese valor. Por eso `api/tsconfig.json` extiende el raíz y sobreescribe con `moduleResolution: "node16"` e incluye solo `index.ts` + `server.ts`.

### Vercel — cookies y CDN
El middleware de `Cache-Control: no-store` en todas las respuestas API es **crítico**. Sin él, el edge CDN de Vercel cachea las respuestas API y el header `Set-Cookie` nunca llega al browser, rompiendo silenciosamente el login en producción.

### Neon — branching por PR
El workflow `neon_workflow.yml` crea un branch de DB por cada PR (expira en 14 días). Esto permite tests de integración aislados. Los branches se eliminan automáticamente al cerrar el PR.

### Cloud Run (Replit Deploy)
`.replit` configura `deploymentTarget = "cloudrun"`. El build es `npm run build` y el entrypoint es `npm run start` (`NODE_ENV=production node dist/server.mjs`). En este modo, Express sirve el frontend estático desde `dist/` y también atiende la API — a diferencia de Vercel donde son rutas separadas.

---

## 10. Seguridad

- **Contraseñas**: hash bcryptjs con 12 rondas de salt
- **Sesiones**: cookies `httpOnly`, `secure` en producción, `sameSite: "lax"`, TTL 7 días
- **Enumeración de usuarios**: la comparación de hash siempre corre (hash inválido falso) para evitar timing attacks
- **Roles**: el rol se re-verifica contra la DB en cada request protegido (no se confía en el valor de la sesión)
- **API keys**: comparación de string constante en middleware; falla 401 si la variable de entorno no está seteada
- **CRM_INTERNAL_TOKEN**: falla 503 (no 401) si la variable no está configurada — señal explícita de misconfiguration
- **Secrets**: nunca en código; gestionados en Replit Secrets panel + Vercel Environment Variables

---

# Clientum CRM — Arquitectura Técnica

> Documento de referencia para el equipo de ingeniería.  
> Última actualización: julio 2026.

---

## 1. Visión general

Clientum es un CRM B2B con IA orientado a pymes de la Patagonia. Permite descubrir prospectos, calificarlos con MEDDIC, generar brochures en PDF, y automatizar el outreach vía WhatsApp a través del agente SDR "Santi".

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENTES / USUARIOS                           │
│   Browser (React SPA)  ──────  WordPress Plugin (class-crm-proxy)    │
└────────────┬───────────────────────────────┬─────────────────────────┘
             │ HTTPS                         │ HTTPS (X-CRM-Token)
             ▼                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    EXPRESS API  (server.ts)                         │
│                                                                     │
│  /api/auth/*          → login · register · logout · me             │
│  /api/generate        → Gemini AI (brochures, ICP, prospectos…)    │
│  /api/scrape-places   → Google Places API / Apify / Gemini Search  │
│  /api/enrich-contact  → Hunter.io domain search                    │
│  /api/chatbot-leads   → leads capturados desde asesor IA           │
│  /api/webhooks/…      → inbound webhook WordPress plugin           │
│  /api/leads           → SDR Santi: CRUD leads + brochures + notas  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Neon PostgreSQL    │
              │  (pooled connection) │
              │                     │
              │  users              │
              │  session            │
              │  chatbot_leads      │
              │  santi_leads        │
              │  santi_brochures    │
              │  santi_notes        │
              └──────────────────────┘
```

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22.x |
| Frontend | React + TypeScript | 19 / 5.8 |
| Build frontend | Vite + @tailwindcss/vite | 6.x / 4.x |
| CSS | Tailwind CSS v4 | 4.x |
| Componentes UI | Radix UI (Dialog, Select) | — |
| Gráficos | Recharts | 3.x |
| Animaciones | Framer Motion (motion) | 12.x |
| Backend | Express | 4.x |
| Sesiones | express-session + connect-pg-simple | — |
| Auth | bcryptjs (12 rondas) | 3.x |
| ORM | Raw `pg` Pool | 8.x |
| Base de datos | Neon PostgreSQL (serverless) | Postgres 16 |
| IA | Google Gemini via `@google/genai` | 2.x |
| PDF | jsPDF + html2canvas-pro | — |
| Scraping | Apify (3 actores con fallback) | — |
| Enriquecimiento | Hunter.io domain-search API | v2 |
| Gestión de paquetes | pnpm | — |

---

## 3. Estructura de directorios

```
/
├── server.ts                 # Entrypoint Express (dev + Cloud Run)
├── api/
│   ├── index.ts              # Entrypoint Vercel serverless
│   └── tsconfig.json         # moduleResolution: node16 (requerido por Vercel)
├── src/                      # React frontend
│   ├── App.tsx               # Root: routing condicional SPA
│   ├── main.tsx              # Punto de entrada Vite
│   ├── data.ts               # Datos estáticos + presets por industria (~50KB)
│   ├── types.ts              # Tipos globales TypeScript
│   ├── components/
│   │   ├── AuthGate.tsx      # Login/Register modal
│   │   ├── PublicWebsite.tsx # Landing page pública
│   │   ├── SalesProspectorDashboard.tsx  # Dashboard prospección
│   │   ├── BrochurePreview.tsx           # Preview + export PDF
│   │   ├── ChatbotSim.tsx               # Asesor comercial IA
│   │   ├── AsistenteIA.tsx              # Asistente de consultas
│   │   ├── InteractiveAIChat.tsx
│   │   ├── InteractiveCRMKanban.tsx
│   │   ├── SalesAssistantChat.tsx
│   │   ├── SidebarCRM.tsx
│   │   ├── SidebarEditor.tsx
│   │   ├── crm-full/         # CRM completo (Pipeline, Leads, Dashboard…)
│   │   ├── sidebar-tabs/
│   │   └── ui/               # Primitivos UI (button, card, badge…)
│   ├── data/
│   │   ├── servicios-catalogo.json   # 425 servicios curados (deriva de nzip2)
│   │   ├── categorias-servicios.json
│   │   └── cursos-lms.json
│   ├── lib/utils.ts          # cn() helper (tailwind-merge + clsx)
│   ├── services/
│   │   └── scraperService.ts # Cliente HTTP → /api/scrape-places
│   ├── store/
│   │   └── sharedStore.ts    # Estado compartido (localStorage-backed)
│   └── utils/
│       └── pdfGenerator.ts   # Export PDF vía jsPDF + html2canvas-pro
├── public/                   # Assets estáticos (logos, imágenes clientes)
├── docs/                     # Documentación técnica (no es parte del app)
│   ├── ARCHITECTURE.md       # ← este archivo
│   ├── SANTI-SDR.md          # Integración agente SDR Santi/Hermes
│   └── …
├── scripts/
│   └── generate_catalog.py   # Genera CSV WooCommerce desde servicios-catalogo.json
├── .github/workflows/
│   ├── ci.yml                # TypeScript lint + Vite build en cada PR
│   └── neon_workflow.yml     # Crea/elimina branch Neon por PR
├── vercel.json               # Configuración deployment Vercel
├── vite.config.ts
├── tsconfig.json             # Config Vite/frontend (moduleResolution: bundler)
├── api/tsconfig.json         # Config backend Vercel (moduleResolution: node16)
├── package.json
├── .env.example              # Referencia completa de variables de entorno
└── replit.md                 # Descripción del proyecto + preferencias
```

---

## 4. Diagrama de base de datos

```sql
-- Autenticación y sesiones
users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(32) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- bcryptjs, 12 rondas
  role          VARCHAR(20) DEFAULT 'user',  -- 'admin' | 'user'
  created_at    TIMESTAMP DEFAULT NOW()
)

session (                               -- gestionada por connect-pg-simple
  sid    VARCHAR PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMP NOT NULL
)

-- Leads capturados por el Asesor Comercial IA (ChatbotSim)
chatbot_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  phone        VARCHAR(40),
  email        VARCHAR(200),
  company      TEXT,
  notes        TEXT,
  conversation TEXT,                    -- JSON de la conversación completa
  status       VARCHAR(20) DEFAULT 'nuevo',  -- nuevo|contactado|calificado|descartado
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
)

-- Leads prospectados por el Explorador Patagónico / Santi SDR
santi_leads (
  id            UUID PRIMARY KEY,
  company_name  TEXT NOT NULL,
  industry      VARCHAR(120),
  city          VARCHAR(120),
  address       TEXT,
  contact_name  TEXT,
  contact_phone VARCHAR(30),
  contact_role  VARCHAR(120),
  pain_point    TEXT,
  fit_score     INTEGER,
  amount_ars    INTEGER DEFAULT 180000,
  meddic_score  INTEGER,
  guiacores_url TEXT,
  status        VARCHAR(20) DEFAULT 'pendiente',
  source        VARCHAR(60) DEFAULT 'patagonia_explorer',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
)

santi_brochures (
  id         UUID PRIMARY KEY,
  lead_id    UUID REFERENCES santi_leads(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,            -- HTML del brochure
  hook       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

santi_notes (
  id         UUID PRIMARY KEY,
  lead_id    UUID REFERENCES santi_leads(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  author     VARCHAR(60) DEFAULT 'santi',
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Inicialización de tablas
Las tablas se crean automáticamente en el arranque del servidor (`CREATE TABLE IF NOT EXISTS`), implementado en `initUsersTable()`, `initChatbotLeadsTable()` e `initSantiTables()`. No hay sistema de migraciones; los cambios de schema deben aplicarse manualmente o con un ALTER TABLE.

---

## 5. Endpoints API

### Autenticación (sin clave — cookie de sesión)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registra usuario; el primero se vuelve admin |
| POST | `/api/auth/login` | — | Inicia sesión; devuelve `{ user }` |
| POST | `/api/auth/logout` | — | Destruye la sesión |
| GET | `/api/auth/me` | sesión | Devuelve el usuario actual (re-verifica rol en DB) |

### IA y prospección (sesión de usuario requerida)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/generate` | sesión | Multi-acción Gemini: brochures, ICP, traducción, prospectos, MEDDIC |
| POST | `/api/scrape-places` | sesión | Prospección de Google Maps (Places API → Apify → Gemini fallback) |
| POST | `/api/enrich-contact` | sesión | Hunter.io domain-search: devuelve emails + cargos |

### Chatbot leads (sesión de usuario)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/chatbot-leads` | sesión | Guarda lead capturado por el asesor IA |
| GET | `/api/chatbot-leads` | sesión | Lista todos los chatbot leads |
| PATCH | `/api/chatbot-leads/:id` | sesión | Actualiza status del lead |

### Webhook WordPress (X-CRM-Token)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/webhooks/chatbot-lead` | CRM_INTERNAL_TOKEN | Plugin WP → lead a chatbot_leads |

### Santi SDR (X-Api-Key = SANTI_API_KEY)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/leads` | API key | Crea un lead en santi_leads |
| GET | `/api/leads` | API key | Lista santi_leads |
| POST | `/api/leads/:id/brochure` | API key | Genera y guarda brochure para el lead |
| GET | `/api/leads/:id/brochure` | API key | Obtiene el último brochure del lead |
| PATCH | `/api/leads/:id` | API key | Actualiza status / datos del lead |
| POST | `/api/leads/:id/notes` | API key | Agrega nota al lead |

---

## 6. Conexión a base de datos

El servidor resuelve la URL de conexión en este orden de prioridad:

```
1. NEON_API_KEY + NEON_PROJECT_ID presentes
   → llama a la API de Neon y obtiene la pooled connection string del branch default
   → ventaja: nunca stale, rota automáticamente si Neon regenera la password

2. DATABASE_URL presente
   → usa directamente esa cadena de conexión
   → útil para desarrollo local o entornos sin acceso a la API de Neon

3. Ninguno de los dos → DATABASE_URL es string vacío → pgPool falla en la primera query
```

Siempre se usa SSL en producción (`rejectUnauthorized: false` para Neon's self-signed certs). Se desactiva SSL solo si la URL contiene `sslmode=disable`.

---

## 7. Flujo de desarrollo

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESARROLLO LOCAL / REPLIT                                              │
│                                                                         │
│  npm run dev                                                            │
│    → tsx server.ts                                                      │
│    → Express arranca en :5000                                           │
│    → Vite middleware embebido (HMR en dev, desactivado si DISABLE_HMR) │
│    → Neon Postgres vía NEON_API_KEY + NEON_PROJECT_ID                  │
└─────────────────────────────────────────────────────────────────────────┘
             │  git push / Pull Request
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS                                                         │
│                                                                         │
│  ci.yml — en todo push/PR:                                             │
│    1. tsc --noEmit (typecheck)                                          │
│    2. vite build (verifica que el frontend compila)                     │
│                                                                         │
│  neon_workflow.yml — en PRs:                                           │
│    • PR opened/reopened/sync → crea branch Neon "preview/pr-N-branch"  │
│    • PR closed               → elimina branch Neon                     │
└─────────────────────────────────────────────────────────────────────────┘
             │  PR mergeado a main
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  VERCEL (producción — clientum.com.ar)                                  │
│                                                                         │
│  Trigger: push a main via GitHub integration (auto)                    │
│                                                                         │
│  Build:                                                                 │
│    pnpm install --frozen-lockfile                                       │
│    vite build           → dist/ (SPA estático)                         │
│                                                                         │
│  Runtime (serverless):                                                  │
│    api/index.ts         → Vercel Function (Node.js 22)                 │
│    • importa server.ts → registra todas las rutas Express              │
│    • corre initUsersTable + initChatbotLeadsTable + initSantiTables    │
│    • exporta app como default handler                                   │
│                                                                         │
│  Routing (vercel.json):                                                 │
│    /api/*  → api/index.ts (serverless)                                 │
│    /*      → dist/index.html (SPA)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Variables de entorno — referencia completa

Ver `.env.example` para descripción y cómo obtener cada valor.

| Variable | Requerida | Usada en | Descripción |
|----------|-----------|----------|-------------|
| `SESSION_SECRET` | ✅ | server.ts:81 | Firma cookies de sesión |
| `GEMINI_API_KEY` | ✅ | server.ts:291 | Google Gemini AI |
| `DATABASE_URL` | ✅ (fallback) | server.ts:56 | Cadena de conexión PostgreSQL |
| `NEON_API_KEY` | ✅ (preferido) | server.ts:38 | Resolución dinámica de DB URL |
| `NEON_PROJECT_ID` | ✅ (preferido) | server.ts:39 | ID proyecto Neon |
| `CRM_INTERNAL_TOKEN` | ✅ | server.ts:141 | Webhook WordPress → CRM |
| `SANTI_API_KEY` | opcional | server.ts:128 | Autenticación SDR Santi |
| `APIFY_API_TOKEN` | opcional | server.ts:1095 | Scraping Google Maps |
| `GOOGLE_MAPS_PLATFORM_KEY` | opcional | server.ts:1672, vite.config.ts:10 | Places API (New) |
| `GOOGLE_MAPS_API_KEY` | opcional | server.ts:1672 | Alias legacy de la anterior |
| `HUNTER_API_KEY` | opcional | server.ts:1275 | Hunter.io contact enrichment |
| `APP_URL` | opcional | — | URL pública del app |
| `PORT` | auto | server.ts:28 | Puerto TCP (default: 5000) |
| `NODE_ENV` | auto | server.ts:86, 2488 | "production" en Vercel/Cloud Run |
| `VERCEL` | auto | server.ts:2556 | Seteada por Vercel; desactiva app.listen() |
| `DISABLE_HMR` | auto | vite.config.ts:18 | Seteada por Replit cuando es necesario |

---

## 9. Notas de despliegue importante

### Vercel — por qué tiene su propio tsconfig
`tsconfig.json` raíz usa `moduleResolution: "bundler"` (requerido por Vite). Las funciones serverless de Vercel usan `tsc` estándar que no soporta ese valor. Por eso `api/tsconfig.json` extiende el raíz y sobreescribe con `moduleResolution: "node16"` e incluye solo `index.ts` + `server.ts`.

### Vercel — cookies y CDN
El middleware de `Cache-Control: no-store` en todas las respuestas API es **crítico**. Sin él, el edge CDN de Vercel cachea las respuestas API y el header `Set-Cookie` nunca llega al browser, rompiendo silenciosamente el login en producción.

### Neon — branching por PR
El workflow `neon_workflow.yml` crea un branch de DB por cada PR (expira en 14 días). Esto permite tests de integración aislados. Los branches se eliminan automáticamente al cerrar el PR.

### Cloud Run (Replit Deploy)
`.replit` configura `deploymentTarget = "cloudrun"`. El build es `npm run build` y el entrypoint es `npm run start` (`NODE_ENV=production node dist/server.mjs`). En este modo, Express sirve el frontend estático desde `dist/` y también atiende la API — a diferencia de Vercel donde son rutas separadas.

---

## 10. Seguridad

- **Contraseñas**: hash bcryptjs con 12 rondas de salt
- **Sesiones**: cookies `httpOnly`, `secure` en producción, `sameSite: "lax"`, TTL 7 días
- **Enumeración de usuarios**: la comparación de hash siempre corre (hash inválido falso) para evitar timing attacks
- **Roles**: el rol se re-verifica contra la DB en cada request protegido (no se confía en el valor de la sesión)
- **API keys**: comparación de string constante en middleware; falla 401 si la variable de entorno no está seteada
- **CRM_INTERNAL_TOKEN**: falla 503 (no 401) si la variable no está configurada — señal explícita de misconfiguration
- **Secrets**: nunca en código; gestionados en Replit Secrets panel + Vercel Environment Variables

---

# Arquitectura Técnica e Integraciones — Clientum CRM
> Documento canónico de ingeniería · Julio 2026

---

## Visión general

Clientum es un CRM B2B con IA para pymes de la Patagonia: descubre prospectos, los califica con MEDDIC, genera brochures PDF personalizados por industria, y automatiza outreach vía WhatsApp con el agente SDR Santi.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTES / USUARIOS                             │
│   Browser (React 19 SPA)  ──────  WordPress Plugin (class-crm-proxy)    │
└────────────┬──────────────────────────────────┬─────────────────────────┘
             │ HTTPS                            │ HTTPS (X-CRM-Token)
             ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS API  (server.ts)                           │
│  /api/auth/*          → sesiones, Neon Auth, reset password             │
│  /api/generate        → Gemini AI (brochures, ICP, scoring…)            │
│  /api/scrape-places   → Google Places → Apify → Gemini Search           │
│  /api/enrich-contact  → Hunter.io domain search                         │
│  /api/scrape-employees-bulk → Apify bulk enrichment                     │
│  /api/chatbot-leads   → leads capturados por el asesor IA               │
│  /api/webhooks/chatbot-lead → webhook WordPress plugin                  │
│  /api/leads           → SDR Santi: CRUD + brochures + notas             │
│  /api/orchestrator    → chat IA con 5 agentes + métricas KPI            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             ▼
              ┌──────────────────────────┐
              │     Neon PostgreSQL      │
              │   (pooled · sa-east-1)   │
              │  users · session         │
              │  chatbot_leads           │
              │  santi_leads             │
              │  santi_brochures         │
              │  santi_notes             │
              └──────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22.x |
| Frontend | React + TypeScript | 19 / 5.8 |
| Build frontend | Vite + @tailwindcss/vite | 6.x / 4.x |
| Backend | Express | 4.x |
| Auth | bcryptjs (12 rondas) + express-session + Neon Auth SDK | 3.x |
| ORM | Raw `pg` Pool (sin Drizzle) | 8.x |
| Base de datos | Neon PostgreSQL serverless | Postgres 16 |
| Sesiones | connect-pg-simple → tabla `session` | — |
| IA | Google Gemini `@google/genai` → Groq → OpenRouter → fallback | 2.x |
| PDF | jsPDF + html2canvas-pro | — |
| Scraping | Apify (3 actores con fallback automático) | — |
| Enriquecimiento | Hunter.io domain-search API v2 | — |
| Email | Nodemailer (SMTP Gmail) | — |
| Animaciones | motion (Framer Motion) | 12.x |
| Gráficos | Recharts | 3.x |
| Gestión de paquetes | pnpm | — |

---

## Flujo dev → producción

```
REPLIT (dev, puerto 5000)
  npm run dev → tsx server.ts → Express + Vite HMR
  DB: Neon vía NEON_API_KEY + NEON_PROJECT_ID (resolve URL dinámica)
        │
        │ git push / Pull Request
        ▼
GITHUB ACTIONS
  ci.yml          → tsc --noEmit + vite build (bloquea PRs rotos)
  neon_workflow   → crea branch Neon "preview/pr-N" (expira 14 días)
        │
        │ PR mergeado a main
        ▼
VERCEL (clientum.com.ar) — auto-deploy
  Install: pnpm install --frozen-lockfile
  Build:   vite build → dist/
  Runtime: api/index.ts → Vercel Serverless Function (Node 22, maxDuration: 30s)
  Routing: /api/* → Function · /* → dist/index.html (SPA)
```

---

## Schema de base de datos

Las tablas se crean automáticamente al arrancar (`CREATE TABLE IF NOT EXISTS`). Sin sistema de migraciones — cambios de schema se aplican con `ALTER TABLE`.

### `users`
```sql
id            SERIAL PRIMARY KEY,
email         TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role          VARCHAR(20) DEFAULT 'user',   -- 'user' | 'admin'
created_at    TIMESTAMP DEFAULT NOW()
```

### `session` (connect-pg-simple)
```sql
sid    VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
sess   JSON NOT NULL,
expire TIMESTAMP(6) NOT NULL
```

### `chatbot_leads`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name       TEXT,
email      TEXT,
phone      TEXT,
company    TEXT,
message    TEXT,
source     VARCHAR(60),
status     VARCHAR(20) DEFAULT 'nuevo',  -- 'nuevo' | 'contactado' | 'calificado' | 'descartado'
created_at TIMESTAMP DEFAULT NOW()
```

### `santi_leads`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
company_name  TEXT NOT NULL,
industry      VARCHAR(120),
city          VARCHAR(120),
address       TEXT,
phone         VARCHAR(30),
contact_name  TEXT,
contact_phone VARCHAR(30),
contact_role  VARCHAR(120),
pain_point    TEXT,
fit_score     INTEGER,           -- 0–10
amount_ars    INTEGER DEFAULT 180000,
meddic_score  INTEGER,           -- 0–100
status        VARCHAR(20) DEFAULT 'pendiente',
              -- 'pendiente' | 'contactado' | 'caliente' | 'tibio' | 'frio' | 'agendado'
source        VARCHAR(60),
created_at    TIMESTAMP DEFAULT NOW(),
updated_at    TIMESTAMP DEFAULT NOW()
```

### `santi_brochures`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lead_id    UUID REFERENCES santi_leads(id),
content    TEXT,        -- HTML del brochure generado por IA
hook       TEXT,        -- gancho personalizado principal
created_at TIMESTAMP DEFAULT NOW()
```

### `santi_notes`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lead_id    UUID REFERENCES santi_leads(id),
summary    TEXT NOT NULL,
author     VARCHAR(60) DEFAULT 'santi',
created_at TIMESTAMP DEFAULT NOW()
```

---

## Endpoints API — referencia completa

### Autenticación — sesión Express (`/api/auth/*`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registra usuario; el primero es `admin` automáticamente |
| POST | `/api/auth/login` | — | Inicia sesión con email + password (bcrypt) |
| POST | `/api/auth/logout` | — | Destruye sesión |
| GET  | `/api/auth/me` | sesión | Usuario actual — re-verifica rol en DB en cada llamada |
| POST | `/api/auth/change-password` | sesión | Cambia contraseña del usuario autenticado |
| POST | `/api/auth/forgot-password` | — | Genera token y envía email de reset (SMTP) |
| POST | `/api/auth/reset-password` | — | Valida token y actualiza contraseña |

### Autenticación — Neon Auth SDK

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/neon-register` | — | Registro vía Neon Auth SDK (JWT) |
| POST | `/api/auth/neon-login` | — | Login vía Neon Auth SDK (JWT) |

### Configuración y scraping

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/config/has-google-maps` | — | Verifica si `GOOGLE_MAPS_PLATFORM_KEY` está configurada |
| POST | `/api/scrape-places` | sesión | Prospección: Google Places → Apify → Gemini fallback |
| POST | `/api/enrich-contact` | sesión | Hunter.io: enriquecimiento de email + cargo por dominio |
| POST | `/api/scrape-employees-bulk` | sesión | Apify: scraping masivo de empleados de múltiples empresas |

### IA y generación

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/generate` | — | Gemini multi-acción: brochures, ICP, MEDDIC scoring, copy, chatbot |

### Leads del Asesor Comercial IA

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST  | `/api/chatbot-leads` | sesión | Crea lead desde el chatbot inbound |
| GET   | `/api/chatbot-leads` | sesión | Lista leads del chatbot |
| PATCH | `/api/chatbot-leads/:id` | sesión | Actualiza estado/datos de un lead del chatbot |
| POST  | `/api/webhooks/chatbot-lead` | `X-CRM-Token` | Webhook WordPress plugin → inserta lead |

### Leads SDR Santi — auth por API key (`x-api-key: SANTI_API_KEY`)

| Método | Path | Descripción |
|--------|------|-------------|
| POST  | `/api/leads` | Crea nuevo lead |
| GET   | `/api/leads` | Lista leads (filtrable: `?status=pendiente&limit=20`) |
| PATCH | `/api/leads/:id` | Actualiza estado o campos del lead |
| POST  | `/api/leads/:id/brochure` | Genera brochure con Gemini y lo guarda |
| GET   | `/api/leads/:id/brochure` | Devuelve el brochure HTML del lead |
| POST  | `/api/leads/:id/notes` | Agrega nota/resumen de conversación al lead |

### Orquestador IA

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/orchestrator/metrics` | sesión | KPIs sin IA: leads por estado, pipeline, top leads, industrias |
| POST | `/api/orchestrator` | sesión | Chat con los 5 agentes (Gemini → Groq → OpenRouter); stream de respuesta |

---

## Middleware de autenticación

| Middleware | Descripción | Usado en |
|-----------|-------------|----------|
| `requireAuth` | Verifica `req.session.userId` | Rutas de sesión (scraping, chatbot-leads, orchestrator) |
| `requireApiKey` | Verifica header `x-api-key === SANTI_API_KEY` | `/api/leads/*` |
| `requireCrmToken` | Verifica header `X-CRM-Token === CRM_INTERNAL_TOKEN` | `/api/webhooks/chatbot-lead` |

---

## Estado de integraciones

| Servicio | Estado | Variable(s) |
|----------|--------|-------------|
| Neon PostgreSQL | ✅ activo | `NEON_DATABASE_URL` / `NEON_API_KEY` + `NEON_PROJECT_ID` |
| Google Gemini | ✅ activo (cascada V1 → V2) | `GEMINI_API_KEY`, `GEMINI_API_KEY_V2` |
| Groq | ✅ fallback LLM | `GROQ_API_KEY` |
| OpenRouter | ✅ fallback LLM terciario | `OPENROUTER_API_KEY` |
| Apify | ✅ activo | `APIFY_API_TOKEN` |
| Hunter.io | ✅ activo | `HUNTER_API_KEY` |
| Google Maps Places | ✅ activo | `GOOGLE_MAPS_PLATFORM_KEY` |
| Neon Auth SDK | ✅ configurado | `VITE_NEON_AUTH_URL`, `JWKS_URL` |
| SMTP Gmail | ✅ configurado | `SMTP_USER`, `SMTP_PASS` |
| WordPress Plugin | ✅ webhook activo | `CRM_INTERNAL_TOKEN` |
| WhatsApp Cloud API | 🔲 pendiente (usa Hermes/WA personal) | — |
| MercadoPago | 🔲 pendiente | — |
| AFIP Facturación | 🔲 pendiente | — |

---

## Cascada de IA

```
POST /api/generate  o  POST /api/orchestrator
        │
        ├─▶ Gemini (GEMINI_API_KEY → GEMINI_API_KEY_V2)   [prioridad 1]
        │       modelos: gemini-2.5-flash · gemini-2.0-flash · gemini-2.5-flash-lite
        │
        ├─▶ Groq (GROQ_API_KEY)                           [prioridad 2]
        │       modelo: llama-3.3-70b-versatile
        │
        ├─▶ OpenRouter (OPENROUTER_API_KEY)               [prioridad 3]
        │       modelos: llama-3.1-8b:free · qwen3-8b:free · mistral-7b:free
        │
        └─▶ Fallback local (respuestas heurísticas)       [siempre disponible]
```

Si una key falla o no está configurada, pasa automáticamente a la siguiente. El sistema funciona aunque falte alguna clave.

---

# Organigrama y Arquitectura — Sistema de Agentes Clientum
> Julio 2026 · Documento canónico · Fuente de verdad

---

## Organigrama

```
                     Jonathan (CEO & Fundador) — Humano
                                   │
                          Orquestador IA (Chief of Staff)
                                   │
      ┌────────────┬──────────────┼──────────────┬────────────────┐
      ▼             ▼              ▼              ▼                ▼
Agente Técnico  Agente Ventas  Agente Marketing  Agente CS    Agente Operaciones
 (CTO AI)      (Sales Mgr AI)  (Marketing Mgr)  (CS Mgr AI)     (COO AI)
      │             │                              │                │
 ┌────┼────┐   ┌────┼────┐                         │                │
 ▼    ▼    ▼   ▼    ▼    ▼                          ▼                ▼
Back Front IA  Santi Explor. Jonathan          Asesor          Finanzas
/Infra /UX &Aut SDR  Patag. (Closer,Humano)  Comercial IA    & Admin
                                                        SEO & Contenido
                                                        (bajo Marketing)
```

| Nodo | Tipo | Rol | Stack |
|------|------|-----|-------|
| Jonathan | Humano | CEO & Fundador | — |
| Orquestador IA | Agente | Chief of Staff | Gemini, Task-router |
| Agente Técnico | Agente | CTO AI | Node.js, GitHub Actions, Vercel, Neon |
| ↳ Backend/Infra | Híbrido | APIs, auth, DB, deploys | Node.js, Express, Neon, Vercel |
| ↳ Frontend/UX | Híbrido | CRM Kanban, dashboard, UI | React 19, Vite, Tailwind v4 |
| ↳ IA & Automatización | Agente | Brochures, MEDDIC, enriquecimiento | Gemini, Apify, Hunter |
| Agente de Ventas | Agente | Sales Manager AI | CRM Kanban, MEDDIC, WhatsApp |
| ↳ Santi SDR | Agente | SDR Outbound | Hermes Agent, WhatsApp, CRM API |
| ↳ Explorador Patagónico | Agente | Lead Gen | Google Maps, Apify, Gemini |
| ↳ Jonathan (Closer) | Humano | Account Executive | Zoom, WhatsApp |
| Agente de Marketing | Agente | Marketing Manager | Gemini, WordPress, Analytics |
| ↳ SEO & Contenido | Agente | Content AI | WordPress plugin, Gemini, Search Console |
| Agente Customer Success | Agente | CS Manager | CRM, WhatsApp, Gemini |
| ↳ Asesor Comercial IA | Agente | Inbound Chatbot | Site Widget, CRM webhook, Gemini |
| Agente de Operaciones | Agente | COO AI | Neon DB, Retool, Gemini |
| ↳ Finanzas & Admin | Híbrido | Reportes, MRR | CRM Dashboard, Neon DB |

### Regla de oro
Cada agente lee siempre antes de ejecutar: `identidad` → `memoria` → `proceso` → `skill`.

### Motor técnico
- **Trigger:** GitHub Issue nuevo o cron (GitHub Actions, cada 5–15 min)
- **Loop:** el workflow revisa issues abiertos asignados, ejecuta, commitea a `memoria.md`
- **Cierre:** al marcar Done el trigger se corta; notifica al nodo padre

---

## Arquitectura Hermes Prime

> Cómo interactúan el CRM, los agentes autónomos y el agente SDR (Santi/Hermes).

### Componentes principales

```
┌─────────────────────────────────────────────────────────┐
│  clientum.com.ar (Vercel)                               │
│  Express + React SPA                                    │
│  → /api/generate    (Gemini/Groq/OpenRouter)            │
│  → /api/santi/*     (protegido con SANTI_API_KEY)       │
│  → /api/leads       (6 endpoints CRUD)                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (SANTI_API_KEY)
┌──────────────────▼──────────────────────────────────────┐
│  Hermes Agent (Ubuntu local)                            │
│  skill: santi-sdr                                       │
│  → lee leads → envía WA → clasifica → actualiza CRM    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  repo clientum-agentes (GitHub)                         │
│  GitHub Actions (cron 15 min)                           │
│  → Orquestador rutea issues a los 5 agentes             │
│  → Cada agente lee su memoria.md y ejecuta              │
└─────────────────────────────────────────────────────────┘
```

### Secrets requeridos

**Replit + Vercel:**

| Variable | Estado |
|----------|--------|
| `SESSION_SECRET` | ✅ |
| `GEMINI_API_KEY` / `GEMINI_API_KEY_V2` | ✅ |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | ✅ |
| `NEON_DATABASE_URL` | ✅ |
| `CRM_INTERNAL_TOKEN` | ✅ |
| `SANTI_API_KEY` | ✅ |
| `APIFY_API_TOKEN` | ✅ |
| `GOOGLE_MAPS_PLATFORM_KEY` | ✅ |
| `HUNTER_API_KEY` | ✅ |
| `GROQ_API_KEY` | ✅ |
| `OPENROUTER_API_KEY` | ✅ |

**repo `clientum-agentes` (GitHub Secrets):**

| Secret | Fuente |
|--------|--------|
| `GEMINI_API_KEY` | igual que CRM |
| `SANTI_API_KEY` | igual que CRM |
| `CRM_INTERNAL_TOKEN` | igual que CRM |
| `GOOGLE_MAPS_PLATFORM_KEY` | igual que CRM |
| `APIFY_API_TOKEN` | igual que CRM |
| `HUNTER_API_KEY` | igual que CRM |
| `WHATSAPP_CLOUD_API_TOKEN` | 🔲 Meta for Developers |
| `WHATSAPP_PHONE_ID` | 🔲 Meta for Developers |
| `JONATHAN_WHATSAPP_NUMBER` | +54 298 451-0883 |
| `DATABASE_URL` (read-only) | 🔲 nuevo usuario Postgres en Neon |
| `WORDPRESS_API_USER` / `WORDPRESS_API_PASSWORD` | WordPress → Application Passwords |
