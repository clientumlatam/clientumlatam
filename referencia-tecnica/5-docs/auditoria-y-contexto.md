# Auditoría, Contexto y Errores Conocidos — Clientum CRM
> Secrets · Remix · TypeScript · Notas técnicas · Julio 2026

---

## Auditoría de secrets (julio 2026)

**Total:** 22 secrets configurados en Replit. Los marcados con 🔒 son sensibles.

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `GEMINI_API_KEY` 🔒 | AI | Google Gemini principal |
| `GEMINI_API_KEY_V2` 🔒 | AI | Gemini fallback automático |
| `GROQ_API_KEY` 🔒 | AI | Fallback LLM (Llama 3.3 70B) |
| `OPENROUTER_API_KEY` 🔒 | AI | Fallback LLM terciario |
| `SANTI_API_KEY` 🔒 | Auth | Protege rutas `/api/leads` (SDR Santi) |
| `APIFY_API_TOKEN` 🔒 | Scraping | Explorador Patagónico |
| `HUNTER_API_KEY` 🔒 | Enriquecimiento | Búsqueda de emails por dominio |
| `GOOGLE_MAPS_PLATFORM_KEY` 🔒 | Maps | Google Places API |
| `NEON_DATABASE_URL` 🔒 | DB | Conexión pooled Neon (preferida) |
| `NEON_API_KEY` 🔒 | DB | Resolve URL dinámica de branch |
| `NEON_PROJECT_ID` | DB | ID del proyecto Neon |
| `DATABASE_URL` 🔒 | DB | Fallback — URL interna Replit (no funciona en Vercel) |
| `SESSION_SECRET` 🔒 | Auth | Firma de cookies de sesión — **requerido** |
| `VITE_NEON_AUTH_URL` | Auth | URL proxy Neon Auth |
| `JWKS_URL` | Auth | Verificación JWT tokens Neon Auth |
| `SMTP_USER` 🔒 | Email | Gmail SMTP — reset de contraseña |
| `SMTP_PASS` 🔒 | Email | Contraseña de aplicación Gmail |
| `APP_URL` | Config | URL base para links en emails (default: clientum.com.ar) |
| `CRM_INTERNAL_TOKEN` 🔒 | Plugin | Auth webhook WordPress (`X-CRM-Token`) |
| `VERCEL_TOKEN` 🔒 | Deploy | Sync secrets a Vercel vía `scripts/sync-secrets.mjs` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` 🔒 | GitHub | Acceso repo `nzip2` (catálogo 2147 servicios) |
| `PORT` | Config | Puerto Express (Replit lo inyecta automáticamente) |

**No sincronizar a Vercel:** `DATABASE_URL` (URL interna Replit), `VERCEL_TOKEN`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `REPLIT_DEPLOYMENT`, `PORT`.

> **Historial de exposición:** en sesiones de julio 2026 se pegaron claves en chats externos (Mistral, ChatGPT). Las claves afectadas fueron rotadas. Ver contexto en `docs/archivo/chats/`.

---

## Limitaciones del Remix (Replit)

Al hacer Remix del repl:

**NO se transfiere:**
- Secrets / variables de entorno (el usuario arranca con todo vacío)
- Always-On / Deployments (solo planes pagos)
- Dominio personalizado

**SÍ se transfiere:** código, `package.json`, `.env.example`, `.replit`, `docs/`, `.agents/memory/`, `.github/workflows/`, historial git.

**Pasos para el remixeador:**
1. Crear cuenta en neon.tech → copiar connection string → `NEON_DATABASE_URL`
2. Obtener API key de Google AI Studio → `GEMINI_API_KEY`
3. Obtener keys de Apify y Hunter.io (opcional, para prospección)
4. Agregar `VERCEL_TOKEN` y correr `node scripts/pull-secrets.mjs` para traer el resto
5. Correr `node scripts/setup-check.mjs` para verificar qué falta

---

## Errores TypeScript conocidos y sus fixes

### `ok` property en `Response`
```typescript
// ❌ MAL — `ok` no existe en el tipo inferido en algunos contextos
if (response.ok) { ... }

// ✅ BIEN — cast explícito
if ((response as Response).ok) { ... }
```

### Tipo de sesión en Express
```typescript
// En server.ts — extender SessionData para evitar `any`
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}
```

### `Object.values()` con tipos complejos
```typescript
// ❌ MAL — TypeScript no infiere el tipo correcto
const results = Object.values(empResults);

// ✅ BIEN — cast explícito
const results = Object.values(empResults) as EmpResult[];
```

### Campos nullable en interfaces de contactos
```typescript
// ❌ MAL — fuerza string aunque el servidor mande null
interface EmpContact { name: string; email: string; }

// ✅ BIEN — refleja la realidad
interface EmpContact { name: string | null; email: string | null; }
```

### Imports dinámicos con Vite
```typescript
// ❌ MAL — import con variable sin tipo
const mod = await import(path);

// ✅ BIEN — tipo explícito
const mod = await import(path) as { default: ComponentType };
```

### Errores TS preexistentes en el proyecto (no bloquean build)
- `src/App.tsx` — módulos `@neondatabase/neon-js/auth/react` sin declaraciones de tipos
- `src/components/AsistenteIA.tsx` — propiedades `industry`/`company` no tipadas en `slogan`
- `src/components/crm-full/CrmFullBranches.tsx` / `CrmFullSellers.tsx` — props type mismatch en card components
- `artifacts/mockup-sandbox/` — errores propios del sandbox (no afectan la app principal)

---

## Notas de integración

### Plugin WordPress
- Plugin `class-crm-proxy` envía leads vía webhook a `/api/webhooks/chatbot-lead`
- Autenticado con `CRM_INTERNAL_TOKEN` en header `X-CRM-Token`
- Leads capturados van a tabla `chatbot_leads`

### Catálogo de servicios
- Fuente maestra: repo `nzip2` (2 147 registros raw) — requiere `GITHUB_PERSONAL_ACCESS_TOKEN`
- El JSON en `src/data/servicios-catalogo.json` es un derivado curado (425 items)
- Re-derivar desde `nzip2` usando `scripts/generate_catalog.py`, nunca editar a mano

### Vercel — secrets no heredados
- Los secrets de Replit no se propagan automáticamente a Vercel
- Usar `node scripts/sync-secrets.mjs` para sincronizar
- `DATABASE_URL` de Replit apunta a host interno — no funciona en Vercel; usar `NEON_DATABASE_URL`
- Las respuestas API con `Set-Cookie` necesitan `Cache-Control: no-store` (Vercel CDN stripea cookies)
