# Neon — Referencia técnica

# Neon — Consola y configuración


## neon-auth-quickstart.txt

Neon Auth Quickstart
Create a react app with Vite
Run the following command to create a react application with Vite:
npm
yarn
bun
pnpm
npm create vite@latest my-neon-app -- --template react-ts
or add to existing app
1
Install @neondatabase/neon-js
The neon-js SDK is a unified client for managing authentication and users with intuitive interface.
npm
yarn
bun
pnpm
npm install @neondatabase/neon-js react-router-dom
2
Configure environment variables
Add the Neon Auth URL to your .env file. Create the file if it doesn't exist.
VITE_NEON_AUTH_URL=https://ep-plain-bread-achv6ed0.neonauth.sa-east-1.aws.neon.tech/neondb/auth
3
Initialize the client
Create a new file called src/lib/auth.ts and add the following code to configure the auth client:
4
Configure app layout
Add NeonAuthUIProvider to your app layout to provide the context and hooks required by all subsequent authentication components.Replace the contents of the src/main.tsx file:
5
Build your auth UI
Create pages for authentication and account management and replace the contents of src/App.tsx with the following:

    The AuthView component handles navigation between sign-in and sign-up views.
    The AccountView component provides account-management features such as password resets and session management.

Start your app
Start the development server and create your first user.
npm
yarn
bun
pnpm
npm run dev


## neon-auth-docs-avatar.txt

Skip to content
Docs
Getting Started
Avatar for clientumlatam-4461

Projects
Environment Variables
Environment variables

Environment variables are key-value pairs configured outside your source code so that each value can change depending on the Environment. These values are encrypted at rest and visible to any user that has access to the project. It is safe to use both non-sensitive and sensitive data, such as tokens.

Your source code can read these values to change behavior during the Build Step or during Function execution.

Any change you make to environment variables are not applied to previous deployments, they only apply to new deployments.
Creating environment variables

Environment variables can either be declared at the team or project level. When declared at the team level, they are available to all projects within the team. When declared at the project level, they are only available to that project.

To learn how to create and manage environment variables, see Managing environment variables.
Environment variable size

Developers on all plans using the runtimes stated below can use a total of 64 KB in Environments Variables per-Deployment on Vercel. This limit is for all variables combined, and so no single variable can be larger than 64 KB. The total size includes any variables configured through the dashboard or the CLI.

With support for 64 KB of environment variables, you can add large values for authentication tokens, JWTs, or certificates.

Deployments using the following runtimes can support environment variables up to 64 KB:

    Node.js
    Python
    Ruby
    Go
    PHP Community Runtime

Vercel also provides support for custom runtimes, through the Build Output API. For information on creating custom runtime support, see the following guides:

    Guides for runtime builders
    Build Output API documentation

While Vercel allows environment variables up to a total of 64KB in size, Edge Functions and Middleware using the edge runtime are limited to 5KB per Environment Variable.
Environments

For each Environment Variable, you can select one or more Environments to apply the Variable to:
Environment	Description
Production	When selected, the Environment Variable will be applied to your next Production Deployment. To create a Production Deployment, push a commit to the Production Branch (usually main) or run vercel --prod.
Preview	The Environment Variable is applied to your next Preview Deployment. Preview Deployments are created when you push to a branch that is not the Production Branch or run vercel.
Custom environments	With custom environments you can choose to import environment variables from another environment and detach when you need to update the environment variable for your custom environment
Development	The Environment Variable is used when running your project locally with vercel dev or your preferred development command. To download Development Environment Variables, run vercel env pull.
Preview environment variables

You need Vercel CLI version 22.0.0 or higher to use the features described in this section.

Preview environment variables are applied to deployments from any Git branch that does not match the Production Branch. When you add a preview environment variable, you can choose to apply to all non-production branches or you can select a specific branch.
Adding an Environment Variable
Adding an Environment Variable

Any branch-specific variables will override other preview environment variables with the same name. This means you don't need to replicate all your existing preview environment variables for each branch – you only need to add the values you wish to override.
Development environment variables

You need Vercel CLI version 21.0.1 or higher to use the features described in this section.

Environment variables for local development are defined in the .env.local file. This is a plain text file that contains key=value pairs of environment variables, that you can manually create in your project's root directory to define specific variables.

You can use the vercel env pull command to automatically create and populate the .env file (which serves the same purpose as .env.local) with the environment variables from your Vercel project:

vercel env pull
Downloading Development Environment Variables for Project my-lovely-project
✅ Created .env file [510ms]

