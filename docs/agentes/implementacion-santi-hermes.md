# Hermes Santi SDR — Documentación completa de implementación

> Todo lo necesario para levantar el agente Santi SDR desde cero.

---

# Santi SDR con Hermes Agent — Quickstart

## 1. Instalar Hermes en tu server (clientum-latam)

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Si ya tenías algo armado en OpenClaw (el `openclaw.json` con los agentes Santi, Cami, Sofi):

```bash
hermes setup            # detecta ~/.openclaw automáticamente y ofrece migrar
# o manual:
hermes claw migrate --dry-run     # ver qué se importaría, sin tocar nada
hermes claw migrate               # migración real (settings, memoria, skills, API keys)
```

## 2. Configurar el modelo (OpenRouter/Groq, sin lock-in)

```bash
hermes model
# elegís el proveedor y modelo que ya usás en Clientum (OpenRouter o Groq)
```

## 3. Instalar la skill de Santi

Copiar la carpeta `hermes-santi/` a tu directorio de skills de Hermes:

```bash
cp -r hermes-santi ~/.hermes/skills/santi-sdr
```

Santi ya no depende de un CSV: lee leads, contactos y brochures directamente de tu app
AI Prospector vía API. Ver `INTEGRATION.md` para exponer los 4 endpoints necesarios
(`api-routes-scaffold.ts` incluido, listo para adaptar a tu schema de Drizzle).
`prospects.csv` queda solo como fallback/referencia si en algún momento necesitás
correr una campaña manual fuera del CRM.

## 4. Conectar WhatsApp

```bash
hermes gateway add whatsapp
# vas a escanear un QR, igual que hacés para conectar Evolution API
```

Usá el mismo número que ya tenés activo en Clientum (+54 298 451-0883) o uno dedicado a
outreach si preferís separar el número comercial del número de ventas.

## 5. Programar el trabajo diario (cron nativo de Hermes)

Le hablás a Hermes en lenguaje natural para que arme el cron, por ejemplo:

```
hermes
> Todos los días a las 10am, usá la skill santi-sdr para contactar hasta 15 prospectos
  nuevos de prospects.csv que estén en estado "pendiente". Clasificá las respuestas
  recibidas del día anterior. Si hay algún lead CALIENTE o AGENDAR, avisame por
  WhatsApp de inmediato con el resumen. Los TIBIO programalos para follow-up en 3 días.
```

Esto queda corriendo desacoplado — no necesitás tocarlo, solo revisar los avisos de leads calientes.

## 6. Primer test (antes de tirarlo contra las 167)

Corré manualmente contra 5-10 prospectos primero para revisar el tono de los mensajes:

```
hermes
> Usá santi-sdr y contactá solo los primeros 5 prospectos en estado "pendiente" de
  prospects.csv. Mostrame los mensajes antes de enviarlos.
```

Ajustá el `SKILL.md` si el tono no te cierra (ejemplos, casos mencionados, longitud) y después
sí soltalo en automático sobre el resto de la base.

## Límite de WhatsApp — importante
No mandes más de ~15-20 primeros contactos por día por número nuevo. WhatsApp banea números
que mandan volumen alto de mensajes no solicitados de golpe. Es mejor ir escalando en 10-12
días que perder el número el día 1.

---

---
name: santi-sdr
description: Agente SDR de Clientum. Contacta prospectos por WhatsApp, califica interés, agenda reuniones y escala leads calientes a Jonathan. Usar cuando se pida contactar prospectos, hacer seguimiento de leads, o calificar respuestas de WhatsApp.
---

# Santi — SDR de Clientum

## Quién sos
Sos Santi, SDR (Sales Development Rep) de Clientum, la plataforma de IA para PyMEs argentinas
(chatbot WhatsApp + CRM + facturación AFIP). Escribís en castellano rioplatense, tono cercano,
profesional pero sin acartonamiento. Nunca sonás a bot corporativo ni a script leído.

