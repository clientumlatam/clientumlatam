---
title: ¡Hola! Vi el README de Clientum CRM. Es un buen resumen del stack: React 19 + Vi
platform: Claude
messages: 8
exported_at: 2026-07-17
source: claude.ai
exporter: universal-ai-exporter
---

**Assistant:**

¡Hola! Vi el README de Clientum CRM. Es un buen resumen del stack: React 19 + Vite 6 en el frontend, Express 4 en el backend, Neon Postgres, Gemini para IA, y todo el flujo de Apify → MEDDIC → brochures → outreach por WhatsApp con Santi/Hermes.

¿Qué necesitás que haga con esto? Por ejemplo puedo ayudarte a:

- Revisar o editar algo puntual del código/arquitectura
- Actualizar o completar alguna sección del README (variables de entorno, tablas, etc.)
- Documentar un flujo nuevo (docs/sessions/)
- Resolver algún tema puntual del proyecto (el DNS del `gitsafe-backup`, la migración a WordPress, algo del catálogo)

Contame qué estás necesitando y arrancamos.

---

**Assistant:**

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```

Ok, subiste un zip con documentación técnica de referencia. Contiene 5 archivos markdown:

- **README.md** — índice general
- **arquitectura-e-integraciones.md**
- **auditoria-y-contexto.md**
- **entorno-plataformas.md**
- **implementacion-santi-hermes.md**

¿Qué querés que haga con esto? Por ejemplo:

- Que lo lea todo y te tire un resumen ejecutivo
- Que busque algo puntual (una config, un dato de arquitectura, algo de la auditoría o de Santi/Hermes)
- Que lo use como contexto para otra tarea (documentar, generar código, revisar algo)

---

**You:**

Que lo lea todo y te tire un resumen ejecutivo

---

**Assistant:**

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```

Ya leí los 4 documentos completos. Acá va el resumen ejecutivo:

## Resumen ejecutivo — Referencia Técnica Clientum CRM (julio 2026)

**1. Arquitectura e integraciones** (documento canónico)
Clientum es un CRM B2B con IA: React 19 + Vite 6 en frontend, Express 4 (Node 22) en backend, Neon Postgres serverless como DB, Gemini como IA principal. Flujo dev→prod: Replit (desarrollo) → GitHub Actions (CI + branch Neon por PR) → Vercel (producción, `clientum.com.ar`). Cinco tablas en DB (`users`, `chatbot_leads`, `santi_leads`, `santi_brochures`, `santi_notes`), sin sistema de migraciones formal. La mayoría de las integraciones están activas (Gemini con cascada de fallback a Groq/OpenRouter, Apify, Hunter.io, Google Maps, SMTP). Pendientes: WhatsApp Cloud API, MercadoPago, AFIP.

**2. Auditoría y contexto**
22 secrets configurados en Replit, catalogados y con notas de cuáles NO sincronizar a Vercel. Hay un antecedente relevante: en julio 2026 se pegaron claves en chats externos (Mistral, ChatGPT) y tuvieron que rotarse. También documenta limitaciones del Remix de Replit (secrets no se transfieren), una serie de errores TypeScript conocidos con sus fixes, y notas de integración (el plugin de WordPress, el catálogo de servicios derivado del repo `nzip2`, y el tema de cookies/CDN en Vercel).

**3. Entorno y plataformas**
Notas operativas por plataforma: configuración de Vercel (routing, fix crítico de `Cache-Control: no-store` por el CDN que pisa cookies), detalles de Neon (proyecto `ep-noisy-water-acvnc08j` en São Paulo, Neon Auth, branches por PR), limitaciones del free tier de Replit (RAM 512MB, sin Always-On), un Cloudflare Worker de proxy, y GitHub Actions incluyendo un cron cada 15 min para "agentes autónomos" en el repo `clientum-agentes`.

**4. Implementación Santi/Hermes** (documento canónico, el más extenso)
Manual completo para levantar el SDR "Santi" sobre el framework Hermes Agent (sucesor de OpenClaw): instalación, conexión de WhatsApp, definición de personalidad/reglas del agente (tono rioplatense, clasificación de leads en CALIENTE/TIBIO/FRIO/AGENDAR, límites duros como no cerrar precios y máximo 1 primer contacto/día por número), y la integración técnica recomendada (4 endpoints REST protegidos con API key para que Hermes consuma leads y brochures directamente del CRM, en vez de depender de un CSV o de automatizar la UI). Incluye scaffold de código Drizizzle, script de setup, y checklist de go-live corriendo todo local en Ubuntu vía pm2.

---

