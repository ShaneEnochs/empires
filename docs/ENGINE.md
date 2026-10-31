# Passage engine

## Validated story data

`parseStory` reads one `.story` authoring format into a complete immutable `Story`
before `new Game` can run. The story contains `initialVariables`, `skills`, `items`,
`startId`, and `passages`. Variable, skill, and item declarations may be interleaved
before all chapters and passages. Primitive variable initial values establish
fixed types. Variable names and stable passage IDs share
`[a-z][a-z0-9_-]*`. IDs are authored, never derived from titles, text, or randomness.
The first passage is the start; all later navigation uses explicit destinations.

A `Passage` contains its ID, static `chapter`, title, optional `checkpoint: true` or `death: true`
designation, ordered literal effects, `paragraphs`, choices,
and optional Continue destination or `textInput` action. A passage has exactly
one concluding category: choices, Continue, text input, death, or terminal. Each paragraph has one uniform record,
in place of the old `Passage.text` string array. `ChoiceCondition` was renamed
`Condition` because both paragraphs and choices use exactly the same data:

```ts
type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

type Condition =
  | { readonly variable: string; readonly operator: '==' | '!='; readonly value: VariableValue }
  | { readonly variable: string; readonly operator: '>' | '>=' | '<' | '<='; readonly value: number }
  | { readonly operator: 'has_skill' | 'lacks_skill'; readonly skillId: string }
  | { readonly operator: 'has_item' | 'lacks_item'; readonly itemId: string }
  | { readonly operator: ComparisonOperator; readonly itemId: string; readonly value: number };

interface NarrativeParagraph {
  readonly text: string;
  readonly condition?: Condition;
}
```

Full interfaces live in `src/types.ts`. Story metadata, paragraph records and
conditions, choices, effects, and their arrays are frozen. There are no callbacks
or executable expressions in story data, parallel text/condition arrays, or
separate content registries.

`TextInputAction` contains only readonly `variable`, `label`, and `destinationId`
strings. The optional `Passage.textInput` record is frozen and JSON-serializable,
with no DOM nodes, callbacks, validators, or executable instructions.

`*chapter Label` is parser metadata. A parser-local label starts as `Prologue`
and is copied into each following passage until another declaration. A chapter
can close a valid previous passage, but cannot bypass missing titles, prose,
choices, or a pending `*show_if`. Every declaration needs a following passage,
and variable/skill/item declarations must come before chapters and the first passage.
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
its variables, acquired skills, or inventory. Ordinary variable comparisons remain
unchanged, including variable IDs named after condition keywords and optional
whitespace around their operators. Item checks use `has_item id`, `lacks_item id`,
or `item_count id operator quantity`, sharing the existing six comparisons.
Item quantities use nonnegative safe integer decimal literals; absence is zero.
Unknown items and invalid operands are rejected before play.

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
a frozen `journal` array, a frozen `skills` array of acquired IDs, and a frozen
`inventory` record of owned item quantities.
Each frozen `JournalEntry` contains only `id`,
`chapter`, and resolved `text` strings. `Story.initialVariables` is metadata,
never mutable runtime state. Candidates copy the primitive variable record,
journal array, acquired-skill array, and inventory record; existing frozen journal entries can
safely be shared. No deep-cloning framework or separate state manager is needed.
Earlier states and other games cannot change when one game progresses.

Startup and navigation share the existing private `Game.enterPassage` path:

1. Validate an eligible outgoing action against current committed state, or use
   the validated start ID for initial entry.
2. Resolve the destination and copy the complete input state into a candidate
   `next`, with a new variable record, journal array, acquired-skill array, and inventory.
   Initial input uses story variable declarations, empty journal/skills arrays,
   and an empty inventory record;
   ordinary input uses current state.
   For text submission, the accepted text is already in the candidate variables
   before this copy and boundary; no destination effect runs beforehand.
