import React, { useState } from 'react';
import { Share2, Clock, AlertCircle, CheckCircle2, Loader2, Sparkles, Calendar, Hash, Instagram, Linkedin } from 'lucide-react';

type Red = 'instagram' | 'facebook' | 'linkedin';

interface Post {
  id: string;
  red: Red;
  copy: string;
  hashtags: string[];
  status: 'programado' | 'publicado' | 'borrador';
  fecha: string;
}

const RED_CFG: Record<Red, { label: string; color: string; bg: string; border: string; icon: string }> = {
  instagram: { label: 'Instagram',  color: 'text-pink-400',    bg: 'bg-pink-400/10',    border: 'border-pink-500/30',    icon: '📸' },
  facebook:  { label: 'Facebook',   color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-500/30',    icon: '👤' },
  linkedin:  { label: 'LinkedIn',   color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-500/30',     icon: '💼' },
};

const POSTS: Post[] = [
  { id: '1', red: 'instagram', copy: '🎯 ¿Cuántos leads perdés porque no podés responder a tiempo?\n\nEn Clientum automatizamos tu WhatsApp para que NINGUNA consulta quede sin respuesta — ni los domingos, ni a las 11 de la noche.\n\n✅ Bot que responde en segundos\n✅ Califica leads automáticamente\n✅ Te avisa cuando es hora de llamar vos\n\nEste mes 20% OFF en Plan PyME. 👇', hashtags: ['#CRM', '#WhatsApp', '#PyME', '#Patagonia', '#Clientum'], status: 'publicado', fecha: '15 Jul' },
  { id: '2', red: 'linkedin', copy: 'Las PyMEs del interior argentino no tienen tiempo para tecnología compleja. Por eso construimos Clientum.\n\nUn sistema que se implementa en 5 días, en español rioplatense, con soporte humano 24/7. Sin contratos mínimos.\n\nDespués de 10 años digitalizando empresas de la Patagonia, entendemos que la tecnología tiene que trabajar para el negocio — no al revés.', hashtags: ['#Startup', '#PyMEs', '#Tecnología', '#Argentina', '#CRM'], status: 'programado', fecha: '20 Jul 10:00' },
  { id: '3', red: 'facebook', copy: '🌟 Caso de éxito: Terbay Propiedades\n\n"El bot califica los interesados, les envía fotos y planos, y agenda visitas solo. Nosotros entramos a cerrar."\n\n¿Querés que tu empresa también trabaje así? Pedí tu demo gratuita 👉', hashtags: ['#Inmobiliaria', '#Automatización', '#Clientum', '#Patagonia'], status: 'borrador', fecha: '—' },
];

const STATUS_CFG = {
  publicado:  { label: 'Publicado',  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  programado: { label: 'Programado', color: 'text-sky-400',     bg: 'bg-sky-400/10 border-sky-400/30' },
  borrador:   { label: 'Borrador',   color: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/30' },
};

export default function WpRedesSociales() {
  const [selectedRed, setSelectedRed] = useState<Red | 'all'>('all');
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genRed, setGenRed] = useState<Red>('instagram');
  const [genOutput, setGenOutput] = useState('');
  const [view, setView] = useState<'posts' | 'crear'>('posts');

  const filteredPosts = selectedRed === 'all' ? POSTS : POSTS.filter(p => p.red === selectedRed);

  const generatePost = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenOutput(`🚀 ${genTopic}\n\nEn Clientum llevamos más de 10 años ayudando a PyMEs del Alto Valle a digitalizarse sin complicaciones.\n\n✅ Implementación en 5 días\n✅ Soporte en español 24/7\n✅ Sin contrato mínimo\n\n¿Querés ver cómo quedaría para tu negocio? Escribinos y te hacemos una demo gratis 👇\n\n#PyME #Digitalización #Patagonia #Clientum #IA`);
    setGenerating(false);
  };

  return (
    <div className="space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Share2 className="w-7 h-7 text-pink-400" />
            <h1 className="text-2xl font-bold text-white">Redes Sociales</h1>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" /> Por configurar
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Generá y programá posts para Instagram, Facebook y LinkedIn con IA. Reutilizá el contenido del blog automáticamente para cada red.
          </p>
        </div>
      </div>

      {/* Setup notice */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Conectar cuentas de redes sociales</p>
          <p className="text-xs text-slate-400 mt-1">Para programar publicaciones, conectá tus cuentas en WordPress Admin → AI Marketing Expert → Redes Sociales → Conectar cuentas. El generador de copies funciona sin conexión.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        {[
          { label: 'Posts publicados', value: POSTS.filter(p => p.status === 'publicado').length, color: 'border-emerald-500/30', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
          { label: 'Programados', value: POSTS.filter(p => p.status === 'programado').length, color: 'border-sky-500/30', icon: <Calendar className="w-5 h-5 text-sky-400" /> },
          { label: 'Borradores', value: POSTS.filter(p => p.status === 'borrador').length, color: 'border-slate-500/30', icon: <Share2 className="w-5 h-5 text-slate-400" /> },
        ].map(s => (
          <div key={s.label} className={`bg-[#0A101F]/60 border ${s.color} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-2xl font-bold text-white">{s.value}</span></div>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 border-b border-[#1E293B]">
        {(['posts', 'crear'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
              view === v ? 'border-pink-400 text-pink-300 bg-pink-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {v === 'posts' ? '📋 Posts programados' : '✍️ Crear post con IA'}
          </button>
        ))}
      </div>

      {view === 'posts' && (
        <div className="space-y-4">
          {/* Red filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'instagram', 'facebook', 'linkedin'] as const).map(r => (
              <button key={r} onClick={() => setSelectedRed(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedRed === r
                    ? r === 'all' ? 'bg-slate-700 border-slate-500 text-white' : `${RED_CFG[r as Red].bg} ${RED_CFG[r as Red].border} ${RED_CFG[r as Red].color}`
                    : 'bg-transparent border-[#1E293B] text-slate-500 hover:text-slate-300'
                }`}>
                {r === 'all' ? 'Todas las redes' : `${RED_CFG[r as Red].icon} ${RED_CFG[r as Red].label}`}
              </button>
            ))}
          </div>

          {filteredPosts.map(p => {
            const r = RED_CFG[p.red];
            const s = STATUS_CFG[p.status];
            return (
              <div key={p.id} className={`bg-[#0A101F]/60 border ${r.border} rounded-xl p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">{r.icon}</span>
                  <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.color} font-semibold ml-auto`}>{s.label}</span>
                  {p.status === 'programado' && (
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{p.fecha}</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">{p.copy}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.hashtags.map(h => (
                    <span key={h} className={`text-xs px-2 py-0.5 rounded-full ${r.bg} ${r.color} border ${r.border}`}>{h}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'crear' && (
        <div className="bg-[#0A101F]/60 border border-[#1E293B] rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" /> Generador de posts con IA
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Red social</label>
              <div className="flex gap-2">
                {(['instagram', 'facebook', 'linkedin'] as Red[]).map(r => (
                  <button key={r} onClick={() => setGenRed(r)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      genRed === r ? `${RED_CFG[r].bg} ${RED_CFG[r].border} ${RED_CFG[r].color}` : 'bg-transparent border-[#1E293B] text-slate-500'
                    }`}>
                    {RED_CFG[r].icon} {RED_CFG[r].label.slice(0, 5)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Tema del post</label>
              <input value={genTopic} onChange={e => setGenTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generatePost()}
                placeholder="Ej: Demo gratuita de CRM para ferreterías"
                className="w-full bg-[#030712] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/40" />
            </div>
          </div>
          <button onClick={generatePost} disabled={generating || !genTopic.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-lg text-sm font-semibold hover:bg-pink-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generando...' : 'Generar post'}
          </button>
          {genOutput && (
            <div className="space-y-2">
              <p className="text-xs text-pink-400 uppercase tracking-wider font-semibold">Post generado</p>
              <textarea readOnly value={genOutput} rows={10}
                className="w-full bg-[#030712] border border-pink-500/20 rounded-lg px-4 py-3 text-xs text-slate-300 leading-relaxed resize-none focus:outline-none" />
              <div className="flex gap-3">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-lg text-xs font-semibold hover:bg-sky-500/20 transition-all">
                  <Calendar className="w-3.5 h-3.5" /> Programar
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0A101F] border border-[#1E293B] text-slate-400 rounded-lg text-xs font-semibold hover:text-slate-200 transition-all">
                  Guardar como borrador
                </button>
              </div>
            </div>
          )}
          <div className="p-3 bg-pink-500/5 border border-pink-500/20 rounded-lg text-xs text-pink-300">
            <strong>CRM:</strong> Los posts sobre servicios se pueden coordinar con las campañas de <strong>Outreach del CRM</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
