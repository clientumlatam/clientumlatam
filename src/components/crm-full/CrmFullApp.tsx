import React, { useState, useEffect } from 'react';
import {
  Target, Mountain, MessagesSquare, Award, Megaphone, Zap, Activity,
  MessageSquare, Bot, Package, Users, Building2,
  FileText, PenTool, Settings2, Sparkles,
  Globe, Plug, Blocks,
  UserPlus, LogOut, Download, ChevronRight, Network,
  LayoutDashboard,
} from 'lucide-react';

// Existing components
import CrmFullPipeline    from './CrmFullPipeline';
import CrmFullProducts    from './CrmFullProducts';
import CrmFullSellers     from './CrmFullSellers';
import CrmFullBranches    from './CrmFullBranches';
import CrmFullConversations from './CrmFullConversations';
import CrmFullBotConfig   from './CrmFullBotConfig';
import CrmFullConfig      from './CrmFullConfig';
import CrmFullLeads       from './CrmFullLeads';
import CrmFullGoogleMaps  from './CrmFullGoogleMaps';
import WpContenido        from './WpContenido';
import OrquestadorIA      from '../OrquestadorIA';

// WordPress components
import WpModulos  from '../wordpress/WpModulos';
import WpSetup    from '../wordpress/WpSetup';

// New components
import IcpBuilder        from './IcpBuilder';
import MeddicCalificacion from './MeddicCalificacion';
import OutreachCampaigns  from './OutreachCampaigns';
import CreacionRapidaCRM  from './CreacionRapidaCRM';
import ActividadCRM       from './ActividadCRM';
import BrochureCRM        from './BrochureCRM';
import CopiloIAPanel      from './CopiloIAPanel';

import { Conversation, Seller, Branch, Product } from './crmTypes';
import { initialConversations, initialSellers, initialBranches, initialProducts } from './crmInitialData';

// ─── Types ────────────────────────────────────────────────────────────────────
type SubTab =
  | 'icp'      | 'maps'                                       // PROSPECCIÓN
  | 'crm'      | 'meddic'   | 'outreach' | 'rapida' | 'actividad' // PIPELINE
  | 'conversations' | 'bot'                                   // COMUNICACIÓN
  | 'products' | 'sellers'  | 'branches'                     // CATÁLOGO
  | 'brochure' | 'contenido' | 'config'  | 'copiloto'        // BROCHURE
  | 'wp_leads' | 'wp_config' | 'wp_modulos'                  // WORDPRESS
  | 'orquestador';                                            // ORQUESTADOR