3. **This candidate before effects is the pre-entry checkpoint boundary.**
4. Apply `set`/`add`/`journal`/`grant_skill`/`revoke_skill`/`add_item`/`remove_item` effects once, in source
   order. Assignments preserve types, and every addition must produce a finite
   number. Arithmetic uses normal
   JavaScript floating-point precision. A new journal event resolves its template
   using candidate variables at that exact point, then appends a frozen record
   with the passage's static chapter. There is no expression interpreter.
5. Freeze and return the completed candidate; only a successful return commits
   it. A failure discards all candidate changes, including earlier effects.
   Normal navigation/submission also commits a prepared pre-entry snapshot if the
   destination is marked `*checkpoint`; failures preserve the previous checkpoint.
6. Render the committed state. Reads and rendering never apply effects. A later
   legitimate re-entry is a new entry and applies its effects once again.

Execution never reads DOM state, clocks, randomness, storage, or remote services.
Identical inputs and destinations produce identical results. Failed navigation
or numeric overflow leaves the complete current state unchanged. The browser
keeps the current passage and displays a text error; a failed initial entry
cannot expose a partially started game. Mixed inventory, skill, journal, and variable effects
roll back together, regardless of their order.

## Explicit text submission

`*input_text variable "Label" -> destination_id` is a concluding action after
the passage's title and narrative. The parser reuses the existing identifier and
JSON-string literal rules. It requires a declared string variable, a non-whitespace
label, and an existing destination. Labels are literal, without interpolation;
quoted labels may contain arrows and JSON escapes. Whole-story validation checks
unreachable input passages too. Input cannot coexist with choices/Continue,
repeat within a passage, precede prose, follow another action, or be wrapped by
`*show_if`. No further prose/effects/actions may follow before the next passage
boundary. As with other concluding actions, a top-level chapter can end the
completed passage and assign metadata to subsequent passages.

`Game.submitText(value)` obtains the target variable and destination exclusively
from the current passage. A passage without input rejects submission unchanged.
`navigate()` still accepts only eligible choices or Continue, so it cannot enter
an input passage's destination without a successful submission. Other passages
can independently offer that same destination through their own valid actions.

The pure shared `validateTextInput` accepts only strings. It rejects C0/C1 control
characters and Unicode line/paragraph separators before trimming, so controls
cannot be hidden in outer whitespace. It trims the remaining outer whitespace
and requires 1–80 Unicode code points using string iteration, not UTF-16 length.
Internal spaces, capitalization, punctuation, combining characters, and Unicode
names remain intact. There is no linguistic or expression validation. Input is
plain data: existing single-pass interpolation never interprets inserted text.

Submission creates an independent variable record with that normalized string,
then calls the existing `enterPassage` path with the authored destination. The
complete candidate copies journal, skills, and inventory as usual. Journal text
therefore resolves the accepted value in effect order, and visibility/eligibility
use the resulting committed state. A later authored `*set` may replace it like any
other variable. Entry failure commits neither the input nor any other effect.
Repeated failed attempts do not accumulate changes; the input action remains
available for correction or retry. The same prior state and accepted value produce
the same result. Ordinary later visits apply entry effects once again.

Character creation is story-driven: string/numeric variables hold identity and
attributes, ordinary choices select backgrounds, and normal entry effects assign
variables, skills, inventory, and journal entries. There is no character object,
second variable registry, allocation engine, input history, or instruction stack.

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

## Inventory quantities

`ItemDefinition` contains only `id` and `name`. `Story.items` and its definitions
are frozen static metadata, separate from gameplay state. `*item id "Name"`
uses the existing ID and JSON-string parsers, requires a non-whitespace name,
and rejects duplicate IDs, including unused definitions. Duplicate names are
allowed. Items, skills, and variables have separate namespaces; metadata may
interleave only before all chapters/passages. Names remain literal text.

`Inventory = Readonly<Record<string, number>>` stores only owned quantities in
`GameState.inventory`. New games start empty before initial effects. Values are
positive safe integers; zero properties are deleted. Item IDs begin with letters,
so normal object insertion order matches acquisition order. Updating a quantity
retains its position; removal followed by reacquisition appends at the end.
Every quantity read uses `Object.hasOwn`, preventing inherited properties such
as `constructor` from counting as items. Definitions remain in `Story` and are
never duplicated in state. No Map, Set, manager, or mutable registry is needed.

