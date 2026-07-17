# Puesta en marcha — Agentes Autónomos Clientum

## 1. Crear el repo
Subí esta carpeta completa (`clientum-agentes/`) a un repo nuevo en GitHub, por ejemplo
`jonathan-ledantes/clientum-agentes`. Tiene que quedar tal cual: el `.github/workflows/`
en la raíz.

## 2. Conseguir la API key gratis de Gemini
1. Andá a https://aistudio.google.com/apikey
2. Creá una API key (el free tier de Gemini alcanza para este volumen de uso)

## 3. Cargar los secrets en GitHub
En el repo: **Settings → Secrets and variables → Actions → New repository secret**
- `GEMINI_API_KEY` → la key del paso 2
- (`GITHUB_TOKEN` ya existe solo, no hace falta cargarlo)

## 4. Activar permisos de escritura del bot
**Settings → Actions → General → Workflow permissions** → marcar
"Read and write permissions" (para que pueda comentar, cerrar issues y commitear memoria.md)

## 5. Cómo se le da trabajo (dos formas)

**A) Sin clasificar nada vos — la forma recomendada:**
Creás un Issue con label `agente:orquestador` y escribís la instrucción en texto
libre, como si le hablaras a un gerente. El Orquestador la lee, decide con Gemini
cuál de los agentes la debe ejecutar, y re-etiqueta el issue solo. Vos no necesitás
saber la taxonomía interna de carpetas.

**B) Asignación directa (si ya sabés a quién le toca):**
Le ponés el label `agente:<carpeta>` vos mismo, por ejemplo:
- `agente:ventas/santi-sdr` → lo toma Santi SDR
- `agente:tecnico/backend-infra` → lo toma Backend/Infra
- `agente:marketing/seo-contenido` → lo toma SEO & Contenido

En ambos casos el workflow corre cada 15 minutos, así que en el peor caso tarda
15 min en arrancar el ruteo, y otros 15 min más en que el agente asignado procese
el issue (dos corridas si usás la opción A).

## 6. Cómo sabés que terminó
El agente comenta su avance en el issue. Cuando termina, escribe `ESTADO: DONE` y
el workflow cierra el issue solo. Mientras tanto, cada corrida le suma una línea a
`memoria.md` de esa carpeta — ahí queda el historial real de lo que hizo.

## 7. Costo
- GitHub Actions: gratis hasta 2.000 min/mes en repos privados (esto usa ~1 min por
  corrida, 4 corridas/hora = 96 min/día si corre todo el día — igual conviene ajustar
  el cron si el volumen de issues es bajo, ej. cada 30-60 min en vez de 15)
- Gemini API: free tier (con límites de requests/minuto — si un día se dispara mucho
  volumen, ahí sí habría que evaluar plan pago)

## 8. Límite real de esto
No es un agente que "navega la web como una persona". Para eso hace falta sumar
Browserbase/Browserless (con su propio free tier) como herramienta adicional dentro
de `scripts/run-agentes.mjs`. Se puede agregar cuando haga falta un caso concreto
(ej. Explorador Patagónico scrapeando Google Maps).