**Nota**: el documento de auditoría deja un rastro sensible — claves que se filtraron en chats externos y tuvieron que rotarse. Si necesitás, puedo ayudarte a chequear que esos secrets efectivamente estén rotados o revisar buenas prácticas de manejo de claves para que no vuelva a pasar.

¿Querés que profundice en alguna sección en particular, o que arme algo a partir de esto (por ejemplo, un checklist de próximos pasos)?

---

**You:**

profundice

---

**Assistant:**

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```

Ahora catálogo y sitio.
```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```

Leí todo. Así queda el cuadro completo — sumo estos tres paquetes al que ya tenía de referencia técnica:

## Resumen ejecutivo ampliado — Clientum CRM (julio 2026)

### 1. Sistema de agentes IA ("Hermes Prime")
Es una capa organizativa completa: Jonathan (CEO humano) dirige todo vía chat con un **Orquestador IA**, que delega a 5 agentes departamentales, cada uno con sub-agentes:

- **Ventas** (Sales Manager AI) → Santi SDR (WhatsApp, 15 contactos/día) + Explorador Patagónico (lead gen en Maps/Apify) + Jonathan como closer humano
- **Técnico** (CTO AI) → Backend/Infra, Frontend/UX, IA & Automatización
- **Marketing** → SEO & Contenido
- **Customer Success** → Asesor Comercial IA (chatbot inbound)
- **Operaciones** (COO AI) → Finanzas & Admin

El motor es un repo separado `clientum-agentes` con GitHub Actions corriendo cada 15 min: lee Issues etiquetados (`agente:orquestador` o directo por sub-agente), ejecuta con la cascada Gemini→Groq→OpenRouter→fallback local, comenta avance y cierra con `ESTADO: DONE`. Cada agente sigue la secuencia `identidad → memoria → proceso → skill`. Costo: gratis dentro de cuotas free tier (GitHub Actions + Gemini).

Un dato a marcar: **`WHATSAPP_CLOUD_API_TOKEN` y `WHATSAPP_PHONE_ID` siguen pendientes** (🔲) tanto acá como en el doc de arquitectura original — es la pieza que falta para que Santi deje de depender del gateway QR de Hermes y use la API oficial de Meta.

### 2. Catálogo de datos
Todo fue reorganizado en julio 2026 con una estructura canónico/fuentes/archivo bien clara:

- **`servicios-y-productos.csv`** (456 filas) — derivado de 573 productos WooCommerce + SKUs core nuevos
- **`cursos.csv`** (289 registros — el `wc -l` da 5766 porque hay campos multilínea con descripciones largas entre comillas, no es un error de datos) — combina 140 talleres DonWeb + 129 cursos WooCommerce + 20 de Academia Clientum
- **`planes.csv`** — 5 planes de suscripción, USD 20 a USD 250/mes
- **Leads**: 19 prospectos reales de distribuidoras en Gral. Roca + 2 de ejemplo en formato pipeline Santi

Regla consistente en todo el paquete: los CSV canónicos **no se editan a mano**, se re-derivan desde las fuentes crudas (y en última instancia desde el repo privado `nzip2` con 2.147 registros maestros).

### 3. Sitio web (clientum.com.ar)
También reorganizado a canónico/fuentes/archivo:

- **`sitio-copy-completo-v5.md`** — fuente de verdad de todo el copy: 6 páginas de solución (Chatbot WhatsApp, CRM, Asistente IA, Automatización, Portal del Cliente, Desarrollo Web), Precios, Alianzas, Ecosistema (63 integraciones en 10 categorías) y Academia (25 cursos canónicos)
- **`sitemap.csv`** — 132 URLs unificadas de 3 dominios: clientum.com.ar (18), talleres.donweb.com (77), y un WordPress WXR de terceros (37)

---

### Cómo encajan las 4 piezas entre sí
Referencia técnica (stack + Santi/Hermes) es la base de infraestructura. Agentes es la capa organizacional que orquesta todo eso incluyendo a Santi. Catálogo y Sitio son los insumos de contenido/producto que Marketing, Ventas (brochures) y el sitio público consumen. Todo comparte las mismas credenciales (`GEMINI_API_KEY`, `SANTI_API_KEY`, etc.), así que la nota de seguridad del primer resumen (claves filtradas en chats externos y rotadas) aplica transversalmente a este sistema entero, no solo al CRM.

¿Querés que profundice en algo puntual — por ejemplo el flujo completo de Santi con el schema real, el detalle de `run-agentes.mjs`, o algo del catálogo/sitio?

---

**You:**

flujo completo de Santi con el schema real, el detalle de `run-agentes.mjs`,

---

**Assistant:**

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```