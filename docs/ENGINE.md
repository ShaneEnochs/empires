# Passage engine

## Validated story data

`parseStory` reads one `.story` authoring format into a complete immutable `Story`
before `new Game` can run. The story contains `initialVariables`, `skills`, `items`,
`stats`, `startId`, and `passages`. Variable, skill, item, and stat declarations may
be interleaved before all chapters and passages. Each stat references a variable
already declared with `*var`. Primitive variable initial values establish
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
and variable/skill/item/stat declarations must come before chapters and the first passage.
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

`StatDisplay` contains only readonly `variable` and `label` strings.
`Story.stats` is a frozen array of frozen displays in author order. `*stat`
reuses the existing identifier and JSON literal rules, requires a previously
declared own variable and non-whitespace string label, and rejects duplicate
variable references and misplaced declarations with source-line context.
Labels remain literal. String, number, and boolean variable behavior is unchanged.
This metadata adds no state fields, effects, conditions, formulas, categories,
or conditional visibility.

`panels.ts` owns the three fixed Character/Journal/People views. Character contains
Character Statistics, Skills, and Inventory as separate read-only sections.
A small private helper shares native button/section setup, heading creation,
`hidden`, and `aria-pressed`/`aria-controls`/`aria-labelledby` behavior.
Another helper shares plain text lists; journal chapter grouping/order is retained.
This is limited rendering code, with no component registry or screen framework.
`main.ts` retains startup, actions, input, errors, notices, and heading focus.

`characterStats(story, state)` derives disposable display text from committed
variables without caching. Character renders it in `dl`/`dt`/`dd` elements using
`textContent` for labels and values. Booleans become Yes/No; numbers/strings use
`String(value)` without mutating their values. No configuration shows
“No character statistics configured.” Main retains transient active-view selection; each presented view reads current
gameplay data. Navigation, submission, Continue Game, and recovery select Story;
information reflects the latest committed data when presented again.
Toggles never navigate, execute effects, submit drafts, read/write storage, or
change state; focus/error behavior stays in the existing action handlers.

Stat metadata is never persisted. The snapshot schema, save envelope, key, and
`STORY_REVISION = 1` remain unchanged. Adding/removing/reordering/relabeling stat
displays alone is compatible with previous checkpoints. Changes to the underlying
variable declarations/effects still follow the existing revision policy.

`game.passage.paragraphs` and `.choices` retain all authored content in source
order. `game.visibleParagraphs` and `game.availableChoices` return fresh frozen
filtered arrays. Both use the same pure `evaluateCondition` function and current
committed variables, acquired skills, and inventory, after entry effects. They do not cache
visibility, change state, or repeat effects. Re-entry recomputes both views from
its new state.

The renderer consumes these views directly, never evaluates conditions itself,
and creates no elements for hidden paragraphs or choices. Native headings,
paragraphs and buttons retain their semantics and keyboard behavior. All display
content uses `textContent`; heading focus follows navigation.

Stage 8B adds CSS hooks for startup, passage actions, death presentation, and
the four info panels, plus a labeled `role="group"` wrapper for utility buttons.
`style.css` provides a bounded responsive reading column, stacked story actions,
wrapping utility controls, minimum 44px touch targets, visible focus, and consistent
panel/form/error/warning styling. Long content wraps naturally; panels have no
fixed heights or internal scrolling. No animations or scripted scroll behavior
are added, and the viewport remains zoomable.
Stage 10A replaces independent visibility with one active inline view. Text
safety, session semantics, and persistence timing remain unchanged. No state, parser, snapshot, save-envelope, or revision changes occur.

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
Character/Journal/People never submits it; view changes do not rebuild the input form.

The native Journal button selects an accessible inline view with `aria-pressed`
and `aria-controls`. Toggling it changes only presentation; it does not navigate,
rebuild passage choices, or execute effects. The section groups the current flat
journal under chapter headings, in first-encountered chapter order and recording
order within each chapter. Later returns to an earlier chapter append to that
existing group. DOM grouping is derived locally, never a separate state store.
A selected view reads current state when presented; no entries yields the
plain empty message. Headings and entries use `textContent` throughout.

