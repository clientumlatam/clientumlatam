import React, { useState } from "react";

type NodeKind = "human" | "ai" | "hybrid";

interface OrgNode {
  id: string;
  title: string;
  subtitle: string;
  kind: NodeKind;
  dept: string;
  description: string;
  tools?: string[];
  children?: OrgNode[];
}

const DEPT_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  ceo:       { bg: "#0f172a", border: "#6366f1", accent: "#818cf8" },
  tech:      { bg: "#0c1a2e", border: "#0ea5e9", accent: "#38bdf8" },
  ventas:    { bg: "#0d1f0e", border: "#22c55e", accent: "#4ade80" },
  marketing: { bg: "#1a0e1a", border: "#a855f7", accent: "#c084fc" },
  cs:        { bg: "#1a1000", border: "#f59e0b", accent: "#fcd34d" },
  ops:       { bg: "#1a0a0a", border: "#ef4444", accent: "#f87171" },
};

const KIND_BADGE: Record<NodeKind, { label: string; color: string }> = {
  human:  { label: "👤 Humano",   color: "#64748b" },
  ai:     { label: "🤖 Agente IA", color: "#6366f1" },
  hybrid: { label: "⚡ Híbrido",  color: "#f59e0b" },
};

const ORG: OrgNode = {
  id: "ceo",
  title: "Jonathan",
  subtitle: "CEO & Fundador",
  kind: "human",
  dept: "ceo",
  description: "Dueño de Clientum. Toma decisiones estratégicas, cierra deals y supervisa agentes.",
  children: [
    {
      id: "orquestador",
      title: "Orquestador IA",
      subtitle: "Chief of Staff AI",
      kind: "ai",
      dept: "ceo",
      description: "Recibe instrucciones del CEO vía chat y delega tareas a los agentes departamentales. Coordina flujos multi-agente y reporta resúmenes.",
      tools: ["Gemini", "Chat interface", "Task router"],
      children: [
        {
          id: "agente-tech",
          title: "Agente Técnico",
          subtitle: "CTO AI",
          kind: "ai",
          dept: "tech",
          description: "Gestiona el producto: código, infra, bugs y deploys. Opera sobre el repositorio.",
          tools: ["Replit Agent", "GitHub Actions", "Vercel", "Neon DB"],
          children: [
            {
              id: "backend",
              title: "Backend / Infra",
              subtitle: "Node.js · Express · Neon",
              kind: "hybrid",
              dept: "tech",
              description: "API, autenticación, DB schema y CI/CD.",
              tools: ["server.ts", "PostgreSQL", "Vercel Serverless"],
            },
            {
              id: "frontend",
              title: "Frontend / UX",
              subtitle: "React · Vite · Tailwind",
              kind: "hybrid",
              dept: "tech",
              description: "CRM Kanban, brochures, dashboard y SPA.",
              tools: ["React 19", "Tailwind v4", "Recharts"],
            },
            {
              id: "ia-core",
              title: "IA & Automatización",
              subtitle: "Gemini · Apify · Hunter",
              kind: "ai",
              dept: "tech",
              description: "Generación de brochures, MEDDIC scoring, scraping y enriquecimiento de contactos.",
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
          description: "Supervisa el pipeline completo: prospección → outreach → calificación → cierre.",
          tools: ["CRM Kanban", "MEDDIC", "WhatsApp"],
          children: [
            {
              id: "santi",
              title: "Santi SDR",
              subtitle: "SDR Outbound AI",
              kind: "ai",
              dept: "ventas",
              description: "Contacta leads vía WhatsApp, clasifica respuestas (caliente/tibio/frío) y escala a Jonathan. 15 contactos/día.",
              tools: ["Hermes Agent", "WhatsApp", "CRM API"],
            },
            {
              id: "explorador",
              title: "Explorador Patagónico",
              subtitle: "Lead Generator AI",
              kind: "ai",
              dept: "ventas",
              description: "Descubre prospectos en Google Maps, Guía Cores y Apify. Calcula fit score y genera brochures.",
              tools: ["Google Maps API", "Apify", "Gemini Search"],
            },
            {
              id: "closer",
              title: "Jonathan (Closer)",
              subtitle: "Account Executive",
              kind: "human",
              dept: "ventas",
              description: "Toma las reuniones agendadas por Santi y cierra contratos. Único autorizado a hablar de precios.",
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
          description: "Genera contenido, gestiona SEO, coordina campañas y mantiene la presencia digital de Clientum.",
          tools: ["Gemini", "WordPress", "Google Analytics"],
          children: [
            {
              id: "seo",
              title: "SEO & Contenido",
              subtitle: "Content AI",
              kind: "ai",
              dept: "marketing",
              description: "Blog posts, landing pages por industria, optimización de keywords Patagonia.",
              tools: ["WordPress plugin", "Gemini", "Search Console"],
            },
            {
              id: "chatbot-lead",
              title: "Asesor Comercial IA",
              subtitle: "Inbound Chatbot",
              kind: "ai",
              dept: "marketing",
              description: "Captura leads inbound desde el sitio web. Clasifica y guarda en chatbot_leads.",
              tools: ["ChatbotSim", "CRM webhook", "Gemini"],
            },
          ],
        },
        {
          id: "agente-cs",
          title: "Agente Customer Success",
          subtitle: "CS Manager AI",
          kind: "ai",
          dept: "cs",
          description: "Monitorea salud de clientes activos, gestiona onboarding y detecta riesgo de churn.",
          tools: ["CRM", "WhatsApp", "Gemini"],
          children: [
            {
              id: "onboarding",
              title: "Onboarding",
              subtitle: "Implementación",
              kind: "hybrid",
              dept: "cs",
              description: "Configura el CRM para cada nuevo cliente. Capacitación y setup inicial.",
              tools: ["Guías", "Zoom", "CRM admin"],
            },
          ],
        },
        {
          id: "agente-ops",
          title: "Agente de Operaciones",
          subtitle: "COO AI",
          kind: "ai",
          dept: "ops",
          description: "Genera reportes semanales, monitorea métricas clave (MRR, leads, conversión) y alerta anomalías.",
          tools: ["Neon DB", "Recharts", "Gemini"],
          children: [
            {
              id: "finanzas",
              title: "Finanzas & Admin",
              subtitle: "Reportes & Métricas",
              kind: "hybrid",
              dept: "ops",
              description: "MRR, facturación, pipeline revenue. Dashboard ejecutivo semanal.",
              tools: ["CRM Dashboard", "Neon DB"],
            },
          ],
        },
      ],
    },
  ],
};

function NodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const colors = DEPT_COLORS[node.dept];
  const badge = KIND_BADGE[node.kind];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Card */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? `${colors.bg}ee` : colors.bg,
          border: `2px solid ${hovered ? colors.accent : colors.border}`,
          borderRadius: 12,
          padding: depth === 0 ? "20px 28px" : "12px 18px",
          minWidth: depth === 0 ? 240 : depth === 1 ? 200 : 170,
          maxWidth: depth === 0 ? 280 : depth === 1 ? 220 : 190,
          cursor: hasChildren ? "pointer" : "default",
          transition: "all 0.2s ease",
          boxShadow: hovered
            ? `0 0 24px ${colors.border}55, 0 4px 20px #00000066`
            : `0 2px 12px #00000044`,
          position: "relative",
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Kind badge */}
        <div style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: badge.color, color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.3,
        }}>
          {badge.label}
        </div>

        {/* Title */}
        <div style={{
          color: colors.accent, fontWeight: 800,
          fontSize: depth === 0 ? 18 : depth === 1 ? 15 : 13,
          lineHeight: 1.2, marginBottom: 2,
        }}>
          {node.title}
        </div>

        {/* Subtitle */}
        <div style={{
          color: "#94a3b8", fontSize: depth === 0 ? 12 : 11, fontWeight: 500,
          marginBottom: 6, letterSpacing: 0.2,
        }}>
          {node.subtitle}
        </div>

        {/* Description */}
        <div style={{
          color: "#cbd5e1", fontSize: 10.5, lineHeight: 1.5,
          borderTop: `1px solid ${colors.border}55`,
          paddingTop: 6, marginTop: 4,
        }}>
          {node.description}
        </div>

        {/* Tools */}
        {node.tools && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
            {node.tools.map(t => (
              <span key={t} style={{
                background: `${colors.border}22`, border: `1px solid ${colors.border}44`,
                color: colors.accent, fontSize: 9, padding: "1px 5px",
                borderRadius: 4, fontWeight: 600,
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {hasChildren && (
          <div style={{
            position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)",
            background: colors.border, color: "#fff", width: 20, height: 20,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, zIndex: 2,
          }}>
            {expanded ? "−" : "+"}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Vertical connector to row */}
          <div style={{ width: 2, height: 16, background: colors.border + "88" }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative" }}>
            {/* Horizontal bar */}
            {node.children!.length > 1 && (
              <div style={{
                position: "absolute",
                top: 0,
                left: "calc(50% - " + ((node.children!.length - 1) * 0) + "px)",
                width: "100%",
                height: 2,
                background: colors.border + "55",
                zIndex: 0,
              }} />
            )}
            {node.children!.map((child) => (
              <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Vertical connector to child */}
                <div style={{ width: 2, height: 16, background: DEPT_COLORS[child.dept].border + "88" }} />
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
      background: "linear-gradient(135deg, #050d1a 0%, #0a0a1a 50%, #050d0a 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: "32px 24px 80px",
      overflowX: "auto",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#6366f122", border: "1px solid #6366f144",
          borderRadius: 8, padding: "4px 14px", marginBottom: 12,
          fontSize: 11, color: "#818cf8", fontWeight: 600, letterSpacing: 1,
        }}>
          ✦ CLIENTUM · ORGANIGRAMA IDEAL · JULIO 2026
        </div>
        <h1 style={{
          color: "#f1f5f9", fontSize: 28, fontWeight: 900, margin: "0 0 8px",
          letterSpacing: -0.5,
        }}>
          Estructura Organizacional + Agentes IA
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, maxWidth: 600, margin: "0 auto" }}>
          Cada nodo del organigrama es un agente de IA independiente coordinado por el Orquestador Central.
          Jonathan gestiona toda la empresa vía chat con el Orquestador.
        </p>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
          {(Object.entries(KIND_BADGE) as [NodeKind, { label: string; color: string }][]).map(([, badge]) => (
            <div key={badge.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: badge.color }} />
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{badge.label}</span>
            </div>
          ))}
          <div style={{ color: "#475569", fontSize: 11 }}>· Clic en nodo para colapsar</div>
        </div>
      </div>

      {/* Tree */}
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <NodeCard node={ORG} depth={0} />
      </div>
    </div>
  );
}
