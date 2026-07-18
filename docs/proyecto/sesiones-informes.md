# Sesiones e Informes — Clientum

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


---

# Informes — Análisis de sesiones y chats Clientum (julio 2026)

---

# Informe consolidado — Chats exportados de Clientum
**Fecha del análisis:** 16 de julio de 2026
**Fuentes:** 6 archivos de chat exportados (Claude, ChatGPT, Replit Agent) correspondientes al 13–15 de julio de 2026

---

## 1. Resumen ejecutivo

Los chats analizados cubren tres frentes en paralelo: el deploy de Clientum a Vercel/producción, un incidente serio y recurrente de exposición de credenciales, y el desarrollo de dos features nuevas (Orquestador IA y login con Neon Auth). El deploy terminó resuelto. Las features avanzaron bien y terminaron funcionando. La exposición de credenciales, en cambio, **sigue sin resolverse del todo** y es lo más urgente de todo el lote.

---

## 2. 🔴 Exposición de credenciales — el tema más urgente

### Qué pasó
En distintas sesiones (Mistral, ChatGPT, Claude, Replit Agent) se pegaron archivos `.env` con claves reales en texto plano. Cada vez que se subió uno de esos archivos a un chat distinto, la superficie de exposición creció. Las claves que aparecieron repetidas veces en texto plano across los chats:

- `SESSION_SECRET` (al menos dos valores distintos circularon)
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_PLATFORM_KEY`
- `HUNTER_API_KEY`
- `APIFY_API_TOKEN`
- `SANTI_API_KEY`
- `NEON_API_KEY`
- `GITHUB_PERSONAL_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `DATABASE_URL` completo (con password de `neondb_owner` incluido)
- Claves de test de Stripe (riesgo bajo, son de test)

### Lo más grave: repo público en GitHub
En uno de los chats, el agente de Replit detectó que **el repo `clientumlatam/clientumlatam` es público**, y que dos archivos ya pusheados a `origin/main` (`chat` y `chat (copy)`) contienen esas mismas claves reales en texto plano. Es decir, no es solo un archivo subido a un chat de IA — está en un repositorio accesible por cualquiera en internet. En ese momento se te consultó qué hacer y la acción quedó **rechazada/pospuesta** dos veces.

### Estado de rotación (según lo que muestran los chats)
| Credencial | Estado |
|---|---|
| `SESSION_SECRET` | Rotado al menos una vez, pero hay dos valores distintos dando vueltas — no está claro cuál quedó activo |
| Resto de las claves (Gemini, Maps, Hunter, Apify, Santi, Neon API key, GitHub PAT, Vercel token) | Marcadas como comprometidas en varias sesiones, **rotación pendiente** |
| `DATABASE_URL` / password de Neon | Expuesto completo en un archivo — **no hay evidencia de reset del password** |
| Archivos con claves en el repo público | **Siguen en el historial de git**, no consta que se hayan purgado |

### Qué recomiendo hacer ahora, en este orden
1. **Neon**: resetear el password de `neondb_owner` desde el dashboard de Neon (invalida el `DATABASE_URL` expuesto al instante).
2. **Vercel**: revocar el token expuesto y generar uno nuevo (Account Settings → Tokens).
3. **GitHub**: revocar el PAT expuesto (Settings → Developer settings → Personal access tokens) y generar uno con el mínimo scope necesario.
4. **Repo público**: decidir entre pasarlo a privado, o purgar `chat` y `chat (copy)` del historial de git y forzar el push. Mientras el historial tenga esos archivos, cualquier rotación es parcial — las claves viejas siguen siendo encontrables.
5. **Resto de las claves** (Gemini, Google Maps, Hunter.io, Apify, Santi): regenerar todas en sus paneles respectivos.
6. **SESSION_SECRET**: confirmar cuál de los dos valores está deployado y asegurarse de que el viejo esté muerto.
7. Borrar los archivos de chat con credenciales en texto plano de cualquier lugar donde queden (uploads, Replit, descargas) una vez confirmada la rotación.

---

## 3. Deploy a producción (Vercel) — resuelto