The Skills section within Character has a labeled heading. Each render derives display names from
immutable `Story.skills` using current acquired IDs in acquisition order. There
is no UI copy of acquired-skill state. Empty lists show “No skills acquired yet.”
Selecting Character reads current state, including revocations. Viewing either
Character or Journal never changes gameplay state; skill names use `textContent`.

Inventory follows Skills within Character, with its own labeled heading.
`Object.entries(game.state.inventory)` determines insertion order and
quantities; immutable item definitions supply names. Only positive quantities
exist in committed state. List entries use `textContent` for `Name × quantity`;
empty inventory shows “No items in inventory.” Selecting the view reflects changes after
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

Stage 9A adds explicit `StorySaveIdentity` application configuration with readonly
`storyId: string` and `storyRevision: number` fields. It belongs outside Story,
GameState, snapshots, and scripting. `validateSaveIdentity` requires exactly these
own data fields, an ID matching `^[a-z][a-z0-9_-]*$`, and a positive safe integer
revision. It rejects accessors/inherited fields and returns a frozen copy.
Configuration errors throw before storage reads or writes; they are developer
errors, separate from unusable saved records and unavailable storage.

`checkpointKey(identity)` returns `empires:checkpoint:` plus the unchanged ID,
with no normalization or content/filename inference. Each independently identified
story has one distinct key. Developers must allocate unique IDs: reusing one ID
means sharing one record. Revision is deliberately absent from the key, so a
revision change reports an incompatible save rather than an empty slot.
Storage never enumerates keys, falls back to another story, or deletes records.

`loadCheckpoint(storage, story, identity)` and
`saveCheckpoint(storage, story, checkpoint, identity)` validate the supplied
identity and use only that key. The exact JSON envelope fields remain
`formatVersion`, `storyId`, `storyRevision`, and `checkpoint`. Configured ID and
revision must match the envelope before full snapshot validation against that Story.
`SAVE_FORMAT_VERSION = 1` remains application-wide and independent of story revisions.
The checkpoint is the existing complete pre-entry snapshot, not current post-entry
state. No extra state, definitions, timestamps, drafts, or version history are serialized.

All identity arguments default to frozen `DEFAULT_SAVE_IDENTITY`, retaining
`STORY_ID = 'empires-example'`, `STORY_REVISION = 1`, and
`STORAGE_KEY = 'empires:checkpoint:empires-example'` for existing callers.
The City Gate catalog entry supplies that default; Provincial Crisis supplies
`{ storyId: 'provincial-crisis', storyRevision: 1 }` and uses
`empires:checkpoint:provincial-crisis`. Both authored stories and compatible
revision-1 saves are unchanged; there is no migration or format bump.

`new GameSession(story, storage, identity)` captures its own validated frozen
identity before startup reads. All subsequent startup, New Game rechecks/replacement,
and automatic checkpoint writes use that copy, even if the caller later changes
its original configuration object. Continue, retry, and unsaved play retain their
existing no-write behavior. `Game` has no identity or storage responsibilities.

`loadCheckpoint` catches read/JSON errors, rejects missing/extra fields or
mismatched versions/identity, then calls the existing full snapshot validator.
It returns empty, loaded, invalid, or unavailable status and never writes or
deletes. `GameSession` also verifies actual entry with the restoration constructor
before offering Continue. A structurally valid but infeasible checkpoint becomes
unusable. The prepared Game is retained until selection and activated by Continue,
so probing and clicking Continue do not run effects twice. No default new Game is
constructed during empty startup. There is no second gameplay-state collection;
the active/prepared Game owns its own immutable state and checkpoint.

After story selection, startup renders a focused story-title heading and native New Game button, adding
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
must deliberately bump the configured story revision for incompatible declarations,
chapter, or entry-effect changes, even if the old snapshot still passes structural
validation. Bump `SAVE_FORMAT_VERSION` for incompatible envelope changes. A mismatch
never migrates, repairs, or deletes the save; confirmed New Game replaces it.
There is no automatic release-compatibility or migration framework. Data belongs
to one browser profile/origin; no cross-tab synchronization or cloud copy is added.

## Static story library

