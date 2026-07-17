# Roadmap — Módulos Nuevos Clientum CRM
> Basado en la arquitectura actual del proyecto (julio 2026)  
> Stack: React 19 + TypeScript + Vite 6 + Express 4 + Neon PostgreSQL + Gemini AI

---

## Estado actual — lo que ya existe

| Módulo | Archivo | Estado |
|--------|---------|--------|
| Prospección Google Maps | `src/services/scraperService.ts` + `/api/scrape-places` | ✅ Funciona (Apify fallback) |
| CRM Pipeline Kanban | `src/components/crm-full/CrmFullPipeline.tsx` | ✅ Funciona |
| Leads SDR Santi | `src/components/crm-full/CrmFullLeads.tsx` + `/api/leads` | ✅ Funciona |
| Orquestador IA (5 agentes) | `src/components/OrquestadorIA.tsx` + `/api/orchestrator` | ✅ Funciona |
| Brochures PDF | `src/components/BrochurePreview.tsx` | ✅ Funciona |
| Chatbot WhatsApp (sim) | `src/components/ChatbotSim.tsx` | ⚠️ Demo/simulación — sin backend real |
| Patagonia Explorer | `SalesProspectorDashboard.tsx` (tab `search`) | ✅ Funciona |
| Scraper de Empleados | `SalesProspectorDashboard.tsx` (tab `employees`) | ✅ Funciona |

---

## Módulo 1 — Google Maps Intelligence (mejora del existente)

### Objetivo
Convertir el scraper básico en un **Motor de Inteligencia Comercial** con scoring automático y enriquecimiento.

### Estado actual
- `/api/scrape-places` existe y usa Apify/Google Maps Places API
- `scraperService.ts` maneja la llamada HTTP
- No hay scoring, no hay persistencia de prospectos por búsqueda, no hay análisis de reseñas

### Qué agregar

#### Backend (`server.ts`)

```typescript
// Nuevas rutas a agregar:
POST /api/places/search          // búsqueda con parámetros (rubro, ciudad, radio)
POST /api/places/:id/score       // calcular score IA para un lugar
POST /api/places/:id/enrich      // enriquecimiento Hunter.io + web check
POST /api/places/bulk-import     // importar selección al CRM como deals
GET  /api/places/history         // historial de búsquedas por usuario
```

#### Base de datos — nueva tabla

```sql
CREATE TABLE IF NOT EXISTS prospecting_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query JSONB,           -- { rubro, ciudad, radio, timestamp }
  results JSONB,         -- array de locales encontrados
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `google_maps` → etiqueta "🗺️ Google Maps"
- Componente: `src/components/crm-full/CrmFullGoogleMaps.tsx` (nuevo)
- Posición: después de `leads` en el array de tabs

#### Componente `CrmFullGoogleMaps.tsx`

Secciones:
1. **Búsqueda** — inputs: rubro, ciudad, radio (km). Botón "Explorar".
2. **Resultados** — tabla con: nombre, dirección, rating, reseñas, teléfono, web, categoría.
3. **Score IA** — columna con badge de probabilidad (%) calculado por Gemini.
4. **Acciones** — checkbox múltiple → "Importar al CRM" → crea deals en `santi_leads`.
5. **Historial** — últimas búsquedas del usuario.

#### Scoring IA (prompt para Gemini)

```
Dado este negocio de Google Maps:
- Nombre: {name}
- Categoría: {category}
- Rating: {rating}/5
- Reseñas: {review_count}
- Tiene web: {has_website}
- Tiene teléfono: {has_phone}

