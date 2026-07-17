# Auditoría de Secrets — Clientum CRM
> Generado: 2026-07-17  
> Metodología: grep recursivo de todos los archivos fuente (`.ts`, `.tsx`, `.mjs`, `.yml`, `.json`) excluyendo `node_modules/`, `docs/` y `.git/`.  
> Total secrets configurados en Replit: **32**

---

## Resumen ejecutivo

| Categoría | Cantidad |
|-----------|---------|
| ✅ Activos y bien configurados | 14 |
| 🔴 Obsoletos — no usados en el app | 4 |
| 🟠 Runtime-managed — Replit los inyecta solo | 6 |
| 🟡 Solo en scripts de infraestructura | 3 |
| ⚠️ Con valor incorrecto o problemático | 3 |
| ⚠️ Nombre no coincide con el código | 1 |
| ⚠️ Solo en scripts, no en el app | 1 |

---

## 🔴 Obsoletos — eliminar

Ningún archivo de código fuente del app los referencia. Se pueden borrar sin consecuencias.

### `DATABASE_URL_UNPOOLED`
- **Creado:** hoy desde `env-referencia.env`
- **Uso en código:** ninguno — `server.ts` usa `DATABASE_URL` / `NEON_DATABASE_URL`. El unpooled no está referenciado en ningún `process.env.*`.
- **Acción:** eliminar de Replit Secrets. Conservar el valor en `docs/proyecto/config/env-referencia.env` para referencia.

### `PGHOST_UNPOOLED`
- **Uso en código:** ninguno — no aparece en ningún `process.env.*` del proyecto.
- **Acción:** eliminar de Replit Secrets.

### `STRIPE_PUBLISHABLE_KEY`
- **Uso en código:** ninguno — Stripe no está implementado en el proyecto. No hay ningún `import Stripe`, `loadStripe`, ni endpoint `/api/stripe` en `server.ts` o `src/`.
- **Acción:** eliminar. Si se implementa Stripe en el futuro, agregar cuando corresponda.

### `STRIPE_SECRET_KEY`
- **Uso en código:** ninguno — mismo caso que `STRIPE_PUBLISHABLE_KEY`.
- **Acción:** eliminar.

---

## 🟠 Runtime-managed — Replit los inyecta automáticamente

Replit deriva estos valores de `DATABASE_URL` y los inyecta en el entorno de ejecución. Configurarlos manualmente como Secrets es redundante y puede causar conflictos si algún día cambia la connection string.

| Secret | Por qué es innecesario |
|--------|----------------------|
| `PGHOST` | Replit extrae el host de `DATABASE_URL` automáticamente |
| `PGPORT` | Ídem (siempre 5432 para Neon) |
| `PGDATABASE` | Ídem (siempre `neondb`) |
| `PGUSER` | Ídem |
| `PGPASSWORD` | Ídem |
| `PORT` | Replit inyecta el puerto de escucha; `server.ts` lo lee de `process.env.PORT` con fallback a 5000 |

**Acción:** se pueden eliminar como Secrets. El app seguirá funcionando porque Replit los provee en el entorno de todas formas. Si se usan en scripts locales fuera de Replit, conservarlos en `docs/proyecto/config/env-referencia.env`.

---

## 🟡 Solo en scripts de infraestructura

No los consume el app en sí, pero son necesarios para los scripts de mantenimiento (`sync-secrets.mjs`, `pull-secrets.mjs`). No eliminar, pero tampoco son requeridos para que el app funcione.

### `GITHUB_PERSONAL_ACCESS_TOKEN`
- **Usado en:** `scripts/sync-secrets.mjs`, `scripts/pull-secrets.mjs`, `scripts/setup-check.mjs`
- **No usado en:** `server.ts`, `src/`
- **Propósito:** sincronizar secrets hacia GitHub Secrets (CI) y el repo `clientum-agentes`.
- **Estado:** necesario para los scripts, no para el app.

### `VERCEL_TOKEN`
- **Usado en:** `scripts/sync-secrets.mjs`, `scripts/pull-secrets.mjs`, `scripts/setup-check.mjs`
- **No usado en:** `server.ts`, `src/`
- **Propósito:** despliegue a Vercel y lectura de secrets para el flujo de Remix.
- **Estado:** necesario para los scripts, no para el app.

### `JWKS_URL`
- **Usado en:** `scripts/sync-secrets.mjs`, `scripts/setup-check.mjs`
- **No usado en:** `server.ts` — el servidor usa `VITE_NEON_AUTH_URL` y `NEON_AUTH_BASE_URL` como proxy interno.
- **Nota:** la URL es redundante con `VITE_NEON_AUTH_URL` (misma base + ruta `/.well-known/jwks.json`). El app no la lee directamente.
- **Estado:** útil para documentar el endpoint JWKS, pero no requerido como Secret del app.

---

## ⚠️ Con valor incorrecto o problemático

