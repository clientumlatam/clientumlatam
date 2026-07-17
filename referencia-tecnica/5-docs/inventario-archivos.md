# Inventario de archivos — Clientum CRM (Replit)

> Generado el 15/07/2026. Documenta todos los archivos y carpetas relevantes del repl, qué son y para qué sirven. No incluye contenido de archivos generados/instalados (`node_modules`, `dist`, lockfiles binarios) ni el contenido sensible de archivos con datos privados — esos se listan como referencia, sin transcribir su contenido.

---

## 1. Código de la aplicación

### Raíz / entrypoints
| Archivo | Qué es |
|---|---|
| `server.ts` | Servidor Express (Node 22). Entrypoint en desarrollo (`npm run dev`, vía `tsx`) y base del bundle de producción (`dist/server.mjs`). Define rutas API, sesión, conexión a Postgres/Neon. |
| `index.html` | HTML raíz que Vite usa para montar la SPA de React. |
| `vite.config.ts` | Configuración de Vite (build del frontend, alias, plugins React + Tailwind). |
| `tsconfig.json` | Configuración de TypeScript del proyecto principal. |
| `vercel.json` | Configuración de deploy en Vercel (rutas, runtime de las funciones serverless). |
| `package.json` / `pnpm-lock.yaml` | Manifiesto de dependencias (29 deps + 7 devDeps) y lockfile de pnpm. |
| `.npmrc` | Configuración de pnpm/npm para el proyecto. |
| `replit.nix` | Paquetes a nivel sistema operativo que Replit instala (Nix). |
| `.replit` | Configuración de Replit: módulos habilitados, workflows, puertos expuestos, target de deploy (Cloud Run). |
| `.replit (copy)` | Copia manual de `.replit` — no la usa ninguna herramienta; es redundante. |
| `.gitignore` | Excluye `node_modules`, `dist`, `.env*`, `attached_assets/`, `docs/**` (salvo `ARCHITECTURE.md` y `SANTI-SDR.md`), `SECRETS.md`. |

### `api/` — entrypoint serverless de Vercel
| Archivo | Qué es |
|---|---|
| `api/index.ts` | Envoltorio que expone la misma app Express como Vercel Function. |
| `api/tsconfig.json` | `moduleResolution: node16`, requerido específicamente por el build de Vercel. |

### `src/` — frontend React
| Ruta | Qué es |
|---|---|
| `src/main.tsx` | Punto de entrada de React, monta `<App />`. |
| `src/App.tsx` | Componente raíz; enruta entre landing pública, login y CRM según estado interno (no usa React Router). |
| `src/types.ts`, `src/data.ts` | Tipos compartidos y datos estáticos de referencia. |
| `src/index.css` | Estilos globales (Tailwind CSS v4). |
| `src/components/AsistenteIA.tsx` | Asistente de ventas con IA. |
| `src/components/AuthGate.tsx` | Guard de autenticación para rutas privadas del CRM. |
| `src/components/BrochurePreview.tsx` | Preview del brochure PDF generado por IA. |
| `src/components/ChatbotSim.tsx` | Simulador de chatbot para demo. |
| `src/components/InteractiveAIChat.tsx` | Chat interactivo con Gemini. |
| `src/components/InteractiveCRMKanban.tsx` | Pipeline Kanban interactivo (demo pública). |
| `src/components/PublicWebsite.tsx` | Landing page pública por industria. |
| `src/components/SalesAssistantChat.tsx` | Chat del "Asesor Comercial IA". |
| `src/components/SalesProspectorDashboard.tsx` | Dashboard del Explorador Patagónico (prospección). |
| `src/components/SidebarCRM.tsx`, `SidebarEditor.tsx` | Barra lateral de navegación del CRM y su editor. |
| `src/components/sidebar-tabs/ActivityTab.tsx`, `QuickCreateTab.tsx` | Pestañas del sidebar (actividad reciente, alta rápida). |
| `src/components/ui/*.tsx` | Componentes UI reutilizables (badge, button, card, dialog, input, select) basados en Radix. |
| `src/components/crm-full/*` | CRM completo: Pipeline, Leads, Dashboard, Productos, Vendedores, Sucursales, CMDB, Conversaciones, config del bot, casos de uso, más `crmInitialData.ts`, `crmTypes.ts`, `crmWordpressStack.ts` (tipos/datos/stack del plugin WordPress). |
| `src/data/categorias-servicios.json`, `cursos-lms.json`, `servicios-catalogo.json` | Catálogos de servicios/cursos usados por el CRM y la landing. |
| `src/services/scraperService.ts` | Cliente HTTP hacia `/api/scrape-places` (scraping de Google Maps vía backend). |
| `src/store/sharedStore.ts` | Estado compartido persistido en `localStorage`. |
| `src/utils/pdfGenerator.ts` | Generación de brochures PDF (jsPDF + html2canvas-pro). |
| `src/lib/utils.ts` | Helpers genéricos (ej. `cn()` para clases Tailwind). |
| `src/assets/images/*.jpg` | Logos de Clientum. |

### `lib/`
| Archivo | Qué es |
|---|---|
| `lib/utils.ts` | Helper compartido fuera de `src/` (usado por config/build, no por el frontend). |

### `scripts/`
| Archivo | Qué es |
|---|---|
| `scripts/generate_catalog.py` | Script Python que regenera el catálogo de servicios JSON desde datos fuente. |

---

## 2. Infraestructura / CI

