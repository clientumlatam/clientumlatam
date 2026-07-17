import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Package, Building2, MessageSquare, MessagesSquare, Bot, Database, Blocks, UserPlus, MapPin, MessageCircle, Settings2, Cpu, Network, Globe, FileText, Mail, Search, Share2, Target } from 'lucide-react';
import CrmFullDashboard from './CrmFullDashboard';
import CrmFullPipeline from './CrmFullPipeline';
import CrmFullProducts from './CrmFullProducts';
import CrmFullSellers from './CrmFullSellers';
import CrmFullBranches from './CrmFullBranches';
import CrmFullConversations from './CrmFullConversations';
import CrmFullBotConfig from './CrmFullBotConfig';
import CrmFullCMDB from './CrmFullCMDB';
import CrmFullUseCases from './CrmFullUseCases';
import CrmFullLeads from './CrmFullLeads';
import CrmFullAgentes from './CrmFullAgentes';
import CrmFullGoogleMaps from './CrmFullGoogleMaps';
import CrmFullWhatsApp from './CrmFullWhatsApp';
import CrmFullConfig from './CrmFullConfig';
import OrganigramaClientum from '../OrganigramaClientum';
import OrgVariantRadial from '../OrgVariantRadial';
import OrgVariantLanes from '../OrgVariantLanes';
import OrgVariantPipeline from '../OrgVariantPipeline';
import OrgVariantRoster from '../OrgVariantRoster';
import WpChatbotIA from './WpChatbotIA';
import WpContenido from './WpContenido';
import WpEmailMarketing from './WpEmailMarketing';
import WpSEO from './WpSEO';
import WpRedesSociales from './WpRedesSociales';
import WpProspector from './WpProspector';
import { Conversation, Seller, Branch, Product } from './crmTypes';
import {
  initialConversations,
  initialSellers,
  initialBranches,
  initialProducts,
} from './crmInitialData';

type SubTab =
  | 'dashboard' | 'crm' | 'products' | 'usecases' | 'sellers' | 'branches'
  | 'conversations' | 'leads' | 'bot' | 'cmdb' | 'agentes' | 'maps'
  | 'whatsapp' | 'config' | 'organigrama'
  | 'org_radial' | 'org_lanes' | 'org_pipeline' | 'org_roster'
  | 'wp_chatbot' | 'wp_contenido' | 'wp_email' | 'wp_seo' | 'wp_social' | 'wp_prospector';

// Tabs grouped by section — the nav renders a divider between groups
const TAB_GROUPS: { label: string; color: string; tabs: { id: SubTab; label: string; icon: React.ReactNode }[] }[] = [
  {
    label: 'CRM',
    color: 'text-sky-400',
    tabs: [
      { id: 'dashboard',     label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'crm',          label: 'CRM',             icon: <MessagesSquare className="w-4 h-4" /> },
      { id: 'leads',        label: 'Leads',            icon: <UserPlus className="w-4 h-4" /> },
      { id: 'maps',         label: 'Maps IA',          icon: <MapPin className="w-4 h-4" /> },
      { id: 'whatsapp',     label: 'WhatsApp',         icon: <MessageCircle className="w-4 h-4" /> },
      { id: 'agentes',      label: 'Agentes IA',       icon: <Cpu className="w-4 h-4" /> },
      { id: 'products',     label: 'Productos',        icon: <Package className="w-4 h-4" /> },
      { id: 'usecases',     label: 'Casos de Uso',     icon: <Blocks className="w-4 h-4" /> },
      { id: 'sellers',      label: 'Vendedores',       icon: <Users className="w-4 h-4" /> },
      { id: 'branches',     label: 'Sucursales',       icon: <Building2 className="w-4 h-4" /> },
      { id: 'conversations',label: 'Conversaciones',   icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'bot',          label: 'Bot',              icon: <Bot className="w-4 h-4" /> },
      { id: 'cmdb',         label: 'Infraestructura',  icon: <Database className="w-4 h-4" /> },
      { id: 'config',       label: 'Config',           icon: <Settings2 className="w-4 h-4" /> },
      { id: 'organigrama',  label: 'Organigrama',      icon: <Network className="w-4 h-4" /> },
      { id: 'org_radial',   label: 'Org Radial',       icon: <Network className="w-4 h-4" /> },
      { id: 'org_lanes',    label: 'Org Swimlanes',    icon: <Network className="w-4 h-4" /> },
      { id: 'org_pipeline', label: 'Org Pipeline',     icon: <Network className="w-4 h-4" /> },
      { id: 'org_roster',   label: 'Org Roster',       icon: <Network className="w-4 h-4" /> },
    ],
  },
  {
    label: 'WordPress',
    color: 'text-violet-400',
    tabs: [
      { id: 'wp_chatbot',   label: 'Chatbot IA',       icon: <Bot className="w-4 h-4" /> },
      { id: 'wp_contenido', label: 'Contenido IA',     icon: <FileText className="w-4 h-4" /> },
      { id: 'wp_email',     label: 'Email Marketing',  icon: <Mail className="w-4 h-4" /> },
      { id: 'wp_seo',       label: 'SEO con IA',       icon: <Search className="w-4 h-4" /> },
      { id: 'wp_social',    label: 'Redes Sociales',   icon: <Share2 className="w-4 h-4" /> },
      { id: 'wp_prospector',label: 'Prospector',       icon: <Target className="w-4 h-4" /> },
    ],
  },
];

