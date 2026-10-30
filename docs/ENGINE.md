# Passage engine

## Validated story data

`parseStory` reads one `.story` authoring format into a complete immutable `Story`
before `new Game` can run. The story contains `initialVariables`, `skills`,
`startId`, and `passages`. Variable and skill declarations may be interleaved
before all chapters and passages. Primitive variable initial values establish
fixed types. Variable names and stable passage IDs share
`[a-z][a-z0-9_-]*`. IDs are authored, never derived from titles, text, or randomness.
The first passage is the start; all later navigation uses explicit destinations.

A `Passage` contains its ID, static `chapter`, title, ordered literal effects, `paragraphs`, choices,
and optional Continue destination. Each paragraph now has one uniform record,
in place of the old `Passage.text` string array. `ChoiceCondition` was renamed
`Condition` because both paragraphs and choices use exactly the same data:

```ts
type Condition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number }
  | { readonly operator: 'has_skill' | 'lacks_skill'; readonly skillId: string };

interface NarrativeParagraph {
  readonly text: string;
  readonly condition?: Condition;
}
```

Full interfaces live in `src/types.ts`. Story metadata, paragraph records and
conditions, choices, effects, and their arrays are frozen. There are no callbacks
or executable expressions in story data, parallel text/condition arrays, or
separate content registries.

`*chapter Label` is parser metadata. A parser-local label starts as `Prologue`
and is copied into each following passage until another declaration. A chapter
can close a valid previous passage, but cannot bypass missing titles, prose,
choices, or a pending `*show_if`. Every declaration needs a following passage,
and variable/skill declarations must come before chapters and the first passage.
Labels are nonempty literal text, not interpolated values; repeated labels are
allowed. There is no mutable runtime `currentChapter`, so navigation order cannot
change a passage's chapter affiliation.

## Shared condition parsing and paragraph boundaries

One `parseCondition` helper validates `variable operator literal`, `has_skill id`,
and `lacks_skill id` for both `[if ...]` choice suffixes and `*show_if ...` narrative
directives. It reuses the
existing identifier/literal rules: strict typed equality/inequality for finite
numbers, booleans and strings, and ordering for numbers only. It rejects unknown
variables, mismatched types, malformed literals, non-finite values, compound
conditions, logical operators, parentheses, and arithmetic expressions. Skill
conditions validate declared skill IDs, with no numeric values or comparisons.
The shared `evaluateCondition` receives committed `GameState` and reads either
its variables or acquired skills. Ordinary variable comparisons remain unchanged.

`*show_if` attaches a condition only to the next narrative paragraph. It must
follow the title and any entry effects at a paragraph boundary. The next physical
source line must be nonblank prose, not another directive. Consecutive prose
lines join with spaces; a blank line flushes the paragraph and clears its
condition. Ordinary following prose is unconditional. Navigation, the next
passage, or EOF also finishes the final paragraph. A new `*show_if` cannot split
an existing paragraph or nest inside another pending condition.

Every passage requires at least one unconditional narrative paragraph. The parser
never manufactures fallback prose. Conditional choice blocks independently require
an unconditional action. All prose/interpolation and destinations are validated,
even when initially hidden or unreachable. Missing/duplicate IDs and titles,
empty paragraphs/choices, misplaced effects/directives, invalid actions, and
unsupported commands are rejected with source lines and passage IDs where
available. Invalid late content cannot partially initialize a game.

## State ownership and deterministic entry

`Game` owns one frozen `GameState` with `passageId`, a frozen `variables` record,
a frozen `journal` array, and a frozen `skills` array of acquired IDs.
Each frozen `JournalEntry` contains only `id`,
`chapter`, and resolved `text` strings. `Story.initialVariables` is metadata,
never mutable runtime state. Candidates copy the primitive variable record,
journal array, and acquired-skill array; existing frozen journal entries can
safely be shared. No deep-cloning framework or separate state manager is needed.
Earlier states and other games cannot change when one game progresses.

Startup and navigation share the existing private `Game.enterPassage` path:

1. Validate an eligible outgoing action against current committed state, or use
   the validated start ID for initial entry.
