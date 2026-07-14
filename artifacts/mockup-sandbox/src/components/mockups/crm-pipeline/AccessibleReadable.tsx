import './_group.css';
import React, { useState } from "react";
import {
  Users, DollarSign, Plus, ArrowRight, ArrowLeft, Trash2, Lightbulb,
  CheckCircle, Search, Building2, Phone, User, Sparkles, Compass, FileDown,
  TrendingUp, Mail, MessageSquare, CheckSquare, Lock, Package, Bot, Sliders,
  Edit3, Target, Award, FileText, AlertTriangle, AlertCircle, Info
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

function getMEDDICStatus(score: number) {
  if (score >= 75) return { color: "bg-emerald-100 text-emerald-900 border-emerald-700", label: "Calificación Alta", icon: CheckCircle };
  if (score >= 45) return { color: "bg-amber-100 text-amber-900 border-amber-700", label: "Calificación Media", icon: AlertTriangle };
  return { color: "bg-red-100 text-red-900 border-red-700", label: "Calificación Baja", icon: AlertCircle };
}

export default function AccessibleReadable() {
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

  const columns: { id: CRMDeal["stage"]; label: string; icon: React.ElementType; colorTheme: string }[] = [
    { id: "leads", label: "Paso 1: Nuevos Leads", icon: User, colorTheme: "border-blue-700 bg-blue-50" },
    { id: "bot_contact", label: "Paso 2: WhatsApp Bot", icon: Bot, colorTheme: "border-emerald-700 bg-emerald-50" },
    { id: "proposed", label: "Paso 3: Propuesta", icon: FileText, colorTheme: "border-indigo-700 bg-indigo-50" },
    { id: "closed", label: "Paso 4: Ganados", icon: CheckCircle, colorTheme: "border-emerald-900 bg-emerald-100" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      {/* Top bar */}
      <header className="bg-gray-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between no-print border-b-4 border-gray-700 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-gray-900 text-xl" aria-hidden="true">C</div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">AI Client Prospector</h1>
              <span className="bg-gray-700 text-white border border-gray-500 text-sm font-semibold px-2 py-1 rounded">
                Versión 2.0 PRO
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1 font-medium max-w-lg">
              Sistema integral de prospección B2B, calificación MEDDIC y automatización de outreach.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="min-h-[44px] min-w-[44px] bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 focus-visible:ring-4 focus-visible:ring-blue-400 text-base font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-white">
            <FileDown className="w-5 h-5" aria-hidden="true" />
            Exportar Datos
          </button>
          <button className="min-h-[44px] min-w-[44px] bg-blue-700 hover:bg-blue-600 border-2 border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-400 text-white text-base font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
            Volver al Editor
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
          <button className="min-h-[44px] min-w-[44px] bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 focus-visible:ring-4 focus-visible:ring-blue-400 text-base font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-white" aria-label="Bloquear pantalla">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {showFallbackBanner && (
        <div className="bg-blue-50 border-b-2 border-blue-800 px-6 py-4 flex items-center justify-between gap-4 text-blue-900 text-base font-medium no-print">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-700 flex-shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-bold">Notificación del sistema:</strong> {showFallbackBanner}
            </span>
          </div>
          <button
            onClick={() => setShowFallbackBanner(null)}
            className="min-h-[44px] min-w-[44px] text-blue-900 hover:bg-blue-200 border-2 border-transparent focus-visible:border-blue-800 focus-visible:ring-4 focus-visible:ring-blue-400 font-bold px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
            aria-label="Cerrar notificación"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-full lg:w-72 bg-gray-50 border-r-2 border-gray-200 overflow-y-auto flex-shrink-0 no-print py-6 px-4 z-0">
          <h2 className="px-3 pb-4 mb-2 border-b-2 border-gray-200 flex items-center gap-2 text-gray-800 font-bold text-base uppercase tracking-wide">
            <Compass className="w-5 h-5" aria-hidden="true" />
            Menú Principal
          </h2>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === "pipeline";
              return (
                <li key={item.id}>
                  <button
                    className={`w-full min-h-[48px] text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer border-2 focus-visible:ring-4 focus-visible:ring-blue-400 ${
                      isActive ? "bg-blue-100 border-blue-800 text-blue-900" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${isActive ? "text-blue-800" : "text-gray-600"}`} aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className={`block text-base font-bold ${isActive ? "text-blue-900" : "text-gray-900"}`}>{item.label}</span>
                      {"desc" in item && item.desc && (
                        <span className={`block text-sm mt-1 ${isActive ? "text-blue-800" : "text-gray-600"}`}>
                          {item.desc}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
            
            {/* KPI Metrics */}
            <section aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="sr-only">Resumen de Métricas (KPIs)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-blue-700" aria-hidden="true" />
                    <h3 className="text-base text-gray-700 font-bold">Valor Pipeline Total</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${totalPipelineVal.toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-7 h-7 text-emerald-700" aria-hidden="true" />
                    <h3 className="text-base text-gray-700 font-bold">Facturación Ganada</h3>
                  </div>
                  {closedVal > 0 ? (
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ${closedVal.toLocaleString("es-AR")}
                    </p>
                  ) : (
                    <div className="mt-2 bg-gray-100 border-2 border-gray-300 rounded-lg px-3 py-2 inline-flex items-center gap-2 w-fit">
                      <span className="text-sm font-bold text-gray-700">Aún sin cierres</span>
                    </div>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Users className="w-7 h-7 text-indigo-700" aria-hidden="true" />
                    <h3 className="text-base text-gray-700 font-bold">Prospectos Activos</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2 flex items-baseline gap-2">
                    {activeLeadsCount} <span className="text-lg font-medium text-gray-600">Leads</span>
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-amber-700" aria-hidden="true" />
                    <h3 className="text-base text-gray-700 font-bold">Tasa de Conversión</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2 flex items-baseline gap-2">
                    {deals.length > 0 ? Math.round((closedCount / deals.length) * 100) : 0}% 
                    <span className="text-lg font-medium text-gray-600">Ganados</span>
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Kanban Board */}
              <section className="xl:col-span-3 flex flex-col gap-6" aria-labelledby="kanban-heading">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 id="kanban-heading" className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    Tablero de Ventas
                  </h2>
                  <button className="min-h-[44px] bg-gray-900 hover:bg-gray-800 focus-visible:ring-4 focus-visible:ring-blue-400 text-white text-base font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus className="w-5 h-5" aria-hidden="true" />
                    Agregar Nuevo Lead
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  {columns.map((col) => {
                    const colDeals = deals.filter((d) => d.stage === col.id);
                    return (
                      <div key={col.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 flex flex-col gap-4 min-h-[500px]">
                        
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <col.icon className="w-5 h-5 text-gray-700" aria-hidden="true" />
                            {col.label}
                          </h3>
                          <span className="bg-white border-2 border-gray-300 text-gray-900 text-sm font-bold px-3 py-1 rounded-md" aria-label={`${colDeals.length} elementos`}>
                            {colDeals.length}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pb-4 pr-2">
                          {colDeals.map((deal) => (
                            <article 
                              key={deal.id} 
                              className={`bg-white border-2 p-4 rounded-xl flex flex-col gap-4 shadow-sm ${col.colorTheme}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 leading-tight">{deal.company}</h4>
                                  <p className="text-sm text-gray-600 font-medium mt-1">Rubro: {deal.industry}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteDeal(deal.id)} 
                                  className="text-gray-500 hover:text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-400 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-transparent hover:border-red-200"
                                  aria-label={`Eliminar lead ${deal.company}`}
                                >
                                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                                </button>
                              </div>

                              {col.id === "leads" && (
                                <div className="text-sm text-gray-800 flex flex-col gap-3 mt-2 bg-gray-100 p-4 rounded-lg border-2 border-gray-200">
                                  <p className="flex items-center gap-3 font-medium">
                                    <User className="w-5 h-5 text-gray-600" aria-hidden="true" />
                                    <span className="font-bold">Contacto:</span> {deal.contact}
                                  </p>
                                  <p className="flex items-center gap-3 font-medium">
                                    <Phone className="w-5 h-5 text-gray-600" aria-hidden="true" />
                                    <span className="font-bold">Tel:</span> {deal.phone}
                                  </p>
                                </div>
                              )}

                              {col.id === "bot_contact" && (
                                <div className="text-sm bg-blue-50 text-blue-900 p-4 rounded-lg border-2 border-blue-200 mt-2">
                                  <strong className="block font-bold mb-2 flex items-center gap-2 text-base">
                                    <MessageSquare className="w-5 h-5" aria-hidden="true" />
                                    Última respuesta del Bot:
                                  </strong>
                                  <p className="text-base font-medium">"Hola! Registramos tu interés en la propuesta, en breve te contactaremos."</p>
                                </div>
                              )}

                              {col.id === "proposed" && (
                                deal.meddicScore ? (
                                  <div className={`text-sm p-4 rounded-lg border-2 ${getMEDDICStatus(deal.meddicScore).color} font-medium mt-2 flex flex-col gap-2`}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold flex items-center gap-2">
                                        {React.createElement(getMEDDICStatus(deal.meddicScore).icon, { className: "w-5 h-5" })}
                                        Estado MEDDIC
                                      </span>
                                      <span className="font-bold bg-white/70 px-2 py-1 rounded text-base border border-current">{deal.meddicScore}/100</span>
                                    </div>
                                    <p className="text-sm font-bold opacity-90">{getMEDDICStatus(deal.meddicScore).label}</p>
                                  </div>
                                ) : (
                                  <div className="text-sm bg-orange-50 text-orange-900 p-4 rounded-lg border-2 border-orange-300 mt-2 font-medium flex gap-3 items-start">
                                    <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" aria-hidden="true" />
                                    <p className="font-bold text-base">Requiere completar calificación MEDDIC para avanzar al cierre.</p>
                                  </div>
                                )
                              )}

                              {col.id === "closed" && (
                                <div className="text-base bg-emerald-50 text-emerald-900 p-4 rounded-lg border-2 border-emerald-300 font-bold flex items-center gap-3 mt-2">
                                  <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                                  Estado: Facturado (AFIP Clase A)
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-2 border-t-2 border-gray-200 pt-4">
                                <p className="text-lg font-bold text-gray-900">
                                  Monto: ${deal.amount.toLocaleString("es-AR")}
                                </p>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  
                                  {col.id !== "leads" && (
                                    <button 
                                      onClick={() => moveDeal(deal.id, "prev")} 
                                      className="flex-1 sm:flex-none min-h-[44px] min-w-[44px] flex items-center justify-center bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-700 focus-visible:ring-4 focus-visible:ring-blue-400 rounded-lg transition-colors font-bold text-sm px-3 gap-2"
                                      aria-label={`Mover ${deal.company} al paso anterior`}
                                    >
                                      <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                                      <span className="sm:hidden">Atrás</span>
                                    </button>
                                  )}
                                  
                                  {col.id === "leads" && (
                                    <button className="flex-1 sm:flex-none min-h-[44px] bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-400 text-sm font-bold px-4 rounded-lg transition-colors">
                                      Evaluar Contacto
                                    </button>
                                  )}
                                  {col.id === "bot_contact" && (
                                    <button className="flex-1 sm:flex-none min-h-[44px] bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 focus-visible:ring-4 focus-visible:ring-emerald-400 text-sm font-bold px-4 rounded-lg transition-colors">
                                      Enviar Mensaje
                                    </button>
                                  )}
                                  {col.id === "proposed" && (
                                    <button className="flex-1 sm:flex-none min-h-[44px] bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 focus-visible:ring-4 focus-visible:ring-indigo-400 text-sm font-bold px-4 rounded-lg transition-colors">
                                      Evaluar Score
                                    </button>
                                  )}
                                  
                                  {col.id !== "closed" && (
                                    <button 
                                      onClick={() => moveDeal(deal.id, "next")} 
                                      className="flex-1 sm:flex-none min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white focus-visible:ring-4 focus-visible:ring-blue-400 rounded-lg transition-colors font-bold text-sm px-3 gap-2"
                                      aria-label={`Mover ${deal.company} al siguiente paso`}
                                    >
                                      <span className="sm:hidden">Avanzar</span>
                                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Right Sidebar - Action Center */}
              <aside className="flex flex-col gap-6 xl:pt-14" aria-labelledby="sidebar-heading">
                <h2 id="sidebar-heading" className="sr-only">Centro de Acciones y Recomendaciones</h2>
                
                {/* Recomendaciones Estratégicas */}
                <section className="bg-white border-2 border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                  <header className="p-5 border-b-2 border-gray-100 bg-gray-50 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-amber-600" aria-hidden="true" />
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Estrategia Sugerida
                    </h3>
                  </header>
                  <div className="p-5">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-base text-gray-900 leading-relaxed">
                      <strong className="block font-bold text-amber-900 mb-2 text-lg">Tip de Conversión Patagónico</strong>
                      Ofrecer precios transparentes en pesos acelera el paso de "WhatsApp Bot" a "Propuesta técnica" en un 35% en Río Negro y Neuquén.
                    </div>
                  </div>
                </section>

                {/* Top Movers */}
                <section className="bg-white border-2 border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                  <header className="p-5 border-b-2 border-gray-100 bg-gray-50 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Top Leads &amp; Alertas
                    </h3>
                  </header>
                  <div className="p-5 flex flex-col gap-4">
                    {deals.slice(0, 3).map((deal, idx) => (
                      <article key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-gray-400 transition-colors cursor-pointer focus-within:ring-4 focus-within:ring-blue-400" tabIndex={0}>
                        <div>
                          <strong className="font-bold text-base text-gray-900 block">{deal.company}</strong>
                          <span className="text-sm text-gray-700 font-medium capitalize mt-1 block">Estado actual: {deal.stage.replace('_', ' ')}</span>
                        </div>
                        <span className="font-bold text-emerald-900 bg-emerald-100 border-2 border-emerald-300 px-3 py-1 rounded-md text-base self-start sm:self-auto">
                          ${deal.amount.toLocaleString("es-AR")}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Weekly Checklist */}
                <section className="bg-white border-2 border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                  <header className="p-5 border-b-2 border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                      <CheckSquare className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      Tareas Semanales
                    </h3>
                    <span className="bg-blue-100 text-blue-900 border-2 border-blue-200 text-sm font-bold px-3 py-1 rounded-full">
                      {checklist.filter((t) => t.checked).length} de {checklist.length} completadas
                    </span>
                  </header>
                  <div className="p-3 flex flex-col gap-2">
                    {checklist.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setChecklist((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)))}
                        className={`flex items-start gap-4 text-left p-4 rounded-xl transition-colors border-2 focus-visible:ring-4 focus-visible:ring-blue-400 min-h-[64px] ${
                          task.checked ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400"
                        }`}
                        aria-pressed={task.checked}
                      >
                        {task.checked ? (
                          <CheckCircle className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-400 rounded-sm flex-shrink-0 mt-0.5 bg-white" aria-hidden="true"></div>
                        )}
                        <span className={`text-base font-medium leading-snug ${task.checked ? "line-through text-gray-500" : "text-gray-900"}`}>
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

              </aside>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
