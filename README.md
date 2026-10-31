# Empires

A small, passage-based TypeScript interactive-fiction engine for the browser.
No frontend framework, backend, or runtime library dependencies.

## Install and run

Requires Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Startup offers **New Game**, plus **Continue Game**
when a usable checkpoint exists. New Game asks before replacing existing saved
progress. Continue resumes the **last checkpoint**, not the last visited passage.
The example offers **gate → messenger → council**
or **gate → council**, with different influence, honor, and loyalty values.
The messenger's Continue explicitly targets `council`; the council is terminal.
The Journal button shows recorded events grouped by chapter. The messenger route
records an extra event; journal text keeps the values present when recorded.
The Character button shows the author's selected variables in display order:
Name, Influence, Honor, and Loyal in the example. It reads current values without
changing gameplay; booleans display as Yes or No.
The Skills button lists acquired skills in acquisition order. Both routes start
with Composure, which is revoked at the council. Speaking to the messenger grants
Diplomacy and changes the council's visible prose.
The Inventory button lists item names and quantities in acquisition order. Both
routes start with ten coins and a gate token; the messenger adds two coins. The
council collects five coins and the token, leaving seven or five coins.
An optional third gate action lets the player choose a preferred name and a
noble or soldier background. The original two routes keep their outcomes.
The name is an ordinary string variable; backgrounds use choices and entry effects.
An optional watchtower route ends in authored death prose. **Try Again** returns
to the initial gate, or to the background checkpoint if a name was submitted.
Variables, journal entries, acquired skills, and inventory persist across passages.
Successful checkpoints are saved automatically in this browser. Refreshing shows
startup again; ordinary progress after the last saved checkpoint is not restored.

```sh
npm test          # parsing, validation, state effects, interpolation, navigation
npm run build    # strict TypeScript check, then browser build in dist/
npm run preview  # serve the production build locally
```

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on Node.js 22 for
pull requests to `main` and pushes to `main`. It grants only read access to
repository contents and does not deploy, publish, or merge anything.

## Reading interface

Empires keeps its Georgia type and warm background in a responsive reading
column, capped at 40rem with roomier lines and paragraph spacing. Story choices,
Continue, and Try Again use stacked primary buttons; Character, Journal, Skills,
Inventory, and New Game sit in a separate labeled tools group.

Native buttons have at least 44px touch targets and a visible keyboard focus
ring. The four independently expandable panels share headings, spacing, and
borders. Long labels, journal entries, and inventory lists wrap in normal page
flow, without nested scrolling or fixed-height clipping.

Startup, text input, validation errors, save warnings, and death passages share
the same restrained styling. Expanded tools are highlighted. Heading focus after
navigation/recovery and input focus after validation errors are unchanged.
There are no animations or scripted scrolling additions. The viewport remains
zoomable, and labels/content still render as safe text.

These changes are presentation only: story routes, syntax, state, checkpoint
timing, Continue Game, Try Again, and existing saves are unchanged.

## Write a story

Edit [src/example.story](src/example.story); read the full
[authoring guide](docs/SCRIPTING.md) for supported syntax. Authors use one small
plain-text format:

```text
*var influence 4
*skill diplomacy "Diplomacy"
*item gold_coin "Gold Coin"
*var loyal false
*var character_name "Unknown"
*stat character_name "Name"
*stat influence "Influence"
*stat loyal "Loyal"

*chapter Prologue

*passage gate
*title The City Gate
*set character_name "Alexander"
*add influence 1
*add_item gold_coin 10
*journal arrived "${character_name} arrived with influence ${influence}."

Welcome, ${character_name}. Your influence is ${influence}.

*show_if influence >= 5
The guards recognize your achievements.
They open the council doors.

*choice
  #Request an audience -> council [if influence >= 5]
  #Meet the messenger -> messenger

*passage messenger
*title A Quiet Warning
*set loyal true
*grant_skill diplomacy
*journal met_messenger "You spoke to the messenger."

Loyal: ${loyal}.

*continue council

*chapter Chapter One

*passage council
*title The Council
*remove_item gold_coin 5
*journal met_council "You entered the council chamber."

The council awaits your answer.

*show_if has_skill diplomacy
You recognize the diplomatic opening.

*show_if item_count gold_coin >= 5
Five coins remain in your purse.
```

