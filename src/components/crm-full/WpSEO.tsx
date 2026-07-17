import React, { useState } from 'react';
import { Search, AlertCircle, Clock, TrendingUp, FileSearch, Tag, BarChart2, CheckCircle2, Zap, Loader2 } from 'lucide-react';

interface PageAudit {
  url: string;
  title: string;
  score: number;
  issues: string[];
  keywords: string[];
}

const SAMPLE_PAGES: PageAudit[] = [
  { url: '/servicios/crm', title: 'CRM para PyMEs | Clientum', score: 78, issues: ['Meta description muy corta (82 chars)', 'H2 sin keyword principal'], keywords: ['crm pyme argentina', 'software crm', 'crm whatsapp'] },
  { url: '/servicios/ecommerce', title: 'E-Commerce WooCommerce | Clientum', score: 62, issues: ['Imagen hero sin atributo alt', 'Tiempo de carga > 3.2s', 'Sin schema markup de producto'], keywords: ['tienda online argentina', 'woocommerce patagonia', 'ecommerce pyme'] },
  { url: '/industrias/ferreteria', title: 'CRM para Ferreterías', score: 91, issues: [], keywords: ['crm ferreteria', 'software ferreteria argentina', 'gestion ferreteria'] },
  { url: '/planes', title: 'Planes y Precios | Clientum', score: 55, issues: ['Falta H1 optimizado', 'Sin preguntas frecuentes (FAQ schema)', 'Densidad keyword muy baja (0.4%)'], keywords: ['crm precio argentina', 'software gestion precio', 'plan crm mensual'] },
];

const KEYWORD_SUGGESTIONS = [
  { kw: 'crm para pymes argentina', vol: 480, dif: 32, intent: 'Comercial' },
  { kw: 'chatbot whatsapp negocio', vol: 1200, dif: 45, intent: 'Informacional' },
  { kw: 'software gestion comercial patagonia', vol: 110, dif: 18, intent: 'Comercial' },
  { kw: 'ecommerce woocommerce argentina', vol: 2400, dif: 58, intent: 'Comercial' },
  { kw: 'facturacion electronica afip integrada', vol: 890, dif: 40, intent: 'Transaccional' },
  { kw: 'automatizar whatsapp empresa', vol: 3100, dif: 52, intent: 'Comercial' },
];

