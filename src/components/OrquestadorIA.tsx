import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Loader2, RefreshCw, Network, ChevronRight, ChevronDown,
  TrendingUp, Wrench, Megaphone, Handshake, BarChart3, User,
  Zap, Activity, DollarSign, Users, MessageSquare, ArrowRight,
  Bot, Sparkles, X, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  timestamp: Date;
}

interface Metrics {
  leads: {
    byStatus: Record<string, number>;
    total: string;
    total_ars: string;
    avg_meddic: string;
    avg_fit: string;
  };
  chatbot: { byStatus: Record<string, number>; total: number };
  topLeads: Array<{ company_name: string; industry: string; city: string; status: string; amount_ars: number; fit_score: number }>;
  industries: Array<{ industry: string; count: number; total_ars: number }>;
}

// ── Agent config ───────────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: "Ventas",
    label: "Ventas",
    role: "Sales Manager AI",
    icon: TrendingUp,
    color: "#10b981",
    bg: "#f0fdf4",
    badge: "#d1fae5",
    badgeText: "#065f46",
    dot: "#10b981",
    emoji: "📈",
    description: "Pipeline, MEDDIC, cierre y outreach",
    subAgents: [
      { name: "Santi SDR", type: "IA", exists: true },
      { name: "Explorador Patagónico", type: "IA", exists: true },
      { name: "Jonathan · Closer", type: "Humano", exists: true },
    ],
    quickPrompts: [
      "¿Cuántos leads calientes tenemos y cuál es la mejor oportunidad para cerrar esta semana?",
      "Analizá el pipeline completo y decime en qué estado están los leads de Santi",
      "¿Cuáles son las 3 empresas con mayor valor en el pipeline y qué acción tomar?",
    ],
  },
  {
    id: "Técnico",
    label: "Técnico",
    role: "CTO AI",
    icon: Wrench,
    color: "#0ea5e9",
    bg: "#f0f9ff",
    badge: "#dbeafe",
    badgeText: "#1e40af",
    dot: "#0ea5e9",
    emoji: "⚙️",
    description: "Producto, código, infra y deploys",
    subAgents: [
      { name: "Backend / Infra", type: "Híbrido", exists: false },
      { name: "Frontend / UX", type: "Híbrido", exists: false },
      { name: "IA & Automatización", type: "IA", exists: false },
    ],
    quickPrompts: [
      "¿Qué mejoras técnicas deberíamos priorizar esta semana en el producto?",
      "¿Cómo podemos optimizar la integración de WhatsApp y el chatbot?",
      "¿Qué features nuevos agregarían más valor a los clientes de Clientum?",
    ],
  },
  {
    id: "Marketing",
    label: "Marketing",
    role: "Marketing AI",
    icon: Megaphone,
    color: "#8b5cf6",
    bg: "#faf5ff",
    badge: "#ede9fe",
    badgeText: "#4c1d95",
    dot: "#8b5cf6",
    emoji: "📣",
    description: "Contenido, SEO, chatbot leads y campañas",
    subAgents: [
      { name: "SEO & Contenido", type: "IA", exists: false },
      { name: "Asesor Comercial IA", type: "IA", exists: true },
    ],
    quickPrompts: [
      "¿Qué acciones de marketing podemos hacer esta semana para conseguir más leads?",
      "Analizá los leads del chatbot y decime qué tendencia ves",
      "¿Cómo posicionamos mejor a Clientum en la Patagonia?",
    ],
  },
  {
    id: "Customer Success",
    label: "Customer Success",
    role: "CS AI",
    icon: Handshake,
    color: "#f59e0b",
    bg: "#fffbeb",
    badge: "#fef3c7",
    badgeText: "#78350f",
    dot: "#f59e0b",
    emoji: "🤝",
    description: "Onboarding, retención y satisfacción",
    subAgents: [
      { name: "Onboarding", type: "Híbrido", exists: false },
    ],
    quickPrompts: [
      "¿Qué deberíamos hacer para mejorar el onboarding de nuevos clientes?",
      "¿Cómo reducimos el churn en Clientum?",
    ],
  },
  {
    id: "Operaciones",
    label: "Operaciones",
    role: "COO AI",
    icon: BarChart3,
    color: "#ef4444",
    bg: "#fff5f5",
    badge: "#fee2e2",
    badgeText: "#7f1d1d",
    dot: "#ef4444",
    emoji: "📊",
    description: "Métricas, KPIs, MRR y reportes",
    subAgents: [
      { name: "Finanzas & Métricas", type: "Híbrido", exists: false },
    ],
    quickPrompts: [
      "Generame un reporte ejecutivo completo con todas las métricas de hoy",
      "¿Cuánto vale el pipeline total y cuál es el potencial de cierre este mes?",
      "¿Cuáles son los 3 KPIs más importantes que debería monitorear esta semana?",
    ],
  },
];

