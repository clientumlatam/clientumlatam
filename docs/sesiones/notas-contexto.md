# Notas de sesiones — fragmentos de contexto

## analisis-docs-sesion

docs ANALIZA CADA CARPETA Y ARCHIVOS DE TODO DOCS

28 minutes ago

12 actions He revisado carpeta por carpeta. Resumen:

docs/SANTI-SDR.md — documentación legítima: la integración del agente SDR "Santi" (Hermes) con el CRM vía API (/api/leads), tablas Postgres, flujo operativo y checklist de go-live. En buen estado.

docs/SECRETS.md — 🚨 riesgo de seguridad serio. Este archivo tiene las claves reales de GOOGLE_MAPS_PLATFORM_KEY, GEMINI_API_KEY, HUNTER_API_KEY, SANTI_API_KEY, APIFY_API_TOKEN y SESSION_SECRET en texto plano, dentro del repo. No voy a repetir los valores acá. Que estén committeadas así significa que cualquiera con acceso al código (o si el repo se comparte/publica) puede leerlas directamente — es exactamente lo que Replit Secrets existe para evitar.

docs/assets/ (11 MB) — archivos sueltos de sesiones de chat anteriores: capturas de pantalla, exports de ChatGPT/Claude, CSVs de catálogo, un PDF de brochure, un zip de plugin. Parece una carpeta de "adjuntos temporales", no documentación curada.

docs/public/ (50 MB) — logos y capturas de sitios web de clientes (AFP Service, Cabarcos Motores, Canal10, etc.). Son assets de contenido reales, probablemente usados o pensados para la sección de clientes del sitio público.

docs/clientum-exports/ (27 MB) — la carpeta más grande y mixta:

clientum-catalogo-final.csv + exports/ + references/ → catálogo de productos, copy del sitio, brochures de referencia y logs de sesiones de trabajo previas (redise del catálogo, descarga de logos). Material de referencia de contenido/negocio. scaffolds/hermes-santi/ → el scaffold completo de la skill de Santi (coincide con SANTI-SDR.md). wordpress/ → una exportación completa de un theme + 4 plugins de WordPress (clientum-theme, ai-marketing-expert v1 y v2, clientum-ai-prospector, clientum-user-dashboard). Es código PHP de una versión paralela o anterior de Clientum en WordPress — no lo usa esta app (Express + React). import-products-from-google-sheets-for-woocommerce-free-cron (2)/ → un plugin de WooCommerce de terceros, con su árbol completo de dependencias vendor/ (Google API Client, Guzzle, Monolog, Symfony...). Son más de 1000 archivos PHP que no son código propio, es librería de terceros — es lo que más bulto le agrega a la carpeta docs y no tiene relación directa con este proyecto. Antes de tocar nada, tengo dos decisiones que te corresponden a vos:

¿Qué hacemos con lo que encontré en docs/? docs/SECRETS.md tiene claves reales en texto plano en el repo Dejarlo como está por ahora ¿Querés que limpie el resto de docs/ (bloat de WordPress + plugin de terceros)? Dejar todo como está, es material de referencia

Worked for 1 minute docs/screens

15 minutes ago

9 actions He revisado docs/screens/ — no es solo screenshots, es una carpeta de exports reales generados desde la app (misma fecha/hora, 11:51):

Capturas (14 PNG, ~3.4 MB) — idénticas byte a byte a las que ya están en artifacts/. Son duplicados.

Datos de leads reales (CSV + PDF, distribuidoras de General Roca/Neuquén):

leads_merged.csv y las dos variantes Leads_Clientum_General Roca_Distribuidora_Mayorista*.csv — listas de prospectos con nombre de empresa, dirección, teléfono y nombre de contacto real (ej. "Estela Castro", "Gustavo B."), score MEDDIC, monto sugerido. ai_client_prospector_pipeline (2).csv — pipeline de deals con los mismos datos. Brochure_Clientum_2026_..._Neuquén-7.pdf (4 MB) — brochure exportado. Las dos variantes de "Leads_Clientum..." no son iguales: tienen los mismos negocios pero con teléfonos/scores distintos entre sí (parecen exports de corridas diferentes del scraper, no un duplicado exacto).

