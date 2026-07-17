import React, { useState, useEffect } from 'react';
import {
  Target, Mountain, MessagesSquare, Award, Megaphone, Zap, Activity,
  MessageSquare, Bot, Package, Users, Building2,
  FileText, PenTool, Settings2, Sparkles,
  Globe, Plug, Blocks, UserPlus, LogOut, Download,
  ChevronRight, LayoutDashboard, Network, Cpu,
} from 'lucide-react';

import CrmFullPipeline      from './CrmFullPipeline';
import CrmFullProducts      from './CrmFullProducts';
import CrmFullSellers       from './CrmFullSellers';
import CrmFullBranches      from './CrmFullBranches';
import CrmFullConversations from './CrmFullConversations';
import CrmFullBotConfig     from './CrmFullBotConfig';
import CrmFullConfig        from './CrmFullConfig';
import CrmFullLeads         from './CrmFullLeads';
import CrmFullGoogleMaps    from './CrmFullGoogleMaps';
import WpContenido          from './WpContenido';
import OrquestadorIA        from '../OrquestadorIA';
import WpModulos            from '../wordpress/WpModulos';
import WpSetup              from '../wordpress/WpSetup';
import IcpBuilder           from './IcpBuilder';
import MeddicCalificacion   from './MeddicCalificacion';
import OutreachCampaigns    from './OutreachCampaigns';
import CreacionRapidaCRM    from './CreacionRapidaCRM';
import ActividadCRM         from './ActividadCRM';
import BrochureCRM          from './BrochureCRM';
import CopiloIAPanel        from './CopiloIAPanel';
import Propuestas           from './Propuestas';

import { Conversation, Seller, Branch, Product } from './crmTypes';
import { initialConversations, initialSellers, initialBranches, initialProducts } from './crmInitialData';

// ─── Types ─────────────────────────────────────────────────────────────────
type SubTab =
  | 'icp'      | 'maps'
  | 'crm'      | 'meddic'   | 'propuestas'
  | 'outreach' | 'rapida'   | 'actividad'
  | 'conversations' | 'bot'
  | 'brochure' | 'contenido' | 'copiloto'
  | 'products' | 'sellers'  | 'branches' | 'config'
  | 'wp_leads' | 'wp_config' | 'wp_modulos'
  | 'orquestador';

type SectionId = 'prospectar' | 'pipeline' | 'outreach' | 'comunicacion' | 'contenido' | 'sistema' | 'agente';

interface NavItem { id: SubTab; label: string; icon: React.ReactNode; desc?: string; }
interface Section { id: SectionId; label: string; icon: React.ReactNode; items: NavItem[]; }

