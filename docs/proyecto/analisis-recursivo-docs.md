# ANÁLISIS RECURSIVO DE docs/ — Julio 2026

> Generado: 2026-07-17 | Archivos analizados: **191** en 7 carpetas principales  
> Estado anterior (ANALISIS-DOCS v1): 1.859 archivos → **reducción del 89,7%**

---

## 📊 RESUMEN EJECUTIVO

| Carpeta | Archivos | Tamaño | Estado |
|---|---|---|---|
| `docs/agentes/` | 137 | 584 KB | ⚠️ 46 duplicados activos |
| `docs/chats/` | 18 | 348 KB | ✅ OK |
| `docs/docs-raiz/` | 9 | 156 KB | ⚠️ 1 desactualizado |
| `docs/negocio/` | 4 | ~340 KB | ✅ OK |
| `docs/proyecto/` | 15 | 512 KB | 🔴 credenciales reales |
| `docs/sesiones/` | 2 | 60 KB | ✅ OK |
| `docs/sitio/` | 6 | 280 KB | ⚠️ 1 nombre ilegible |
| `docs/docs-zips/` | 17 zips | ~var | ✅ archivados |
| **TOTAL** | **191** | **2.3 MB** | |

---

## 🔴 ALERTAS CRÍTICAS

### 1. Credenciales reales en archivos de config

| Archivo | Tamaño | Credenciales detectadas |
|---|---|---|
| `docs/proyecto/config/.env-ejemplo2` | 1.756 B | NEON_PROJECT_ID, NEON_API_KEY, DATABASE_URL, NEON_DATABASE_URL, GITHUB_PERSONAL_ACCESS_TOKEN |
| `docs/proyecto/config/env-completo.env` | 6.789 B | Potencialmente el set completo de variables de entorno |

**Acción requerida**: estos archivos están en el repo — si el repo es público o fue público en algún momento, las claves deben rotarse. Ver también `docs/proyecto/notas-tecnicas/leaked-env-keys-HISTORIAL.txt`.

---

## 📁 ANÁLISIS POR CARPETA

---

### `docs/agentes/` — 137 archivos

#### Raíz de agentes (18 archivos .md consolidados) ✅

Son la **fuente de verdad** para el sistema de agentes. Generados por fusión en sesiones anteriores.

| Archivo | Contenido | Estado |
|---|---|---|
| `HERMES-PRIME.md` | Arquitectura maestro del sistema multi-agente, capas 0–4, roster, estado de implementación | ✅ Activo |
| `ORGANIGRAMA.md` | Estructura org completa con departamentos y sub-agentes | ✅ Activo |
| `SANTI-SDR.md` | Documentación completa del agente SDR (WhatsApp, límites, flujos) | ✅ Activo |
| `SETUP.md` | Instrucciones de setup del sistema de agentes | ✅ Activo |
| `orquestador.md` | Identidad + memoria + proceso + skill fusionados | ✅ Activo |
| `tecnico.md` | Agente técnico umbrella | ✅ Activo |
| `tecnico-backend-infra.md` | Sub-agente backend | ✅ Activo |
| `tecnico-frontend-ux.md` | Sub-agente frontend (React 19, Vite, Tailwind v4) | ✅ Activo |
| `tecnico-ia-automatizacion.md` | Sub-agente IA | ✅ Activo |
| `ventas.md` | Agente ventas umbrella | ✅ Activo |
| `ventas-santi-sdr.md` | Santi SDR detallado | ✅ Activo |
| `ventas-explorador-patagonico.md` | Explorador Patagónico (Guía Oleo, etc.) | ✅ Activo |
| `marketing.md` | Agente marketing umbrella | ✅ Activo |
| `marketing-seo-contenido.md` | Sub-agente SEO | ✅ Activo |
| `customer-success.md` | Agente CS umbrella | ✅ Activo |
| `customer-success-asesor-comercial.md` | Asesor Comercial IA | ✅ Activo |
| `operaciones.md` | Agente operaciones umbrella | ✅ Activo |
| `operaciones-finanzas-admin.md` | Sub-agente finanzas (AFIP, MercadoPago) | ✅ Activo |

#### Scripts (2 archivos) ✅

| Archivo | Contenido |
|---|---|
| `docs/agentes/scripts/run-agentes.sh` | Script shell para ejecutar el orquestador |
| `docs/agentes/clientum-agentes/scripts/run-agentes.mjs` | Script Node.js equivalente |

#### `docs/agentes/clientum-agentes/` — 117 archivos ⚠️ DUPLICADOS

