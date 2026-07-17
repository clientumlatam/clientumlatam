# Bitácora de sesiones — Clientum CRM

> Log cronológico de sesiones de trabajo. Última: 2026-07-17.

---

# Sesión 2026-07-10

**Participantes:** Usuario + Agente Replit

---

## Temas tratados

### 1. Setup inicial del proyecto
- Configuración del stack: React 19 + TypeScript + Vite 6 + Tailwind CSS v4
- Backend Express 4 en Node.js 22
- Base de datos: Neon PostgreSQL serverless (pooled) via `pg`

### 2. Configuración base de datos Neon
- Se conectó el proyecto a Neon (serverless Postgres)
- La DB URL se resuelve dinámicamente via `NEON_API_KEY` + `NEON_PROJECT_ID` (evita hardcodear la URL)
- Tablas auto-creadas al iniciar el servidor (`CREATE TABLE IF NOT EXISTS`)

### 3. Deploy en Vercel
- Configuración de `vercel.json` para servir SPA + API Function
- `api/index.ts` como Vercel Function (Node 22)
- `dist/` servido como estático desde CDN de Vercel
- Dominio: clientum.com.ar

### 4. CI/CD con GitHub Actions
- `.github/workflows/ci.yml`: TypeScript lint + Vite build en cada PR/push
- `.github/workflows/neon_workflow.yml`: crea branch Neon `preview/pr-N` por PR (expira 14 días)

### 5. Arquitectura documentada
- Creado `docs/ARCHITECTURE.md` con stack completo, rutas, schema DB, flujo dev→Vercel

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `server.ts` | Entrypoint Express |
| `api/index.ts` | Vercel Function entrypoint |
| `vercel.json` | Config deploy Vercel |
| `.github/workflows/ci.yml` | CI TypeScript + build |
| `.github/workflows/neon_workflow.yml` | Branch Neon por PR |
| `docs/ARCHITECTURE.md` | Creado |
| `replit.md` | Creado |

---

# Sesión 2026-07-11

**Participantes:** Usuario + Agente Replit

---

## Temas tratados

### 1. Generador de Brochures PDF
- Implementación de exportación PDF usando jsPDF + html2canvas-pro
- **Decisión clave:** El PDF se captura del DOM renderizado en vivo (no se dibuja manualmente) — garantiza que el PDF sea idéntico al preview en pantalla
- Se documentó en `.agents/memory/brochure-pdf-export.md`

### 2. Scraper Apify — fix de fallback automático
- El scraper tenía 3 actores Apify con fallback automático si uno falla
- Se ajustó la lógica de detección de error para manejar timeouts vs errores de cuota

### 3. Fix de tipos TypeScript generales
- Varias interfaces del frontend tenían tipos demasiado amplios que permitían estados inválidos
- Se auditaron y corrigieron tipos en los componentes del CRM

### 4. Rol de sesión — staleness
- **Problema descubierto:** Si un admin cambia el rol de un usuario directamente en la DB, la sesión activa del usuario no se actualiza hasta que vuelva a loguearse
- **Documentado** en `.agents/memory/session-role-staleness.md` para tenerlo en cuenta en futuras features de gestión de roles

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `src/utils/pdfGenerator.ts` | Implementación PDF via DOM capture |
| `src/components/` (varios) | Fix de tipos TypeScript |

---

# Sesión 2026-07-14

**Participantes:** Usuario + Agente Replit

---

## Temas tratados

### 1. Fix Employee Scraper — nombres falsos como contactos reales
- **Problema:** El scraper de empleados mostraba nombres inventados por IA como si fueran contactos reales verificados
- **Root cause:** El tipo TypeScript `EmpContact` tenía `name: string` (no nullable), pero el servidor ya enviaba `name: null` para los sugeridos por IA. La discrepancia causaba que llegaran strings vacíos o undefined al frontend sin warning
- **Fix:** Se amplió `EmpContact` a `name: string | null`, `email: string | null`; se endurecieron todos los usages (initials(), CSV export, render)
- También se corrigió `Object.values(empResults)` que no inferí el tipo correcto → cast explícito `as EmpResult[]`

### 2. Eliminar configuración de API keys del frontend
- **Problema:** El usuario tenía que ingresar su propia Google Maps Platform Key en un modal — fricción innecesaria
- **Decisión:** Todos los usuarios usan la clave del servidor automáticamente, sin setup
- **Removido de `SalesProspectorDashboard.tsx`:**
  - Modal "Configurar Clave Real"
  - Estado `customApiKey`, `showKeyModal`, `modalKeyInput`, `isValidatingKey`
  - Bloque "Prospección Local Simulada"
  - Botón "Configurar Clave Real"
