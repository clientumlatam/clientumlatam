import React, { useState } from "react";

type NodeKind = "human" | "ai" | "hybrid";
type NodeStatus = "done" | "hermes" | "pending";

interface OrgNode {
  id: string;
  title: string;
  subtitle: string;
  kind: NodeKind;
  dept: string;
  description: string;
  tools?: string[];
  status?: NodeStatus;
  children?: OrgNode[];
}

const DEPT_COLORS: Record<string, { bg: string; border: string; accent: string; glow: string }> = {
  ceo:       { bg: "#0a0f1e", border: "#6366f1", accent: "#a5b4fc", glow: "#6366f133" },
  tech:      { bg: "#0b1525", border: "#0ea5e9", accent: "#7dd3fc", glow: "#0ea5e933" },
  ventas:    { bg: "#0c1c0c", border: "#22c55e", accent: "#86efac", glow: "#22c55e33" },
  marketing: { bg: "#180f24", border: "#a855f7", accent: "#d8b4fe", glow: "#a855f733" },
  cs:        { bg: "#1c1400", border: "#f59e0b", accent: "#fde68a", glow: "#f59e0b33" },
  ops:       { bg: "#1a0a0a", border: "#ef4444", accent: "#fca5a5", glow: "#ef444433" },
};

const KIND_BADGE: Record<NodeKind, { label: string; color: string }> = {
  human:  { label: "👤 Humano",    color: "#475569" },
  ai:     { label: "🤖 Agente IA", color: "#4f46e5" },
  hybrid: { label: "⚡ Híbrido",   color: "#b45309" },
};

const STATUS_BADGE: Record<NodeStatus, { icon: string; label: string; color: string }> = {
  done:    { icon: "✅", label: "Implementado",      color: "#16a34a" },
  hermes:  { icon: "⚠️", label: "Delega a Hermes",  color: "#d97706" },
  pending: { icon: "🔲", label: "Pendiente",         color: "#6b7280" },
};

