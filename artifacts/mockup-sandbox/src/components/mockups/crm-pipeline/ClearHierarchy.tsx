import './_group.css';
import React, { useState } from "react";
import {
  Users, DollarSign, Plus, ArrowRight, ArrowLeft, Trash2, Lightbulb,
  CheckCircle, Search, Building2, Phone, User, Sparkles, Compass, FileDown,
  TrendingUp, Mail, MessageSquare, CheckSquare, Lock, Package, Bot, Sliders,
  Edit3, Target, Award, FileText, ChevronRight
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
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 45) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function ClearHierarchy() {
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

  const columns: { id: CRMDeal["stage"]; label: string; dot: string; bgHdr: string; cardBorder: string }[] = [
    { id: "leads", label: "Nuevos Leads", dot: "bg-blue-500", bgHdr: "bg-blue-50", cardBorder: "hover:border-blue-400" },
    { id: "bot_contact", label: "WhatsApp Bot", dot: "bg-teal-500", bgHdr: "bg-teal-50", cardBorder: "hover:border-teal-400" },
    { id: "proposed", label: "Propuesta", dot: "bg-indigo-500", bgHdr: "bg-indigo-50", cardBorder: "hover:border-indigo-400" },
    { id: "closed", label: "Ganados", dot: "bg-emerald-600", bgHdr: "bg-emerald-50", cardBorder: "hover:border-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-slate-900">
      {/* Top bar - Visually receded slightly by using a dark gray rather than black, smaller padding */}
      <header className="bg-slate-800 text-slate-100 px-5 py-2.5 flex items-center justify-between no-print border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900 text-sm">C</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">AI Client Prospector</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide">
                v2.0 PRO
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-slate-300 hover:text-white text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
            Volver al Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors ml-1">
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Banner - Receded visual weight compared to previous bright banner */}
      {showFallbackBanner && (
        <div className="bg-emerald-50/50 border-b border-emerald-100/50 px-5 py-2 flex items-center justify-between gap-4 text-emerald-800 text-xs no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="opacity-90">
              <span className="font-semibold">Resiliencia de Clientum:</span> {showFallbackBanner}
            </span>
          </div>
          <button
            onClick={() => setShowFallbackBanner(null)}
            className="text-emerald-600/50 hover:text-emerald-800 p-1 rounded transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav - Subordinated with lighter text, less contrast, thinner borders */}
        <aside className="w-52 bg-white border-r border-slate-100 overflow-y-auto flex-shrink-0 no-print py-4 px-2">
          <div className="px-3 pb-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menú
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2.5 transition-colors cursor-pointer ${
                  item.id === "pipeline" 
                    ? "bg-slate-50 text-slate-900 font-medium" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${item.id === "pipeline" ? "text-slate-700" : "opacity-60"}`} />
                <span className="text-sm truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          
          {/* Top Header & Compact Metrics - Clear reading order: Title -> Metrics -> Board */}
          <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tablero Kanban de Ventas</h1>
                <p className="text-sm text-slate-500 mt-1">Gestión de oportunidades y cierres de la región Patagonia.</p>
              </div>
              <button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />
                Nuevo Lead
              </button>
            </div>

            {/* Subordinated KPI Strip - replacing 4 massive cards with a clean, scannable row */}
            <div className="flex flex-wrap items-center gap-8 text-sm bg-slate-50/50 rounded-lg p-4 border border-slate-100/50">
              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Valor Pipeline</span>
                <span className="text-lg font-semibold text-slate-900">${totalPipelineVal.toLocaleString("es-AR")}</span>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
              
              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/> Facturación Ganada</span>
                <span className="text-lg font-semibold text-slate-900">
                  {closedVal > 0 ? `$${closedVal.toLocaleString("es-AR")}` : <span className="text-slate-400 font-normal text-sm block mt-1">Aún sin cierres</span>}
                </span>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
              
              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Prospectos Activos</span>
                <span className="text-lg font-semibold text-slate-900">{activeLeadsCount} <span className="text-slate-400 font-normal text-sm">leads</span></span>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
              
              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Conversión Win-Rate</span>
                <span className="text-lg font-semibold text-slate-900">{deals.length > 0 ? Math.round((closedCount / deals.length) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 flex gap-8 min-w-0">
            
            {/* DOMINANT ELEMENT: Kanban Board */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 items-start min-w-0">
              {columns.map((col) => (
                <div key={col.id} className="flex flex-col h-full max-h-full">
                  {/* Stronger column headers to establish horizontal rhythm */}
                  <div className={`px-4 py-3 rounded-t-xl border border-b-0 border-slate-200 ${col.bgHdr} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                      <h3 className="text-sm font-semibold text-slate-800">{col.label}</h3>
                    </div>
                    <span className="bg-white/80 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                      {deals.filter((d) => d.stage === col.id).length}
                    </span>
                  </div>
                  
                  {/* Column body */}
                  <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-b-xl p-3 flex flex-col gap-3 min-h-[500px] overflow-y-auto">
                    {deals.filter((d) => d.stage === col.id).map((deal) => (
                      <div 
                        key={deal.id} 
                        className={`group bg-white border border-slate-200 rounded-lg p-4 shadow-sm transition-all duration-200 ${col.cardBorder} hover:shadow-md relative`}
                      >
                        {/* Quiet Delete Action */}
                        <button onClick={() => handleDeleteDeal(deal.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="mb-3 pr-6">
                          <h4 className="text-sm font-semibold text-slate-900 leading-tight mb-0.5">{deal.company}</h4>
                          <span className="text-xs text-slate-500">{deal.industry}</span>
                        </div>

                        {/* Stage-specific distinct content, cleanly styled */}
                        <div className="mb-4">
                          {col.id === "leads" && (
                            <div className="text-xs text-slate-600 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" /> {deal.contact}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" /> <span className="font-mono text-[11px]">{deal.phone}</span>
                              </div>
                            </div>
                          )}

                          {col.id === "bot_contact" && (
                            <div className="bg-slate-50 rounded-md p-2.5 border border-slate-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Última Rta. Bot</span>
                              <p className="text-xs text-slate-700 italic">"Hola! Registramos tu interés en la propuesta..."</p>
                            </div>
                          )}

                          {col.id === "proposed" && (
                            deal.meddicScore ? (
                              <div className={`px-2.5 py-2 rounded-md border text-xs font-medium flex justify-between items-center ${getMEDDICStatusColor(deal.meddicScore)}`}>
                                <span>Score MEDDIC</span>
                                <span className="font-semibold">{deal.meddicScore}%</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-2 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium flex items-start gap-1.5">
                                <span>⚠️</span>
                                <span className="leading-tight">Requiere calificación para avanzar</span>
                              </div>
                            )
                          )}

                          {col.id === "closed" && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-2 rounded-md border border-emerald-100">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Facturado AFIP
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Value & Clear Stage Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            ${deal.amount.toLocaleString("es-AR")}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.id !== "leads" && (
                              <button onClick={() => moveDeal(deal.id, "prev")} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Mover atrás">
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {/* Contextual primary action */}
                            {col.id === "leads" && <button className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">Evaluar</button>}
                            {col.id === "bot_contact" && <button className="text-xs font-medium text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors">Outreach</button>}
                            {col.id === "proposed" && <button className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">Score</button>}
                            
                            {col.id !== "closed" && (
                              <button onClick={() => moveDeal(deal.id, "next")} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors" title="Avanzar etapa">
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

            {/* SUBORDINATED REGION: Right Sidebar */}
            {/* Visual weight reduced drastically: flat design, lighter text, separated by spacing rather than heavy boxes */}
            <div className="w-[280px] flex-shrink-0 flex flex-col gap-8">
              
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Estrategia
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <strong className="font-medium text-slate-900 block mb-1">Tip Patagónico</strong>
                  Ofrecer precios transparentes en pesos acelera el paso a Propuesta en un 35% en RN y NQN.
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Top Movers
                </h3>
                <ul className="space-y-2">
                  {deals.slice(0, 3).map((deal, idx) => (
                    <li key={idx} className="flex flex-col py-1 border-b border-slate-100 last:border-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-medium text-slate-800 truncate">{deal.company}</span>
                        <span className="text-xs font-mono text-slate-500">${deal.amount.toLocaleString("es-AR")}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> {deal.stage.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5" /> Acciones
                  </h3>
                  <span className="text-[10px] font-medium text-slate-400">
                    {checklist.filter((t) => t.checked).length}/{checklist.length}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {checklist.map((task) => (
                    <li key={task.id} className="flex items-start gap-2.5 group">
                      <button
                        onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}
                        className="mt-0.5 flex-shrink-0 focus:outline-none"
                      >
                        {task.checked ? (
                          <CheckCircle className="w-4 h-4 text-slate-300" />
                        ) : (
                          <div className="w-4 h-4 border border-slate-300 rounded hover:border-slate-400 transition-colors"></div>
                        )}
                      </button>
                      <span className={`text-xs leading-snug cursor-pointer select-none transition-colors ${task.checked ? "text-slate-400 line-through" : "text-slate-600 hover:text-slate-900"}`}
                            onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}>
                        {task.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
