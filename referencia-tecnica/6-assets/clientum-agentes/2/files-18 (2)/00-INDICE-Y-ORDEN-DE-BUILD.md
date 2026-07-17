# Índice de implementación — Sistema de Agentes Autónomos Clientum

Este set de documentos es la especificación completa para que Replit Agent
construya, desde cero, el sistema de agentes IA descripto en
`docs/agentes/ORGANIGRAMA.md` y `docs/agentes/SETUP.md`. Esos dos archivos ya
existen en el repo y son la fuente de verdad de la taxonomía (qué agentes hay,
quién depende de quién). Este set NO los reemplaza: los implementa.

También asume que ya existen, por cada agente, los 4 archivos de contexto:
`identidad.md`, `memoria.md`, `proceso.md`, `skill.md` (carpetas bajo
`docs/agentes/<departamento>/[<sub-agente>/]`). Si algún agente todavía no
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
