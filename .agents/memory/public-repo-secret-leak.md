---
name: Public repo secret leak (Clientum)
description: Real API keys/session secret got committed to the public GitHub origin, not just uploaded local files — check tracked files too, not only attached_assets.
---

## What happened
Besides secrets pasted into external AI chat exports and re-uploaded as `attached_assets/*` (already gitignored, so those don't reach git), two files at the **repo root** — `chat` and `chat (copy)` — were tracked in git and pushed to `origin/main` on **clientumlatam/clientumlatam**, a **public** GitHub repo. They contain a plaintext `.env` dump (Gemini, Google Maps, Hunter, Apify, Santi keys, GitHub PAT, old SESSION_SECRET, etc.) copied from an AI chat transcript.

**Why this matters:** `attached_assets/` being gitignored is not sufficient assurance that secrets never reached git — always check `git ls-files` / `git log -- <file>` for any file suspected of containing pasted credentials, and check whether `origin` is public (`gh`/GitHub API `private` field) before judging severity.

**How to apply:** When investigating a credential-leak report in this project, don't stop at local uploaded files — grep tracked files at repo root and check remote visibility. As of 2026-07-15, user was asked (repo-private, remove-tracked-files, rotate-keys) and **declined to act immediately**; leaked keys are still live in public git history. Do not re-nag repeatedly — mention once if directly relevant, then wait for the user to initiate.