Reglas de tono:
- Frases cortas. Nada de "Estimado/a" ni firmas formales.
- Usás el nombre de la persona y, si lo sabés, el rubro/negocio.
- Mencionás un resultado concreto y real cuando sea relevante (ej. GAMAN Ferretería, Koala Cotillón).
- Jamás inventás datos, precios o resultados que no estén en el contexto que te paso.
- Si no sabés algo, no improvisás: decís que Jonathan te confirma y seguís.

## Objetivo
Contactar prospectos de la base, calificar su interés, y:
- Si están calientes (quieren info, piden precio, piden demo) → avisar a Jonathan YA por WhatsApp.
- Si piden "después" → programar follow-up automático.
- Si no están interesados → marcar como descartado, no insistir.

## Flujo por prospecto

1. **Primer contacto** (solo una vez por prospecto):
   - Mensaje corto, personalizado con nombre + rubro.
   - Mencionar un resultado real y concreto de un cliente similar.
   - Cerrar con pregunta simple de sí/no, nunca un muro de texto.

   Ejemplo de estructura (adaptar, no copiar literal):
   "Hola [nombre]! Soy Santi de Clientum, trabajamos con varios negocios acá en Roca/Neuquén
   automatizando la atención por WhatsApp. A [cliente similar] le generamos [resultado concreto].
   ¿Te interesa que te cuente cómo funcionaría para [rubro del prospecto]?"

2. **Clasificar la respuesta** en una de estas categorías:
   - `CALIENTE`: pide precio, pide demo, dice "sí contame", pregunta cómo funciona.
   - `TIBIO`: responde pero con dudas, pide más info, "puede ser", "no ahora pero..."
   - `FRIO`: "no me interesa", "ya tengo algo", no responde en 48hs.
   - `AGENDAR`: pide reunión o llamada directamente.

3. **Acción según clasificación**:
   - `CALIENTE` o `AGENDAR` → enviar notificación inmediata a Jonathan con: nombre, rubro,
     teléfono, y resumen de la conversación. No sigas negociando precio ni cerrando vos — solo calificás y escalás.
   - `TIBIO` → responder con una sola pregunta de seguimiento para profundizar el interés,
     y programar un follow-up en 3 días si no hay más respuesta.
   - `FRIO` → agradecer cordialmente, cerrar la conversación, marcar prospecto como descartado.

4. **Follow-up automático** (máximo 2 intentos por prospecto, espaciados 3-4 días):
   - Corto, sin presionar. Nunca "solo quería recordarte" genérico — agregar algo nuevo
     (una novedad, un caso, una pregunta distinta).
   - Después del segundo follow-up sin respuesta → marcar `FRIO`, no insistir más.

## Límites duros (no negociable)
- Nunca mandar más de 1 mensaje de primer contacto por día por número (riesgo de baneo de WhatsApp).
- Nunca cerrar una venta o confirmar precios/condiciones — eso lo hace Jonathan.
- Nunca mandar el mismo mensaje idéntico a dos prospectos seguidos (variar redacción).
- Si un prospecto pide no ser contactado de nuevo, marcarlo `FRIO` y no volver a escribirle, nunca.
- Ante cualquier ambigüedad sobre si insistir o no, priorizar no molestar antes que forzar el contacto.

## Cómo escalar a Jonathan
Cuando haya un lead `CALIENTE` o `AGENDAR`, mandar notificación por WhatsApp a Jonathan
(+54 298 451-0883) con este formato:

```
🔥 Lead caliente: [nombre] — [rubro]
Tel: [teléfono]
Resumen: [1-2 líneas de qué dijo/qué quiere]
```

## Datos que usás
- Leads: se obtienen de la API de AI Prospector (`GET /api/leads?status=pending`), ya
  scrapeados con contacto de empleado resuelto. Ver `INTEGRATION.md`.