Blank lines separate paragraphs; consecutive prose lines join with spaces. The
first passage starts the story. Choices and `*continue id` navigate to explicit
stable IDs. Declare variables, skills, and items before all chapters and passages; these
declarations may be interleaved. Variable values are finite numbers, booleans,
or double-quoted strings; `*set` preserves the declared
type, and `*add` only accepts numeric variables and numeric literals. Effects
must follow the title and precede all narrative.

`*chapter Label` assigns literal static chapter metadata to subsequent passages;
the default is `Prologue`. Chapters must follow all variable/skill/item declarations, and
each declaration needs a following passage. `*journal event_id "Text"` is an
entry effect with a story-wide unique ID. Its interpolation uses candidate
variables at that point in effect order. The resolved text and passage chapter
are recorded once; re-entry never duplicates or rewrites the event.

Recorded entries live in the frozen `GameState.journal`, participate in atomic
entry, and are part of the single in-memory checkpoint. Opening or closing the
Journal section changes no gameplay state. Chapter groups follow first-recorded
order, with events in recording order within each group; an open journal updates
after navigation. Empty journals show “No journal entries yet.”

`*skill id "Display Name"` defines immutable story metadata. IDs use
`[a-z][a-z0-9_-]*`, are unique among skills, and may match variable IDs. Names use
double-quoted JSON strings and must be nonempty after trimming; duplicate names
are allowed. Names remain literal text, without interpolation.
`*grant_skill id` and `*revoke_skill id` are entry effects referencing declared
skills. Grants append an absent ID; repeated grants and revoking an absent skill
are harmless. Revoking then regranting moves the skill to the end of acquisition
order. All effects share the same placement and execute in source order.

Only acquired IDs live in the frozen, JSON-serializable `GameState.skills` array.
New games start empty before initial effects. Entry clones skills along with
variables and journal; any failure commits none of their changes. The
single checkpoint preserves these and inventory. The Skills section derives names from
story definitions and IDs from current state, updates after navigation, and
shows “No skills acquired yet.” when empty. Its button changes no gameplay state.

`*item id "Display Name"` defines immutable `Story.items` metadata, using the same
ID and nonempty JSON-string name rules as skills. Items, skills, and variables
have separate namespaces. Only quantities live in `GameState.inventory`, a frozen
JSON-serializable record. New games start with an empty inventory before entry
effects. `*add_item id quantity` adds to the owned quantity; `*remove_item id quantity`
subtracts it and deletes the property at zero. Reacquisition appends the item at
the end of display order. Both require declared item IDs and positive safe integer
quantities written in decimal digits (`1` through `9007199254740991`, without
leading zeros). Signs, fractions, exponent notation, expressions, and variable
operands are unsupported. They share the existing entry-effect placement/order.

Insufficient removal or quantity overflow fails the entire entry, including all
earlier variable, skill, journal, and item changes. Each operation must be valid,
even if a later operation would repair it. Candidate inventory is copied before
effects; earlier states remain unchanged. The checkpoint includes it.
The native Inventory section resolves names from story definitions and lists
`Name × quantity` in insertion order. Empty inventory shows “No items in inventory.”
Opening it changes no gameplay state; all three sections update after navigation
and render authored names as safe text.

Choices may have one optional `[if variable operator literal]` suffix. Operators
are `==`, `!=`, `>`, `>=`, `<`, and `<=`; equality supports matching primitive
types, while ordering requires numbers. In the example above entry raises
influence from 4 to 5, making the audience choice available. A conditional block
must include an unconditional fallback, such as meeting the messenger.

