# Build — Implementación del sistema de agentes Clientum

> Guía completa en orden de ejecución para replicar el sistema desde cero.

---

# Índice de implementación — Sistema de Agentes Autónomos Clientum

Este set de documentos es la especificación completa para que Replit Agent
construya, desde cero, el sistema de agentes IA descripto en
`docs/ia/agentes/clientum-agentes/ORGANIGRAMA.md` y `docs/ia/agentes/clientum-agentes/SETUP.md`.
Esos dos archivos ya existen en el repo y son la fuente de verdad de la taxonomía
(qué agentes hay, quién depende de quién). Este set NO los reemplaza: los implementa.

También asume que ya existen, por cada agente, los 4 archivos de contexto:
`identidad.md`, `memoria.md`, `proceso.md`, `skill.md` (carpetas bajo
`docs/ia/agentes/clientum-agentes/<departamento>/[<sub-agente>/]`). Si algún agente todavía no
tiene esos 4 archivos, hay que crearlos primero (ver plantilla en el
archivo 03) — el script de ejecución depende de que existan.

## Orden recomendado de implementación

1. **01-ESTRUCTURA-DEL-REPO.md** — crear la estructura de carpetas y archivos
   base antes de tocar código.
2. **07-VARIABLES-ENTORNO-SECRETS.md** — conseguir y cargar todas las API
   keys en GitHub Secrets. Sin esto nada del resto funciona.
3. **03-SCRIPT-RUN-AGENTES-MJS.md** — el corazón del sistema:
   `scripts/run-agentes.mjs`. Implementa primero el modo orquestador
   (ruteo de issues), después el modo ejecución de agente.
4. **02-GITHUB-ACTIONS-WORKFLOW.md** — el workflow que dispara el script
   cada 15 min y maneja permisos/labels.
5. **04-INTEGRACIONES-POR-AGENTE.md** — una vez el loop básico funciona
   (un agente puede leer un issue, comentar y cerrarlo), sumar las
   integraciones reales (WhatsApp, CRM API, Apify, Hunter, etc.) agente
   por agente, empezando por Santi SDR y Backend/Infra que son los de
   mayor volumen de uso.
6. **05-COORDINACION-MULTI-AGENTE.md** — una vez cada agente funciona
   individualmente, sumar la lógica de que un resultado dispare trabajo
   en otro departamento (ej. Ventas → Técnico).
7. **06-NOTIFICACIONES-PROACTIVAS.md** — por último, la notificación a
   Jonathan cuando algo termina, sin que tenga que revisar el tablero
   manualmente.

## Criterio de "listo"

El sistema está completo cuando:
- Un Issue con label `agente:orquestador` se re-etiqueta solo dentro de
  15 min al agente correcto.
- Ese agente lo procesa en la corrida siguiente, comenta el resultado,
  actualiza su `memoria.md` y cierra el issue si escribió `ESTADO: DONE`.
- Si la tarea generaba trabajo en otro departamento, se abre un issue
  nuevo automáticamente con ese label.
- Jonathan recibe un aviso (no tiene que ir a mirar GitHub) cuando el
  issue original se cerró.

## Agentes a implementar (de ORGANIGRAMA.md)

| Carpeta (label) | Departamento padre |
|---|---|
| `orquestador` | — (raíz) |
| `tecnico` | — |
| `tecnico/backend-infra` | Técnico |
| `tecnico/frontend-ux` | Técnico |
| `tecnico/ia-automatizacion` | Técnico |
| `ventas` | — |
| `ventas/santi-sdr` | Ventas |
| `ventas/explorador-patagonico` | Ventas |
| `marketing` | — |
| `marketing/seo-contenido` | Marketing |
| `customer-success` | — |
| `customer-success/asesor-comercial-ia` | Customer Success |
| `operaciones` | — |
| `operaciones/finanzas-admin` | Operaciones |

(`Jonathan (Closer)` es humano, no lleva agente.)

---

# Estructura del repo — clientum-agentes