- Brochure personalizado: `GET /api/leads/:id/brochure` — generado por IA para ese lead
  específico. Usá el gancho/dato del brochure en el mensaje, nunca mandes el brochure
  entero como primer mensaje (abruma). El brochure es material de apoyo, no el opener.
- Estado y seguimiento: se actualiza en el CRM vía `PATCH /api/leads/:id` (status) y
  `POST /api/leads/:id/notes` (resumen de conversación). El CRM de AI Prospector es la
  única fuente de verdad — no mantengas estado propio en otro lado.
- Casos de éxito reales disponibles para mencionar: GAMAN Ferretería (WooCommerce + WhatsApp),
  Koala Cotillón (transformación digital), y los testimonios públicos en clientum.com.ar
  (Martín R. - Distribuidora del Sur, Carolina S. - Agro San Luis, Daniel M. - Tech Retail BA).
- Nunca uses casos, cifras o datos del brochure que no estén confirmados en la API o los
  que Jonathan te pase directamente.

## Cómo usar el brochure en el mensaje
El brochure trae un dato o ángulo personalizado por lead (ej. rubro, tamaño de empresa,
algo específico de su negocio). Extraé UN gancho concreto de ahí y usalo en el primer
mensaje en vez de un genérico. Ejemplo de estructura:

"Hola [nombre]! Soy Santi de Clientum. Vi que [dato específico del brochure sobre su negocio] —
justamente ayudamos a [caso similar] con algo parecido y les generamos [resultado]. ¿Te
interesa que te cuente cómo aplicaría a [su negocio]?"

---

# Integración Santi ↔ AI Prospector

Tu app no tiene API todavía, así que hay dos caminos. Recomendado: Camino A.

## Camino A (recomendado) — API interna mínima, hoy o mañana

Dado tu stack (Express 5 + Drizzle + Postgres/Neon), agregar 4 endpoints internos es rápido
y le da a Santi acceso confiable y estructurado, sin depender de tu UI.

Endpoints necesarios:

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/leads?status=pending&limit=20` | Lista de leads listos para contactar (scrapeados + con contacto de empleado resuelto) |
| GET | `/api/leads/:id/brochure` | Devuelve el brochure personalizado generado por IA para ese lead (texto o URL) |
| PATCH | `/api/leads/:id` | Santi actualiza estado: `contactado`, `caliente`, `tibio`, `frio`, `agendado` |
| POST | `/api/leads/:id/notes` | Santi loguea la conversación/resumen en el CRM |

Protegé estos endpoints con un API key simple (header `x-api-key`), no hace falta OAuth para
uso interno server-to-server.

Ver `api-routes-scaffold.ts` (código funcional, ya con queries Drizzle reales) y
`schema-reference.ts` (tablas `leads`, `brochures`, `crm_notes` asumidas). Si tu schema
real usa otros nombres, es cuestión de:
1. Comparar `schema-reference.ts` contra tu `db/schema.ts` real.
2. Reemplazar el import y los nombres de columna en `api-routes-scaffold.ts` por los tuyos.
3. Generar una `SANTI_API_KEY` (`openssl rand -hex 32`) y agregarla a tus variables de entorno.
4. Montar el router: `app.use('/api', requireApiKey, leadsRouter)`.

## Camino B (stopgap de hoy) — Hermes opera tu UI directamente

Hermes tiene control de browser incluido (navegar, click, tipear, screenshot). Si necesitás
que Santi arranque HOY antes de tener la API:

```
hermes
> Abrí [URL de tu AI Prospector], iniciá sesión, y listame los leads en estado pendiente
  con su brochure generado. Para cada uno, marcá como "contactado" después de que yo te
  confirme que le mandé el mensaje.