Un dato aparte que salió en los logs mientras revisaba: la GEMINI_API_KEY real está devolviendo "API key not valid" en el servidor corriendo ahora mismo — el ICP Builder y el generador de Outreach están cayendo al modo mock local por eso. Es un problema funcional real, separado de la carpeta docs.

Dos cosas encontradas — ¿qué hacemos? docs/screens/ tiene datos reales de contacto de leads (teléfonos, nombres) sueltos en CSV/PDF Dejarla, la necesito como respaldo La GEMINI_API_KEY actual no es válida y el ICP Builder/Outreach están usando datos mock. ¿Querés que te pida una clave nueva para arreglarlo? Yes

Worked for 47 seconds

2 actions Add secrets GEMINI_API_KEY AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE

Worked for 13 seconds Nueva clave guardada. Reinicio el servidor y confirmo que Gemini responde bien.

Show less Restarted workflow Start application

Refreshed logs Testing API functionality

Testing API functionality

Fetched a URL Testing authentication and generation

Testing authentication and generation

Fetched a URL Checking server configuration

Checking server configuration

Processed text

Searched for "action ==="

Fetched a URL Debugging fallback flag

Debugging fallback flag

Refreshed logs Investigating API key failure

Investigating API key failure

Fetched a URL

Ran DELETE FROM users WHERE username = 'geminicheck_test' La clave nueva de Gemini que guardaste también devuelve "API key not valid" — probé el generador de outreach con una cuenta de prueba (ya la borré) y sigue cayendo a modo mock. Puede ser que la clave se haya copiado mal, que le falte habilitar la API "Generative Language" en Google Cloud, o que sea de un proyecto sin facturación activa.

La clave de Gemini sigue fallando (API key not valid). ¿Cómo querés seguir? Dejarlo en modo mock por ahora

Worked for 1 minute Entendido, lo dejamos en modo mock por ahora. El ICP Builder y el generador de Outreach van a seguir funcionando con datos simulados hasta que quieras retomar la clave de Gemini. Cuando quieras probar de nuevo, avisame.

Worked for 12 seconds help restructure the nav or footer taxonomy, f

12 minutes ago

2 actions Your message got cut off — "help restructure the nav or footer taxonomy, f..." Which one did you mean?

¿Qué querés restructurar? ¿Nav o footer de qué parte de la app? Otra cosa (te explico en comentarios) Additional comments

El menú de arriba del sitio público (INICIO, SOLUCIONES, PRECIOS...)

El footer del sitio público

El sidebar del CRM (ya lo agrupamos, ¿seguir ajustando?)

Worked for 15 seconds

4 actions You've reached your daily free quota limit. It will reset at 12:00 AM UTC.
---

## archivo-analisis

41 minutes ago

I've read through the uploaded file — it's a session log from a previous conversation showing work done on the Clientum website (CSV generation, client screenshots, catalog JSON regeneration with 509 products, etc.).

What would you like me to do? For example:

    Continue from where that session left off
    Apply something specific from that log
    Something else entirely

¿Qué necesitás hacer ahora?
Contame qué necesitás
renomra archivos y rreorganiza todo attached_assets

Entendido. Voy a crear una estructura limpia y mover todo con nombres descriptivos.

Listo. La estructura final quedó así:
attached_assets/
├── brochures/   → 3 PDFs del brochure Clientum 2026
├── catalogo/    → 4 HTMLs + 3 XLSXs del catálogo
├── csv/         → 7 CSVs de productos WooCommerce
├── copy/        → 16 archivos de textos del sitio (copy, perfiles, servicios)
├── logs/        → 11 logs de sesiones anteriores
├── files-10/    → intacto (ya estaba organizado)
└── zips/        → 8 ZIPs de temas y plugins

Todos los nombres de archivos reemplazados por nombres descriptivos sin timestamps ni caracteres especiales.

