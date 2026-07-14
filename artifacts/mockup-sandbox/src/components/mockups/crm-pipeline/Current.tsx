import './_group.css';
import React, { useState } from "react";
import {
  Users, DollarSign, Plus, ArrowRight, ArrowLeft, Trash2, Lightbulb,
  CheckCircle, Search, Building2, Phone, User, Sparkles, Compass, FileDown,
  TrendingUp, Mail, MessageSquare, CheckSquare, Lock, Package, Bot, Sliders,
  Edit3, Target, Award, FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Extracted 1:1 from src/components/SalesProspectorDashboard.tsx — the
// "CRM Pipeline" tab of the AI Client Prospector dashboard. This is the
// "Current" baseline; design variants live alongside this file.
// ---------------------------------------------------------------------------

interface CRMDeal {
  id: string;
  company: string;
  amount: number;
  stage: "leads" | "bot_contact" | "proposed" | "closed";
  industry: string;
  contact: string;
  phone: string;
  meddicScore?: number;
}

const INITIAL_DEALS: CRMDeal[] = [
  { id: "1", company: "Limay Mayorista", amount: 195000, stage: "leads", industry: "Distribuidora Mayorista", contact: "Carlos Bruno", phone: "+54 298 417-6476" },
  { id: "2", company: "Distribuidora Luque", amount: 250000, stage: "leads", industry: "Distribuidora Mayorista", contact: "Mariano Otero", phone: "+54 298 413-476-8385" },
];

const NAV_ITEMS = [
  { id: "pipeline", label: "CRM Pipeline", icon: Compass },
  { id: "products", label: "Productos", icon: Package },
  { id: "sellers", label: "Vendedores", icon: Users },
  { id: "branches", label: "Sucursales", icon: Building2 },
  { id: "icp", label: "ICP Builder", desc: "Definí tu cliente ideal", icon: Target },
  { id: "research", label: "Patagonia Explorer", desc: "Buscá y calificá leads reales", icon: Search },
  { id: "meddic", label: "Calificación MEDDIC", desc: "Auditá el potencial de cada lead", icon: Award },
  { id: "outreach", label: "Outreach Campaigns", desc: "Generá campañas de contacto", icon: Mail },
  { id: "conversations", label: "Conversaciones", icon: MessageSquare },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "brochure", label: "Brochure", icon: FileText },
  { id: "config", label: "Configuración", icon: Sliders },
  { id: "pages", label: "Contenido", icon: Edit3 },
  { id: "ai", label: "Copiloto IA", icon: Sparkles },
];

const DEFAULT_CHECKLIST = [
  { id: "task-1", text: "Buscar 5 nuevos prospectos locales de acopio o logística", checked: false },
  { id: "task-2", text: "Investigar señales de compra de los top 3 leads", checked: false },
  { id: "task-3", text: "Calificar con MEDDIC los contactos en etapa 'Propuesta'", checked: true },
  { id: "task-4", text: "Generar secuencias de outreach personalizadas", checked: false },
  { id: "task-5", text: "Enviar correos de seguimiento a leads fríos", checked: false },
];

function getMEDDICStatusColor(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-250";
  if (score >= 45) return "bg-amber-100 text-amber-800 border-amber-250";
  return "bg-red-100 text-red-800 border-red-250";
}