Stage 9B adds `src/catalog.ts` with two bundled sources: The City Gate
(`src/example.story`) and Provincial Crisis (`examples/provincial-crisis.story`).
Entries contain a stable application `id`, title, description, Vite `?raw` source,
explicit `StorySaveIdentity`, and read-only People definitions. Catalog/entry/identity
and People data is frozen. Initialization
rejects invalid/duplicate catalog IDs and duplicate save IDs, even if revisions differ.
Catalog IDs need not equal save IDs: `city-gate` deliberately keeps the established
`empires-example` save identity. Titles/files/content never determine either ID.

`renderLibrary` builds text and native selection buttons without parsing stories,
constructing sessions/Games, or accessing storage. A selection calls `selectStory`,
which parses only that source and creates its GameSession with the entry's identity.
The selected Story/session live together in that invocation's closure; all existing
gameplay handlers and `createPanels(story, game)` use those same objects. No second
renderer or mutable active-story registry is needed.

Startup keeps the existing Continue/New Game/unusable-save/unsaved-play behavior.
Back to Stories replaces the pre-game DOM with the library without initializing a
Game or accessing storage. Removed startup handlers do not remain attached to the
new screen. Selecting a saved story prepares its restored Game through the existing
session validation; going back discards that startup without activating gameplay
or changing saved bytes. Library/startup/gameplay headings retain native focus behavior.

After gameplay starts, there is no story-switch or checkpoint-return control.
Reloading/reopening returns to the library, where each story independently offers
its latest saved checkpoint. New Game checks/confirms/replaces only the selected
record; corrupt progress in one story does not disable the other. Death/retry keeps
using the selected session's newest in-memory checkpoint and never writes a save.
Panels and accepted player names remain story-specific; nothing transfers between games.

To add a bundled story, explicitly import its raw source and add a static catalog
entry with unique catalog/save IDs and an intentional compatible revision. Keep
the existing source/API playtests and add browser coverage. No dynamic discovery,
URL routing, content service, plugin system, or third-party runtime is introduced.

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
Character, Journal, People, New Game, and storage warnings remain available.

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

## Authoring preflight

`src/preflight.ts` is separate from browser/runtime orchestration.
`analyzeStory(story, maxRoutes = 2000)` accepts an already parsed immutable Story
and returns a frozen `PreflightReport`. `exploreGameplay` exposes the same bounded
runtime exploration without structural checks. Reports contain diagnostics,
`exploredRoutes` (attempted replay prefixes), `limitReached`, `reentryProbes`,
`successfulReentries`, and `skippedReentries`. Neither function accepts an active Game or uses GameSession,
storage, snapshots for branching, or browser APIs.

Each diagnostic has a stable `code`, `severity` (`error`, `warning`, or
`information`), optional `passageId`, concise `message`, recommended `action`,
and an optional concrete `route`. Route entries have a `passageId` and optional
`input` string: the first creates a fresh Game at start; each later entry calls
`navigate(passageId)`, or `submitText(input)` on the previous passage. The final
entry is the failed attempt. Replay against the same unchanged story to reproduce
the failure. Route arrays/entries and diagnostics are frozen and JSON-serializable.

| Code | Severity | Meaning |
| --- | --- | --- |
| `UNREACHABLE_PASSAGE` | warning | No structural path from start, even with all conditional choices traversable. |
| `REPEATABLE_EFFECT` | warning | A graph-cycle passage has a nonzero numeric add or item add/remove effect; checkpoint metadata is highlighted. |
| `ENTRY_FAILURE` | error | Initial entry or an actually executed eligible transition threw; the runtime message and route are retained. |
| `REPRESENTATIVE_INPUT` | information | Text was submitted as `"Preflight Reader"`; other values remain untested. |
| `REENTRY_TESTED` | information | Aggregated attempted first-return probes and successful return entries; exits may fail separately. |
| `REENTRY_SKIPPED` | information | Eligible returns were omitted by the one-repeat bound or shared route budget. |
| `EXPLORATION_LIMIT` | information | The shared route-prefix budget omitted eligible ordinary, return, or immediate-exit work. |
| `ANALYSIS_SCOPE` | information | The report cannot establish complete story correctness. |

The graph includes choice, Continue, and text-input destinations. Structural
traversals ignore conditions; death and ordinary endings terminate. Iterative
reachability finds unused content and cycle membership by checking whether a
passage is reachable again through its successors. Cycle warnings preserve
authored passage/effect order, include unreachable cycles, and do not imply that
conditions permit the cycle. Journal, set, skill grant/revoke, and zero numeric
adds are not accumulation warnings. This does not prove those effects harmless
in all surrounding gameplay states.

