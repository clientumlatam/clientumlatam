// scripts/run-agentes.mjs
//
// FASE 1 — Orquestador: Jonathan abre un issue con label "agente:orquestador" y
// una instrucción en texto libre. El Orquestador la lee, decide con Gemini cuál de
// los agentes del ROSTER la debe ejecutar, y re-etiqueta el issue como
// "agente:<carpeta-elegida>". No hace falta que Jonathan sepa la taxonomía interna.
//
// FASE 2 — Loop normal: recorre los issues abiertos agrupados por label
// "agente:<carpeta>". Por cada uno: lee la ficha del agente (fichas/<slug>.md),
// parsea las secciones ## Identidad / ## Memoria / ## Proceso / ## Skill,
// llama a Gemini con ese contexto + el issue, postea la respuesta como comentario,
// y si el agente marca "ESTADO: DONE" (al final de línea) cierra el issue y
// actualiza la sección ## Memoria en la misma ficha.
//
// Requiere: GITHUB_TOKEN, GEMINI_API_KEY, GITHUB_REPOSITORY (owner/repo)
// Sin dependencias externas — usa fetch nativo de Node 20.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Directorio de fichas — relativo al script, no a process.cwd()
// Estructura: docs/referencia-tecnica/agentes/scripts/run-agentes.mjs
//             docs/referencia-tecnica/agentes/fichas/<slug>.md
const __filename = fileURLToPath(import.meta.url);
const __dirname_script = path.dirname(__filename);
const FICHAS_DIR = path.resolve(__dirname_script, "..", "fichas");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const [OWNER, REPO] = (process.env.GITHUB_REPOSITORY || "").split("/");
const GEMINI_MODEL = "gemini-2.0-flash";
const LABEL_PREFIX = "agente:";
const ORQUESTADOR_LABEL = "agente:orquestador";