Esta subcarpeta contiene la **versión granular** (4 archivos por agente: identidad/memoria/proceso/skill) más **duplicados exactos** de todo en carpetas con ` (2)`.

**Estructura sin duplicados (fuente correcta):**

```
clientum-agentes/
├── orquestador/         → 4 archivos (identidad/memoria/proceso/skill)
├── tecnico/             → 4 raíz + backend-infra/4 + frontend-ux/4 + ia-automatizacion/4 = 16
├── ventas/              → 4 raíz + explorador-patagonico/4 + santi-sdr/4 = 12 (sin skill raíz)
├── marketing/           → 4 raíz + seo-contenido/4 = 9 (falta skill raíz)
├── operaciones/         → 4 raíz + finanzas-admin/4 = 8
├── customer-success/    → 4 raíz + asesor-comercial-ia/4 = 8
├── .github/workflows/agentes-clientum.yml
├── scripts/run-agentes.mjs
├── ORGANIGRAMA.md       ← duplicado de docs/agentes/ORGANIGRAMA.md
└── SETUP.md             ← duplicado de docs/agentes/SETUP.md
```

**Carpetas `(2)` — DUPLICADOS EXACTOS (46 archivos):**

| Carpeta duplicada | Archivos | Acción |
|---|---|---|
| `ventas (2)/` | 12 | 🗑️ Eliminar |
| `tecnico (2)/` | 13 | 🗑️ Eliminar |
| `marketing (2)/` | 9 | 🗑️ Eliminar |
| `operaciones (2)/` | 8 | 🗑️ Eliminar |
| `customer-success (2)/` | 8 | 🗑️ Eliminar |
| `orquestador (2)/` | 4 | 🗑️ Eliminar |
| `ORGANIGRAMA (2).md` | 1 | 🗑️ Eliminar |
| **Total** | **55** | |

**También duplicados respecto a raíz de agentes:**
- `clientum-agentes/ORGANIGRAMA.md` ← ya existe `docs/agentes/ORGANIGRAMA.md`
- `clientum-agentes/SETUP.md` ← ya existe `docs/agentes/SETUP.md`

---

### `docs/chats/` — 18 archivos ✅

Exports de conversaciones con LLMs durante el sprint julio 2026. Valor como referencia histórica; no se usan en producción.

| Archivo | Tamaño aprox | Contenido |
|---|---|---|
| `chatgpt-2026-07-13.md` | 42 KB | Importación CSV WooCommerce |
| `chatgpt-2026-07-14.md` | 22 KB | Integración Stripe |
| `claude-2026-07-13.md` | 26 KB | Desarrollo general |
| `claude-2026-07-14-mistral.md` | 14 KB | Comparación modelos |
| `claude-2026-07-14-vercel.md` | 17 KB | Deploy a Vercel |
| `claude-2026-07-17.md` | 32 KB | Sesión principal Jul 17 |
| `claude-2026-07-17-v2.md` | 30 KB | Continuación |
| `claude-2026-07-17-mds.md` | 15 KB | Análisis de archivos ZIP |
| `gemini-2026-07-14.md` | 4.6 KB | Manejo de archivos |
| `chat-2026-07-17.md` | 8.5 KB | Sync de secrets |
| `chat-agente-2026-07-17.md` | 8.5 KB | Trabajo con agente |
| `chat-agente-2026-07-17-cont.md` | 6.0 KB | Continuación agente |
| `replit-2026-07-14-estado.txt` | 17 KB | Estado del sistema |
| `replit-2026-07-14-secrets.txt` | 32 KB | Rotación de claves |
| `replit-2026-07-16-alerta.txt` | 8.3 KB | Alertas de seguridad |
| `replit-2026-07-16-orquestador.txt` | 18 KB | Diseño organigrama |
| `misc.md` | 7.1 KB | Bugs varios |
| `README.md` | 1.5 KB | Índice de chats |

---

### `docs/docs-raiz/` — 9 archivos

Documentación maestra del proyecto. La mayoría actualizada al 17 Jul 2026.

| Archivo | Líneas | Estado | Notas |
|---|---|---|---|
| `ARCHITECTURE.md` | 366 | ✅ Actualizado | Stack React 19, Express, Neon, Gemini |
| `BUILD.md` | 531 | ✅ Actualizado | Guía implementación Hermes Prime |
| `INTEGRATION.md` | 69 | ✅ Actualizado | APIs externas (Gemini, Apify, Hunter) |
| `SESIONES.md` | 278 | ✅ Actualizado | Bitácora 10–17 jul 2026 |
| `INFORMES.md` | 229 | ✅ Actualizado | Análisis consolidado de chats |
| `hermes-santi.md` | 696 | ✅ Actualizado | Docs del agente SDR Santi |
| `README.md` | 171 | ⚠️ Revisar | Puede referenciar archivos eliminados |
| `DOCS-INDEX.md` | 257 | ⚠️ Desactualizado | Generado manualmente, puede no reflejar estructura actual |
| `ANALISIS-DOCS.md` | — | 🔄 Este archivo | Reemplaza la versión que describía 1.859 archivos |

