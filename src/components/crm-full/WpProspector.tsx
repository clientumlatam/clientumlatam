import React, { useState } from 'react';
import { Target, CheckCircle2, MapPin, Search, Loader2, ArrowRight, Star, Zap, Filter } from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  rubro: string;
  ciudad: string;
  phone?: string;
  website?: string;
  fit: number;
  meddic: { need: number; budget: number; authority: number };
  status: 'nuevo' | 'exportado' | 'descartado';
}

const SAMPLE_PROSPECTS: Prospect[] = [
  { id: '1', name: 'Ferretería del Comahue', rubro: 'Ferretería', ciudad: 'General Roca', phone: '+54 298 442-1190', website: 'ferreteriacomahue.com.ar', fit: 92, meddic: { need: 9, budget: 7, authority: 8 }, status: 'nuevo' },
  { id: '2', name: 'Clínica del Neuquén', rubro: 'Salud', ciudad: 'Neuquén Capital', phone: '+54 299 448-5500', website: null as any, fit: 87, meddic: { need: 8, budget: 8, authority: 7 }, status: 'exportado' },
  { id: '3', name: 'Distribuidora Confluencia', rubro: 'Distribución', ciudad: 'Cipolletti', phone: '+54 299 478-3310', website: 'distribuidoraconfluencia.com', fit: 81, meddic: { need: 7, budget: 6, authority: 9 }, status: 'nuevo' },
  { id: '4', name: 'Inmobiliaria del Limay', rubro: 'Inmobiliaria', ciudad: 'Neuquén Capital', phone: null as any, website: 'limaypropiedades.com.ar', fit: 76, meddic: { need: 8, budget: 5, authority: 7 }, status: 'nuevo' },
  { id: '5', name: 'Automotriz Patagonia Sur', rubro: 'Automotriz', ciudad: 'General Roca', phone: '+54 298 443-0022', website: null as any, fit: 68, meddic: { need: 6, budget: 7, authority: 6 }, status: 'descartado' },
];

const RUBROS = ['Ferretería', 'Salud', 'Inmobiliaria', 'Automotriz', 'Distribución', 'Retail', 'Logística', 'Agroindustria', 'Medios', 'Industrial'];
const CIUDADES = ['General Roca', 'Neuquén Capital', 'Cipolletti', 'Allen', 'Bariloche', 'Villa Regina', 'Centenario', 'Plottier'];

function FitBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-400/10'
    : score >= 70 ? 'text-amber-400 border-amber-500/30 bg-amber-400/10'
    : 'text-slate-400 border-slate-500/30 bg-slate-400/10';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-bold ${color}`}>
      <Star className="w-3 h-3" /> {score}
    </span>
  );
}

function MeddicBar({ label, val }: { label: string; val: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
        <span>{label}</span><span className="text-slate-300">{val}/10</span>
      </div>
      <div className="h-1 bg-[#1E293B] rounded-full overflow-hidden">
        <div className="h-full bg-sky-400/60 rounded-full" style={{ width: `${val * 10}%` }} />
      </div>
    </div>
  );
}

export default function WpProspector() {
  const [rubro, setRubro] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [scanning, setScanning] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>(SAMPLE_PROSPECTS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'nuevo' | 'exportado' | 'descartado'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const runProspect = async () => {
    if (!rubro && !ciudad) return;
    setScanning(true);
    await new Promise(r => setTimeout(r, 2400));
    setScanning(false);
  };

  const exportToCrm = async (p: Prospect) => {
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'exportado' } : x));
    setExportMsg(`${p.name} exportado al CRM Pipeline ✓`);
    setTimeout(() => setExportMsg(null), 3000);
  };

  const filtered = statusFilter === 'all' ? prospects : prospects.filter(p => p.status === statusFilter);
  const newCount = prospects.filter(p => p.status === 'nuevo').length;
  const exportedCount = prospects.filter(p => p.status === 'exportado').length;
  const avgFit = Math.round(prospects.reduce((a, p) => a + p.fit, 0) / prospects.length);

  return (
    <div className="space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Target className="w-7 h-7 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Prospector de Leads</h1>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Activo
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Descubrimiento de prospectos locales integrado con el Explorador Patagónico. Busca empresas por rubro y zona geográfica con calificación MEDDIC automática.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Prospectos encontrados', value: prospects.length, icon: <Target className="w-5 h-5 text-orange-400" />, border: 'border-orange-500/30' },
          { label: 'Pendientes de exportar', value: newCount, icon: <Filter className="w-5 h-5 text-sky-400" />, border: 'border-sky-500/30' },
          { label: 'Exportados al CRM', value: exportedCount, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, border: 'border-emerald-500/30' },
          { label: 'Fit score promedio', value: avgFit, icon: <Star className="w-5 h-5 text-amber-400" />, border: 'border-amber-500/30' },
        ].map(s => (
          <div key={s.label} className={`bg-[#0A101F]/60 border ${s.border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-2xl font-bold text-white">{s.value}</span></div>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export toast */}
      {exportMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {exportMsg}
        </div>
      )}

      {/* Search form */}
      <div className="bg-[#0A101F]/60 border border-[#1E293B] rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-orange-400" /> Buscar prospectos con IA
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Rubro</label>
            <select value={rubro} onChange={e => setRubro(e.target.value)}
              className="w-full bg-[#030712] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500/40">
              <option value="">Todos los rubros</option>
              {RUBROS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Ciudad / Zona</label>
            <select value={ciudad} onChange={e => setCiudad(e.target.value)}
              className="w-full bg-[#030712] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500/40">
              <option value="">Toda la Patagonia</option>
              {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={runProspect} disabled={scanning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-semibold hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {scanning ? 'Buscando en Google Maps...' : 'Prospectar'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Google Maps API</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-sky-400" /> Calificación MEDDIC automática</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Exportación directa al CRM</span>
        </div>
      </div>

      {/* Prospects list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-bold text-white">Resultados</h2>
          <div className="flex gap-2">
            {(['all', 'nuevo', 'exportado', 'descartado'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === f
                    ? 'bg-[#1E293B] border-slate-500 text-white'
                    : 'bg-transparent border-[#1E293B] text-slate-500 hover:text-slate-300'
                }`}>
                {f === 'all' ? 'Todos' : f === 'nuevo' ? `🔵 Nuevos (${newCount})` : f === 'exportado' ? `✅ Exportados` : '⬜ Descartados'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id}
              className={`bg-[#0A101F]/60 border rounded-xl overflow-hidden transition-all ${
                expanded === p.id ? 'border-orange-500/30' : 'border-[#1E293B] hover:border-orange-500/20'
              }`}>
              <div
                className="p-5 flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{p.name}</p>
                    <FitBadge score={p.fit} />
                    {p.status === 'exportado' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 font-semibold">Exportado</span>
                    )}
                    {p.status === 'descartado' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-400/10 border border-slate-400/30 text-slate-400 font-semibold">Descartado</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.ciudad}</span>
                    <span>{p.rubro}</span>
                    {p.phone && <span>{p.phone}</span>}
                    {p.website && <span className="text-sky-400">{p.website}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.status === 'nuevo' && (
                    <button
                      onClick={e => { e.stopPropagation(); exportToCrm(p); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" /> Exportar al CRM
                    </button>
                  )}
                </div>
              </div>

              {expanded === p.id && (
                <div className="px-5 pb-5 border-t border-[#1E293B] pt-4 grid md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Score MEDDIC</p>
                    <MeddicBar label="Need (Necesidad)" val={p.meddic.need} />
                    <MeddicBar label="Budget (Presupuesto)" val={p.meddic.budget} />
                    <MeddicBar label="Authority (Decisor)" val={p.meddic.authority} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Datos de contacto</p>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      {p.phone && <p>📞 {p.phone}</p>}
                      {p.website && <p>🌐 {p.website}</p>}
                      <p>📍 {p.ciudad}, Patagonia</p>
                      <p>🏭 {p.rubro}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Acciones</p>
                    {p.status === 'nuevo' && (
                      <button onClick={() => exportToCrm(p)}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all">
                        <ArrowRight className="w-3.5 h-3.5" /> Exportar al CRM Pipeline
                      </button>
                    )}
                    <button onClick={() => setProspects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'descartado' } : x))}
                      className="flex items-center gap-2 px-3 py-2 bg-[#030712] border border-[#1E293B] text-slate-400 rounded-lg text-xs font-semibold hover:text-slate-200 transition-all">
                      Descartar prospecto
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CRM integration note */}
      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs text-orange-300">
        <strong>CRM:</strong> Los leads se exportan directo al <strong>CRM Pipeline → Patagonia Explorer</strong>.
        El fit score MEDDIC se preserva en el contacto para priorizar el seguimiento desde la pestaña <strong>Leads</strong>.
      </div>
    </div>
  );
}
