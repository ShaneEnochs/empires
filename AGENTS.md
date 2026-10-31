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
  and text values intact in checkpoints and persistent storage.
- Skill definitions are immutable `Story.skills` metadata containing only IDs and
  display names. Acquired IDs belong only to `GameState.skills`: a unique,
  acquisition-ordered, frozen JSON array. Clone it for entry candidates so mixed
  skill, journal, and variable effects commit atomically. Skill IDs and variable
  IDs have separate namespaces; use the existing condition parser/evaluator for
  explicit `has_skill`/`lacks_skill` checks. The Skills control is presentation
  only; checkpoints preserve acquired IDs, not duplicate definitions.
- Item definitions are immutable `Story.items` ID/name metadata. Quantities belong
  only to the frozen `GameState.inventory` record, with positive safe integers
  and no zero properties. Clone the record for each entry candidate; every item
  operation must succeed before committing any gameplay changes. Use own-property
  checks for item reads, including `constructor`. Deletion and reacquisition must
  preserve object insertion order. Reuse shared conditions/navigation enforcement;
  inventory inspection is presentation only. The checkpoint preserves the
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
- `Game` owns exactly one in-memory `GameSnapshot`, independent of current state.
  Always capture complete pre-entry state, including accepted submitted text.
  The start passage has an automatic initial checkpoint. Authored `*checkpoint`
  is immutable passage metadata immediately after the title, before effects/prose.
  Replace the checkpoint only after successful entry, even on re-entry to the same
  ID; ordinary passages and reads must not capture. Failures preserve both state
  and checkpoint. Copy/freeze records, arrays, and journal entries explicitly.
- Validate snapshot input against current story definitions before restoration;
  reject missing/extra fields, incompatible variables, invalid IDs/quantities,
  duplicates, inherited data, and accessor callbacks. `restoreCheckpoint()` replays
  the saved pre-entry state exactly once and preserves the checkpoint itself.
  Fresh `new Game(story, { checkpoint: data })` enters that destination directly;
  never initialize the starting passage before restoring. These are engine APIs,
  not player rewind controls. Persistence must save this pre-entry snapshot.
  Do not add traditional Undo, a history stack, manual rewind, or a player-facing
  Return to Checkpoint command.
- Keep `Game` and snapshot semantics independent of browser storage. `storage.ts`
  reads/writes one localStorage key using the explicit format/story/revision
  constants and full snapshot validation. Never persist current post-entry state,
  automatically repair a save, migrate it, or delete it before replacement.
- `GameSession` prepares a restored Game once before offering Continue, then
  activates it without re-entering or writing. Empty startup must not construct a
  new Game. Explicit actions compare checkpoint references and write once only
  after replacement; ordinary transitions, failed actions, renders, panel controls,
  and form edits never save. No timers or unload saves.
- `*death` is immutable passage metadata and one concluding action after prose.
  Reject arguments, duplicates, other actions, conditional placement, a checkpoint
  in the same passage, and a starting death passage. No `isDead` state/history.
  Ordinary death entry effects use the existing atomic path. Display death prose
  before allowing recovery; no automatic retry or arbitrary outgoing navigation.
- Player recovery goes only through guarded `Game.retryAfterDeath()`, delegating
  to existing atomic `restoreCheckpoint()`. Session retry must never access storage,
  capture a checkpoint, or clear a persistence warning. Use the newest in-memory
  checkpoint even after a failed write; reload uses the older stored checkpoint.
  Preserve accepted names, all state/order, and the checkpoint reference. Failed
  retry leaves death visible and recoverable. Reject untrusted death snapshots.
- New Game rechecks record presence, confirms replacement even for unusable saves,
  constructs successfully before writing, and activates only after one successful
  replacement write. Cancellation and failed construction/writes preserve the old
  game/save. Automatic write failure instead keeps committed gameplay/checkpoint
  and displays a progress-loss warning. Inaccessible storage permits only explicit
  consent to play without saving; never imply reload survival in that mode.
- Keep stable passage/item/skill/journal/variable IDs. Bump `STORY_REVISION` for
  incompatible story changes, including entry-effect changes; bump
  `SAVE_FORMAT_VERSION` for incompatible envelope changes. Identity/revision are
  application constants, never mutable gameplay fields or scripting directives.
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

Stages 7A–7C are implemented: one in-memory checkpoint, automatic initial
capture, author-controlled `*checkpoint`, validated restoration, one versioned
localStorage record, startup, Continue Game, confirmed New Game, and death/Try Again.
Stage 8 remains future work: interface improvements, character-attribute
presentation, authoring usability, and comprehensive end-to-end testing.
Do not start later stages without a request.
There are no migrations, manual saves, multiple slots, or cloud storage.
Death shows authored prose without saving dead state over the checkpoint.
Try Again restores the existing complete pre-entry snapshot.
Submitted names and character attributes are ordinary variables; a checkpoint at
their destination already includes them. Restoring a genuine input passage permits
a new submission when rendered. There are no manual save slots or rewind controls.
Character attributes/UI and expressions still require separate requests.
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