const ORG: OrgNode = {
  id: "ceo",
  title: "Jonathan",
  subtitle: "CEO & Fundador",
  kind: "human",
  dept: "ceo",
  description: "Dueño de Clientum. Toma decisiones estratégicas, cierra deals y supervisa agentes vía chat.",
  children: [
    {
      id: "orquestador",
      title: "Orquestador IA",
      subtitle: "Chief of Staff AI",
      kind: "ai",
      dept: "ceo",
      status: "done",
      description: "Recibe instrucciones de Jonathan vía GitHub Issue y delega a los 5 agentes departamentales. Cron cada 15 min. No ejecuta tareas él mismo.",
      tools: ["Gemini", "GitHub Issues", "Task router"],
      children: [
        {
          id: "agente-tech",
          title: "Agente Técnico",
          subtitle: "CTO AI",
          kind: "ai",
          dept: "tech",
          status: "done",
          description: "Coordina Backend/Infra, Frontend/UX e IA & Automatización. Verifica CI y deploy en Vercel antes de marcar una tarea como lista.",
          tools: ["GitHub Actions", "Vercel", "Neon DB"],
          children: [
            {
              id: "backend",
              title: "Backend / Infra",
              subtitle: "Node.js · Express · Neon",
              kind: "hybrid",
              dept: "tech",
              status: "done",
              description: "APIs, autenticación, DB schema, bugs y deploys. Modo propuesta — sugiere cambios al Agente Técnico.",
              tools: ["Express", "Neon Postgres", "Vercel Serverless"],
            },
            {
              id: "frontend",
              title: "Frontend / UX",
              subtitle: "React 19 · Vite · Tailwind v4",
              kind: "hybrid",
              dept: "tech",
              status: "done",
              description: "CRM Kanban, brochures, dashboard y UI. Paleta navy/gold. Modo propuesta — valida con Agente Técnico.",
              tools: ["React 19", "Tailwind v4", "Recharts"],
            },
            {
              id: "ia-core",
              title: "IA & Automatización",
              subtitle: "Gemini · Apify · Hunter",
              kind: "ai",
              dept: "tech",
              status: "done",
              description: "Generación de brochures personalizados, MEDDIC scoring automático, enriquecimiento de contactos vía Hunter/Apify.",
              tools: ["Gemini API", "Apify Actors", "Hunter.io"],
            },
          ],
        },
        {
          id: "agente-ventas",
          title: "Agente de Ventas",
          subtitle: "Sales Manager AI",
          kind: "ai",
          dept: "ventas",
          status: "done",
          description: "Pipeline completo: prospección → outreach → calificación MEDDIC → cierre. Revisa CRM Kanban cada 15 min.",
          tools: ["CRM Kanban", "MEDDIC", "WhatsApp"],
          children: [
            {
              id: "explorador",
              title: "Explorador Patagónico",
              subtitle: "Lead Generator AI",
              kind: "ai",
              dept: "ventas",
              status: "done",
              description: "Prospección en Google Maps, Guía Oleo y Apify. Calcula fit score y nunca repite prospectos ya contactados.",
              tools: ["Google Maps API", "Apify", "Gemini Search"],
            },
            {
              id: "santi",
              title: "Santi SDR",
              subtitle: "SDR Outbound AI",
              kind: "ai",
              dept: "ventas",
              status: "hermes",
              description: "Contacta hasta 15 leads/día vía WhatsApp. Clasifica: caliente → escala a Jonathan, tibio → 2 follow-ups, frío → descarta.",
              tools: ["Hermes Agent", "WhatsApp Cloud API", "CRM API"],
            },
            {
              id: "closer",
              title: "Jonathan (Closer)",
              subtitle: "Account Executive",
              kind: "human",
              dept: "ventas",
              description: "Toma las reuniones agendadas por Santi. Único autorizado a negociar precios y cerrar contratos.",
              tools: ["Zoom", "WhatsApp personal"],
            },
          ],
        },
        {
          id: "agente-marketing",
          title: "Agente de Marketing",
          subtitle: "Marketing Manager AI",
          kind: "ai",
          dept: "marketing",
          status: "done",
          description: "Genera contenido, gestiona SEO y campañas. Paleta navy/gold, foco en keywords Patagonia. Coordina a SEO & Contenido.",
          tools: ["Gemini", "WordPress", "Google Analytics"],
          children: [
            {
              id: "seo",
              title: "SEO & Contenido",
              subtitle: "Content AI",
              kind: "ai",
              dept: "marketing",
              status: "pending",
              description: "Blog posts y landing pages por industria. Keywords Patagonia. Escribe en criollo, orientado a conversión.",
              tools: ["WordPress plugin", "Gemini", "Search Console"],
            },
          ],
        },
        {
          id: "agente-cs",
          title: "Agente Customer Success",
          subtitle: "CS Manager AI",
          kind: "ai",
          dept: "cs",
          status: "done",
          description: "Monitorea salud de clientes activos, gestiona onboarding y detecta riesgo de churn antes de que el cliente se queje.",
          tools: ["CRM", "WhatsApp", "Gemini"],
          children: [
            {
              id: "asesor",
              title: "Asesor Comercial IA",
              subtitle: "Inbound Chatbot",
              kind: "ai",
              dept: "cs",
              status: "done",
              description: "Captura leads inbound desde el sitio. Responde consultas, califica interés y carga en CRM vía webhook.",
              tools: ["Chatbot widget", "CRM webhook", "Gemini"],
            },
          ],
        },
        {
          id: "agente-ops",
          title: "Agente de Operaciones",
          subtitle: "COO AI",
          kind: "ai",
          dept: "ops",
          status: "done",
          description: "Reportes semanales, monitoreo de MRR/leads/conversión/churn. Alerta anomalías inmediatamente sin esperar el reporte.",
          tools: ["Neon DB", "Retool", "Gemini"],
          children: [
            {
              id: "finanzas",
              title: "Finanzas & Admin",
              subtitle: "Reportes & Métricas",
              kind: "hybrid",
              dept: "ops",
              status: "pending",
              description: "MRR, facturación AFIP, suscripciones MercadoPago, pipeline revenue. Dashboard ejecutivo semanal en formato fijo.",
              tools: ["CRM Dashboard", "Neon DB", "AFIP", "MercadoPago"],
            },
          ],
        },
      ],
    },
  ],
};