Skills use `[if has_skill diplomacy]` or `[if lacks_skill diplomacy]`, with no
comparison operator or value. The same forms work as `*show_if has_skill diplomacy`
and `*show_if lacks_skill diplomacy`. They use the shared condition evaluator
after entry grants/revocations, including runtime navigation enforcement.

Items use `has_item id`, `lacks_item id`, or `item_count id operator quantity`
in either condition context. All six comparison operators work with nonnegative
safe integer literals, including zero. Absent items count as zero; counts never
read ordinary variables. Entry effects run before these shared checks, and the
same unconditional fallback and runtime navigation rules apply.

`passage.choices` contains all authored choices. The read-only
`Game.availableChoices` view filters them against committed state after entry
effects. The browser displays only that view; `navigate()` enforces eligibility
too. Repeated reads never change state or rerun effects. There are no expressions,
logical operators, multiple conditions, or conditional Continue actions.

`*show_if variable operator literal` applies the same condition rules to exactly
the next narrative paragraph. It must be at a paragraph boundary after the title
and entry effects, with prose on the immediately following source line. Blank
lines separate paragraphs; the following ordinary paragraph is unconditional.
Every passage requires at least one unconditional paragraph. The renderer uses
`Game.visibleParagraphs`, so hidden paragraphs create no empty elements.

`Game` owns one immutable `GameState`. It applies a destination's effects once in
source order on a candidate state and commits only after all effects succeed.
Initial entry uses the same path; later re-entry applies effects again. Reading
or rendering a passage never applies effects. Narrative `${name}` interpolation
uses the resulting state and renders as safe text, without evaluating HTML,
JavaScript, expressions, or inserted strings. Titles and choice labels stay literal.

The parser validates the whole story before play, including unreachable content,
and reports errors with source lines and passage IDs. See the
[engine design and pre-passage snapshot boundary](docs/ENGINE.md) and
[contributor rules](AGENTS.md). No new dependencies were needed for these features.

## Character panel

Declare `*stat influence "Influence"` in the initial metadata section, before
every chapter/passage and after that variable's `*var` declaration. Each variable
may be selected once; the nonempty label uses JSON double-quoted string rules.
Declarations may interleave with variables, skills, and items, and their order
determines display order. Strings, finite numbers, and booleans are supported.
Labels remain literal, without interpolation.

Character is a native expandable section beside Journal, Skills, and Inventory.
It lists labels and current committed values as semantic name/value pairs.
Booleans display as Yes/No; numbers and strings use their ordinary text without
changing stored values. All content uses `textContent`. An unconfigured story
shows “No character statistics configured.”

Open panels update after navigation, text submission, Continue Game, and Try Again.
Viewing/toggling changes neither gameplay nor persistence and does not submit
draft input. `Story.stats` holds frozen presentation metadata only; no stat values
are copied into UI state or added to `GameState` or checkpoints. Adding, reordering,
or relabeling displays alone needs no snapshot/envelope or story-revision change.
There are no formulas, derived stats, categories, progress bars, allocation, or
conditional visibility.

## Player text and character creation

`*input_text character_name "Character name" -> choose_background` concludes a
passage after its narrative. It requires a declared string variable, a nonempty
JSON-string label, and an existing explicit destination. The label stays literal.
An input passage has one field and cannot also offer choices or ordinary Continue.
The browser displays a labeled native text field and Continue submit button;
Enter submits without reloading. Journal, Skills, and Inventory remain available.

`Game.submitText(value)` validates the player action; `navigate()` cannot bypass
the form. Input must be a string, with no line breaks or C0/C1 control characters
(including tabs), even at the edges. It trims outer whitespace and accepts 1–80
Unicode code points, preserving internal spacing, capitalization, and punctuation.
Names such as `Mary Jane`, `O'Brien`, and Unicode names are valid. Text remains
plain data, never script, HTML, or an expression. Invalid submissions keep both
the current gameplay state and the typed field value, with an accessible error.