// ─── Navigation structure ──────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: 'prospectar', label: 'Prospectar', icon: <Target className="w-4 h-4" />,
    items: [
      { id: 'icp',  label: 'ICP Builder',       icon: <Target className="w-4 h-4" />,   desc: 'Definí tu cliente ideal con IA' },
      { id: 'maps', label: 'Patagonia Explorer', icon: <Mountain className="w-4 h-4" />, desc: 'Buscá y calificá leads reales' },
    ],
  },
  {
    id: 'pipeline', label: 'Pipeline', icon: <MessagesSquare className="w-4 h-4" />,
    items: [
      { id: 'crm',       label: 'CRM Pipeline',        icon: <MessagesSquare className="w-4 h-4" />, desc: 'Gestión de oportunidades' },
      { id: 'meddic',    label: 'Calificación MEDDIC', icon: <Award className="w-4 h-4" />,          desc: 'Score y auditoría de leads' },
      { id: 'propuestas',label: 'Propuestas',           icon: <FileText className="w-4 h-4" />,       desc: 'Propuestas comerciales por empresa' },
    ],
  },
  {
    id: 'outreach', label: 'Outreach', icon: <Megaphone className="w-4 h-4" />,
    items: [
      { id: 'outreach', label: 'Campañas',       icon: <Megaphone className="w-4 h-4" />, desc: 'Campañas de contacto automatizadas' },
      { id: 'rapida',   label: 'Creación Rápida',icon: <Zap className="w-4 h-4" />,       desc: 'Acción rápida sobre leads' },
      { id: 'actividad',label: 'Actividad',      icon: <Activity className="w-4 h-4" />,  desc: 'Feed en tiempo real del sistema' },
    ],
  },
  {
    id: 'comunicacion', label: 'Comunicación', icon: <MessageSquare className="w-4 h-4" />,
    items: [
      { id: 'conversations', label: 'Conversaciones', icon: <MessageSquare className="w-4 h-4" />, desc: 'Historial de chats y mensajes' },
      { id: 'bot',           label: 'Bot IA',          icon: <Bot className="w-4 h-4" />,           desc: 'Configuración del chatbot' },
    ],
  },
  {
    id: 'contenido', label: 'Contenido', icon: <PenTool className="w-4 h-4" />,
    items: [
      { id: 'brochure',  label: 'Brochure',    icon: <FileText className="w-4 h-4" />,  desc: 'Generador de brochures con IA' },
      { id: 'contenido', label: 'Blog / Web',  icon: <PenTool className="w-4 h-4" />,   desc: 'Artículos y contenido WordPress' },
      { id: 'copiloto',  label: 'Copiloto IA', icon: <Sparkles className="w-4 h-4" />,  desc: 'Asistente de redacción y copy' },
    ],
  },
  {
    id: 'sistema', label: 'Sistema', icon: <Settings2 className="w-4 h-4" />,
    items: [
      { id: 'products',   label: 'Productos',        icon: <Package className="w-4 h-4" />,   desc: 'Catálogo de productos y servicios' },
      { id: 'sellers',    label: 'Vendedores',        icon: <Users className="w-4 h-4" />,     desc: 'Equipo comercial y roles' },
      { id: 'branches',   label: 'Sucursales',        icon: <Building2 className="w-4 h-4" />, desc: 'Puntos de venta y ubicaciones' },
      { id: 'config',     label: 'Configuración',     icon: <Settings2 className="w-4 h-4" />, desc: 'Ajustes generales del CRM' },
      { id: 'wp_leads',   label: 'Leads WordPress',   icon: <UserPlus className="w-4 h-4" />,  desc: 'Leads capturados por el plugin' },
      { id: 'wp_config',  label: 'Plugin Setup',      icon: <Plug className="w-4 h-4" />,      desc: 'Instalación y webhooks' },
      { id: 'wp_modulos', label: 'Módulos del Plugin',icon: <Blocks className="w-4 h-4" />,    desc: 'AI Marketing Expert v2' },
    ],
  },
];

const AGENTE_SECTION: Section = {
  id: 'agente', label: 'Agente OS', icon: <Cpu className="w-4 h-4" />,
  items: [{ id: 'orquestador', label: 'Orquestador IA', icon: <Cpu className="w-4 h-4" />, desc: 'Chat con el staff de agentes IA' }],
};

function getSectionForTab(tab: SubTab): SectionId {
  for (const s of SECTIONS) {
    if (s.items.some(i => i.id === tab)) return s.id;
  }
  return 'agente';
}

// ─── State helpers ─────────────────────────────────────────────────────────
function loadOrDefault<T>(key: string, def: T): T {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s) as T; } catch {}
  return def;
}

// ─── Component ─────────────────────────────────────────────────────────────
interface CrmFullAppProps {
  activeTabOverride?: SubTab;
  hideNav?: boolean;
}

