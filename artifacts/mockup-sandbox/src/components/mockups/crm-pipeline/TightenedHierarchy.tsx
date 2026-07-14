import './_group.css';
import React, { useState } from "react";
import {
  Users, DollarSign, Plus, ArrowRight, ArrowLeft, Trash2, Lightbulb,
  CheckCircle, Search, Building2, Phone, User, Sparkles, Compass, FileDown,
  TrendingUp, Mail, MessageSquare, CheckSquare, Lock, Package, Bot, Sliders,
  Edit3, Target, Award, FileText,
} from "lucide-react";

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
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 45) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function TightenedHierarchy() {
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
    { id: "leads", label: "Nuevos Leads", dot: "bg-blue-500", borderHover: "hover:border-blue-400", borderLeft: "border-l-blue-500" },
    { id: "bot_contact", label: "WhatsApp Bot", dot: "bg-emerald-500", borderHover: "hover:border-emerald-400", borderLeft: "border-l-emerald-500" },
    { id: "proposed", label: "Propuesta", dot: "bg-indigo-500", borderHover: "hover:border-indigo-400", borderLeft: "border-l-indigo-500" },
    { id: "closed", label: "Ganados", dot: "bg-emerald-600", borderHover: "hover:border-emerald-600", borderLeft: "border-l-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-slate-900">C</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight">AI CLIENT PROSPECTOR</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Sistema integral de prospección B2B, calificación MEDDIC y automatización de outreach.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-300">
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            Exportar
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
            Volver al Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="bg-slate-800 hover:bg-red-900/60 border border-slate-700 hover:border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-300">
            <Lock className="w-3.5 h-3.5" />
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
        <aside className="w-56 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 no-print py-4 px-3 shadow-[1px_0_4px_rgba(0,0,0,0.02)] z-0">
          <div className="px-2.5 pb-3 mb-2 border-b border-slate-100 flex items-center gap-1.5 text-slate-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Navegación</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-3 transition-colors cursor-pointer mb-0.5 ${
                item.id === "pipeline" ? "bg-emerald-50 border border-emerald-100/50" : "hover:bg-slate-50 border border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.id === "pipeline" ? "text-emerald-600" : "text-slate-400"}`} />
              <span>
                <span className={`block text-xs font-bold ${item.id === "pipeline" ? "text-emerald-800" : "text-slate-700"}`}>{item.label}</span>
                {"desc" in item && item.desc && <span className={`block text-[10px] mt-0.5 font-medium ${item.id === "pipeline" ? "text-emerald-600/80" : "text-slate-400"}`}>{item.desc}</span>}
              </span>
            </button>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
          <div className="flex flex-col gap-8 h-full max-w-[1400px] mx-auto w-full">
            
            {/* Executive Pipeline Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-blue-50/80 border border-blue-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-14 h-14 bg-white/60 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider font-mono">Valor Pipeline</span>
                  <h3 className="text-2xl font-black text-blue-950 mt-0.5 tracking-tight">
                    ${totalPipelineVal.toLocaleString("es-AR")}
                  </h3>
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-14 h-14 bg-white/60 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider font-mono">Facturación Ganada</span>
                  {closedVal > 0 ? (
                    <h3 className="text-2xl font-black text-emerald-950 mt-0.5 tracking-tight">
                      ${closedVal.toLocaleString("es-AR")}
                    </h3>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 bg-emerald-100/50 border border-emerald-200/60 rounded px-2 py-1 w-fit">
                      <span className="text-xs font-bold text-emerald-800">Aún sin cierres</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-indigo-50/80 border border-indigo-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-14 h-14 bg-white/60 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider font-mono">Prospectos</span>
                  <h3 className="text-2xl font-black text-indigo-950 mt-0.5 tracking-tight flex items-baseline gap-1.5">
                    {activeLeadsCount} <span className="text-sm font-bold text-indigo-900/50 tracking-normal">Leads</span>
                  </h3>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-14 h-14 bg-white/60 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100/50">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider font-mono">Conversión</span>
                  <h3 className="text-2xl font-black text-amber-950 mt-0.5 tracking-tight flex items-baseline gap-1.5">
                    {deals.length > 0 ? Math.round((closedCount / deals.length) * 100) : 0}% 
                    <span className="text-sm font-bold text-amber-900/50 tracking-normal">Win-Rate</span>
                  </h3>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid: Kanban + Actions Checklist */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* KANBAN BOARD */}
              <div className="xl:col-span-3 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Tablero Kanban de Ventas
                  </h3>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                    <Plus className="w-4 h-4" />
                    Nuevo Lead
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
                  {columns.map((col) => (
                    <div key={col.id} className="bg-slate-100/60 rounded-2xl p-3 border border-slate-200/80 flex flex-col gap-3 min-h-[500px]">
                      
                      <div className="flex items-center justify-between px-1 pb-1">
                        <span className="text-xs font-black text-slate-800 font-mono uppercase tracking-wider flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 ${col.dot} rounded-full shadow-sm`}></span>
                          {col.label}
                        </span>
                        <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-md font-mono shadow-sm">
                          {deals.filter((d) => d.stage === col.id).length}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-3 max-h-[650px] overflow-y-auto pr-1 pb-2">
                        {deals.filter((d) => d.stage === col.id).map((deal) => (
                          
                          <div 
                            key={deal.id} 
                            className={`group bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex flex-col gap-2.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 ${col.borderHover} ${col.borderLeft}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[13px] font-extrabold text-slate-900 truncate leading-tight">{deal.company}</h5>
                                <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">{deal.industry}</span>
                              </div>
                              <button onClick={() => handleDeleteDeal(deal.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 -mr-1.5 -mt-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {col.id === "leads" && (
                              <div className="text-[11px] text-slate-600 flex flex-col gap-1.5 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 font-medium">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="truncate">{deal.contact}</span>
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-mono truncate text-slate-500">{deal.phone}</span>
                                </div>
                              </div>
                            )}

                            {col.id === "bot_contact" && (
                              <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 mt-1">
                                <strong className="block font-black text-[9px] uppercase tracking-wider text-emerald-700/80 mb-1">Última Rta. Bot:</strong>
                                <p className="leading-snug text-emerald-950 font-medium">"Hola! Registramos tu interés en la propuesta..."</p>
                              </div>
                            )}

                            {col.id === "proposed" && (
                              deal.meddicScore ? (
                                <div className={`text-[11px] p-2.5 rounded-lg border ${getMEDDICStatusColor(deal.meddicScore)} font-bold mt-1 flex items-center justify-between`}>
                                  <span>Score MEDDIC</span>
                                  <span className="font-black font-mono bg-white/50 px-1.5 py-0.5 rounded">{deal.meddicScore}%</span>
                                </div>
                              ) : (
                                <div className="text-[11px] bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200 mt-1 font-medium flex gap-2 items-start">
                                  <span className="text-amber-500 mt-0.5">⚠️</span>
                                  <span className="leading-tight font-bold text-amber-900">Requiere calificar MEDDIC para avanzar</span>
                                </div>
                              )
                            )}

                            {col.id === "closed" && (
                              <div className="text-[11px] bg-emerald-100/50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 font-bold flex items-center gap-2 mt-1">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Facturado AFIP Clase A
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-2.5">
                              <span className="text-sm font-black text-slate-800 font-mono tracking-tight">${deal.amount.toLocaleString("es-AR")}</span>
                              <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                
                                {col.id !== "leads" && (
                                  <button onClick={() => moveDeal(deal.id, "prev")} className="hover:bg-slate-100 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors border border-transparent hover:border-slate-200">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                
                                {col.id === "leads" && (
                                  <button className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[10px] font-extrabold px-2 py-1 rounded-md transition-colors uppercase tracking-wide">
                                    Evaluar
                                  </button>
                                )}
                                {col.id === "bot_contact" && (
                                  <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2 py-1 rounded-md transition-colors uppercase tracking-wide">
                                    Outreach
                                  </button>
                                )}
                                {col.id === "proposed" && (
                                  <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-extrabold px-2 py-1 rounded-md transition-colors uppercase tracking-wide">
                                    Score
                                  </button>
                                )}
                                
                                {col.id !== "closed" && (
                                  <button onClick={() => moveDeal(deal.id, "next")} className="bg-slate-900 hover:bg-slate-800 text-white p-1 rounded-md transition-colors shadow-sm">
                                    <ArrowRight className="w-3.5 h-3.5" />
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

              {/* SIDEBAR ACTION CENTER */}
              <div className="flex flex-col gap-5 xl:pt-11">
                
                {/* Recomendaciones Estratégicas */}
                <div className="bg-white border border-slate-200 border-l-4 border-l-amber-400 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 pb-0">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Estrategia
                    </h4>
                  </div>
                  <div className="p-4 pt-3">
                    <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed shadow-xs">
                      <strong className="block font-black text-amber-900 mb-1">Tip de Conversión Patagónico</strong>
                      Ofrecer precios transparentes en pesos acelera el paso de WhatsApp Bot a Propuesta técnica en un 35% en Río Negro y Neuquén.
                    </div>
                  </div>
                </div>

                {/* Top Movers & Alertas */}
                <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-400 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 pb-0">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Top Movers &amp; Alertas
                    </h4>
                  </div>
                  <div className="p-4 pt-3 flex flex-col gap-3">
                    {deals.slice(0, 3).map((deal, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="truncate flex-1">
                          <strong className="font-extrabold text-slate-900 block truncate group-hover:text-emerald-700 transition-colors">{deal.company}</strong>
                          <span className="text-[10px] text-slate-500 font-medium capitalize mt-0.5 block">{deal.stage.replace('_', ' ')}</span>
                        </div>
                        <span className="font-mono text-emerald-800 bg-emerald-100/50 border border-emerald-200/50 px-2 py-1 rounded-md font-black text-[10px] whitespace-nowrap ml-2">
                          ${deal.amount.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Action Checklist */}
                <div className="bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                      Acciones
                    </h4>
                    <span className="bg-blue-50 text-blue-700 border border-blue-100/50 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                      {checklist.filter((t) => t.checked).length}/{checklist.length}
                    </span>
                  </div>
                  <div className="p-4 pt-3 flex flex-col gap-1.5">
                    {checklist.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}
                        className="flex items-start gap-2.5 text-left text-[11px] hover:bg-slate-50 p-2 rounded-lg transition-colors group cursor-pointer"
                      >
                        {task.checked ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-slate-300 rounded flex-shrink-0 mt-0.5 group-hover:border-blue-500 transition-colors bg-white"></div>
                        )}
                        <span className={`leading-snug font-medium transition-colors ${task.checked ? "line-through text-slate-400" : "text-slate-700 group-hover:text-slate-900"}`}>
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