Breadth-first exploration queues complete action prefixes in authored choice
order. Each prefix is replayed from a fresh Game; Game alone filters choices,
validates actions/input, applies effects, and captures private in-memory checkpoints.
No effect arithmetic or condition evaluator is duplicated. Converging paths keep
their distinct histories; only equivalent eligible choices with the same
destination in one state are collapsed. No state is copied into another game via
a fabricated checkpoint. A failed prefix stops there; a death or ordinary ending
is not itself a failure. Recovery is deliberately not followed.

Stage 9D gives queue entries three fixed phases: ordinary, re-entry, and follow-up.
Ordinary prefixes remain simple. An eligible action back to an ID already in the
route queues a re-entry prefix, replayed completely from a fresh Game through the
return. After successful entry, current Game eligibility is read again. Each
eligible exit to an unvisited ID queues one follow-up prefix, which is never
expanded. Exits to previously visited IDs are skipped, preserving the strict
one-repeated-entry bound. Failed returns and death passages have no follow-ups.
This is one fixed search, with no strategy selection or arbitrary recursive loops.

The queue holds at most `maxRoutes` prefixes (a positive safe integer, default
2,000), shared by all three phases. `exploredRoutes` counts every replayed prefix
once, including failures and initial entry. `reentryProbes` counts distinct
first-return prefixes whose return action was attempted; `successfulReentries`
counts successful return entries, regardless of a subsequent exit failure.
Replaying that return as part of a follow-up is included in that follow-up's
prefix execution, not counted as another distinct probe. `skippedReentries`
counts eligible return actions rejected by the one-repeat bound or budget.
Budget omissions set `limitReached`, including omissions of first returns or
follow-ups. Further-return omissions also receive `REENTRY_SKIPPED` even when
the queue budget is not exhausted. Successful/failed return totals use a single
`REENTRY_TESTED` summary, rather than one information diagnostic per cycle.
Failures retain the whole repeated-ID route. Identical route/message failures
are suppressed; different routes to the same failing passage remain useful.

The limit bounds exploration work, not the size of the input file or structural
graph. A drained queue is not evidence about longer loops, continuations beyond
the immediate exit, other input values, restoration, or narrative intentions.
Re-entered checkpoints update normally through Game; a failed entry preserves
its prior state/checkpoint. No checkpoint restore or Try Again is invoked.
Reports append runtime diagnostics in deterministic breadth-first discovery order
after structural warnings. CLI grouping preserves that order within each passage.

`scripts/check-stories.ts` reads the two bundled files by default, or explicit
`.story` paths supplied after `npm run check:stories --`. It parses normally,
prints diagnostics grouped by file/passage plus counts, and exits 1 for parser,
file (`PARSE_ERROR`/`FILE_ERROR`), or reproduced runtime errors. Warnings and
information exit 0. No browser bundle imports the analyzer or CLI. CI runs the
command as well as the existing Node/build/Chromium checks.

The bundled-story review found no confirmed defects or structural warnings:
The City Gate has 14 prefixes, no return candidates, and two information diagnostics.
Provincial Crisis has 1,098 prefixes and four information diagnostics. Its four
first-return probes succeed; eight immediate exits are checked. The intentional
queue/offer cycle keeps one original journal event on return. Four further
returns to the already visited offer are skipped by the one-repeat bound.
Both use representative input and report scope, and neither reaches the default
limit. No story defect was found. Existing route/recovery tests remain
necessary; authored sources, identity/revision, and browser gameplay are unchanged.

## Later stages — not implemented

Stage 8A adds read-only selected statistics and limited panel organization.
Stage 8B adds responsive reading styles. Stage 8C adds permanent browser integration
tests. Stage 8D adds the separate Provincial Crisis story and API playtests without
engine changes. Its playtest notes document current language/deployment limits;
Stage 9A adds explicit story identity configuration and shared-storage isolation
tests. Stage 9B adds the static two-story browser library with independent startup
and progress. Stage 9C adds separate authoring preflight and concrete-route diagnostics;
Stage 9D extends it with bounded first returns and immediate-exit probes.
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
versioned localStorage checkpoint persistence, static story library, and per-story startup,
author-controlled death and guarded Try Again recovery,
static stat-display declarations and read-only Character viewing,
explicit navigation, and basic rendering. No dependencies or visual redesign are
needed. Ordinary TypeScript iteration over data is not a story-language loop.

