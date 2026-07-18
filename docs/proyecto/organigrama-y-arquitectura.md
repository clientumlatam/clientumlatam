# Organigrama y Arquitectura — Sistema de Agentes Clientum
> Julio 2026 · Documento canónico · Fuente de verdad

---

## Organigrama

```
                     Jonathan (CEO & Fundador) — Humano
                                   │
                          Orquestador IA (Chief of Staff)
                                   │
      ┌────────────┬──────────────┼──────────────┬────────────────┐
      ▼             ▼              ▼              ▼                ▼
Agente Técnico  Agente Ventas  Agente Marketing  Agente CS    Agente Operaciones
 (CTO AI)      (Sales Mgr AI)  (Marketing Mgr)  (CS Mgr AI)     (COO AI)
      │             │                              │                │
 ┌────┼────┐   ┌────┼────┐                         │                │
 ▼    ▼    ▼   ▼    ▼    ▼                          ▼                ▼
Back Front IA  Santi Explor. Jonathan          Asesor          Finanzas
/Infra /UX &Aut SDR  Patag. (Closer,Humano)  Comercial IA    & Admin
                                                        SEO & Contenido
                                                        (bajo Marketing)
```

| Nodo | Tipo | Rol | Stack |
|------|------|-----|-------|
| Jonathan | Humano | CEO & Fundador | — |
| Orquestador IA | Agente | Chief of Staff | Gemini, Task-router |
| Agente Técnico | Agente | CTO AI | Node.js, GitHub Actions, Vercel, Neon |
| ↳ Backend/Infra | Híbrido | APIs, auth, DB, deploys | Node.js, Express, Neon, Vercel |
| ↳ Frontend/UX | Híbrido | CRM Kanban, dashboard, UI | React 19, Vite, Tailwind v4 |
| ↳ IA & Automatización | Agente | Brochures, MEDDIC, enriquecimiento | Gemini, Apify, Hunter |
| Agente de Ventas | Agente | Sales Manager AI | CRM Kanban, MEDDIC, WhatsApp |
| ↳ Santi SDR | Agente | SDR Outbound | Hermes Agent, WhatsApp, CRM API |
| ↳ Explorador Patagónico | Agente | Lead Gen | Google Maps, Apify, Gemini |
| ↳ Jonathan (Closer) | Humano | Account Executive | Zoom, WhatsApp |
| Agente de Marketing | Agente | Marketing Manager | Gemini, WordPress, Analytics |
| ↳ SEO & Contenido | Agente | Content AI | WordPress plugin, Gemini, Search Console |
| Agente Customer Success | Agente | CS Manager | CRM, WhatsApp, Gemini |
| ↳ Asesor Comercial IA | Agente | Inbound Chatbot | Site Widget, CRM webhook, Gemini |
| Agente de Operaciones | Agente | COO AI | Neon DB, Retool, Gemini |
| ↳ Finanzas & Admin | Híbrido | Reportes, MRR | CRM Dashboard, Neon DB |

### Regla de oro
Cada agente lee siempre antes de ejecutar: `identidad` → `memoria` → `proceso` → `skill`.

### Motor técnico
- **Trigger:** GitHub Issue nuevo o cron (GitHub Actions, cada 5–15 min)
- **Loop:** el workflow revisa issues abiertos asignados, ejecuta, commitea a `memoria.md`
- **Cierre:** al marcar Done el trigger se corta; notifica al nodo padre

---

## Arquitectura Hermes Prime

> Cómo interactúan el CRM, los agentes autónomos y el agente SDR (Santi/Hermes).

### Componentes principales

```
┌─────────────────────────────────────────────────────────┐
│  clientum.com.ar (Vercel)                               │
│  Express + React SPA                                    │
│  → /api/generate    (Gemini/Groq/OpenRouter)            │
│  → /api/santi/*     (protegido con SANTI_API_KEY)       │
│  → /api/leads       (6 endpoints CRUD)                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (SANTI_API_KEY)
┌──────────────────▼──────────────────────────────────────┐
│  Hermes Agent (Ubuntu local)                            │
│  skill: santi-sdr                                       │
│  → lee leads → envía WA → clasifica → actualiza CRM    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  repo clientum-agentes (GitHub)                         │
│  GitHub Actions (cron 15 min)                           │
│  → Orquestador rutea issues a los 5 agentes             │
│  → Cada agente lee su memoria.md y ejecuta              │
└─────────────────────────────────────────────────────────┘
```

### Secrets requeridos

**Replit + Vercel:**

| Variable | Estado |
|----------|--------|
| `SESSION_SECRET` | ✅ |
| `GEMINI_API_KEY` / `GEMINI_API_KEY_V2` | ✅ |
| `NEON_API_KEY` + `NEON_PROJECT_ID` | ✅ |
| `NEON_DATABASE_URL` | ✅ |
| `CRM_INTERNAL_TOKEN` | ✅ |
| `SANTI_API_KEY` | ✅ |
| `APIFY_API_TOKEN` | ✅ |
| `GOOGLE_MAPS_PLATFORM_KEY` | ✅ |
| `HUNTER_API_KEY` | ✅ |
| `GROQ_API_KEY` | ✅ |
| `OPENROUTER_API_KEY` | ✅ |

**repo `clientum-agentes` (GitHub Secrets):**

| Secret | Fuente |
|--------|--------|
| `GEMINI_API_KEY` | igual que CRM |
| `SANTI_API_KEY` | igual que CRM |
| `CRM_INTERNAL_TOKEN` | igual que CRM |
| `GOOGLE_MAPS_PLATFORM_KEY` | igual que CRM |
| `APIFY_API_TOKEN` | igual que CRM |
| `HUNTER_API_KEY` | igual que CRM |
| `WHATSAPP_CLOUD_API_TOKEN` | 🔲 Meta for Developers |
| `WHATSAPP_PHONE_ID` | 🔲 Meta for Developers |
| `JONATHAN_WHATSAPP_NUMBER` | +54 298 451-0883 |
| `DATABASE_URL` (read-only) | 🔲 nuevo usuario Postgres en Neon |
| `WORDPRESS_API_USER` / `WORDPRESS_API_PASSWORD` | WordPress → Application Passwords |
