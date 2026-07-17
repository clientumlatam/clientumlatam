# 🔑 API Keys por Agente — Clientum CRM

> Referencia rápida de qué credencial usa cada agente o módulo del sistema.
> Todas las variables se configuran como secrets en Replit (y deben sincronizarse a Vercel vía `scripts/sync-secrets.mjs`).

---

## 🤖 Motor de IA central (`/api/generate` · `/api/orchestrator`)

Todos los agentes de IA del frontend pasan por el dispatcher `generateAny` en `server.ts`.
El sistema prueba los proveedores en cascada:

| Prioridad | Proveedor | Variable de entorno | Modelos usados |
|-----------|-----------|---------------------|----------------|
| 1 (principal) | **Google Gemini** | `GEMINI_API_KEY` → fallback a `GEMINI_API_KEY_V2` | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash-lite` |
| 2 (fallback) | **Groq** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| 3 (fallback) | **OpenRouter** | `OPENROUTER_API_KEY` | `llama-3.1-8b-instruct:free`, `qwen3-8b:free`, `mistral-7b-instruct:free`, `gemma-3-12b-it:free` |
| 4 (local) | Fallback interno | — | Respuestas heurísticas sin LLM |

> Si `GEMINI_API_KEY` está vacía o es `"MY_GEMINI_API_KEY"`, el sistema salta directo al fallback Groq.

---

## 🧑‍💼 Agentes específicos

### Santi SDR (`OrquestadorIA` › Ventas)
**Archivo:** `server.ts` — rutas `/api/santi/*`

| Variable | Uso |
|----------|-----|
| `SANTI_API_KEY` | Autenticación server-to-server: toda petición a `/api/santi/*` debe incluir este token en el header `Authorization`. Sin él, la ruta devuelve `401`. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Motor de generación de mensajes de prospección (vía `generateAny`). |

---

### Explorador Patagónico (`OrquestadorIA` › Ventas)
**Archivo:** `server.ts` — rutas de prospección/scraping

| Variable | Uso |
|----------|-----|
| `GOOGLE_MAPS_PLATFORM_KEY` | Búsqueda de empresas y lugares en Google Maps para construir listas de prospectos. |
| `APIFY_API_TOKEN` | Scraping web (LinkedIn, directorios, etc.) para enriquecer perfiles de empresa. |
| `HUNTER_API_KEY` | Búsqueda y verificación de emails corporativos de contactos encontrados. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Generación de mensajes de outreach personalizados. |

---

### Asistente IA (`AsistenteIA.tsx`)
**Función:** Copilot lateral de ventas y calificación de leads

| Variable | Uso |
|----------|-----|
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Respuestas de asesoramiento (vía `generateAny`). |

---

### Sales Assistant Chat (`SalesAssistantChat.tsx`)
**Función:** Asesor especializado para conversión de brochures

| Variable | Uso |
|----------|-----|
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Generación de respuestas (vía `generateAny`). |

---

### Chatbot Simulator (`ChatbotSim.tsx`)
**Función:** Chatbot de cara al cliente / virtual advisor

| Variable | Uso |
|----------|-----|
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Respuestas conversacionales (vía `generateAny`). |

---

### Agente de imágenes (generación visual)
**Endpoint:** `/api/generate-image`

| Variable | Uso |
|----------|-----|
| `GEMINI_API_KEY` | Modelo `gemini-2.5-flash-image` para generación de imágenes. |

---

## 🏗️ Infraestructura y servicios de soporte

### Base de datos
| Variable | Uso |
|----------|-----|
| `NEON_DATABASE_URL` | Conexión directa al pool de Neon (preferida). |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | Se usan para resolver la URL de conexión pooled dinámicamente si `NEON_DATABASE_URL` no está seteada. |
| `DATABASE_URL` | URL legacy / Replit DB (fallback si las anteriores faltan). |

### Autenticación
| Variable | Uso |
|----------|-----|
| `SESSION_SECRET` | Firma de sesiones Express. **Requerido** — el servidor lanza error si falta. |
| `VITE_NEON_AUTH_URL` | URL del proxy de Neon Auth para registro/login por email. Si no está seteada, usa auth local con bcrypt. |
| `JWKS_URL` | Verificación de tokens JWT (si se usa autenticación externa). |

### Email (SMTP)
| Variable | Uso |
|----------|-----|
| `SMTP_USER` | Usuario Gmail para envío de emails transaccionales (invitaciones, notificaciones). |
| `SMTP_PASS` | Contraseña de aplicación Gmail. Ambas son requeridas — si faltan, el envío lanza error. |
| `APP_URL` | URL base para construir links en emails (default: `https://clientum.com.ar`). |

### Plugin / Webhook CRM
| Variable | Uso |
|----------|-----|
| `CRM_INTERNAL_TOKEN` | Token compartido para autenticar webhooks del plugin WordPress (`X-CRM-Token` header). |

### Despliegue y sincronización
| Variable | Uso |
|----------|-----|
| `VERCEL_TOKEN` | Usado por `scripts/sync-secrets.mjs` para propagar secrets de Replit a Vercel automáticamente. |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Acceso al repo privado `nzip2` (catálogo maestro de servicios con 2147 registros). |
| `PORT` | Puerto en que escucha el servidor Express (Replit lo inyecta automáticamente). |
| `REPLIT_DEPLOYMENT` | Flag que indica si el entorno es producción Replit vs. local. |

---

## 📋 Resumen visual

```
Agente                    │ Gemini │ Groq │ OpenRouter │ Santi │ Maps │ Apify │ Hunter │ Otras
──────────────────────────┼────────┼──────┼────────────┼───────┼──────┼───────┼────────┼──────
Santi SDR                 │  ✅    │  ✅  │    ✅      │  🔐   │      │       │        │
Explorador Patagónico     │  ✅    │  ✅  │    ✅      │       │  ✅  │  ✅   │  ✅    │
Asistente IA              │  ✅    │  ✅  │    ✅      │       │      │       │        │
Sales Assistant Chat      │  ✅    │  ✅  │    ✅      │       │      │       │        │
Chatbot Simulator         │  ✅    │  ✅  │    ✅      │       │      │       │        │
Agente de Imágenes        │  ✅    │      │            │       │      │       │        │
```

> 🔐 `SANTI_API_KEY` es el token de autenticación de las rutas del agente, no un proveedor de LLM.

---

## ⚠️ Notas importantes

1. **Cascada de fallback:** si `GEMINI_API_KEY` falla o no está configurada, el sistema intenta Groq, luego OpenRouter, luego respuesta local. Los agentes funcionan aunque falte alguna clave, pero con menor calidad.
2. **Vercel no hereda secrets de Replit:** deben sincronizarse manualmente con `node scripts/sync-secrets.mjs` o desde el panel de Vercel. Ver [`vercel-external-db-secrets.md`](../../.agents/memory/vercel-external-db-secrets.md).
3. **`SANTI_API_KEY` es auth, no LLM:** protege las rutas `/api/santi/*` de acceso no autorizado.
4. **`APIFY_API_TOKEN` y `HUNTER_API_KEY` son requeridas para el Explorador Patagónico:** sin ellas, el scraping y la búsqueda de emails lanza error explícito (no silencia el fallo).
