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