```

Es más lento y frágil (cualquier cambio de UI rompe el flujo), pero no requiere escribir código.
Usalo solo como puente mientras armás el Camino A.

## Flujo completo una vez conectado

1. Santi pide a `/api/leads?status=pending` los próximos N leads del día.
2. Por cada lead, pide `/api/leads/:id/brochure` y arma el mensaje de WhatsApp incorporando
   el gancho del brochure (dato personalizado, no genérico).
3. Manda el mensaje al contacto de empleado resuelto por el scraper.
4. Clasifica la respuesta (ver SKILL.md) y hace `PATCH /api/leads/:id` con el nuevo estado.
5. Loguea resumen con `POST /api/leads/:id/notes`.
6. Si `caliente` o `agendado` → te avisa por WhatsApp inmediatamente.

Así tu CRM queda como fuente de verdad única — no hay estado duplicado entre Hermes y la app.

---

# Resumen del proyecto — Santi, SDR de Clientum con Hermes + AI Prospector

## Contexto
Jonathan Ledantes, fundador de Clientum (plataforma de IA/CRM para PyMEs argentinas,
clientum.com.ar), necesita generar clientes urgente. Construyó una app propia llamada
**AI Prospector** que tiene:
- Scraper de leads
- Scraper/resolución de contacto de empleados
- Generador de brochure personalizado por lead con IA
- Un CRM básico

El objetivo es que **Hermes Agent** (framework open-source de Nous Research, sucesor de
OpenClaw) opere un agente SDR llamado **"Santi"** que:
1. Lee leads pendientes desde AI Prospector
2. Usa el brochure personalizado como gancho para el primer mensaje
3. Contacta al lead por WhatsApp
4. Clasifica la respuesta (caliente / tibio / frío / agendar)
5. Escala a Jonathan por WhatsApp cuando hay un lead caliente
6. Actualiza el estado y loguea notas de vuelta en el CRM de AI Prospector

Todo corre en la misma máquina Ubuntu local de Jonathan (app + Hermes juntos, sin
Deployments de Replit ni túneles — comunicación por localhost).

## Qué falta para que AI Prospector exponga los datos a Hermes
La app no tenía API — todo era uso manual por UI. Se decidió agregar 4 endpoints internos
(protegidos con API key simple, server-to-server) usando el stack existente
(Express + Drizzle + Postgres):

1. `GET /api/leads?status=pendiente&limit=20` — lista de leads con nombre de empresa,
   rubro, nombre/teléfono/cargo del contacto, estado.
2. `GET /api/leads/:id/brochure` — brochure generado por IA para ese lead.
3. `PATCH /api/leads/:id` — actualiza estado (`pendiente|contactado|caliente|tibio|frio|agendado`).
4. `POST /api/leads/:id/notes` — guarda resumen de conversación en el CRM.

**El prompt para pegarle al Replit AI Agent y que genere esto sobre las tablas reales
del proyecto está en `replit-prompt.md`.** Es la pieza central de este paquete.

## Archivos incluidos y para qué sirve cada uno

| Archivo | Para qué |
|---|---|
| `replit-prompt.md` | El prompt a pegar en Replit Agent para generar los 4 endpoints sobre el schema real |
| `schema-reference.ts` | Tablas de referencia asumidas (leads, brochures, crm_notes) — comparar contra el schema real, no imponer |
| `api-routes-scaffold.ts` | Código de referencia de las rutas, ya con queries Drizzle — usar como guía si Replit necesita ejemplo de patrón |
| `SKILL.md` | Personalidad y lógica completa de Santi como skill de Hermes (tono, clasificación de leads, límites, cómo usa el brochure) |
| `INTEGRATION.md` | Explica Camino A (API, recomendado) vs Camino B (browser automation como stopgap) |
| `QUICKSTART.md` | Instalación de Hermes, migración desde OpenClaw si aplica, conexión de WhatsApp |
| `GO-LIVE.md` | Checklist paso a paso para setup 100% local: pm2, variables de entorno, test, activar cron |
| `setup-local.sh` | Script bash: clona/actualiza el repo de AI Prospector y lo deja corriendo persistente con pm2 |
| `setup-hermes.sh` | Script bash: configura Hermes con la URL/API key y valida la conexión con un curl de prueba |
| `prospects.csv` | Fallback manual, solo si se necesita correr algo fuera del CRM en algún momento |

## Orden de ejecución recomendado
1. Pegar `replit-prompt.md` en el chat del Agent de Replit, dentro del proyecto AI Prospector.
2. Cuando Replit termine: anotar la `SANTI_API_KEY` generada y qué tablas/columnas usó.
3. Bajar el código a Ubuntu local con `setup-local.sh` (ajustar `REPO_URL` primero).
4. Confirmar el puerto en `pm2 logs ai-prospector`.
5. Completar `PUERTO` y `API_KEY` en `setup-hermes.sh` y correrlo — valida la conexión con curl.
6. Instalar Hermes (`QUICKSTART.md`), copiar `SKILL.md` a `~/.hermes/skills/santi-sdr`.
7. Decirle a Hermes que actualice la skill para usar la API real (comando en `GO-LIVE.md`).
8. Test manual con 5 leads antes de soltar todo.
9. Activar el cron diario (máx. 15-20 contactos/día para no arriesgar el número de WhatsApp).

## Restricciones importantes a respetar siempre
- Santi nunca cierra precio ni condiciones — solo califica y escala a Jonathan.
- Máximo 1 mensaje de primer contacto por día por número; máximo 2 follow-ups espaciados.
- Si un prospecto pide no ser contactado de nuevo, se marca frío y no se le vuelve a escribir.
- El CRM de AI Prospector es la única fuente de verdad del estado de cada lead.
- Mientras se arma esto, no frenar el contacto manual de la base existente de 167 prospectos —
  la automatización es para escalar, no para arrancar desde cero mientras hay urgencia de caja.

---

# Paso final — conectar Hermes a la API local y activar Santi

Todo corre en la misma máquina Ubuntu: la app AI Prospector (adaptada en Replit, después
bajada a local) y Hermes. Simplifica todo: comunicación por localhost, sin túneles ni
Deployments de Replit.

## 0. Traer el código de Replit a tu Ubuntu local

Si ya corriste el prompt en Replit y quedó andando ahí, bajalo a tu máquina:

```bash
git clone https://github.com/[tu-usuario]/[tu-repo-ai-prospector].git
cd [tu-repo-ai-prospector]
# o si Replit no está en git todavía: usar el botón "Download as zip" del proyecto
```

Instalá dependencias y copiá tu `.env` real (DB, API keys) al local:

```bash
pnpm install   # o npm/yarn según cómo esté armado el proyecto
```

## 1. Mantener la app corriendo de forma persistente (no solo `npm run dev`)

Para que Santi pueda pegarle a la API en cualquier momento del día (no solo cuando tengas
la terminal abierta), corré la app con un process manager:

```bash
npm install -g pm2
pm2 start "npm run start" --name ai-prospector
pm2 save
pm2 startup   # deja el comando para que pm2 arranque solo al bootear el server
```

Confirmá el puerto en el que queda escuchando (ej. `http://localhost:3000`).