export default function WpSEO() {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [tab, setTab] = useState<'audit' | 'keywords'>('audit');

  const runScan = () => {
    if (!scanUrl.trim()) return;
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanUrl(''); }, 2200);
  };

  const activePage = SAMPLE_PAGES.find(p => p.url === activeUrl);

  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg   = (s: number) => s >= 80 ? 'border-emerald-500/30' : s >= 60 ? 'border-amber-500/30' : 'border-red-500/30';

  return (
    <div className="space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">SEO con IA</h1>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" /> Por configurar
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Análisis y optimización SEO impulsado por IA. Audita páginas, sugiere keywords y genera meta-tags para posicionar en Google.
          </p>
        </div>
      </div>

      {/* Setup notice */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Módulo pendiente de configuración en WordPress</p>
          <p className="text-xs text-slate-400 mt-1">Activá el módulo SEO en el plugin AI Marketing Expert dentro de WordPress Admin → Plugins → AI Marketing Expert → Módulos. Mientras tanto, podés usar la previsualización de auditoría aquí abajo.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Páginas auditadas', value: SAMPLE_PAGES.length, icon: <FileSearch className="w-5 h-5 text-violet-400" />, border: 'border-violet-500/30' },
          { label: 'Score promedio', value: `${Math.round(SAMPLE_PAGES.reduce((a, p) => a + p.score, 0) / SAMPLE_PAGES.length)}`, icon: <BarChart2 className="w-5 h-5 text-amber-400" />, border: 'border-amber-500/30' },
          { label: 'Issues detectados', value: SAMPLE_PAGES.reduce((a, p) => a + p.issues.length, 0), icon: <AlertCircle className="w-5 h-5 text-red-400" />, border: 'border-red-500/30' },
          { label: 'Keywords sugeridas', value: KEYWORD_SUGGESTIONS.length, icon: <Tag className="w-5 h-5 text-emerald-400" />, border: 'border-emerald-500/30' },
        ].map(s => (
          <div key={s.label} className={`bg-[#0A101F]/60 border ${s.border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-2xl font-bold text-white">{s.value}</span></div>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 border-b border-[#1E293B]">
        {(['audit', 'keywords'] as const).map(v => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
              tab === v ? 'border-violet-400 text-violet-300 bg-violet-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {v === 'audit' ? '🔍 Auditoría de páginas' : '🏷️ Keywords sugeridas'}
          </button>
        ))}
      </div>

      {tab === 'audit' && (
        <div className="space-y-4">
          {/* URL scanner */}
          <div className="bg-[#0A101F]/60 border border-[#1E293B] rounded-xl p-5">
            <div className="flex gap-3">
              <input value={scanUrl} onChange={e => setScanUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && runScan()}
                placeholder="https://clientum.com.ar/servicios/crm"
                className="flex-1 bg-[#030712] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40" />
              <button onClick={runScan} disabled={scanning || !scanUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-lg text-sm font-semibold hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {scanning ? 'Auditando...' : 'Auditar'}
              </button>
            </div>
          </div>

          {/* Page list */}
          <div className="space-y-3">
            {SAMPLE_PAGES.map(p => (
              <div key={p.url}
                onClick={() => setActiveUrl(activeUrl === p.url ? null : p.url)}
                className={`bg-[#0A101F]/60 border rounded-xl p-5 cursor-pointer transition-all ${activeUrl === p.url ? 'border-violet-500/40' : 'border-[#1E293B] hover:border-violet-500/20'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{p.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{p.url}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {p.issues.length > 0 && (
                      <span className="text-xs text-red-400 font-semibold">{p.issues.length} issue{p.issues.length > 1 ? 's' : ''}</span>
                    )}
                    <div className={`text-xl font-black ${scoreColor(p.score)}`}>{p.score}</div>
                  </div>
                </div>
                {activeUrl === p.url && (
                  <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-4">
                    {p.issues.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">Issues a corregir</p>
                        <div className="space-y-1.5">
                          {p.issues.map(i => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />{i}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-2">Keywords objetivo</p>
                      <div className="flex flex-wrap gap-2">
                        {p.keywords.map(k => (
                          <span key={k} className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                      <Zap className="w-3.5 h-3.5" /> Generar correcciones con IA
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'keywords' && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-[#1E293B]">
                  <th className="text-left pb-3 font-semibold">Keyword</th>
                  <th className="text-center pb-3 font-semibold">Volumen/mes</th>
                  <th className="text-center pb-3 font-semibold">Dificultad</th>
                  <th className="text-center pb-3 font-semibold">Intención</th>
                  <th className="text-center pb-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {KEYWORD_SUGGESTIONS.map(k => (
                  <tr key={k.kw} className="hover:bg-[#0A101F]/40 transition-colors">
                    <td className="py-3 text-slate-200 font-mono text-xs">{k.kw}</td>
                    <td className="py-3 text-center text-white font-semibold">{k.vol.toLocaleString('es-AR')}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${k.dif < 35 ? 'bg-emerald-400/10 text-emerald-400' : k.dif < 50 ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'}`}>{k.dif}</span>
                    </td>
                    <td className="py-3 text-center text-xs text-slate-400">{k.intent}</td>
                    <td className="py-3 text-center">
                      <button className="text-xs text-violet-400 hover:text-violet-300 font-semibold">Crear contenido</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg text-xs text-violet-300">
            <strong>CRM:</strong> Las keywords estratégicas se pueden usar para el <strong>ICP Builder</strong> de Clientum para afinar el perfil de cliente ideal.
          </div>
        </div>
      )}
    </div>
  );
}