2. Resolve the destination and copy the complete input state into a candidate
   `next`, with a new variable record, journal array, and acquired-skill array.
   Initial input uses story variable declarations and empty journal/skills arrays;
   ordinary input uses current state.
3. **This candidate before effects is the future pre-passage checkpoint boundary.**
4. Apply `set`/`add`/`journal`/`grant_skill`/`revoke_skill` effects once, in source
   order. Assignments preserve types, and every addition must produce a finite
   number. Arithmetic uses normal
   JavaScript floating-point precision. A new journal event resolves its template
   using candidate variables at that exact point, then appends a frozen record
   with the passage's static chapter. There is no expression interpreter.
5. Freeze and return the completed candidate; only a successful return commits
   it. A failure discards all candidate changes, including earlier effects.
6. Render the committed state. Reads and rendering never apply effects. A later
   legitimate re-entry is a new entry and applies its effects once again.

Execution never reads DOM state, clocks, randomness, storage, or remote services.
Identical inputs and destinations produce identical results. Failed navigation
or numeric overflow leaves the complete current state unchanged. The browser
keeps the current passage and displays a text error; a failed initial entry
cannot expose a partially started game. Mixed skill, journal, and variable effects
roll back together, regardless of their order.

## Binary skills

`Story.skills` is a frozen array of frozen `{ id, name }` definitions, separate
from mutable gameplay data. `*skill id "Name"` uses the existing identifier and
JSON string-literal parsers. Names must be nonempty after trimming; duplicate
names are allowed, duplicate IDs are not. Skill IDs and variable IDs have separate
namespaces. Names are literal text without interpolation. Definitions can only
appear in the initial metadata section, including unused definitions.

`GameState.skills` contains acquired IDs only, as a unique JSON-serializable array
in acquisition order. New games begin empty before initial entry effects.
`*grant_skill id` appends an absent ID; `*revoke_skill id` removes a present ID.
Repeated grants and absent revocations are no-ops. Regranting after removal
appends at the end. Both commands share variable/journal effect placement, run in
source order, and reference declared skills. Unreachable passages and hidden
conditions receive the same validation. There are no conditional effects.

Only the candidate array is changed during entry. Previously committed arrays
are never mutated, and the new array is frozen before exposure. Reads, conditions,
and rendering cannot execute effects. No registry, manager, or mutable eligibility
cache exists. Skills have no numerical values or additional metadata.

## Journal recording

The parser reuses its existing string-literal parser and interpolation validation
for `*journal id "Text"`. Event IDs use the passage identifier grammar and must
be unique throughout the entire story, including unreachable passages. Journal
effects have the same title-to-first-prose placement as variable effects; they
cannot be conditional or appear in choices or narrative.

At runtime an event already present by ID is skipped, retaining its original
resolved text and chapter. Ordinary variable effects still run on re-entry.
Different IDs can have the same text. Later variable changes never rewrite
recorded text, and interpolation is single-pass. New games start from an empty
journal before initial passage effects, which may immediately record events.

Journal appends mutate only the candidate array. If an earlier or later effect
fails, none of that entry's variable or journal changes commits. This includes
multiple appends followed by overflow and failed initial entry. Successful retries
record events normally because failed attempts leave no hidden deduplication state.

## Read-only presentation

`game.passage.paragraphs` and `.choices` retain all authored content in source
order. `game.visibleParagraphs` and `game.availableChoices` return fresh frozen
filtered arrays. Both use the same pure `evaluateCondition` function and current
committed variables and acquired skills, after entry effects. They do not cache
visibility, change state, or repeat effects. Re-entry recomputes both views from
its new state.

The renderer consumes these views directly, never evaluates conditions itself,
and creates no elements for hidden paragraphs or choices. Native headings,
paragraphs and buttons retain their appearance and keyboard behavior. All display
content uses `textContent`; heading focus follows navigation.

The native Journal button controls an accessible section with `aria-expanded`
and `aria-controls`. Toggling it changes only presentation; it does not navigate,
rebuild passage choices, or execute effects. The section groups the current flat
journal under chapter headings, in first-encountered chapter order and recording
order within each chapter. Later returns to an earlier chapter append to that
existing group. DOM grouping is derived locally, never a separate state store.
An open section refreshes after a successful navigation; no entries yields the
plain empty message. Headings and entries use `textContent` throughout.

