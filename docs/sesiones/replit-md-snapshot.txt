# Clientum CRM

AI-powered B2B sales CRM with Kanban pipeline, MEDDIC qualification, prospect discovery, outreach campaigns, and brochure generation. Built with React + TypeScript + Vite on the frontend and an Express backend, powered by Google Gemini AI.

## How to run

```
npm run dev
```

The app starts on port 5000.

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion
- **Backend**: Express (serves both the API and Vite dev middleware) — `server.ts`
- **AI**: Google Gemini via `@google/genai`
- **PDF**: jsPDF + html2canvas-pro for brochure export
- **Database**: PostgreSQL (Replit managed) via `pg`

## Project structure

```
/
├── server.ts          # Express backend (API + Vite middleware)
├── index.html         # SPA entry point
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example       # Documents all required/optional env vars
│
├── src/               # React frontend
│   ├── App.tsx        # Root component / view routing
│   ├── main.tsx
│   ├── data.ts        # Static data & industry presets (50KB)
│   ├── types.ts
│   ├── index.css
│   ├── lib/utils.ts   # Tailwind class merging (cn)
│   ├── components/    # UI components (CRM, Kanban, Brochure, etc.)
│   ├── data/          # JSON catalogs (services, courses, categories)
│   ├── services/      # scraperService.ts (Google Maps prospecting)
│   ├── store/         # sharedStore.ts (localStorage-backed state)
│   └── utils/         # pdfGenerator.ts
│
├── public/            # Static assets (logos, client images)
├── scripts/           # generate_catalog.py (WooCommerce CSV generator)
│
└── docs/              # Reference material (not part of the running app)
    ├── SANTI-SDR.md          # Santi WhatsApp SDR integration guide
    ├── assets/               # Dev-session screenshots, PDFs, exports
    ├── exports/              # Generated WooCommerce CSV catalog
    └── clientum-exports/     # WordPress plugin source (reference)
```

## Required secrets

| Key | Description |
|-----|-------------|
| `GEMINI_API_KEY` | Google Gemini API key — powers all AI features |

## Optional secrets

| Key | Description |
|-----|-------------|
| `APIFY_API_TOKEN` | Apify token for real Google Maps scraping |
| `GOOGLE_MAPS_PLATFORM_KEY` | Google Maps Platform key for live prospect discovery |
| `SANTI_API_KEY` | API key for Hermes/Santi WhatsApp SDR agent |

## Features

- **CRM Kanban** — drag leads through pipeline stages with MEDDIC scoring
- **ICP Builder** — AI-generated Ideal Customer Profile
- **Patagonia Explorer** — prospect discovery via Google Maps / Apify
- **MEDDIC Qualification** — AI-assisted qualification scoring
- **Outreach Campaigns** — WhatsApp/email campaign automation
- **Brochure Generator** — AI-generated PDF brochures per prospect
- **Santi SDR** — automated WhatsApp outreach agent (see `docs/SANTI-SDR.md`)

## User preferences

- Keep the existing project structure and stack