Further character features, arithmetic expressions,
and the later interface/authoring roadmap require future tasks. Randomness,
glossary, shops, skill purchasing, manual saves, save slots, import/export,
procedures, subroutines, loops, and plugin systems remain excluded. System
Awakening is reference only and its engine architecture is not imported.
Skill levels, experience, purchasing, rarity, categories, cooldowns, passive
bonuses, and progression trees are excluded.
Inventory excludes shops, buying/selling systems, equipment, crafting, weight,
capacity, rarity, durability, categories, descriptions, and passive effects.
Numeric input, multiple fields, complex forms, point-buy, portraits, visual
customization, and an editable character sheet are excluded.

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
Stat tests cover earlier-variable references, labels, order/immutability, primitive
formatting, state updates, read-only inspection, and pre-existing save compatibility.
`npm run build` checks source/tests
with strict TypeScript and builds the app. Browser checks cover hidden content,
rerendering, keyboard navigation, and inert HTML-like interpolation.

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, `npm run build`, and
`npm run test:e2e` on Node.js 22 for PRs to `main` and pushes to `main`, with only
`contents: read`. It installs Playwright Chromium/system dependencies and uploads
failure traces/screenshots and the HTML report. The isolated production browser
suite supplements the unchanged Node tests without app hooks or test-only routes.
See README for local installation and diagnostics. CI does not deploy, publish,
or merge anything.


## Compact reading views and deliberate choices (Stage 10B)

Gameplay starts with four equal-width grid controls in one row: Story, Character,
Journal, People. Flat tabs have at least 44px targets and an active underline.
An opaque CSS sticky wrapper holds the tabs and a separate compact chapter bar,
derived from `game.passage.chapter` after each successful action. The passage
heading remains in scrollable content; CSS scroll spacing keeps focus visible.
Branding remains on library/startup screens, which have no chapter bar. One active
content view uses the same centered column at every viewport width. Native
buttons expose aria-pressed; hidden subtrees are removed from keyboard and
assistive navigation. Information headings receive focus on selection; Story
returns focus to the passage heading. This is presentation only, with no new
story directives or persisted state.

Main retains the story DOM while information is shown, so unsubmitted text,
validation errors, and selected choices survive. It refreshes only the selected read-only view through
panels.ts. View selection never runs GameSession actions, rerenders the passage,
or touches storage. New Game and save warnings stay outside the hidden content.
Successful navigation/input/retry rebuild the passage and select Story. Checkpoint
and save compatibility remain unchanged. The muted palette uses system fonts;
there are no animations, overlays, sidebars, or separate mobile navigation.

Authored choices are native radio rows within a labeled fieldset, followed by
Next. Every render starts with no selection and disabled Next. Selecting a radio
only records a transient choice in that passage's rendering closure and enables
Next; it never calls Game/GameSession or touches persistence. Native arrow keys
and Space select, Tab reaches Next, and Enter/Space commits. Next calls only
`session.navigate(selected.destinationId)`; Game still enforces eligibility and
applies effects. Success rebuilds the passage and drops selection, including
same-ID entries and recovery. Failure retains the DOM, choice, and existing error
behavior. Reload never persists the uncommitted selection. Continue, text-input
submission, Try Again, terminal endings, and New Game keep their distinct behaviors.

`people.ts` defines small frozen per-story arrays associated through `catalog.ts`.
Each PersonReference has `id`, `name`, `description`, and `discoveryEvents`.
`validatePeople` checks stable/unique IDs, nonempty text, and one or more real
journal event IDs in the selected parsed Story before session construction.
The library remains inert: importing metadata does not parse stories or read saves.
`encounteredPeople` filters these definitions from the current journal on each
People render. Any listed event establishes discovery; missing events reveal
nothing. Recovery naturally removes references whose events were rolled back.
Definitions describe only authored encounters; prose alone adds no tracking.
They are never fields in Story, GameState, snapshots, or save envelopes.