The accepted value is placed in candidate variables before destination effects,
so journal interpolation and post-entry conditions see it immediately. Entry
failure rolls back the submitted value along with every other candidate change.
Successful submissions focus the destination heading. Reads, rendering, and
opening panels never submit text or repeat effects.

There is no dedicated character object or allocation system: names, identity,
and numeric attributes are ordinary variables; backgrounds use existing choices,
skills, inventory, and journal effects. See the complete example in the
[authoring guide](docs/SCRIPTING.md#text-input-and-character-creation).
The checkpoint at an input destination includes accepted text before entry
effects, so restoration there does not prompt again. Restoring a genuine input
passage makes its form available on rendering. Draft text is never saved.

## In-memory checkpoint

`*checkpoint` marks a passage as an automatic checkpoint. It takes no arguments
and must be the next nonblank directive after `*title`, before effects or prose,
at most once per passage. It is immutable passage metadata, not an entry effect.
All action categories except death are supported. The example marks `choose_background`
after the player submits a preferred name.

Every new game establishes an initial checkpoint before starting-passage effects.
Successful entry to an authored checkpoint replaces it with the complete
destination state **before effects**: variables, journal records, ordered skills,
and ordered inventory. Re-entry updates it even for the same passage ID. Ordinary
passages and reads never replace it. Failed entry changes neither current state
nor checkpoint; failed startup exposes no partially initialized game.

The engine APIs are:

```ts
const game = new Game(story);
const snapshot = game.checkpoint; // Frozen { state: GameState }, before entry effects.
game.restoreCheckpoint();       // Engine recovery; apply saved passage effects once.
const restored = new Game(story, { checkpoint: snapshot }); // Enter saved passage directly.
```

Restoration validates and copies the snapshot, re-enters its destination, and
commits only if entry succeeds. It preserves the checkpoint itself, and repeated
restoration produces the same state without accumulating effects. Fresh-instance
restoration never runs the starting passage first. Validation checks exact fields,
declared variable types/finite values, journal IDs and origin chapters, unique
known skills, and positive safe quantities of known items. Data is copied and
deeply frozen without storing story definitions, derived views, or form drafts.
See [engine details](docs/ENGINE.md#in-memory-checkpoint-capture-and-restoration).

The engine remains independent of storage. There is no voluntary Return to
Checkpoint control; browser startup uses the checkpoint constructor for Continue.

## Persistent checkpoint and startup

`src/storage.ts` uses exactly one namespaced localStorage key,
`empires:checkpoint:empires-example`. The explicit constants are
`SAVE_FORMAT_VERSION = 1`, `STORY_ID = 'empires-example'`, and `STORY_REVISION = 1`.
Identity/revision stay outside GameState and `.story` syntax. The initial save
envelope for the shipped example is:

```json
{
  "formatVersion": 1,
  "storyId": "empires-example",
  "storyRevision": 1,
  "checkpoint": {
    "state": {
      "passageId": "gate",
      "variables": { "influence": 0, "honor": 5, "loyal": false, "character_name": "Unknown" },
      "journal": [],
      "skills": [],
      "inventory": {}
    }
  }
}
```

Maintain stable IDs. **Bump `STORY_REVISION` when changing a story incompatibly**,
including variable declarations/types, passage/item/skill/journal identities or
journal chapters, and entry effects that change saved-state behavior. Bump
`SAVE_FORMAT_VERSION` for incompatible envelope changes. There are no migrations
or version histories. Matching versions still require complete snapshot validation.

Startup parses the story, reads/validates the envelope and snapshot, and verifies
saved entry through `new Game(story, { checkpoint })`. Continue activates that
prepared Game without another entry or write. No fresh game starts automatically.
Unusable saves remain untouched, Continue is omitted, and a readable reason is
shown. Technical details are available in the browser console.

New Game confirms before replacing any existing record, including a corrupt one.
It constructs a fresh Game, writes its initial pre-entry checkpoint once using
one `setItem`, then activates it. Cancel, construction failure, or replacement
failure preserves the old game/save. New Game is also available beside the panels.

After explicit navigation or text submission, the application compares checkpoint
references and saves only a successful replacement. Re-entry to the same marked
passage saves its new snapshot. Ordinary passages, renders, conditions, panel
controls, input editing, rejected actions, and Continue Game never write. Saved
entry effects replay exactly once from pre-entry values, so reopening cannot
accumulate rewards. The current post-entry state is never a second save source.

If an automatic write fails, gameplay and the new in-memory checkpoint remain
committed, the previous persistent record remains, and a warning explains possible
loss on closing the page. A later successful checkpoint write clears the warning;
there are no timer, background, or unload retries. Blocked storage or a failed
New Game save offers **Play without saving**, requiring explicit confirmation and
keeping existing saved bytes untouched. That mode clearly warns that progress
will be lost on closing. Saves are local to this browser profile and origin.

## Death and Try Again

End a passage's authored narrative with a standalone `*death` line. It takes no
arguments, must follow the title and prose, and cannot share a passage with
choices, Continue, text input, or `*checkpoint`. Nothing may follow it before
the next passage/chapter. At least one unconditional paragraph is required;
end any conditional paragraph with a blank line before the death action.
The starting passage cannot be death, since it creates the initial checkpoint.

Death is immutable passage metadata, not an `isDead` gameplay variable. Ordinary
entry effects still run atomically before its prose displays. The player can read
that prose and inspect Journal, Skills, and Inventory before choosing Try Again;
New Game and any save warning remain available.

`Game.retryAfterDeath()` rejects outside death and delegates to the existing
checkpoint restoration. `GameSession.retryAfterDeath()` performs no storage access.
Recovery restores the complete pre-entry checkpoint and applies its effects
once, dropping all later variable, journal, skill, inventory, and death changes.
Repeated cycles never accumulate checkpoint rewards. A saved name survives at
its destination; a genuine input checkpoint offers its form again without drafts.
Failed recovery preserves the death state and checkpoint, shows an accessible
error, and lets the player retry.

Death and retry neither recapture nor write the checkpoint. If a newer checkpoint
could not be saved, Try Again uses that newer in-memory checkpoint and keeps the
warning; reopening instead resumes the older persistent checkpoint. Explicit
play without saving supports the same recovery entirely in memory.

The example additions keep `STORY_REVISION = 1`: existing IDs, declarations,
chapters, effects, and route outcomes are unchanged. The optional choices and
new passages remain compatible with existing initial/background checkpoints.
Authors provide safe alternatives; the engine does not analyze narrative loops.

## Roadmap

Stages 7A–7C, 8A, and 8B are implemented, including persistent checkpoints, death
recovery, selected character statistics, panel organization, and responsive reading
styles. Stage 8C and further authoring/usability work remain future tasks.

Traditional Undo, choice-history stacks, manual rewind, Return
to Checkpoint controls, manual saves, and save slots remain excluded. In-story
Continue only follows its explicit destination. Further character features and
arithmetic expressions still require separate requests.

Excluded unless requirements explicitly change: random mechanics, glossary,
shops, skill purchasing, manual saves, save slots, import/export, procedures,
subroutines, loops, and plugin systems. No UI redesign, third-party runtime,
database, or backend was added. System Awakening remains untouched reference material.
Skills are binary only: no levels, experience, purchasing, rarity, categories,
cooldowns, passive bonuses, or progression trees.
Inventory has no shops, buying/selling systems, equipment, crafting, weight,
capacity, rarity, durability, categories, descriptions, or automatic bonuses.
Text input has no numeric mode, multiple fields, general forms, point-buy,
portraits, visual customization, or editable character sheet.
