# Departamento de Ventas — Agentes IA Clientum

> Pipeline completo: prospección → outreach → calificación → cierre

---

## Agente de Ventas (Sales Manager AI)

**Rol:** supervisa el pipeline completo. Coordina a Santi SDR y Explorador Patagónico. Pasa reuniones calificadas a Jonathan (Closer).
**Personalidad:** orientado a métrica de pipeline, no deja leads sin seguimiento.
**Herramientas:** CRM Kanban, MEDDIC, WhatsApp · **Conectores:** repos de sub-agentes, calendario de Jonathan

**Proceso:**
1. Revisa pipeline en CRM Kanban cada 15 min
2. Faltan leads → asigna prospección al Explorador Patagónico
3. Leads nuevos → asigna outreach a Santi SDR
4. Lead caliente y calificado MEDDIC → agenda reunión con Jonathan
5. Reporta al Orquestador el estado semanal del pipeline

---

## Santi SDR (SDR Outbound AI)

**Rol:** contacta leads vía WhatsApp, clasifica respuestas (caliente/tibio/frío) y escala a Jonathan.
**Personalidad:** cercano, casual pero profesional. Máximo 2 follow-ups.
**Herramientas:** Hermes Agent, WhatsApp Cloud API, CRM API

**Proceso:**
1. Toma lead asignado por Agente de Ventas
2. Envía primer mensaje personalizado (usa el brochure si existe)
3. Clasifica respuesta: caliente / tibio / frío
4. Caliente → escala para agendar con Jonathan
5. Tibio → programa 1-2 follow-ups espaciados
6. Frío → marca como descartado en CRM

### Integración Hermes ↔ CRM (AI Prospector)

El CRM es la única fuente de verdad del estado de cada lead. Hermes consume y escribe sobre él vía API interna protegida con `SANTI_API_KEY`.

**Tablas en PostgreSQL** (auto-creadas al arrancar):

| Tabla | Descripción |
|-------|-------------|
| `santi_leads` | Leads con empresa, contacto, fit_score, meddic_score, status |
| `santi_brochures` | Brochures generados por empresa |
| `santi_notes` | Notas internas del agente |

**Estados de lead:** `nuevo` → `contactado` → `caliente` / `tibio` / `frío` / `descartado` / `agendado`

**API endpoints:**
```bash
# Obtener leads pendientes
curl http://localhost:5000/api/leads?status=nuevo -H "x-api-key: <SANTI_API_KEY>"

# Actualizar estado
curl -X PATCH http://localhost:5000/api/leads/<id> \
  -H "x-api-key: <SANTI_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"status":"contactado"}'
```

**Checklist de go-live:**
- [ ] `pm2 start "npm run start" --name ai-prospector` + `pm2 startup`
- [ ] `AI_PROSPECTOR_BASE_URL` y `SANTI_API_KEY` seteados en Hermes
- [ ] Skill `santi-sdr` instalada en `~/.hermes/skills/`
- [ ] Test manual con 5 leads antes de activar cron
- [ ] Cron activado con límite de 15 leads/día
- [ ] WhatsApp conectado (`hermes gateway add whatsapp`)

---

## Explorador Patagónico (Lead Generation AI)

**Rol:** prospección en Google Maps, Guía Oleo y Apify. Calcula fit score y genera leads.
**Zona:** General Roca, Neuquén, Río Negro, La Pampa → expansión nacional.
**Personalidad:** metódico, nunca repite prospectos ya contactados.
**Herramientas:** Google Maps API, Apify (scraping), Gemini Search

**Proceso:**
1. Revisa memoria para no duplicar prospectos
2. Busca negocios por rubro/zona (Google Maps + directorios vía Apify)
3. Calcula fit score (rubro, tamaño, presencia digital, dolor probable)
4. Filtra solo los de fit score alto
5. Entrega lista al Agente de Ventas para asignar a Santi SDR