---

### `docs/negocio/` — 4 archivos ✅

Solo quedan las propuestas comerciales (brochures, catálogos y logos fueron comprimidos en sesiones anteriores y movidos a `docs/docs-zips/`).

| Archivo | Tipo | Contenido |
|---|---|---|
| `propuestas/propuesta-ecommerce-unificada.html` | HTML | Propuesta ecommerce completa |
| `propuestas/propuesta-gaman-v2.pdf` | PDF | Propuesta cliente Gaman v2 |
| `propuestas/propuesta-koala.mhtml` | MHTML | Propuesta cliente Koala (captura web) |
| `propuestas/propuesta-koala.pdf` | PDF | Propuesta cliente Koala (PDF) |

---

### `docs/proyecto/` — 15 archivos

#### Assets (2 archivos) ✅
| Archivo | Contenido |
|---|---|
| `assets/favicon.svg` | Favicon del proyecto |
| `assets/image.png` | Imagen genérica de referencia |

#### Backups (0 archivos) 🗑️
`docs/proyecto/backups/` está **vacío**. Puede eliminarse.

#### Config (2 archivos) 🔴 CRÍTICO
| Archivo | Tamaño | Estado |
|---|---|---|
| `config/.env-ejemplo2` | 1.756 B | 🔴 **Contiene credenciales reales**: NEON_PROJECT_ID, NEON_API_KEY, DATABASE_URL, NEON_DATABASE_URL, GITHUB_PAT |
| `config/env-completo.env` | 6.789 B | 🔴 **Potencialmente todas las env vars del proyecto** — revisar y redactar antes de compartir |

#### Notas Técnicas (9 archivos + 1 sensible) ✅/⚠️
| Archivo | Contenido | Estado |
|---|---|---|
| `agentes-prompts.md` | Estrategias y prompts de agentes IA | ✅ |
| `cloudflare-worker.md` | Config y código del worker CF | ✅ |
| `errores-ts.md` | Historial de errores TypeScript resueltos | ✅ |
| `estructura-proyecto-replit.md` | Árbol del proyecto en Replit | ⚠️ Puede desactualizarse rápido |
| `github-actions.md` | CI/CD con GitHub Actions | ✅ |
| `neon.md` | Config y quirks de Neon Postgres | ✅ |
| `replit.md` | Notas específicas del entorno Replit | ✅ |
| `vercel.md` | Deploy a Vercel, variables, dominios | ✅ |
| `leaked-env-keys-HISTORIAL.txt` | Registro de claves filtradas históricamente | ⚠️ Sensible — no compartir |

#### Raíz proyecto (2 archivos) ✅
| Archivo | Contenido |
|---|---|
| `REMIX-LIMITACIONES-FREE.md` | Limitaciones del plan free de Remix/Replit |
| `SECRETS-AUDITORIA.md` | Auditoría de secretos del proyecto |

---

### `docs/sesiones/` — 2 archivos ✅

| Archivo | Contenido | Estado |
|---|---|---|
| `notas-contexto.md` | Auditoría de seguridad jul 2026, logs de reorganización, historial de keys expuestas | ✅ Actualizado |
| `notas-producto.md` | Mejoras funcionales: fix catálogo "0 items", seeder vendedores, dashboard partners | ✅ Actualizado |

---

### `docs/sitio/` — 6 archivos

| Archivo | Tipo | Contenido | Estado |
|---|---|---|---|
| `copy-final.md` | MD | Fuente de verdad v5 del contenido web (paleta `#1A3461`, planes, copy) | ✅ Jul 2026 |
| `sitemap-clientumlatam.xml` | XML | Sitemap para clientumlatam.com | ✅ |
| `sitemap-mysitemapgenerator.xml` | XML | Sitemap generado por herramienta externa | ✅ |
| `6615647_57_1784265981961.xml` | XML | **Nombre ilegible** — probablemente export automático de herramienta; renombrar | ⚠️ |
| `wordpress/content/clientum-content-fusionado.xml` | XML | Export de contenido WordPress | ✅ Referencia |
| `wordpress/wp-config.php` | PHP | Vacío (0 bytes) — no contiene credenciales | ✅ |