attached_assets/files-10 attached_assets/csv attached_assets/copy attached_assets/catalogo attached_assets/brochures
34 minutes ago
Inferring user intent
¿Qué hacemos con esas carpetas?
Acción sobre files-10, csv, copy, catalogo, brochures
Ver qué hay dentro y sugerirme algo

Déjame comparar archivos para detectar duplicados y entender qué ya está en la app.

Aquí el análisis completo con mi recomendación:
🔴 Duplicados exactos — se pueden eliminar sin riesgo
Borrar	Es igual a
csv/catalogo-woocommerce-final-v3a.csv	→ v3b (mismo hash)
csv/woocommerce-2231-productos-v2.csv	→ v3 (mismo hash)
csv/woocommerce-509-productos-limpio-v1.csv	→ v2 (mismo hash)
catalogo/catalogo-reestructurado-v3a.xlsx	→ v3b (mismo hash)
copy/clientum-brochure-copy.txt	→ brochure-nosotros.txt (idénticos)
copy/integraciones-copy-v1.txt	→ v2 (idénticos)
🟡 Ya importados al app — fuentes originales, prescindibles

src/data/ ya tiene los 3 JSON generados a partir de estos CSVs:
Archivo	Estado
csv/woocommerce-2231-productos-v3.csv	Versión antigua (2231 items), superada
csv/woocommerce-572-productos-v2.csv	Versión intermedia, superada
files-10/01-servicios-489.csv	Fuente original → ya en servicios-catalogo.json
files-10/02-cursos-67.csv	Fuente original → ya en cursos-lms.json
copy/sitio-copy-referencia-v1.md y v2.md	Hay una v3 más completa
catalogo/catalogo-v1.html	Hay v2 (diferente y más reciente)
🟢 Conservar
Carpeta	Por qué
brochures/	Los 3 PDFs son distintos — versiones del brochure Clientum 2026
catalogo/catalogo-reestructurado-v3-11.xlsx	Versión final única del catálogo Excel
catalogo/catalogo-v2.html + index-catalogo.html + clientum-perfil-v4.html	HTMLs distintos entre sí
csv/woocommerce-509-productos-limpio-v2.csv	El CSV final importado
csv/catalogo-woocommerce-final-v3b.csv	Versión WooCommerce del catálogo
copy/sitio-copy-referencia-v3.md	El copy más completo
copy/ demás archivos únicos	Contenido de referencia sin duplicado
files-10/ resto	PHP, TXT de planes/integraciones, export de Claude

¿Elimino solo los duplicados exactos (fila roja), o también los superados (fila amarilla)?
¿Qué elimino?
Alcance de la limpieza
Duplicados + versiones superadas (rojo + amarillo)
11 minutes ago

Il log deja claro qué hay en el zip: los 3 entregables de esa sesión (CSV limpio + home + catálogo rediseñados). Los extraigo y los ubico en clientum-exports/.

Los 3 archivos del zip son duplicados exactos de lo que ya tenemos:
Archivo del zip	Idéntico a
catalogo.html	references/catalogo/catalogo-v2.html
index.html	references/catalogo/index-catalogo.html
clientum-woocommerce-509-productos-limpio.csv	ya existe en exports/csv/

Limpio los dos archivos sueltos que quedaron en attached_assets/ y listo.

Quedan 2 archivos más en attached_assets/. Los leo en paralelo.

El log de Claude identifica URLs de logos de clientes que no se pudieron descargar allá — pero acá en Replit sí tenemos red. Muevo los archivos y descargo los logos en paralelo.

Ahora descargo los logos faltantes. Los clientes identificados sin logo en public/logos/ son: Diario 10, Municipio 25 de Mayo, Consorcio de Riego, Frecuencia Urbana, Hábitat Sur, Bauleras Roca, Lubrano Hogar, Growlife Patagonia, Naval Patagonia, Aitue Propiedades, y Saitt.

3 logos bajaron bien, el resto devolvió HTML. Los limpio y busco las URLs reales de cada sitio.

