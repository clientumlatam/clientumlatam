# Vercel — Notas técnicas Clientum


## vercel-deploy-github-guia.txt


Deploying GitHub Projects with Vercel
Vercel for GitHub automatically deploys your GitHub projects with Vercel, providing Preview Deployment URLs, and automatic C…
Using private GitHub repositories with Vercel Sandbox
When using Vercel Sandbox with private repositories, you need to authenticate with a GitHub personal access token or Github…
Guide
Deploying Git Repositories with Vercel
Vercel allows for automatic deployments on every branch push and merges onto the production branch of your GitHub, GitLab, Bitbucket and…
Code Owners
are available on Enterprise plans As a company grows, it can become difficult for any one person to be familiar with the entire codebase
Integrations for Comments
Git provider integration Comments are available for projects using any Git provider
Git settings
Once you have connected a Git repository, select the Git menu item from your project settings page to edit your project's
List git repositories linked to namespace by provider (Vercel SDK)
GET /v1/integrations/search-repo Lists git repositories linked to a namespace id for a supported provider
Monitor Frontend Performance with DebugBear and Vercel: Send Reports to GitHub
If you use GitHub, DebugBear can report test results directly on your pull request
Guide
List git repositories linked to namespace by provider
GET /v1/integrations/search-repo Lists git repositories linked to a namespace id for a supported provider
Getting Started with Code Owners
ensure that the Vercel GitHub app has been installed for your team
Using the Go Runtime with Vercel Functions: Private packages
To install private packages with go get, add an Environment Variable named GIT_CREDENTIALS
Git Configuration: Github.enabled
The github.enabled property has been deprecated in favor of git.deploymentEnabled, which allows you to disable auto-deployments for your…
Deployment Checks: GitHub Checks
GitHub and GitHub Actions have edge cases with status reporting
How to Build a Fullstack App with Next.js, Prisma, and Postgres
ou configured on GitHub: http://localhost:3000/api/auth .env # GitHub OAuth GITHUB_ID=6bafeb321963449bdf51 GITHUB_SECRET=509…
Guide
Git Configuration: Github.autoJobCancelation
Type: Boolean
Using private GitHub repositories with Vercel Sandbox: Classic personal access token
Classic tokens work similarly to fine-grained tokens but with broader scope
Guide
Run and track deploys from Slack: Configure GitHub
Create a fine-grained personal access token for the target repository with these permissions: Actions: read and write Contents: read Issues: write Pul…
Guide
Working with Vercel's private registry: Setting up your CI provider
The instructions below are for GitHub Actions, but configuring other CI providers should be similar: Create a Vercel authentication token…
Deploying GitHub Projects with Vercel: Silence GitHub comments
By default, comments from the Vercel GitHub bot will appear on your pull requests and commits
Bot Management
s/model-endpoints/webhooks/#_top) geedoproductsearchbot ecommerce GeedoProductSearch is a web crawler operated by Geedo SIA that indexes product infor…
Deploying GitHub Projects with Vercel: Using GitHub Actions
You can use GitHub Actions to build and deploy your Vercel Application
Integrations for Comments: Adding Comments to your issue tracker
is available on all plans Any member of your team can covert comments to an issue in Linear, Jira, or GitHub
Deploying Git Repositories with Vercel: Deploying a Git repository
Setting up your GitHub, GitLab, or Bitbucket repository on Vercel is only a matter of clicking the "New Project" button on the top right…
Trusted Sources: Add a GitHub Actions service
For GitHub, the dashboard offers a guided form so you don't write claims by hand: Go to Settings and select Deployment Protection
Getting Started with Code Owners: Setting up Code Owners in your repository
A GitHub App enables Code Owners functionality by adding reviewers and enforcing

## vercel-deploy-assessment-replit.txt

10 hours ago
Assessing deployment process