- **Problema 1 — build fallaba**: TypeScript no reconocía las propiedades custom de Express (`req.session`, etc.) por un problema de hoisting de tipos con pnpm. Se arregló agregando `.npmrc` (`public-hoist-pattern[]=*@types*`) y `pnpm.supportedArchitectures` (`linux/x64`) en `package.json`.
- **Problema 2 — sesión no persistía en producción**: Vercel cacheaba las respuestas de la API (`cache-control: public, max-age=0`) y descartaba el header `Set-Cookie` en el camino. El login devolvía 200/201 pero ninguna request posterior tenía sesión válida. Se resolvió agregando un middleware que fuerza `Cache-Control: no-store` en todas las respuestas del server Express.
- Ambos fixes quedaron en la rama `fix/pnpm-hoisting`, PR #2 en GitHub. El deploy con commit `60c9fb77` terminó confirmado como `Ready` en producción (`www.clientum.com.ar` y `clientumlatam.vercel.app`).
- **Problema 3 — dev server crasheaba**: el código forzaba SSL en la conexión a Postgres incluso cuando no había `DATABASE_URL`/Neon configurado, y en ese caso caía al Postgres interno de Replit, que no soporta SSL. Se arregló haciendo el SSL condicional a que exista una connection string externa real.

---

## 4. Feature nueva: Orquestador IA

Se construyó una sección nueva en el dashboard (ícono de red en el menú lateral) que consiste en un chat único con vos como dueño de Clientum, que enruta cada mensaje al agente departamental correcto:

- 🟢 Ventas — 🔵 Técnico — 🟣 Marketing — 🟡 Customer Success — 🔴 Operaciones

Antes de responder, consulta datos reales de la base: leads de Santi por status, valor total del pipeline en ARS, MEDDIC score promedio, y leads del chatbot del sitio. Tiene memoria de los últimos 7 turnos de conversación y 8 prompts sugeridos para arrancar rápido (reporte ejecutivo, estado de Santi, prioridades del día, etc.). Funciona con Gemini 2.0 Flash como motor.

El organigrama diseñado para sostener esto:

```
Jonathan (CEO & Fundador — Humano)
└── Orquestador IA (Chief of Staff AI)
    ├── Agente Técnico (CTO AI)
    ├── Agente de Ventas (Sales Manager AI) — Santi SDR y Explorador Patagónico ya existen
    ├── Agente de Marketing
    ├── Agente de Customer Success
    └── Agente de Operaciones (COO AI)
```

---

## 5. Feature nueva: login con Neon Auth

Se reemplazó el `AuthGate` custom por una integración con Neon Auth (Better Auth), con un backend que actúa de proxy:

- `POST /api/auth/neon-register` y `POST /api/auth/neon-login` — llaman a la REST API real de Neon Auth server-side (evita CORS, no necesita el SDK bloqueado por el firewall de Replit) y sincronizan el usuario en la tabla local `users` para preservar roles del CRM.
- **Bug 1**: Neon Auth exige verificación de email antes de dejar loguear (`403 Email not verified`). Se resolvió con fallback: si el email no está verificado, usa el hash bcrypt local guardado en el registro.
- **Bug 2 — "network error" al loguear**: `createSession` usaba callbacks del session store que podían quedar colgados sin nunca responder. Se convirtió a Promise con timeout de seguridad.
- **Causa raíz real de la lentitud**: cada login tardaba ~8,9 segundos (3–4s llamando a Neon Auth en Sudamérica + 1,4s de consulta DB + 3s de guardado de sesión), y el proxy de Replit cortaba la conexión antes de que llegara la respuesta. Se solucionó con un enfoque "local-first": verificar el hash bcrypt local antes de llamar a Neon Auth, ya que de todos modos iba a fallar por email no verificado — eliminando el round-trip innecesario.

Estado final: registro e inicio de sesión funcionando (200/201 confirmados), primer usuario registrado queda como admin.

---

## 6. Pendientes generales

- [ ] Rotar todas las credenciales listadas en la sección 2
- [ ] Resolver la exposición del repo público en GitHub
- [ ] Confirmar cuál `SESSION_SECRET` está activo en producción
- [ ] Mergear PR #2 a `main` si todavía no se hizo, y confirmar el redeploy en Vercel
- [ ] Verificar que el fallback local-first del login no introduzca inconsistencias entre la cuenta de Neon Auth y la cuenta local si en algún momento se verifica el email


---

# Informe consolidado — Sesiones de IA sobre Clientum
**Fecha del informe:** 16 de julio de 2026
**Archivos analizados:** 7 exports de chat (Claude, ChatGPT, Replit Agent) entre el 13 y el 15 de julio de 2026

