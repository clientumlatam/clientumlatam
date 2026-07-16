import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, RefreshCw, ChevronRight, Network } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  timestamp: Date;
}

const AGENT_CONFIG: Record<string, { color: string; emoji: string; bg: string; border: string }> = {
  "Ventas":            { color: "#22c55e", emoji: "🟢", bg: "#0d1f0e", border: "#22c55e33" },
  "Técnico":           { color: "#0ea5e9", emoji: "🔵", bg: "#0c1a2e", border: "#0ea5e933" },
  "Marketing":         { color: "#a855f7", emoji: "🟣", bg: "#1a0e1a", border: "#a855f733" },
  "Customer Success":  { color: "#f59e0b", emoji: "🟡", bg: "#1a1000", border: "#f59e0b33" },
  "Operaciones":       { color: "#ef4444", emoji: "🔴", bg: "#1a0a0a", border: "#ef444433" },
  "Orquestador":       { color: "#6366f1", emoji: "✦",  bg: "#0f172a", border: "#6366f133" },
};

const AGENT_DEPT_MAP: Record<string, string> = {
  "ventas":           "Ventas",
  "técnico":          "Técnico",
  "tecnico":          "Técnico",
  "marketing":        "Marketing",
  "customer success": "Customer Success",
  "cs":               "Customer Success",
  "operaciones":      "Operaciones",
  "ops":              "Operaciones",
};

function resolveAgent(raw?: string): string {
  if (!raw) return "Orquestador";
  const lower = raw.toLowerCase();
  for (const [key, name] of Object.entries(AGENT_DEPT_MAP)) {
    if (lower.includes(key)) return name;
  }
  return raw;
}

const SUGGESTED_PROMPTS = [
  { label: "📊 Estado del pipeline",    prompt: "Dame un resumen del estado actual del pipeline de ventas con todos los números" },
  { label: "🤖 Reporte de Santi",       prompt: "¿Cómo está funcionando Santi? ¿Cuántos leads contactó y cuál es la tasa de respuesta?" },
  { label: "💬 Chatbot leads",          prompt: "¿Cuántos leads nuevos llegaron por el chatbot y qué tengo que hacer con ellos?" },
  { label: "📈 Reporte ejecutivo",      prompt: "Generame un reporte ejecutivo completo del negocio con métricas y recomendaciones" },
  { label: "🎯 Prioridades de hoy",     prompt: "¿Cuáles son las 3 acciones más importantes que debería hacer hoy para hacer crecer Clientum?" },
  { label: "💡 Ideas de marketing",     prompt: "¿Qué acciones de marketing podemos hacer para conseguir más leads esta semana en la Patagonia?" },
  { label: "🔧 Estado técnico",         prompt: "¿Hay algo técnico que debería revisar o mejorar en el producto esta semana?" },
  { label: "💰 Análisis de revenue",    prompt: "¿Cuánto vale el pipeline actual en ARS y cuál es el potencial de cierre este mes?" },
];