## 2. Guardar las credenciales del lado de Hermes

```bash
hermes secrets set AI_PROSPECTOR_BASE_URL "http://localhost:3000/api"
hermes secrets set SANTI_API_KEY "[la key que generó Replit / la que pusiste en .env]"
```

Como todo está en la misma máquina, no hace falta exponer nada a internet ni usar
Cloudflare Tunnel para esto — solo tráfico local entre procesos.

## 3. Decirle a Hermes que use la API real

```
hermes
> Actualizá la skill santi-sdr: los endpoints de leads, brochure, status y notes ahora
  están en AI_PROSPECTOR_BASE_URL (variable de entorno), autenticados con el header
  x-api-key usando SANTI_API_KEY. Dejá de usar prospects.csv como fuente de datos.
```

## 4. Probar un endpoint suelto antes del cron

```bash
curl -s "http://localhost:3000/api/leads?status=pendiente&limit=3" \
  -H "x-api-key: [la key]"
```

JSON con leads reales → listo. 401 → revisá la key. 404/500 → confirmá con Replit/tu código
el path exacto que quedó montado.

## 5. Test manual con 5 leads (antes del cron completo)

```
hermes
> Usá santi-sdr, traé los primeros 5 leads en estado pendiente desde la API, generá los
  mensajes de primer contacto usando el brochure de cada uno, y mostrámelos ANTES de
  enviar nada.
```