```
clientum-agentes/
├── .github/
│   └── workflows/
│       └── agentes.yml              # cron cada 15 min, ver archivo 02
├── scripts/
│   ├── run-agentes.mjs              # motor principal, ver archivo 03
│   ├── lib/
│   │   ├── github.mjs               # wrapper Octokit (issues, labels, comments)
│   │   ├── gemini.mjs               # wrapper llamadas a Gemini
│   │   ├── roster.mjs               # carga el árbol de docs/agentes/** en memoria
│   │   ├── integraciones/           # un archivo por herramienta externa
│   │   │   ├── whatsapp.mjs
│   │   │   ├── crm-api.mjs
│   │   │   ├── apify.mjs
│   │   │   ├── hunter.mjs
│   │   │   ├── google-maps.mjs
│   │   │   ├── wordpress.mjs
│   │   │   ├── neon.mjs
│   │   │   └── notificaciones.mjs   # ver archivo 06
│   │   └── coordinacion.mjs         # ver archivo 05
│   └── package.json                 # dependencias del script (separado del CRM)
├── docs/
│   └── agentes/                     # YA EXISTE — no tocar taxonomía, solo leer
│       ├── ORGANIGRAMA.md
│       ├── SETUP.md
│       ├── orquestador/{identidad,memoria,proceso,skill}.md
│       ├── tecnico/{identidad,memoria,proceso,skill}.md
│       │   ├── backend-infra/{identidad,memoria,proceso,skill}.md
│       │   ├── frontend-ux/{...}.md
│       │   └── ia-automatizacion/{...}.md
│       ├── ventas/{...}.md
│       │   ├── santi-sdr/{...}.md
│       │   └── explorador-patagonico/{...}.md
│       ├── marketing/{...}.md
│       │   └── seo-contenido/{...}.md
│       ├── customer-success/{...}.md
│       │   └── asesor-comercial-ia/{...}.md
│       └── operaciones/{...}.md
│           └── finanzas-admin/{...}.md
└── README.md
```

## Reglas de esta estructura

- `scripts/` es un paquete Node independiente del CRM (`clientum-crm`repo).
  Tiene su propio `package.json` con Octokit (`@octokit/rest`) y el SDK de
  Gemini (`@google/genai`) como únicas dependencias fuertes.
- Cada archivo en `scripts/lib/integraciones/` expone funciones puras que
  reciben credenciales por parámetro (nunca leen `process.env` directamente
  adentro) — así se pueden testear sin secrets reales.
- `docs/agentes/**` es la única fuente de verdad de identidad/memoria/proceso
  /skill. El script NUNCA hardcodea lógica de negocio de un agente: siempre
  la lee de ahí y se la pasa a Gemini como contexto.
- Cada `memoria.md` se actualiza por **append**, nunca se reescribe entero —
  es el historial real de lo que hizo el agente, se usa como auditoría.

---

# Workflow — .github/workflows/agentes.yml

## Objetivo
Correr `scripts/run-agentes.mjs` cada 15 minutos, con permisos para leer/
escribir Issues, comentar, etiquetar y commitear cambios en `memoria.md`.

## Trigger
- `schedule: cron: "*/15 * * * *"` (ajustable a 30-60 min si el volumen de
  issues es bajo — ver costo en SETUP.md punto 7)
- `workflow_dispatch:` para poder correrlo manualmente a demanda desde el
  tab Actions (útil para debug)

## Permisos
```yaml
permissions:
  issues: write
  contents: write
  pull-requests: write   # solo si en el futuro algún agente abre PRs
```
Esto requiere además que en **Settings → Actions → General → Workflow
permissions** esté marcado "Read and write permissions" (SETUP.md punto 4).

## Pasos del job

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22.x, igual que el CRM)
3. `npm ci` dentro de `scripts/`
4. Ejecutar `node scripts/run-agentes.mjs`
   - Variables de entorno inyectadas desde Secrets (ver archivo 07)
   - El script hace TODO el trabajo en una sola invocación: lee issues
     abiertos, rutea los que están en `agente:orquestador`, ejecuta los que
     ya están asignados a un agente, actualiza memorias
