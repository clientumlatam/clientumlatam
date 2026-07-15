# Archivos modificados — sesión 15 de julio de 2026

Detalle de cada archivo creado o modificado durante la sesión. Sin cambios a lógica de negocio.

---

## `.env.example` — reescrito completo

**Antes:** 8 variables, sin descripciones, sin instrucciones de cómo obtener cada key.

**Después:** 16 variables agrupadas por categoría, con descripción de cada una, cómo obtenerla, y sección de variables auto-inyectadas por Replit.

Categorías:
- **Aplicación** — `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`
- **Base de datos** — `DATABASE_URL`, `NEON_API_KEY`, `NEON_PROJECT_ID`
- **Google / IA** — `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_MAPS_PLATFORM_KEY`, `GOOGLE_MAPS_API_KEY`
- **Prospección** — `APIFY_API_TOKEN`, `HUNTER_API_KEY`
- **Integraciones internas** — `CRM_INTERNAL_TOKEN`, `SANTI_API_KEY`
- **Auto-inyectadas por Replit** — `REPLIT_DEPLOYMENT`, `DISABLE_HMR`

---

## `replit.md` — reescrito como referencia de arquitecto

**Antes:** Descripción básica del proyecto.

**Después:** Referencia técnica completa para el rol de arquitecto:
- Stack con versiones exactas
- Estructura de directorios explicada
- Tablas de base de datos y sus columnas principales
- Tabla de variables de entorno con categorías
- Flujo de desarrollo → deploy
- Features implementadas
- Sección de preferencias del usuario

---

## `docs/ARCHITECTURE.md` — creado desde cero

Documento técnico exhaustivo con:

- **Diagrama de arquitectura** en ASCII (browser → Vite → Express → Neon / Gemini / Apify / Hunter)
- **Stack con versiones** — React 19.1, Vite 6, Express 4.21, Node 22, pg 8.13, etc.
- **Estructura de directorios** completa y comentada
- **Schema de base de datos** — 6 tablas: `users`, `clients`, `interactions`, `services`, `client_services`, `system_settings`
- **Tabla de rutas API** — todos los endpoints con método, auth requerida y descripción
- **Flujo CI/CD** — push → GitHub Actions (lint + build) → Vercel deploy desde `main`
- **Decisiones de infraestructura** — por qué hay dos tsconfig, por qué dos entrypoints, cómo se resuelve la DB
- **Notas de seguridad** — secrets que deben rotarse, variables mal configuradas detectadas

---

## `.github/workflows/ci.yml` — creado desde cero

CI que corre en cada `push` y en cada `pull_request` (cualquier rama):

```yaml
jobs:
  lint-and-build:
    - pnpm install (con cache)
    - tsc --noEmit          # TypeScript sin emitir archivos
    - vite build            # Verifica que el frontend compila
```

**Por qué importa:** Atrapa errores de TypeScript antes de que lleguen al build de Vercel. Sin esto, el primer aviso de error era un deploy roto en producción.

---

## `.github/workflows/neon_workflow.yml`

**No modificado.** Ya existía. Crea/elimina branch de Neon por PR.

---

## `.gitignore` — ajustado

**Antes:** `docs/` — toda la carpeta ignorada.

**Después:**
```
docs/**
!docs/ARCHITECTURE.md
!docs/SANTI-SDR.md
```

Ignora capturas de pantalla y exports privados dentro de `docs/`, pero trackea los dos documentos técnicos públicos.

---

## `.agents/memory/clientum-architecture.md` — creado

Topic file de memoria persistente con: toda la arquitectura, variables, decisiones de infra y notas de la sesión para que el agente en futuras sesiones arranque con contexto.
