# Passage engine

## Story data and validation

`parseStory` reads the single `.story` authoring format into immutable `Story`,
`Passage`, and `Choice` data. It validates the entire file before `new Game` can
run. Source locations remain parser-local for errors; there is no instruction
pointer, call stack, command registry, or runtime scripting language.

Variable declarations appear before the first passage. Immutable
`Story.initialVariables` records each name's initial primitive value and thus its
fixed type. Names and passage IDs share `[a-z][a-z0-9_-]*`. IDs are stable authored
identifiers, never derived from titles, prose, or random values. The first passage
supplies `startId`; moving it changes the starting location. All later navigation
uses explicit destination IDs, independent of definition order.

Each passage has one title, ordered literal entry effects, paragraph strings,
and either choices, Continue, or neither. The parser joins consecutive prose
lines with spaces and separates paragraphs on blank lines. Effects must follow
`*title` and precede all narrative. Navigation must conclude the passage.

The parser rejects duplicate IDs/declarations, malformed literals, undeclared
variables, type changes, invalid interpolation, missing/duplicate titles, empty
prose/choice blocks, misplaced effects, malformed actions, unsupported directives,
and missing destinations, including in unreachable passages. Forward passage
references work; variables must already be declared. Errors identify source lines
and passage IDs when available. Validation either throws or returns a complete
frozen story; invalid late passages cannot partially initialize gameplay.

Choices may also carry one validated `ChoiceCondition`. The parser uses its
existing identifier and literal rules, checks the declared variable and operand
types, and freezes the condition data. Every destination is validated, even when
a choice's condition is initially false. Choice blocks with any conditions must
include an unconditional choice, ensuring an available fallback. Conditional
Continue, compound conditions, expressions, and malformed suffixes are rejected.

## Core interfaces

The definitions live in `src/types.ts`:

```ts
type VariableValue = number | boolean | string;
type Variables = Readonly<Record<string, VariableValue>>;
type PassageEffect =
  | { readonly kind: 'set'; readonly variable: string; readonly value: VariableValue }
  | { readonly kind: 'add'; readonly variable: string; readonly value: number };
type ChoiceCondition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number };

interface GameState {
  readonly passageId: string;
  readonly variables: Variables;
}

interface Passage {
  readonly id: string;
  readonly title: string;
  readonly effects: readonly PassageEffect[];
  readonly text: readonly string[];
  readonly choices: readonly Choice[];
  readonly continueTo?: string;
}

interface Choice {
  readonly label: string;
  readonly destinationId: string;
  readonly condition?: ChoiceCondition;
}

interface Story {
  readonly startId: string;
  readonly initialVariables: Variables;
  readonly passages: readonly Passage[];
}

interface GameSnapshot {
  readonly state: GameState;
}
```

`Game` owns one `GameState`; all runtime gameplay values belong here. Story
metadata only defines initial values and effects. There are no separate mutable
variable registries. Both the exposed state and its variable record are frozen.
Each successful entry owns a fresh record, so previous states and other games
cannot change when the current game progresses. Values are primitives, so copying
the record copies all variable data. Story metadata, effects, choices, text arrays,
and their containing definitions are frozen as well.

## Deterministic entry and the future snapshot boundary

Startup and ordinary navigation share the private `Game.enterPassage` path:

1. `navigate` validates that the current passage offers an eligible action to the
   requested destination, using the current committed state.
   Startup uses the validated `Story.startId` instead of an outgoing action.
2. Resolve the destination, then create `next` with its `passageId` and a fresh
   copy of the input variables. Startup's input is `Story.initialVariables`;
   navigation's input is the current state's variables.
3. **This candidate, before any effects, is the future pre-passage snapshot
   boundary.** A `GameSnapshot` will eventually own a copy of this input state.
4. Apply the destination's `effects` exactly once in source order. `set` replaces
   a value with a literal of the same declared type. `add` adds a numeric literal
   to a numeric variable. Each addition must produce a finite value, even if a
   later command would replace it. There are no expressions or external effects.
5. Freeze the completed variable record and state, then return it. Only a
   successful return replaces `Game.currentState`. An error discards the candidate
   entirely; earlier effects from that attempt never affect the current state.
6. Render using the committed state. No rendering or property reads execute entry
   effects. A later legitimate navigation back to a passage is a new entry and
   applies its effects once again; it does not reset all variables to defaults.

For example, `add count 2`, `set count 10`, `add count -0.25` produces `9.75`.
Finite operands can still overflow at runtime. That failure leaves the original
state object, passage ID, and all values unchanged. The browser keeps the current
passage displayed with a text error; a valid alternate action remains usable.
If initial entry fails, no game becomes available to the UI.

