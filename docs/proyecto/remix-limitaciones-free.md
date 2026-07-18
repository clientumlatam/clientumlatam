# Qué NO se transfiere al hacer Remix en cuenta free de Replit

Cuando alguien con cuenta gratuita de Replit hace remix de este repo, obtiene una copia del código. Todo lo demás queda en la cuenta original.

---

## ❌ No se transfiere — nunca, independientemente del plan

### Secrets y variables de entorno
Los secrets son privados a la cuenta del dueño. El remixeador arranca con un repl sin ninguna variable configurada. La app no va a arrancar hasta que configure las suyas propias.

**Referencia:** Ver `.env.example` en la raíz — lista todas las variables necesarias y cómo obtener cada una.

### Historial de chats del agente (Replit AI)
Los chats con el agente de IA están atados al workspace del dueño. No se copian, no se exportan, no hay forma de recuperarlos. Los archivos `2026-07-15.md`, `CAMBIOS.md` y `PENDIENTES.md` en la raíz son la versión exportable de lo que se hizo.

### Datos de base de datos
- Si el proyecto usa **Replit PostgreSQL** (base integrada): el remixeador recibe una base vacía nueva, sin datos.
- Si usa **Neon** (como este proyecto): el remixeador no tiene acceso al proyecto Neon del dueño. Necesita crear su propia cuenta en neon.tech y sus propias tablas.
- Si usa **Replit Key-Value DB**: ídem, base vacía nueva.

### Checkpoints / historial de versiones
Los checkpoints son snapshots del workspace del dueño. El remixeador no puede ver ni restaurar el historial previo — empieza desde el estado actual del código.

### Integraciones conectadas
Si el proyecto tiene integraciones activas (Google Sheets, Linear, Stripe, GitHub, etc.) configuradas desde el panel de Replit, esas conexiones OAuth quedan en la cuenta del dueño. El remixeador tiene que autorizar sus propias conexiones.

### Dominio personalizado
El dominio `.replit.app` o cualquier dominio custom está atado al repl del dueño. El remixeador recibe un nuevo subdominio `.replit.dev` generado automáticamente.

### Colaboradores y permisos
La lista de colaboradores no se copia. El repl remixeado es solo del nuevo dueño.

### Memoria del agente (`.agents/memory/`)
Aunque los archivos de memoria están en el código (y sí se copian), el agente en el repl remixeado los leerá como contexto inicial. Sin embargo, el historial de razonamiento y las sesiones anteriores de chat que generaron esa memoria no existen en el nuevo workspace.

---

## ⚠️ Limitaciones adicionales por ser cuenta free

Estas restricciones aplican al **repl remixeado** si quien lo usa tiene cuenta gratuita:

### El repl se duerme
Sin plan pago (Hacker o superior), el repl entra en sleep después de ~5 minutos de inactividad. La próxima visita tarda entre 10 y 30 segundos en despertar. Para una app tipo CRM con backend Express, esto significa:
- Las sesiones activas se pierden cuando el proceso muere
- Los WebSockets o conexiones persistentes se cortan
- Los usuarios ven pantalla en blanco o timeout hasta que el repl despierta

### RAM limitada a 512 MB
Free tier tiene 512 MB de RAM. Este proyecto en desarrollo (Vite + Express + Node + TypeScript) puede rozar ese límite. Síntomas: el proceso se mata solo, el build falla sin mensaje claro de error, el servidor responde lento.

### Sin Always-On
No hay opción de mantener el repl corriendo 24/7. Solo disponible en planes pagos.

### Sin deploy a producción desde el repl
Free tier no puede usar Replit Deployments (Cloud Run). El repl del remixeador solo puede correr en modo desarrollo. Para un deploy real necesita:
- Plan Hacker o superior en Replit, o
- Deployar externamente (Vercel, Railway, Render, etc.) — que es lo que ya hace este proyecto

### Sin dominio personalizado
Para usar un dominio propio en Replit Deployments se necesita plan pago. El remixeador queda con el subdominio generado automáticamente.

### Egress / ancho de banda limitado
El tráfico saliente está limitado en free tier. Para una app que llama a APIs externas (Gemini, Apify, Hunter, Neon) frecuentemente, puede haber throttling.

### Sin SSH / acceso avanzado
Free tier no tiene acceso SSH al contenedor. Solo el editor web y la terminal integrada.

### Almacenamiento limitado (~1 GB)
El espacio en disco del repl es limitado. `node_modules` con pnpm puede pesar 400-600 MB, lo que deja poco margen para uploads o assets.

---

## ✅ Qué SÍ se transfiere en el remix

Para referencia completa:

| Se transfiere | Detalles |
|---|---|
| Todo el código fuente | Exactamente igual al estado actual del repo |
| `package.json` / `pnpm-lock.yaml` | Dependencias reproducibles |
| `.env.example` | La guía de qué variables configurar |
| `.replit` y `replit.nix` | Configuración del entorno Nix y workflows |
| `docs/ARCHITECTURE.md` | Documentación técnica completa |
| `.agents/memory/` | Archivos de memoria del agente (como contexto inicial) |
| `.github/workflows/` | Los workflows de CI/CD (si conectan su propio GitHub) |
| Git history | El historial de commits del repo |

---

## Qué tiene que hacer el remixeador para que la app funcione

1. Crear cuenta en [neon.tech](https://neon.tech) → crear proyecto → copiar connection string
2. Obtener API key de Google AI Studio (Gemini)
3. Obtener API key de Apify y Hunter.io (opcional, para prospección)
4. Configurar todos los secrets en Replit → Secrets del nuevo repl (ver `.env.example`)
5. Correr las migraciones de DB para crear las tablas (ver `docs/ARCHITECTURE.md` → sección Schema)
6. Iniciar el workflow `Start application`