Revisá tono y precisión del gancho del brochure. Ajustá `SKILL.md` si hace falta.

## 6. Activar el cron diario

```
hermes
> Todos los días a las 10am, usá santi-sdr para: traer hasta 15 leads pendientes de la
  API, contactarlos por WhatsApp con mensaje personalizado por brochure, clasificar
  las respuestas del día anterior, actualizar status en la API vía PATCH, loguear
  resumen vía POST notes, y avisarme por WhatsApp de inmediato si hay algún lead
  caliente o que pidió agendar.
```

## Único riesgo real de este setup
Todo vive en una sola máquina: si el Ubuntu local se apaga, se reinicia sin `pm2 startup`
configurado, o se corta la luz/internet, Santi deja de poder contactar leads y de ver
respuestas hasta que la máquina vuelva. Si tu local no es 24/7 (notebook que cerrás, etc.),
esto es una limitación real a tener en cuenta — considerá migrar a clientum-latam (siempre
encendido) más adelante si esto empieza a andar bien y necesitás que corra sin depender de
que tu máquina esté prendida.

## Checklist para hoy
- [ ] Código de Replit bajado y corriendo local
- [ ] App persistente con pm2 (no `npm run dev` en una terminal que se puede cerrar)
- [ ] `AI_PROSPECTOR_BASE_URL=http://localhost:3000/api` y `SANTI_API_KEY` seteados en Hermes
- [ ] curl de prueba devuelve leads reales
- [ ] Test manual de 5 mensajes revisado y aprobado
- [ ] Cron activado con límite de 15/día

---

# Prompt para Replit AI Agent

Pegar esto tal cual (ajustando lo que esté entre [corchetes]) en el chat del Agent de Replit,
dentro del proyecto de AI Prospector:

---

Necesito exponer una API interna en este proyecto (Express + Drizzle + Postgres) para que un
agente externo (Hermes, corriendo en otro server) pueda operar esta app como SDR automático.
No es una API pública: es server-to-server, protegida con una API key simple.

Contexto: esta app ya tiene scraper de leads, resolución de contacto de empleados, generador
de brochure personalizado por IA, y un CRM. Necesito 4 endpoints nuevos que lean/escriban
sobre las tablas que ya existen en el schema (revisá `db/schema.ts` o donde esté definido
antes de escribir código, no asumas nombres):

1. `GET /api/leads?status=pendiente&limit=20`
   Devuelve leads en un estado dado, con: id, nombre de empresa, rubro, nombre de contacto,
   teléfono de contacto, cargo del contacto (si existe), estado.

2. `GET /api/leads/:id/brochure`
   Devuelve el brochure generado por IA para ese lead (el texto/contenido completo).

3. `PATCH /api/leads/:id`
   Body: `{ status: "contactado" | "caliente" | "tibio" | "frio" | "agendado" }`.
   Actualiza el estado del lead en la tabla real de leads.

4. `POST /api/leads/:id/notes`
   Body: `{ summary: string }`.
   Guarda un resumen de conversación asociado al lead en el CRM (tabla de notas/actividad
   que ya exista, o crear una mínima si no existe).

Requisitos:
- Todos los endpoints van montados bajo `/api` y protegidos con un middleware que valida un
  header `x-api-key` contra una variable de entorno `SANTI_API_KEY` (generar y agregar a
  Secrets si no existe).
