# Passage engine

## Validated story data

`parseStory` reads one `.story` authoring format into a complete immutable `Story`
before `new Game` can run. The story contains `initialVariables`, `startId`, and
`passages`. Variables are declared before the first passage; their primitive
initial values establish fixed types. Variable names and stable passage IDs share
`[a-z][a-z0-9_-]*`. IDs are authored, never derived from titles, text, or randomness.
The first passage is the start; all later navigation uses explicit destinations.

A `Passage` contains its ID, title, ordered literal effects, `paragraphs`, choices,
and optional Continue destination. Each paragraph now has one uniform record,
in place of the old `Passage.text` string array. `ChoiceCondition` was renamed
`Condition` because both paragraphs and choices use exactly the same data:

```ts
type Condition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number };

interface NarrativeParagraph {
  readonly text: string;
  readonly condition?: Condition;
}
```

Full interfaces live in `src/types.ts`. Story metadata, paragraph records and
conditions, choices, effects, and their arrays are frozen. There are no callbacks
or executable expressions in story data, parallel text/condition arrays, or
separate content registries.

## Shared condition parsing and paragraph boundaries

One `parseCondition` helper validates `variable operator literal` for both
`[if ...]` choice suffixes and `*show_if ...` narrative directives. It reuses the
existing identifier/literal rules: strict typed equality/inequality for finite
numbers, booleans and strings, and ordering for numbers only. It rejects unknown
variables, mismatched types, malformed literals, non-finite values, compound
conditions, logical operators, parentheses, and arithmetic expressions.

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

`Game` owns one frozen `GameState` with `passageId` and a frozen `variables`
record. `Story.initialVariables` is metadata, never mutable runtime state. Values
are primitives, so a new record copies all current variable data. Earlier states
and other game instances cannot change when one game progresses.

Startup and navigation share the existing private `Game.enterPassage` path:

1. Validate an eligible outgoing action against current committed state, or use
   the validated start ID for initial entry.
2. Resolve the destination and prepare an independent candidate `next` with that
   passage ID and a copy of the input variables. Initial input comes from story
   declarations; ordinary input comes from current `GameState.variables`.
3. **This candidate before effects is the future pre-passage checkpoint boundary.**
4. Apply literal `set`/`add` effects once, in source order. Assignments preserve
   types, and every addition must produce a finite number. Arithmetic uses normal
   JavaScript floating-point precision. There is no expression interpreter.
5. Freeze and return the completed candidate; only a successful return commits
   it. A failure discards all candidate changes, including earlier effects.
6. Render the committed state. Reads and rendering never apply effects. A later
   legitimate re-entry is a new entry and applies its effects once again.

Execution never reads DOM state, clocks, randomness, storage, or remote services.
Identical inputs and destinations produce identical results. Failed navigation
or numeric overflow leaves the complete current state unchanged. The browser
keeps the current passage and displays a text error; a failed initial entry
cannot expose a partially started game.

## Read-only presentation

`game.passage.paragraphs` and `.choices` retain all authored content in source
order. `game.visibleParagraphs` and `game.availableChoices` return fresh frozen
filtered arrays. Both use the same pure `evaluateCondition` function and current
committed variables, after entry effects. They do not cache visibility, change
state, or repeat effects. Re-entry recomputes both views from its new state.

The renderer consumes these views directly, never evaluates conditions itself,
and creates no elements for hidden paragraphs or choices. Native headings,
paragraphs and buttons retain their appearance and keyboard behavior. All display
content uses `textContent`; heading focus follows navigation.

Paragraph records preserve `${name}` placeholders. The pure `interpolate` helper
validates references during parsing and substitutes current post-entry values
when visible paragraphs render. Interpolation is single-pass: inserted strings
are not parsed again, including HTML or `${...}` text. Titles, choice labels, and
quoted literal values remain literal. Hidden prose is still validated before
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
no runtime behavior during Stage 4B.

## Scope and verification

Implemented: typed variables, literal entry effects, conditional choices,
one-paragraph conditional narrative, interpolation, validated text authoring,
explicit navigation, and basic rendering. No dependencies or visual redesign are
needed. Ordinary TypeScript iteration over data is not a story-language loop.

Character attributes/UI, arithmetic expressions, skills, inventory, journals,
character creation, and the saving/death roadmap require future tasks. Randomness,
glossary, shops, skill purchasing, manual saves, save slots, import/export,
procedures, subroutines, loops, and plugin systems remain excluded. System
Awakening is reference only and its engine architecture is not imported.

`npm test` covers parsing, shared comparisons, paragraph boundaries, visibility
and eligibility after effects/re-entry, interpolation, immutability, exactly-once
execution, navigation, and atomic failure. `npm run build` checks source/tests
with strict TypeScript and builds the app. Browser checks cover hidden content,
rerendering, keyboard navigation, and inert HTML-like interpolation.

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, and `npm run build` on Node.js
22 for PRs to `main` and pushes to `main`, with only `contents: read`. It does not
deploy, publish, or merge anything.