| Archivo | Qué es |
|---|---|
| `.github/workflows/ci.yml` | GitHub Action: `tsc --noEmit` + `vite build` en cada PR/push, bloquea merges rotos. |
| `.github/workflows/neon_workflow.yml` | GitHub Action: crea una branch de Neon por cada PR (`preview/pr-N`), expira a los 14 días. |
| `.env.example` | Referencia completa de variables de entorno con **placeholders**, no valores reales — documenta cómo obtener cada clave. |
| `.env-ejemplo.html` | Versión HTML del mismo ejemplo de variables de entorno. |

---

## 3. Documentación (`docs/`, solo `ARCHITECTURE.md` y `SANTI-SDR.md` están trackeados en git; el resto está en `.gitignore`)

| Ruta | Qué es | ¿En git? |
|---|---|---|
| `docs/ARCHITECTURE.md` | Arquitectura técnica completa del proyecto. | Sí |
| `docs/SANTI-SDR.md` | Documentación de la integración del agente SDR Santi/Hermes (WhatsApp). | Sí |
| `docs/capturas/` (112 archivos) | Capturas de pantalla organizadas por tema (prospector-app, replit-vercel, sitio-web, sitio-web-histórico). | No |
| `docs/catalogo/` | CSVs/XLSX de catálogos de productos, leads y WooCommerce (múltiples versiones). | No |
| `docs/brochure/` | PDFs de ejemplo de brochures generados y un ZIP de referencia. | No |
| `docs/sitio/` | HTML/CSV de referencia del sitio público (catálogo, textos, páginas). | No |
| `docs/public/` | Assets públicos (logos, fotos de clientes). | No |
| `docs/sesiones/` | Exports de sesiones de chat con otras IAs (ChatGPT/Claude), logs de deploy, notas de análisis — **contenido privado, no debería subirse a ningún lado fuera de este repl**. | No |
| `docs/clientum-exports/` (1275 archivos) | Exports masivos: referencias, scaffolds, material del theme de WordPress. | No |

## Documentos de sesión en la raíz (creados por una sesión previa del agente)

| Archivo | Qué es |
|---|---|
| `2026-07-15.md` | Bitácora/resumen de la sesión de trabajo del día. |
| `CAMBIOS.md` | Changelog de cambios aplicados. |
| `PENDIENTES.md` | Lista de tareas pendientes (incluye la rotación de claves aún no resuelta). |
| `REMIX-LIMITACIONES-FREE.md` | Notas sobre limitaciones del plan free al hacer remix del repl. |
| `README.md` | Presentación general del repo (lo que ve alguien en GitHub). |
| `replit.md` | Memoria del proyecto para el agente: stack, estructura, variables de entorno, preferencias del usuario. |

---

## 4. ⚠️ Archivos con contenido sensible (atención)

| Archivo | Estado | Riesgo |
|---|---|---|
| `chat` | Trackeado en git, **pusheado a `origin/main`** (repo público `clientumlatam/clientumlatam`) | Contiene fragmentos de conversaciones internas. |
| `chat (copy)` | Trackeado en git, **pusheado a `origin`** | Contiene un volcado de `.env` con claves reales en texto plano (ya reportado antes). **Repo público → claves expuestas públicamente.** |
| `attached_assets/` (127 archivos) | Ignorado por git (no llega al repo), pero vive sin cifrar en el filesystem del repl | Varios de estos archivos son exports de chats externos con las mismas claves reales pegadas en texto plano. |

Esto ya te lo señalé antes y dijiste que por ahora no tocáramos nada — queda documentado acá para que no se pierda de vista, sin volver a insistir.

---

## 5. Artefactos (`artifacts/`)

| Ruta | Qué es |
|---|---|
| `artifacts/mockup-sandbox/` | Sandbox de Vite para prototipar componentes UI en el Canvas de Replit (servidor de preview aislado). Su `node_modules/` (~26.900 archivos) y `.vite`/`.vite-temp` son generados, no se listan en detalle. |
| `artifacts/mockup-sandbox/src/components/ui/*.tsx` | Librería de componentes shadcn/Radix disponible para armar mockups. |
| `artifacts/mockup-sandbox/src/hooks/`, `src/lib/utils.ts` | Hooks y helpers del sandbox. |
| `artifacts/mockup-sandbox/vite.config.ts`, `tsconfig.json` | Configuración propia del sandbox, independiente del proyecto principal. |

## 6. Otras carpetas de configuración del entorno (no son parte del código de la app)

| Carpeta | Qué es |
|---|---|
| `.agents/` | Skills del agente de Replit (instrucciones reutilizables) y memoria persistente (`.agents/memory/`). |
| `.local/` | Skills provistas por la plataforma Replit. |
| `.canvas/assets/` | Imágenes usadas en el Canvas de Replit. |
| `.cache/`, `.config/` | Cachés y configuración de herramientas, generados automáticamente. |
| `node_modules/`, `dist/` | Dependencias instaladas y build de producción — regenerables, no se versionan en detalle. |

---

## Resumen rápido
- **714 archivos trackeados en git** (excluyendo `node_modules`).
- El código de producto vive en `server.ts`, `api/`, `src/` — todo lo demás es documentación, config de infraestructura, o material de trabajo (catálogos, capturas, exports de chat).
- Los dos puntos que siguen pendientes de tu decisión: qué hacer con `chat` / `chat (copy)` (claves reales en un repo público) y con los archivos de `attached_assets/` que contienen lo mismo.
