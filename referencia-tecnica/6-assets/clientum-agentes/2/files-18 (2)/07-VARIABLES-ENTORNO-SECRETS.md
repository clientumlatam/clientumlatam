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
