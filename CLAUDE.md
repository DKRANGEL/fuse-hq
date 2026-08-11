# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a fork of [pixel-agents-hq/pixel-agents](https://github.com/pixel-agents-hq/pixel-agents) (MIT), merged in via the `upstream` remote. `FUSE-HQ.md` is the living planning document (in Portuguese) for this fork's specific goals and decisions — read it in full before starting work; it's the spec, and this CLAUDE.md only summarizes its key constraints.

For the upstream project's own detailed architecture reference (layering, protocol, providers, testing, build/dev commands), see `ARCHITECTURE.md` — it's the original project's `CLAUDE.md`, kept intact and up to date with `git pull upstream main`. `CONTEXT.md` is the upstream glossary for domain terms (Agent, Sub-agent, Teammate, Lead, Adopt, Headless agent, etc.) — use its vocabulary in code, comments, and docs when touching upstream-derived code.

## What this project is

`fuse-hq` is a customized instance of Pixel Agents — a pixel-art "virtual office" that visualizes AI agent sessions as animated characters in a room — built for a specific client (Mateus, owner of Magic Fireworks and other companies) to show a branded virtual office.

**Current phase deliverable is visual only**: a room styled with the company's branding and a character standing/with idle animation. No AI agent is wired up yet — this is intentional and already communicated to the client, not a gap to fill unprompted.

Do not confuse this project with the separate "IA de pedido por WhatsApp" (WhatsApp ordering AI) project, or with the broader multi-agent roadmap (travel/marketing/legal agents) described in a separate general architecture document — those are different scopes, different repos.

## Architecture decisions already made (don't reopen without strong reason)

**Future real AI agents will NOT be Claude Code CLI sessions.** They will be a custom Node.js service (part of the existing "MF Manager" stack) calling the Anthropic API and other providers directly, with per-task model routing (e.g. Haiku for triage, a larger model for reasoning, cheap open models where they suffice). This is deliberate: cost predictability, behavior control, and because these agents will eventually touch production systems (MF Manager, WhatsApp) — they can't depend on an interactive dev CLI running 24/7 in production.

**Consequence:** stock Pixel Agents only understands Claude Code sessions (via hooks or by reading `~/.claude/projects/*.jsonl`). Irrelevant to the current visual-only phase. When the first real agent is plugged in (a later phase), it will need a bridge — see below.

## Customization approach: use built-in extension points, don't fork the core

Pixel Agents already supports external customization natively. Prefer these over editing upstream files:

- **Asset customization**: use Settings → "Add Asset Directory" to load an external folder of furniture/character/decoration assets, merged with the default catalog. The path is saved in `~/.pixel-agents/config.json`. Required structure for a new asset directory:
  ```
  meus-assets/
    assets/
      furniture/
        NOME_DO_ITEM/
          manifest.json
          NOME_DO_ITEM.png
  ```
  `scripts/asset-manager.html` (ships with upstream) helps generate `manifest.json` for new assets without hand-writing JSON.
- **Layout customization**: room layout (walls, floor, colors, furniture placement) is edited via the UI's "Layout" button and persists to `~/.pixel-agents/layout.json` — don't hardcode positioning.
- **Never edit `webview-ui/public/assets/` directly** — that's upstream's default catalog; editing it makes pulling upstream updates harder. Use the external asset directory mechanism instead.

## The bridge to a real agent (future phase — do not implement yet)

Documented here so it isn't rediscovered from scratch later:

- `core/src/provider.ts` defines `AgentEvent` as a normalized model, not Claude-specific: `toolStart`, `toolEnd`, `turnEnd`, `permissionRequest`, `sessionStart`, etc.
- Only one `HookProvider` exists today, at `server/src/providers/hook/claude/`, but the interface is designed for multiple providers.
- The server exposes `POST /api/hooks/:providerId` (Bearer-token authenticated), which accepts any payload containing `session_id` and `hook_event_name` and dispatches it to the matching provider for normalization.

When the real agent service exists, the correct integration is a **new provider** under `server/src/providers/hook/<name>/` that translates that service's lifecycle (task received → `sessionStart`, processing → `toolStart`, responded → `turnEnd`) into `AgentEvent`s. The agent service itself posts these synthetic events to `/api/hooks/<provider-id>` with a `session_id` it controls. Do not implement this in the current visual-only phase.

## Deployment notes (for later)

The standalone CLI binds to `127.0.0.1` by default. Exposing it on the network requires `--host 0.0.0.0`, which upstream's own docs say should only be done on a trusted network. Production hosting is still an open question — likely behind the same VPS/Nginx setup as MF Manager, not exposed directly to the internet.

## Out of scope (do not do without an explicit new decision)

- Wiring up any agent to respond for real.
- Exposing the server outside `127.0.0.1` / the local network.
- Editing files inside `webview-ui/public/assets/`.
- Multi-company or multi-room support (not yet agreed with the client).

## Git remotes

- `origin` → `DKRANGEL/fuse-hq` (this fork)
- `upstream` → `pixel-agents-hq/pixel-agents` (for pulling updates: `git fetch upstream && git merge upstream/main`)

**Never add Claude/Claude Code as a commit author, co-author, or contributor.** No `Co-Authored-By` trailers, no "Generated with Claude Code" messages, no Claude identity in `git config`. All commits use the repo owner's own git identity.
