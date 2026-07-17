// scripts/run-agentes.mjs
//
// FASE 1 — Orquestador: Jonathan abre un issue con label "agente:orquestador" y
// una instrucción en texto libre. El Orquestador la lee, decide con Gemini cuál de
// los agentes del ROSTER la debe ejecutar, y re-etiqueta el issue como
// "agente:<carpeta-elegida>". No hace falta que Jonathan sepa la taxonomía interna.
//
// FASE 2 — Loop normal: recorre los issues abiertos agrupados por label
// "agente:<carpeta>". Por cada uno: lee identidad.md -> memoria.md -> proceso.md ->
// skill.md del agente, llama a Gemini con ese contexto + el issue, postea la
// respuesta como comentario, y si el agente marca "ESTADO: DONE" cierra el issue
// y reescribe memoria.md.
//
// Requiere: GITHUB_TOKEN, GEMINI_API_KEY, GITHUB_REPOSITORY (owner/repo)
// Sin dependencias externas — usa fetch nativo de Node 20.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const [OWNER, REPO] = (process.env.GITHUB_REPOSITORY || "").split("/");
const GEMINI_MODEL = "gemini-2.0-flash";
const LABEL_PREFIX = "agente:";
const ORQUESTADOR_LABEL = "agente:orquestador";

// Roster cerrado de agentes a los que el Orquestador puede rutear un issue.
// Si sumás/sacás una carpeta de agente, actualizá esta lista también.
const ROSTER = [
  { folder: "tecnico", desc: "CTO AI — coordina trabajo técnico general, decide backend vs frontend vs IA/automatización" },
  { folder: "tecnico/backend-infra", desc: "APIs, autenticación, base de datos, bugs y deploys" },
  { folder: "tecnico/frontend-ux", desc: "CRM Kanban, dashboard, UI, componentes React" },
  { folder: "tecnico/ia-automatizacion", desc: "Brochures, MEDDIC scoring, enriquecimiento de contactos" },
  { folder: "ventas", desc: "Sales Manager AI — coordina prospección, outreach, calificación, cierre" },
  { folder: "ventas/santi-sdr", desc: "SDR outbound — contacta leads por WhatsApp y los clasifica" },
  { folder: "ventas/explorador-patagonico", desc: "Lead generation — prospección en Google Maps/Apify" },
  { folder: "marketing", desc: "Marketing Manager AI — coordina contenido, SEO, campañas" },
  { folder: "marketing/seo-contenido", desc: "Blog posts, landing pages, keywords" },
  { folder: "customer-success", desc: "CS Manager AI — salud de clientes, onboarding, churn" },
  { folder: "customer-success/asesor-comercial-ia", desc: "Chatbot inbound del sitio web" },
  { folder: "operaciones", desc: "COO AI — reportes, métricas, alertas de anomalías" },
  { folder: "operaciones/finanzas-admin", desc: "Reportes semanales, MRR, facturación, pipeline revenue" },
];

if (!GITHUB_TOKEN || !GEMINI_API_KEY || !OWNER || !REPO) {
  console.error("Faltan variables de entorno (GITHUB_TOKEN / GEMINI_API_KEY / GITHUB_REPOSITORY).");
  process.exit(1);
}

