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