export function Current() {
  const [deals, setDeals] = useState<CRMDeal[]>(INITIAL_DEALS);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [showFallbackBanner, setShowFallbackBanner] = useState<string | null>(
    "¡Éxito total! Se ha utilizado la API oficial de Google Places para obtener prospectos 100% reales de Google Maps en tiempo real."
  );

  const totalPipelineVal = deals.reduce((acc, curr) => acc + curr.amount, 0);
  const closedVal = deals.filter((d) => d.stage === "closed").reduce((acc, curr) => acc + curr.amount, 0);
  const activeLeadsCount = deals.filter((d) => d.stage !== "closed").length;
  const closedCount = deals.filter((d) => d.stage === "closed").length;

  const moveDeal = (id: string, direction: "next" | "prev") => {
    const order: CRMDeal["stage"][] = ["leads", "bot_contact", "proposed", "closed"];
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = order.indexOf(d.stage);
        const nextIdx = direction === "next" ? Math.min(idx + 1, order.length - 1) : Math.max(idx - 1, 0);
        return { ...d, stage: order[nextIdx] };
      })
    );
  };

  const handleDeleteDeal = (id: string) => setDeals((prev) => prev.filter((d) => d.id !== id));

  const columns: { id: CRMDeal["stage"]; label: string; dot: string; borderHover: string; borderLeft: string }[] = [
    { id: "leads", label: "Nuevos Leads", dot: "bg-blue-500", borderHover: "hover:border-blue-400", borderLeft: "border-l-blue-400" },
    { id: "bot_contact", label: "WhatsApp Bot", dot: "bg-emerald-500", borderHover: "hover:border-emerald-400", borderLeft: "border-l-emerald-400" },
    { id: "proposed", label: "Propuesta", dot: "bg-indigo-500", borderHover: "hover:border-indigo-400", borderLeft: "border-l-indigo-400" },
    { id: "closed", label: "Ganados (Closed)", dot: "bg-emerald-600", borderHover: "hover:border-emerald-600", borderLeft: "border-l-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-slate-900">C</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight">AI CLIENT PROSPECTOR</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Sistema integral de prospección B2B, calificación MEDDIC y automatización de outreach en la Patagonia.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-300">
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            Exportar CSV
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
            Volver al Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="bg-slate-800 hover:bg-red-900/60 border border-slate-700 hover:border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-300">
            <Lock className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {showFallbackBanner && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between gap-4 text-emerald-800 text-xs font-semibold no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0" />
            <span>
              <strong>Resiliencia de Clientum:</strong> {showFallbackBanner}
            </span>
          </div>
          <button
            onClick={() => setShowFallbackBanner(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold transition-all px-2 py-0.5 hover:bg-emerald-100 rounded text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 no-print py-3 px-2">
          <div className="px-2.5 pb-2 mb-1 border-b border-slate-100 flex items-center gap-1.5 text-slate-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Pipeline, Prospección &amp; Comunicación</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer mb-0.5 ${
                item.id === "pipeline" ? "bg-emerald-50" : "hover:bg-slate-50"
              }`}
            >
              <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.id === "pipeline" ? "text-emerald-600" : "text-slate-400"}`} />
              <span>
                <span className={`block text-xs font-bold ${item.id === "pipeline" ? "text-emerald-700" : "text-slate-700"}`}>{item.label}</span>
                {"desc" in item && item.desc && <span className="block text-[10px] text-slate-400">{item.desc}</span>}
              </span>
            </button>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto w-full">
            {/* Executive Pipeline Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Valor Total Pipeline</span>
                  <h3 className="text-xl font-black text-slate-800 mt-0.5">${totalPipelineVal.toLocaleString("es-AR")} ARS</h3>
                </div>
              </div>
              <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono">Facturación Ganada</span>
                  <h3 className="text-xl font-black text-emerald-800 mt-0.5">${closedVal.toLocaleString("es-AR")} ARS</h3>
                </div>
              </div>
              <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Prospectos Activos</span>
                  <h3 className="text-xl font-black text-indigo-800 mt-0.5">{activeLeadsCount} Leads</h3>
                </div>
              </div>
              <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Tasa de Conversión</span>
                  <h3 className="text-xl font-black text-amber-800 mt-0.5">
                    {deals.length > 0 ? Math.round((closedCount / deals.length) * 100) : 0}% Win-Rate
                  </h3>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid: Kanban + Actions Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-l-3 border-emerald-500 pl-2">
                    Tablero Kanban de Ventas v2.0
                  </h3>
                  <button className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                    <Plus className="w-4 h-4" />
                    Nuevo Lead Manual
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {columns.map((col) => (
                    <div key={col.id} className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col gap-3 min-h-[450px]">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-extrabold text-slate-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 ${col.dot} rounded-full`}></span>
                          {col.label}
                        </span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          {deals.filter((d) => d.stage === col.id).length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-0.5">
                        {deals.filter((d) => d.stage === col.id).map((deal) => (
                          <div key={deal.id} className={`bg-white border border-slate-200 p-3 rounded-lg shadow-xs flex flex-col gap-2 transition-all border-l-3 ${col.borderHover} ${col.borderLeft}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-[11px] font-bold text-slate-800">{deal.company}</h5>
                                <span className="text-[9px] text-slate-400 font-medium">{deal.industry}</span>
                              </div>
                              <button onClick={() => handleDeleteDeal(deal.id)} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {col.id === "leads" && (
                              <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-1.5">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{deal.contact}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono">{deal.phone}</span>
                                </div>
                              </div>
                            )}

                            {col.id === "bot_contact" && (
                              <div className="text-[9px] bg-emerald-50 text-emerald-800 p-1.5 rounded-md border border-emerald-100 mt-1">
                                <strong className="block font-bold">Respuesta del Bot de WhatsApp:</strong>
                                <p className="mt-0.5 leading-relaxed text-slate-700 italic">"Hola! Registramos tu interés en la propuesta para el rubro..."</p>
                              </div>
                            )}

                            {col.id === "proposed" && (
                              deal.meddicScore ? (
                                <div className={`text-[9px] p-1.5 rounded border ${getMEDDICStatusColor(deal.meddicScore)} font-semibold`}>
                                  MEDDIC: {deal.meddicScore}% ({deal.meddicScore >= 75 ? "HOT" : "WARM"})
                                </div>
                              ) : (
                                <div className="text-[9px] bg-amber-50 text-amber-800 p-1.5 rounded border border-amber-100 italic">
                                  ⚠️ Requiere calificación MEDDIC para avanzar con seguridad.
                                </div>
                              )
                            )}

                            {col.id === "closed" && (
                              <div className="text-[9px] bg-emerald-100 text-emerald-800 p-1.5 rounded-md border border-emerald-250 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Facturado &amp; AFIP Clase A
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                              <span className="text-xs font-black text-slate-700 font-mono">${deal.amount.toLocaleString("es-AR")}</span>
                              <div className="flex gap-1">
                                {col.id !== "leads" && (
                                  <button onClick={() => moveDeal(deal.id, "prev")} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1 rounded transition-colors">
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {col.id === "leads" && (
                                  <button className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                    MEDDIC: {deal.meddicScore || 0}%
                                  </button>
                                )}
                                {col.id === "bot_contact" && (
                                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                                    Outreach
                                  </button>
                                )}
                                {col.id === "proposed" && (
                                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                                    Score
                                  </button>
                                )}
                                {col.id !== "closed" && (
                                  <button onClick={() => moveDeal(deal.id, "next")} className="bg-slate-900 hover:bg-black text-white p-1 rounded transition-colors">
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Action Center */}
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                    Recomendaciones Estratégicas
                  </h4>
                  <div className="flex flex-col gap-2.5 mt-3">
                    <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[10px] text-slate-600 leading-relaxed">
                      <strong className="block font-bold">Tip de Conversión Patagónico</strong>
                      Ofrecer precios transparentes en pesos acelera el paso de WhatsApp Bot a Propuesta técnica en un 35% en Río Negro y Neuquén.
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                    Top Movers &amp; Alertas
                  </h4>
                  <div className="flex flex-col gap-2.5 mt-3">
                    {deals.slice(0, 3).map((deal, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                        <div className="truncate">
                          <strong className="font-bold text-slate-850 block truncate">{deal.company}</strong>
                          <span className="text-[10px] text-slate-400 capitalize">{deal.stage.replace('_', ' ')}</span>
                        </div>
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[10px]">
                          ${deal.amount.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-4.5 h-4.5 text-blue-500" />
                      Weekly Action Checklist
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {checklist.filter((t) => t.checked).length}/{checklist.length} done
                    </span>
                  </h4>
                  <div className="flex flex-col gap-2 mt-3">
                    {checklist.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}
                        className="flex items-start gap-2 text-left text-[11px] hover:bg-slate-50 p-1 rounded transition-colors group cursor-pointer"
                      >
                        {task.checked ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 border border-slate-300 rounded flex-shrink-0 mt-0.5 group-hover:border-emerald-500"></div>
                        )}
                        <span className={`leading-snug ${task.checked ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