Calcula un score del 0 al 100 de probabilidad de que sea un buen prospecto
para servicios de software CRM/automatización. Devuelve JSON: { score, reason, action }
donde action es uno de: llamar | whatsapp | email | ignorar
```

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/crm-full/CrmFullGoogleMaps.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `google_maps` |
| Modificar | `server.ts` — agregar rutas `/api/places/*` |
| Modificar | `src/services/scraperService.ts` — exponer función de scoring |

### Esfuerzo estimado: **2–3 días**

---

## Módulo 2 — WhatsApp AI (bandeja + copilot)

### Objetivo
Panel de conversaciones WhatsApp reales con IA copilot que sugiere respuestas.

### Arquitectura

El backend de WhatsApp real (`Hermes Agent`) corre en un servidor Ubuntu externo.  
Este módulo se conecta a ese servidor vía webhook / API.

```
WhatsApp Cloud API
      ↓
Hermes Agent (Ubuntu externo)
      ↓ webhook
/api/whatsapp/webhook (nuevo, en server.ts)
      ↓
DB: tabla whatsapp_conversations
      ↓
Frontend: CrmFullWhatsApp.tsx
      ↑
Gemini AI (sugerencias de respuesta)
```

#### Backend — nuevas rutas

```typescript
POST /api/whatsapp/webhook        // recibe mensajes del Hermes Agent (auth: SANTI_API_KEY)
GET  /api/whatsapp/conversations  // lista conversaciones activas
GET  /api/whatsapp/conversations/:id/messages  // mensajes de una conv.
POST /api/whatsapp/conversations/:id/reply     // enviar respuesta
POST /api/whatsapp/conversations/:id/suggest   // Gemini sugiere respuesta
PATCH /api/whatsapp/conversations/:id/bot      // toggle bot ON/OFF
```

#### Base de datos — nuevas tablas

```sql
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  lead_id INTEGER REFERENCES santi_leads(id),
  bot_active BOOLEAN DEFAULT TRUE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES whatsapp_conversations(id),
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  sent_by VARCHAR(50),  -- 'bot' | 'human' | 'ai_suggestion'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `whatsapp` → etiqueta "💬 WhatsApp"
- Componente: `src/components/crm-full/CrmFullWhatsApp.tsx` (nuevo)
- Posición: después de `conversations`

#### Componente `CrmFullWhatsApp.tsx`

Layout tipo Telegram/WhatsApp Web:
- **Panel izq** (30%): lista de conversaciones, indicador bot ON/OFF, búsqueda
- **Panel der** (70%): mensajes de la conversación seleccionada
  - Burbuja de sugerencia IA (se puede aceptar con 1 clic)
  - Input de texto manual
  - Toggle "Bot activo / Bot pausado"

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/crm-full/CrmFullWhatsApp.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `whatsapp` |
| Modificar | `server.ts` — agregar rutas `/api/whatsapp/*` |

### Nota crítica
`SANTI_API_KEY` ya existe en los secrets. El webhook debe validar ese token.  
Las respuestas de estos endpoints deben incluir `Cache-Control: no-store` (Vercel CDN issue).

### Esfuerzo estimado: **3–4 días** (depende de disponibilidad del Hermes Agent externo)

---

## Módulo 3 — Dashboard de Estado de Servicios (pnpm doctor)

### Objetivo
Verificador de integraciones que funciona tanto desde CLI (`pnpm doctor`) como desde el CRM (tab visual).

#### Script CLI: `scripts/doctor.mjs`

```javascript
// Verifica y reporta el estado de cada servicio:
checks:
  - DATABASE_URL → hace SELECT 1
  - GEMINI_API_KEY → llama a la API con prompt mínimo
  - GROQ_API_KEY → idem
  - OPENROUTER_API_KEY → idem
  - APIFY_API_TOKEN → llama al endpoint de usuario
  - GOOGLE_MAPS_PLATFORM_KEY → hace una búsqueda de prueba
  - HUNTER_API_KEY → llama al endpoint de info
  - SMTP_USER/SMTP_PASS → verifica conexión SMTP
  - SANTI_API_KEY → GET /api/leads con esa key
  - VERCEL_TOKEN → GET /v9/projects (Vercel API)
  - GITHUB_PERSONAL_ACCESS_TOKEN → GET /user (GitHub API)
```

Output en terminal:
```
✅ DATABASE      OK  (Neon — 12ms)
✅ GEMINI        OK  (gemini-1.5-flash — 340ms)
❌ GROQ          FAIL (invalid API key)
⚠️  GOOGLE_MAPS  WARN (key configurada, sin verificar cuota)
✅ APIFY         OK  (plan free — 5 runs restantes)
...
```

#### Backend — nueva ruta

```typescript
GET /api/admin/health   // requiere sesión + rol admin
// Devuelve JSON con el resultado de cada check
```

#### Frontend — nuevo sub-tab en CrmFullApp.tsx

- Nombre: `config` → etiqueta "⚙️ Configuración"
- Componente: `src/components/crm-full/CrmFullConfig.tsx` (nuevo)
- Secciones: Estado de servicios (tarjetas) + Variables de entorno detectadas (sin mostrar valores)

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `scripts/doctor.mjs` |
| Crear | `src/components/crm-full/CrmFullConfig.tsx` |
| Modificar | `src/components/crm-full/CrmFullApp.tsx` — agregar tab `config` |
| Modificar | `server.ts` — agregar ruta `/api/admin/health` |
| Modificar | `package.json` — agregar `"doctor": "node scripts/doctor.mjs"` |

### Esfuerzo estimado: **1 día**

---

## Módulo 4 — Enriquecimiento de Leads (mejora del existente)

### Objetivo
Mejorar el flujo de enriquecimiento que ya existe (`/api/enrich-contact` + Hunter.io) para que sea accesible desde el panel de leads y Google Maps.

### Qué ya existe
- `/api/enrich-contact` → usa Hunter.io `domain-search`
- No hay UI dedicada en el CRM para enriquecimiento masivo

### Qué agregar

#### Mejoras en `CrmFullLeads.tsx`
- Botón "Enriquecer" por lead individual → llama a `/api/enrich-contact`
- Botón "Enriquecer seleccionados" (bulk) → llama a `/api/scrape-employees-bulk`
- Columnas nuevas: Email, Dominio, LinkedIn (si se encuentra)

#### Nuevo endpoint `/api/leads/bulk-enrich`
- Acepta array de IDs
- Procesa en serie (rate limit Hunter: 50 req/mes en plan free)
- Actualiza `santi_leads` con los datos encontrados

### Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Modificar | `src/components/crm-full/CrmFullLeads.tsx` — agregar botones de enriquecimiento |
| Modificar | `server.ts` — agregar `/api/leads/bulk-enrich` |

### Esfuerzo estimado: **1 día**

---

## Orden de implementación recomendado

```
Fase 1 (1 semana)
├── Módulo 3: pnpm doctor + tab Configuración   (1 día, bajo riesgo)
├── Módulo 4: Enriquecimiento bulk              (1 día, bajo riesgo)
└── Módulo 1: Google Maps Intelligence          (2–3 días)

Fase 2 (1–2 semanas)
└── Módulo 2: WhatsApp AI                       (3–4 días, depende de Hermes Agent externo)

Fase 3 (futuro)
├── Módulo Marketing: Campañas email/WhatsApp
├── Módulo Finanzas: MercadoPago + AFIP
└── Módulo Automatizaciones: n8n/Make webhooks
```

---

## Convenciones a mantener en todos los módulos

- **Paleta:** `#1A3461` (azul Clientum) como color primario del header/tabs
- **Auth:** todos los endpoints del CRM requieren sesión Express (`requireAuth` middleware)
- **Cache-Control:** todos los endpoints API con cookies deben retornar `Cache-Control: no-store`
- **Tabs:** los nuevos tabs se agregan al array en `CrmFullApp.tsx`, no como rutas nuevas
- **Estado local:** usar `localStorage` vía `sharedStore.ts` para estado persistente del cliente
- **IA:** usar siempre el cascade Gemini → Groq → OpenRouter (ya implementado en el orquestador)
- **Secrets:** nunca exponer valores, solo verificar existencia y conectividad desde el backend

---

*Generado: julio 2026 — basado en el código real del proyecto*