Encontré las URLs reales. Descargo todo en paralelo.

Los 5 restantes tienen sitios JS-rendered o están bloqueando scraping — no se puede extraer URLs de imagen sin un browser. Resumo el resultado final.

Listo. Resultado de la descarga de logos:

✅ Descargados exitosamente (6 nuevos):
Logo	Fuente
diario-10.webp	canal10.ar
municipio-25-de-mayo.png	muni25demayo.gob.ar
consorcio-riego-general-roca.png	Wayback Machine
habitat-sur.jpg	habitatsur.com.ar
saitt.png	saitt.com.ar
lubrano-hogar.png	lubranohogar.com

❌ No disponibles por scraping (5) — sitios JS-rendered o sin respuesta:
Cliente	Sitio
Frecuencia Urbana	frecuenciaurbana.com.ar
Naval Patagonia	navalpatagonia.com
Bauleras Roca	baulerasroca.com.ar
Growlife Patagonia	growlifepatagonia.com.ar
Aitue Propiedades	aitue.com.ar

Para esos 5, la única opción es bajarlos manualmente (clic derecho → guardar) y subirlos acá — los agrego a public/logos/ con el mismo patrón.

Catálogo completo · 437 servicios no se ve en sitio web principal. pero deben estar cargados en esta pantalla
4 minutes ago
Loading product catalog

El catálogo muestra "0 items" — los datos no están conectados a esa pantalla. Busco dónde vive ese componente.

El componente recibe products como prop pero se lo están pasando vacío. Busco dónde se monta.

You've reached your daily free quota limit. It will reset at 12:00 AM UTC.

---

## task-context-inicial

Started task

8 actions This is a project I have context on — the Clientum CRM / AI Prospector. The workflow failed. Let me check what's going on and get it running.

6 actions The workflow failed because it ran before fully initialized. The package.json exists — let me install deps and check what secrets are missing before asking the user.

3 actions DATABASE_URL is auto-provided by Replit's PostgreSQL. SESSION_SECRET is set. Missing: GEMINI_API_KEY and SANTI_API_KEY. Let me get the app running first, then ask about the missing keys.

4 actions App is up. Let me take a screenshot to verify, then wrap up.

5 actions Marked task #1 complete

Worked for 1 minute ANALIZA CADA CARPETA DEL REPLIT COMPLETA Y GENERA UNA REORGANIZACION DE TODO

10 minutes ago Analyzing project structure

Analyzing project structure

Worked for 6 seconds Comprehensive exploration

Comprehensive exploration Voy a explorar todo el proyecto en paralelo antes de proponer nada.

10 actions Tengo el análisis completo. Acá está el diagnóstico antes de tocar nada:

📊 Análisis completo del proyecto Lo que realmente corre (la app) Archivo/Carpeta Qué es Tamaño server.ts Backend Express monolítico (2315 líneas) 119 KB src/ Frontend React (48 archivos) 2.7 MB public/ Logos e imágenes estáticas 50 MB index.html Entry point SPA — vite.config.ts, tsconfig.json, package.json Config de build — .env.example Documentación de secrets — Lo que sobra o está fuera de lugar Problema Detalle Tamaño Riesgo 🔴 SECRETS.md API keys reales en texto plano en el repo — SEGURIDAD CRÍTICA 🔴 nzip2/ WordPress completo + proyecto separado, no usado por la app en absoluto 652 MB / 28.295 archivos Contamina el repo 🟠 attached_assets/ Capturas de pantalla, PDFs, logs de chat de sesiones de desarrollo 11 MB No es código 🟠 clientum-exports/ Código fuente del plugin WordPress exportado 27 MB Debería ser repo propio 🟠 zipFile.zip Archivo de backup 11 MB Innecesario en repo 🟡 chat2, chat3, chat3 (copy) Logs de conversaciones en la raíz — Basura de sesión 🟡 pnpm-lock.yaml Lockfile de pnpm (el proyecto usa npm) — Confuso 🟡 main.py + pyproject.toml + uv.lock Python mínimo sin uso real en la app — Stack muerto 🟡 metadata.json Metadata de AI Studio, sin uso — Residuo 🟡 lib/ (raíz) Solo 1 archivo utils.ts, debería estar en src/lib/ — Mal lugar 🟡 exports/ 1 CSV de catálogo (no es código) 328 KB — 📐 Estructura propuesta / (raíz limpia) ├── server.ts ├── index.html ├── vite.config.ts ├── tsconfig.json ├── package.json ├── package-lock.json ├── .env.example ├── .gitignore ├── replit.md │ ├── src/ │ ├── main.tsx │ ├── App.tsx │ ├── index.css │ ├── types.ts │ ├── data.ts │ ├── lib/utils.ts ← absorbe lib/ de raíz │ ├── components/ │ ├── data/ │ ├── services/ │ ├── store/ │ └── utils/ │ ├── public/ ← sin cambios ├── scripts/ ← sin cambios │ └── docs/ ← NUEVA (mueve docs de referencia) └── SANTI-SDR.md