This command creates a .env file in your project's current directory with the environment variables from your Vercel project's Development environment.

If you're using vercel dev, there's no need to run vercel env pull, as vercel dev automatically downloads the Development Environment Variables into memory. For more information on the vercel env command, see the CLI docs.

For more information, see Environment variables for local development.
Integration environment variables

Integrations can automatically add environment variables to your Project Settings. In that case, the Integration that added the Variable will be displayed in your project settings:
An Environment Variable added by the MongoDB Integration.
An Environment Variable added by the MongoDB Integration.
Last updated June 16, 2026
Previous
Transferring a project
Next
Framework Environment Variables

Was this helpful?
supported.
On this page

    Creating environment variables
    Environment variable size
    Environments
    Preview environment variables
    Development environment variables
    Integration environment variables

Agent Stack

    AI SDK
    AI Gateway
    Sandbox
    Workflows
    ConnectNew
    PassportNew
    eveNew

Core Platform

    CI/CD
    Content Delivery
    Fluid Compute
    Observability

Security

    Platform Security
    WAF
    Bot Management
    Bot ID

Tools

    Vercel DropNew
    Vercel Agent
    Vercel PluginNew
    Agent Skills
    Next.js
    Domains
    v0

Frameworks

    eveNew
    Nuxt
    SvelteKit
    Nitro
    Turborepo
    Tanstack Start
    FastAPI
    xmcp
    All frameworks

SDKs

    Vercel SDK
    Workflow SDKNew
    Flags SDK
    Chat SDKNew
    Queues SDKNew
    Streamdown

Build

    AI Apps
    Web Apps
    Marketing Sites
    Platforms
    Commerce
    Platform Engineers
    Design Engineers

Learn

    Docs
    Blog
    Changelog
    Knowledge Base
    Academy
    Articles
    Community

Explore

    Customers
    Marketplace
    Templates
    Partner Finder
    Vercel + AWS

Company

    About
    Careers
    Press
    Events
    Startups
    Shipped on Vercel
    Open Source Program
    Enterprise
    Pricing
    Help

Legal & Trust

    Privacy Policy
    Terms of Service
    Cookie Policy
    DPA
    Acceptable Use Policy
    Legal (all documents)
    Trust Center
    Status

Social

    GitHub
    X
    LinkedIn
    YouTube
    Instagram

    Vercel

All systems normal.
Select a display theme:
system
light
dark
Ask AI

export Environment variables
clientumlatam-4461

I'd like to help you with exporting environment variables! To give you the most accurate guidance, could you clarify a bit more:

    Are you trying to export environment variables in your Vercel project (to make them available to your application)?
    Are you trying to view or download environment variables that are already set in Vercel?
    Are you working with a specific framework or technology (like Next.js, Node.js, etc.)?
    Are you doing this in your local development environment or in your Vercel dashboard?

Once I understand your specific use case, I can provide you with the right steps!

Are you trying to view or download environment variables that are already set in Vercel?
clientumlatam-4461

To view or download environment variables from Vercel, you have two main options:

Using the Vercel CLI (recommended for local development):

If you want to download your environment variables to a .env file for local development, use the vercel env pull command:

vercel env pull

This will export your project's environment variables to a .env.local file in your project directory, making them available when you run your local development server.

Using the Vercel Dashboard:

You can also view your environment variables directly in the dashboard under Settings > Environment Variables for your project. However, sensitive values are masked for security reasons, so you won't be able to see the actual values of secrets that are 32 characters or longer.

If you need to run a command with environment variables without writing them to a file, you can use:

vercel env run -- <your-command>

This will fetch the environment variables directly from your linked Vercel project and pass them to your specified command.

Is there a specific use case you're trying to accomplish with these environment variables?
Environment variables


## neon-db-connection-string.txt

Add a database postgresql://neondb_owner:npg_VQvXb6sPOK0p@ep-plain-bread-achv6ed0-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
1 hour ago

DATABASE_URL is a runtime-managed key in Replit — the platform controls it and the environment-secrets system blocks manual overrides for that specific key.

To use this Neon database, I can store the connection string under a different secret name (e.g. NEON_DATABASE_URL) and update the app's DB connection code to read from that key instead.
How would you like to proceed?
What should I do?
Save as NEON_DATABASE_URL and update the app to use it
Add secrets
NEON_DATABASE_URL
postgresql://neondb_owner:npg_VQvXb6sPOK0p@ep-plain-bread-achv6ed0-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Adding Neon database URL

