# Entorno y API Keys

# Entorno y Plataformas — Notas técnicas Clientum
> Vercel · Neon · Replit · Cloudflare · GitHub Actions

---

## Vercel

**Deploy:** automático en cada push a `main` vía integración GitHub.
**Build command:** `pnpm install --frozen-lockfile && vite build`
**Output:** `dist/` (SPA estática) + `api/index.ts` (Vercel Serverless Function, Node 22)

### Routing (`vercel.json`)
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" },
    { "src": "/(.*)", "dest": "/dist/index.html" }
  ]
}
```

### Variables de entorno
Secrets de Replit **no se propagan automáticamente** a Vercel. Sincronizar con:
```bash
node scripts/sync-secrets.mjs
```

**Problema conocido:** `DATABASE_URL` interna de Replit no funciona en Vercel — usar `NEON_DATABASE_URL` (pooled) como variable de entorno en el panel de Vercel.

**Fix crítico:** Vercel CDN puede eliminar `Set-Cookie` en respuestas con cache. Todas las rutas de API deben forzar:
```typescript
res.setHeader('Cache-Control', 'no-store');
```

### Errores comunes
- **`SENSITIVE` env var PATCH falla:** API de Vercel rechaza cambios de tipo. El script de sync usa DELETE + re-create como `encrypted`.
- **Build falla en postinstall:** Playwright u otras dependencias pesadas pueden agotar el timeout — removerlas de `dependencies` si no son requeridas en prod.
- **Cuota free tier:** 100 GB/mes de bandwidth; APIs externas frecuentes pueden consumirlo rápido.

---

## Neon PostgreSQL

**Proyecto actual:** `ep-noisy-water-acvnc08j` · región São Paulo (`sa-east-1`)

### Conexión
```typescript
// Preferida (pooled — para serverless Vercel)
NEON_DATABASE_URL = "postgresql://user:pass@ep-noisy-water-acvnc08j-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

// Dinámica (dev/Replit — evita hardcodear URL)
NEON_API_KEY + NEON_PROJECT_ID → server.ts resuelve la URL via Neon API
```

### Neon Auth
- SMTP custom: `info@clientum.com.ar`
- Dominios configurados: `clientum.com.ar`, `clientumlatam.vercel.app`
- Variables: `VITE_NEON_AUTH_URL`, `JWKS_URL`
- Proxy en Express con header `Origin` requerido (SDK bloqueado por firewall de Replit)
- Fallback a bcrypt local si `VITE_NEON_AUTH_URL` no está seteada

### Branch Neon por PR (GitHub Actions)
```yaml
# neon_workflow.yml
- PR opened/sync → crea branch "preview/pr-N-branch" (expira 14 días)
- PR closed      → elimina el branch
```

### Data API REST
```
NEON_DATA_API_URL = https://ep-noisy-water-acvnc08j.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1
```
*(Guardada como env var, no como secret. Aún no usada en código — disponible para consultas REST directas.)*

---

## Replit

### Puertos y preview
- El servidor Express escucha en `PORT` (inyectado por Replit, default 5000)
- El preview es un iframe proxy con mTLS — usar `$REPLIT_DEV_DOMAIN` para debug desde shell, no hardcodear `localhost` en el código
- HMR de Vite activo en dev; se desactiva con `DISABLE_HMR=true`

### Secrets
- Panel en Settings → Secrets
- Se propagan como variables de entorno al proceso del servidor
- **No se heredan en Remix** — el usuario remixeado arranca con todo vacío
- Para sincronizar a Vercel: `node scripts/sync-secrets.mjs`
- Para verificar qué falta: `node scripts/setup-check.mjs`

### Limitaciones del free tier
| Limitación | Detalle |
|-----------|---------|
| RAM | 512 MB (Node + Vite puede rozar el límite) |
| Always-On | No disponible (solo planes pagos) |
| Deploy a producción | No (usar Vercel externamente) |
| Dominio personalizado | No en free tier |
| Egress | Limitado — cuidado con APIs externas frecuentes |
| Almacenamiento | ~1 GB (node_modules pesa 400-600 MB con pnpm) |

### Qué SÍ se transfiere en un Remix
Todo el código, `package.json`, `.env.example`, `.replit`, `replit.nix`, `docs/`, `.agents/memory/`, `.github/workflows/`, historial git. Los secrets NO.

---

## Cloudflare Worker (proxy)

Usado para proxy de brochures HTML y origen en Replit. Configuración mínima:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.hostname = env.ORIGIN_HOST; // replit dev domain
    return fetch(url.toString(), request);
  }
}
```

Variables de entorno del worker: `ORIGIN_HOST` (el dominio `.replit.dev` del proyecto).

---

## GitHub Actions

### `ci.yml` — en todo push/PR
```yaml
steps:
  - tsc --noEmit      # typecheck
  - vite build        # verifica que el frontend compila
```

### `neon_workflow.yml` — gestión de branches Neon por PR
- PR opened/reopened/sync → crea branch Neon `preview/pr-N-branch`
- PR closed → elimina branch Neon

### Repo `clientum-agentes` — cron de agentes autónomos
```yaml
on:
  schedule:
    - cron: '*/15 * * * *'   # cada 15 min
  workflow_dispatch:           # manual
```
- Lee issues abiertos con label `agente:*`
- Ejecuta el agente correspondiente via Gemini
- Commitea a `memoria.md` del agente
- Cierra el issue con `ESTADO: DONE`

**Secrets requeridos:** `GEMINI_API_KEY`, `SANTI_API_KEY`, `CRM_INTERNAL_TOKEN`, `GOOGLE_MAPS_PLATFORM_KEY`, `APIFY_API_TOKEN`, `HUNTER_API_KEY`
**Permisos:** Read and write permissions (para comentar, cerrar issues y commitear)