### `GEMINI_API_KEY`
- **Valor actual:** empieza con `AlzaSy...` — las keys de Google Gemini/API válidas empiezan con `AIza`.
- **Impacto:** el app arranca y Gemini aparece como "disponible" (pasa la validación de formato), pero las llamadas reales a la API pueden fallar o usar una key inválida/rotada.
- **Evidencia:** los logs anteriores al reinicio mostraban `[AI] Sin configurar: Gemini, Groq, OpenRouter` — posiblemente porque la key era rechazada por la API de Google.
- **Acción:** verificar en [Google AI Studio](https://aistudio.google.com/apikey) si la key es válida. Si no, generar una nueva y actualizar el Secret.

### `REPLIT_DEPLOYMENT`
- **Valor actual:** mismo valor que `GEMINI_API_KEY` (`AlzaSy...`) — claramente incorrecto.
- **Propósito real:** debería ser `"true"` para indicar que el proceso corre en Replit deployment, o simplemente dejarse vacío (Replit lo inyecta automáticamente).
- **Uso en código:** solo en `scripts/pull-secrets.mjs` línea 97 para excluirlo del sync — el app en sí no lo usa.
- **Acción:** setear a `"true"` o eliminar. No necesita el valor de una API key.

### `CRM_INTERNAL_TOKEN`
- **Valor actual:** `"QUE WORDPRESS, EL PLUGIN DE WORDPRESS LO TENIAS QUE CONVERTIR A UNA TAB O VARIAS TABS EN EL DASHBOARD DE AI Client Prospector"` — es un recordatorio de tarea, no un token.
- **Impacto:** el endpoint `/api/webhooks/*` y el plugin de WordPress usan este token para autenticarse. Con el valor actual, cualquier request desde WordPress fallaría la autenticación.
- **Acción:** generar un token real con `openssl rand -hex 32` y setearlo tanto en Replit Secrets como en la configuración del plugin WordPress.

---

## ⚠️ Nombre no coincide con el código

### `GOOGLE_API_KEY`
- **Configurado como:** `GOOGLE_API_KEY` en Replit Secrets
- **Usado en código como:** `server.ts` usa `process.env.GOOGLE_MAPS_PLATFORM_KEY` (primario) y `process.env.GOOGLE_MAPS_API_KEY` (alias fallback) — **jamás** `GOOGLE_API_KEY`.
- **Consecuencia:** el Secret `GOOGLE_API_KEY` nunca es leído por `server.ts`. El app usa `GOOGLE_MAPS_PLATFORM_KEY` que sí está correctamente configurado con el mismo valor.
- **Acción:** `GOOGLE_API_KEY` como Secret es redundante. Puede eliminarse. El valor ya está cubierto por `GOOGLE_MAPS_PLATFORM_KEY`.

---

## ✅ Activos y correctamente configurados

| Secret | Usado en | Propósito |
|--------|----------|-----------|
| `DATABASE_URL` | `server.ts` | Conexión pooled a Neon PostgreSQL |
| `NEON_DATABASE_URL` | `server.ts` | Fallback/alias de `DATABASE_URL` para Vercel |
| `NEON_API_KEY` | `server.ts` (L53), `neon_workflow.yml` | Resolver connection string en Neon API + CI branch DB |
| `NEON_PROJECT_ID` | `server.ts` (L54), `neon_workflow.yml` | ID del proyecto Neon para la API + CI |
| `SESSION_SECRET` | `server.ts` | Firma de cookies de sesión Express |
| `SANTI_API_KEY` | `server.ts` | Auth server-to-server del agente SDR Hermes |
| `APIFY_API_TOKEN` | `server.ts` | Scraping Google Maps / directorios |
| `GOOGLE_MAPS_PLATFORM_KEY` | `server.ts`, `vite.config.ts`, `ci.yml` | Places API para prospección patagónica |
| `HUNTER_API_KEY` | `server.ts`, `CrmFullCMDB.tsx` | Enriquecimiento de contactos |
| `GROQ_API_KEY` | `server.ts` | LLM auxiliar de alta velocidad (fallback IA) |
| `OPENROUTER_API_KEY` | `server.ts` | LLM multi-modelo (segundo fallback IA) |
| `SMTP_USER` | `server.ts` (nodemailer) | Emails de notificación |
| `SMTP_PASS` | `server.ts` (nodemailer) | Auth Gmail App Password |
| `VITE_NEON_AUTH_URL` | `server.ts` (L416), `src/lib/auth.ts` | Proxy de Neon Auth (JWT / JWKS) |
| `APP_URL` | `server.ts` | URL pública del app (self-referential links) |

---

## Variables en código que NO tienen Secret configurado

| Variable en código | Archivos | Estado |
|-------------------|----------|--------|
| `process.env.GOOGLE_MAPS_API_KEY` | `server.ts` (2 refs, como alias fallback) | No configurada — el fallback nunca se activa porque `GOOGLE_MAPS_PLATFORM_KEY` siempre está presente |
| `process.env.NEON_AUTH_BASE_URL` | `server.ts` L415 (fallback de `VITE_NEON_AUTH_URL`) | No configurada como Secret; `VITE_NEON_AUTH_URL` cubre el caso |

Ninguna de estas ausencias causa errores porque ambas tienen alternatives configuradas.

---

## Plan de acción recomendado

### Eliminar inmediatamente (0 riesgo)
```
DATABASE_URL_UNPOOLED
PGHOST_UNPOOLED
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
GOOGLE_API_KEY          ← redundante con GOOGLE_MAPS_PLATFORM_KEY
```

### Eliminar si no se usan scripts fuera de Replit
```
PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD  ← Replit los inyecta solo
PORT                                                 ← ídem
```

### Corregir valor
```
REPLIT_DEPLOYMENT       → setear a "true" (o eliminar)
GEMINI_API_KEY          → verificar/reemplazar en Google AI Studio
CRM_INTERNAL_TOKEN      → generar con: openssl rand -hex 32
```

### Mantener como están
```
DATABASE_URL, NEON_DATABASE_URL, NEON_API_KEY, NEON_PROJECT_ID
SESSION_SECRET, SANTI_API_KEY, APIFY_API_TOKEN
GOOGLE_MAPS_PLATFORM_KEY, HUNTER_API_KEY
GROQ_API_KEY, OPENROUTER_API_KEY
SMTP_USER, SMTP_PASS, VITE_NEON_AUTH_URL, APP_URL
GITHUB_PERSONAL_ACCESS_TOKEN, VERCEL_TOKEN, JWKS_URL  ← para scripts
```
