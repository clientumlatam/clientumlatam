const fs = require('fs');

let content = fs.readFileSync('src/components/SalesProspectorDashboard.tsx', 'utf8');

const startMarker = '{/* TAB 1: PIPELINE & SALES TRACKER DASHBOARD */}';
const endMarker = '{/* TAB 2: IDEAL CUSTOMER PROFILE BUILDER */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found', startIndex, endIndex);
  process.exit(1);
}

const replacement = `{/* TAB 1: PIPELINE & SALES TRACKER DASHBOARD */}
        {activeTab === "pipeline" && (
          <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto w-full animate-fadeIn">
            
            {/* Executive Pipeline Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 shadow-sm rounded p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-[#10B981]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Valor Pipeline</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-800 tracking-tight">\${totalPipelineVal.toLocaleString("es-AR")}</h3>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-12 h-12 text-[#10B981]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Ganado</span>
                </div>
                <h3 className="text-2xl font-black text-[#065F46] tracking-tight">\${closedVal.toLocaleString("es-AR")}</h3>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Activos</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-800 tracking-tight">{activeLeadsCount} Leads</h3>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CheckCircle className="w-12 h-12 text-amber-500" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Win-Rate</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-800 tracking-tight">
                  {deals.length > 0 ? Math.round((closedCount / deals.length) * 100) : 0}%
                </h3>
              </div>
            </div>

            {/* Main Interactive Grid: Kanban + Actions Checklist */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start h-full">
              
              {/* Kanban Pipeline Column Board (Occupies 3 cols) */}
              <div className="xl:col-span-3 flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-black tracking-wide text-zinc-800 uppercase flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[#10B981]" />
                    Pipeline Engine v2.0
                  </h3>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-[#0B131D] hover:bg-[#1A2733] text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors border border-[#2D3B48]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo Lead
                  </button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleAddDealManual} className="bg-white border border-zinc-200 rounded p-5 flex flex-col gap-4 shadow-sm animate-fadeIn max-w-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]"></div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wide flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-400" />
                        Registro de Prospecto
                      </h4>
                      <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Empresa</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Distribuidora Comahue"
                          value={addCompany}
                          onChange={(e) => setAddCompany(e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Valor Estimado (ARS)</label>
                        <input
                          type="number"
                          placeholder="Ej. 180000"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Contacto Directo</label>
                        <input
                          type="text"
                          placeholder="Ej. Marcos Ramirez (Dueño)"
                          value={addContact}
                          onChange={(e) => setAddContact(e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Teléfono Local</label>
                        <input
                          type="text"
                          placeholder="Ej. +54 298 4432120"
                          value={addPhone}
                          onChange={(e) => setAddPhone(e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Rubro Comercial</label>
                        <select
                          value={addIndustry}
                          onChange={(e) => setAddIndustry(e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                        >
                          {INDUSTRIES_PRESET.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Etapa</label>
                        <select
                          value={addStage}
                          onChange={(e) => setAddStage(e.target.value as any)}
                          className="bg-zinc-50 border border-zinc-200 rounded p-2 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                        >
                          <option value="leads">Nuevos Leads</option>
                          <option value="bot_contact">Bot Calificador</option>
                          <option value="proposed">Propuesta Presentada</option>
                          <option value="closed">Venta Cerrada</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold px-5 py-2 rounded shadow-sm transition-colors uppercase tracking-wide flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Guardar Lead
                      </button>
                    </div>
                  </form>
                )}

                {/* The Kanban Board Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start h-full">
                  
                  {/* Column 1: Leads */}
                  <div className="bg-zinc-200/40 rounded p-2.5 border border-zinc-200 flex flex-col gap-2.5 min-h-[500px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                      <span className="text-[10px] font-black text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-500 rounded-sm"></span>
                        Leads
                      </span>
                      <span className="bg-white border border-zinc-200 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                        {deals.filter((d) => d.stage === "leads").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                      {deals.filter((d) => d.stage === "leads").map((deal) => (
                        <div key={deal.id} className="bg-white border border-zinc-200 p-2.5 rounded shadow-sm flex flex-col gap-2 hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <h5 className="text-[11px] font-black tracking-wide text-zinc-800 leading-tight">{deal.company}</h5>
                              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">{deal.industry}</span>
                            </div>
                            <button onClick={() => handleDeleteDeal(deal.id)} className="text-zinc-300 hover:text-red-500 transition-colors absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="text-[9px] text-zinc-500 flex flex-col gap-1 mt-1 border-t border-zinc-100 pt-1.5 font-medium">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                              <span className="truncate">{deal.contact}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                              <span className="font-mono">{deal.phone}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-zinc-100">
                            <span className="text-[11px] font-black text-zinc-800 font-mono tracking-tight">\${deal.amount.toLocaleString("es-AR")}</span>
                            <div className="flex gap-1 items-center">
                              <button
                                onClick={() => { setSelectedMeddicLeadId(deal.id); setActiveTab("meddic"); }}
                                className="bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-200 font-mono transition-colors"
                              >
                                SC: {deal.meddicScore || 0}
                              </button>
                              <button
                                onClick={() => moveDeal(deal.id, "next")}
                                className="bg-zinc-800 hover:bg-black text-white p-1 rounded transition-colors"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Whatsapp Bot Contact */}
                  <div className="bg-zinc-200/40 rounded p-2.5 border border-zinc-200 flex flex-col gap-2.5 min-h-[500px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                      <span className="text-[10px] font-black text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#10B981] rounded-sm"></span>
                        WA Bot
                      </span>
                      <span className="bg-white border border-zinc-200 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                        {deals.filter((d) => d.stage === "bot_contact").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                      {deals.filter((d) => d.stage === "bot_contact").map((deal) => (
                        <div key={deal.id} className="bg-white border border-zinc-200 p-2.5 rounded shadow-sm flex flex-col gap-2 hover:border-[#10B981] hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <h5 className="text-[11px] font-black tracking-wide text-zinc-800 leading-tight">{deal.company}</h5>
                              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">{deal.industry}</span>
                            </div>
                            <button onClick={() => handleDeleteDeal(deal.id)} className="text-zinc-300 hover:text-red-500 transition-colors absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="text-[9px] bg-[#10B981]/10 text-[#065F46] p-1.5 rounded border border-[#10B981]/20 mt-1">
                            <strong className="block font-bold">Bot Update:</strong>
                            <span className="italic">Contacto inicial enviado...</span>
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-zinc-100">
                            <span className="text-[11px] font-black text-zinc-800 font-mono tracking-tight">\${deal.amount.toLocaleString("es-AR")}</span>
                            <div className="flex gap-1 items-center">
                              <button onClick={() => moveDeal(deal.id, "prev")} className="text-zinc-400 hover:text-zinc-700 p-0.5">
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setSelectedOutreachLeadId(deal.id); setActiveTab("outreach"); }}
                                className="bg-[#10B981] hover:bg-[#059669] text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono transition-colors"
                              >
                                OUT
                              </button>
                              <button onClick={() => moveDeal(deal.id, "next")} className="bg-zinc-800 hover:bg-black text-white p-1 rounded transition-colors">
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Proposed */}
                  <div className="bg-zinc-200/40 rounded p-2.5 border border-zinc-200 flex flex-col gap-2.5 min-h-[500px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                      <span className="text-[10px] font-black text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-indigo-500 rounded-sm"></span>
                        Propuesta
                      </span>
                      <span className="bg-white border border-zinc-200 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                        {deals.filter((d) => d.stage === "proposed").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                      {deals.filter((d) => d.stage === "proposed").map((deal) => (
                        <div key={deal.id} className="bg-white border border-zinc-200 p-2.5 rounded shadow-sm flex flex-col gap-2 hover:border-indigo-400 hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <h5 className="text-[11px] font-black tracking-wide text-zinc-800 leading-tight">{deal.company}</h5>
                              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">{deal.industry}</span>
                            </div>
                            <button onClick={() => handleDeleteDeal(deal.id)} className="text-zinc-300 hover:text-red-500 transition-colors absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {deal.meddicScore ? (
                            <div className={\`text-[9px] p-1.5 rounded border mt-1 font-bold flex items-center gap-1 \${getMEDDICStatusColor(deal.meddicScore)}\`}>
                              <Award className="w-3 h-3" />
                              M: {deal.meddicScore}% ({deal.meddicScore >= 75 ? "HOT" : "WARM"})
                            </div>
                          ) : (
                            <div className="text-[9px] bg-amber-50 text-amber-700 p-1.5 rounded border border-amber-200 mt-1 font-bold">
                              Falta Calificar
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-zinc-100">
                            <span className="text-[11px] font-black text-zinc-800 font-mono tracking-tight">\${deal.amount.toLocaleString("es-AR")}</span>
                            <div className="flex gap-1 items-center">
                              <button onClick={() => moveDeal(deal.id, "prev")} className="text-zinc-400 hover:text-zinc-700 p-0.5">
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setSelectedMeddicLeadId(deal.id); setActiveTab("meddic"); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono transition-colors"
                              >
                                CALIF
                              </button>
                              <button onClick={() => moveDeal(deal.id, "next")} className="bg-zinc-800 hover:bg-black text-white p-1 rounded transition-colors">
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Closed */}
                  <div className="bg-zinc-200/40 rounded p-2.5 border border-zinc-200 flex flex-col gap-2.5 min-h-[500px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                      <span className="text-[10px] font-black text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#059669] rounded-sm"></span>
                        Ganados
                      </span>
                      <span className="bg-white border border-zinc-200 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                        {deals.filter((d) => d.stage === "closed").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                      {deals.filter((d) => d.stage === "closed").map((deal) => (
                        <div key={deal.id} className="bg-white border border-[#10B981]/30 p-2.5 rounded shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-[#10B981]/5 pointer-events-none"></div>
                          <div className="flex justify-between items-start relative z-10">
                            <div className="pr-4">
                              <h5 className="text-[11px] font-black tracking-wide text-zinc-800 leading-tight">{deal.company}</h5>
                              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">{deal.industry}</span>
                            </div>
                            <button onClick={() => handleDeleteDeal(deal.id)} className="text-zinc-300 hover:text-red-500 transition-colors absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="text-[9px] bg-[#10B981]/10 text-[#065F46] p-1.5 rounded border border-[#10B981]/20 mt-1 font-bold flex items-center gap-1.5 relative z-10">
                            <CheckCircle className="w-3.5 h-3.5" />
                            CERRADO
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-zinc-100 relative z-10">
                            <span className="text-[11px] font-black text-[#065F46] font-mono tracking-tight">\${deal.amount.toLocaleString("es-AR")}</span>
                            <button onClick={() => moveDeal(deal.id, "prev")} className="text-zinc-400 hover:text-zinc-700 p-0.5">
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sidebar Action Center / Top Movers & Checklist */}
              <div className="xl:col-span-1 flex flex-col gap-5 h-full">
                
                {/* Pipeline Health & Recommendations */}
                <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                    <Activity className="w-3.5 h-3.5" />
                    Radar de Pipeline
                  </h4>
                  <div className="flex flex-col gap-2">
                    {deals.filter((d) => d.stage === "proposed" && !d.meddicScore).length > 0 && (
                      <div className="bg-amber-50 border border-amber-200/60 rounded p-2.5 text-[10px] text-amber-900 flex gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <strong className="font-bold uppercase tracking-wide text-[9px]">Falta Calificar</strong>
                          <span className="leading-snug opacity-90">Tenés propuestas sin score MEDDIC. Riesgo de estancamiento alto.</span>
                        </div>
                      </div>
                    )}
                    {deals.filter((d) => d.stage === "leads").length >= 4 && (
                      <div className="bg-blue-50 border border-blue-200/60 rounded p-2.5 text-[10px] text-blue-900 flex gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <strong className="font-bold uppercase tracking-wide text-[9px]">Cuello de Botella</strong>
                          <span className="leading-snug opacity-90">Muchos leads nuevos. Activá secuencias de Outreach o WA Bot ahora.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Movers (This week) */}
                <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                    <Star className="w-3.5 h-3.5" />
                    Top Prospects
                  </h4>
                  <div className="flex flex-col gap-2">
                    {deals.slice(0, 3).map((deal, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] border-b border-zinc-50 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex flex-col truncate pr-2">
                          <strong className="font-bold text-zinc-800 truncate">{deal.company}</strong>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-wide font-medium">{deal.stage.replace('_', ' ')}</span>
                        </div>
                        <span className="font-mono text-[#065F46] bg-[#10B981]/10 px-1.5 py-0.5 rounded font-bold text-[9px]">
                          \${deal.amount.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales Pipeline Weekly Actions Checklist */}
                <div className="bg-[#0B131D] rounded p-4 shadow-sm flex flex-col gap-3 border border-[#1A2733] text-zinc-300">
                  <div className="flex items-center justify-between border-b border-[#1A2733] pb-2">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#10B981]" />
                      Focus Semanal
                    </h4>
                    <span className="text-[9px] font-mono text-[#10B981] font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded">
                      {checklist.filter((t) => t.checked).length}/{checklist.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {checklist.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setChecklist((prev) =>
                            prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t))
                          );
                        }}
                        className="flex items-start gap-2 text-left text-[10px] hover:bg-[#1A2733]/50 p-1.5 rounded transition-colors group cursor-pointer"
                      >
                        {task.checked ? (
                          <CheckCircle className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 border border-zinc-600 rounded flex-shrink-0 group-hover:border-[#10B981] transition-colors"></div>
                        )}
                        <span className={\`leading-tight mt-0.5 font-medium \${task.checked ? "line-through text-zinc-600" : "text-zinc-300"}\`}>
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('src/components/SalesProspectorDashboard.tsx', content, 'utf8');
console.log('Pipeline updated.');