I can see the Vercel deployment screenshot showing your project being imported from GitHub (clientumlatam/remix-editor-de-brochure-clientumzip22-122). What would you like me to help with?
What would you like me to do with this?
What are you trying to accomplish?
Help configure something for Vercel deployment

The Vercel UI detected the project as "Astro" — that's wrong, it's a React + Express app. You'll need a vercel.json to tell Vercel the correct build settings and how to route requests to the Express backend. Let me look at server.ts to understand how it's structured before generating the config.

All API routes register at module level — only setupServer() calls app.listen(). I need to:

    Export app and the DB init functions from server.ts
    Create api/index.ts as the Vercel serverless entry point
    Create vercel.json

Now I have everything I need. Here's the plan:

    Export app and the init functions from server.ts
    Create api/index.ts as the Vercel serverless entry
    Create vercel.json with correct framework (not Astro), build command, and routing

Three files are set up. Here's what changed and what you need to do on the Vercel side:

What was configured:

    vercel.json — overrides the framework to null (removes the wrong Astro detection), sets build to vite build, routes /api/* to the Express serverless function, and serves the SPA dist/ for everything else.
    api/index.ts — the serverless entry point: imports the Express app (all routes are already wired at module level in server.ts) and runs the DB table initialisation on cold start.
    server.ts — now exports app and the init functions, and only calls app.listen() when VERCEL env var is absent (i.e., local/Replit dev is unaffected).

On Vercel, before deploying:

    Change the Application Preset from "Astro" → "Other" (the vercel.json will override it, but setting it to Other avoids confusion).

    Add these Environment Variables under "Environment Variables" in the Vercel UI:
    Key	Required
    DATABASE_URL	✅ PostgreSQL connection string
    SESSION_SECRET	✅ Any long random string
    GEMINI_API_KEY	✅ For all AI features
    APIFY_API_TOKEN	Optional
    GOOGLE_MAPS_PLATFORM_KEY	Optional
    SANTI_API_KEY	Optional

    Push the changes to your GitHub repo — Vercel will pick them up and rebuild.

docs/clientum-exports/wordpress/plugins/ai-marketing-expert-v2
10 hours ago
Observing app functionality

I can see the app is running fine in the Replit preview. Your message seems to have been cut off after docs/clientum-exports/wordpress/plugins/ai-marketing-expert-v2 — what were you trying to share or ask about?
10 hours ago

This is the readme for your AI Marketing Expert WordPress plugin. What would you like to do with it?
What do you need help with for this plugin?
What are you trying to do?
Integrate the chatbot/lead capture with Clientum CRM

Copiloto IA en sidebar a la derecha como la de replit que subo ahora, y se llama Asistente IA
5 hours ago
Addressing vulnerabilities and implementing features

Three things to do in parallel: fix phpseclib (task #1), fix the ENOSPC crash, and build the "Asistente IA" copilot sidebar. Let me start exploring the current app structure while fixing the dependency:

Let me grab the key files I need in parallel to build the copilot sidebar:

Let me get the key structural context I need for the copilot sidebar and fix everything in parallel:

Let me look at the dashboard header and overall layout, then build everything:

Now I have everything I need. Let me build the Asistente IA copilot, fix the ENOSPC crash, restart the workflow, and complete task #1 — all in parallel:

Now I need to: add the backend assistantChat action, integrate the panel into the dashboard, restart the workflow, and mark task #1 complete — all in parallel:

Now I'll integrate the panel into the dashboard while restarting the workflow and finalizing task #1 in parallel:

Server is running clean. Let me take a screenshot to verify the app and Asistente IA, then mark task #1 complete:
Committing phpseclib fix

The reviewer wants only the phpseclib fix committed — separately from the feature work. Let me commit just that change, then mark complete:
1 shape
5 hours ago
Investigating missing app feature

The screenshots show production bugs at clientum.com.ar — "No autenticado" on ICP Builder and Google Maps API validation. Let me diagnose and fix both in parallel:

You've reached your monthly free quota limit. It will reset on August 12, 2026.
Fix 2 dependency vulnerabilities

Fix the following dependency vulnerabilities:

    [High] phpseclib/phpseclib@3.0.48.0 (CVE-2026-32935@phpseclib/phpseclib-3.0.48.0)
    [High] phpseclib/phpseclib@3.0.48.0 (CVE-2026-44167@phpseclib/phpseclib-3.0.48.0)

Check my app for bugs
1 hour ago

cuando lo publico al replit publico no autentica usuarios no andan las secret kes
1 hour ago
Examining deployment failure logs
Configuring Replit secrets
Diagnosing proxy authentication
Comparing secret handling
$ cd /home/runner/workspace && grep -n "trust proxy\|app.set" server.ts | head
(no output)
Examining runtime secret management
Observing deployment status
Examining server configuration details
Analyzing server setup
Syncing environment variables
¿Dónde estás publicando la app — con el botón "Publish/Deploy" de Replit, o con el deploy en Vercel (clientum.com.ar) que se configuró en una sesión anterior?
Plataforma de publicación
Vercel (clientum.com.ar)
Diagnosing Vercel deployment issues
Accessing internal-only resources

Encontré la causa raíz. La app usa la base de datos Postgres integrada de Replit, cuya URL de conexión apunta a un host interno (helium) que solo es accesible dentro de la red de Replit. Cuando el deploy corre en Vercel, las funciones serverless no pueden alcanzar esa base — por eso fallan el login/sesión (la tabla users y session viven ahí) y probablemente por eso ven "no autentica usuarios".

Además, los "secrets" de Replit (SESSION_SECRET, GEMINI_API_KEY, etc.) no se replican automáticamente a Vercel — hay que copiarlos a mano en el panel de Vercel como variables de entorno; si falta alguno, esas funciones fallan también.

Dos caminos para arreglarlo:
¿Cómo preferís resolver el problema de base de datos + secrets en producción?
Camino a seguir
Seguir con Vercel (clientum.com.ar)
Time worked
42 seconds
Work done
3 actions
Investigating database integrations
Searched integrations for "postgres" — 0 results
Setting up external database
Configuring SSL for databases
Restarting and checking logs

I should restart the workflow to make sure the SSL change didn't introduce any issues, and check the logs to see what's happening.
Restarted workflow Start application
Confirming SSL safe

The server started successfully with the SSL changes, confirming the modification is safe for Replit's current setup. Now I'll provide clear, step-by-step instructions for the Vercel deployment since that's where they want to go, and I should capture this as a useful memory note about handling Vercel with Replit databases.

Ya arreglé la parte que sí controlo desde acá — el código de conexión a la base ahora soporta SSL, requerido por bases externas tipo Neon/Supabase (antes solo funcionaba con la config interna de Replit). El resto del arreglo requiere que lo hagas en el panel de Vercel, porque yo no tengo acceso a esa plataforma. Necesitás dos cosas:

1. Base de datos pública nueva (la actual es interna de Replit y Vercel no puede alcanzarla):

    Creá una base gratis en Neon o Supabase (2 minutos, solo con email).
    Copiá el connection string que te dan — va a incluir ?sslmode=require (eso ya lo soporta el código).

2. Variables de entorno en Vercel — Project Settings → Environment Variables → agregar para "Production":
Variable	Valor
DATABASE_URL	el connection string nuevo de Neon/Supabase
SESSION_SECRET	cualquier string largo random
GEMINI_API_KEY	tu clave de Gemini
GOOGLE_MAPS_PLATFORM_KEY	tu clave de Google Maps
HUNTER_API_KEY	tu clave de Hunter
APIFY_API_TOKEN	tu clave de Apify
SANTI_API_KEY	tu clave de Santi

Después de guardarlas, hacé un redeploy en Vercel (push a GitHub o "Redeploy" desde el dashboard). Como la base es nueva y vacía, el primer usuario que se registre va a quedar como admin automáticamente (así está la lógica actual).

Una vez que tengas el connection string nuevo, avisame y te ayudo a verificar que las tablas se creen bien y probar el login.
13 minutes ago
Finalizing security remediation
Verifying and finalizing
Committing security fixes
Skipping irrelevant log check
Verifying successful creation
Monitoring deployment and logs

6:55:26 AM [vite] (client) page reload docs/chat.md
6:55:26 AM [vite] (client) page reload .local/state/workflow-logs/thDORdKnXtlJGnnHt3fIh/start_application.shell.exec.0
6:55:26 AM [vite] (client) page reload SECRETS.md
6:55:26 AM [vite] (client) page reload .local/state/workflow-logs/thDORdKnXtlJGnnHt3fIh/start_application.shell.exec.0
6:55:37 AM [vite] (client) page reload docs/sesiones/analisis-docs-sesion.txt
6:55:37 AM [vite] (client) page reload .local/state/workflow-logs/thDORdKnXtlJGnnHt3fIh/start_application.shell.exec.0
6:55:58 AM [vite] (client) page reload .replit
6:55:58 AM [vite] (client) page reload .local/state/workflow-logs/thDORdKnXtlJGnnHt3fIh/start_application.shell.exec.0
6:55:58 AM [vite] (client) page reload .replit.new
6:55:58 AM [vite] (client) page reload .local/state/workflow-logs/thDORdKnXtlJGnnHt3fIh/start_application.shell.exec.0





















$ sleep 45 export VERCEL_TOKEN='vcp_0xp3oaYMyWGWTtn0iRpzWjKjBvp1f1oEXWm8AVUARzTna4WV8L0YMSEP' npx --yes vercel ls clientumlatam --token="$VERCEL_TOKEN" 2>&1 | tail -10

A new build está en curso ("Building"). Voy a esperar a que termine y verificar que el sitio ya cargue bien.

Local dev sigue funcionando bien. Voy a empujar el fix a GitHub y esperar el nuevo build de Vercel.
Monitoring automated build deployment
$ export VERCEL_TOKEN='vcp_0xp3oaYMyWGWTtn0iRpzWjKjBvp1f1oEXWm8AVUARzTna4WV8L0YMSEP' for i in 1 2 3 4 5 6 7 8; do sleep 15 OUT=$(npx --yes vercel ls clientumlatam --token="$VERCEL_TOKEN" 2>&1) LINE=$(echo "$OUT" | grep -m1 "aa204df9\|Building\|Queued" ) echo "check $i:"; echo "$OUT" | head -5 echo "$OUT" | head -5 | grep -q "Ready\|Error" && break done
Cancelled: cancelled by client

clientumlatam 10 DATABASE_URL Development 54s ago DATABASE_URL_UNPOOLED Development 54s ago DATABASE_URL_UNPOOLED Production 54s ago APIFY_API_TOKEN Sensitive Production and Preview 1h ago DATABASE_URL Sensitive Production and Preview 1h ago GEMINI_API_KEY Sensitive Production and Preview 1h ago GOOGLE_MAPS_PLATFORM_KEY Sensitive Production and Preview 1h ago HUNTER_API_KEY Sensitive Production and Preview 1h ago SANTI_API_KEY Sensitive Production and Preview 1h ago SESSION_SECRET Sensitive Production and Preview 1h ago
5 minutes ago
Checking deployment status
Analyzing failed deployment logs
Investigating postinstall script timeouts
Installing devDependencies
Removing unused dependency
Regenerating package-lock.json
Analyzing installation failure
Removing Playwright from lockfile

Playwright quedó eliminado del lockfile. Ahora hago commit y empujo el fix.
$ cd /home/runner/workspace git add -A git commit -m "Remove unused playwright dependency (was hanging npm install on Vercel)" 2>&1 | tail -5 git push "https://clientumlatam:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/clientumlatam/clientumlatam.git" clean-main:main 2>&1 | sed "s/${GITHUB_PERSONAL_ACCESS_TOKEN}/***TOKEN***/g"
Skipping header, targeting data