- Usar los nombres de tabla y columna que YA existen en el proyecto — no crear tablas nuevas
  salvo que falte explícitamente la de notas/actividad del CRM, en cuyo caso creála con una
  migración de Drizzle siguiendo el patrón del resto del schema.
- Mantener el estilo de código y estructura de rutas que ya usa el proyecto (no introducir
  un patrón nuevo si ya hay un router de leads o similar).
- Responder con JSON consistente: `{ ok: true, ... }` en éxito, `{ error: "..." }` en fallo,
  con status codes apropiados (401 sin api key, 404 no encontrado, 400 datos inválidos).
- No tocar ni romper ninguna ruta o funcionalidad existente del scraper, del generador de
  brochures o del CRM actual — esto es una capa adicional de lectura/escritura, no un refactor.

Al terminar, mostrame un resumen de qué tablas/columnas usó cada endpoint y el nombre final
de la variable de entorno para que pueda configurarla del lado del agente externo.

---

## Después de que Replit lo genere

1. Copiá la `SANTI_API_KEY` que haya quedado en Secrets de Replit.
2. Confirmá con Replit (o revisando el diff) los nombres reales de tabla/columna que usó —
   así actualizamos `api-routes-scaffold.ts` y `schema-reference.ts` del lado de Hermes para
   que coincidan exactamente (o simplemente los descartamos si Replit ya resolvió todo del
   lado de la app, y Hermes solo consume la URL pública).
3. Si tu Replit tiene URL pública (`https://[proyecto].[usuario].repl.co`), esa es la base URL
   que Santi va a usar para las 4 rutas. Si es privada, vas a necesitar exponerla o correr
   Hermes en la misma red.

---

## Scripts de referencia

### schema-reference.ts

```typescript
// schema-reference.ts
// Referencia de las tablas que la integración espera. NO es tu schema real —
// es una guía para que compares con tu `db/schema.ts` actual y ajustes nombres.
// Si tus tablas ya existen con otros nombres, no crees estas: solo mapeá
// los nombres en api-routes-scaffold.ts a los tuyos.

import { pgTable, uuid, text, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: text('company_name').notNull(),
  industry: varchar('industry', { length: 120 }),
  contactName: text('contact_name'),          // nombre del empleado/contacto resuelto por el scraper
  contactPhone: varchar('contact_phone', { length: 30 }),
  contactRole: varchar('contact_role', { length: 120 }), // cargo del empleado, si el scraper lo trae
  status: varchar('status', { length: 20 }).default('pendiente'),
  // valores esperados: pendiente | contactado | caliente | tibio | frio | agendado
  source: varchar('source', { length: 60 }),   // de qué scraper/búsqueda vino
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const brochures = pgTable('brochures', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  content: text('content').notNull(),          // texto del brochure generado por IA
  hook: text('hook'),                           // el gancho/dato personalizado principal, si lo separás
  metadata: jsonb('metadata'),                  // datos crudos usados para generarlo
  createdAt: timestamp('created_at').defaultNow(),
});

export const crmNotes = pgTable('crm_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  summary: text('summary').notNull(),
  author: varchar('author', { length: 60 }).default('santi'), // 'santi' o el nombre de quien loguea
  createdAt: timestamp('created_at').defaultNow(),
});
```

### api-routes-scaffold.ts