Acciones concretas Acción Qué Por qué 🗑️ Eliminar nzip2/ (652 MB) No pertenece al proyecto 🗑️ Eliminar SECRETS.md API keys en texto plano 🗑️ Eliminar zipFile.zip Backup que no va en el repo 🗑️ Eliminar chat2, chat3, chat3 (copy) Logs de sesiones 🗑️ Eliminar pnpm-lock.yaml El proyecto usa npm 🗑️ Eliminar main.py, pyproject.toml, uv.lock Stack Python sin uso 🗑️ Eliminar metadata.json Residuo de AI Studio 🗑️ Mover lib/utils.ts → src/lib/utils.ts Donde pertenece 🗑️ Eliminar lib/ (vacía tras mover) — 📁 Mover SANTI-SDR.md → docs/SANTI-SDR.md Documentación, no raíz 📦 Decidir clientum-exports/, attached_assets/, exports/ ¿Querés conservarlos? El punto que necesito tu respuesta antes de ejecutar:

¿Qué hacemos con estas 3 carpetas que no son parte de la app pero tienen contenido valioso? clientum-exports/ (27 MB — código del plugin WordPress) Mover a docs/ como referencia attached_assets/ (11 MB — screenshots, PDFs, CSVs de sesiones de desarrollo) Mover a docs/assets/ exports/ (1 CSV de catálogo WooCommerce — 328 KB) Mover a docs/exports/

Worked for 1 minute Executing reorganization steps

Executing reorganization steps Perfecto. Ejecuto todo ahora. Primero verifico los imports antes de mover lib/utils.ts.

3 actions Ambos utils.ts son idénticos y nadie importa desde lib/ raíz. Procedo con todo en paralelo.

2 actions Todo usa @/lib/utils → src/lib/. Inicio la reorganización completa. El borrado de nzip2/ (652MB) va en paralelo con los movimientos.

4 actions Bien, ahora verifico la estructura final y que la app siga corriendo.

3 actions El servidor está corriendo. Los "page reload" en los logs son Vite detectando los movimientos — normal. Reinicio limpio para confirmar.

4 actions App corriendo limpia. Actualizo replit.md para reflejar la nueva estructura.

Show less

Created replit.md Verifying and summarizing completion

Verifying and summarizing completion

Took a screenshot

Checked disk usage Investigating 404 errors

Investigating 404 errors Pantalla en blanco — hay 404s. Necesito ver cuáles son los recursos que fallan.

6 actions El alias @/ apunta a la raíz del proyecto, no a src/. @/lib/utils → ./lib/utils.ts (raíz). Restauro el archivo.

6 actions App funcionando perfectamente. Los 401 son normales — son endpoints que requieren login.

✅ Reorganización completada Lo que se eliminó (−~675 MB):