You've reached your daily free quota limit. It will reset at 12:00 AM UTC.

## vercel-dashboard-overview.txt

Skip to content

Overview

Deployments

Logs

Analytics

Speed Insights

Observability

Firewall

CDN

Environment Variables

Domains

Connect

Beta

Integrations

Storage

Flags

Agent

AI Gateway

Sandboxes

Workflows

Images

Beta

Usage

Support

Settings

Vercel Agent

Code reviews that catch bugs before they reach production.

Deployments

3iKAY2X8b

DeploymentLogsResourcesSourceOpen Graph

Deployment Details

Build Failed

Command "vite build" exited with 127

Created

clientumlatam-446160m ago

Status

ErrorStale

Duration

1m 17s58m ago

Environment

Production

Domains

clientumlatam-git-main-clientumlatam-4461s-projects.vercel.app

clientumlatam-377uwox4n-clientumlatam-4461s-projects.vercel.app

Source

main

3eadf89Unify Replit dev and Vercel prod on Neon Postgres (resolve connection via Neon API)

Deploy Logs

1m 17s

17 lines

CtrlF

Running build in Washington, D.C., USA (East) – iad1

Build machine configuration: 2 cores, 8 GB

Cloning github.com/clientumlatam/clientumlatam (Branch: main, Commit: 3eadf89)