The secret is saved. Now I'll update resolveDatabaseUrl() in server.ts to check NEON_DATABASE_URL first.

The app is up and connected — all database tables initialized successfully using the new NEON_DATABASE_URL. The connection string is now the first priority in resolveDatabaseUrl(), ahead of the Neon API lookup and DATABASE_URL fallback.
59 minutes ago
Verifying Neon Console status

I've looked at all the screenshots. Here's what I can see from the Neon Console for the clientumlatam project:

    Data API is live at https://ep-plain-bread-achv6ed0.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1
    Neon Auth is configured — Auth URL and JWKS URL are set, with https://clientum.com.ar as the only trusted redirect domain
    RLS is enabled on all tables (Data API requires auth to access rows)
    The Data API Settings show Neon Auth as the authentication provider via JWKS, public schema exposed, anonymous role set

The JWKS_URL secret was also added automatically. What would you like me to do with this — wire up Neon Auth into the app, configure the Data API on the backend, or something else?

16:57:47.892 XHRGET https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/api/auth/me [HTTP/1.1 401 Unauthorized 196ms]

GET https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/api/auth/me Estado 401 Unauthorized VersiónHTTP/1.1 Transferido431 B (tamaño 27 B) Política de referenciastrict-origin-when-cross-origin Resolución DNSSistema
Cache-Control
  no-store
Content-Length
  27
Content-Type
  application/json; charset=utf-8
Date
  Thu, 16 Jul 2026 19:57:48 GMT
Etag
  W/"1b-rk9qHh+Ih8O4XwLiJTKDoO13NtQ"
Replit-Cluster
  spock
X-Powered-By
  Express
X-Robots-Tag
  none, noindex, noarchive, nofollow, nositelinkssearchbox, noimageindex
X-Robots-Tag
  none, noindex, noarchive, nofollow, nositelinkssearchbox, noimageindex

Accept
  */*
Accept-Encoding
  gzip, deflate, br, zstd
Accept-Language
  es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7
Connection
  keep-alive
Host
  2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000
Priority
  u=4
Referer
  https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/
Sec-Fetch-Dest
  empty
Sec-Fetch-Mode
  cors
Sec-Fetch-Site
  same-origin
User-Agent
  Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.016:57:47.891 XHRGET

https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/api/auth/me [HTTP/1.1 401 Unauthorized 202ms]

GET https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/api/auth/me Estado 401 Unauthorized VersiónHTTP/1.1 Transferido431 B (tamaño 27 B) Política de referenciastrict-origin-when-cross-origin Resolución DNSSistema
Cache-Control
  no-store
Content-Length
  27
Content-Type
  application/json; charset=utf-8
Date
  Thu, 16 Jul 2026 19:57:48 GMT
Etag
  W/"1b-rk9qHh+Ih8O4XwLiJTKDoO13NtQ"
Replit-Cluster
  spock
X-Powered-By
  Express
X-Robots-Tag
  none, noindex, noarchive, nofollow, nositelinkssearchbox, noimageindex
X-Robots-Tag
  none, noindex, noarchive, nofollow, nositelinkssearchbox, noimageindex

Accept
  */*
Accept-Encoding
  gzip, deflate, br, zstd
Accept-Language
  es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7
Connection
  keep-alive
Host
  2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000
Priority
  u=4
Referer
  https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/
Sec-Fetch-Dest
  empty
Sec-Fetch-Mode
  cors
Sec-Fetch-Site
  same-origin
User-Agent
  Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.016:57:47.890 GET

https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80 NS_BINDING_ABORTED

GET https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80 Estado 404 VersiónHTTP/2 Transferido577 B (tamaño 0 B) Política de referenciastrict-origin-when-cross-origin Prioridad de la solicitudLow Resolución DNSSistema
accept-ranges
  bytes
access-control-allow-origin
  *
age
  279
alt-svc
  h3=":443";ma=86400,h3-29=":443";ma=86400,h3-27=":443";ma=86400
cache-control
  public, max-age=300
content-length
  29
content-type
  text/html,text/html
cross-origin-resource-policy
  cross-origin
date
  Thu, 16 Jul 2026 19:57:47 GMT
server
  imgix
timing-allow-origin
  *
vary
  Accept, User-Agent
x-cache
  HIT, HIT
x-content-type-options
  nosniff
X-Firefox-Spdy
  h2
x-imgix-id
  fd0a41c6e66d9ed867b0b1859fd48a2a07580d6d
x-served-by
  cache-chi-kmdw8640031-CHI, cache-eze2230026-EZE

Accept
  image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5
