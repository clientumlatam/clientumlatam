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
