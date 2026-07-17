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
