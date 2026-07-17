# Estructura del repo — clientum-agentes

```
clientum-agentes/
├── .github/
│   └── workflows/
│       └── agentes.yml              # cron cada 15 min, ver archivo 02
├── scripts/
│   ├── run-agentes.mjs              # motor principal, ver archivo 03
│   ├── lib/
│   │   ├── github.mjs               # wrapper Octokit (issues, labels, comments)
│   │   ├── gemini.mjs               # wrapper llamadas a Gemini
│   │   ├── roster.mjs               # carga el árbol de docs/agentes/** en memoria
│   │   ├── integraciones/           # un archivo por herramienta externa
│   │   │   ├── whatsapp.mjs
│   │   │   ├── crm-api.mjs
│   │   │   ├── apify.mjs
│   │   │   ├── hunter.mjs
│   │   │   ├── google-maps.mjs
│   │   │   ├── wordpress.mjs
│   │   │   ├── neon.mjs
│   │   │   └── notificaciones.mjs   # ver archivo 06
│   │   └── coordinacion.mjs         # ver archivo 05
│   └── package.json                 # dependencias del script (separado del CRM)
├── docs/
│   └── agentes/                     # YA EXISTE — no tocar taxonomía, solo leer
│       ├── ORGANIGRAMA.md
│       ├── SETUP.md
│       ├── orquestador/{identidad,memoria,proceso,skill}.md
│       ├── tecnico/{identidad,memoria,proceso,skill}.md
│       │   ├── backend-infra/{identidad,memoria,proceso,skill}.md
│       │   ├── frontend-ux/{...}.md
│       │   └── ia-automatizacion/{...}.md
│       ├── ventas/{...}.md
│       │   ├── santi-sdr/{...}.md
│       │   └── explorador-patagonico/{...}.md
│       ├── marketing/{...}.md
│       │   └── seo-contenido/{...}.md
│       ├── customer-success/{...}.md
│       │   └── asesor-comercial-ia/{...}.md
│       └── operaciones/{...}.md
│           └── finanzas-admin/{...}.md
└── README.md
```

## Reglas de esta estructura

- `scripts/` es un paquete Node independiente del CRM (`clientum-crm`repo).
  Tiene su propio `package.json` con Octokit (`@octokit/rest`) y el SDK de
  Gemini (`@google/genai`) como únicas dependencias fuertes.
- Cada archivo en `scripts/lib/integraciones/` expone funciones puras que
  reciben credenciales por parámetro (nunca leen `process.env` directamente
  adentro) — así se pueden testear sin secrets reales.
- `docs/agentes/**` es la única fuente de verdad de identidad/memoria/proceso
  /skill. El script NUNCA hardcodea lógica de negocio de un agente: siempre
  la lee de ahí y se la pasa a Gemini como contexto.
- Cada `memoria.md` se actualiza por **append**, nunca se reescribe entero —
  es el historial real de lo que hizo el agente, se usa como auditoría.
