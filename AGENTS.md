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
- Entry effects run once in source order on a private candidate state; commit
  only when every effect succeeds. Initial entry and navigation share this path.
  Never apply effects from rendering, getters, or interpolation. Keep declarations,
  effects, and exposed variable records immutable; preserve declared types and
  finite numeric values.
- Passage IDs are authored, unique, and stable. Never derive them from order,
  titles, prose, timestamps, or random values. Preserve IDs for navigation and
  future checkpoint compatibility.
- Preserve the pre-passage `GameSnapshot` boundary for the future single persistent
  checkpoint. Restoration must enter its passage and apply effects exactly once.
  Do not add traditional Undo, a history stack, manual rewind, or a player-facing
  Return to Checkpoint command.
- Implement new features only when explicitly requested. Do not replace working
  features with elaborate abstractions without a demonstrated benefit. Keep one
  authoring format; avoid parser frameworks and hypothetical extension layers.
- Every behavioral change requires appropriate tests. Keep documentation accurate
  when supported syntax or architecture changes. Test invalid input as well as
  successful paths, and validate a whole story before initializing a game.
- Render authored content with `textContent`, never as HTML. Keep native keyboard
  access and the small UI; visual changes require a concrete request.
- Use `Game.availableChoices` for display and enforce the same eligibility inside
  navigation. Conditions are immutable data evaluated against committed state;
  eligibility checks must never mutate state or repeat entry effects. Conditional
  choice blocks require an unconditional fallback. Use `Game.visibleParagraphs`
  for narrative; choices and paragraphs share one condition parser/evaluator.
  Every passage must have unconditional prose. `*show_if` marks one paragraph,
  never commands or nested blocks, and visibility must remain read-only.
- System Awakening is reference material only. Do not modify it, copy its engine,
  or reuse its save, undo, interpreter, or UI architecture.

## Planned features, only when requested

Character attributes/UI; expressions; basic
skills; basic inventory with quantities; journal entries organized by chapter;
character creation; one persistent automatic checkpoint; author-controlled
`*checkpoint` and `*death`; Try Again on death passages; Continue Game; and
confirmed New Game. None of this roadmap is implemented yet. The first new game
must establish an initial checkpoint; authored checkpoints replace it. Death
shows authored prose without saving dead state over the checkpoint. Try Again
restores all gameplay state, including future skills, inventory, journal, and
character-creation data. There are no manual save slots or rewind controls.
Primitive variables, literal `*set`/`*add` effects, and narrative interpolation
are implemented, as are single typed conditions on choices and narrative
paragraphs. Keep these small without expanding into a general evaluator.

Unless a future task explicitly changes the requirements, exclude random
mechanics, glossary systems, shops, skill purchasing, manual saving, save slots,
import/export, procedures, subroutines, loops, and plugin architectures.

## Commands

Use Node.js 22.12+ and npm. Run `npm ci`, `npm test`, and `npm run build`; start
with `npm run dev`. CI runs the same checks on Node.js 22 for pull requests to
`main` and pushes to `main`. Commit source and the lockfile; `dist/` and
`node_modules/` are generated and ignored. Work on a feature branch and keep pull
requests focused; do not commit directly to `main`.