// ─── Nav definition ──────────────────────────────────────────────────────────
interface NavItem { id: SubTab; label: string; icon: React.ReactNode; desc?: string; }
interface NavGroup { id: string; label: string; icon: React.ReactNode; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'prospeccion', label: 'Prospección', icon: <Target className="w-3 h-3" />,
    items: [
      { id: 'icp',  label: 'ICP Builder',        icon: <Target className="w-4 h-4" />,   desc: 'Definí tu cliente ideal' },
      { id: 'maps', label: 'Patagonia Explorer',  icon: <Mountain className="w-4 h-4" />, desc: 'Buscá y califica leads reales' },
    ],
  },
  {
    id: 'pipeline', label: 'Pipeline de Ventas', icon: <MessagesSquare className="w-3 h-3" />,
    items: [
      { id: 'crm',      label: 'CRM Pipeline',        icon: <MessagesSquare className="w-4 h-4" /> },
      { id: 'meddic',   label: 'Calificación MEDDIC', icon: <Award className="w-4 h-4" />,         desc: 'Audita el potencial de cada lead' },
      { id: 'outreach', label: 'Outreach Campaigns',  icon: <Megaphone className="w-4 h-4" />,     desc: 'Generá campañas de contacto' },
      { id: 'rapida',   label: 'Creación Rápida',     icon: <Zap className="w-4 h-4" /> },
      { id: 'actividad',label: 'Actividad',           icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    id: 'comunicacion', label: 'Comunicación', icon: <MessageSquare className="w-3 h-3" />,
    items: [
      { id: 'conversations', label: 'Conversaciones', icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'bot',           label: 'Bot',            icon: <Bot className="w-4 h-4" /> },
    ],
  },
  {
    id: 'catalogo', label: 'Catálogo & Equipo', icon: <Package className="w-3 h-3" />,
    items: [
      { id: 'products', label: 'Productos',   icon: <Package className="w-4 h-4" /> },
      { id: 'sellers',  label: 'Vendedores',  icon: <Users className="w-4 h-4" /> },
      { id: 'branches', label: 'Sucursales',  icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'brochure', label: 'Brochure & Contenido', icon: <FileText className="w-3 h-3" />,
    items: [
      { id: 'brochure',  label: 'Brochure',     icon: <FileText className="w-4 h-4" /> },
      { id: 'contenido', label: 'Contenido',    icon: <PenTool className="w-4 h-4" /> },
      { id: 'config',    label: 'Configuración',icon: <Settings2 className="w-4 h-4" /> },
      { id: 'copiloto',  label: 'Copiloto IA',  icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    id: 'wordpress', label: 'WordPress', icon: <Globe className="w-3 h-3" />,
    items: [
      { id: 'wp_leads',   label: 'Leads del Chatbot', icon: <UserPlus className="w-4 h-4" />, desc: 'Leads capturados por el plugin' },
      { id: 'wp_config',  label: 'Configuración',     icon: <Plug className="w-4 h-4" />,     desc: 'Instalación y setup del plugin' },
      { id: 'wp_modulos', label: 'Módulos del Plugin',icon: <Blocks className="w-4 h-4" />,   desc: 'AI Marketing Expert v2' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadOrDefault<T>(key: string, def: T): T {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s) as T; } catch {}
  return def;
}

function getBreadcrumb(tab: SubTab): { group: string; item: string } {
  for (const g of NAV_GROUPS) {
    const found = g.items.find(i => i.id === tab);
    if (found) return { group: g.label.toUpperCase(), item: found.label.toUpperCase() };
  }
  if (tab === 'orquestador') return { group: 'ORQUESTADOR IA', item: 'ORQUESTADOR IA' };
  return { group: '', item: '' };
}

// ─── Component ───────────────────────────────────────────────────────────────
interface CrmFullAppProps {
  activeTabOverride?: SubTab;
  hideNav?: boolean;
}

export default function CrmFullApp({ activeTabOverride, hideNav = false }: CrmFullAppProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState<SubTab>('icp');
  const activeTab = activeTabOverride ?? internalActiveTab;
  const setActiveTab = (t: SubTab) => { setInternalActiveTab(t); };

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadOrDefault('clientum_crmfull_conversations', initialConversations));
  const [sellers, setSellers] = useState<Seller[]>(() => {
    const s = loadOrDefault('clientum_crmfull_sellers', initialSellers);
    return s.length > 0 ? s : initialSellers;
  });
  const [branches, setBranches] = useState<Branch[]>(() => {
    const s = loadOrDefault('clientum_crmfull_branches', initialBranches);
    return s.length > 0 ? s : initialBranches;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const s = loadOrDefault('clientum_crmfull_products', initialProducts);
    return s.length > 0 ? s : initialProducts;
  });

  useEffect(() => { localStorage.setItem('clientum_crmfull_conversations', JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_sellers',       JSON.stringify(sellers));       }, [sellers]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_branches',      JSON.stringify(branches));      }, [branches]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_products',      JSON.stringify(products));      }, [products]);

  const handleUpdateConversation = (id: string, data: Partial<Conversation>) =>
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const handleSaveSeller  = (s: Seller)  => setSellers(prev => { const e = prev.find(x => x.id === s.id); return e ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]; });
  const handleSaveBranch  = (b: Branch)  => setBranches(prev => { const e = prev.find(x => x.id === b.id); return e ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]; });
  const handleSaveProduct = (p: Product) => setProducts(prev => { const e = prev.find(x => x.id === p.id); return e ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]; });

  const renderContent = () => {
    switch (activeTab) {
      case 'icp':           return <IcpBuilder />;
      case 'maps':          return <CrmFullGoogleMaps />;
      case 'crm':           return <CrmFullPipeline conversations={conversations} sellers={sellers} onUpdateConversation={handleUpdateConversation} />;
      case 'meddic':        return <MeddicCalificacion />;
      case 'outreach':      return <OutreachCampaigns />;
      case 'rapida':        return <CreacionRapidaCRM />;
      case 'actividad':     return <ActividadCRM />;
      case 'conversations': return <CrmFullConversations conversations={conversations} />;
      case 'bot':           return <CrmFullBotConfig />;
      case 'products':      return <CrmFullProducts products={products} onSave={handleSaveProduct} />;
      case 'sellers':       return <CrmFullSellers sellers={sellers} onSave={handleSaveSeller} />;
      case 'branches':      return <CrmFullBranches branches={branches} onSave={handleSaveBranch} />;
      case 'brochure':      return <BrochureCRM />;
      case 'contenido':     return <WpContenido />;
      case 'config':        return <CrmFullConfig />;
      case 'copiloto':      return <CopiloIAPanel />;
      case 'wp_leads':      return <CrmFullLeads />;
      case 'wp_config':     return <WpSetup />;
      case 'wp_modulos':    return <WpModulos />;
      case 'orquestador':   return <OrquestadorIA />;
      default:              return null;
    }
  };

  const bc = getBreadcrumb(activeTab);

  // ─── Full-screen layout with sidebar ─────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#080C14] font-sans">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      {!hideNav && (
        <aside className="w-[210px] flex-shrink-0 bg-[#0A0E1A] border-r border-[#1A2332] flex flex-col overflow-hidden">

          {/* Brand */}
          <div className="px-4 pt-4 pb-3 border-b border-[#1A2332] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#10B981] rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black text-white uppercase tracking-tight leading-tight">AI Client</div>
                <div className="text-[11px] font-black text-[#10B981] uppercase tracking-tight leading-tight">Prospector</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[9px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded font-bold tracking-wider">v2.x PRO</span>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
            {NAV_GROUPS.map(group => (
              <div key={group.id} className="mb-1">
                {/* Group header */}
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                    <span className="text-slate-600">{group.icon}</span>
                    {group.label}
                  </span>
                </div>

                {/* Items */}
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-all duration-150 border-l-2 ${
                        isActive
                          ? 'bg-[#10B981]/10 border-l-[#10B981] text-[#10B981]'
                          : 'border-l-transparent text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className={`flex-shrink-0 mt-0.5 transition-colors ${isActive ? 'text-[#10B981]' : 'text-slate-600'}`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[12px] font-semibold leading-tight ${isActive ? 'text-[#10B981]' : ''}`}>{item.label}</div>
                        {item.desc && (
                          <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-[#10B981]/70' : 'text-slate-600'}`}>{item.desc}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Spacer */}
            <div className="h-2" />
          </nav>

          {/* Orquestador IA — pinned at bottom */}
          <div className="border-t border-[#1A2332] p-2 flex-shrink-0">
            <div className="px-1 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Orquestador IA</span>
            </div>
            <button
              onClick={() => setActiveTab('orquestador')}
              className={`w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl transition-all border ${
                activeTab === 'orquestador'
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                  : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base transition-all ${
                activeTab === 'orquestador' ? 'bg-[#10B981]/20' : 'bg-[#1A2332]'
              }`}>
                🤖
              </div>
              <div className="min-w-0 text-left">
                <div className="text-[12px] font-semibold leading-tight">Orquestador IA</div>
                <div className={`text-[10px] leading-tight mt-0.5 ${activeTab === 'orquestador' ? 'text-[#10B981]/70' : 'text-slate-600'}`}>
                  Chat con el staff de agentes
                </div>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        {!hideNav && (
          <header className="flex-shrink-0 h-11 bg-[#080C14] border-b border-[#1A2332] flex items-center px-4 gap-3">
            {/* Breadcrumb */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              {bc.group && bc.group !== bc.item && (
                <>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{bc.group}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0" />
                </>
              )}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap truncate">{bc.item}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setActiveTab('orquestador')}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-[#10B981] border border-[#1A2332] hover:border-[#10B981]/30 px-2.5 py-1.5 rounded-lg transition-all">
                <Bot className="w-3 h-3" /> Asistente IA
              </button>
              <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 border border-[#1A2332] px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                <Download className="w-3 h-3" /> Exportar CSV
              </button>
              <div className="w-px h-5 bg-[#1A2332]" />
              <button
                onClick={() => { window.location.href = '/'; }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500/60 hover:text-rose-400 border border-[#1A2332] hover:border-rose-500/20 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/5 transition-all">
                <LogOut className="w-3 h-3" /> Cerrar sesión
              </button>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`mx-auto px-5 py-6 ${activeTab === 'orquestador' ? 'h-full max-w-5xl' : 'max-w-[1400px]'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
