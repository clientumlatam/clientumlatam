import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@neondatabase/neon-js/auth/react";
import { AuthView, AccountView as NeonAccountView } from "@neondatabase/neon-js/auth/react/ui";
import { useParams } from "react-router-dom";
import PublicWebsite from "./components/PublicWebsite";
import SalesProspectorDashboard from "./components/SalesProspectorDashboard";
import { DEFAULT_BROCHURE_DATA, INDUSTRY_PRESETS } from "./data";
import { BrochureData, CustomTemplate } from "./types";
import { exportBrochureToPDF } from "./utils/pdfGenerator";

// ── SDK-style page wrappers (thin, match Neon Auth docs) ─────────────────────
function AuthPage() {
  const { pathname } = useParams<{ pathname: string }>();
  return <AuthView pathname={pathname} />;
}

function AccountPage() {
  const { pathname } = useParams<{ pathname: string }>();
  return <NeonAccountView pathname={pathname} />;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive viewMode from URL
  const pathToMode = (p: string): "website" | "prospector" | "account" | "auth" => {
    if (p === "/auth" || p.startsWith("/auth/")) return "auth";
    if (p === "/account" || p.startsWith("/account/")) return "account";
    if (p.startsWith("/prospector") || p.startsWith("/crm")) return "prospector";
    return "website";
  };

  const [viewMode, setViewMode] = useState<"website" | "prospector" | "account" | "auth">(
    () => pathToMode(location.pathname)
  );

  // Keep URL in sync when viewMode is changed programmatically
  const goTo = (mode: "website" | "prospector" | "account" | "auth") => {
    setViewMode(mode);
    const path = mode === "auth" ? "/auth" : mode === "account" ? "/account" : mode === "prospector" ? "/prospector" : "/";
    if (location.pathname !== path) navigate(path, { replace: false });
  };

  // Sync viewMode if the user navigates via browser back/forward
  useEffect(() => {
    const mode = pathToMode(location.pathname);
    setViewMode(mode);
  }, [location.pathname]);

  // ── Auth state from NeonAuthUIProvider context ─────────────────────────────
  const { user: neonUser, isLoaded: authChecked, isSignedIn, signOut } = useAuth();
  const authUser = neonUser?.username ?? null;
  const authRole = neonUser?.role ?? null;

  const handleLogout = async () => {
    await signOut();
    goTo("website");
  };

  // Which industry solution page is being shown on the public website home ("general" = Default Clientum)
  const [publicIndustry, setPublicIndustry] = useState<string>("general");
  
  const [brochureData, setBrochureData] = useState<BrochureData>(() => {
    const saved = localStorage.getItem("clientum_brochure_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading brochureData from localStorage", e);
      }
    }
    return INDUSTRY_PRESETS.clientum_completo?.data || DEFAULT_BROCHURE_DATA;
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    return localStorage.getItem("clientum_active_preset") || "clientum_completo";
  });

  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    const saved = localStorage.getItem("clientum_custom_templates");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading customTemplates from localStorage", e);
      }
    }
    return [];
  });

  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("clientum_color_theme") || "navy";
  });

  const [showAllPages, setShowAllPages] = useState<boolean>(false);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  
  const [hidePrices, setHidePrices] = useState<boolean>(() => {
    return localStorage.getItem("clientum_hide_prices") === "true";
  });

  const [hideChatbot, setHideChatbot] = useState<boolean>(() => {
    return localStorage.getItem("clientum_hide_chatbot") === "true";
  });

  const [contactInfo, setContactInfo] = useState(() => {
    const saved = localStorage.getItem("clientum_contact_info");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading contactInfo from localStorage", e);
      }
    }
    return {
      website: "clientum.com.ar",
      email: "info@clientum.com.ar",
      phone: "+54 9 298 451-0883",
      address: "General Roca, Río Negro, Argentina",
      github: "",
    };
  });

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem("clientum_brochure_data", JSON.stringify(brochureData));
  }, [brochureData]);

  useEffect(() => {
    localStorage.setItem("clientum_active_preset", activePreset);
  }, [activePreset]);

  useEffect(() => {
    localStorage.setItem("clientum_color_theme", colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem("clientum_hide_prices", String(hidePrices));
  }, [hidePrices]);

  useEffect(() => {
    localStorage.setItem("clientum_hide_chatbot", String(hideChatbot));
  }, [hideChatbot]);

  useEffect(() => {
    localStorage.setItem("clientum_contact_info", JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    localStorage.setItem("clientum_custom_templates", JSON.stringify(customTemplates));
  }, [customTemplates]);

  const handlePresetChange = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "default") {
      setBrochureData(DEFAULT_BROCHURE_DATA);
    } else if (INDUSTRY_PRESETS[presetKey]) {
      setBrochureData(INDUSTRY_PRESETS[presetKey].data);
    } else if (presetKey.startsWith("custom_")) {
      const templateId = presetKey.replace("custom_", "");
      const found = customTemplates.find((t) => t.id === templateId);
      if (found) {
        setBrochureData(found.brochureData);
        setColorTheme(found.colorTheme);
        setHidePrices(found.hidePrices);
        if (found.hideChatbot !== undefined) {
          setHideChatbot(found.hideChatbot);
        }
      }
    }
  };

  const handleSaveTemplate = (name: string) => {
    const newTemplate: CustomTemplate = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      createdAt: new Date().toLocaleString("es-AR"),
      brochureData,
      colorTheme,
      hidePrices,
      hideChatbot,
    };
    setCustomTemplates((prev) => [...prev, newTemplate]);
    setActivePreset(`custom_${newTemplate.id}`);
  };

  const handleDeleteTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (activePreset === `custom_${id}`) {
      setActivePreset("default");
    }
  };

  const handleReset = () => {
    if (confirm("¿Estás seguro de reiniciar los textos del brochure a sus valores predeterminados?")) {
      setBrochureData(DEFAULT_BROCHURE_DATA);
      setActivePreset("default");
      setColorTheme("navy");
      setHideChatbot(false);
      setHidePrices(false);
      setContactInfo({
        website: "clientum.com.ar",
        email: "info@clientum.com.ar",
        phone: "+54 9 298 451-0883",
        address: "General Roca, Río Negro, Argentina",
        github: "",
      });
      localStorage.removeItem("clientum_sim_deals");
      localStorage.removeItem("clientum_brochure_data");
      localStorage.removeItem("clientum_active_preset");
      localStorage.removeItem("clientum_color_theme");
      localStorage.removeItem("clientum_hide_prices");
      localStorage.removeItem("clientum_hide_chatbot");
      localStorage.removeItem("clientum_contact_info");
    }
  };

  const handlePrint = () => {
    // Switch to multi-page view for clean prints
    const originalShowAll = showAllPages;
    setShowAllPages(true);
    
    // Allow React state to update before opening print dialog
    setTimeout(() => {
      window.print();
      setShowAllPages(originalShowAll);
    }, 250);
  };

  const handleExportPDF = () => {
    // Switch to the multi-page view so every #print-page-N node exists in
    // the DOM for html2canvas to capture, matching the on-screen design.
    const originalShowAll = showAllPages;
    setShowAllPages(true);

    const activePages = hideChatbot ? [1, 2, 4, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8];
    const allPagesMounted = () => activePages.every((p) => document.getElementById(`print-page-${p}`));

    // Wait deterministically for every page node to mount (React render +
    // layout can take a couple of frames) instead of a fixed guess-timeout.
    const waitForPages = (deadline = Date.now() + 3000): Promise<void> =>
      new Promise((resolve, reject) => {
        const check = () => {
          if (allPagesMounted()) return resolve();
          if (Date.now() > deadline) {
            return reject(new Error("Tiempo de espera agotado renderizando las páginas del brochure."));
          }
          requestAnimationFrame(check);
        };
        check();
      });

    (async () => {
      try {
        await waitForPages();
        await exportBrochureToPDF(brochureData, contactInfo, colorTheme, hideChatbot);
      } catch (e) {
        console.error("Error exportando el brochure a PDF:", e instanceof Error ? (e.stack || e.message) : e);
        alert("No se pudo generar el PDF. Probá de nuevo en unos segundos.");
      } finally {
        setShowAllPages(originalShowAll);
      }
    })();
  };

  const handleHideChatbotChange = (hide: boolean) => {
    setHideChatbot(hide);
    if (hide && (selectedPage === 3 || selectedPage === 5)) {
      setSelectedPage(4);
    }
  };

  // ── Loading state (context not ready yet) ─────────────────────────────────
  if (!authChecked && (viewMode === "account" || viewMode === "prospector")) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B131D]">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  // ── /auth and /auth/:pathname — SDK-style AuthView ──────────────────────
  if (viewMode === "auth") {
    if (isSignedIn) {
      // Already logged in — go straight to the CRM
      return <Navigate to="/prospector" replace />;
    }
    // pathname comes from the URL, e.g. /auth/sign-in → "sign-in"
    const authPathname = location.pathname.replace(/^\/auth\/?/, "") || "sign-in";
    return <AuthPage />;
  }

  // ── /account and /account/:pathname — SDK-style AccountView ────────────
  if (viewMode === "account") {
    if (!isSignedIn) return <Navigate to="/auth/sign-in" replace />;
    return <AccountPage />;
  }

  // ── /prospector — CRM dashboard (requires auth) ─────────────────────────
  if (viewMode === "prospector") {
    if (!isSignedIn) {
      return <Navigate to="/auth/sign-in" replace />;
    }

    return (
      <SalesProspectorDashboard
        onLogout={handleLogout}
        currentUsername={authUser}
        currentUserRole={authRole || "user"}
        brochureData={brochureData}
        hidePrices={hidePrices}
        onBack={() => goTo("website")}
        onChangeDeals={(newDeals) => {
          setBrochureData((prev) => ({
            ...prev,
            crm: {
              ...prev.crm,
              deals: newDeals
            }
          }));
        }}
        onChangeBrochureData={setBrochureData}
        colorTheme={colorTheme}
        onThemeChange={setColorTheme}
        contactInfo={contactInfo}
        onContactChange={setContactInfo}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        customTemplates={customTemplates}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onHidePricesChange={setHidePrices}
        hideChatbot={hideChatbot}
        onHideChatbotChange={handleHideChatbotChange}
        showAllPages={showAllPages}
        onShowAllPagesChange={setShowAllPages}
        selectedPage={selectedPage}
        onSelectedPageChange={setSelectedPage}
        onPrint={handlePrint}
        onExportPDF={handleExportPDF}
        onResetBrochure={handleReset}
      />
    );
  }

  // Default: website (viewMode === "website" or any other)
  return (
    <PublicWebsite
      onBackToEditor={() => goTo("prospector")}
      brochureData={brochureData}
      colorTheme={colorTheme}
      contactInfo={contactInfo}
      hidePrices={hidePrices}
      authUser={authUser}
      onOpenLogin={() => goTo("prospector")}
      onLogout={handleLogout}
    />
  );
}