// Roster cerrado de agentes a los que el Orquestador puede rutear un issue.
// El campo "folder" debe coincidir con el slug del archivo en fichas/:
//   folder "ventas/santi-sdr" → fichas/ventas-santi-sdr.md
// Si sumás/sacás un agente, actualizá esta lista y creá/renombrá la ficha.
const ROSTER = [
  { folder: "tecnico",                      desc: "CTO AI — coordina trabajo técnico general, decide backend vs frontend vs IA/automatización" },
  { folder: "tecnico/backend-infra",        desc: "APIs, autenticación, base de datos, bugs y deploys" },
  { folder: "tecnico/frontend-ux",          desc: "CRM Kanban, dashboard, UI, componentes React" },
  { folder: "tecnico/ia-automatizacion",    desc: "Brochures, MEDDIC scoring, enriquecimiento de contactos" },
  { folder: "ventas",                       desc: "Sales Manager AI — coordina prospección, outreach, calificación, cierre" },
  { folder: "ventas/santi-sdr",             desc: "SDR outbound — contacta leads por WhatsApp y los clasifica" },
  { folder: "ventas/explorador-patagonico", desc: "Lead generation — prospección en Google Maps/Apify" },
  { folder: "marketing",                    desc: "Marketing Manager AI — coordina contenido, SEO, campañas" },
  { folder: "marketing/seo-contenido",      desc: "Blog posts, landing pages, keywords" },
  { folder: "customer-success",             desc: "CS Manager AI — salud de clientes, onboarding, churn" },
  { folder: "customer-success/asesor",      desc: "Chatbot inbound del sitio web" },
  { folder: "operaciones",                  desc: "COO AI — reportes, métricas, alertas de anomalías" },
  { folder: "operaciones/finanzas-admin",   desc: "Reportes semanales, MRR, facturación, pipeline revenue" },
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

// Convierte folder "ventas/santi-sdr" → ruta absoluta a fichas/<slug>.md
// El orquestador usa su propio slug "orquestador".
function folderToFichaPath(folder) {
  const slug = folder.replace(/\//g, "-");
  return path.join(FICHAS_DIR, `${slug}.md`);
}

// Lee fichas/<slug>.md y parsea sus secciones ## por nombre.
// Devuelve un objeto con claves "identidad.md", "memoria.md", "proceso.md", "skill.md"
// para mantener compatibilidad con el prompt de callGemini.
async function readAgentFiles(folder) {
  const fichaPath = folderToFichaPath(folder);
  const empty = {
    "identidad.md": "(no existe — ficha no encontrada)",
    "memoria.md":   "(vacío — sin historial previo)",
    "proceso.md":   "(no existe — ficha no encontrada)",
    "skill.md":     "(no existe — ficha no encontrada)",
  };

  if (!existsSync(fichaPath)) {
    console.warn(`  [readAgentFiles] ficha no encontrada: ${fichaPath}`);
    return empty;
  }

  const content = await readFile(fichaPath, "utf8");

  // Parsea secciones delimitadas por "## <Nombre>"
  const sectionMap = {
    identidad: "identidad.md",
    memoria:   "memoria.md",
    proceso:   "proceso.md",
    skill:     "skill.md",
  };
  const result = { ...empty };

  // Divide por líneas que empiezan con "## "
  const parts = content.split(/(?=^## )/m);
  for (const part of parts) {
    const headerMatch = part.match(/^## (.+)/);
    if (!headerMatch) continue;
    const headerKey = headerMatch[1].trim().toLowerCase();
    const body = part.slice(headerMatch[0].length).trim();
    const mapped = Object.keys(sectionMap).find((k) => headerKey.startsWith(k));
    if (mapped) result[sectionMap[mapped]] = body || `(sección ${mapped} vacía)`;
  }

  return result;
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

// Actualiza la sección ## Memoria dentro de fichas/<slug>.md.
// Si la sección no existe la crea al final del archivo.
async function updateMemoria(folder, issue, respuesta, estado) {
  const fichaPath = folderToFichaPath(folder);

  const fecha  = new Date().toISOString().slice(0, 16).replace("T", " ");
  const linea  = `- **${fecha}** — Issue #${issue.number} "${issue.title}" — estado: ${estado}\n  ${respuesta.slice(0, 400).replace(/\n/g, " ")}`;

  if (!existsSync(fichaPath)) {
    // La ficha no existe todavía: créala con una sección Memoria mínima.
    await writeFile(fichaPath, `# ${folder}\n\n## Memoria\n${linea}\n`, "utf8");
    return;
  }

  let text = await readFile(fichaPath, "utf8");

  // Elimina placeholder si existe
  text = text.replace(/\(vacío[^\n]*\)\n?/g, "");

  const lines = text.split("\n");
  let memoriaIdx = -1;
  let nextSectionIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^## Memoria\b/i.test(lines[i])) {
      memoriaIdx = i;
      continue;
    }
    if (memoriaIdx !== -1 && /^## /.test(lines[i])) {
      nextSectionIdx = i;
      break;
    }
  }

  if (memoriaIdx === -1) {
    // No existe sección Memoria — la agrega al final
    text = text.trimEnd() + `\n\n## Memoria\n${linea}\n`;
  } else if (nextSectionIdx === -1) {
    // Memoria es la última sección — inserta al final del archivo
    text = text.trimEnd() + `\n${linea}\n`;
  } else {
    // Inserta antes de la siguiente sección
    lines.splice(nextSectionIdx, 0, linea, "");
    text = lines.join("\n");
  }

  await writeFile(fichaPath, text, "utf8");
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
      const comments   = await listComments(issue.number);
      const respuesta  = await callGemini(agentFiles, issue, comments);

      await postComment(issue.number, respuesta);

      // Ancla el match a una línea propia para evitar falsos positivos
      // si Gemini menciona "ESTADO: DONE" dentro de una explicación.
      const estado = /^ESTADO:\s*DONE\s*$/m.test(respuesta) ? "DONE" : "EN_PROGRESO";
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
