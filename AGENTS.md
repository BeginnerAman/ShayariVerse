# AI Agent Instructions - Shayari Website (AGENTS.md)

Welcome Agent. This project is a **premium Shayari (Hindi/Urdu Poetry) website** hosted on **GitHub Pages**.  
Before writing any code, you MUST read the specification files in this order:

## Context Loading Order:
1. `specs/project-overview.md` - Product vision, user flows, out-of-scope boundaries.
2. `specs/architecture.md` - Tech stack (HTML/CSS/JS only), folder structure, system invariants.
3. `specs/ai-workflow-rules.md` - Build discipline, verification steps, content pipeline rules.
4. `specs/code-standards.md` - Coding conventions, naming rules, banned patterns.
5. `specs/ui-context.md` - Design tokens, typography, animations, responsive breakpoints.
6. `specs/progress-tracker.md` - Current phase, completed tasks, and session decisions.

## Hosting Constraint (CRITICAL):
This website runs on **GitHub Pages** - meaning:
- **Only** HTML, CSS, and client-side JavaScript.
- **Zero** server-side code, no Node.js runtime, no API calls to paid services.
- All data is pre-built into static JSON files.
- All assets (images, audio, fonts) are served from the repo itself.

## Golden Rules:
- Buttery smooth 60 FPS animations - no jank, no layout shifts.
- Mobile-first responsive - must look stunning on phone, tablet, AND desktop.
- Performance is sacred - lazy load everything, compress assets, minimize DOM.
- Hindi/Urdu typography must be beautiful and readable at every screen size.
