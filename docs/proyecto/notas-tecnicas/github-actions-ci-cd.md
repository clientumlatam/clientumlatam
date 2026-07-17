# GitHub Actions — Notas técnicas
name: Create/Delete Branch for Pull Request

on:
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
      - closed

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}

jobs:
  setup:
    name: Setup
    outputs:
      branch: ${{ steps.branch_name.outputs.current_branch }}
    runs-on: ubuntu-latest
    steps:
      - name: Get branch name
        id: branch_name
        uses: tj-actions/branch-names@v8

  create_neon_branch:
    name: Create Neon Branch
    outputs:
      db_url: ${{ steps.create_neon_branch_encode.outputs.db_url }}
      db_url_with_pooler: ${{ steps.create_neon_branch_encode.outputs.db_url_with_pooler }}
    needs: setup
    if: |
      github.event_name == 'pull_request' && (
      github.event.action == 'synchronize'
      || github.event.action == 'opened'
      || github.event.action == 'reopened')
    runs-on: ubuntu-latest
    steps:
      - name: Get branch expiration date as an env variable (2 weeks from now)
        id: get_expiration_date
        run: echo "EXPIRES_AT=$(date -u --date '+14 days' +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_ENV"
      - name: Create Neon Branch
        id: create_neon_branch
        uses: neondatabase/create-branch-action@v6
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}
          expires_at: ${{ env.EXPIRES_AT }}

# The step above creates a new Neon branch.
# You may want to do something with the new branch, such as run migrations, run tests
# on it, or send the connection details to a hosting platform environment.
# The branch DATABASE_URL is available to you via:
# "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}".
# It's important you don't log the DATABASE_URL as output as it contains a username and
# password for your database.
# For example, you can uncomment the lines below to run a database migration command:
#      - name: Run Migrations
#        run: npm run db:migrate
#        env:
#          # to use pooled connection
#          DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"
#          # OR to use unpooled connection
#          # DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url }}"

# Following the step above, which runs database migrations, you may want to check
# for schema changes in your database. We recommend using the following action to
# post a comment to your pull request with the schema diff. For this action to work,
# you also need to give permissions to the workflow job to be able to post comments
# and read your repository contents. Add the following permissions to the workflow job:
#
# permissions:
#   contents: read
#   pull-requests: write
#
# You can also check out https://github.com/neondatabase/schema-diff-action for more
# information on how to use the schema diff action.
# You can uncomment the lines below to enable the schema diff action.
#      - name: Post Schema Diff Comment to PR
#        uses: neondatabase/schema-diff-action@v1
#        with:
#          project_id: ${{ vars.NEON_PROJECT_ID }}
#          compare_branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
#          api_key: ${{ secrets.NEON_API_KEY }}

  delete_neon_branch:
    name: Delete Neon Branch
    needs: setup
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete Neon Branch
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}

---

---
title: Tú dijiste dedupe : https://github.com/clientumlatam/clientumlatam https://clien
platform: AI
messages: 4
exported_at: 2026-07-14
source: unknown
exporter: universal-ai-exporter
---

**You:**