5. Si el script tocó algún `memoria.md`, commitear y pushear con
   `git config user.name "clientum-agentes-bot"` y un mensaje tipo
   `chore(memoria): update <agente> tras issue #<n>`

## Concurrencia
Agregar:
```yaml
concurrency:
  group: agentes-run
  cancel-in-progress: false
```
para evitar que dos corridas se pisen si una tarda más de 15 min (no debería
pasar, pero es la salvaguarda barata).

## Manejo de errores
- Si `run-agentes.mjs` tira una excepción no controlada para un issue
  puntual, el script debe capturarla, comentar en ese issue
  `⚠️ Error interno, reintentando en la próxima corrida` y seguir con el
  resto — un issue roto no debe frenar el loop completo.
- Si falla la autenticación de Gemini o GitHub (credenciales inválidas), sí
  debe fallar el job entero (para que se vea rojo en Actions y Jonathan se
  entere por el mail que manda GitHub automáticamente ante un job fallido).

---

# scripts/run-agentes.mjs — motor de ejecución

## Resumen
Un único script Node (ESM) que corre cada 15 min vía GitHub Actions y hace
dos cosas, en este orden:

1. **Modo Orquestador**: rutea issues nuevos con label `agente:orquestador`
   al agente correcto.
2. **Modo Ejecución**: procesa issues ya etiquetados `agente:<carpeta>` que
   sigan abiertos.

## Paso 0 — Cargar el roster

`lib/roster.mjs` recorre `docs/agentes/**` y arma un árbol en memoria:

```js
{
  "orquestador": { identidad, memoria, proceso, skill, hijos: [] },
  "tecnico": { identidad, memoria, proceso, skill, hijos: [
      "tecnico/backend-infra", "tecnico/frontend-ux", "tecnico/ia-automatizacion"
  ]},
  "tecnico/backend-infra": { identidad, memoria, proceso, skill, hijos: [] },
  // ... resto de agentes según ORGANIGRAMA.md
}
```
Cada valor de `identidad/memoria/proceso/skill` es el contenido crudo del
`.md` correspondiente. Este roster se le pasa completo a Gemini en el modo
Orquestador (es el "ROSTER cerrado de agentes" que menciona
`orquestador/proceso.md`), y solo la porción de la carpeta correspondiente
en el modo Ejecución.

## Paso 1 — Modo Orquestador

