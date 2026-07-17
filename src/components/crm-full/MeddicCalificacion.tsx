import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Circle, BarChart3, Zap } from 'lucide-react';

interface MeddicScore {
  metrics: number; economicBuyer: number; decisionCriteria: number;
  decisionProcess: number; identifyPain: number; champion: number;
}

interface Lead {
  id: string; name: string; empresa: string; industria: string;
  score: MeddicScore; stage: string;
}

const MEDDIC_DIMS = [
  { key: 'metrics',          label: 'Metrics',          desc: '¿Tienen métricas claras del problema que quieren resolver?', emoji: '📊' },
  { key: 'economicBuyer',    label: 'Economic Buyer',   desc: '¿Tenemos acceso al decisor económico real?',               emoji: '💼' },
  { key: 'decisionCriteria', label: 'Decision Criteria',desc: '¿Entendemos sus criterios de decisión de compra?',          emoji: '📋' },
  { key: 'decisionProcess',  label: 'Decision Process', desc: '¿Conocemos el proceso y timeline de decisión?',            emoji: '🔄' },
  { key: 'identifyPain',     label: 'Identify Pain',    desc: '¿Identificamos y cuantificamos el dolor concreto?',         emoji: '⚠️' },
  { key: 'champion',         label: 'Champion',         desc: '¿Hay alguien interno que nos defiende en la empresa?',      emoji: '🏆' },
] as const;

const SAMPLE_LEADS: Lead[] = [
  { id: '1', name: 'Juan Pereyra', empresa: 'Distribuidora Andina SA', industria: 'Distribuidora', stage: 'Propuesta', score: { metrics: 3, economicBuyer: 2, decisionCriteria: 3, decisionProcess: 2, identifyPain: 4, champion: 2 } },
  { id: '2', name: 'Marta Leal', empresa: 'Clínica del Sur', industria: 'Salud', stage: 'Demo', score: { metrics: 2, economicBuyer: 3, decisionCriteria: 1, decisionProcess: 1, identifyPain: 3, champion: 1 } },
  { id: '3', name: 'Carlos Vega', empresa: 'Ferretería Centro SRL', industria: 'Ferretería', stage: 'Negociación', score: { metrics: 4, economicBuyer: 4, decisionCriteria: 4, decisionProcess: 3, identifyPain: 5, champion: 3 } },
];

function totalScore(s: MeddicScore) {
  return Object.values(s).reduce((a, b) => a + b, 0);
}

function qualLabel(total: number) {
  if (total >= 24) return { label: 'Calificado', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' };
  if (total >= 15) return { label: 'En proceso', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' };
  return { label: 'No calificado', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30' };
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i <= value ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`} />
      ))}
      <span className="text-xs text-slate-400 ml-1">{value}/5</span>
    </div>
  );
}

export default function MeddicCalificacion() {
  const [leads, setLeads] = useState<Lead[]>(SAMPLE_LEADS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftScore, setDraftScore] = useState<MeddicScore | null>(null);

  const startEdit = (lead: Lead) => {
    setEditing(lead.id);
    setExpanded(lead.id);
    setDraftScore({ ...lead.score });
  };

  const saveEdit = (id: string) => {
    if (!draftScore) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, score: draftScore } : l));
    setEditing(null);
    setDraftScore(null);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 bg-amber-400/15 border border-amber-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Calificación MEDDIC</h1>
          <p className="text-slate-400 text-sm mt-1">
            Audita el potencial de cierre de cada lead con el framework MEDDIC. Score 0–30: mayor score = mayor probabilidad de cierre.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Calificados', count: leads.filter(l => totalScore(l.score) >= 24).length, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'En proceso', count: leads.filter(l => { const t = totalScore(l.score); return t >= 15 && t < 24; }).length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Sin calificar', count: leads.filter(l => totalScore(l.score) < 15).length, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#1E293B] rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leads list */}
      <div className="space-y-3">
        {leads.map(lead => {
          const total = totalScore(lead.score);
          const { label, color, bg } = qualLabel(total);
          const isExpanded = expanded === lead.id;
          const isEditing = editing === lead.id;

          return (
            <div key={lead.id} className="bg-[#0D1424] border border-[#1E293B] rounded-xl overflow-hidden">
              {/* Lead header */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-white text-sm">{lead.name}</h3>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{lead.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 bg-[#1E293B] px-2 py-0.5 rounded">{lead.industria}</span>
                    <span className="text-[11px] text-slate-500 bg-[#1E293B] px-2 py-0.5 rounded">{lead.stage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-black text-white">{total}<span className="text-slate-500 text-sm">/30</span></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bg} ${color}`}>{label}</span>
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : lead.id)}
                    className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-all">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded MEDDIC detail */}
              {isExpanded && (
                <div className="border-t border-[#1E293B] p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MEDDIC_DIMS.map(dim => {
                      const val = isEditing && draftScore ? draftScore[dim.key] : lead.score[dim.key];
                      return (
                        <div key={dim.key} className="bg-[#080C14] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">{dim.emoji}</span>
                            <span className="text-xs font-bold text-slate-300">{dim.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{dim.desc}</p>
                          {isEditing && draftScore ? (
                            <div className="flex items-center gap-1.5">
                              {[1,2,3,4,5].map(i => (
                                <button key={i} onClick={() => setDraftScore(prev => prev ? { ...prev, [dim.key]: i } : null)}
                                  className={`h-6 w-8 rounded transition-all text-xs font-bold ${i <= draftScore[dim.key] ? 'bg-[#10B981] text-white' : 'bg-[#1E293B] text-slate-500 hover:bg-slate-700'}`}>
                                  {i}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <ScoreBar value={val} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-end">
                    {isEditing ? (
                      <>
                        <button onClick={() => { setEditing(null); setDraftScore(null); }}
                          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-[#1E293B] rounded-lg transition-all">
                          Cancelar
                        </button>
                        <button onClick={() => saveEdit(lead.id)}
                          className="px-4 py-2 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white rounded-lg transition-all flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Guardar puntuación
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(lead)}
                        className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-[#1E293B] hover:border-slate-500 rounded-lg transition-all flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5" /> Actualizar puntuación
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">MEDDIC en acción:</strong> Santi SDR usa estos scores para priorizar el orden de contacto. Leads con score &gt; 20 reciben seguimiento diario automático. Con score &lt; 10, el sistema los marca para nutrición de largo plazo.
        </p>
      </div>
    </div>
  );
}