`*add_item id quantity` and `*remove_item id quantity` share entry-effect placement
and source order. Parsing requires a declared ID and a positive safe integer
written in decimal digits, without signs, leading zeros, decimal points, exponent
notation, variables, or expressions. The same literal parser allows zero for
`item_count` comparisons. `Number.MAX_SAFE_INTEGER` is the inclusive limit.

Each entry candidate spreads the inventory into its own record. Runtime removal
requires sufficient quantity; additions must remain safe integers. Checks occur
after each operation: an invalid intermediate result fails even if a later effect
would repair it. At zero the property is deleted. Only a fully successful entry
freezes and exposes the candidate inventory. Insufficient removal, quantity
overflow, or a variable failure discards all candidate fields, including prior
item changes, skill changes, and journal appends. Repeated failures leave no
hidden state; valid alternatives and successful retries remain possible.

Item conditions use this same committed record after all entry effects. An absent
or inherited-only item counts as zero. Possession means at least one, absence
means zero; numerical comparisons never read the ordinary variable record.
The shared evaluator uses the existing comparison switch. Reads and rendering
never execute item effects or change eligibility.

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
committed variables, acquired skills, and inventory, after entry effects. They do not cache
visibility, change state, or repeat effects. Re-entry recomputes both views from
its new state.

The renderer consumes these views directly, never evaluates conditions itself,
and creates no elements for hidden paragraphs or choices. Native headings,
paragraphs and buttons retain their appearance and keyboard behavior. All display
content uses `textContent`; heading focus follows navigation.

Input passages render one native form inside passage actions, with an associated
label, single-line field initialized from the committed string, and Continue
submit button. Enter submits; the handler prevents page reload and calls only
`Game.submitText`. Browser constraint validation is disabled so the engine owns
validation and error reporting. No native `maxLength` is set because it counts
UTF-16 units rather than Unicode code points. On failure, the same form/value
remains, the field is marked `aria-invalid` and associated with a `role="alert"`
message, and focus returns to it. On success the destination renders and receives
heading focus. Authored labels, narrative, and errors use `textContent`.
Draft text exists only in the field until submission. Rendering or toggling
Journal/Skills/Inventory never submits it; toggles do not rebuild the input form.

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

Inventory uses the same native expandable-section pattern beside Journal and
Skills, with a labeled heading, `aria-controls`, `aria-expanded`, and keyboard
access. `Object.entries(game.state.inventory)` determines insertion order and
quantities; immutable item definitions supply names. Only positive quantities
exist in committed state. List entries use `textContent` for `Name × quantity`;
empty inventory shows “No items in inventory.” An open section updates after
navigation, including deletions. Toggling any section affects presentation only;
there is no UI inventory state or renderer-specific condition logic.

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

## In-memory checkpoint capture and restoration

Stage 7A implements exactly one checkpoint owned by `Game`. Its read-only
`checkpoint` getter returns a frozen `GameSnapshot` containing only
`state: GameState`. That state describes the destination **before entry effects**:
passage ID, every primitive variable, the complete ordered journal with original
IDs/chapters/resolved text, acquired skills in acquisition order, and inventory
quantities in record insertion order. Explicit copies freeze all records, arrays,
and journal entries. Snapshots contain no story definitions, derived views, DOM,
form drafts, callbacks, or previous snapshots. There is no history stack.

`*checkpoint` is static `Passage.checkpoint` metadata, not a `PassageEffect`.
The no-argument directive must be the next nonblank directive after `*title`,
before any effects/prose, and may appear only once. All concluding action
categories are permitted. Invalid placement/arguments are line-numbered parsing
errors, including in unreachable passages and conditional/input/choice blocks.

New-game construction prepares an initial snapshot from story defaults and the
start ID, then enters the start passage once. Both state and initial checkpoint
become available only after successful entry. An explicit marker on the start
passage does not add another entry or checkpoint. There is always one checkpoint
after successful initialization, even if the story has no authored markers.