export default function CrmFullApp({ activeTabOverride, hideNav = false }: CrmFullAppProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState<SubTab>('icp');
  const activeTab = activeTabOverride ?? internalActiveTab;

  const [activeSection, setActiveSection] = useState<SectionId>(
    getSectionForTab(activeTabOverride ?? 'icp')
  );

  const setActiveTab = (t: SubTab) => {
    setInternalActiveTab(t);
    setActiveSection(getSectionForTab(t));
  };

  const handleSectionClick = (section: Section) => {
    setActiveSection(section.id);
    setActiveTab(section.items[0].id);
  };

  // Data state
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
  const handleSaveSeller  = (s: Seller)  => setSellers(prev =>  { const e = prev.find(x => x.id === s.id); return e ? prev.map(x => x.id === s.id ? s : x)  : [...prev, s];  });
  const handleSaveBranch  = (b: Branch)  => setBranches(prev => { const e = prev.find(x => x.id === b.id); return e ? prev.map(x => x.id === b.id ? b : x)  : [...prev, b];  });
  const handleSaveProduct = (p: Product) => setProducts(prev =>  { const e = prev.find(x => x.id === p.id); return e ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]; });

  const renderContent = () => {
    switch (activeTab) {
      case 'icp':           return <IcpBuilder />;
      case 'maps':          return <CrmFullGoogleMaps />;
      case 'crm':           return <CrmFullPipeline conversations={conversations} sellers={sellers} onUpdateConversation={handleUpdateConversation} />;
      case 'meddic':        return <MeddicCalificacion />;
      case 'outreach':      return <OutreachCampaigns />;
      case 'propuestas':    return <Propuestas />;
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

  // Current section object
  const allSections = [...SECTIONS, AGENTE_SECTION];
  const currentSection = allSections.find(s => s.id === activeSection) ?? SECTIONS[0];
  const currentItem = currentSection.items.find(i => i.id === activeTab) ?? currentSection.items[0];

  if (hideNav) {
    return (
      <div className="h-screen overflow-y-auto bg-[#060b14]">
        <div className={`mx-auto px-5 py-6 ${activeTab === 'orquestador' ? 'h-full max-w-5xl' : 'max-w-[1400px]'}`}>
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#060b14] font-sans">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-12 bg-[#08111e] border-b border-[#1A3461]/50 flex items-center gap-0 px-0 z-20">

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-full border-r border-[#1A3461]/40 flex-shrink-0 min-w-[200px]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#1A3461,#254f8f)' }}>
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-black text-white uppercase tracking-tight leading-none">Clientum</div>
            <div className="text-[10px] font-semibold text-[#10B981] leading-none mt-0.5">AI Sales OS</div>
          </div>
          <span className="ml-1 text-[8px] bg-[#1A3461]/80 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded font-bold tracking-wider flex-shrink-0">PRO</span>
        </div>

        {/* Main section tabs */}
        <nav className="flex-1 flex items-center h-full overflow-x-auto scrollbar-none px-2">
          {SECTIONS.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                className={`relative flex items-center gap-1.5 px-3.5 h-full text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-[#1A3461]/10'
                }`}
              >
                <span className={isActive ? 'text-[#10B981]' : ''}>{section.icon}</span>
                {section.label}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-t-full" />
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="w-px h-5 bg-[#1A3461]/40 mx-1 flex-shrink-0" />

          {/* Agente OS tab (special) */}
          <button
            onClick={() => { setActiveSection('agente'); setActiveTab('orquestador'); }}
            className={`relative flex items-center gap-1.5 px-3.5 h-full text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeSection === 'agente'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#1A3461]/10'
            }`}
          >
            <span className={`text-base ${activeSection === 'agente' ? '' : 'opacity-60'}`}>🤖</span>
            Agente OS
            {activeSection === 'agente' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-t-full" />
            )}
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 px-3 flex-shrink-0 h-full border-l border-[#1A3461]/40">
          <button
            onClick={() => { setActiveSection('agente'); setActiveTab('orquestador'); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-[#10B981] border border-[#1A3461]/50 hover:border-[#10B981]/40 px-2.5 py-1.5 rounded-lg transition-all hover:bg-[#10B981]/5"
          >
            <Bot className="w-3 h-3" /> Asistente IA
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 border border-[#1A3461]/50 px-2.5 py-1.5 rounded-lg hover:bg-[#1A3461]/20 transition-all">
            <Download className="w-3 h-3" /> Exportar CSV
          </button>
          <div className="w-px h-5 bg-[#1A3461]/40" />
          <button
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/5 transition-all"
          >
            <LogOut className="w-3 h-3" /> Salir
          </button>
        </div>
      </header>

      {/* ── BODY (sidebar + content) ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────── */}
        <aside className="w-[200px] flex-shrink-0 bg-[#07101b] border-r border-[#1A3461]/40 flex flex-col overflow-hidden">

          {/* Section header */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#10B981]">{currentSection.icon}</span>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">
                {currentSection.label}
              </span>
            </div>
            <div className="mt-1.5 h-px bg-gradient-to-r from-[#1A3461]/60 to-transparent" />
          </div>

          {/* Sub-items */}
          <nav className="flex-1 overflow-y-auto py-1 scrollbar-none">
            {currentSection.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all duration-150 border-l-2 ${
                    isActive
                      ? 'bg-[#1A3461]/40 border-l-[#10B981] text-[#10B981]'
                      : 'border-l-transparent text-slate-500 hover:text-slate-200 hover:bg-[#1A3461]/20'
                  }`}
                >
                  <span className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-[#10B981]' : 'text-slate-600'}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[12px] font-semibold leading-tight ${isActive ? 'text-[#10B981]' : ''}`}>
                      {item.label}
                    </div>
                    {item.desc && (
                      <div className={`text-[10px] leading-snug mt-0.5 ${isActive ? 'text-[#10B981]/60' : 'text-slate-600'}`}>
                        {item.desc}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom: current item breadcrumb */}
          <div className="border-t border-[#1A3461]/40 px-3 py-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="text-[#1A3461]">{currentSection.icon}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-400 font-medium truncate">{currentItem.label}</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#060b14]">
          <div className={`mx-auto px-5 py-6 ${activeTab === 'orquestador' ? 'h-full max-w-5xl' : 'max-w-[1400px]'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