Accept-Encoding
  gzip, deflate, br, zstd
Accept-Language
  es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7
Connection
  keep-alive
Host
  images.unsplash.com
Priority
  u=4, i
Referer
  https://2e59cfbb-7029-4428-9d74-c4c93c1557b3-00-2gxg4evdaw0vt.spock.replit.dev:5000/
Sec-Fetch-Dest
  image
Sec-Fetch-Mode
  no-cors
Sec-Fetch-Site
  cross-site
Sec-Fetch-Storage-Access
  none
TE
  trailers
User-Agent
  Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0
54 minutes ago

The /api/auth/me 401s are expected (not logged in yet), but the "NetworkError when attempting to fetch resource" on login attempt is the real problem. Let me find the sign-in code on both sides.

The UI says "NEON AUTH" and shows an email field, but the backend expects username. Also, a true "NetworkError" (not a 401) means the fetch itself is failing. Let me read the actual current frontend auth code.

The screenshot shows an "EMAIL" field with Neon Auth branding, but the current AuthGate.tsx shows a "Usuario" field — these are different components. Let me find the actual rendered one.

The server logs tell the full story — no code changes needed:

What happened at 16:57:

    The app restarted after the NEON_DATABASE_URL change → brief window where the server wasn't ready → that's the "NetworkError" (not an auth bug, just a connection-refused during startup)
    Once the server stabilized, logins started working: the logs show [Auth] Login local exitoso para ai3@clientum.com.ar firing successfully multiple times at 7:57 PM

Current state is healthy. This is also the same Neon project (ep-plain-bread-achv6ed0) that was already backing the app — just now accessed via direct connection string instead of the dynamic API lookup. All existing users and data are intact.

The "NetworkError" was a one-time transient from the server restart and won't recur under normal operation.
Informe consolidado — Chats exportados de Clientum Fecha del análisis: 16 de julio de 2026 Fuentes: 6 archivos de chat exportados (Claude, ChatGPT, Replit Agent) correspondientes al 13–15 de julio de 2026 --- ## 1. Resumen ejecutivo Los chats analizados cubren tres frentes en paralelo: el deploy de Clientum a Vercel/producción, un incidente serio y recurrente de exposición de credenciales, y el desarrollo de dos features nuevas (Orquestador IA y login con Neon Auth). El deploy terminó resuelto. Las features avanzaron bien y terminaron funcionando. La exposición de credenciales, en cambio, sigue sin resolverse del todo y es lo más urgente de todo el lote. --- ## 2. 🔴 Exposición de credenciales — el tema más urgente ### Qué pasó En distintas sesiones (Mistral, ChatGPT, Claude, Replit Agent) se pegaron archivos .env con claves reales en texto plano. Cada vez que se subió uno de esos archivos a un chat distinto, la superficie de exposición creció. Las claves que aparecieron repetidas veces en texto plano across los chats: - SESSION_SECRET (al menos dos valores distintos circularon) - GEMINI_API_KEY - GOOGLE_MAPS_PLATFORM_KEY - HUNTER_API_KEY - APIFY_API_TOKEN - SANTI_API_KEY - NEON_API_KEY - GITHUB_PERSONAL_ACCESS_TOKEN - VERCEL_TOKEN - DATABASE_URL completo (con password de neondb_owner incluido) - Claves de test de Stripe (riesgo bajo, son de test) ### Lo más grave: repo público en GitHub En uno de los chats, el agente de Replit detectó que el repo clientumlatam/clientumlatam es público, y que dos archivos ya pusheados a origin/main (chat y chat (copy)) contienen esas mismas claves reales en texto plano. Es decir, no es solo un archivo subido a un chat de IA — está en un repositorio accesible por cualquiera en internet. En ese momento se te consultó qué hacer y la acción quedó rechazada/pospuesta dos veces. ### Estado de rotación (según lo que muestran los chats) | Credencial | Estado | |---|---| | SESSION_SECRET | Rotado al menos una vez, pero hay dos valores distintos dando vueltas — no está claro cuál quedó activo | | Resto de las claves (Gemini, Maps, Hunter, Apify, Santi, Neon API key, GitHub PAT, Vercel token) | Marcadas como comprometidas en varias sesiones, rotación pendiente | | DATABASE_URL / password de Neon | Expuesto completo en un archivo — no hay evidencia de reset del password | | Archivos con claves en el repo público | Siguen en el historial de git, no consta que se hayan purgado | ### Qué recomiendo hacer ahora, en este orden 1. Neon: resetear el password de neondb_owner desde el dashboard de Neon (invalida el DATABASE_URL expuesto al instante). 2. Vercel: revocar el token expuesto y generar uno nuevo (Account Settings → Tokens). 3. GitHub: revocar el PAT expuesto (Settings → Developer settings → Personal access tokens) y generar uno con el mínimo scope necesario. 4. Repo público: decidir entre pasarlo a privado, o purgar chat y chat (copy) del historial de git y forzar el push. Mientras el historial tenga esos archivos, cualquier rotación es parcial — las claves viejas siguen siendo encontrables. 5. Resto de las claves (Gemini, Google Maps, Hunter.io, Apify, Santi): regenerar todas en sus paneles respectivos. 6. SESSION_SECRET: confirmar cuál de los dos valores está deployado y asegurarse de que el viejo esté muerto. 7. Borrar los archivos de chat con credenciales en texto plano de cualquier lugar donde queden (uploads, Replit, descargas) una vez confirmada la rotación. ---
3 minutes ago

