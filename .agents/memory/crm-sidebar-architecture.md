---
name: CRM Sidebar Architecture
description: How the dashboard sidebar and tab routing work after the v2.x redesign
---

## Key decision
`SalesProspectorDashboard.tsx` is the **master container** for the authenticated CRM dashboard. It has its own sidebar NAV_GROUPS and routes each tab to the correct component. `CrmFullApp.tsx` is a **secondary embedded component** used only for products/sellers/branches/conversations/bot via `hideNav + activeTabOverride`.

## Nav structure (current, post-redesign)
Groups in NAV_GROUPS order:
1. Prospección — icp, research (maps)
2. Pipeline de Ventas — pipeline, meddic, outreach, quickcreate, activity
3. Comunicación — conversations, bot
4. Catálogo & Equipo — products, sellers, branches
5. Brochure & Contenido — brochure, pages, config, ai
6. WordPress — wp-leads, wp-setup, wp-modulos

**Orquestador IA** is pinned at the bottom of the sidebar (not in NAV_GROUPS). Organigrama tabs (org-*) are still in the type union and render, but removed from the sidebar nav.

## Tab → Component mapping (new)
- `icp` → IcpBuilder (src/components/crm-full/IcpBuilder.tsx)
- `research` (maps) → CrmFullGoogleMaps (inline in SalesProspectorDashboard)
- `pipeline` → inline SalesProspectorDashboard pipeline kanban
- `meddic` → MeddicCalificacion (src/components/crm-full/MeddicCalificacion.tsx)
- `outreach` → OutreachCampaigns (src/components/crm-full/OutreachCampaigns.tsx)
- `quickcreate` → CreacionRapidaCRM (src/components/crm-full/CreacionRapidaCRM.tsx)
- `activity` → ActividadCRM (src/components/crm-full/ActividadCRM.tsx)
- `conversations`, `bot`, `products`, `sellers`, `branches` → CrmFullApp (hideNav)
- `brochure` → BrochureCRM (src/components/crm-full/BrochureCRM.tsx)
- `pages` → SidebarEditor (brochure content editor)
- `config` → SidebarEditor (brochure config)
- `ai` → CopiloIAPanel (src/components/crm-full/CopiloIAPanel.tsx)
- `wp-leads` → CrmFullLeads
- `wp-setup` → WpSetup
- `wp-modulos` → WpModulos
- `orquestador` → OrquestadorIA

## Why
The "hidden div" pattern was used to keep old inline content for meddic/outreach/icp in place (non-destructive) while rendering the new components at the top. The hidden content won't show but avoids complex JSX surgery on a 3300-line file.

## CrmFullApp.tsx standalone
CrmFullApp.tsx is also a self-contained dashboard (has its own sidebar with full nav) that can be used standalone (e.g., standalone /crm route or future use). It mirrors SalesProspectorDashboard's nav but with different component implementations.