const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]));
const ORCHESTRATOR_CFG = {
  color: "#10b981", bg: "#f0fdf4", badge: "#d1fae5",
  badgeText: "#065f46", dot: "#10b981", emoji: "✦",
};

const GLOBAL_PROMPTS = [
  { emoji: "📊", label: "Reporte ejecutivo", prompt: "Generame un reporte ejecutivo completo con métricas y recomendaciones para hoy" },
  { emoji: "🎯", label: "Prioridades del día", prompt: "¿Cuáles son las 3 acciones más importantes que debería hacer hoy para hacer crecer Clientum?" },
  { emoji: "💰", label: "Valor del pipeline", prompt: "¿Cuánto vale el pipeline en ARS y cuál es el potencial de cierre estimado este mes?" },
  { emoji: "🤖", label: "Estado de Santi", prompt: "¿Cómo está funcionando Santi? ¿Cuántos leads contactó y cuál es su tasa de respuesta?" },
  { emoji: "💬", label: "Chatbot leads", prompt: "¿Cuántos leads llegaron por el chatbot y qué tendría que hacer con ellos?" },
  { emoji: "🚀", label: "Ideas de crecimiento", prompt: "Dame 3 ideas concretas para acelerar el crecimiento de Clientum esta semana" },
];

// ── Markdown-like renderer ────────────────────────────────────────────────────
function RenderMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-0.5 text-[13.5px] leading-relaxed text-gray-700">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        // Bullet
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{renderInline(trimmed.replace(/^[•\-\*]\s*/, ""))}</span>
            </div>
          );
        }
        // Numbered
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-[11px] font-bold text-gray-400 mt-0.5 flex-shrink-0 w-4">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }
        // Section with ═══
        if (trimmed.startsWith("═")) return null;
        // Sub-header with emoji
        if (/^[📊📈💬🏆⚙️📣🤝💰🎯🚀✦🤖💡🔧📌]/u.test(trimmed)) {
          return (
            <div key={i} className="font-semibold text-gray-800 mt-2 first:mt-0">
              {renderInline(trimmed)}
            </div>
          );
        }
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function resolveAgent(raw?: string): string {
  if (!raw) return "Orquestador";
  const lower = raw.toLowerCase();
  for (const a of AGENTS) {
    if (lower.includes(a.id.toLowerCase())) return a.id;
  }
  return raw;
}

