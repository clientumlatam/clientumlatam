# Agentes IA — Clientum · Arquitectura Hermes Prime

> Sistema de agentes autónomos que operan ventas, marketing, soporte y operaciones 24/7.  
> Jonathan dirige toda la empresa vía chat con el Orquestador, que a su vez delega a 5 agentes departamentales.

---

## ⚠️ Estado real vs. visión (julio 2026)

Esta carpeta describe la **arquitectura objetivo**. Hoy, de los 5 departamentos, el único agente que ejecuta acciones reales sobre el mundo (no solo texto en un comentario de Issue) es **Santi SDR**, y lo hace por un camino distinto al que describe esta carpeta:

- **Santi SDR real y vigente:** Hermes Agent corriendo local en Ubuntu + app "AI Prospector" (API propia de 4 endpoints) + WhatsApp conectado por QR. Manda mensajes reales a la base de prospectos hoy. Documentación completa en `../referencia-tecnica/implementacion-santi-hermes.md` — **ese es el documento canónico para Santi**, no la ficha de abajo.
- **Loop de Issues (`scripts/run-agentes.mjs`):** hoy es un simulador de texto — cada agente responde con Gemini y postea un comentario, pero ninguno ejecuta código real (no hace deploys, no manda WhatsApp, no toca Neon/Vercel). Sirve como base para escalar a los otros 4 departamentos, pero **no está haciendo lo que su propia ficha dice que hace**.

**Por qué Hermes-local es el canónico y no el de Issues:** ya está operativo contra leads reales, tiene guardrails concretos a nivel de prompt (límites de contacto, opt-out, nunca cierra precio), y una API con schema definido. El de Issues, para Ventas, quedaría **redundante** una vez que ambos apunten al mismo CRM — mantener los dos vivos generaría doble estado de leads. Recomendación: usar el loop de Issues solo para los otros 4 departamentos (Técnico, Marketing, CS, Operaciones) hasta que tengan su propia implementación real, y no para Ventas/Santi.

**Pendiente de decisión de Jonathan:** si en algún momento el loop de Issues necesita "saber" el estado de leads (para reportes, por ejemplo), debería consultar la API de AI Prospector como fuente de verdad — nunca mantener su propio estado de Santi en paralelo.

---

## Estructura de esta carpeta

```
agentes/
├── organigrama-y-arquitectura.md     ← CANÓNICO — árbol completo + capas Hermes Prime
├── departamento-ventas.md            — proceso detallado del equipo de ventas
├── departamento-tecnico.md           — proceso detallado del equipo técnico
├── departamentos-marketing-cs-ops.md — Marketing · CS · Operaciones
├── setup-y-api-keys.md               — cómo levantar el repo autónomo + API keys
├── fichas/                           — identidad · memoria · proceso · skill por agente
│   ├── orquestador.md
│   ├── ventas.md
│   ├── ventas-santi-sdr.md
│   ├── ventas-explorador-patagonico.md
│   ├── tecnico.md
│   ├── tecnico-backend-infra.md
│   ├── tecnico-frontend-ux.md
│   ├── tecnico-ia-automatizacion.md
│   ├── marketing.md
│   ├── marketing-seo-contenido.md
│   ├── customer-success.md
│   ├── customer-success-asesor.md
│   ├── operaciones.md
│   └── operaciones-finanzas-admin.md
└── scripts/
    ├── agentes-clientum.yml          — GitHub Actions cron 15 min
    └── run-agentes.mjs              — lógica del orquestador + 5 agentes
```

---

## Árbol de agentes (resumen)

```
Jonathan (CEO) — Humano
    └── Orquestador IA (Chief of Staff)
            ├── Agente Técnico (CTO AI)
            │       ├── Backend / Infra
            │       ├── Frontend / UX
            │       └── IA & Automatización
            ├── Agente de Ventas (Sales Manager AI)
            │       ├── Explorador Patagónico
            │       ├── Santi SDR  ← Hermes Agent, WhatsApp, 15 contactos/día
            │       └── Jonathan (Closer — reuniones y cierres)
            ├── Agente de Marketing
            │       └── SEO & Contenido
            ├── Agente Customer Success
            │       └── Asesor Comercial IA (chatbot inbound)
            └── Agente de Operaciones (COO AI)
                    └── Finanzas & Admin
```

---

## Cómo funciona el sistema autónomo

El workflow **`.github/workflows/agentes-clientum.yml`** (ya en este mismo repo) corre cada 15 minutos via GitHub Actions. Lee los Issues abiertos del repo, los enruta al agente correcto según el label, ejecuta la tarea usando Gemini, postea la respuesta como comentario, y cierra el issue cuando el agente escribe `ESTADO: DONE`. La sección `## Memoria` de cada ficha se actualiza y se commitea automáticamente.

**Script:** `docs/referencia-tecnica/agentes/scripts/run-agentes.mjs`  
**Fichas:** `docs/referencia-tecnica/agentes/fichas/<slug>.md`

**Para darle trabajo:** crear un Issue con label `agente:orquestador` y escribir la instrucción en texto libre. El Orquestador elige el sub-agente correcto y re-etiqueta.

**Secret requerido en GitHub:** `GEMINI_API_KEY` → Settings → Secrets and variables → Actions.  
`GITHUB_TOKEN` ya existe automáticamente.

Ver [`setup-y-api-keys.md`](setup-y-api-keys.md) para instrucciones completas.