```js
const issues = await github.listOpenIssues({ label: "agente:orquestador" });
for (const issue of issues) {
  const decision = await gemini.decidirAgente({
    roster,                       // árbol completo, solo identidad+skill (no memoria, para no gastar contexto)
    instruccion: `${issue.title}\n\n${issue.body}`,
  });
  // decision.carpeta debe ser una key válida del roster (validar con Set)
  if (!roster[decision.carpeta]) {
    await github.comment(issue, "⚠️ No pude determinar un agente válido, requiere revisión manual de Jonathan.");
    await github.addLabel(issue, "necesita-revision");
    continue;
  }
  await github.removeLabel(issue, "agente:orquestador");
  await github.addLabel(issue, `agente:${decision.carpeta}`);
  await github.comment(issue, `Asignado a **${decision.carpeta}**. Motivo: ${decision.motivo}`);
  await memoria.append("orquestador", `Issue #${issue.number} ruteado a ${decision.carpeta} — ${decision.motivo}`);
}
```

El prompt a Gemini para `decidirAgente` debe forzar salida JSON estricta
(ver `<structured_outputs_in_xml>` si se usa la API directa): `{"carpeta": "...", "motivo": "..."}`.

## Paso 2 — Modo Ejecución

```js
for (const carpeta of Object.keys(roster)) {
  const issues = await github.listOpenIssues({ label: `agente:${carpeta}` });
  for (const issue of issues) {
    const agente = roster[carpeta];
    const resultado = await gemini.ejecutarTarea({
      identidad: agente.identidad,
      memoria: agente.memoria,
      proceso: agente.proceso,
      skill: agente.skill,
      instruccion: `${issue.title}\n\n${issue.body}`,
      comentariosPrevios: await github.listComments(issue), // continuidad si ya se venía trabajando
    });

    // resultado.acciones: lista de llamadas a integraciones que Gemini pide ejecutar
    // (ver archivo 04) — el script las ejecuta una por una y junta los resultados
    const logAcciones = await ejecutarAcciones(resultado.acciones, carpeta);

    await github.comment(issue, resultado.comentario + logAcciones);
    await memoria.append(carpeta, resultado.lineaMemoria);

    if (resultado.estado === "DONE") {
      await github.closeIssue(issue);
      await notificaciones.avisarJonathan(issue, carpeta, resultado.resumen); // ver archivo 06
      await coordinacion.evaluarDisparoCruzado(issue, carpeta, resultado);    // ver archivo 05
    }
  }
}
```

## Contrato de salida de Gemini (`ejecutarTarea`)

Forzar JSON:
```json
{
  "comentario": "texto en markdown para postear en el issue",
  "lineaMemoria": "una línea resumen para memoria.md (fecha la agrega el script, no Gemini)",
  "estado": "EN_PROGRESO | DONE | BLOQUEADO",
  "acciones": [
    { "tool": "whatsapp.enviarMensaje", "params": { "telefono": "...", "texto": "..." } }
  ],
  "resumen": "1-2 frases para la notificación a Jonathan (solo si estado=DONE)"
}
```
El script valida este JSON contra un schema antes de usarlo (ej. con `zod`)
y si no matchea, reintenta una vez pidiéndole a Gemini que corrija el
formato antes de dar el issue por fallido.

## Regla de "no interrumpir por paso intermedio"

`orquestador/skill.md` dice explícitamente que el Orquestador solo debe
avisar a Jonathan cuando hay una decisión que requiere su intervención o
un objetivo completo termina. Esta regla se traduce en código así: el
único punto del script que llama a `notificaciones.avisarJonathan` es
cuando `resultado.estado === "DONE"`, o cuando la validación de JSON falla
dos veces seguidas (situación que sí necesita intervención humana).

## Actualización de memoria.md

`lib/roster.mjs` expone `memoria.append(carpeta, linea)` que:
1. Lee el archivo actual
2. Agrega `\n- [${new Date().toISOString()}] ${linea}`
3. Escribe el archivo (el commit lo hace el workflow al final, no el script)

Nunca reescribe ni resume el historial — es un log append-only.

---

# Integraciones por agente

Cada agente solo puede pedir (en `resultado.acciones`) tools que existan en
`scripts/lib/integraciones/`. Esta tabla es el contrato entre lo que dice
cada `skill.md` y lo que hay que programar. Orden sugerido de implementación:
Santi SDR y Backend/Infra primero (mayor volumen), el resto después.

| Agente | Módulo | Funciones a exponer | Depende de |
|---|---|---|---|
| Santi SDR | `whatsapp.mjs` | `enviarMensaje(telefono, texto)`, `recibirWebhook()` | WhatsApp Cloud API (Meta) |
| Santi SDR | `crm-api.mjs` | `crearLead()`, `actualizarStatus()`, `agregarNota()` | endpoints `/api/leads` del CRM (ver ARCHITECTURE.md, auth `SANTI_API_KEY`) |
| Explorador Patagónico | `google-maps.mjs` | `buscarPyMEs(rubro, zona)` | `GOOGLE_MAPS_PLATFORM_KEY` |
| Explorador Patagónico | `apify.mjs` | `correrActor(actorId, input)` con fallback a los 3 actores que ya usa el CRM | `APIFY_API_TOKEN` |
| Explorador Patagónico | `gemini.mjs` | `buscarConGoogleSearch()` (grounding) | `GEMINI_API_KEY` |
| Backend/Infra | — (no llama tools externas) | Su output son diffs/PRs de código, no acciones en vivo — ver nota abajo | GitHub API (ya cubierto por `github.mjs`) |
| Frontend/UX | — (ídem Backend/Infra) | ídem | GitHub API |
| IA & Automatización | `hunter.mjs` | `buscarContactos(dominio)` | `HUNTER_API_KEY` |
| IA & Automatización | `crm-api.mjs` | `guardarBrochure(leadId, html)`, `scoreMeddic(leadId)` | endpoints `/api/generate`, `/api/leads/:id/brochure` |
| SEO & Contenido | `wordpress.mjs` | `publicarPost()`, `actualizarLanding()` | credenciales del plugin WordPress del CRM |
| Asesor Comercial IA | `crm-api.mjs` | `crearChatbotLead()` | endpoint `/api/chatbot-leads` |
| Finanzas & Admin | `neon.mjs` | `queryReporteSemanal()` (solo lectura) | `DATABASE_URL` o `NEON_API_KEY`+`NEON_PROJECT_ID` (mismos del CRM, en modo read-only) |
| Operaciones | `neon.mjs` | `consolidarMetricas()` (agrega sobre lo que devuelve Finanzas) | ídem |
| Orquestador | `github.mjs` | `listOpenIssues()`, `addLabel()`, `removeLabel()`, `comment()` | `GITHUB_TOKEN` (automático) |
| Marketing / Ventas / Técnico / CS (nodos padre) | ninguna propia | Solo distribuyen: su "acción" típica es abrir un issue hijo con `coordinacion.mjs` (ver archivo 05), no llaman herramientas externas | — |

## Nota — Backend/Infra y Frontend/UX

Estos dos NO deben ejecutar código ni hacer deploy automático en esta
primera versión (alto riesgo de romper producción sin review humano). Su
`resultado.acciones` en la práctica va a estar vacío la mayoría de las
veces: en vez de eso, `resultado.comentario` debe incluir el diff/parche
propuesto en markdown, y `resultado.estado` queda en `BLOQUEADO` hasta que
Jonathan lo apruebe manualmente (comentando `APROBADO` en el issue, algo
que el script puede detectar en la corrida siguiente vía
`github.listComments`). Documentar esta excepción en
`docs/agentes/tecnico/backend-infra/proceso.md` y
`docs/agentes/tecnico/frontend-ux/proceso.md` cuando se implemente, para
que quede consistente con lo que el agente realmente hace.

## Manejo de credenciales faltantes

Si un módulo de integración se llama sin su variable de entorno seteada,
debe lanzar un error descriptivo (`"HUNTER_API_KEY no configurada"`) que el
script capture y convierta en comentario del issue, no un crash silencioso
— mismo patrón que ya usa el CRM (`CRM_INTERNAL_TOKEN` → 503 explícito,
ver ARCHITECTURE.md sección 10).

---

# Coordinación multi-agente — scripts/lib/coordinacion.mjs

## Problema que resuelve
Hoy (según `orquestador/proceso.md`) cada issue se rutea a UN solo agente.
Si Ventas cierra un lead, no hay nada que dispare trabajo automático en
Técnico (ej. dar de alta al cliente en el sistema). Este archivo define
cómo cerrar ese gap sin reescribir el orquestador.

## Enfoque: reglas declarativas, no otra llamada a Gemini
Para no sumar latencia/costo ni impredecibilidad, la coordinación cruzada
se resuelve con una tabla de reglas explícitas, no con otro prompt. Cada
regla dice: "cuando el agente X termina un issue con tal condición, abrir
un issue nuevo etiquetado para el agente Y con tal contenido".

```js
// scripts/lib/coordinacion.mjs
const REGLAS = [
  {
    origen: "ventas/santi-sdr",
    condicion: (resultado) => resultado.trigger === "lead_cerrado",
    destino: "tecnico/backend-infra",
    generarIssue: (resultado, issueOrigen) => ({
      title: `Alta de cliente: ${resultado.datos.empresa}`,
      body: `Lead cerrado en issue #${issueOrigen.number}. Datos: ${JSON.stringify(resultado.datos)}`,
      labels: ["agente:tecnico/backend-infra"],
    }),
  },
  {
    origen: "ventas/explorador-patagonico",
    condicion: (resultado) => resultado.trigger === "leads_nuevos",
    destino: "ventas/santi-sdr",
    generarIssue: (resultado, issueOrigen) => ({
      title: `Contactar ${resultado.datos.cantidad} leads nuevos`,
      body: `Prospección completada en issue #${issueOrigen.number}. Lista: ${resultado.datos.leadsUrl}`,
      labels: ["agente:ventas/santi-sdr"],
    }),
  },
  // sumar reglas nuevas acá a medida que aparezcan casos reales —
  // no intentar anticipar todas de una, ORGANIGRAMA.md ya avisa que
  // esto es iterativo
];

