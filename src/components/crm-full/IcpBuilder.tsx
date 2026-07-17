import React, { useState } from 'react';
import { Target, Sparkles, Building2, MapPin, DollarSign, AlertCircle, CheckCircle2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const INDUSTRIES = [
  'Distribuidora Mayorista', 'Ferretería Industrial', 'Inmobiliaria & Alquileres',
  'Corralón de Construcción', 'Clínica de Salud / Estética', 'Empaque de Fruta',
  'Gastronomía & Restorán', 'Logística & Transporte', 'Estudio Contable',
  'Bodega de Vinos', 'Agropecuaria', 'Concesionaria de Autos',
];

const SIZES = [
  { id: 'micro', label: 'Micro (1-5 emp.)', desc: 'Sin sistema actual' },
  { id: 'small', label: 'Pequeña (6-20 emp.)', desc: 'Excel / WhatsApp' },
  { id: 'medium', label: 'Mediana (21-100 emp.)', desc: 'Quieren escalar' },
  { id: 'large', label: 'Grande (+100 emp.)', desc: 'Reemplazar ERP viejo' },
];

const PAINS = [
  'Pierden leads por falta de seguimiento',
  'No tienen visibilidad del pipeline',
  'Vendedores sin métricas claras',
  'Cobros y facturación desorganizados',
  'Sin automatización de contacto',
  'Sin reportes para tomar decisiones',
];

const REGIONS = ['Neuquén Capital', 'General Roca', 'Bariloche', 'Cipolletti', 'Toda la Patagonia', 'Online (Sin restricción geográfica)'];

interface ICP {
  industria: string; tamaño: string; region: string; dolores: string[];
  budget: string; score: number; señales: string[];
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
    : score >= 60 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    : 'text-rose-400 bg-rose-400/10 border-rose-400/30';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
      Fit Score: {score}/100
    </span>
  );
}

export default function IcpBuilder() {
  const [industria, setIndustria] = useState('Distribuidora Mayorista');
  const [tamaño, setTamaño] = useState('small');
  const [region, setRegion] = useState('Neuquén Capital');
  const [dolores, setDolores] = useState<string[]>(['Pierden leads por falta de seguimiento']);
  const [budget, setBudget] = useState('50000-150000');
  const [loading, setLoading] = useState(false);
  const [icp, setIcp] = useState<ICP | null>(null);

  const toggleDolor = (d: string) =>
    setDolores(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const generarICP = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    const score = Math.min(100, 40 + dolores.length * 8 + (tamaño === 'small' ? 15 : tamaño === 'medium' ? 20 : 10));
    const señales = [
      `PyME ${industria.toLowerCase()} activa en ${region}`,
      'Usa WhatsApp para ventas actualmente',
      'Sin CRM formal — trabaja en Excel o cuadernos',
      'Más de 2 vendedores en el equipo',
      dolores.includes('Pierden leads por falta de seguimiento') ? 'Manifestó pérdida de leads concreta' : 'Interesado en automatización',
    ];
    setIcp({ industria, tamaño, region, dolores, budget, score, señales });
    setLoading(false);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">ICP Builder</h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Ideal Customer Profile · IA</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Definí el perfil exacto de tu cliente ideal para que Santi SDR y el Explorador Patagónico prioricen los leads con mayor probabilidad de cierre.
          </p>
        </div>
        {icp && <ScorePill score={icp.score} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* Industria */}
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#10B981]" /> Industria objetivo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button key={ind} onClick={() => setIndustria(ind)}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                    industria === ind ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-semibold' : 'border-[#1E293B] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño */}
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tamaño de empresa</label>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map(s => (
                <button key={s.id} onClick={() => setTamaño(s.id)}
                  className={`text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                    tamaño === s.id ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' : 'border-[#1E293B] text-slate-400 hover:border-slate-600'
                  }`}>
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Región */}
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#10B981]" /> Región
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setRegion(r)}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                    region === r ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-semibold' : 'border-[#1E293B] text-slate-400 hover:border-slate-600'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Dolores */}
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Problemáticas clave (seleccioná al menos 1)
            </label>
            <div className="space-y-2">
              {PAINS.map(d => (
                <button key={d} onClick={() => toggleDolor(d)}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                    dolores.includes(d) ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'border-[#1E293B] text-slate-400 hover:border-slate-600'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${dolores.includes(d) ? 'bg-amber-400 border-amber-400' : 'border-slate-600'}`}>
                    {dolores.includes(d) && <CheckCircle2 className="w-3 h-3 text-black" />}
                  </div>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" /> Rango de inversión mensual (ARS)
            </label>
            <select value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full bg-[#080C14] border border-[#1E293B] rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#10B981]/50">
              <option value="0-50000">Menos de $50.000</option>
              <option value="50000-150000">$50.000 – $150.000</option>
              <option value="150000-400000">$150.000 – $400.000</option>
              <option value="400000+">Más de $400.000</option>
            </select>
          </div>

          <button onClick={generarICP} disabled={loading || dolores.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generando perfil…' : 'Generar ICP con IA'}
          </button>
        </div>

        {/* ICP Result */}
        <div>
          {icp ? (
            <div className="space-y-4">
              <div className="bg-[#0D1424] border border-[#10B981]/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-white">Perfil generado</h2>
                  <div className="flex items-center gap-2">
                    <ScorePill score={icp.score} />
                    <button onClick={() => setIcp(null)} className="text-slate-500 hover:text-slate-300">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Industria', value: icp.industria },
                    { label: 'Tamaño', value: SIZES.find(s => s.id === icp.tamaño)?.label || icp.tamaño },
                    { label: 'Región', value: icp.region },
                    { label: 'Budget', value: icp.budget === '0-50000' ? '< $50K/mes' : icp.budget === '50000-150000' ? '$50K–$150K/mes' : icp.budget === '150000-400000' ? '$150K–$400K/mes' : '> $400K/mes' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Dolores identificados
                </h3>
                <div className="space-y-2">
                  {icp.dolores.map(d => (
                    <div key={d} className="flex items-start gap-2 text-xs text-amber-300">
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Señales de compra a buscar
                </h3>
                <div className="space-y-2">
                  {icp.señales.map(s => (
                    <div key={s} className="flex items-start gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0 mt-1.5" /> {s}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4">
                <p className="text-xs text-[#10B981] font-semibold mb-1">✓ ICP activo — Santi SDR y Patagonia Explorer ya priorizan este perfil</p>
                <p className="text-[11px] text-slate-400">El perfil se aplica automáticamente al pipeline de prospección. Podés cambiarlo en cualquier momento.</p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-[#0D1424] border border-[#1E293B] border-dashed rounded-xl p-8">
              <div className="w-14 h-14 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-[#10B981]/50" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-2">Configurá tu ICP</h3>
              <p className="text-xs text-slate-500 max-w-xs">Completá el formulario y la IA generará el perfil de cliente ideal para tu operación en la Patagonia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
