# Workflow — .github/workflows/agentes.yml

## Objetivo
Correr `scripts/run-agentes.mjs` cada 15 minutos, con permisos para leer/
escribir Issues, comentar, etiquetar y commitear cambios en `memoria.md`.

## Trigger
- `schedule: cron: "*/15 * * * *"` (ajustable a 30-60 min si el volumen de
  issues es bajo — ver costo en SETUP.md punto 7)
- `workflow_dispatch:` para poder correrlo manualmente a demanda desde el
  tab Actions (útil para debug)

## Permisos
```yaml
permissions:
  issues: write
  contents: write
  pull-requests: write   # solo si en el futuro algún agente abre PRs
```
Esto requiere además que en **Settings → Actions → General → Workflow
permissions** esté marcado "Read and write permissions" (SETUP.md punto 4).

## Pasos del job

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22.x, igual que el CRM)
3. `npm ci` dentro de `scripts/`
4. Ejecutar `node scripts/run-agentes.mjs`
   - Variables de entorno inyectadas desde Secrets (ver archivo 07)
   - El script hace TODO el trabajo en una sola invocación: lee issues
     abiertos, rutea los que están en `agente:orquestador`, ejecuta los que
     ya están asignados a un agente, actualiza memorias
5. Si el script tocó algún `memoria.md`, commitear y pushear con
   `git config user.name "clientum-agentes-bot"` y un mensaje tipo
   `chore(memoria): update <agente> tras issue #<n>`

## Concurrencia
Agregar:
```yaml
concurrency:
  group: agentes-run
  cancel-in-progress: false
```
para evitar que dos corridas se pisen si una tarda más de 15 min (no debería
pasar, pero es la salvaguarda barata).

## Manejo de errores
- Si `run-agentes.mjs` tira una excepción no controlada para un issue
  puntual, el script debe capturarla, comentar en ese issue
  `⚠️ Error interno, reintentando en la próxima corrida` y seguir con el
  resto — un issue roto no debe frenar el loop completo.
- Si falla la autenticación de Gemini o GitHub (credenciales inválidas), sí
  debe fallar el job entero (para que se vea rojo en Actions y Jonathan se
  entere por el mail que manda GitHub automáticamente ante un job fallido).
