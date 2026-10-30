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
- Chapter labels are static immutable passage metadata, never an independent
  mutable current-chapter state. Journal events belong only to `GameState.journal`.
  Apply them in entry-effect order, resolve text once when first recorded, and
  deduplicate by stable event ID. Copy the journal array for candidates and freeze
  entries; failed entry must commit neither variables nor journal changes.
- The Journal control is presentation only: viewing/grouping entries must never
  trigger entry effects, navigation, or gameplay changes. Keep recorded chapter
  and text values intact and include the complete journal in the future checkpoint.
- Skill definitions are immutable `Story.skills` metadata containing only IDs and
  display names. Acquired IDs belong only to `GameState.skills`: a unique,
  acquisition-ordered, frozen JSON array. Clone it for entry candidates so mixed
  skill, journal, and variable effects commit atomically. Skill IDs and variable
  IDs have separate namespaces; use the existing condition parser/evaluator for
  explicit `has_skill`/`lacks_skill` checks. The Skills control is presentation
  only; the future checkpoint must preserve acquired IDs, not duplicate definitions.
- Item definitions are immutable `Story.items` ID/name metadata. Quantities belong
  only to the frozen `GameState.inventory` record, with positive safe integers
  and no zero properties. Clone the record for each entry candidate; every item
  operation must succeed before committing any gameplay changes. Use own-property
  checks for item reads, including `constructor`. Deletion and reacquisition must
  preserve object insertion order. Reuse shared conditions/navigation enforcement;
  inventory inspection is presentation only. The future checkpoint preserves the
  complete inventory alongside variables, skills, and journal.
- `*input_text` is one concluding player action, never an entry effect. It targets
  a declared string variable and explicit destination from immutable passage data.
  Only `Game.submitText` may execute it; ordinary navigation cannot bypass it.
  Use the shared text validator: reject controls/line breaks, trim outer whitespace,
  and require 1–80 Unicode code points. Prepare the accepted value before the
  destination's pre-entry snapshot boundary and effects; commit only after every
  effect succeeds. Failed submissions preserve every committed field.
- Character names/background attributes are ordinary `GameState.variables`; use
  choices and normal effects for backgrounds. Do not add a CharacterState model,
  allocation engine, or form framework. Draft text may live in the native input
  until submission, but rendering and panel controls must never submit it.
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

Character attributes/UI; expressions;
one persistent automatic checkpoint; author-controlled
`*checkpoint` and `*death`; Try Again on death passages; Continue Game; and
confirmed New Game. None of this roadmap is implemented yet. The first new game
must establish an initial checkpoint; authored checkpoints replace it. Death
shows authored prose without saving dead state over the checkpoint. Try Again
restores all gameplay state, including current variables/journal/skills/inventory.
Submitted names and character attributes are already ordinary variables. A future
snapshot at an input destination includes accepted text before entry effects;
restoring it must not ask for that text again. A snapshot at a genuine input
passage shows the form and permits a new submission. There are no manual save slots
or rewind controls.
Primitive variables, literal `*set`/`*add` effects, and narrative interpolation
are implemented, as are single typed conditions on choices and narrative
paragraphs, chapter metadata, the chapter-organized journal, binary skills, item
quantities, and text input for story-driven character creation. Item operands
use decimal integer literals, never variables or
expressions; do not add shops, equipment, crafting, weight, rarity, durability,
categories, capacity, descriptions, or passive effects.
Skills have no levels, experience, purchasing, rarity, cooldowns, passive bonuses,
or progression trees. Keep these small without expanding into a general evaluator
or event framework.
Text input remains one string field per passage; exclude numeric inputs, complex
forms, point-buy, portraits, visual customization, and a character-sheet UI.

Unless a future task explicitly changes the requirements, exclude random
mechanics, glossary systems, shops, skill purchasing, manual saving, save slots,
import/export, procedures, subroutines, loops, and plugin architectures.

## Commands

Use Node.js 22.12+ and npm. Run `npm ci`, `npm test`, and `npm run build`; start
with `npm run dev`. CI runs the same checks on Node.js 22 for pull requests to
`main` and pushes to `main`. Commit source and the lockfile; `dist/` and
`node_modules/` are generated and ignored. Work on a feature branch and keep pull
requests focused; do not commit directly to `main`.