For ordinary navigation and text submission, `transition` prepares a new frozen
pre-entry snapshot only if the destination is marked. It calls the existing
`enterPassage` effect path on an independent candidate, then commits state and
checkpoint together after success. Every legitimate marked re-entry replaces
the snapshot, even if its ID matches the previous one. Ordinary passages, reads,
visibility checks, interpolation, and rendering never capture. Any failure
preserves both previously committed state and checkpoint.

`restoreCheckpoint()` validates/copies the saved pre-entry state and enters its
destination through `enterPassage`. It commits only successful gameplay state
and preserves the checkpoint object itself. It deliberately does not use normal
checkpoint-replacement logic. Repeated restoration produces identical state,
without accumulating effects, journal entries, skills, or inventory. It needs no
outgoing choice from the current passage and performs no reverse operations.

`new Game(story, { checkpoint: data })` accepts unknown snapshot data, validates
it, and enters the saved destination directly. It never initializes the starting
passage first, replays earlier choices, or reconstructs history. Failed validation
or saved entry exposes no partially initialized game. Later mutation of the raw
input data cannot affect the copied/frozen checkpoint or state.

`validateSnapshot` is a schema-specific validator/copier, not a serialization
framework. It requires JSON-shaped plain records (ordinary or null prototype)
and dense native arrays with own enumerable data properties. Accessors, symbols,
hidden/extra fields, inherited data, and exotic containers are rejected without
executing accessor callbacks. The snapshot has exactly `state`, and state has
exactly `passageId`, `variables`, `journal`, `skills`, and `inventory`.

Validation requires an existing non-death passage, exact declared variable names and
matching primitive types, finite numbers, unique declared journal event IDs with
their source passages' chapters and string text, unique declared skill IDs, and
declared inventory IDs with positive safe integer quantities. Own-property checks
handle names such as `constructor`. Recorded journal text is retained as resolved
data, never re-interpolated; ordinary string variables are not revalidated as
player submissions. Invalid data is rejected, never repaired or defaulted.
Validation uses current story definitions without proving historical reachability.
The storage layer separately checks persistent envelope versions before calling it.

Text submission supplies the accepted name before snapshot capture and destination
effects. Restoring that destination preserves the name and does not prompt again;
journal effects execute once in their usual order. Restoring a genuine input
passage instead makes its input action available when rendered. Unsubmitted form
drafts are never gameplay state or checkpoint data.

These engine methods never touch browser storage or DOM. The application renders
an activated restored Game on Continue, just as explicit actions render after
navigation/submission. There is no voluntary Return to Checkpoint control.

## Persistent checkpoints and application startup

Stage 7B adds `storage.ts` and a small `GameSession` application coordinator.
Browser persistence leaves `GameState` and `GameSnapshot` unchanged and adds no
save scripting directives. Storage functions accept an injected `getItem`/`setItem` interface and
never construct a Game, execute effects, or navigate. Browser adapters defer
access to `window.localStorage` until a caught read/write operation, including
when the localStorage getter itself throws.

The one key is `empires:checkpoint:empires-example`, formed from `STORY_ID`.
The exact JSON envelope fields are `formatVersion`, `storyId`, `storyRevision`,
and `checkpoint`. Constants in `storage.ts` are `SAVE_FORMAT_VERSION = 1`,
`STORY_ID = 'empires-example'`, and `STORY_REVISION = 1`. The checkpoint is the
existing complete pre-entry snapshot, not current post-entry state. No extra
state, definitions, timestamps, drafts, or version history are serialized.

`loadCheckpoint` catches read/JSON errors, rejects missing/extra fields or
mismatched versions/identity, then calls the existing full snapshot validator.
It returns empty, loaded, invalid, or unavailable status and never writes or
deletes. `GameSession` also verifies actual entry with the restoration constructor
before offering Continue. A structurally valid but infeasible checkpoint becomes
unusable. The prepared Game is retained until selection and activated by Continue,
so probing and clicking Continue do not run effects twice. No default new Game is
constructed during empty startup. There is no second gameplay-state collection;
the active/prepared Game owns its own immutable state and checkpoint.