Tú dijiste
dedupe :
https://github.com/clientumlatam/clientumlatam
https://clientumlatam.vercel.app/
https://www.clientum.com.ar/
https://www.clientum.com.ar/
https://www.clientum.com.ar/
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EwG5irfuBtnTXrfNx4d4kqKpyCdW
https://clientumlatam.vercel.app/
https://console.neon.tech/app/projects/raspy-dust-62946604/integrations#github
https://neon.com/docs/guides/cloudflare-pages
https://neon.com/docs/guides/cloudflare-workers
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/environment-variables?q=DATABASE_URL
https://vercel.com/docs/environment-variables/system-environment-variables
https://neon.com/docs/guides/vercel-managed-integration
https://github.com/apps/neon-postgres/installations
https://vercel.com/marketplace/neon
https://vercel.com/clientumlatam-4461s-projects/clientumlatam
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam
https://www.clientum.com.ar/
https://www.clientum.com.ar/
https://www.clientum.com.ar/
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam/tree/main
https://www.clientum.com.ar/
https://github.com/settings/tokens
https://github.com/settings/installations/138126401
https://replit.com/auth/github/callback?code=efdffd797c87ed3cb401&installation_id=138126401&setup_action=update
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam
https://vercel.com/clientumlatam-4461s-projects?installationId=116198802
https://replit.com/auth/github/callback?code=bdbfd138a96454497cd6&installation_id=138126401&setup_action=update
https://www.clientum.com.ar/
https://clientumlatam.vercel.app/
https://vercel.com/docs/deployments/environments#preview-environment-pre-production
https://clientumlatam.vercel.app/
https://vercel.com/clientumlatam-4461s-projects/clientumlatam
https://www.clientum.com.ar/
https://github.com/clientumlatam/clientumlatam/branches/all
https://github.com/clientumlatam/clientumlatam
https://github.com/search?q=token&type=repositories
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/deployments
https://clientumlatam-git-main-clientumlatam-4461s-projects.vercel.app/
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://github.com/clientumlatam/clientumlatam/tree/main
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://github.com/clientumlatam/clientumlatam/commits?author=clientumlatam
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://replit.com/auth/close
https://github.com/clientumlatam/clientumlatam/pulse
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://0dc64673-b71e-44b4-9f14-bc08f0b31520-00-3vpeyr13osxau.kirk.replit.dev:5000/
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam/pulse
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/build-and-deployment
https://clientumlatam.vercel.app/
https://www.clientum.com.ar/
https://github.com/clientumlatam/clientumlatam/tree/main
https://clientumlatam.vercel.app/
https://clientumlatam.vercel.app/
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://github.com/settings/installations/138126401
https://replit.com/auth/close
https://mail.google.com/mail/u/0/#inbox/FMfcgzQhVNZkdmdZSpsHCrqMGBZGxSfq
https://supabase.com/dashboard/organizations
https://console.neon.tech/app/org-broad-hill-15865505/welcome
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/clientum.com.ar/dns/records
https://github.com/clientumlatam/clientumlatam/branches
https://vercel.com/docs/deployment-retention
https://www.clientum.com.ar/
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/environment-variables
https://clientumlatam.vercel.app/
https://0dc64673-b71e-44b4-9f14-bc08f0b31520-00-3vpeyr13osxau.kirk.replit.dev:5000/
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/email-service/routing/b7dc2d647b3dcbbece0d6639ba33b87c/routing-rules
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/workers/services/edit/replit-proxy/production
https://clientum.com.ar/api/auth
https://www.clientum.com.ar/
https://www.google.com/search?client=ubuntu-sn&hs=UZv&sca_esv=6d40e3dfe8dbdd08&channel=fs&sxsrf=APpeQnusZ9qK6XsPyHmUwU6JJelAbxneRw:1784007435335&q=Horario+de+los+partidos+del+mundial&sa=X&ved=2ahUKEwiCwtbLudGVAxVyqZUCHS76MBwQ1QJ6BAgzEAE&biw=1458&bih=671&dpr=1#cobssid=s
https://remix-remix-editor-de-brochure-clientumzip-22-122-1--rule7.replit.app/
about:logins#%7B205c6a77-d8b8-4c1d-b938-b5b278777b91%7D
about:logins#%7B5a6079a0-ba63-4fc4-afe2-a0c77b50617e%7D
https://claude.ai/chat/c65b0f95-794d-4ede-8012-5b2625305a53

---

**You:**

Tú dijiste
https://github.com/clientumlatam/clientumlatam
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/3iKAY2X8bt8zfSWYp1YWrJjNMCwx
https://clientumlatam-377uwox4n-clientumlatam-4461s-projects.vercel.app/
https://vercel.com/docs/errors/not_found
https://vercel.com/docs/errors/not_found
https://clientumlatam-1ep71ftl2-clientumlatam-4461s-projects.vercel.app/
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/build-and-deployment#node.js-version
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M#L9-L10
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M
https://console.neon.tech/app/projects/raspy-dust-62946604/integrations#github
https://neon.com/docs/guides/neon-github-integration
https://console.neon.tech/app/org-broad-hill-15865505/settings#api-keys
https://github.com/clientumlatam/clientumlatam/settings/secrets/actions/NEON_API_KEY
https://github.com/clientumlatam/clientumlatam/settings/variables/actions
https://neon.com/docs/guides/neon-github-integration
https://neon.com/docs/guides/cloudflare-hyperdrive
https://github.com/clientumlatam/clientumlatam
https://gemini.google.com/app/a6b743e690e91d48
dedupe :
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/clientum.com.ar/dns/records
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/email-service/routing/b7dc2d647b3dcbbece0d6639ba33b87c/routing-rules
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/workers/services/edit/replit-proxy/production

---

**Assistant:**