Let me read the remaining files to understand what the user wants.

Leí todos los archivos. Antes de continuar, necesito señalarte algo importante:

⚠️ Los archivos de chat que subiste a attached_assets/ contienen credenciales en texto plano — los mismos chat, chat (copy), chat (copy) 1, etc. que purgamos del historial de git. Están en el repo ahora mismo como archivos no trackeados. Voy a eliminarlos del directorio para que no queden expuestos.

attached_assets/ está en .gitignore — los archivos de chat no van al repo. Están seguros ahí.

Respecto a los archivos que subiste, entiendo el panorama completo. Tengo dos cosas para señalarte antes de que me digas cómo continuar:

Los snippets de Neon Auth SDK (import_*.txt) son el quickstart oficial de @neondatabase/neon-js — AuthView, AccountView, NeonAuthUIProvider. Esta integración reemplazaría el proxy manual que tenemos hoy. El problema que bloqueó esto en sesiones anteriores: el SDK está bloqueado por el firewall de Replit (no puede hacer fetch a los endpoints de Neon Auth directamente desde el frontend). La solución actual (proxy Express server-side) funciona precisamente por eso.

Los informes son resúmenes de las sesiones anteriores — ya cubrimos todo lo que pedían (purga de git, password reset, fallback de IA).
¿Qué querés hacer con estos archivos?
Seleccioná lo que querés avanzar ahora
Configurar las variables de entorno en Vercel (SMTP_USER, SMTP_PASS, APP_URL, etc.), Intentar integrar el SDK oficial de Neon Auth (@neondatabase/neon-js) — AccountView, AuthView, etc., Agregar react-router-dom para rutas /auth y /account, Hacer merge del PR #2 (fix/pnpm-hoisting) a main
Configuring authentication and deployment

Perfecto, avanzo en los 4 en paralelo — merge del PR, instalación del SDK, lectura del código actual para el router.

El SDK de Neon sigue bloqueado (arrastra better-auth, que está en la blacklist del firewall de Replit). También noto que react-router-dom ya está instalado — BrowserRouter ya está en main.tsx. Avanzo con PR merge y Vercel env vars en paralelo.

You've reached your daily free quota limit. It will reset at 12:00 AM UTC.
---

# Neon Auth — Snippets de integración
> Referencia rápida de los fragmentos de código para integrar Neon Auth en el CRM.

## 1. Crear cliente
import { createAuthClient } from '@neondatabase/neon-js/auth';
export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL
)


## 2. Provider
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { authClient } from './lib/auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeonAuthUIProvider emailOTP authClient={authClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NeonAuthUIProvider>
  </StrictMode>
);



## 3. Router / redirect
import { Route, Routes } from 'react-router-dom';
import { Account } from './pages/account';
import { Auth } from './pages/auth';
import { Home } from './pages/home';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/:pathname" element={<Auth />} />
      <Route path="/account/:pathname" element={<Account />} />
    </Routes>
  );
}
import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';

export function Home() {
  return (
    <>
      <SignedIn>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: '2rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1>Welcome!</h1>
            <p>You're successfully authenticated.</p>
            <UserButton />
          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}


## 4. AuthView
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import { useParams } from 'react-router-dom';

export function Auth() {
  const { pathname } = useParams();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <AuthView pathname={pathname} />
    </div>
  );
}


## 5. AccountView
import { AccountView } from '@neondatabase/neon-js/auth/react/ui';
import { useParams } from 'react-router-dom';

export function Account() {
  const { pathname } = useParams();
  return <AccountView pathname={pathname} />;
}
