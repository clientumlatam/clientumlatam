# Organigrama Clientum — Julio 2026 (Agentes IA)

Cada nodo del organigrama es un agente de IA independiente coordinado por el Orquestador Central.
Jonathan gestiona toda la empresa vía chat con el Orquestador.

## Estructura

```
                         Jonathan (CEO & Fundador) — Humano
                                     │
                            Orquestador IA (Chief of Staff)
                                     │
        ┌────────────┬──────────────┼──────────────┬────────────────┐
        ▼             ▼              ▼              ▼                ▼
  Agente Técnico  Agente Ventas  Agente Marketing  Agente CS    Agente Operaciones
   (CTO AI)      (Sales Mgr AI)  (Marketing Mgr)   (CS Mgr AI)     (COO AI)
        │             │                              │                │
   ┌────┼────┐   ┌────┼────┐                         │                │
   ▼    ▼    ▼   ▼    ▼    ▼                          ▼                ▼
Backend Front IA  Santi Explor. Jonathan          Asesor          Finanzas
/Infra  /UX  &Aut  SDR  Patag.  (Closer,Humano)   Comercial IA    & Admin
                                                                       │
                                                                  (bajo Marketing:
                                                                   SEO & Contenido)
```

## Nodos y responsables

| Nodo | Tipo | Rol | Stack/Herramientas |
|---|---|---|---|
| Jonathan | Humano | CEO & Fundador | — |
| Orquestador IA | Agente IA | Chief of Staff | Gemini, Chat Interface, Task-router |
| **Agente Técnico** | Agente IA | CTO AI | Node.js Agent, GitHub Actions, Vercel, Neon DB |
| ↳ Backend/Infra | Híbrido | APIs, auth, DB, bugs, deploys | Node.js, Express, Neon, Vercel Serverless |
| ↳ Frontend/UX | Híbrido | CRM Kanban, dashboard, UI | React 18, Vite, Tailwind v4 |
| ↳ IA & Automatización | Agente IA | Brochures, MEDDIC scoring, enriquecimiento | Gemini API, Apify, Hunter |
| **Agente de Ventas** | Agente IA | Sales Manager AI — pipeline completo | CRM Kanban, MEDDIC, WhatsApp |
| ↳ Santi SDR | Agente IA | SDR Outbound — contacta y clasifica leads | Hermes Agent, WhatsApp, CRM API |
| ↳ Explorador Patagónico | Agente IA | Lead Gen — prospección Google Maps/Apify | Google Maps API, Apify, Gemini Search |
| ↳ Jonathan (Closer) | Humano | Account Executive — cierra contratos | Zoom, WhatsApp personal |
| **Agente de Marketing** | Agente IA | Marketing Manager — contenido, SEO, campañas | Gemini, WordPress, Google Analytics |
| ↳ SEO & Contenido | Agente IA | Content AI — blogs, landings, keywords | WordPress plugin, Gemini, Search Console |
| **Agente Customer Success** | Agente IA | CS Manager — salud de clientes, onboarding, churn | CRM, WhatsApp, Gemini |
| ↳ Asesor Comercial IA | Agente IA | Inbound Chatbot del sitio | Chatbot Site, CRM webhook, Gemini |
| **Agente de Operaciones** | Agente IA | COO AI — reportes, métricas, alertas | Neon DB, Retool, Gemini |
| ↳ Finanzas & Admin | Híbrido | Reportes semanales, MRR, pipeline revenue | CRM Dashboard, Neon DB |

## Regla de oro
Cada agente SIEMPRE lee, en este orden, antes de ejecutar cualquier tarea:
1. `identidad.md` — quién es
2. `memoria.md` — contexto acumulado, se autoactualiza solo tras cada tarea
3. `proceso.md` — cómo trabaja, paso a paso
4. `skill.md` — con qué herramientas cuenta y cómo usarlas

## Motor técnico (gratis, online, sin intervención humana)
- **Trigger**: GitHub Issue nuevo o cron programado (GitHub Actions)
- **Loop de ejecución**: el workflow de GitHub Actions corre cada 5–15 min, revisa
  issues abiertos asignados a cada agente y continúa la tarea leyendo memoria.md
- **Dashboard**: GitHub Projects / CRM Kanban propio
- **Cierre**: al marcar Done, el trigger se corta y se notifica al nodo padre
