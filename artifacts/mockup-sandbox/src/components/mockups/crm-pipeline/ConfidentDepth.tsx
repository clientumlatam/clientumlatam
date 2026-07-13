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
  if (score >= 75) return "bg-emerald-50 text-emerald-800 border-emerald-300";
  if (score >= 45) return "bg-amber-50 text-amber-800 border-amber-300";
  return "bg-red-50 text-red-800 border-red-300";
}

export function ConfidentDepth() {
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

  const columns: { id: CRMDeal["stage"]; label: string; dot: string; badge: string; borderHover: string; borderLeft: string }[] = [
    { id: "leads", label: "Nuevos Leads", badge: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", borderHover: "group-hover:border-l-blue-400", borderLeft: "border-l-blue-500" },
    { id: "bot_contact", label: "WhatsApp Bot", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", borderHover: "group-hover:border-l-emerald-400", borderLeft: "border-l-emerald-500" },
    { id: "proposed", label: "Propuesta", badge: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500", borderHover: "group-hover:border-l-indigo-400", borderLeft: "border-l-indigo-500" },
    { id: "closed", label: "Ganados (Closed)", badge: "bg-slate-800 text-white border-slate-700", dot: "bg-emerald-400", borderHover: "group-hover:border-l-slate-700", borderLeft: "border-l-slate-800" },
  ];

  const kpiColorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", label: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", label: "text-emerald-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-400", label: "text-slate-500" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", label: "text-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", label: "text-amber-600" },
  };

  const kpis = [
    {
      id: "pipeline",
      icon: TrendingUp,
      color: "blue" as const,
      label: "Valor Total Pipeline",
      value: `$${totalPipelineVal.toLocaleString("es-AR")}`,
      subtext: "ARS",
      valueClassName: "text-2xl font-black text-slate-800 tracking-tight",
      subtextClassName: "text-sm font-bold text-slate-400 ml-1.5",
    },
    {
      id: "won",
      icon: DollarSign,
      color: closedVal > 0 ? ("emerald" as const) : ("slate" as const),
      label: "Facturación Ganada",
      value: closedVal > 0 ? `$${closedVal.toLocaleString("es-AR")}` : "$0",
      subtext: closedVal > 0 ? "ARS" : "Aún sin cierres. ¡A convertir!",
      valueClassName: closedVal > 0 ? "text-2xl font-black text-emerald-800 tracking-tight" : "text-2xl font-black text-slate-400 tracking-tight",
      subtextClassName: closedVal > 0 ? "text-sm font-bold text-emerald-600 ml-1.5" : "text-[10px] font-medium text-slate-400 block mt-1 leading-tight",
    },
    {
      id: "active",
      icon: Users,
      color: "indigo" as const,
      label: "Prospectos Activos",
      value: activeLeadsCount.toString(),
      subtext: "Leads",
      valueClassName: "text-2xl font-black text-indigo-800 tracking-tight",
      subtextClassName: "text-sm font-bold text-indigo-500 ml-1.5",
    },
    {
      id: "winrate",
      icon: CheckCircle,
      color: "amber" as const,
      label: "Tasa de Conversión",
      value: deals.length > 0 ? `${Math.round((closedCount / deals.length) * 100)}%` : "0%",
      subtext: "Win-Rate",
      valueClassName: "text-2xl font-black text-amber-800 tracking-tight",
      subtextClassName: "text-sm font-bold text-amber-500 ml-1.5",
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans text-slate-900">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print shadow-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-slate-900 shadow-inner">C</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight">AI CLIENT PROSPECTOR</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest shadow-sm">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Sistema integral de prospección B2B, calificación MEDDIC y automatización de outreach.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-300 shadow-sm">
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            Exportar CSV
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm">
            Volver al Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1"></div>
          <button className="text-slate-400 hover:text-red-400 text-xs font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showFallbackBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between gap-4 text-emerald-800 text-xs font-semibold no-print shadow-sm relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 p-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            </div>
            <span>
              <strong className="font-extrabold">Resiliencia Activa:</strong> {showFallbackBanner}
            </span>
          </div>
          <button
            onClick={() => setShowFallbackBanner(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold transition-colors px-2 py-0.5 hover:bg-emerald-100/50 rounded text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200/80 overflow-y-auto flex-shrink-0 no-print py-4 px-3 shadow-[1px_0_10px_rgba(0,0,0,0.02)] relative z-10">
          <div className="px-3 pb-3 mb-2 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <Compass className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-500">Pipeline &amp; Comms</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                  item.id === "pipeline" 
                    ? "bg-emerald-50 shadow-sm border border-emerald-100/50" 
                    : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 transition-colors ${item.id === "pipeline" ? "text-emerald-600" : "text-slate-400"}`} />
                <span>
                  <span className={`block text-xs font-bold ${item.id === "pipeline" ? "text-emerald-800" : "text-slate-700"}`}>{item.label}</span>
                  {"desc" in item && item.desc && <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</span>}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="flex flex-col gap-8 h-full max-w-[1600px] mx-auto w-full">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {kpis.map(kpi => (
                <div key={kpi.id} className="bg-white border border-slate-200/80 shadow-sm hover:shadow-md rounded-2xl p-5 flex items-center gap-4 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${kpiColorMap[kpi.color].bg} ${kpiColorMap[kpi.color].text}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${kpiColorMap[kpi.color].label}`}>
                      {kpi.label}
                    </span>
                    <div className="mt-1 flex items-baseline">
                      <span className={kpi.valueClassName}>{kpi.value}</span>
                      {kpi.subtext && <span className={kpi.subtextClassName}>{kpi.subtext}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Kanban & Sidebar Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Kanban Board */}
              <div className="xl:col-span-9 flex flex-col gap-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Tablero Kanban de Ventas v2.0
                  </h3>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                    <Plus className="w-4 h-4" />
                    Nuevo Lead Manual
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                  {columns.map((col) => (
                    <div key={col.id} className="bg-slate-200/40 rounded-2xl p-3.5 flex flex-col gap-4 min-h-[550px] border border-slate-200/60 shadow-inner">
                      
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1">
                        <div className={`px-2.5 py-1.5 rounded-full border ${col.badge} text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm bg-white/50 backdrop-blur-sm`}>
                          <span className={`w-2 h-2 ${col.dot} rounded-full`}></span>
                          {col.label}
                        </div>
                        <span className="bg-white text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-slate-200 font-mono">
                          {deals.filter((d) => d.stage === col.id).length}
                        </span>
                      </div>
                      
                      {/* Column Cards */}
                      <div className="flex flex-col gap-3 overflow-y-auto pb-4">
                        {deals.filter((d) => d.stage === col.id).map((deal) => (
                          <div 
                            key={deal.id} 
                            className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 ${col.borderLeft} ${col.borderHover} flex flex-col gap-3.5 group cursor-grab active:cursor-grabbing`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{deal.company}</h5>
                                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">{deal.industry}</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteDeal(deal.id)} 
                                className="text-slate-300 hover:text-red-600 opacity-0 md:opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-slate-50 hover:bg-red-50 rounded-lg flex-shrink-0"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {col.id === "leads" && (
                              <div className="text-xs text-slate-600 flex flex-col gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="font-semibold text-slate-700">{deal.contact}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="font-mono text-[11px] text-slate-500">{deal.phone}</span>
                                </div>
                              </div>
                            )}

                            {col.id === "bot_contact" && (
                              <div className="text-[11px] bg-emerald-50/80 text-emerald-900 p-3 rounded-lg border border-emerald-200/60 relative">
                                <div className="absolute top-2.5 right-2.5">
                                  <Bot className="w-4 h-4 text-emerald-400" />
                                </div>
                                <strong className="block font-bold text-emerald-800 mb-1">Respuesta del Bot:</strong>
                                <p className="leading-relaxed text-emerald-700 italic">"Hola! Registramos tu interés en la propuesta para el rubro..."</p>
                              </div>
                            )}

                            {col.id === "proposed" && (
                              deal.meddicScore ? (
                                <div className={`text-xs p-3 rounded-lg border ${getMEDDICStatusColor(deal.meddicScore)} flex items-center justify-between shadow-sm`}>
                                  <span className="font-bold">MEDDIC Score</span>
                                  <span className="font-mono font-black text-sm">{deal.meddicScore}%</span>
                                </div>
                              ) : (
                                <div className="text-[11px] bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200/80 flex items-start gap-2 shadow-sm">
                                  <span className="text-amber-500 text-sm leading-none">⚠️</span>
                                  <span className="leading-snug font-medium">Requiere calificación MEDDIC para avanzar.</span>
                                </div>
                              )
                            )}

                            {col.id === "closed" && (
                              <div className="text-xs bg-slate-50 text-slate-800 p-3 rounded-lg border border-slate-200 font-bold flex items-center gap-2.5 shadow-sm">
                                <div className="bg-emerald-100 p-1 rounded-md text-emerald-600 shadow-sm border border-emerald-200">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                Facturado & AFIP Clase A
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-1 pt-3 border-t border-slate-100">
                              <span className="text-sm font-black text-slate-800 font-mono tracking-tight">
                                ${deal.amount.toLocaleString("es-AR")}
                              </span>
                              <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                {col.id !== "leads" && (
                                  <button onClick={() => moveDeal(deal.id, "prev")} className="bg-slate-50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-lg transition-colors border border-slate-200 shadow-sm">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                
                                {col.id === "leads" && (
                                  <button className="bg-white hover:bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-200 font-mono shadow-sm transition-colors">
                                    MEDDIC
                                  </button>
                                )}
                                {col.id === "bot_contact" && (
                                  <button className="bg-white hover:bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 font-mono shadow-sm transition-colors">
                                    OUTREACH
                                  </button>
                                )}
                                {col.id === "proposed" && (
                                  <button className="bg-white hover:bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-indigo-200 font-mono shadow-sm transition-colors">
                                    SCORE
                                  </button>
                                )}
                                
                                {col.id !== "closed" && (
                                  <button onClick={() => moveDeal(deal.id, "next")} className="bg-slate-800 hover:bg-black text-white p-1.5 rounded-lg transition-colors shadow-sm">
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

              {/* Action Center Sidebar */}
              <div className="xl:col-span-3 flex flex-col">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Strategic Recommendations */}
                  <div className="p-5 border-b border-slate-100">
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
                      <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      Centro de Estrategia
                    </h4>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4 shadow-inner">
                      <strong className="block font-bold text-amber-900 text-xs mb-1.5">💡 Tip Patagónico</strong>
                      <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
                        Ofrecer precios transparentes en pesos acelera el paso de WhatsApp Bot a Propuesta técnica en un 35% en Río Negro y Neuquén.
                      </p>
                    </div>
                  </div>

                  {/* Top Movers */}
                  <div className="p-5 border-b border-slate-100">
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
                      <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      Top Movers &amp; Alertas
                    </h4>
                    <div className="flex flex-col gap-3">
                      {deals.slice(0, 3).map((deal, idx) => (
                        <div key={idx} className="flex justify-between items-center group p-2 -mx-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                          <div className="truncate pr-2">
                            <strong className="font-bold text-slate-800 text-xs block truncate group-hover:text-emerald-700 transition-colors">
                              {deal.company}
                            </strong>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 block">
                              {deal.stage.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="font-mono text-emerald-800 bg-white shadow-sm px-2 py-1 rounded-md font-bold text-[10px] border border-emerald-100">
                            ${(deal.amount / 1000)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Action Checklist */}
                  <div className="p-5 bg-slate-50/50">
                    <div className="flex flex-col gap-3.5 mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                          <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          Action Checklist
                        </h4>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-lg shadow-sm border border-blue-200">
                          {checklist.filter((t) => t.checked).length}/{checklist.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(checklist.filter((t) => t.checked).length / checklist.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {checklist.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}
                          className="flex items-start gap-3 text-left text-xs hover:bg-white p-2.5 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group cursor-pointer"
                        >
                          {task.checked ? (
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 drop-shadow-sm" />
                          ) : (
                            <div className="w-4.5 h-4.5 border-2 border-slate-300 bg-white rounded-md flex-shrink-0 mt-0.5 group-hover:border-blue-400 transition-colors shadow-sm"></div>
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
    </div>
  );
}
