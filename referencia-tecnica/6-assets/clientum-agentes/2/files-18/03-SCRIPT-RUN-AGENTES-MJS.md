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