Previous build caches not available.

Cloning completed: 2.716s

Running "vercel build"

Vercel CLI 55.0.0

Error: Node.js version 20.x is deprecated. Deployments created on or after 2026-10-01 will fail to build. Please set Node.js Version to 24.x in your Project Settings to use Node.js 24.

Running "install" command: `npm ci --no-audit --no-fund`...

npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.

npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

npm error Exit handler never called!

npm error This is an error with npm itself. Please report this error at:

npm error <https://github.com/npm/cli/issues>

npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-07-14T09_28_52_024Z-debug-0.log

sh: line 1: vite: command not found

Error: Command "vite build" exited with 127

Deployment Summary

Deployment Checks

No checks configured

Use events or statuses from your checks provider to determine when a deployment is promoted to Production.

Assigning Custom Domains

Runtime Logs

View and debug runtime logs & errors

Observability

Monitor app health & performance

Speed Insights

Not Enabled

Performance metrics from real users

Web Analytics

Not Enabled

Analyze visitors & traffic in real-time

clientumlatam – Deployment Overview – VercelSkip to content

Overview

Deployments

Logs

Analytics

Speed Insights

Observability

Firewall

CDN

Environment Variables

Domains

Connect

Beta

Integrations

Storage

Flags

Agent

AI Gateway