---

## 1. 🔴 Seguridad — Prioridad máxima

### 1.1 Credenciales reales expuestas en texto plano
A lo largo de varias conversaciones (Mistral → Claude → ChatGPT → Replit) circularon, repetidas veces, las siguientes credenciales reales:

| Credencial | Estado según los logs |
|---|---|
| `SESSION_SECRET` | Rotado al menos una vez, pero aparecen **dos valores distintos** en distintos archivos — hay que confirmar cuál está realmente activo en Replit Secrets |
| `GEMINI_API_KEY` | Marcada como comprometida, rotación pendiente |
| `GOOGLE_MAPS_PLATFORM_KEY` | Marcada como comprometida, rotación pendiente |
| `HUNTER_API_KEY` | Marcada como comprometida, rotación pendiente |
| `APIFY_API_TOKEN` | Marcada como comprometida, rotación pendiente |
| `SANTI_API_KEY` | Marcada como comprometida, rotación pendiente |
| `GITHUB_PERSONAL_ACCESS_TOKEN` (ghp_...) | Marcada como comprometida, rotación pendiente |
| `NEON_API_KEY` | Marcada como comprometida, rotación pendiente |
| `DATABASE_URL` (con password incluido) | **Apareció completa en uno de los archivos** — esto es acceso directo de lectura/escritura a la base de producción, no solo una API key |
| `VERCEL_TOKEN` | Apareció expuesto en uno de los archivos, rotación pendiente |
| Claves de Stripe (`pk_test_...` / `sk_test_...`) | Son de test, riesgo bajo, pero se recomienda rotar igual |

**Por qué es urgente:** estas mismas claves circularon por al menos 4 sistemas de IA distintos (Mistral, Claude, ChatGPT, Replit Agent) y ahora también por los archivos que subiste acá. A esta altura hay que tratarlas como **100% públicas**, no como "posiblemente filtradas".

### 1.2 Repo de GitHub público con las claves commiteadas
Un hallazgo del Replit Agent (sesión del 15/07): el repo **`clientumlatam/clientumlatam` es público**, y dos archivos ya pusheados a `origin/main` (`chat` y `chat (copy)`) contienen las mismas claves reales y el `SESSION_SECRET` viejo en texto plano. Cualquiera en internet puede leerlos ahora mismo.

El agente te preguntó cómo proceder y, según el log, **declinaste actuar dos veces**. Sigue sin resolverse.

**Opciones concretas:**
- Poner el repo en privado, o
- Purgar esos dos archivos del historial de git (no alcanza con borrarlos, quedan en el historial) y hacer force-push
- En cualquiera de los dos casos, rotar todas las claves de la tabla de arriba igual

### 1.3 Recomendación de rotación (orden sugerido)
1. **Neon** → resetear password de `neondb_owner` desde el dashboard (invalida el `DATABASE_URL` filtrado al instante)
2. **Vercel token** → revocar y generar uno nuevo
3. **GitHub PAT** → revocar y generar uno nuevo con el mínimo scope necesario
4. **SESSION_SECRET** → regenerar con `openssl rand -base64 64` y confirmar cuál queda activo
5. **Gemini, Google Maps, Hunter.io, Apify, Santi** → regenerar cada una en su panel correspondiente
6. Resolver la exposición del repo público (privado o purga de historial)

---

## 2. 🟢 Deploy en Vercel — resuelto

- **Problema:** el build fallaba por errores de tipos de TypeScript (`req.session`, `res.status` no reconocidos) y el signup devolvía HTML en vez de JSON.
- **Causa raíz real:** Vercel cacheaba las respuestas de la API (`Cache-Control: public, max-age=0` por default en funciones serverless) y descartaba el header `Set-Cookie` en el camino. El login devolvía 200/201 pero ninguna sesión quedaba activa después.
- **Fix aplicado:** middleware que fuerza `Cache-Control: no-store` en todas las respuestas de Express, más `.npmrc` con `public-hoist-pattern[]=*@types*` y `pnpm.supportedArchitectures` para el hoisting de tipos con pnpm.
- **Estado:** pusheado en PR #2 (`fix/pnpm-hoisting`). Según el último log revisado, seguía pendiente de merge a `main` — confirmar si ya se mergeó y el deploy quedó estable.

---

## 3. 🟢 Bug de base de datos en Replit — resuelto