Here is your deduplicated list of URLs. To make it easier to navigate, I have filtered out the duplicates and grouped the unique links by service/domain.
GitHub
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam/tree/main
https://github.com/clientumlatam/clientumlatam/branches/all
https://github.com/clientumlatam/clientumlatam/branches
https://github.com/clientumlatam/clientumlatam/commits?author=clientumlatam
https://github.com/clientumlatam/clientumlatam/pulse
https://github.com/apps/neon-postgres/installations
https://github.com/settings/tokens
https://github.com/settings/installations/138126401
https://github.com/search?q=token&type=repositories
Vercel
https://clientumlatam.vercel.app/
https://vercel.com/clientumlatam-4461s-projects/clientumlatam
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/deployments
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EwG5irfuBtnTXrfNx4d4kqKpyCdW
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/environment-variables?q=DATABASE_URL
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/environment-variables
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/build-and-deployment
https://vercel.com/clientumlatam-4461s-projects?installationId=116198802
https://clientumlatam-git-main-clientumlatam-4461s-projects.vercel.app/
https://clientumlatam-m1km27pgq-clientumlatam-4461s-projects.vercel.app/
https://vercel.com/marketplace/neon
https://vercel.com/docs/environment-variables/system-environment-variables
https://vercel.com/docs/deployments/environments#preview-environment-pre-production
https://vercel.com/docs/deployment-retention
Clientum Domain (clientum.com.ar)
https://www.clientum.com.ar/
https://clientum.com.ar/api/auth
Neon Database
https://console.neon.tech/app/projects/raspy-dust-62946604/integrations#github
https://console.neon.tech/app/org-broad-hill-15865505/welcome
https://neon.com/docs/guides/cloudflare-pages
https://neon.com/docs/guides/cloudflare-workers
https://neon.com/docs/guides/vercel-managed-integration
Replit
https://replit.com/auth/github/callback?code=efdffd797c87ed3cb401&installation_id=138126401&setup_action=update
https://replit.com/auth/github/callback?code=bdbfd138a96454497cd6&installation_id=138126401&setup_action=update
https://replit.com/auth/close
https://0dc64673-b71e-44b4-9f14-bc08f0b31520-00-3vpeyr13osxau.kirk.replit.dev:5000/
https://remix-remix-editor-de-brochure-clientumzip-22-122-1--rule7.replit.app/
Cloudflare
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/clientum.com.ar/dns/records
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/email-service/routing/b7dc2d647b3dcbbece0d6639ba33b87c/routing-rules
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/workers/services/edit/replit-proxy/production
Other Platforms (Supabase, Claude, Google, etc.)
https://supabase.com/dashboard/organizations
https://claude.ai/chat/c65b0f95-794d-4ede-8012-5b2625305a53
https://mail.google.com/mail/u/0/#inbox/FMfcgzQhVNZkdmdZSpsHCrqMGBZGxSfq
https://www.google.com/search?client=ubuntu-sn&hs=UZv&sca_esv=6d40e3dfe8dbdd08&channel=fs&sxsrf=APpeQnusZ9qK6XsPyHmUwU6JJelAbxneRw:1784007435335&q=Horario+de+los+partidos+del+mundial&sa=X&ved=2ahUKEwiCwtbLudGVAxVyqZUCHS76MBwQ1QJ6BAgzEAE&biw=1458&bih=671&dpr=1#cobssid=s
Browser Internal Links
about:logins#%7B205c6a77-d8b8-4c1d-b938-b5b278777b91%7D
about:logins#%7B5a6079a0-ba63-4fc4-afe2-a0c77b50617e%7D

---

**Assistant:**

Here is your clean, deduplicated list of unique URLs from this second batch, grouped logically by platform:
GitHub
https://github.com/clientumlatam/clientumlatam
https://github.com/clientumlatam/clientumlatam/settings/secrets/actions/NEON_API_KEY
https://github.com/clientumlatam/clientumlatam/settings/variables/actions
Vercel
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/3iKAY2X8bt8zfSWYp1YWrJjNMCwx
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/EtkkQbvcKJ5XwCAMxnyRD8BgA99M#L9-L10
https://vercel.com/clientumlatam-4461s-projects/clientumlatam/settings/build-and-deployment#node.js-version
https://clientumlatam-377uwox4n-clientumlatam-4461s-projects.vercel.app/
https://clientumlatam-1ep71ftl2-clientumlatam-4461s-projects.vercel.app/
https://vercel.com/docs/errors/not_found
Neon Database
https://console.neon.tech/app/projects/raspy-dust-62946604/integrations#github
https://console.neon.tech/app/org-broad-hill-15865505/settings#api-keys
https://neon.com/docs/guides/neon-github-integration
https://neon.com/docs/guides/cloudflare-hyperdrive
Cloudflare
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/clientum.com.ar/dns/records
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/email-service/routing/b7dc2d647b3dcbbece0d6639ba33b87c/routing-rules
https://dash.cloudflare.com/75e6100982a89eba813e2f67c15d936b/workers/services/edit/replit-proxy/production
Other Platforms
https://gemini.google.com/app/a6b743e690e91d48
