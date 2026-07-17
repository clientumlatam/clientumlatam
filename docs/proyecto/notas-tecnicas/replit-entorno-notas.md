# Replit — Notas técnicas Clientum


## replit-docs-llms.txt

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.replit.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Publishing

> Share your Replit Apps with the world in just a few clicks.

export const YouTubeEmbed = ({videoId, title = "YouTube video", startAt}) => {
  if (!videoId) {
    return null;
  }
  let url = "https://www.youtube.com/embed/" + videoId;
  if (startAt) {
    url = url + "?start=" + startAt;
  }
  return <Frame>
      <iframe src={url} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Frame>;
};

Publishing lets you share your Replit App with the world using a simplified process.

<Note>
  The action of making your app live is called "Publishing." This page describes the different types of deployments available.
</Note>

## What is Publishing?

Publishing is a feature that saves a **snapshot** of your Replit App to the cloud,
where everyone can interact with it. A snapshot captures the current state of the files in your
Replit App.

When you publish your Replit App, you create a **published app**. A published app is a running instance
of your app on Replit's cloud infrastructure. This makes the app reliably available on the internet,
separate from the version in the Project Editor.

<Info>
  Replit's infrastructure is backed by Google Cloud Platform (GCP). All
  published apps are hosted in the United States. Enterprise customers can
  contact sales to request their published apps to be hosted in the European
  Union instead.

  Every individual, organization, and enterprise customer receives a dedicated,
  single-tenant GCP project for their published apps. This means that published
  apps' compute resources, secrets, and storage are fully isolated and never
  shared with other customers' apps.
</Info>

Publishing includes tools to monitor your published app status and view web analytics.

Replit offers the following deployment types:

<CardGroup>
  <Card title="Autoscale Deployment" href="/features/publishing/deployment-types#autoscale" icon="layer-group">
    Automatically adjusts resources based on your app's usage.
  </Card>

  <Card title="Static Deployment" href="/features/publishing/deployment-types#static" icon="files">
    Provides an affordable way to host websites that don't change based on user input.
  </Card>

  <Card title="Reserved VM Deployment" href="/features/publishing/deployment-types#reserved-vm" icon="server">
    Provides a consistent amount of computing resources for your app to run continuously.
  </Card>

  <Card title="Scheduled Deployment" href="/features/publishing/deployment-types#scheduled" icon="clock">
    Runs your app at scheduled times that you choose.
  </Card>
</CardGroup>

## Getting started

Follow the steps below to publish your Replit App:

1. From your Project Editor, select <img class="icon-svg" src="https://mintcdn.com/replit/rJldsgYVucXB_6kW/images/icons/deploy-icon.svg?fit=max&auto=format&n=rJldsgYVucXB_6kW&q=85&s=853c5ef39a8a7ac3648b3a2ce182fcb8" alt="Publish icon" width="16" height="16" data-path="images/icons/deploy-icon.svg" /> **Publish** at the top.
2. In the **Publishing** tab, select your publishing option.
3. If **Add a payment method** appears, follow the prompts to add a payment method.

Replit automatically selects the best publishing option for your app based on the project type and your needs.

However, to choose a different deployment type, consider the following information.

## Choosing the right publishing option

The following video explains how to choose the right publishing option for your app:

<YouTubeEmbed videoId="OqSbgBMoTm0" title="Replit Deployments Masterclass" />

Use the following decision tree featured in the video to help you choose:

<Frame>
  <img src="https://mintcdn.com/replit/jSmYU1wBTvl8UMyc/images/deployments/decision-tree.png?fit=max&auto=format&n=jSmYU1wBTvl8UMyc&q=85&s=8129fe2205ca99224ea9a3707072bcf9" width="5344" height="6250" data-path="images/deployments/decision-tree.png" />
</Frame>

## Key features

Publishing offers the following convenient features:

* **Multiple publishing options**: Select or update a deployment type that meets your needs in a few clicks.
* **Custom domains**: Serve your app from your web domain.
* **Analytics**: Track visitor data and other metrics for your published app.
* **Monitoring tools**: View your published app status and configuration.
* **Access controls**: Control who can see your app with a single click. Available only for **Pro** and **Enterprise** members.
* **Badge settings**: Core users can manage the "Made with Replit" badge in Publishing settings. If you published an app while on the Starter plan that include the badge, it may take a couple minutes to update your app to remove the badge after you upgrade.
* **Feedback collection**: Enable feedback on your published app to gather insights from your users.

## How it works

When you publish your Replit App, Replit creates a snapshot of your app's files and dependencies.
This snapshot is then sent to Replit's cloud infrastructure, where it runs as a separate instance of your app.
To update your published app with the latest changes, publish again to create a fresh snapshot.

<Warning>
  Avoid saving and relying on data written to a published app's filesystem. To
  store data, use a storage or database option such as Replit's [Storage and
  Database](/learn/projects-and-artifacts/storage-and-databases) offerings.
</Warning>

## Use cases

The following examples show different types of published apps.

### Autoscale deployment: Typing speed assessment app

Let the cloud scale up resources when users take typing tests and reduce them when not in use.

### Static deployment: Solar system simulation

Learn about the planets in a solar system visualization app on the web.
This visualization renders in the browser and doesn't transfer any user input to a server.

### Reserved VM deployment: Discord bot

Run a Discord bot that helps you moderate and onboard members.
It's always online to chat with users and respond to commands with predictable pricing and performance.

### Scheduled deployment: Home automation triggers

Schedule API calls to start and stop your smart home devices at specific times and days.

## Next steps

To learn more about Replit Publishing, see the following resources:

* [Autoscale Deployment](/features/publishing/deployment-types#autoscale): Learn how to set up applications that scale with traffic
* [Static Deployment](/features/publishing/deployment-types#static): Discover how to publish static websites quickly and efficiently
* [Reserved VM Deployment](/features/publishing/deployment-types#reserved-vm): Explore dedicated VM options for specialized use cases
* [Scheduled Deployment](/features/publishing/deployment-types#scheduled): Set up recurring tasks with simple scheduling
* [Custom Domains](/features/publishing/custom-domains): Connect your published app to a custom domain


## replit-agent-skills-panel.txt

Agent skills
Skills extend what Agent can do. Manage installed skills here. Learn more about skills
Discover skills
Find skills to add to your Agent.
agent
Find Skills

vercel-labs/skills
•
12.7K installs
Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.

Agent Tools

inf-sh/skills
•
11.8K installs
Run 150+ AI apps via inference.sh CLI - image generation, video creation, LLMs, search, 3D, Twitter automation. Models: FLUX, Veo, Gemini, Grok, Claude, Seedance, OmniHuman, Tavily, Exa, OpenRouter, and many more. Use when running AI apps, generating images/videos, calling LLMs, web search, or automating Twitter. Triggers: inference.sh, infsh, ai model, run ai, serverless ai, ai api, flux, veo, claude api, image generation, video generation, openrouter, tavily, exa search, twitter api, grok

Subagent Driven Development

obra/superpowers
•
230 installs
Use when executing implementation plans with independent tasks in the current session

Dispatching Parallel Agents

obra/superpowers
•
215 installs
Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies

Clawdirect

napoleond/clawdirect
•
262 installs
Interact with ClawDirect, a directory of social web experiences for AI agents. Use this skill to browse the directory, like entries, or add new sites. Requires ATXP authentication for MCP tool calls. Triggers: browsing agent-oriented websites, discovering social platforms for agents, liking/voting on directory entries, or submitting new agent-facing sites to ClawDirect.

Instaclaw

napoleond/instaclaw
•
177 installs
Photo sharing platform for AI agents. Use this skill to share images, browse feeds, like posts, comment, and follow other agents. Requires ATXP authentication.

Clawdirect Dev

napoleond/clawdirect
•
263 installs
Build agent-facing web experiences with ATXP-based authentication, following the ClawDirect pattern. Use this skill when building websites that AI agents interact with via MCP tools, implementing cookie-based agent auth, or creating agent skills for web apps. Provides templates using @longrun/turtle, Express, SQLite, and ATXP.

Stitch Loop

google-labs-code/stitch-skills
•
204 installs
Teaches agents to iteratively build websites using Stitch with an autonomous baton-passing loop pattern

Agentation

benjitaylor/agentation
•
167 installs
Add Agentation visual feedback toolbar to a Next.js project

Langchain Architecture

wshobson/agents
•
193 installs
Design LLM applications using LangChain 1.x and LangGraph for agents, memory, and tool integration. Use when building LangChain applications, implementing AI agents, or creating complex LLM workflows.

Convex

waynesutton/convexskills
•
120 installs
Umbrella skill for all Convex development patterns. Routes to specific skills like convex-functions, convex-realtime, convex-agents, etc.

Python Sdk

inf-sh/skills
•
321 installs
Python SDK for inference.sh - run AI apps, build agents, and integrate with 150+ models. Package: inferencesh (pip install inferencesh). Supports sync/async, streaming, file uploads. Build agents with template or ad-hoc patterns, tool builder API, skills, and human approval. Use for: Python integration, AI apps, agent development, RAG pipelines, automation. Triggers: python sdk, inferencesh, pip install, python api, python client, async inference, python agent, tool builder python, programmatic ai, python integration, sdk python

Agent Md Refactor

softaworks/agent-toolkit
•
172 installs
Refactor bloated AGENTS.md, CLAUDE.md, or similar agent instruction files to follow progressive disclosure principles. Splits monolithic files into organized, linked documentation.

Session Handoff

softaworks/agent-toolkit
•
201 installs
Creates comprehensive handoff documents for seamless AI agent session transfers. Triggered when: (1) user requests handoff/memory/context save, (2) context window approaches capacity, (3) major task milestone completed, (4) work session ending, (5) user says 'save state', 'create handoff', 'I need to pause', 'context is getting full', (6) resuming work with 'load handoff', 'resume from', 'continue where we left off'. Proactively suggests handoffs after substantial work (multiple file edits, complex debugging, architecture decisions). Solves long-running agent context exhaustion by enabling fresh agents to continue with zero ambiguity.

Skill Judge

softaworks/agent-toolkit
•
146 installs
Evaluate Agent Skill design quality against official specifications and best practices. Use when reviewing, auditing, or improving SKILL.md files and skill packages. Provides multi-dimensional scoring and actionable improvement suggestions.

Command Creator

softaworks/agent-toolkit
•
160 installs
This skill should be used when creating a Claude Code slash command. Use when users ask to "create a command", "make a slash command", "add a command", or want to document a workflow as a reusable command. Essential for creating optimized, agent-executable slash commands with proper structure and best practices.

Plugin Forge

softaworks/agent-toolkit
•
152 installs
Create and manage Claude Code plugins with proper structure, manifests, and marketplace integration. Use when creating plugins for a marketplace, adding plugin components (commands, agents, hooks), bumping plugin versions, or working with plugin.json/marketplace.json manifests.

Javascript Sdk

inf-sh/skills
•
330 installs
JavaScript/TypeScript SDK for inference.sh - run AI apps, build agents, integrate 150+ models. Package: @inferencesh/sdk (npm install). Full TypeScript support, streaming, file uploads. Build agents with template or ad-hoc patterns, tool builder API, skills, human approval. Use for: JavaScript integration, TypeScript, Node.js, React, Next.js, frontend apps. Triggers: javascript sdk, typescript sdk, npm install, node.js api, js client, react ai, next.js ai, frontend sdk, @inferencesh/sdk, typescript agent, browser sdk, js integration

Mastra

mastra-ai/skills
•
148 installs
Comprehensive Mastra framework guide. Teaches how to find current documentation, verify API signatures, and build agents and workflows. Covers documentation lookup strategies (embedded docs, remote docs), core concepts (agents vs workflows, tools, memory, RAG), TypeScript requirements, and common patterns. Use this skill for all Mastra development to ensure you're using current APIs from the installed version or latest documentation.

Superdesign

superdesigndev/superdesign-skill
•
381 installs
Superdesign is a design agent specialized in frontend UI/UX design. Use this skill before implementing any UI that requires design thinking. Common commands: superdesign create-project --title "X" (setup project), superdesign create-design-draft --project-id <id> --title "Current UI" -p "Faithfully reproduce..." --context-file src/Component.tsx (faithful reproduction), superdesign iterate-design-draft --draft-id <id> -p "dark theme" -p "minimal" --mode branch --context-file src/Component.tsx (design variations), superdesign execute-flow-pages --draft-id <id> --pages '[...]' --context-file src/Component.tsx (extend to more pages). Supports line ranges: --context-file path:startLine:endLine


## replit-skills-audits-vercel.txt

Skills
Topics
Official
Audits
Docs
skills
/
vercel-labs
/
agent-skills
/deploy-to-vercel
deploy-to-vercel
Next.js
Installation
Summary

Deploy applications and websites to Vercel with automatic git integration and preview URLs.

    Supports three deployment paths: git-push (ideal for linked projects), direct CLI deployment, and no-auth fallback for sandboxed environments
    Automatically detects project state (linked via .vercel/project.json or .vercel/repo.json, git remote presence, CLI authentication) and chooses the best deployment method
    Handles team selection for multi-team accounts and uses --scope to deploy to the correct team
    Provides preview URLs for all deployments; linked projects with git remotes enable automatic deployments on future pushes
    Includes fallback scripts for claude.ai and Codex sandboxes that require no authentication, returning both preview and claim URLs

SKILL.md
Deploy to Vercel

Deploy any project to Vercel. Always deploy as preview (not production) unless the user explicitly asks for production.

The goal is to get the user into the best long-term setup: their project linked to Vercel with git-push deploys. Every method below tries to move the user closer to that state.
Step 1: Gather Project State

Run all four checks before deciding which method to use:

# 1. Check for a git remote
git remote get-url origin 2>/dev/null

# 2. Check if locally linked to a Vercel project (either file means linked)
cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null

# 3. Check if the Vercel CLI is installed and authenticated
vercel whoami 2>/dev/null

4. List available teams (if authenticated)

vercel teams list --format json 2>/dev/null


### Team selection

If the user belongs to multiple teams, present all available team slugs as a bulleted list and ask which one to deploy to. Once the user picks a team, proceed immediately to the next step — do not ask for additional confirmation.

Pass the team slug via `--scope` on all subsequent CLI commands (`vercel deploy`, `vercel link`, `vercel inspect`, etc.):

```bash
vercel deploy [path] -y --no-wait --scope <team-slug>

If the project is already linked (.vercel/project.json or .vercel/repo.json exists), the orgId in those files determines the team — no need to ask again. If there is only one team (or just a personal account), skip the prompt and use it directly.

About the .vercel/ directory: A linked project has either:

    .vercel/project.json — created by vercel link (single project linking). Contains projectId and orgId.
    .vercel/repo.json — created by vercel link --repo (repo-based linking). Contains orgId, remoteName, and a projects array mapping directories to Vercel project IDs.

Either file means the project is linked. Check for both.

Do NOT use vercel project inspect, vercel ls, or vercel link to detect state in an unlinked directory — without a .vercel/ config, they will interactively prompt (or with --yes, silently link as a side-effect). Only vercel whoami is safe to run anywhere.
Step 2: Choose a Deploy Method
Linked (.vercel/ exists) + has git remote → Git Push

This is the ideal state. The project is linked and has git integration.

    Ask the user before pushing. Never push without explicit approval:

    This project is connected to Vercel via git. I can commit and push to
    trigger a deployment. Want me to proceed?

    Commit and push:

    git add .
    git commit -m "deploy: <description of changes>"
    git push

    Vercel automatically builds from the push. Non-production branches get preview deployments; the production branch (usually main) gets a production deployment.

    Retrieve the preview URL. If the CLI is authenticated:

    sleep 5
    vercel ls --format json

    The JSON output has a deployments array. Find the latest entry — its url field is the preview URL.

    If the CLI is not authenticated, tell the user to check the Vercel dashboard or the commit status checks on their git provider for the preview URL.

Linked (.vercel/ exists) + no git remote → vercel deploy

The project is linked but there's no git repo. Deploy directly with the CLI.

vercel deploy [path] -y --no-wait

Use --no-wait so the CLI returns immediately with the deployment URL instead of blocking until the build finishes (builds can take a while). Then check on the deployment status with:

vercel inspect <deployment-url>

For production deploys (only if user explicitly asks):

vercel deploy [path] --prod -y --no-wait

Not linked + CLI is authenticated → Link first, then deploy

The CLI is working but the project isn't linked yet. This is the opportunity to get the user into the best state.

    Ask the user which team to deploy to. Present the team slugs from Step 1 as a bulleted list. If there's only one team (or just a personal account), skip this step.

    Once a team is selected, proceed directly to linking. Tell the user what will happen but do not ask for separate confirmation:

    Linking this project to <team name> on Vercel. This will create a Vercel
    project to deploy to and enable automatic deployments on future git pushes.

    If a git remote exists, use repo-based linking with the selected team scope:

    vercel link --repo --scope <team-slug>

    This reads the git remote URL and matches it to existing Vercel projects that deploy from that repo. It creates .vercel/repo.json. This is much more reliable than vercel link (without --repo), which tries to match by directory name and often fails when the local folder and Vercel project are named differently.

    If there is no git remote, fall back to standard linking:

    vercel link --scope <team-slug>

    This prompts the user to select or create a project. It creates .vercel/project.json.

    Then deploy using the best available method:
        If a git remote exists → commit and push (see git push method above)
        If no git remote → vercel deploy [path] -y --no-wait --scope <team-slug>, then vercel inspect <url> to check status

Not linked + CLI not authenticated → Install, auth, link, deploy

The Vercel CLI isn't set up at all.

    Install the CLI (if not already installed):

    npm install -g vercel

    Authenticate:

    vercel login

    The user completes auth in their browser. If running in a non-interactive environment where login is not possible, skip to the no-auth fallback below.

    Ask which team to deploy to — present team slugs from vercel teams list --format json as a bulleted list. If only one team / personal account, skip. Once selected, proceed immediately.

    Link the project with the selected team scope (use --repo if a git remote exists, plain vercel link otherwise):

    vercel link --repo --scope <team-slug>   # if git remote exists
    vercel link --scope <team-slug>          # if no git remote

    Deploy using the best available method (git push if remote exists, otherwise vercel deploy -y --no-wait --scope <team-slug>, then vercel inspect <url> to check status).

No-Auth Fallback — claude.ai sandbox

When to use: Last resort when the CLI can't be installed or authenticated in the claude.ai sandbox. This requires no authentication — it returns a Preview URL (live site) and a Claim URL (transfer to your Vercel account).

bash /mnt/skills/user/deploy-to-vercel/resources/deploy.sh [path]

Arguments:

    path - Directory to deploy, or a .tgz file (defaults to current directory)

Examples:

# Deploy current directory
bash /mnt/skills/user/deploy-to-vercel/resources/deploy.sh

# Deploy specific project
bash /mnt/skills/user/deploy-to-vercel/resources/deploy.sh /path/to/project

# Deploy existing tarball
bash /mnt/skills/user/deploy-to-vercel/resources/deploy.sh /path/to/project.tgz

The script auto-detects the framework from package.json, packages the project (excluding node_modules, .git, .env), uploads it, and waits for the build to complete.

Tell the user: "Your deployment is ready at [previewUrl]. Claim it at [claimUrl] to manage your deployment."
No-Auth Fallback — Codex sandbox

When to use: In the Codex sandbox where the CLI may not be authenticated. Codex runs in a sandboxed environment by default — try the CLI first, and fall back to the deploy script if auth fails.

    Check whether the Vercel CLI is installed (no escalation needed for this check):

    command -v vercel

    If vercel is installed, try deploying with the CLI:

    vercel deploy [path] -y --no-wait

    If vercel is not installed, or the CLI fails with "No existing credentials found", use the fallback script:

    skill_dir="<path-to-skill>"

    # Deploy current directory
    bash "$skill_dir/resources/deploy-codex.sh"

    # Deploy specific project
    bash "$skill_dir/resources/deploy-codex.sh" /path/to/project

    # Deploy existing tarball
    bash "$skill_dir/resources/deploy-codex.sh" /path/to/project.tgz

The script handles framework detection, packaging, and deployment. It waits for the build to complete and returns JSON with previewUrl and claimUrl.

Tell the user: "Your deployment is ready at [previewUrl]. Claim it at [claimUrl] to manage your deployment."

Escalated network access: Only escalate the actual deploy command if sandboxing blocks the network call (sandbox_permissions=require_escalated). Do not escalate the command -v vercel check.
Agent-Specific Notes
Claude Code / terminal-based agents

You have full shell access. Do NOT use the /mnt/skills/ path. Follow the decision flow above using the CLI directly.

For the no-auth fallback, run the deploy script from the skill's installed location:

bash ~/.claude/skills/deploy-to-vercel/resources/deploy.sh [path]

The path may vary depending on where the user installed the skill.
Sandboxed environments (claude.ai)

You likely cannot run vercel login or git push. Go directly to the no-auth fallback — claude.ai sandbox.
Codex

Codex runs in a sandbox. Check if the CLI is available first, then fall back to the deploy script. Go to the no-auth fallback — Codex sandbox.
Output

Always show the user the deployment URL.

    Git push: Use vercel ls --format json to find the preview URL. If the CLI isn't authenticated, tell the user to check the Vercel dashboard or commit status checks.
    CLI deploy: Show the URL returned by vercel deploy --no-wait. Use vercel inspect <url> to check build status and report it to the user.
    No-auth fallback: Show both the preview URL and the claim URL:

    Deployment successful!

    Preview URL: https://my-app-abc123.vercel.app
    Claim URL:   https://vercel.com/claim-deployment?code=...

    View your site at the Preview URL.
    To transfer this deployment to your Vercel account, visit the Claim URL.

Do not curl or fetch the deployed URL to verify it works. Just return the link.
Troubleshooting
Network Egress Error (claude.ai)

If deployment fails due to network restrictions on claude.ai, tell the user:

Deployment failed due to network restrictions. To fix this:

1. Go to https://claude.ai/settings/capabilities
2. Add *.vercel.com to the allowed domains
3. Try deploying again

Escalated Network Access (Codex / sandboxed environments)

If deployment fails due to network issues (timeouts, DNS errors, connection resets) in a sandboxed environment, rerun with escalated permissions (sandbox_permissions=require_escalated). Do not escalate the initial CLI availability check — only escalate the actual deploy command.

Example guidance to the user:

The deploy needs escalated network access to deploy to Vercel. I can rerun
the command with escalated permissions — want me to proceed?

CLI Auth Failure

If vercel login or vercel deploy fails with authentication errors, fall back to the no-auth deploy script (claude.ai or Codex variant, depending on the environment).
Related skills
More in Next.js

    vercel-react-best-practices

    69 prioritized React and Next.js performance rules across 8 categories
    vercel-labs/agent-skills
    vercel-composition-patterns

    Composable component architecture patterns for scalable Next.js apps
    vercel-labs/agent-skills
    next-best-practices

    File conventions, RSC boundaries, data patterns, async APIs, and metadata
    vercel-labs/next-skills
    next-cache-components

    PPR, use cache directive, cacheLife, cacheTag, and revalidateTag
    vercel-labs/next-skills
    turborepo

    Turborepo task pipelines, caching, remote cache, and CI configuration
    vercel/turborepo

Installs
91.1K
Repository
vercel-labs/agent-skills
GitHub Stars
29.0K
First Seen
Mar 6, 2026
Security Audits
Gen Agent Trust HubPass
SocketPass
SnykPass
Browse

    All skills
    Trending
    Hot
    Official
    Security audits

Topics

    React
    Next.js
    Design & UI
    Mobile
    Agent workflows
    Databases
    Testing
    Marketing
    All topics →

Agents

    Claude Code
    Cursor
    Codex
    GitHub Copilot
    Windsurf
    Gemini
    Cline
    AMP
    Antigravity
    ClawdBot
    All agents →

Docs

    Overview
    CLI
    Customize pages
    API
    FAQ

Project

    About
    Contact
    Privacy
    Terms
    GitHub

Made with care by Vercel.Skills are open source on GitHub.


## replit-env-variables-clientum.txt

# -------------------------------------------------------------------------
# Clientum CRM — environment variable reference
# Copy this file to .env for local development and fill in real values.
# Never commit .env or paste real keys anywhere in code or chat.
# Production secrets are managed via the Replit Secrets panel.
# -------------------------------------------------------------------------

# --- Database (Neon) ---
NEON_PROJECT_ID=""
NEON_API_KEY=""

# Full Postgres connection string from Neon (Connect > Connection string)
# Get yours at https://console.neon.tech
DATABASE_URL=""

# Unpooled variants — used for migrations / long-running connections
# that shouldn't go through PgBouncer connection pooling
DATABASE_URL_UNPOOLED=""
PGHOST_UNPOOLED=""

# Individual Postgres connection params (usually derived from DATABASE_URL,
# but some tools/ORMs expect them separately)
PGHOST=""
PGPORT="5432"
PGDATABASE="neondb"
PGUSER=""
PGPASSWORD=""

# --- Deployment ---
REPLIT_DEPLOYMENT=""

# Required — powers all Gemini AI features
GEMINI_API_KEY=""

# Required — GitHub integration (repo access, CI, etc.)
GITHUB_PERSONAL_ACCESS_TOKEN=""

# Required — Express session signing key
# Generate with: openssl rand -base64 64
SESSION_SECRET=""

# Optional — Apify token for real Google Maps scraping
# Get yours at https://console.apify.com/account/integrations
APIFY_API_TOKEN=""

# Optional — Google Maps Platform key for live Places API (New) prospecting
# Get yours at https://console.cloud.google.com/apis/credentials
GOOGLE_MAPS_PLATFORM_KEY=""

# Optional — Hunter.io API key for contact enrichment
# Get yours at https://hunter.io/api-keys
HUNTER_API_KEY=""

# Optional — Santi WhatsApp SDR agent API key (server-to-server)
SANTI_API_KEY=""

# Optional — Public URL of the deployed app (used for self-referential links)
APP_URL="http://localhost:5000"

# --- Stripe (test mode) ---
STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""

# Note: in production on Replit, DATABASE_URL and the PG* vars above are
# usually injected automatically — only set them manually for local dev.
# PORT is also injected at runtime; app defaults to 5000 locally.
PORT="5000"


## replit-env-csv-descarga.txt



















CL












Generar archivo CSV personalizado



[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}ENV.env






hace un csv con eso





14:46











Podría ser un poco más específico sobre qué datos o información desea incluir en el archivo CSV. Por ejemplo:

¿Qué columnas debe tener el archivo?
¿Qué tipo de datos quiere incluir (nombres, números, fechas, etc.)?
¿Hay algún formato especial que deba seguir?
Si me da más detalles, puedo crear el CSV según sus necesidades.





14:46

















14:47











Parece que la imagen muestra una interfaz de Vercel con una lista de Secrets (Variables de Entorno) que están configurados en un proyecto. Los nombres de los secrets son:

APIFY_API_TOKEN
APP_URL
GEMINI_API_KEY
GITHUB_PERSONAL_ACCESS_TOKEN
GOOGLE_MAPS_PLATFORM_KEY
HUNTER_API_KEY
NEON_API_KEY
NEON_PROJECT_ID

¿Quieres un CSV con estos datos?
Puedo generar un archivo CSV con dos columnas: Key y Value (aunque los valores están vacíos en la imagen). ¿Te gustaría que lo haga así?
O dime si prefieres otro formato o más detalles.





14:47











con esos y todos estos tambien # -------------------------------------------------------------------------
# Clientum CRM — environment variable reference
# Copy this file to .env for local development and fill in real values.
# Never commit .env or paste real keys anywhere in code or chat.
# Production secrets are managed via the Replit Secrets panel.
# -------------------------------------------------------------------------


NEON_PROJECT_ID="raspy-dust-62946604"

NEON_API_KEY="napi_hjrd5van1a5t96myv67zjtmm35tu0ex0ydb8f74bl2zn83p1pcux4fszjugi3egl"




REPLIT_DEPLOYMENT="AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE"

# Required — powers all Gemini AI features
GEMINI_API_KEY="AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE"

GITHUB_PERSONAL_ACCESS_TOKEN="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"


# Required — Express session signing key (generate with: openssl rand -base64 64)
SESSION_SECRET="LnANXN2ztZLQ0OyKSr+2crMuuiskErUk+Q6NKJb+Qmz9HvkQQqTKjKRsFdm22RDROrfWcM4rwrfPrk/anf6xwQ=="

# Optional — Apify token for real Google Maps scraping
# Get yours at https://console.apify.com/account/integrations
APIFY_API_TOKEN="apify_api_IhjB4U6ajM8gfFy1iXba7MkVYngc1u1UQ0GB"

# Optional — Google Maps Platform key for live Places API (New) prospecting
# Get yours at https://console.cloud.google.com/apis/credentials
GOOGLE_MAPS_PLATFORM_KEY="AIzaSyDnoQFe18QKyyTmGNl9qJ3VfxVulbG3KUY"

# Optional — Hunter.io API key for contact enrichment
# Get yours at https://hunter.io/api-keys
HUNTER_API_KEY="0711d0e54b9d37e59e30e8f15e6b62574675bb50"

# Optional — Santi WhatsApp SDR agent API key (server-to-server)
SANTI_API_KEY="5440b3f62c3d7e5950572ab45cc2a721e27e1b5abec0b9b6ccff194cef627849"

# Optional — Public URL of the deployed app (used for self-referential links)
APP_URL="http://localhost:5000"

# Runtime-managed by Replit — do not set manually:
# DATABASE_URL, PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD
# PORT is also injected at runtime; app defaults to 5000 locally.

GITHUB_PERSONAL_ACCESS_TOKEN="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"


STRIPE
Tus claves de API para entornos de prueba
Clave publicable
pk_test_51Tt7i2LDOsjqibnkfZwr14p6RMAP5giXKl5R8oULsRnAmuuy1grjiB9FP3x1I9LzxUCcgfkYqZFYreCXaFqGii0u00A8OfcmSb
Clave secreta
sk_test_51Tt7i2LDOsjqibnk9WkBIq0DayV2xZsZVW7bH6PDE1IlEuG2MXscMmG9l099cuyq9ot2ik7vIMvIDI4OzdUheYWQ00sMPw7lca





Atlassian Rovo MCP server
mistral-mcp-client is requesting access

This MCP Client is requesting to be authorized on Atlassian Rovo MCP server. If you approve, you will be redirected to Atlassian to complete authentication
Details
Name:
mistral-mcp-client
Redirect URIs:
https://callback.mistral.ai/v1/integrations_auth/oauth2_callback
Apps
Allow access to the following apps
Jira
Confluence
Compass




Habilidades de agente
Instale instrucciones que ayuden a los agentes de inteligencia artificial a crear integraciones de Stripe más precisas.








Atlassian Rovo MCP server
mistral-mcp-client is requesting access

This MCP Client is requesting to be authorized on Atlassian Rovo MCP server. If you approve, you will be redirected to Atlassian to complete authentication
Details
Name:
mistral-mcp-client
Redirect URIs:
https://callback.mistral.ai/v1/integrations_auth/oauth2_callback





Utiliza un agente de IA para que te configure Stripe. Copia el prompt a continuación en tu herramienta de programación con IA para iniciar tu integración.
Claude Code
Cursor
Codex
ChatGPT
Tu prompt de integración
Copiar solicitud

Help me get started building on Stripe. Here's my context:

Business: https://www.clientum.com.ar/
Description: Plataforma All-in-One para PyMEs
Todo lo que tu empresa necesita, en una sola plataforma.

CRM, Chatbot WhatsApp con IA, E-Commerce, ERP, Business Intelligence, Marketing Digital, Ciberseguridad, Cloud, Apps Móviles y Capacitación — el ecosistema completo de Clientum para hacer crecer tu PyME.
Stripe products I need: Billing, Invoicing, Tax

---

Follow these steps in order.

1. Install Stripe skills:
  - npx skills add https://docs.stripe.com
2. Connect to the Stripe MCP server:
  - Add https://mcp.stripe.com as an MCP server and authenticate when prompted (https://docs.stripe.com/mcp.md).
  - Confirm stripe_implementation_planner is available. If not, reload your tools or start a new session.
3. Generate my integration plan:
  - Use the stripe_implementation_planner tool with my business context to generate a tailored, best-practices Stripe integration plan for my use case.

Then help me build a Stripe integration using my API keys. If I already have an integration, review it against the plan and suggest improvements.

Tus claves de API para entornos de prueba
Clave publicable
pk_test_51Tt7i2LDOsjqibnkfZwr14p6RMAP5giXKl5R8oULsRnAmuuy1grjiB9FP3x1I9LzxUCcgfkYqZFYreCXaFqGii0u00A8OfcmSb
Clave secreta
sk_test_51Tt7i2LDOsjqibnk9WkBIq0DayV2xZsZVW7bH6PDE1IlEuG2MXscMmG9l099cuyq9ot2ik7vIMvIDI4OzdUheYWQ00sMPw7lca






14:49













Trabajó durante 7s











Aquí tienes el archivo CSV con todas las variables de entorno que mencionaste:




environment_variables.csv

  
    
      Key
      Value
    
  
  
    
      NEON_PROJECT_ID
      raspy-dust-62946604
    
    
      NEON_API_KEY
      napi_hjrd5van1a5t96myv67zjtmm35tu0ex0ydb8f74bl2zn83p1pcux4fszjugi3egl
    
    
      REPLIT_DEPLOYMENT
      AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE
    
    
      GEMINI_API_KEY
      AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE
    
    
      GITHUB_PERSONAL_ACCESS_TOKEN
      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
    
    
      SESSION_SECRET
      LnANXN2ztZLQ0OyKSr+2crMuuiskErUk+Q6NKJb+Qmz9HvkQQqTKjKRsFdm22RDROrfWcM4rwrfPrk/anf6xwQ==
    
    
      APIFY_API_TOKEN
      apify_api_IhjB4U6ajM8gfFy1iXba7MkVYngc1u1UQ0GB
    
    
      GOOGLE_MAPS_PLATFORM_KEY
      AIzaSyDnoQFe18QKyyTmGNl9qJ3VfxVulbG3KUY
    
    
      HUNTER_API_KEY
      0711d0e54b9d37e59e30e8f15e6b62574675bb50
    
    
      SANTI_API_KEY
      5440b3f62c3d7e5950572ab45cc2a721e27e1b5abec0b9b6ccff194cef627849
    
    
      APP_URL
      http://localhost:5000
    
    
      STRIPE_PUBLISHABLE_KEY
      pk_test_51Tt7i2LDOsjqibnkfZwr14p6RMAP5giXKl5R8oULsRnAmuuy1grjiB9FP3x1I9LzxUCcgfkYqZFYreCXaFqGii0u00A8OfcmSb
    
    
      STRIPE_SECRET_KEY
      sk_test_51Tt7i2LDOsjqibnk9WkBIq0DayV2xZsZVW7bH6PDE1IlEuG2MXscMmG9l099cuyq9ot2ik7vIMvIDI4OzdUheYWQ00sMPw7lca
    
  





Puedes descargar el archivo CSV aquí:
environment_variables.csv

¿Necesitas algún ajuste o formato adicional?





14:49











con esos y todos estos tambien # -------------------------------------------------------------------------APP_URL=""
GITHUB_PERSONAL_ACCESS_TOKEN=""
GOOGLE_MAPS_PLATFORM_KEY=""
GEMINI_API_KEY=""
SANTI_API_KEY=""
HUNTER_API_KEY=""
SESSION_SECRET="PQOijvYlxjrlgDss/c//+5wnnYni0jqsD6HgpOLPvmusP0ig15h8/8c2ujuf7HWKeVflaswe4s7bNVMa3ZtnpQ=="
NEON_PROJECT_ID=""
REPLIT_DEPLOYMENT=""
APIFY_API_TOKEN=""
NEON_API_KEY=""





14:51













Trabajó durante 6s











Aquí tienes el archivo CSV actualizado con todas las variables de entorno, incluyendo las que están vacías y las que ya tenías:




environment_variables_updated.csv

  
    
      Key
      Value
    
  
  
    
      APP_URL
      
    
    
      GITHUB_PERSONAL_ACCESS_TOKEN
      
    
    
      GOOGLE_MAPS_PLATFORM_KEY
      
    
    
      GEMINI_API_KEY
      
    
    
      SANTI_API_KEY
      
    
    
      HUNTER_API_KEY
      
    
    
      SESSION_SECRET
      PQOijvYlxjrlgDss/c//+5wnnYni0jqsD6HgpOLPvmusP0ig15h8/8c2ujuf7HWKeVflaswe4s7bNVMa3ZtnpQ==
    
    
      NEON_PROJECT_ID
      
    
    
      REPLIT_DEPLOYMENT
      
    
    
      APIFY_API_TOKEN
      
    
    
      NEON_API_KEY
      
    
    
      STRIPE_PUBLISHABLE_KEY
      pk_test_51Tt7i2LDOsjqibnkfZwr14p6RMAP5giXKl5R8oULsRnAmuuy1grjiB9FP3x1I9LzxUCcgfkYqZFYreCXaFqGii0u00A8OfcmSb
    
    
      STRIPE_SECRET_KEY
      sk_test_51Tt7i2LDOsjqibnk9WkBIq0DayV2xZsZVW7bH6PDE1IlEuG2MXscMmG9l099cuyq9ot2ik7vIMvIDI4OzdUheYWQ00sMPw7lca
    
  





Puedes descargar el archivo CSV aquí:
environment_variables_updated.csv

¿Necesitas algún otro ajuste o formato? 😊





14:51











pero de todo lo que copie y me repsondiste en todoeste chat  CSV actualizado con todas las variables de entorno, incluyendo las que están vacías y las que ya tenías:





14:53













Trabajó durante 9s











Aquí tienes el CSV final con todas las variables de entorno mencionadas en el chat, sin duplicados y priorizando los valores no vacíos cuando había conflicto:




environment_variables_final.csv

  
    
      Key
      Value
    
  
  
    
      NEON_PROJECT_ID
      raspy-dust-62946604
    
    
      NEON_API_KEY
      napi_hjrd5van1a5t96myv67zjtmm35tu0ex0ydb8f74bl2zn83p1pcux4fszjugi3egl
    
    
      REPLIT_DEPLOYMENT
      AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE
    
    
      GEMINI_API_KEY
      AlzaSyBLcmfD_bwSfYzYEKJAfKUOH98YCLFDZXE
    
    
      GITHUB_PERSONAL_ACCESS_TOKEN
      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
    
    
      SESSION_SECRET
      LnANXN2ztZLQ0OyKSr+2crMuuiskErUk+Q6NKJb+Qmz9HvkQQqTKjKRsFdm22RDROrfWcM4rwrfPrk/anf6xwQ==
    
    
      APIFY_API_TOKEN
      apify_api_IhjB4U6ajM8gfFy1iXba7MkVYngc1u1UQ0GB
    
    
      GOOGLE_MAPS_PLATFORM_KEY
      AIzaSyDnoQFe18QKyyTmGNl9qJ3VfxVulbG3KUY
    
    
      HUNTER_API_KEY
      0711d0e54b9d37e59e30e8f15e6b62574675bb50
    
    
      SANTI_API_KEY
      5440b3f62c3d7e5950572ab45cc2a721e27e1b5abec0b9b6ccff194cef627849
    
    
      APP_URL
      http://localhost:5000
    
    
      STRIPE_PUBLISHABLE_KEY
      pk_test_51Tt7i2LDOsjqibnkfZwr14p6RMAP5giXKl5R8oULsRnAmuuy1grjiB9FP3x1I9LzxUCcgfkYqZFYreCXaFqGii0u00A8OfcmSb
    
    
      STRIPE_SECRET_KEY
      sk_test_51Tt7i2LDOsjqibnk9WkBIq0DayV2xZsZVW7bH6PDE1IlEuG2MXscMmG9l099cuyq9ot2ik7vIMvIDI4OzdUheYWQ00sMPw7lca
    
  





Descarga el archivo CSV aquí:
environment_variables_final.csv

¿Necesitas algo más? 😊





14:53











y las vacias?
































## replit-chat-chinitomix-deploy-status.txt

chinitomix111
chinitomix111
8 hours ago

No pending request here — the app is running cleanly on both workflows and I don't see an actionable ask in this snapshot. Let me know what you'd like to work on next (e.g., resuming the Vercel deploy verification, or something new), and I'll pick it up.

Pasted-10-hours-ago-Assessing-deployment-process-I-can-see-the_1784013132991.txt
CH
chinitomix111
chinitomix111
8 hours ago

The APIFY_API_TOKEN removal is safe — it's used only for an optional Apify-based feature (guarded with checks, throws a clear error if missing rather than failing silently), so nothing else breaks. APP_URL isn't referenced anywhere in server.ts yet.

Nothing in this snapshot requires action from me right now — both workflows are healthy. What would you like to work on next?

continau
CH
chinitomix111
chinitomix111
8 hours ago

I don't have an active task in progress and both workflows are running cleanly with no errors. There's nothing for me to continue — let me know what you'd like to work on next (e.g. verifying the Vercel deployment, the Asistente IA feature, or something new).

continau
CH
chinitomix111
chinitomix111
8 hours ago
Cómo quieres usar la base de datos de Neon que configuraste?
Alcance
Unificar todo en Neon — Replit dev y Vercel producción usan la misma base Neon
CH
chinitomix111
chinitomix111

Work complete. Both Replit dev and Vercel production are now unified on Neon Postgres, resolved live via the Neon API (using NEON_API_KEY/NEON_PROJECT_ID) instead of a hardcoded connection string. Your 2 existing user accounts (demo, jonathan) were migrated over, tables initialize cleanly, and the app runs without errors. The change is pushed to origin/main on GitHub, so Vercel will rebuild from it.

Two things you need to do:

    Add NEON_API_KEY and NEON_PROJECT_ID to Vercel (Project Settings → Environment Variables, for Production) — same values you gave Replit. That's the only change needed there; you can leave/ignore the old DATABASE_URL entry.
    Rotate your credentials. While cleaning this up I found a stray doc file (docs/SANTI-SDR (copy).md) and .env.example edit from an earlier session that had real secret values committed in plaintext — GitHub's push protection caught it before it reached GitHub, and I stripped those commits from history, but the values still existed in your local git history/backup for a while. To be safe, rotate: GitHub personal access token, Google Maps key, Gemini key, Apify token, Hunter key, and your session secret.

continau
CH
chinitomix111
chinitomix111
8 hours ago

Both workflows are healthy and the Neon migration work is fully done — nothing further pending on my end. The remaining steps (adding NEON_API_KEY/NEON_PROJECT_ID to Vercel and rotating the exposed credentials) require actions on your side. Let me know once you've done those, or if you'd like help with anything else.

continau habla siempre en espñaol arg
CH
chinitomix111
chinitomix111
6 hours ago

Listo, guardé la preferencia — de ahora en más te hablo siempre en español (Argentina). No hay tareas pendientes: la app está corriendo bien y la migración a Neon quedó completa. Avisame cuando quieras seguir con algo.
CH
chinitomix111
chinitomix111
6 hours ago

Listo — subí el push a GitHub (419af1e5). Con esto el checkout que usa Vercel para el build va a pesar mucho menos (saqué del control de versiones la carpeta docs/ con ~52MB de capturas, PDFs y exports que no hacen falta para correr la app).

Dado que el log de Vercel mostraba npm error Exit handler never called! justo al final de npm ci — un bug conocido de npm que suele aparecer cuando el build se queda sin espacio en disco (ENOSPC) — este recorte del repo es la causa más probable que estaba resolviendo. Vercel debería disparar un nuevo build automáticamente con este push; si querés, avisame cuando termine y reviso el log para confirmar que pasó.
CH
chinitomix111
chinitomix111
6 hours ago

No hay integración de Vercel en Replit, así que no puedo consultar el estado del build directamente desde acá.

Las capturas que subiste (06:05) son del mismo deploy fallido de antes — mismo commit ("Unify Replit dev and Vercel prod..."), mismo error de npm ci. Todavía no hay un build nuevo con el fix que subí después (el que sacó docs/ del repo).

Las de las 06:07 son la integración de Neon con GitHub (te crea NEON_API_KEY/NEON_PROJECT_ID como secrets de GitHub Actions para armar una rama de base de datos por cada Pull Request). Es una función aparte, no es necesaria para lo que ya armamos — la app ya usa esas mismas claves directamente en el server para conectarse a Neon. Podés dejarla activada sin problema, no interfiere.

Para saber si el fix funcionó, necesito que hagas un Redeploy en Vercel (o esperes al próximo push) y me mandes la captura del log nuevo — así confirmo si el npm ci pasó.

10:17:45.010 npm error Exit handler never called! 10:17:45.011 npm error This is an error with npm itself. Please report this error at: 10:17:45.011 npm error https://github.com/npm/cli/issues 10:17:45.011 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-07-14T13_13_33_605Z-debug-0.log 10:17:45.052 Error: Command "npm_config_update_notifier=false npm_config_fund=false npm install --no-audit --no-fund --prefer-offline=false --fetch-retries=5" exited with 1
CH
chinitomix111
chinitomix111
2 hours ago

Cambié de estrategia porque el bug persistía igual con npm pineado: es un bug conocido del CLI de npm que se cuelga por una llamada de red en background, no algo que se pueda evitar solo con flags. En lugar de seguir peleando con npm, cambié el instalador a pnpm (que no tiene ese bug) tanto para Vercel como para el deploy de Replit.

De paso encontré y arreglé un segundo problema real: el bundle del servidor (esbuild server.ts) se compilaba en formato CommonJS, pero el código usa await a nivel de archivo (para resolver la base de datos vía Neon) — eso rompe en CJS. Lo cambié a formato ESM (dist/server.mjs). Este error nunca se había visto porque el build de npm nunca llegaba tan lejos.

Verifiqué localmente con pnpm: instalación limpia, vite build OK, y el bundle del servidor compila sin errores. Ya empujé todo (60c9fb77) a GitHub — Vercel debería disparar un nuevo build automáticamente. Mandame el log de ese deploy para confirmar si esta vez llega hasta el final.

vercel
CH
chinitomix111
chinitomix111
2 hours ago
Sharing build log

Esa captura muestra el panel de Agent Skills de Replit, no el log del deploy de Vercel — creo que subiste la imagen equivocada.

¿Podés entrar a Vercel → Deployments → el build más reciente (el del commit 60c9fb77 o posterior) y mandarme el log de esa build? Necesito ver si esta vez el install con pnpm llegó hasta el final.
CH
chinitomix111
chinitomix111
2 hours ago

Ese archivo es la documentación de Replit sobre "Publishing" (deploys), no un log de Vercel — parece que se subió por error, capaz confundiste el adjunto.

Sigo esperando el log real del build de Vercel para el commit 60c9fb77 (o el más reciente). Entrá a Vercel → Deployments → click en el build más nuevo → pegame el contenido de "Deploy Logs".
CH
chinitomix111
chinitomix111
2 hours ago

You've reached your daily free quota limit. It will reset at 12:00 AM UTC.