Sandboxes

Workflows

Images

Beta

Usage

Support

Settings

Vercel Agent

Code reviews that catch bugs before they reach production.

Deployments

Chf9JZjH3

DeploymentLogsResourcesSourceOpen Graph

Deployment Details

Build Failed

Command "npm install --no-audit --no-fund" exited with 1

Created

clientumlatam-44613m ago

Status

ErrorLatest

Duration

1m 17s2m ago

Environment

Production

Domains

clientumlatam-git-main-clientumlatam-4461s-projects.vercel.app

clientumlatam-j0mb2wccc-clientumlatam-4461s-projects.vercel.app

Source

main

32fa42bFix Vercel build: avoid npm ci bug, bump Node engine to 22.x

Deploy Logs

1m 17s

13 lines

CtrlF

07:25:35.275

 

Running build in Washington, D.C., USA (East) – iad1

07:25:35.276

 

Build machine configuration: 2 cores, 8 GB

07:25:35.294

 

Cloning github.com/clientumlatam/clientumlatam (Branch: main, Commit: 32fa42b)

07:25:35.296

 

Skipping build cache, deployment was triggered without cache.

07:25:37.928

 

Cloning completed: 2.633s

07:25:38.279

 

Running "vercel build"

07:25:38.297

 

Vercel CLI 55.0.0