function StatusDot({ status }: { status?: NodeStatus }) {
  if (!status) return null;
  const s = STATUS_BADGE[status];
  return (
    <span style={{
      position: "absolute", top: 6, right: 8,
      fontSize: 10, lineHeight: 1,
      title: s.label,
    }} title={s.label}>
      {s.icon}
    </span>
  );
}

function NodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const colors = DEPT_COLORS[node.dept];
  const badge = KIND_BADGE[node.kind];
  const hasChildren = node.children && node.children.length > 0;

  const cardW = depth === 0 ? 256 : depth === 1 ? 210 : 182;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? `linear-gradient(145deg, ${colors.bg}f0, ${colors.bg}cc)`
            : `linear-gradient(145deg, ${colors.bg}, ${colors.bg}dd)`,
          border: `1.5px solid ${hovered ? colors.accent : colors.border}`,
          borderRadius: 14,
          padding: depth === 0 ? "22px 26px 18px" : depth === 1 ? "16px 16px 14px" : "12px 14px 10px",
          width: cardW,
          cursor: hasChildren ? "pointer" : "default",
          transition: "all 0.18s ease",
          boxShadow: hovered
            ? `0 0 28px ${colors.glow}, 0 6px 24px #00000066`
            : `0 2px 14px #00000044`,
          position: "relative",
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <StatusDot status={node.status} />

        {/* Kind badge */}
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: badge.color,
          color: "#fff", fontSize: 9.5, fontWeight: 700,
          padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.4,
        }}>
          {badge.label}
        </div>

        {/* Title */}
        <div style={{
          color: colors.accent, fontWeight: 800,
          fontSize: depth === 0 ? 19 : depth === 1 ? 14 : 12.5,
          lineHeight: 1.2, marginBottom: 2, marginTop: 4,
          letterSpacing: depth === 0 ? -0.3 : 0,
        }}>
          {node.title}
        </div>

        {/* Subtitle */}
        <div style={{
          color: "#94a3b8",
          fontSize: depth === 0 ? 11.5 : 10.5,
          fontWeight: 500, marginBottom: 7, letterSpacing: 0.2,
        }}>
          {node.subtitle}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `${colors.border}33`, marginBottom: 7 }} />

        {/* Description */}
        <div style={{
          color: "#cbd5e1",
          fontSize: depth === 0 ? 11 : 10,
          lineHeight: 1.55,
        }}>
          {node.description}
        </div>

        {/* Tools */}
        {node.tools && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>
            {node.tools.map(t => (
              <span key={t} style={{
                background: `${colors.border}18`,
                border: `1px solid ${colors.border}40`,
                color: colors.accent,
                fontSize: 8.5, padding: "1.5px 5px",
                borderRadius: 4, fontWeight: 600, letterSpacing: 0.1,
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {hasChildren && (
          <div style={{
            position: "absolute", bottom: -11, left: "50%", transform: "translateX(-50%)",
            background: colors.border, color: "#fff", width: 20, height: 20,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, zIndex: 2, lineHeight: 1,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}>
            {expanded ? "−" : "+"}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 2, height: 18, background: `${colors.border}66` }} />

          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Horizontal connector bar */}
            {node.children!.length > 1 && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent 5%, ${colors.border}40 20%, ${colors.border}40 80%, transparent 95%)`,
              }} />
            )}

            {node.children!.map((child) => (
              <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 18, background: `${DEPT_COLORS[child.dept].border}66` }} />
                <NodeCard node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganigramaClientum() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #040c18 0%, #06091a 40%, #040e08 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: "36px 28px 100px",
      overflowX: "auto",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#6366f115", border: "1px solid #6366f130",
          borderRadius: 8, padding: "5px 16px", marginBottom: 14,
          fontSize: 10.5, color: "#818cf8", fontWeight: 700, letterSpacing: 1.2,
        }}>
          ✦ CLIENTUM · ORGANIGRAMA IDEAL · JULIO 2026
        </div>

        <h1 style={{
          color: "#f1f5f9", fontSize: 30, fontWeight: 900, margin: "0 0 10px",
          letterSpacing: -0.8, lineHeight: 1.1,
        }}>
          Estructura Organizacional + Agentes IA
        </h1>

        <p style={{ color: "#64748b", fontSize: 13, maxWidth: 620, margin: "0 auto 20px", lineHeight: 1.6 }}>
          Cada nodo del organigrama es un agente de IA independiente coordinado por el Orquestador Central.
          Jonathan gestiona toda la empresa vía chat con el Orquestador.
        </p>

        {/* Legend row */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 20,
          background: "#0f172a88", border: "1px solid #1e293b",
          borderRadius: 10, padding: "8px 20px", flexWrap: "wrap", justifyContent: "center",
        }}>
          {(Object.entries(KIND_BADGE) as [NodeKind, { label: string; color: string }][]).map(([, b]) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: b.color }} />
              <span style={{ color: "#94a3b8", fontSize: 10.5 }}>{b.label}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: "#1e293b" }} />
          {(Object.entries(STATUS_BADGE) as [NodeStatus, { icon: string; label: string; color: string }][]).map(([, s]) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>{s.icon}</span>
              <span style={{ color: "#94a3b8", fontSize: 10.5 }}>{s.label}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: "#1e293b" }} />
          <span style={{ color: "#475569", fontSize: 10.5 }}>Clic en nodo para colapsar</span>
        </div>
      </div>

      {/* Tree */}
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", paddingBottom: 20 }}>
        <NodeCard node={ORG} depth={0} />
      </div>

      {/* Footer — Hermes Prime layers */}
      <div style={{
        maxWidth: 860, margin: "60px auto 0",
        background: "#0a0f1e88", border: "1px solid #1e293b",
        borderRadius: 14, padding: "22px 28px",
      }}>
        <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
          ⚡ HERMES PRIME — CAPAS DE ARQUITECTURA
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { capa: "CAPA 4 — HUMANO", desc: "Jonathan (CEO) vía WhatsApp / GitHub Issues", color: "#6366f1" },
            { capa: "CAPA 3 — MULTI-AGENTE", desc: "GitHub Actions cron 15 min · Orquestador + 13 agentes · repo clientum-agentes", color: "#0ea5e9" },
            { capa: "CAPA 2 — HERMES AGENT", desc: "Santi SDR (Nous Research) · WhatsApp Cloud API · 15 contactos/día · Ubuntu server", color: "#22c55e" },
            { capa: "CAPA 1 — CLIENTUM CRM", desc: "Express + React 19 + Neon PostgreSQL · clientum.com.ar (Vercel) · API 6 endpoints", color: "#f59e0b" },
            { capa: "CAPA 0 — NEON POSTGRESQL", desc: "users · session · chatbot_leads · santi_leads · santi_brochures · santi_notes", color: "#ef4444" },
          ].map((l) => (
            <div key={l.capa} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: `${l.color}08`, border: `1px solid ${l.color}20`,
              borderRadius: 8, padding: "8px 14px",
            }}>
              <span style={{ color: l.color, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", minWidth: 160 }}>{l.capa}</span>
              <span style={{ color: "#64748b", fontSize: 10.5 }}>{l.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