Startup renders a focused Empires heading and native New Game button, adding
Continue Game only for a usable save. Invalid saves display a readable explanation
without changing their bytes. Diagnostic errors are logged to the browser console.
Continue performs no storage write and enters the saved destination directly,
including accepted names or a genuine input action. Progress made in later ordinary
passages is intentionally not resumed.

New Game rechecks record presence on the explicit action and requests native
confirmation for every existing record, usable or unusable. Cancellation changes
neither the app nor saved data. A fresh candidate Game must initialize successfully
before its initial checkpoint is written with one `setItem`. Only write success
activates that candidate and resets the panels. Failed construction/write preserves
the previous active Game and saved record; no deletion precedes replacement.
An inaccessible read prevents a risky overwrite when presence cannot be checked.

Navigation/submission wrappers capture the authoritative checkpoint reference,
perform the Game action, and save once only when that reference changes. Legitimate
same-ID checkpoint re-entry also writes. Failed actions throw before any write;
ordinary transitions, getters, interpolation, renders, panel toggles, and field
editing never save. `saveCheckpoint` validates/serializes the frozen checkpoint
and catches write errors without managing gameplay. No separate save-event system
or cache of current/post-entry state is introduced.

Automatic write failure leaves successful gameplay and the new in-memory
checkpoint committed. Native localStorage replacement is atomic, so failed writes
leave old bytes intact. The app shows a persistent warning about losing progress
since the last stored checkpoint. Ordinary renders retain it; a later real
checkpoint write can succeed and clear it. There are no timers, polling, background
sync, unload handlers, or retry writes from UI inspection.

If storage is inaccessible, or New Game cannot be saved, an explicit Play without
saving action asks for consent. It initializes a new Game, disables persistence
for that game, leaves existing stored progress untouched, and keeps a clear
progress-loss notice. Cancellation/failure preserves the previous application.

Maintain stable passage, item, skill, journal, and variable identifiers. Maintainers
must deliberately bump `STORY_REVISION` for incompatible declarations, identity,
chapter, or entry-effect changes, even if the old snapshot still passes structural
validation. Bump `SAVE_FORMAT_VERSION` for incompatible envelope changes. A mismatch
never migrates, repairs, or deletes the save; confirmed New Game replaces it.
There is no automatic release-compatibility or migration framework. Data belongs
to one browser profile/origin; no cross-tab synchronization or cloud copy is added.

## Death and checkpoint recovery

`*death` is one concluding action after title and narrative, stored only as
immutable `Passage.death?: true`. It has no arguments and cannot coexist with
choices, Continue, input, or authored checkpoint metadata. It must end the passage,
and cannot occur before prose or within conditional prose; a blank line finishes
a conditional paragraph before the action. Whole-story parsing rejects invalid
and unreachable declarations with line/passage context, including an initial
death passage. Every passage still needs unconditional prose.

A death destination follows the same atomic entry path and entry-effect ordering
as every other passage. Its title and visible prose render before a native
Try Again button; no restoration happens on entry or rendering. It has no normal
outgoing action, so existing navigation/input guards remain effective.
Journal, Skills, Inventory, New Game, and storage warnings remain available.

`Game.retryAfterDeath()` verifies the current passage marker, then calls the
existing `restoreCheckpoint()`. No target/snapshot argument, runtime death mode,
history, or recovery registry is added. Restoration validates, prepares, and
commits through the existing path, preserving the checkpoint object. Accepted
names, original journal text/chapters/order, skills/order, inventory/order, and
all variables are restored together. Effects execute once from pre-entry values,
so repeated death/retry cycles give the same resulting state. Failed recovery
leaves death and checkpoint untouched and exposes an error without falling back
to New Game. The browser retains the death passage and Try Again button and focuses
the restored heading only after success.