- `hasActiveValidKey` ahora solo depende de `serverHasGoogleMaps` (consultado via `/api/config/has-google-maps`)

### 3. Fix AI providers no cargando
- El servidor logueaba "Sin configurar: Gemini, Groq, OpenRouter" a pesar de que los secrets estaban seteados
- Fix: reiniciar el workflow — los secrets no se inyectan en un servidor ya corriendo
- Después del reinicio: "Proveedores disponibles: Gemini, Groq, OpenRouter" ✅

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `src/components/SalesProspectorDashboard.tsx` | Fix tipos EmpContact, eliminación modal/config de API keys |

---

# Sesión 2026-07-15

**Participantes:** Usuario + Agente Replit

---

## Temas tratados

### 1. Git PAT expirado
- El token anterior (`ghp_...`) estaba revocado — git push fallaba con 401
- El usuario proporcionó un nuevo PAT
- Se actualizó el remote URL via `git remote set-url` usando `$GITHUB_PERSONAL_ACCESS_TOKEN`
- Git panel volvió a autenticarse correctamente

### 2. Creación de script sync-secrets.mjs
- **Problema:** Cada vez que se cambia un secret en Replit, hay que actualizarlo manualmente en Vercel y GitHub Actions
- **Solución:** Script `scripts/sync-secrets.mjs` que lee los env vars de Replit y los sube via API a Vercel y GitHub
- Manejo especial: `NEON_DATABASE_URL` → `DATABASE_URL` en Vercel (el DATABASE_URL interno de Replit no funciona desde Vercel)
- Se excluyeron intencionalmente: `VERCEL_TOKEN`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `REPLIT_DEPLOYMENT`, `DATABASE_URL` (interno)
- El script quedó escrito pero no ejecutado en esta sesión (se ejecutó en la sesión del 17/07)

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `scripts/sync-secrets.mjs` | Creado |
| `.git/config` | Remote URL actualizado con nuevo PAT |

---

# Sesión 2026-07-17

**Duración estimada:** ~30 min  
**Participantes:** Usuario + Agente Replit

---

## Temas tratados

### 1. Ejecución del sync de secrets (pendiente de sesión anterior)
- Se corrió `node scripts/sync-secrets.mjs` por primera vez
- Resultado inicial: 8 actualizadas en Vercel, 18 en GitHub — pero 11 mostraron error en Vercel

### 2. Debug y fix del script de sync para Vercel
- **Diagnóstico:** La API de Vercel devuelve `"You cannot change the type of a Sensitive Environment Variable."` cuando se intenta PATCH con el campo `type` en variables de tipo `sensitive`
- **Fix aplicado:** Se quitó el campo `type` del body del PATCH. Si aun así falla con `BAD_REQUEST`, el script ahora hace DELETE + re-create como `encrypted`
- **Resultado final:** 19 actualizadas en Vercel ✅, 18 en GitHub ✅

### 3. Revisión del panel de Secrets de Replit (screenshot)
- El usuario mostró su panel de Secrets actual
- Confirmado: ningún secret falta, todo está correcto
- Aclaración sobre qué se sincroniza y qué se excluye intencionalmente (`DATABASE_URL`, `VERCEL_TOKEN`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `REPLIT_DEPLOYMENT`)

### 4. Setup para Remixes
- Pregunta: ¿qué pasa cuando alguien hace Remix de este Replit?
- Los secrets NO se copian en un Remix — el nuevo usuario arranca con todas las vars vacías
- **Creado:** `scripts/setup-check.mjs` — script interactivo que valida qué secrets faltan, con descripción de cada uno y link de dónde obtenerlo
- **Actualizado:** `replit.md` — sección "Cómo hacer Remix" con instrucciones paso a paso