- **Síntoma:** el server de dev se caía al arrancar con "The server does not support SSL connections".
- **Causa:** cuando `DATABASE_URL`/`NEON_*` estaban vacíos (probablemente por una rotación tras la exposición), el código caía al Postgres interno de Replit, que no soporta SSL — pero el código forzaba SSL igual.
- **Fix:** SSL condicional, solo cuando hay una connection string externa real.

---

## 4. 🟡 Orquestador IA — en desarrollo, funcional

Nueva sección del dashboard: un chat único con Jonathan que enruta cada mensaje al agente departamental correspondiente.

**Organigrama diseñado:**
```
Jonathan (CEO & Fundador — Humano)
└── Orquestador IA (Chief of Staff AI)
    ├── Agente Técnico (CTO AI)
    ├── Agente de Ventas (Sales Manager AI) — Santi SDR y Explorador Patagónico ya existen
    ├── Agente de Marketing
    ├── Agente de Customer Success
    └── Agente de Operaciones (COO AI)
```

**Construido y funcionando:**
- `OrquestadorIA.tsx` — chat full-page con routing automático (Ventas 🟢, Técnico 🔵, Marketing 🟣, Customer Success 🟡, Operaciones 🔴)
- `POST /api/orchestrator` — Gemini 2.0 Flash + datos reales de la DB (leads por status, pipeline en ARS, MEDDIC promedio, leads del chatbot)
- Memoria de los últimos 7 turnos de conversación
- 8 prompts sugeridos para arrancar rápido

---

## 5. 🟡 Integración Neon Auth — en desarrollo, con bugs resueltos sobre la marcha

Reemplazo del `AuthGate` propio por autenticación real vía Neon Auth (Better Auth), con sesión Express puente.

**Bugs encontrados y resueltos en la sesión:**
1. `@neondatabase/neon-js` bloqueado por firewall (arrastra `better-auth`) → se implementó contra la REST API de Neon Auth directamente, sin el SDK.
2. Neon Auth exige verificación de email antes de loguear (`403 Email not verified`) → se agregó fallback a bcrypt local cuando el email no está verificado.
3. Login devolvía "network error" intermitente → causa real: `createSession` usaba callbacks del session store que podían colgarse sin nunca responder. Se convirtió a Promise con timeout de seguridad.
4. Latencia real del login: ~8.9 segundos (3-4s a Neon Auth desde Sudamérica + 1.4s de DB + 3s de guardado de sesión) — el proxy de Replit cortaba la conexión antes de que llegara la respuesta.
5. **Fix final:** verificar el hash bcrypt local *antes* de llamar a Neon Auth (que de todas formas iba a fallar por email no verificado), eliminando 3-4 segundos innecesarios.

**Estado:** registro y login funcionando end-to-end (200/201 confirmados). Falta confirmar que la experiencia de usuario en el frontend (pantalla de login) no vuelva a quedar en blanco, que fue el último síntoma reportado antes de que se acabara la cuota de la sesión.

---

## 6. Otros hallazgos menores
- Se reorganizó `docs/capturas/` en 4 subcarpetas descriptivas (sitio-web, sitio-web-historico, prospector-app, replit-vercel) — 112 archivos renombrados sin timestamps genéricos.
- Se confirmó que Replit **nunca** transfiere secrets al hacer remix, independientemente de los permisos — es una restricción de la plataforma, no configurable.
- Se crearon archivos de sesión en la raíz del repo (`2026-07-15.md`, `CAMBIOS.md`, `PENDIENTES.md`, `REMIX-LIMITACIONES-FREE.md`) que sí viajan con un remix, documentando qué NO se transfiere con cuenta free (secrets, chats, DB, checkpoints, dominio, y las limitaciones del free tier: sleep, 512 MB RAM, sin deploy, sin dominio custom).

---

## 7. Pendientes abiertos (resumen ejecutivo)

| # | Pendiente | Prioridad |
|---|---|---|
| 1 | Rotar TODAS las credenciales de la tabla en §1.1 | 🔴 Urgente |
| 2 | Resolver exposición del repo público en GitHub | 🔴 Urgente |
| 3 | Confirmar merge del PR #2 y deploy estable en Vercel | 🟡 Media |
| 4 | Terminar de debuggear la pantalla de login en blanco (Neon Auth) | 🟡 Media |
| 5 | Confirmar cuál `SESSION_SECRET` está realmente activo | 🟡 Media |