Execution depends only on validated passage data and input state. It does not
read DOM state, clocks, randomness, storage, or remote services. Identical input
states and destinations produce identical results. Numeric arithmetic uses
JavaScript finite floating-point numbers, with their normal rounding behavior.

`GameSnapshot` remains a type-only proposal. There is no snapshot capture,
history, restoration, serialization, checkpoint marker, or storage implementation.
Future session Undo and the single automatic author-defined checkpoint must reuse
this same pre-entry representation. Restoring either will install its pre-entry
state and enter the identified passage once; it must not replay effects over a
post-entry snapshot. If future gameplay adds nested mutable data, snapshots and
candidate states must copy it deeply. Storage/version policy is deferred.

## Rendering and interpolation

Passage text retains `${name}` placeholders in immutable definitions. The pure
`interpolate` helper validates references during parsing and resolves them during
rendering using post-entry `GameState.variables`. It does one substitution pass:
inserted string values are not parsed again, even if they contain `${...}`, HTML,
or JavaScript-like text. Unclosed placeholders, expressions, and undeclared names
in narrative are rejected before play. A placeholder must fit on one source line.

Only narrative paragraphs interpolate. Titles, choice labels, and quoted string
literals remain literal, including placeholder-looking text. Native headings,
paragraphs, and buttons still use `textContent`. The renderer moves focus to the
new heading after navigation, never changes state, and never executes effects.
Continue remains an ordinary explicit action; no actions means a terminal
passage. There is no automatic passage traversal.

## Authored and available choices

`game.passage.choices` contains every authored choice, in source order, including
currently unavailable ones. `game.availableChoices` returns a fresh frozen array
of eligible choices in that same order. The records and optional conditions remain
immutable story data. The view is derived from `GameState.variables`; it is not a
second source of gameplay state or a cached registry.

The small pure `evaluateCondition` function supports strict `==` and `!=` for
matching primitive types, and `>`, `>=`, `<`, and `<=` for numbers only. It never
coerces values, executes entry effects, or changes state. Initial entry and later
navigation commit their effects before the view is read, so eligibility always
uses post-entry values. Re-entry recomputes eligibility from the new committed
values. Repeated reads with unchanged state produce the same choices.

The renderer consumes `game.availableChoices` directly and does not evaluate
conditions itself. Unavailable choices produce no buttons, badges, or disabled
controls. `Game.navigate()` uses the same eligibility rule, so bypassing the UI
cannot enter a destination offered only by false conditions. That rejection leaves
the entire current state unchanged and applies no destination effects. When
several authored choices share a destination, one eligible choice is sufficient;
an ineligible sibling does not block it. Continue remains unconditional, and
terminal passages legitimately expose no choices.

Availability does not belong in future snapshots: it is computed from the restored
committed state. The pre-passage snapshot boundary and atomic entry model above
are unchanged; no saving, snapshot capture, restoration, or Undo was added.

## Scope and verification

Implemented: conditional choices, primitive variables, literal `set`/`add` entry effects, narrative
interpolation, text authoring/validation, explicit navigation, and basic rendering.
There is no general expression evaluator, runtime interpreter loop, event bus,
plugin architecture, frontend framework, or state-management dependency. Ordinary
TypeScript iteration over data is not a story-language loop.

Only when requested: character attributes/UI, arithmetic expressions, conditional narrative,
basic skills, inventory quantities, chapter-organized journal entries, character
creation, recent session Undo, one persistent automatic author-defined checkpoint,
Continue Game, and confirmed New Game. These systems are not implemented here.
Random mechanics, glossary, shops, skill purchasing, manual saves, save slots,
import/export, procedures, subroutines, loops, and plugin systems remain excluded.
System Awakening remains reference only; its engine architecture is not imported.

`npm test` covers parsing and navigation guarantees, declaration/effect validation,
exactly-once entry, re-entry, source order, independent state, immutable exposed
data, interpolation, failed transitions, every comparison operator, typed condition
validation, post-entry eligibility, fallback choices, shared destinations, blocked
navigation, and immutable choice views. `npm run build` checks source/tests
with strict TypeScript and builds the browser application. Browser checks should
exercise both example routes, keyboard Continue, safe interpolation, and errors.

`.github/workflows/ci.yml` continues to run `npm ci`, `npm test`, and `npm run build`
on Node.js 22 for pull requests targeting `main` and pushes to `main`, with only
`contents: read`. It does not deploy, publish, or automatically merge anything.