`GameSession.retryAfterDeath()` directly calls the guarded engine operation,
without the navigation/submission persistence wrapper. It performs no storage
read/write, never clears a save-failure notice, and never captures dead state.
If checkpoint B is current in memory but its write failed after saved checkpoint A,
retry uses B while reload/Continue uses A. A later successful normal checkpoint
write may clear the warning. Explicit unsaved play recovers wholly in memory.
Snapshot validation rejects death destinations because no legitimate initial or
authored capture can target one. No save schema/envelope version changes are needed.

The example adds only optional watchtower choices/passages; original IDs,
declarations, chapters, effects, and route outcomes stay intact. Revision 1 remains
compatible, so `STORY_REVISION` is deliberately unchanged. Authors choose safe
alternatives; the engine does not prove narrative survivability.

## Later stages — not implemented

Stage 8 covers interface improvements, character-attribute presentation, authoring
usability, and comprehensive end-to-end testing. None is added in Stage 7C.
Continue Game, confirmed New Game, browser checkpoint storage, and death/Try Again
are implemented. In-story Continue still follows its explicit destination.
Traditional Undo, history stacks, manual
rewind, Return to Checkpoint controls, manual saves, and multiple slots remain
excluded. Static story metadata stays outside snapshots.

## Scope and verification

Implemented: typed variables, literal entry effects, conditional choices,
one-paragraph conditional narrative, chapter metadata, journal recording/viewing,
binary skill definitions/acquisition/revocation/viewing, interpolation, validated text authoring,
item definitions/quantities/conditions and inventory viewing,
one-field player text input and story-driven character creation,
in-memory checkpoint capture/validation/restoration,
versioned localStorage checkpoint persistence and minimal startup,
author-controlled death and guarded Try Again recovery,
explicit navigation, and basic rendering. No dependencies or visual redesign are
needed. Ordinary TypeScript iteration over data is not a story-language loop.

Character attributes/UI, arithmetic expressions,
and the later interface/authoring roadmap require future tasks. Randomness,
glossary, shops, skill purchasing, manual saves, save slots, import/export,
procedures, subroutines, loops, and plugin systems remain excluded. System
Awakening is reference only and its engine architecture is not imported.
Skill levels, experience, purchasing, rarity, categories, cooldowns, passive
bonuses, and progression trees are excluded.
Inventory excludes shops, buying/selling systems, equipment, crafting, weight,
capacity, rarity, durability, categories, descriptions, and passive effects.
Numeric input, multiple fields, complex forms, point-buy, portraits, visual
customization, and a character sheet are excluded.

`npm test` covers parsing, shared comparisons, paragraph boundaries, visibility
and eligibility after effects/re-entry, interpolation, immutability, exactly-once
execution, navigation, chapter metadata, journal ordering/deduplication,
record-time interpolation, skill metadata/conditions/acquisition order/revocation,
nested immutability, item literal validation, own-property safety, quantity limits,
insertion order, and mixed-effect atomic failure. Text-input coverage includes
parsing/normalization, Unicode limits, submission guards, input rollback,
exactly-once destination entry, and character-background routes.
Checkpoint tests cover pre-entry capture, replacement/re-entry, direct fresh
restoration, complete state/order recovery, untrusted data validation, deep
immutability, and atomic failures.
Persistence tests cover envelopes, version/identity gates, read/write failures,
confirmation/cancellation, atomic New Game replacement, exactly-once loading,
checkpoint-only writes, Unicode/order retention, and explicit unsaved play.
Death tests cover syntax/metadata, guarded full-state recovery, exactly-once
effects across repeated cycles, failed recovery, accepted names/input checkpoints,
unchanged persistent bytes, newer unsaved checkpoints, and retained warnings.
`npm run build` checks source/tests
with strict TypeScript and builds the app. Browser checks cover hidden content,
rerendering, keyboard navigation, and inert HTML-like interpolation.

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, and `npm run build` on Node.js
22 for PRs to `main` and pushes to `main`, with only `contents: read`. It does not
deploy, publish, or merge anything.