// ── KPI Bar ───────────────────────────────────────────────────────────────────
function KpiBar({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) {
    return (
      <div className="flex items-center gap-6 px-5 py-2.5 border-b border-[#1A2733] bg-[#0D1B26]">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 w-24 rounded bg-[#1A2733] animate-pulse" />
        ))}
      </div>
    );
  }

  const pipelineARS = Number(metrics.leads.total_ars ?? 0);
  const totalLeads = Number(metrics.leads.total ?? 0);
  const hotLeads = (metrics.leads.byStatus["caliente"] ?? 0) + (metrics.leads.byStatus["agendado"] ?? 0);
  const chatbotNew = metrics.chatbot.byStatus["nuevo"] ?? 0;
  const avgFit = parseFloat(metrics.leads.avg_fit ?? "0").toFixed(1);

  const kpis = [
    { icon: DollarSign, label: "Pipeline", value: pipelineARS >= 1_000_000 ? `$${(pipelineARS / 1_000_000).toFixed(1)}M` : `$${(pipelineARS / 1_000).toFixed(0)}K`, sub: "ARS total", color: "#10b981" },
    { icon: Users, label: "Leads Santi", value: totalLeads, sub: `${hotLeads} calientes`, color: "#0ea5e9" },
    { icon: MessageSquare, label: "Chatbot", value: metrics.chatbot.total, sub: `${chatbotNew} sin gestionar`, color: "#8b5cf6" },
    { icon: Activity, label: "Fit score", value: `${avgFit}/10`, sub: "promedio pipeline", color: "#f59e0b" },
  ];

  return (
    <div className="flex items-center gap-0 px-5 py-0 border-b border-[#1A2733] bg-[#0D1B26] overflow-x-auto">
      {kpis.map((k, i) => (
        <div key={k.label} className={`flex items-center gap-3 px-5 py-3 ${i < kpis.length - 1 ? "border-r border-[#1A2733]" : ""}`}>
          <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: k.color + "18" }}>
            <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white leading-tight">{k.value}</div>
            <div className="text-[10px] text-zinc-500 leading-tight">{k.sub}</div>
          </div>
        </div>
      ))}
      <div className="ml-auto pl-5 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
        <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">DB en tiempo real</span>
      </div>
    </div>
  );
}