The native Skills button independently toggles a section with `aria-expanded`,
`aria-controls`, and a labeled heading. Each render derives display names from
immutable `Story.skills` using current acquired IDs in acquisition order. There
is no UI copy of acquired-skill state. Empty lists show “No skills acquired yet.”
An open section refreshes after navigation, including revocations. Toggling either
Skills or Journal never changes gameplay state; skill names use `textContent`.

Paragraph records preserve `${name}` placeholders. The pure `interpolate` helper
validates references during parsing and substitutes current post-entry values
when visible paragraphs render. Interpolation is single-pass: inserted strings
are not parsed again, including HTML or `${...}` text. Titles, choice labels, chapter labels, and
variable/condition literals remain literal; journal templates use record-time
interpolation instead. Hidden prose is still validated before
play; a false condition cannot conceal undeclared interpolation references.

`navigate()` enforces the same choice eligibility as the UI. Destinations offered
only by false conditions are rejected without applying destination effects. If
several actions share a destination, one eligible action suffices. Continue is
unconditional. Terminal passages have no actions. There is no implicit traversal,
instruction pointer, call stack, command registry, or nested scripting system.

## Saving and death roadmap — not implemented

`GameSnapshot` remains a type-only proposal containing `state: GameState` for one
future automatically maintained persistent checkpoint. No capture, restoration,
serialization, storage, checkpoint/death directives, title-screen changes, or
Try Again action exists yet.

The permanent design is:

- A first new game must establish an initial checkpoint at a stable pre-passage
  boundary, so death is recoverable before any authored checkpoint.
- Future author-controlled `*checkpoint` replaces the previous checkpoint. There
  is only one checkpoint, with no manual saving or multiple slots.
- Future `*death` displays authored narrative and a Try Again action. It must
  never overwrite the checkpoint with dead state.
- Try Again restores the complete pre-passage input state, enters the checkpoint
  passage, and applies its effects exactly once. Do not replay effects over a
  post-entry snapshot. Future nested gameplay data must be copied deeply.
- The checkpoint must eventually contain variables, skills, inventory, journal
  entries, and character-creation data. Visibility and eligibility remain derived
  views, not stored gameplay state.
- Continue Game on reopening resumes the latest checkpoint. New Game requires
  confirmation before overwriting progress.
- Traditional Undo, choice-history stacks, manual rewind, and a player-accessible
  Return to Checkpoint command are not part of this design.

Storage/version policy is deferred. In-story Continue currently just navigates
to its authored ID, and refreshing currently starts over. This roadmap introduces
no saving or death behavior in the current implementation. The complete journal
and acquired skills are already part of `GameState` and must be preserved by
that future checkpoint. Static skill definitions remain in `Story`.

## Scope and verification

Implemented: typed variables, literal entry effects, conditional choices,
one-paragraph conditional narrative, chapter metadata, journal recording/viewing,
binary skill definitions/acquisition/revocation/viewing, interpolation, validated text authoring,
explicit navigation, and basic rendering. No dependencies or visual redesign are
needed. Ordinary TypeScript iteration over data is not a story-language loop.

Character attributes/UI, arithmetic expressions, inventory,
character creation, and the saving/death roadmap require future tasks. Randomness,
glossary, shops, skill purchasing, manual saves, save slots, import/export,
procedures, subroutines, loops, and plugin systems remain excluded. System
Awakening is reference only and its engine architecture is not imported.
Skill levels, experience, purchasing, rarity, categories, cooldowns, passive
bonuses, and progression trees are excluded.

`npm test` covers parsing, shared comparisons, paragraph boundaries, visibility
and eligibility after effects/re-entry, interpolation, immutability, exactly-once
execution, navigation, chapter metadata, journal ordering/deduplication,
record-time interpolation, skill metadata/conditions/acquisition order/revocation,
nested immutability, and mixed-effect atomic failure. `npm run build` checks source/tests
with strict TypeScript and builds the app. Browser checks cover hidden content,
rerendering, keyboard navigation, and inert HTML-like interpolation.

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, and `npm run build` on Node.js
22 for PRs to `main` and pushes to `main`, with only `contents: read`. It does not
deploy, publish, or merge anything.
