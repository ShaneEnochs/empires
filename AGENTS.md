# Working on Empires

Empires is a lightweight, passage-based TypeScript interactive-fiction engine.
Keep it understandable, maintainable, and minimally dependent on external
libraries. Use the existing checkout; no frontend framework is needed.

## Permanent development rules

- Read `docs/ENGINE.md` and `docs/SCRIPTING.md` before changing behavior. Authors
  edit `.story` text; `parseStory` converts it to the existing passage data model.
- Story execution must be deterministic. Each action enters one explicit
  destination; there is no automatic execution of subsequent passages.
- `Game` owns one `GameState`. All present and future gameplay state belongs
  there. Rendering reads state and must never cause gameplay changes.
- Passage IDs are authored, unique, and stable. Never derive them from order,
  titles, prose, timestamps, or random values. Preserve IDs for navigation and
  future checkpoint compatibility.
- Future session Undo and automatic checkpoint saving must share one consistent
  pre-passage `GameSnapshot` representation. Preserve the boundary documented in
  `docs/ENGINE.md` when implementing those features.
- Implement new features only when explicitly requested. Do not replace working
  features with elaborate abstractions without a demonstrated benefit. Keep one
  authoring format; avoid parser frameworks and hypothetical extension layers.
- Every behavioral change requires appropriate tests. Keep documentation accurate
  when supported syntax or architecture changes. Test invalid input as well as
  successful paths, and validate a whole story before initializing a game.
- Render authored content with `textContent`, never as HTML. Keep native keyboard
  access and the small UI; visual changes require a concrete request.
- System Awakening is reference material only. Do not modify it, copy its engine,
  or reuse its save, undo, interpreter, or UI architecture.

## Planned features, only when requested

Character attributes and variables; arithmetic and conditional choices; basic
skills; basic inventory with quantities; journal entries organized by chapter;
character creation; Undo for recent choices in the current session; one
persistent automatic author-defined checkpoint; Continue Game; and confirmed
New Game. These are plans, not currently supported commands or gameplay systems.

Unless a future task explicitly changes the requirements, exclude random
mechanics, glossary systems, shops, skill purchasing, manual saving, save slots,
import/export, procedures, subroutines, loops, and plugin architectures.

## Commands

Use Node.js 22.12+ and npm. Run `npm ci`, `npm test`, and `npm run build`; start
with `npm run dev`. CI runs the same checks on Node.js 22 for pull requests to
`main` and pushes to `main`. Commit source and the lockfile; `dist/` and
`node_modules/` are generated and ignored. Work on a feature branch and keep pull
requests focused; do not commit directly to `main`.
