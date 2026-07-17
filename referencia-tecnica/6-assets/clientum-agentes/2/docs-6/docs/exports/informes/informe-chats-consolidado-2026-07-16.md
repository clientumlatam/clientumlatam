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

