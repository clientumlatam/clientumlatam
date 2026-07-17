# Pendientes y próximos pasos — sesión 15 de julio de 2026

Lista completa de acciones que quedaron abiertas al cierre de la sesión.

---

## 🔴 Crítico — hacer antes del próximo deploy

### 1. Pushear la rama `fix/pnpm-hoisting` a GitHub

El commit `1b74bbce` existe localmente pero **no está en GitHub**.

**Cómo:** Abrir el panel Git del editor → Push → rama `fix/pnpm-hoisting`

Si falla por credenciales: en Replit, ir a Configuración → Conectar cuenta de GitHub.

---

### 2. Mergear `fix/pnpm-hoisting` → `main`

Una vez pusheado, abrir el PR en GitHub y mergearlo.

**Por qué urgente:** Vercel auto-deploya desde `main`. Hasta que no esté el merge, `clientum.com.ar` no recibe:
- El fix del `api/tsconfig.json` (TypeScript en Vercel)
- El nuevo `.env.example`
- El CI workflow
- `docs/ARCHITECTURE.md`

---

### 3. Rotar la contraseña de Neon

La contraseña `npg_VQvXb6sPOK0p` quedó expuesta en una captura de pantalla de una sesión anterior.

**Cómo:** Neon Console → proyecto → Settings → Reset password → actualizar `DATABASE_URL` en Replit Secrets y en las variables de Vercel.

---

## 🟡 Importante — hacer pronto

### 4. Limpiar `REPLIT_DEPLOYMENT` en Replit Secrets

El secret `REPLIT_DEPLOYMENT` tiene guardado el valor de una Gemini API key vieja (configuración incorrecta de una sesión anterior).

**Cómo:** Replit → Secrets → `REPLIT_DEPLOYMENT` → eliminar el valor (o setearlo a `true` si es necesario para alguna lógica).

---

### 5. Verificar `APP_URL` en Vercel

Confirmar que `APP_URL` en las variables de entorno de Vercel apunta a `https://www.clientum.com.ar` y NO a `localhost` o al dominio `.replit.dev`.

**Dónde:** Vercel Dashboard → proyecto clientum → Settings → Environment Variables.

---

### 6. Verificar `NEON_PROJECT_ID` en GitHub repo variables

El workflow `.github/workflows/neon_workflow.yml` lo lee como `vars.NEON_PROJECT_ID` (variable de repositorio, no secret). Confirmar que está seteado.

**Dónde:** GitHub → repo clientumlatam → Settings → Secrets and variables → Actions → Variables.

---

## 🟢 Validación post-merge

Una vez que `fix/pnpm-hoisting` esté mergeado en `main`:

- [ ] El CI de GitHub Actions (`ci.yml`) corre automáticamente — verificar que pasa (`tsc --noEmit` + `vite build`)
- [ ] Vercel inicia un deploy desde `main` — verificar que termina sin errores
- [ ] Verificar login en `https://www.clientum.com.ar` — las cookies deben funcionar (fix de `Cache-Control: no-store` ya estaba en `main`)

---

## 📝 Notas de infraestructura para futuras sesiones

- **Rama de trabajo activa:** `fix/pnpm-hoisting` (hasta que se mergee)
- **Vercel** auto-deploya desde `main` vía integración GitHub — no se necesita workflow adicional
- **Documentación técnica completa:** `docs/ARCHITECTURE.md`
- **Resumen de arquitectura en memoria:** `.agents/memory/clientum-architecture.md`
- **El push HTTP desde Replit** requiere que la cuenta GitHub esté conectada en Configuración de Replit