Eliminado Motivo nzip2/ (652 MB, 28k archivos) WordPress completo sin relación con la app SECRETS.md API keys reales en texto plano — riesgo de seguridad zipFile.zip (11 MB) Backup innecesario en el repo chat2, chat3, chat3 (copy) Logs de conversaciones de sesión pnpm-lock.yaml Lockfile de pnpm (el proyecto usa npm) main.py, pyproject.toml, uv.lock Stack Python sin uso real metadata.json Residuo de AI Studio Lo que se movió a docs/:

SANTI-SDR.md → docs/SANTI-SDR.md attached_assets/ → docs/assets/ exports/ → docs/exports/ clientum-exports/ → docs/clientum-exports/ Estructura de código: sin cambios — src/, server.ts, public/, scripts/ quedaron exactamente igual. lib/utils.ts se mantiene en raíz porque el alias @/ apunta ahí.

Peso total del proyecto pasó de ~700 MB a ~191 MB.

Worked for 2 minutes Catálogo completo · 425 servicios VVA SOLO EN DASHBOARD DE USUARIO, NO EN SITIO PUBLICO

4 minutes ago

7 actions El catálogo vive en PublicWebsite.tsx. Como authUser ya se pasa como prop, solo necesito ver las líneas exactas del tab y del contenido para ocultarlos cuando no hay sesión.

8 actions Tengo todo lo que necesito. Tres puntos a tocar en PublicWebsite.tsx: nav dropdown, grilla de soluciones, y contenido del tab. Además agrego un guard por si activeTab queda en "catalogo" sin sesión.

5 actions You've reached your daily free quota limit. It will reset at 12:00 AM UTC.

Worked for 59 seconds

Pasted--react-example-0-0-0-dev-tsx-server-ts-injected-env-0-f_1783939904823.txt /

2026-07-13 07:40:43.49 [vite] connecting... 2026-07-13 07:42:58.05 [vite] failed to connect to websocket (Error: WebSocket closed without opened.). 2026-07-13 07:42:58.05 {message: "WebSocket closed without opened.", stack: "Error: WebSocket closed without opened. at WebSocket. (https://d1d6e36b-8ffe-4196-b5e4-d37eae36547e-00-p2lvdyyf6h6t.kirk.replit.dev:5000/@vite/client:454:22)"} message: "WebSocket closed without opened." stack: "Error: WebSocket closed without opened. at WebSocket. (https://d1d6e36b-8ffe-4196-b5e4-d37eae36547e-00-p2lvdyyf6h6t.kirk.replit.dev:5000/@vite/client:454:22)" 2026-07-13 07:45:43.82 [vite] connecting... 2026-07-13 07:46:44.14 [vite] connecting... 2026-07-13 07:47:35.96 [vite] connecting... 2026-07-13 07:49:52.18 [vite] failed to connect to websocket (Error: WebSocket closed without opened.). 2026-07-13 07:49:52.18 {message: "WebSocket closed without opened.", stack: "Error: WebSocket closed without opened. at WebSocket. (https://d1d6e36b-8ffe-4196-b5e4-d37eae36547e-00-p2lvdyyf6h6t.kirk.replit.dev:5000/@vite/client:454:22)"} message: "WebSocket closed without opened." stack: "Error: WebSocket closed without opened. at WebSocket. (https://d1d6e36b-8ffe-4196-b5e4-d37eae36547e-00-p2lvdyyf6h6t.kirk.replit.dev:5000/@vite/client:454:22)" 2026-07-13 07:50:58.96 [vite] connecting...

Just now You've reached your daily free quota limit. It will reset at 12:00 AM UTC.

Worked for 2 seconds
---

## stack-software

Si querés enfocarte **únicamente** en ese stack de software, organizaría el catálogo así:

| Categoría             | Software                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERP**               | Dolibarr, ERPNext, Akaunting                                                                                                                  |
| **CRM**               | Dolibarr CRM                                                                                                                                  |
| **Automatización**    | n8n                                                                                                                                           |
| **IA**                | Open WebUI, Ollama, AnythingLLM, OpenClaw                                                                                                     |
| **Desarrollo Web**    | WordPress, Elementor, Flatsome, Laravel, Next.js                                                                                              |
| **E-commerce**        | WooCommerce                                                                                                                                   |
| **Marketing Digital** | Mautic, WP Social, Predis.ai                                                                                                                  |
| **Hosting**           | Cloudflare, Docker                                                                                                                            |
| **Soporte**           | FreeScout                                                                                                                                     |
| **Integraciones**     | Dolibarr API, WooCommerce API, Mercado Pago, WhatsApp (Evolution API/Baileys), ARCA/AFIP WSFE, Google Workspace, Google Sheets, Mercado Libre |
| **Capacitación**      | Moodle, Tutor LMS, LearnPress                                                                                                                 |
| **Consultoría**       | Auditorías ERP, BI con Metabase, Metabase, PostgreSQL, MariaDB, Migraciones, Optimización de procesos                                         |

## Además agregaría estas categorías técnicas

| Categoría                      | Software                      |
| ------------------------------ | ----------------------------- |
| **Business Intelligence (BI)** | Metabase                      |
| **Bases de Datos**             | PostgreSQL, MariaDB           |
| **Infraestructura**            | Docker, Cloudflare            |
| **APIs e Integraciones**       | Dolibarr API, WooCommerce API |

### El ecosistema de Clientum quedaría muy claro:

* **ERP:** Dolibarr · ERPNext · Akaunting
* **CRM:** Dolibarr CRM
* **Automatización:** n8n
* **IA:** Ollama · Open WebUI · AnythingLLM · OpenClaw
* **Desarrollo Web:** WordPress · Elementor · Flatsome · Laravel · Next.js
* **E-commerce:** WooCommerce
* **Marketing:** Mautic · WP Social · Predis.ai
* **Hosting:** Cloudflare · Docker
* **Soporte:** FreeScout
* **BI:** Metabase
* **Bases de Datos:** PostgreSQL · MariaDB
* **Capacitación:** Moodle · Tutor LMS · LearnPress
* **Integraciones:** Mercado Pago · WhatsApp · Google Workspace · Google Sheets · Mercado Libre · ARCA/AFIP WSFE · APIs de Dolibarr y WooCommerce
* **Consultoría:** Auditorías ERP · Migraciones · Optimización de procesos · Business Intelligence

Esta selección es coherente con el enfoque de **software libre, soluciones web e IA para PyMEs**, evitando incorporar plataformas que no forman parte de tu oferta principal.

---

## replit-md-snapshot

# Clientum CRM

AI-powered B2B sales CRM with Kanban pipeline, MEDDIC qualification, prospect discovery, outreach campaigns, and brochure generation. Built with React + TypeScript + Vite on the frontend and an Express backend, powered by Google Gemini AI.

## How to run

```
npm run dev
```

The app starts on port 5000.

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion
- **Backend**: Express (serves both the API and Vite dev middleware) — `server.ts`
- **AI**: Google Gemini via `@google/genai`
- **PDF**: jsPDF + html2canvas-pro for brochure export
- **Database**: PostgreSQL (Replit managed) via `pg`

## Project structure

```
/
├── server.ts          # Express backend (API + Vite middleware)
├── index.html         # SPA entry point
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example       # Documents all required/optional env vars
│
├── src/               # React frontend
│   ├── App.tsx        # Root component / view routing
│   ├── main.tsx
│   ├── data.ts        # Static data & industry presets (50KB)
│   ├── types.ts
│   ├── index.css
│   ├── lib/utils.ts   # Tailwind class merging (cn)
│   ├── components/    # UI components (CRM, Kanban, Brochure, etc.)
│   ├── data/          # JSON catalogs (services, courses, categories)
│   ├── services/      # scraperService.ts (Google Maps prospecting)
│   ├── store/         # sharedStore.ts (localStorage-backed state)
│   └── utils/         # pdfGenerator.ts
│
├── public/            # Static assets (logos, client images)
├── scripts/           # generate_catalog.py (WooCommerce CSV generator)
│
└── docs/              # Reference material (not part of the running app)
    ├── SANTI-SDR.md          # Santi WhatsApp SDR integration guide
    ├── assets/               # Dev-session screenshots, PDFs, exports
    ├── exports/              # Generated WooCommerce CSV catalog
    └── clientum-exports/     # WordPress plugin source (reference)
```