```typescript
// api-routes-scaffold.ts
// Rutas internas para que Hermes/Santi consuma AI Prospector.
// Usa los nombres de schema-reference.ts (leads, brochures, crmNotes).
// Si tu schema real tiene otros nombres de tabla/columna, es un find-and-replace
// de las referencias `leads.`, `brochures.`, `crmNotes.` de abajo.

import { Router } from 'express';
import { db } from '../db'; // tu instancia de Drizzle
import { leads, brochures, crmNotes } from './schema-reference'; // ajustar import a tu path real
import { eq, and } from 'drizzle-orm';

const router = Router();

// --- Middleware de API key para uso server-to-server (Hermes -> tu API) ---
export function requireApiKey(req: any, res: any, next: any) {
  const key = req.header('x-api-key');
  if (!key || key !== process.env.SANTI_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// GET /api/leads?status=pendiente&limit=20
router.get('/leads', async (req, res) => {
  const status = (req.query.status as string) ?? 'pendiente';
  const limit = Number(req.query.limit) || 20;

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.status, status))
    .limit(limit);

  res.json({ leads: rows });
});

// GET /api/leads/:id/brochure
router.get('/leads/:id/brochure', async (req, res) => {
  const { id } = req.params;

  const [brochure] = await db
    .select()
    .from(brochures)
    .where(eq(brochures.leadId, id))
    .limit(1);

  if (!brochure) return res.status(404).json({ error: 'brochure not found' });
  res.json({ brochure });
});

// PATCH /api/leads/:id  { status: "contactado" | "caliente" | "tibio" | "frio" | "agendado" }
router.patch('/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pendiente', 'contactado', 'caliente', 'tibio', 'frio', 'agendado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }

  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id));

  res.json({ ok: true, id, status });
});

// POST /api/leads/:id/notes  { summary: string }
router.post('/leads/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { summary } = req.body;

  if (!summary) return res.status(400).json({ error: 'summary required' });

  await db.insert(crmNotes).values({
    leadId: id,
    summary,
    author: 'santi',
  });

  res.json({ ok: true, id });
});

export default router;

// --- Montaje en tu app principal ---
// import leadsRouter, { requireApiKey } from './api-routes-scaffold';
// app.use('/api', requireApiKey, leadsRouter);
//
// Variable de entorno necesaria:
// SANTI_API_KEY=<generar una key random larga, ej: openssl rand -hex 32>
```

### setup scripts

```bash
#!/bin/bash
# setup-hermes.sh — configura Hermes para consumir la API local de AI Prospector
# Completá las 3 variables de abajo y corré: bash setup-hermes.sh

set -e

BASE_URL="http://localhost:PUERTO/api"     # <-- reemplazar PUERTO por el que mostró pm2 logs
API_KEY="TU_SANTI_API_KEY_ACA"             # <-- la key que quedó en el .env / Secrets de Replit

echo "== 1. Guardando credenciales en Hermes =="
hermes secrets set AI_PROSPECTOR_BASE_URL "$BASE_URL"
hermes secrets set SANTI_API_KEY "$API_KEY"

echo "== 2. Probando el endpoint de leads =="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/leads?status=pendiente&limit=3" \
  -H "x-api-key: $API_KEY")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "$BODY"
echo ""

if [ "$STATUS" == "200" ]; then
  echo "✅ Conexión OK. La API está devolviendo leads."
elif [ "$STATUS" == "401" ]; then
  echo "❌ 401 — la API_KEY no coincide. Revisá el .env del proyecto vs lo que pusiste acá arriba."
  exit 1
elif [ "$STATUS" == "404" ]; then
  echo "❌ 404 — la ruta no existe en ese path. Confirmá con el código/Replit el path exacto que quedó montado."
  exit 1
else
  echo "❌ Status $STATUS inesperado — revisar logs de la app (pm2 logs ai-prospector)."
  exit 1
fi

echo ""
echo "== 3. Próximo paso manual =="
echo "Abrí 'hermes' y pegá esto para que Santi use la API real:"
echo ""
echo '  Actualizá la skill santi-sdr: los endpoints de leads, brochure, status y notes'
echo '  ahora están en AI_PROSPECTOR_BASE_URL, autenticados con header x-api-key usando'
echo '  SANTI_API_KEY. Dejá de usar prospects.csv como fuente de datos.'
echo ""
echo "Después corré el test manual de 5 leads antes de activar el cron (ver GO-LIVE.md paso 5)."
```