const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function gh(pathname, opts = {}) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...opts,
    headers: { ...ghHeaders, ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`GitHub API ${pathname} -> ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function listOpenIssues() {
  return gh(`/repos/${OWNER}/${REPO}/issues?state=open&per_page=100`);
}

async function listComments(issueNumber) {
  return gh(`/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments?per_page=50`);
}

async function postComment(issueNumber, body) {
  return gh(`/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function closeIssue(issueNumber) {
  return gh(`/repos/${OWNER}/${REPO}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

async function setLabels(issueNumber, labels) {
  // Reemplaza TODAS las labels del issue por la lista dada.
  // Si una label no existe en el repo, GitHub la crea sola.
  return gh(`/repos/${OWNER}/${REPO}/issues/${issueNumber}/labels`, {
    method: "PUT",
    body: JSON.stringify({ labels }),
  });
}

function agentFolderFromLabels(labels) {
  const label = labels.map((l) => (typeof l === "string" ? l : l.name)).find((n) => n?.startsWith(LABEL_PREFIX));
  if (!label) return null;
  return label.slice(LABEL_PREFIX.length).trim(); // ej: "ventas/santi-sdr"
}

async function readAgentFiles(folder) {
  const base = path.join(process.cwd(), folder);
  const files = ["identidad.md", "memoria.md", "proceso.md", "skill.md"];
  const out = {};
  for (const f of files) {
    const p = path.join(base, f);
    out[f] = existsSync(p) ? await readFile(p, "utf8") : `(no existe ${f})`;
  }
  return out;
}

async function callGemini(systemContext, issue, comments) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const historial = comments.map((c) => `--- comentario previo (${c.user?.login}) ---\n${c.body}`).join("\n\n");

  const prompt = `
Sos un agente autónomo de Clientum. Actuá SIEMPRE según tu identidad, memoria y proceso.
No inventes herramientas que no tengas en tu skill.md.

# IDENTIDAD
${systemContext["identidad.md"]}

# MEMORIA (contexto acumulado)
${systemContext["memoria.md"]}

# PROCESO
${systemContext["proceso.md"]}

# SKILL (herramientas disponibles)
${systemContext["skill.md"]}

# TAREA (issue de GitHub)
Título: ${issue.title}
Descripción: ${issue.body || "(sin descripción)"}

${historial}

# INSTRUCCIONES DE RESPUESTA
1. Ejecutá el siguiente paso concreto de la tarea según tu proceso.md.
2. Si con este paso la tarea queda completa, terminá tu respuesta con la línea exacta: ESTADO: DONE
3. Si falta trabajo para una próxima corrida, terminá con: ESTADO: EN_PROGRESO
4. Sé breve y concreto, esto se postea como comentario en el issue.
`.trim();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini API -> ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(sin respuesta del modelo)";
}

async function routearConGemini(issue) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const listaRoster = ROSTER.map((r) => `- ${r.folder} → ${r.desc}`).join("\n");

  const prompt = `
Sos el Orquestador de Clientum. Tu único trabajo es leer una instrucción de Jonathan
(el dueño de la empresa) y decidir cuál de estos agentes la debe ejecutar.
NUNCA ejecutás la tarea vos mismo, solo la ruteás.

# ROSTER DE AGENTES DISPONIBLES (elegí EXACTAMENTE uno de estos "folder")
${listaRoster}

# INSTRUCCIÓN DE JONATHAN
Título: ${issue.title}
Descripción: ${issue.body || "(sin descripción)"}

# RESPUESTA
Respondé con SOLO dos líneas, sin nada más:
AGENTE: <folder exacto del roster>
RAZON: <una frase corta de por qué>
`.trim();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini API (routeo) -> ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const folderMatch = texto.match(/AGENTE:\s*(\S+)/i);
  const razonMatch = texto.match(/RAZON:\s*(.+)/i);
  const folder = folderMatch?.[1]?.trim();
  const razon = razonMatch?.[1]?.trim() || "(sin razón provista)";

  const valido = ROSTER.some((r) => r.folder === folder);
  if (!valido) throw new Error(`Gemini devolvió un agente fuera del roster: "${folder}"`);

  return { folder, razon };
}

async function runOrquestador() {
  const issues = await listOpenIssues();
  const paraRutear = issues.filter(
    (i) => !i.pull_request && i.labels.some((l) => (typeof l === "string" ? l : l.name) === ORQUESTADOR_LABEL)
  );

  if (paraRutear.length === 0) {
    console.log("Orquestador: no hay instrucciones nuevas de Jonathan para rutear.");
    return;
  }

  for (const issue of paraRutear) {
    console.log(`Orquestador -> rutear issue #${issue.number} "${issue.title}"`);
    try {
      const { folder, razon } = await routearConGemini(issue);

      const labelsActuales = issue.labels.map((l) => (typeof l === "string" ? l : l.name)).filter((n) => n !== ORQUESTADOR_LABEL);

      await setLabels(issue.number, [...labelsActuales, `${LABEL_PREFIX}${folder}`]);
      await postComment(
        issue.number,
        `**Orquestador** asignó este issue a \`${folder}\`.\nMotivo: ${razon}\n\nSe procesa en la próxima corrida del cron (máx. 15 min).`
      );
      await updateMemoria("orquestador", issue, `Ruteado a ${folder}. ${razon}`, "RUTEADO");
      console.log(`   Ruteado a ${folder}.`);
    } catch (err) {
      console.error(`   Error ruteando issue #${issue.number}:`, err.message);
      await postComment(
        issue.number,
        `**Orquestador**: no pude clasificar este issue automáticamente (${err.message}). Necesito que le pongas manualmente el label \`agente:<carpeta>\` correcto.`
      ).catch(() => {});
    }
  }
}

async function updateMemoria(folder, issue, respuesta, estado) {
  const memoriaPath = path.join(process.cwd(), folder, "memoria.md");
  const fecha = new Date().toISOString().slice(0, 16).replace("T", " ");
  const entrada = `\n- **${fecha}** — Issue #${issue.number} "${issue.title}" — estado: ${estado}\n  ${respuesta.slice(0, 400).replace(/\n/g, " ")}\n`;

  let actual = existsSync(memoriaPath) ? await readFile(memoriaPath, "utf8") : "# Memoria\n";
  if (actual.includes("(vacío — primera ejecución pendiente)")) {
    actual = actual.replace("(vacío — primera ejecución pendiente)", "").trimEnd() + "\n";
  }
  await writeFile(memoriaPath, actual + entrada, "utf8");
}

async function main() {
  // Fase 1: el Orquestador clasifica y rutea las instrucciones nuevas de Jonathan
  // (issues con label "agente:orquestador") hacia el agente que corresponde.
  await runOrquestador();

  // Fase 2: cada agente procesa los issues que ya tiene asignados.
  const issues = await listOpenIssues();
  const conAgente = issues.filter((i) => !i.pull_request && agentFolderFromLabels(i.labels));

  if (conAgente.length === 0) {
    console.log("No hay issues abiertos con label 'agente:*'. Nada que hacer en esta corrida.");
    return;
  }

  for (const issue of conAgente) {
    const folder = agentFolderFromLabels(issue.labels);
    console.log(`-> Issue #${issue.number} "${issue.title}" — agente: ${folder}`);

    try {
      const agentFiles = await readAgentFiles(folder);
      const comments = await listComments(issue.number);
      const respuesta = await callGemini(agentFiles, issue, comments);

      await postComment(issue.number, respuesta);

      const estado = respuesta.includes("ESTADO: DONE") ? "DONE" : "EN_PROGRESO";
      await updateMemoria(folder, issue, respuesta, estado);

      if (estado === "DONE") {
        await closeIssue(issue.number);
        console.log(`   Issue #${issue.number} cerrado (DONE).`);
      } else {
        console.log(`   Issue #${issue.number} sigue abierto, se retoma en la próxima corrida.`);
      }
    } catch (err) {
      console.error(`   Error procesando issue #${issue.number}:`, err.message);
      // No corta el resto del loop — sigue con los demás issues.
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