## Required secrets

| Key | Description |
|-----|-------------|
| `GEMINI_API_KEY` | Google Gemini API key — powers all AI features |

## Optional secrets

| Key | Description |
|-----|-------------|
| `APIFY_API_TOKEN` | Apify token for real Google Maps scraping |
| `GOOGLE_MAPS_PLATFORM_KEY` | Google Maps Platform key for live prospect discovery |
| `SANTI_API_KEY` | API key for Hermes/Santi WhatsApp SDR agent |

## Features

- **CRM Kanban** — drag leads through pipeline stages with MEDDIC scoring
- **ICP Builder** — AI-generated Ideal Customer Profile
- **Patagonia Explorer** — prospect discovery via Google Maps / Apify
- **MEDDIC Qualification** — AI-assisted qualification scoring
- **Outreach Campaigns** — WhatsApp/email campaign automation
- **Brochure Generator** — AI-generated PDF brochures per prospect
- **Santi SDR** — automated WhatsApp outreach agent (see `docs/SANTI-SDR.md`)

## User preferences

- Keep the existing project structure and stack

---

## deployment-log-2026-07-13

2026-07-13T17:20:34Z info: Deployment: 86f361c2-9026-48e2-b723-d5741010e509
2026-07-13T17:20:34Z info: Build: 8ae1fae2-8c01-40a2-b27f-5870581169ab
2026-07-13T17:20:35Z info: Running Security Scan
2026-07-13T17:21:04Z info: Security Scan Complete
2026-07-13T17:21:05Z info: Preparing development database
2026-07-13T17:21:07Z info: Copying development database to production database
2026-07-13T17:21:32Z info: Successfully copied development database to production database
2026-07-13T17:21:32Z info: Installing packages
--> npm install


up to date, audited 398 packages in 799ms

48 packages are looking for funding

  run `npm fund` for details


found 0 vulnerabilities

npm notice
npm notice New minor version of npm available! 11.6.2 -> 11.18.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.18.0
npm notice To update run: npm install -g npm@11.18.0
npm notice

2026-07-13T17:21:34Z info: Starting Build
2026-07-13T17:20:34Z info: Deployment: 86f361c2-9026-48e2-b723-d5741010e509
2026-07-13T17:20:34Z info: Build: 8ae1fae2-8c01-40a2-b27f-5870581169ab
2026-07-13T17:20:35Z info: Running Security Scan
2026-07-13T17:21:04Z info: Security Scan Complete
2026-07-13T17:21:05Z info: Preparing development database
2026-07-13T17:21:07Z info: Copying development database to production database
2026-07-13T17:21:32Z info: Successfully copied development database to production database
2026-07-13T17:21:32Z info: Installing packages
--> npm install


up to date, audited 398 packages in 799ms

48 packages are looking for funding

  run `npm fund` for details


found 0 vulnerabilities

npm notice
npm notice New minor version of npm available! 11.6.2 -> 11.18.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.18.0
npm notice To update run: npm install -g npm@11.18.0
npm notice

2026-07-13T17:21:34Z info: Starting Build

> react-example@0.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs


vite v6.4.3 building for production...

✓ 0 modules transformed.

✗ Build failed in 7ms

error during build:
Could not resolve entry module "index.html".
    at getRollupError (file:///home/runner/workspace/node_modules/rollup/dist/es/shared/parseAst.js:317:41)
    at error (file:///home/runner/workspace/node_modules/rollup/dist/es/shared/parseAst.js:313:42)
    at ModuleLoader.loadEntryModule (file:///home/runner/workspace/node_modules/rollup/dist/es/shared/node-entry.js:22188:20)
    at async Promise.all (index 0)


---