// Flat list for legacy usage
const tabs = TAB_GROUPS.flatMap(g => g.tabs);

function loadOrDefault<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved) as T;
  } catch {
    // ignore
  }
  return defaultValue;
}

interface CrmFullAppProps {
  /** When provided, the visible pane is controlled externally (e.g. by a unified top-level nav) instead of internal state. */
  activeTabOverride?: SubTab;
  /** Hides this component's own sub-nav — used when a parent nav already exposes these tabs. */
  hideNav?: boolean;
}

export default function CrmFullApp({ activeTabOverride, hideNav = false }: CrmFullAppProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState<SubTab>('dashboard');
  const activeTab = activeTabOverride ?? internalActiveTab;
  const setActiveTab = setInternalActiveTab;

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadOrDefault('clientum_crmfull_conversations', initialConversations)
  );
  const [sellers, setSellers] = useState<Seller[]>(() => {
    const saved = loadOrDefault('clientum_crmfull_sellers', initialSellers);
    return saved.length > 0 ? saved : initialSellers;
  });
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = loadOrDefault('clientum_crmfull_branches', initialBranches);
    return saved.length > 0 ? saved : initialBranches;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = loadOrDefault('clientum_crmfull_products', initialProducts);
    // If localStorage had an empty array (first visit or reset), seed from catalog
    return saved.length > 0 ? saved : initialProducts;
  });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('clientum_crmfull_conversations', JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_sellers', JSON.stringify(sellers)); }, [sellers]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_branches', JSON.stringify(branches)); }, [branches]);
  useEffect(() => { localStorage.setItem('clientum_crmfull_products', JSON.stringify(products)); }, [products]);

  const handleUpdateConversation = (id: string, data: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const handleSaveSeller = (seller: Seller) => {
    setSellers(prev => {
      const exists = prev.find(s => s.id === seller.id);
      return exists ? prev.map(s => s.id === seller.id ? seller : s) : [...prev, seller];
    });
  };

  const handleSaveBranch = (branch: Branch) => {
    setBranches(prev => {
      const exists = prev.find(b => b.id === branch.id);
      return exists ? prev.map(b => b.id === branch.id ? branch : b) : [...prev, branch];
    });
  };

  const handleSaveProduct = (product: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.map(p => p.id === product.id ? product : p) : [...prev, product];
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CrmFullDashboard />;
      case 'crm':
        return (
          <CrmFullPipeline
            conversations={conversations}
            sellers={sellers}
            onUpdateConversation={handleUpdateConversation}
          />
        );
      case 'products':
        return <CrmFullProducts products={products} onSave={handleSaveProduct} />;
      case 'usecases':
        return <CrmFullUseCases products={products} />;
      case 'sellers':
        return <CrmFullSellers sellers={sellers} onSave={handleSaveSeller} />;
      case 'branches':
        return <CrmFullBranches branches={branches} onSave={handleSaveBranch} />;
      case 'conversations':
        return <CrmFullConversations conversations={conversations} />;
      case 'leads':
        return <CrmFullLeads />;
      case 'agentes':
        return <CrmFullAgentes />;
      case 'maps':
        return <CrmFullGoogleMaps />;
      case 'whatsapp':
        return <CrmFullWhatsApp />;
      case 'config':
        return <CrmFullConfig />;
      case 'bot':
        return <CrmFullBotConfig />;
      case 'cmdb':
        return <CrmFullCMDB />;
      case 'organigrama':
        return <OrganigramaClientum />;
      case 'org_radial':
        return <OrgVariantRadial />;
      case 'org_lanes':
        return <OrgVariantLanes />;
      case 'org_pipeline':
        return <OrgVariantPipeline />;
      case 'org_roster':
        return <OrgVariantRoster />;
      case 'wp_chatbot':
        return <WpChatbotIA />;
      case 'wp_contenido':
        return <WpContenido />;
      case 'wp_email':
        return <WpEmailMarketing />;
      case 'wp_seo':
        return <WpSEO />;
      case 'wp_social':
        return <WpRedesSociales />;
      case 'wp_prospector':
        return <WpProspector />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen cockpit-bg font-sans text-slate-200 overflow-hidden">
      {/* Sub-navigation */}
      {!hideNav && (
      <nav className="bg-[#0A101F]/80 backdrop-blur-md border-b border-[#1E293B] px-4 py-2 flex items-center gap-1 overflow-x-auto flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-1.5 mr-4 flex-shrink-0">
          <Building2 className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          <span className="font-bold text-sm font-display tracking-wide text-white uppercase">Clientum CRM</span>
        </div>
        {TAB_GROUPS.map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 && (
              <div className="flex items-center gap-1.5 ml-2 mr-1 flex-shrink-0">
                <div className="w-px h-5 bg-[#1E293B]" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${group.color} opacity-70 whitespace-nowrap`}>
                  {group.label}
                </span>
              </div>
            )}
            {group.tabs.map(tab => {
              const isWp = group.label === 'WordPress';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? isWp
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 lg:py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