---

# Setup y API Keys — Agentes Autónomos Clientum

---

## Puesta en marcha — ya en este repo

El workflow está en **`.github/workflows/agentes-clientum.yml`** de este mismo repo CRM.
No hace falta crear un repo separado.

### 1. Cargar el secret GEMINI_API_KEY en GitHub
**Settings → Secrets and variables → Actions → New repository secret:**
- `GEMINI_API_KEY` → tu clave de https://aistudio.google.com/apikey (free tier alcanza)
- (`GITHUB_TOKEN` ya existe automáticamente)

### 2. Activar permisos de escritura
**Settings → Actions → General → Workflow permissions** → "Read and write permissions"  
(necesario para que el bot comente issues, los cierre, y commitee memoria)

### 3. Cómo darle trabajo (dos formas)

**A) Vía Orquestador (recomendado):**
Crear Issue en este repo con label `agente:orquestador` e instrucción en texto libre. El Orquestador elige el sub-agente correcto y re-etiqueta solo.

**B) Asignación directa:**
Poner el label directo: `agente:ventas/santi-sdr`, `agente:tecnico/backend-infra`, etc.

El workflow corre cada 15 min. En el peor caso: 15 min de ruteo (opción A) + 15 min de ejecución.

### 4. Cómo saber que terminó
El agente comenta avance en el issue. Al terminar escribe `ESTADO: DONE` y el workflow cierra el issue. La sección `## Memoria` de la ficha del agente se actualiza y se commitea automáticamente a `docs/referencia-tecnica/agentes/fichas/`.

### 5. Costo
- **GitHub Actions:** gratis hasta 2.000 min/mes (este sistema usa ~1 min/corrida, 4 corridas/hora = ~2.880 min/mes — considerar plan pago si el volumen crece)
- **Gemini API:** free tier (si el volumen sube, evaluar plan pago)

### Archivos clave del sistema
| Archivo | Rol |
|---------|-----|
| `.github/workflows/agentes-clientum.yml` | Workflow GitHub Actions (cron 15 min) |
| `docs/referencia-tecnica/agentes/scripts/run-agentes.mjs` | Lógica orquestador + agentes |
| `docs/referencia-tecnica/agentes/fichas/<slug>.md` | Identidad · Memoria · Proceso · Skill de cada agente |

---

## API Keys por agente

### Motor de IA central — cascada de fallback

| Prioridad | Proveedor | Variable | Modelos |
|-----------|-----------|----------|---------|
| 1 | Google Gemini | `GEMINI_API_KEY` → `GEMINI_API_KEY_V2` | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash-lite` |
| 2 | Groq | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| 3 | OpenRouter | `OPENROUTER_API_KEY` | `llama-3.1-8b:free`, `qwen3-8b:free`, `mistral-7b:free`, `gemma-3-12b:free` |
| 4 | Fallback local | — | Respuestas heurísticas |

### Keys por agente

| Agente | Keys requeridas |
|--------|----------------|
| **Santi SDR** | `SANTI_API_KEY` (auth) + Gemini/Groq/OpenRouter (LLM) |
| **Explorador Patagónico** | `GOOGLE_MAPS_PLATFORM_KEY` + `APIFY_API_TOKEN` + `HUNTER_API_KEY` + LLM |
| **Asistente IA / Chatbot / Sales Chat** | Gemini/Groq/OpenRouter |
| **Agente de Imágenes** | `GEMINI_API_KEY` (`gemini-2.5-flash-image`) |

### Infraestructura

| Variable | Uso |
|----------|-----|
| `NEON_DATABASE_URL` | Conexión pooled a Neon (preferida) |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | Resolve URL dinámica si no hay NEON_DATABASE_URL |
| `SESSION_SECRET` | Firma de sesiones Express — **requerido** |
| `VITE_NEON_AUTH_URL` | Proxy Neon Auth (auth local con bcrypt si falta) |
| `JWKS_URL` | Verificación JWT (Neon Auth) |
| `SMTP_USER` + `SMTP_PASS` | Gmail SMTP para emails transaccionales |
| `APP_URL` | URL base para links en emails (default: clientum.com.ar) |
| `CRM_INTERNAL_TOKEN` | Auth de webhooks del plugin WordPress (`X-CRM-Token`) |
| `VERCEL_TOKEN` | Sync de secrets a Vercel vía `scripts/sync-secrets.mjs` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Acceso al repo `nzip2` (catálogo 2147 servicios) |

### Resumen rápido

```
Agente               │ Gemini │ Groq │ OpenRouter │ Santi │ Maps │ Apify │ Hunter
─────────────────────┼────────┼──────┼────────────┼───────┼──────┼───────┼───────
Santi SDR            │  ✅    │  ✅  │    ✅      │  🔐   │      │       │
Explorador Patagónico│  ✅    │  ✅  │    ✅      │       │  ✅  │  ✅   │  ✅
Asistente IA         │  ✅    │  ✅  │    ✅      │       │      │       │
Chatbot / Sales Chat │  ✅    │  ✅  │    ✅      │       │      │       │
Agente de Imágenes   │  ✅    │      │            │       │      │       │
```

> 🔐 `SANTI_API_KEY` es auth de rutas `/api/santi/*`, no un proveedor LLM.

### Notas importantes
1. **Cascada:** si Gemini falla → Groq → OpenRouter → local. Los agentes funcionan aunque falte alguna clave.
2. **Vercel no hereda secrets de Replit:** sincronizar con `node scripts/sync-secrets.mjs`.
3. **`APIFY_API_TOKEN` y `HUNTER_API_KEY`** son requeridas para el Explorador — lanza error explícito si faltan.