// ── Org Panel ─────────────────────────────────────────────────────────────────
function OrgPanel({
  activeAgent, onSelectAgent, onQuickPrompt,
}: {
  activeAgent: string | null;
  onSelectAgent: (id: string | null) => void;
  onQuickPrompt: (prompt: string, agent?: string) => void;
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const typeColors: Record<string, string> = {
    IA: "#10b981",
    Humano: "#f59e0b",
    Híbrido: "#0ea5e9",
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0B131D] border-r border-[#1A2733]">
      {/* Jonathan node */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1A2733]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#10b981]" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-white">Jonathan</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">CEO & Fundador · Humano</div>
          </div>
        </div>

        {/* Connector */}
        <div className="ml-4 mt-1 border-l border-dashed border-[#1A2733] pl-3 pt-1">
          <div
            onClick={() => onSelectAgent(activeAgent === "Orquestador" ? null : "Orquestador")}
            className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-all ${
              activeAgent === "Orquestador" ? "bg-[#10b981]/10 border border-[#10b981]/20" : "hover:bg-[#1A2733]/60"
            }`}
          >
            <div className="w-6 h-6 rounded bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[11px] flex-shrink-0">✦</div>
            <div>
              <div className="text-[11px] font-bold text-zinc-100">Orquestador IA</div>
              <div className="text-[9px] text-zinc-500 font-mono">Chief of Staff AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Department agents */}
      <div className="flex-1 px-3 py-3 space-y-1">
        {AGENTS.map((agent) => {
          const isActive = activeAgent === agent.id;
          const isExpanded = expandedAgent === agent.id;
          const Icon = agent.icon;

          return (
            <div key={agent.id}>
              {/* Agent card */}
              <div
                className={`rounded-lg border transition-all overflow-hidden ${
                  isActive
                    ? "border-[" + agent.color + "]/40 shadow-sm"
                    : "border-[#1A2733] hover:border-[#2D3B48]"
                }`}
                style={isActive ? { borderColor: agent.color + "40", background: agent.color + "08" } : {}}
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  onClick={() => {
                    onSelectAgent(isActive ? null : agent.id);
                    setExpandedAgent(isExpanded ? null : agent.id);
                  }}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[12px]"
                    style={{ background: agent.color + "18" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-100 truncate">{agent.label}</span>
                      {isActive && (
                        <span className="text-[8px] font-bold px-1 rounded-sm" style={{ background: agent.color + "30", color: agent.color }}>
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono truncate">{agent.role}</div>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-2 border-t border-[#1A2733]/60">
                    {/* Description */}
                    <p className="text-[10px] text-zinc-500 mt-2 mb-2">{agent.description}</p>

                    {/* Sub-agents */}
                    <div className="space-y-1 mb-2">
                      {agent.subAgents.map(sub => (
                        <div key={sub.name} className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: typeColors[sub.type] }}
                          />
                          <span className="text-[10px] text-zinc-400 truncate">{sub.name}</span>
                          <span
                            className="text-[8px] font-mono px-1 rounded flex-shrink-0"
                            style={{ background: typeColors[sub.type] + "20", color: typeColors[sub.type] }}
                          >
                            {sub.type}
                          </span>
                          {sub.exists && (
                            <Zap className="w-2.5 h-2.5 text-[#10b981] flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quick prompts */}
                    <div className="space-y-1 pt-1 border-t border-[#1A2733]/60">
                      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Consultas rápidas</div>
                      {agent.quickPrompts.map((p, pi) => (
                        <button
                          key={pi}
                          onClick={() => onQuickPrompt(p, agent.id)}
                          className="w-full text-left text-[10px] text-zinc-400 hover:text-zinc-200 flex items-start gap-1.5 py-0.5 group transition-colors"
                        >
                          <ArrowRight className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: agent.color }} />
                          <span className="leading-snug">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-[#1A2733] flex items-center gap-3 flex-wrap">
        {[["IA", "#10b981"], ["Humano", "#f59e0b"], ["Híbrido", "#0ea5e9"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[9px] text-zinc-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <Zap className="w-2.5 h-2.5 text-[#10b981]" />
          <span className="text-[9px] text-zinc-600">Existe</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface OrquestadorIAProps {
  currentUsername?: string;
}

export default function OrquestadorIA({ currentUsername }: OrquestadorIAProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMounted = useRef(false);

  // Fetch metrics on mount
  useEffect(() => {
    fetch("/api/orchestrator/metrics")
      .then(r => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, []);

  // Welcome message
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    const name = currentUsername ? `, **${currentUsername}**` : "";
    setMessages([{
      role: "assistant",
      content: `¡Hola${name}! Soy el **Orquestador IA de Clientum** — tu Chief of Staff digital.\n\nTengo acceso en tiempo real a todos los datos del negocio:\n• 📊 **Pipeline Santi** — leads, estados, MEDDIC y valores\n• 💬 **Chatbot Leads** — inbound del sitio web\n• 🏆 **Top oportunidades** — los leads de mayor valor\n\nHablá conmigo de cualquier área y te conecto con el agente correcto: **Ventas, Técnico, Marketing, Customer Success u Operaciones**.\n\nO seleccioná un departamento en el panel de la izquierda para ir directo.`,
      agent: "Orquestador",
      timestamp: new Date(),
    }]);
  }, [currentUsername]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = useCallback(() => {
    setMessages([{
      role: "assistant",
      content: "**Nueva conversación iniciada.** ¿En qué te ayudo?",
      agent: "Orquestador",
      timestamp: new Date(),
    }]);
    setActiveAgent(null);
  }, []);

  const sendMessage = useCallback(async (text?: string, overrideAgent?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const targetAgent = overrideAgent ?? activeAgent ?? undefined;
    const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history, targetAgent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      const resolved = resolveAgent(data.agent);
      if (!activeAgent && resolved !== "Orquestador") setActiveAgent(resolved);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        agent: resolved,
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ **Error:** ${e.message}`,
        agent: "Orquestador",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [input, loading, messages, activeAgent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleQuickPrompt = (prompt: string, agentId?: string) => {
    if (agentId) setActiveAgent(agentId);
    sendMessage(prompt, agentId);
  };

  const showSuggestions = messages.length <= 1;
  const activeAgentCfg = activeAgent ? AGENT_MAP[activeAgent] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans bg-[#0B131D]">

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1A2733] flex-shrink-0">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          className="p-1.5 rounded hover:bg-[#1A2733] transition-colors text-zinc-500 hover:text-zinc-300"
          title={sidebarOpen ? "Ocultar organigrama" : "Ver organigrama"}
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className="w-7 h-7 bg-[#10B981]/10 border border-[#10B981]/20 rounded flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] flex-shrink-0">
          <Network className="w-3.5 h-3.5 text-[#34D399]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-black tracking-wide text-zinc-100 uppercase">Orquestador IA</h2>
            <span className="bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20 text-[8px] font-bold px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-widest hidden sm:inline">
              Chief of Staff AI
            </span>
            {activeAgentCfg && (
              <span
                className="text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: activeAgentCfg.color + "20", color: activeAgentCfg.color }}
              >
                <span>{activeAgentCfg.emoji}</span>
                <span>Agente {activeAgentCfg.label} activo</span>
                <button
                  onClick={() => setActiveAgent(null)}
                  className="ml-0.5 hover:opacity-70"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Agent status dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {AGENTS.map(a => (
            <button
              key={a.id}
              title={a.label}
              onClick={() => setActiveAgent(activeAgent === a.id ? null : a.id)}
              className="w-2 h-2 rounded-full transition-all hover:scale-125"
              style={{
                background: a.color,
                boxShadow: activeAgent === a.id ? `0 0 8px ${a.color}` : `0 0 4px ${a.color}66`,
                opacity: activeAgent && activeAgent !== a.id ? 0.35 : 1,
              }}
            />
          ))}
        </div>

        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 bg-[#1A2733]/50 hover:bg-[#1A2733] border border-[#2D3B48]/50 text-[9px] font-semibold px-2 py-1.5 rounded transition-all text-zinc-400 hover:text-zinc-200 flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* ── KPI bar ────────────────────────────────────────────────────────── */}
      <KpiBar metrics={metrics} />

      {/* ── Body: sidebar + chat ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Organigrama */}
        {sidebarOpen && (
          <div className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden">
            <OrgPanel
              activeAgent={activeAgent}
              onSelectAgent={setActiveAgent}
              onQuickPrompt={handleQuickPrompt}
            />
          </div>
        )}

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

            {/* Welcome suggestion chips */}
            {showSuggestions && (
              <div className="mb-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Consultas sugeridas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GLOBAL_PROMPTS.map(p => (
                    <button
                      key={p.prompt}
                      onClick={() => handleQuickPrompt(p.prompt)}
                      disabled={loading}
                      className="bg-white border border-zinc-200 hover:border-[#10B981]/50 hover:bg-[#f0fdf4] text-zinc-500 hover:text-[#065f46] text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.label}</span>
                      <ChevronRight className="w-3 h-3 opacity-40" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => {
              if (msg.role === "user") {
                return (
                  <div key={i} className="flex justify-end items-end gap-2.5">
                    <div
                      className="px-4 py-2.5 rounded-2xl rounded-br-sm text-[13.5px] leading-relaxed max-w-[70%] break-words whitespace-pre-wrap"
                      style={{ background: "#0B131D", color: "#e4e4e7" }}
                    >
                      {msg.content}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black text-white"
                      style={{ background: "#10B981" }}
                    >
                      {currentUsername?.[0]?.toUpperCase() ?? "J"}
                    </div>
                  </div>
                );
              }

              const agentKey = resolveAgent(msg.agent);
              const agentCfg = AGENT_MAP[agentKey];
              const cfg = agentCfg ?? { ...ORCHESTRATOR_CFG, emoji: "✦" };
              const color = agentCfg?.color ?? ORCHESTRATOR_CFG.color;

              return (
                <div key={i} className="flex items-start gap-2.5 max-w-[85%]">
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] border"
                    style={{ background: cfg.bg, borderColor: color + "44", color }}
                  >
                    {cfg.emoji}
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    {/* Badge + time */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: agentCfg?.badge ?? ORCHESTRATOR_CFG.badge, color: agentCfg?.badgeText ?? ORCHESTRATOR_CFG.badgeText }}
                      >
                        {agentKey === "Orquestador" ? "Orquestador IA" : `Agente · ${agentKey}`}
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        {msg.timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className="px-4 py-3 rounded-2xl rounded-tl-sm border-l-[3px]"
                      style={{
                        background: "white",
                        borderColor: color,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <RenderMessage text={msg.content} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] border"
                  style={{ background: activeAgentCfg?.bg ?? "#f0fdf4", borderColor: (activeAgentCfg?.color ?? "#10b981") + "44", color: activeAgentCfg?.color ?? "#10b981" }}
                >
                  {activeAgentCfg?.emoji ?? "✦"}
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 border-l-[3px]"
                  style={{ background: "white", borderColor: activeAgentCfg?.color ?? "#10b981", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: activeAgentCfg?.color ?? "#10b981" }} />
                  <span className="text-[12px] text-zinc-400">
                    {activeAgentCfg ? `${activeAgentCfg.label} procesando…` : "Consultando agentes…"}
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(d => (
                      <div
                        key={d}
                        className="w-1 h-1 rounded-full animate-bounce"
                        style={{ background: activeAgentCfg?.color ?? "#10b981", animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Input area ─────────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-t border-zinc-200 bg-white flex-shrink-0">
            {/* Agent selector chips */}
            {!activeAgent && (
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                <span className="text-[10px] text-zinc-400 flex-shrink-0 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Agente:
                </span>
                <button
                  onClick={() => setActiveAgent(null)}
                  className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all bg-[#10b981]/10 border-[#10b981]/30 text-[#065f46]"
                >
                  Auto ✦
                </button>
                {AGENTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAgent(a.id)}
                    className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                  >
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Active agent banner */}
            {activeAgent && activeAgentCfg && (
              <div
                className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                style={{ background: activeAgentCfg.color + "12", color: activeAgentCfg.color }}
              >
                <span>{activeAgentCfg.emoji}</span>
                <span>Enviando directamente al <strong>Agente {activeAgentCfg.label}</strong></span>
                <button
                  onClick={() => setActiveAgent(null)}
                  className="ml-auto hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Textarea */}
            <div
              className="flex gap-2 items-end bg-white border rounded-xl px-3 py-2 transition-all"
              style={{
                borderColor: activeAgentCfg ? activeAgentCfg.color + "60" : "#e4e4e7",
                boxShadow: activeAgentCfg ? `0 0 0 2px ${activeAgentCfg.color}15` : undefined,
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeAgentCfg
                    ? `Escribile al Agente ${activeAgentCfg.label}… (Enter envía)`
                    : "Escribile al orquestador… (Enter envía · Shift+Enter nueva línea)"
                }
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-zinc-800 placeholder-zinc-400 text-[13px] resize-none leading-relaxed"
                style={{ maxHeight: 120, overflowY: "auto", fontFamily: "inherit" }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                autoFocus
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !loading ? (activeAgentCfg?.color ?? "#10B981") : "#f4f4f5",
                  color: input.trim() && !loading ? "white" : "#a1a1aa",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  boxShadow: input.trim() && !loading ? `0 0 12px ${(activeAgentCfg?.color ?? "#10B981")}44` : "none",
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 text-center mt-1.5">
              Groq · OpenRouter · Gemini — datos en tiempo real de la DB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
