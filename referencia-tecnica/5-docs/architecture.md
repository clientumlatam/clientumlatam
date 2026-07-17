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