function renderContent(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "#f1f5f9", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

interface OrquestadorIAProps {
  currentUsername?: string;
}

export default function OrquestadorIA({ currentUsername }: OrquestadorIAProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Greeting on mount
  useEffect(() => {
    const name = currentUsername ? `, **${currentUsername}**` : "";
    setMessages([{
      role: "assistant",
      content: `¡Hola${name}! Soy el **Orquestador IA de Clientum**.\n\nSoy tu jefe de staff digital — tengo acceso en tiempo real a:\n- 📊 **Pipeline de ventas** y estado de leads de Santi\n- 💬 **Chatbot leads** del sitio web\n- 🎯 **Métricas MEDDIC** y fit scores del pipeline\n\nEscribime cualquier cosa y te voy a conectar automáticamente con el agente departamental correcto: Ventas, Técnico, Marketing, Customer Success u Operaciones.`,
      agent: "Orquestador",
      timestamp: new Date(),
    }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = () => {
    const name = currentUsername ? `, **${currentUsername}**` : "";
    setMessages([{
      role: "assistant",
      content: `¡Hola${name}! Nueva conversación. ¿En qué te ayudo?`,
      agent: "Orquestador",
      timestamp: new Date(),
    }]);
  };

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Send last 14 messages as history (7 turns)
    const history = messages.slice(-14).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        agent: resolveAgent(data.agent),
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "linear-gradient(160deg, #050d1a 0%, #08081a 60%, #050d0a 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid #0f172a",
        background: "#070d1c",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px #6366f144",
          flexShrink: 0,
        }}>
          <Network size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
            Orquestador IA
          </div>
          <div style={{ color: "#475569", fontSize: 10.5, marginTop: 1 }}>
            Chief of Staff AI · 5 agentes disponibles · Datos en tiempo real
          </div>
        </div>

        {/* Agent pills */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {["🟢", "🔵", "🟣", "🟡", "🔴"].map((emoji, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#0f172a", border: "1px solid #1e293b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>{emoji}</div>
          ))}
        </div>

        <button
          onClick={resetChat}
          title="Nueva conversación"
          style={{
            background: "transparent",
            border: "1px solid #1e293b",
            color: "#475569",
            borderRadius: 7,
            padding: "5px 10px",
            fontSize: 10.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.color = "#475569"; }}
        >
          <RefreshCw size={10} /> Nueva conversación
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  color: "#dbeafe",
                  padding: "11px 15px",
                  borderRadius: "14px 14px 3px 14px",
                  maxWidth: "68%",
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#1d4ed8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 12, color: "#bfdbfe", fontWeight: 800,
                  border: "2px solid #2563eb",
                }}>
                  {currentUsername?.[0]?.toUpperCase() ?? "J"}
                </div>
              </div>
            );
          }

          const agentKey = msg.agent ? resolveAgent(msg.agent) : "Orquestador";
          const cfg = AGENT_CONFIG[agentKey] ?? AGENT_CONFIG["Orquestador"];

          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {/* Agent avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: cfg.bg,
                border: `2px solid ${cfg.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
                boxShadow: `0 0 10px ${cfg.color}44`,
              }}>
                {cfg.emoji}
              </div>

              <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Agent label + time */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 9.5, color: cfg.color, fontWeight: 700,
                    letterSpacing: 0.8, textTransform: "uppercase",
                  }}>
                    Agente · {agentKey}
                  </span>
                  <span style={{ color: "#1e293b", fontSize: 9 }}>
                    {msg.timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Message bubble */}
                <div style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  color: "#cbd5e1",
                  padding: "11px 15px",
                  borderRadius: "3px 14px 14px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  boxShadow: `0 0 24px ${cfg.color}0a, 0 2px 8px #00000033`,
                }}>
                  {renderContent(msg.content)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#0f172a", border: "2px solid #6366f1",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 13,
              boxShadow: "0 0 10px #6366f144",
            }}>✦</div>
            <div style={{
              background: "#0f172a", border: "1px solid #6366f133",
              padding: "11px 16px", borderRadius: "3px 14px 14px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Loader2 size={13} style={{ color: "#6366f1", animation: "orch-spin 1s linear infinite" }} />
              <span style={{ color: "#475569", fontSize: 12 }}>Consultando agentes y datos reales...</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Suggested prompts ── */}
      {showSuggestions && (
        <div style={{ padding: "0 24px 14px", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.prompt}
              onClick={() => sendMessage(p.prompt)}
              disabled={loading}
              style={{
                background: "#0a0f1e",
                border: "1px solid #1e293b",
                color: "#64748b",
                borderRadius: 7,
                padding: "5px 11px",
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#4f46e5";
                e.currentTarget.style.color = "#818cf8";
                e.currentTarget.style.background = "#0f0e24";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#1e293b";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "#0a0f1e";
              }}
            >
              {p.label}
              <ChevronRight size={9} />
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={{
        padding: "10px 24px 18px",
        borderTop: "1px solid #0f172a",
        background: "#070d1c",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          background: "#0d1324",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "9px 10px",
          transition: "border-color 0.15s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = "#4f46e5"}
          onBlurCapture={e => e.currentTarget.style.borderColor = "#1e293b"}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribile al orquestador… (Enter envía · Shift+Enter nueva línea)"
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f1f5f9",
              fontSize: 13,
              resize: "none",
              lineHeight: 1.6,
              fontFamily: "inherit",
              maxHeight: 110,
              overflowY: "auto",
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 110) + "px";
            }}
            autoFocus
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              border: "none",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                : "#0f172a",
              color: input.trim() && !loading ? "#fff" : "#334155",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              flexShrink: 0,
              boxShadow: input.trim() && !loading ? "0 0 12px #6366f155" : "none",
            }}
          >
            <Send size={13} />
          </button>
        </div>
        <div style={{ color: "#1e293b", fontSize: 9.5, textAlign: "center", marginTop: 5 }}>
          Los agentes consultan la base de datos de Clientum en tiempo real
        </div>
      </div>

      <style>{`
        @keyframes orch-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