07:25:40.140

 

Running "install" command: `npm install --no-audit --no-fund`...

07:26:51.415

 

npm error Exit handler never called!

07:26:51.416

 

npm error This is an error with npm itself. Please report this error at:

07:26:51.416

 

npm error <https://github.com/npm/cli/issues>

07:26:51.417

 

npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-07-14T10_25_40_274Z-debug-0.log

07:26:51.451

 

Error: Command "npm install --no-audit --no-fund" exited with 1

Deployment Summary

Deployment Checks

Assigning Custom Domains

Runtime Logs

View and debug runtime logs & errors

Observability

Monitor app health & performance

Speed Insights

Not Enabled

Performance metrics from real users

Web Analytics

Not Enabled

Analyze visitors & traffic in real-time

clientumlatam – Deployment Overview

07:26:00

## vercel-seguridad-overview.txt


Vercel security overview
Cloud-deployed web applications face constant security threats, with attackers launching millions of malicious attacks weekly
Vercel CLI Overview
Vercel gives you multiple ways to interact with and configure your Vercel Projects
Vercel Workflows
Vercel Workflows is a fully managed platform for building durable applications and AI agents in JavaScript, TypeScript, and Python
Vercel deploy
The vercel deploy command deploys Vercel projects, executable from the project's root directory or by specifying a path
Redis on Vercel
Vercel lets you connect external Redis databases through the Marketplace, allowing you to integrate high-performance caching and real-tim…
Getting started with Vercel
Deploy your app on Vercel in three steps: install the CLI, add agent support if you use an AI coding agent, and deploy
Postgres on Vercel
Vercel lets you connect external Postgres databases through the Marketplace, allowing you to connect external Postgres databases to your…
Deploying to Vercel
Every time your project builds successfully, Vercel creates a deployment with its own URL
Deploying Git Repositories with Vercel
Vercel allows for automatic deployments on every branch push and merges onto the production branch of your GitHub, GitLab, Bitbucket and…
Vercel vs Render
Vercel and Render are both cloud platforms that simplify web deployment through automated CI/CD, managed infrastructure, and zero-configu…
Guide
Environments
Vercel provides three default environments—Local, Preview, and Production: Local Development: developing and testing code changes on your…
Vercel vs Fastly: Get started with Vercel
Both Vercel and Fastly deliver web content globally with different tradeoffs
Guide
Vercel vs Northflank: Get started with Vercel
Vercel gives you global delivery, framework-aware caching, built-in security, and AI infrastructure that work together from the first dep…
Guide
Integrating Vercel and Kubernetes
luate whether specific backend services could also benefit from a serverless architecture and be migrated to Vercel
Shared Responsibility Model: Vercel responsibilities
Infrastructure: Vercel is responsible for the security and availability of the underlying infrastructure used to provide our services
Vercel vs Railway: Get started with Vercel
If your project needs global delivery, framework-aware caching, built-in security, and AI infrastructure working together without manual assembly, <ma…
Guide
Vercel vs Akamai: Platform deep dive
Vercel solves infrastructure problems that matter for teams building full-stack applications, performance-critical systems, and AI-powere…
Guide
Getting started with Vercel: Next steps
Fundamental concepts – How requests, builds, and compute work on Vercel Set up environment variables Add a custom domain Explore supporte…
Vercel Integrations
The cloud platform for generative AI AI Wix Integrate with robust business solutions Commerce Xata Deploy preview branches of your database Storage
Deploy a Celery app on Vercel: Local development
Use vercel dev to run the web application and Celery subscriber locally: terminal vercel dev starts both your web applicatio…
Vercel CLI Overview: Routes
Manage project-level routing rules for your Vercel Project
Getting started with Vercel: Add a database or other storage
If your project needs a database, blob storage, or another backing service, you can provision one from the CLI and have Vercel wire the c…
How requests flow through Vercel: How Vercel executes server-side code
When a request requires dynamic data, personalization, or server-side logic, the proxy forwards it to the Compute Layer
Deploy a Flask app on Vercel: Vercel Functions
When you deploy a Flask app to Vercel, it becomes a single Vercel Function