### 5. Sistema de logs de sesiones
- **Creado:** `docs/sessions/` — directorio con log por sesión
- **Creado:** `docs/sessions/README.md` — índice de todas las sesiones
- Retroactivamente documentadas sesiones anteriores (07-10, 07-11, 07-14, 07-15)

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `scripts/sync-secrets.mjs` | Fix PATCH sin `type`, fallback delete+recreate para `sensitive` |
| `scripts/setup-check.mjs` | Creado — validador de secrets para Remix |
| `docs/sessions/README.md` | Creado — índice de sesiones |
| `docs/sessions/2026-07-17.md` | Creado — este archivo |
| `docs/sessions/2026-07-10.md` | Creado — sesión retroactiva |
| `docs/sessions/2026-07-11.md` | Creado — sesión retroactiva |
| `docs/sessions/2026-07-14.md` | Creado — sesión retroactiva |
| `docs/sessions/2026-07-15.md` | Creado — sesión retroactiva |
| `replit.md` | Agregada sección Remix |

---

## Decisiones tomadas

- El sync script siempre excluye `VERCEL_TOKEN`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `REPLIT_DEPLOYMENT` y `DATABASE_URL` (el de Replit interno) de la sincronización — están documentadas las razones en el script
- Los logs de sesión van en `docs/sessions/YYYY-MM-DD.md` y el agente los escribe al final de cada sesión significativa

---

# Sesión 2026-07-17 — Resumen

> Agente: Replit Agent  
> Fecha: 17 de julio de 2026  
> Duración: ~2 horas (sesión cortada por quota)

---

## Temas trabajados

### 1. Fix sync-secrets.mjs — Vercel sensitive vars
- **Problema**: Vercel devolvía `"You cannot change the type of a Sensitive Environment Variable."` al hacer PATCH con el campo `type`.
- **Fix**: PATCH sin `type`; si falla con `BAD_REQUEST` → DELETE + re-create como `encrypted`.
- **Resultado**: 19 vars actualizadas sin errores.

### 2. Script setup-check.mjs (Remix)
- Validador de secrets para cuando alguien hace Remix del Repl.
- Muestra ✅ / ❌ / ⚠️ por secret, con descripción y link para obtenerlo.
- Actualizado para leer tanto Replit Secrets como `.env.local`.

### 3. Script pull-secrets.mjs (Remix flow)
- Trae todos los secrets desde Vercel con `?decrypt=true`.
- Solo requiere `VERCEL_TOKEN` en el nuevo Repl.
- Escribe `.env.local` (gitignored).
- Flujo definitivo de Remix: `VERCEL_TOKEN` → `pull-secrets.mjs` → `npm run dev`.

### 4. Sistema de logs de sesiones
- Creado `docs/sessions/` (luego integrado en `docs/ia/sesiones/` al reorganizar).
- Logs retroactivos: 2026-07-10, 07-11, 07-14, 07-15, 07-17.

### 5. Reorganización completa de docs/
- De 3.244 archivos a 1.895 (eliminación de duplicados, carpetas caóticas, timestamps).
- 16 ZIPs descomprimidos recursivamente.
- Estructura final: agentes, brochures, capturas, catalogo, codigo, config, exports, logos, notas-tecnicas, propuestas, sesiones, sitemaps, web, wordpress, backups.
- `attached_assets/` vaciado: 16 archivos renombrados y movidos a `docs/`.

### 6. Auditoría de documentación (inicio — cortada por quota)
- **Inconsistencia corregida**: `ORGANIGRAMA.md` decía React 18 → corregido a React 19.
- **Docs creados**: `docs/INTEGRATION.md` (estado de integraciones, nunca existía).
- **Chats movidos**: `CHAT-2026-07-17.md` y su copia → `docs/ia/sesiones/`.
- **Pendiente al cortar**: stubs de agentes (evaluar si necesitan contenido).

---

## Archivos creados / modificados

| Archivo | Acción |
|---------|--------|
| `scripts/sync-secrets.mjs` | Fix PATCH sin `type`, fallback delete+recreate |
| `scripts/setup-check.mjs` | Creado + actualizado para leer `.env.local` |
| `scripts/pull-secrets.mjs` | Creado — trae secrets desde Vercel |
| `server.ts` | `dotenv.config({ path: ".env.local" })` |
| `docs/INTEGRATION.md` | Creado — estado de todas las integraciones |
| `docs/ia/agentes/clientum-agentes/ORGANIGRAMA.md` | React 18 → React 19 |
| `docs/ia/sesiones/chat-agente-2026-07-17.md` | Chat sesión parte 1 (movido desde raíz) |
| `docs/ia/sesiones/chat-agente-2026-07-17-continuacion.md` | Chat sesión parte 2 (movido desde raíz) |
| `replit.md` | Sección "Cómo hacer Remix" actualizada |
| docs/ (todo) | Reorganización masiva (3244→1895 archivos) |