export async function evaluarDisparoCruzado(issueOrigen, carpetaOrigen, resultado) {
  const reglas = REGLAS.filter(r => r.origen === carpetaOrigen && r.condicion(resultado));
  for (const regla of reglas) {
    const nuevoIssue = await github.createIssue(regla.generarIssue(resultado, issueOrigen));
    await github.comment(issueOrigen, `→ Disparó trabajo en **${regla.destino}**: #${nuevoIssue.number}`);
    await memoria.append(carpetaOrigen, `Issue #${issueOrigen.number} disparó #${nuevoIssue.number} en ${regla.destino}`);
  }
}
```

## Cambio necesario en el contrato de Gemini (archivo 03)
Para que esto funcione, `resultado` (la respuesta JSON de `ejecutarTarea`)
necesita dos campos nuevos, opcionales:
```json
{
  "trigger": "lead_cerrado",
  "datos": { "empresa": "...", "cualquier campo relevante": "..." }
}
```
Cada `proceso.md` de agente que pueda disparar coordinación debe
documentar qué valores de `trigger` puede emitir (ej. agregar una sección
"## Triggers que puede emitir" en
`docs/agentes/ventas/santi-sdr/proceso.md`), así Gemini sabe cuándo
setearlos.

## Por qué reglas y no un grafo genérico
El organigrama tiene ~14 nodos; una regla explícita por caso real es más
fácil de auditar y de debuggear que un motor de reglas genérico para un
volumen tan chico. Si en el futuro esto crece mucho, recién ahí vale la
pena generalizar.

---

# Notificaciones proactivas — scripts/lib/integraciones/notificaciones.mjs

## Problema que resuelve
Hoy Jonathan tiene que entrar a GitHub o al tablero para enterarse de que
algo terminó. `orquestador/skill.md` ya define la regla de negocio (avisar
solo en decisiones que requieren intervención o al completar un objetivo);
este archivo define cómo llega ese aviso.

## Canal
WhatsApp, reutilizando la misma integración que ya usa Santi SDR
(`whatsapp.mjs`, WhatsApp Cloud API) en vez de sumar un canal nuevo — menos
credenciales que gestionar. Número destino: el de Jonathan, en una var de
entorno separada (`JONATHAN_WHATSAPP_NUMBER`), no hardcodeado.

```js
// scripts/lib/integraciones/notificaciones.mjs
export async function avisarJonathan(issue, carpeta, resumen) {
  const texto = `✅ *${carpeta}* completó: ${issue.title}\n${resumen}\nhttps://github.com/${OWNER}/${REPO}/issues/${issue.number}`;
  await whatsapp.enviarMensaje(process.env.JONATHAN_WHATSAPP_NUMBER, texto);
}