## vercel-replicate-integration.txt


Vercel Replicate IntegrationConnectable Account
Replicate provides a platform for accessing and deploying a wide range of open-source artificial intelligence models
Resource REPL
APIs & SDKs Marketplace Partner API Optional POST/v1/installations/{installationId}/resources/{resourceId}/repl The REPL is a command-line interface o…
Vercel Replicate IntegrationConnectable Account: Some available models on Replicate
Blip Type: Image Generate image captions Flux 1.1 Pro Type: Image Faster, better FLUX Pro
Update Resource: Response
200Return the updated resource idstringRequired The partner-specific ID of the resource productIdstringRequired The partner-specific ID/slug of the pr…
Retrieve a list of projects
"koa", "mastra", "middleman", "nestjs", "nextjs", "nitro", "node", "nuxtjs", "parcel", "polymer", "preact", "python", "react-router", "redwoodjs", "re…
Create a new deployment: Responses
ected", "maxLength": 256, "nullable": true }, "rootDirectory": { "type": "string", "description": "The name of a directory or relative path to the sou…
Create a connector: Responses
"required": [ "appId", "appSlug", "appName", "clientId" ], "properties": { "appId": { "type": "integer" }, "appSlug": { "type": "string" }, "appName":…
Structured Outputs: Response format
ream: for text in stream.text_stream: full_json += text recipe = json.loads(full_json) print(recipe['name'], recipe['cuisine']) { "id": "msg_123", "ty…
Update an existing project
Group operations are included.", "enum": [ "create", "delete", "list", "read", "update" ] } }, "integrationStrict": { "type": "array", "items": { "typ…
Programmatic Domain Management
The domains registrar API enables you to programmatically manage your domain lifecycle from search to renewal
Building a Slack agent with durable workflows
z } from "zod"; type HookEvent = { type: "reply"; text: string } { type: "confirm" } { type: "cancel" }; export async function draftRefinementWorkflow…
Guide
Update a Team: Responses
} } } } } ```
Create one or more environment variables: Responses
} ] } } ] } ```
Run and track deploys from Slack: Slash command and permissions
The bot registers a /deploy slash command with two paths
Guide
Update a Team
gingPrefix": { "type": "string", "description": "The prefix that is prepended to automatic aliases." }, "resourceConfig": { "type": "object", "propert…
Put Firewall Configuration: Responses
"type": "object", "required": [ "name", "active", "conditionGroup" ] } }, { "type": "object", "additionalProperties": { "type": "object", "required":…
Supported domains
.ws Yes Yes .wtf Yes Yes .xn--3ds443g Yes No .xn--5tzm5g Yes Yes .xn--6frz82g Yes Yes .xn--80asehdb Yes No .xn--80aswg Yes No .xn--9dbq2a Yes Yes .xn-…
Create a new project
roup operations are included.", "enum": [ "create", "delete", "list", "read", "update" ] } }, "integrationStrict": { "type": "array", "items": { "type…
Create a new Drain: Responses
"enum": [ "hive" ] }, "roleArn": { "type": "string" }, "region": { "type": "string" }, "serverSideEncryption": { "type": "string", "enum": [ "AES256",…
Update an existing project: Responses
ntifier for the dismissed toast" }, "dismissedAt": { "type": "number", "description": "unix timestamp representing the time the toast was dimissed" },…
Upload a project avatar
ncluded.", "enum": [ "create", "delete", "list", "read", "update" ] } }, "integrationStrict": { "type": "array", "items": { "type": "string", "descrip…
Building AI apps on Vercel: an overview: Add context
By default, models don't remember past interactions or know anything about your user
Guide
Drain Audit Logs to S3: Getting started with Audit Logs to S3
Before you configure the drain, make sure you have: Access to create or update an S3

## vercel-storage-marketplace.txt

lts
Storage on Vercel Marketplace
Marketplace Storage Integrations are available on all plans The Vercel Marketplace provides integrations with different storage providers to provision…
Interact with Integrations using Agent Tools
Agent Tools are available on Enterprise and Pro plans With Agent Tools, you can interact with your installed integrations through a chat interface in…
Postgres on Vercel
Vercel lets you connect external Postgres databases through the Marketplace, allowing you to connect external Postgres databases to your Vercel projec…
Vercel Storage
A suite of managed, serverless storage products that integrate with your frontend framework
How to reset a secret for a Neon integration
When you reset the Neon database secret, the current one will immediately stop working
Guide
Vercel Storage: Marketplace Storage
is available on all plans The Vercel Marketplace connects you with storage providers like Neon, Upstash, and Supabase
Add a Native Integration
Native Integrations are available on all plans All plans, including Enterprise, can install the integrations through a self-service workflow
Storage on Vercel Marketplace: From the CLI
Use vercel install (or its full form, vercel integration add) to provision a resource without leaving your terminal: terminal The command installs the…
Vercel install
vercel install (alias: vercel i) is an alias for vercel integration add
Getting started with Vercel: Add a database or other storage
If your project needs a database, blob storage, or another backing service, you can provision one from the CLI and have Vercel wire the credentials in…
Build a Claude Managed Agent on Vercel
Claude Managed Agents gives you a fully managed agent runtime
Guide
Vercel vs Netlify: Best use cases for Netlify
Advanced deployment and collaboration Shipping to production safely requires more than just pushing code
Guide
Vercel integration: Options
Option Shorthand Description --plan -p Billing plan ID for integrations that support installation-level billing plans
Vercel integration: Post-provisioning behavior
--no-claim If the new resource is a sandbox, skip the offer to claim it and instead print a hint about how to claim it later

Update the microfrontends settings: 200: No description
Content-Type: application/json ```json { "type": "object", "required": [ "accountId", "alias", "defaultResourceConfig", "deploymentExpiration", "direc…
Update a flag: 200: No description
Content-Type: application/json ```json { "oneOf": [ { "type": "object", "required": [ "createdAt", "createdBy", "environments", "id", "kind", "ownerId…
Validate Drain delivery configuration: Request body
Required: No Content-Type: application/json Responses
Upload a project avatar: 200: No description
Content-Type: application/json ```json { "type": "object", "required": [ "accountId", "alias", "defaultResourceConfig", "deploymentExpiration", "direc…
Vercel vs Railway: What's included vs what you assemble
This table shows what each platform includes out of the box versus what requires external providers
Guide
Create a new Drain: Request body
Required: No Content-Type: application/json ```json { "type": "object", "required": [ "name", "projects", "schemas" ], "properties": { "name": { "type…
Update an existing project: 200: The project was successfully updated
Content-Type: application/json ```json { "type": "object", "required": [ "accountId", "alias", "defaultResourceConfig", "deploymentExpiration", "direc…
List projects in a microfrontends group: 200: No description
Content-Type: application/json ```json { "type": "object", "required": [ "projects" ], "properties": { "projects": { "type": "array", "items": { "type…
Update an existing Drain: Request body
Required: No Content-Type: application/json ```json { "type": "object", "properties": { "name": { "type": "string" }, "projects": { "type": "string",…
Counts custom events: 200: No description
Content-Type: application/json ```json { "type": "object", "required": [ "data", "query", "version" ], "properties": { "version": { "type": "number" }…
Vercel vs Railway: Always-on servers and long-running workloads
Railway runs services as persistent processes with no execution time ceiling
G