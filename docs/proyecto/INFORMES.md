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