---

### `docs/docs-zips/` — 17 archivos ✅

Archivos comprimidos de recursos históricos, binarios y datos voluminosos.

| Zip | Origen original | Contenido |
|---|---|---|
| `MDS-consolidado.zip` | `docs/sesiones/` | Documento maestro de 516 KB |
| `copy-textos.zip` | `docs/sitio/` | Textos de copy versionados |
| `web-html.zip` | `docs/sitio/` | HTMLs del sitio web |
| `sitemaps.zip` | `docs/sitio/` | Sitemaps adicionales |
| `plugins-activos.zip` | `docs/sitio/wordpress/plugins/` | Plugins WP activos |
| `clientum-theme.zip` | `docs/sitio/wordpress/themes/` | Tema PHP de WordPress |
| `ai-marketing-expert-v1-archivado.zip` | `docs/sitio/wordpress/plugins/` | Plugin v1 archivado |
| `capturas.zip` | `docs/proyecto/` | Capturas PNG del proyecto (~219 imágenes) |
| `codigo.zip` | `docs/proyecto/` | Código fuente archivado |
| `logs.zip` | `docs/proyecto/` | Logs del sistema |
| `neon-console-exports.zip` | `docs/proyecto/notas-tecnicas/` | Exports de consola Neon |
| `archivos-historicos.zip` | `docs/proyecto/notas-tecnicas/` | Docs históricos grandes |
| `attached_assets.zip` | `docs/proyecto/backups/` | Assets adjuntos históricos |
| `raiz-replit-1.zip` | `docs/proyecto/backups/` | Backup raíz Replit v1 |
| `raiz-replit.zip` | `docs/proyecto/backups/` | Backup raíz Replit |
| `raiz.zip` | `docs/proyecto/backups/` | Backup raíz general |
| `woocommerce-versiones-anteriores.zip` | `docs/negocio/catalogo/` | CSV WooCommerce v499/509/521 |

---

## 🛠️ ACCIONES RECOMENDADAS

### Prioridad CRÍTICA 🔴
1. **Rotar credenciales** de `docs/proyecto/config/.env-ejemplo2` si las claves aún están activas (NEON_API_KEY, DATABASE_URL, GITHUB_PAT)
2. **Redactar** `docs/proyecto/config/env-completo.env` — reemplazar valores reales por placeholders `=TU_VALOR_AQUI`

### Prioridad ALTA ⚠️
3. **Eliminar carpetas `(2)`** — 55 archivos duplicados exactos:
   ```bash
   rm -rf "docs/agentes/clientum-agentes/ventas (2)"
   rm -rf "docs/agentes/clientum-agentes/tecnico (2)"
   rm -rf "docs/agentes/clientum-agentes/marketing (2)"
   rm -rf "docs/agentes/clientum-agentes/operaciones (2)"
   rm -rf "docs/agentes/clientum-agentes/customer-success (2)"
   rm -rf "docs/agentes/clientum-agentes/orquestador (2)"
   rm "docs/agentes/clientum-agentes/ORGANIGRAMA (2).md"
   ```
4. **Eliminar carpeta vacía** `docs/proyecto/backups/`
5. **Renombrar** `docs/sitio/6615647_57_1784265981961.xml` a algo legible (ej. `sitemap-tool-export.xml`)
6. **Renombrar** `docs/proyecto/config/.env-ejemplo2` → `.env-ejemplo` (quitar el `2`)

### Prioridad MEDIA 🟡
7. **Actualizar** `docs/docs-raiz/DOCS-INDEX.md` — refleja una estructura antigua
8. **Actualizar referencias internas** en `docs/agentes/HERMES-PRIME.md` — apunta a rutas `docs/ia/` que ya no existen
9. Decidir si `docs/agentes/clientum-agentes/ORGANIGRAMA.md` y `SETUP.md` se eliminan (ya existen en `docs/agentes/`)

### Prioridad BAJA 🟢
10. `docs/proyecto/notas-tecnicas/estructura-proyecto-replit.md` se desactualiza con cada cambio de árbol — considerar eliminarlo o automatizar su regeneración

---

## 📈 EVOLUCIÓN DEL REPOSITORIO

| Fecha | Archivos | Carpetas | Hito |
|---|---|---|---|
| ~Jun 2026 | 1.866 | 271 | Estado inicial |
| Jul 2026 sesión 1 | 766 | 107 | Primera limpieza |
| Jul 2026 sesión 2 | 114 | 21 | Fusión agentes, compresión binarios |
| Jul 17 (actual) | **191** | ~20 | +zips en docs-zips, +chats nuevos |