export async function avisarRevisionManual(issue, motivo) {
  const texto = `⚠️ Necesita tu revisión: ${issue.title}\nMotivo: ${motivo}\nhttps://github.com/${OWNER}/${REPO}/issues/${issue.number}`;
  await whatsapp.enviarMensaje(process.env.JONATHAN_WHATSAPP_NUMBER, texto);
}
```

## Dos disparadores, no uno
1. `avisarJonathan` — issue cerrado con `estado: "DONE"` (éxito).
2. `avisarRevisionManual` — casos que el script ya identifica como
   bloqueados: JSON de Gemini inválido dos veces seguidas, agente sin
   carpeta válida en el ruteo del orquestador, o `resultado.estado ===
   "BLOQUEADO"` (ej. Backend/Infra esperando aprobación, ver archivo 04).

## Anti-spam
Para no bombardear a Jonathan si un agente termina 10 issues chicos en la
misma corrida, agrupar: el script junta todos los `DONE` de una corrida y
manda **un solo mensaje** al final con la lista, en vez de uno por issue.
Igual criterio para `avisarRevisionManual`.

```js
// al final de run-agentes.mjs
if (completados.length > 0) await notificaciones.resumenCorrida(completados);
if (bloqueados.length > 0) await notificaciones.resumenBloqueos(bloqueados);
```

## Fallback si WhatsApp Cloud API falla
Si `whatsapp.enviarMensaje` tira error (rate limit, token vencido), loguear
el error en el output del workflow (así llega igual por el mail que manda
GitHub cuando un job falla) pero **no** frenar el resto del script — la
notificación es best-effort, no puede bloquear que se cierren issues.

---

# Variables de entorno / Secrets — clientum-agentes

Cargar en el repo `clientum-agentes`: **Settings → Secrets and variables →
Actions → New repository secret**.

| Secret | Requerido para | Ya existe en el CRM? |
|---|---|---|
| `GEMINI_API_KEY` | Todo el sistema (orquestador + cada agente) | Sí, reutilizar la misma (`GEMINI_API_KEY` del CRM, ver ARCHITECTURE.md §8) |
| `GITHUB_TOKEN` | Issues, labels, commits | Automático, no hace falta cargarlo (SETUP.md punto 3) |
| `SANTI_API_KEY` | `crm-api.mjs` desde Santi SDR | Sí, ya existe en el CRM |
| `CRM_INTERNAL_TOKEN` | `crm-api.mjs` desde Asesor Comercial IA (webhook) | Sí, ya existe en el CRM |
| `GOOGLE_MAPS_PLATFORM_KEY` | Explorador Patagónico | Sí, ya existe en el CRM |
| `APIFY_API_TOKEN` | Explorador Patagónico | Sí, ya existe en el CRM |
| `HUNTER_API_KEY` | IA & Automatización | Sí, ya existe en el CRM |
| `DATABASE_URL` o (`NEON_API_KEY`+`NEON_PROJECT_ID`) | Finanzas & Admin, Operaciones (solo lectura) | Sí, ya existe en el CRM — considerar un usuario Postgres **read-only** separado en vez de reusar el de escritura |
| `WORDPRESS_API_USER` / `WORDPRESS_API_PASSWORD` | SEO & Contenido | Verificar si el plugin CRM-proxy ya tiene uno, si no crear Application Password nueva en WP |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_ID` | Santi SDR + notificaciones a Jonathan | Nuevo — dar de alta en Meta for Developers |
| `JONATHAN_WHATSAPP_NUMBER` | Notificaciones proactivas | Nuevo, no es un secret sensible pero cargarlo igual como secret por prolijidad |

## Nota de seguridad
Dado que ya hay un historial de claves expuestas en este proyecto
(`docs/notas-tecnicas/leaked-env-keys-HISTORIAL.txt` y
`exposicion-claves-privadas-v1/v2.md` en el zip de docs), antes de cargar
cualquiera de estas keys en el repo nuevo conviene:
1. Confirmar cuáles de las keys históricamente expuestas siguen vigentes.
2. Rotarlas antes de reutilizarlas acá, para no propagar una clave ya
   comprometida a un segundo repo.
3. Usar un usuario Postgres read-only nuevo para Finanzas/Operaciones en
   vez de reusar la connection string de escritura del CRM — este repo no
   necesita ni debería poder escribir en la base de producción.

