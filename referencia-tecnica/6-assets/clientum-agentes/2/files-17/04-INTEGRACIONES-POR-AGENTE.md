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
