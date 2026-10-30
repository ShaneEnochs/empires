# Empires

A small, passage-based TypeScript interactive-fiction engine for the browser.
No frontend framework, backend, or runtime library dependencies.

## Install and run

Requires Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. The example offers **gate → messenger → council**
or **gate → council**, with different influence, honor, and loyalty values.
The messenger's Continue explicitly targets `council`; the council is terminal.
The Journal button shows recorded events grouped by chapter. The messenger route
records an extra event; journal text keeps the values present when recorded.
The Skills button lists acquired skills in acquisition order. Both routes start
with Composure, which is revoked at the council. Speaking to the messenger grants
Diplomacy and changes the council's visible prose.
Variables, journal entries, and acquired skills persist across passages.
Refreshing starts a new game from the story's initial values; there is no saved progress.

```sh
npm test          # parsing, validation, state effects, interpolation, navigation
npm run build    # strict TypeScript check, then browser build in dist/
npm run preview  # serve the production build locally
```

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on Node.js 22 for
pull requests to `main` and pushes to `main`. It grants only read access to
repository contents and does not deploy, publish, or merge anything.

## Write a story

Edit [src/example.story](src/example.story); read the full
[authoring guide](docs/SCRIPTING.md) for supported syntax. Authors use one small
plain-text format:

```text
*var influence 4
*skill diplomacy "Diplomacy"
*var loyal false
*var character_name "Unknown"

*chapter Prologue

*passage gate
*title The City Gate
*set character_name "Alexander"
*add influence 1
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
*journal met_council "You entered the council chamber."

The council awaits your answer.

*show_if has_skill diplomacy
You recognize the diplomatic opening.
```

Blank lines separate paragraphs; consecutive prose lines join with spaces. The
first passage starts the story. Choices and `*continue id` navigate to explicit
stable IDs. Declare variables and skills before all chapters and passages; these
declarations may be interleaved. Variable values are finite numbers, booleans,
or double-quoted strings; `*set` preserves the declared
type, and `*add` only accepts numeric variables and numeric literals. Effects
must follow the title and precede all narrative.

`*chapter Label` assigns literal static chapter metadata to subsequent passages;
the default is `Prologue`. Chapters must follow all variable/skill declarations, and
each declaration needs a following passage. `*journal event_id "Text"` is an
entry effect with a story-wide unique ID. Its interpolation uses candidate
variables at that point in effect order. The resolved text and passage chapter
are recorded once; re-entry never duplicates or rewrites the event.

Recorded entries live in the frozen `GameState.journal`, participate in atomic
entry, and will be part of the future single checkpoint. Opening or closing the
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
variables and journal; any failure commits none of their changes. The future
single checkpoint must preserve all three. The Skills section derives names from
story definitions and IDs from current state, updates after navigation, and
shows “No skills acquired yet.” when empty. Its button changes no gameplay state.

Choices may have one optional `[if variable operator literal]` suffix. Operators
are `==`, `!=`, `>`, `>=`, `<`, and `<=`; equality supports matching primitive
types, while ordering requires numbers. In the example above entry raises
influence from 4 to 5, making the audience choice available. A conditional block
must include an unconditional fallback, such as meeting the messenger.

Skills use `[if has_skill diplomacy]` or `[if lacks_skill diplomacy]`, with no
comparison operator or value. The same forms work as `*show_if has_skill diplomacy`
and `*show_if lacks_skill diplomacy`. They use the shared condition evaluator
after entry grants/revocations, including runtime navigation enforcement.

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

## Planned future work (not implemented)

Character attributes/UI, arithmetic expressions, inventory
quantities and character creation remain future work.
The saving/death roadmap is one automatic persistent checkpoint, future
author-controlled `*checkpoint`/`*death` directives, and Try Again on death
passages. A new game must establish an initial checkpoint; authored checkpoints
replace it. Try Again restores the complete pre-passage state and enters that
passage once. Death must never overwrite the checkpoint with dead state.
Continue Game will resume the latest checkpoint on reopening, and New Game will
require confirmation before overwriting progress. There will be no traditional
Undo, choice-history stack, manual rewind, Return to Checkpoint control, or save
slots. This is documentation only: `GameSnapshot` remains a type-only proposal,
and no persistence, death, title-screen changes, or Try Again is implemented.
Current Continue only follows an in-story destination.

Excluded unless requirements explicitly change: random mechanics, glossary,
shops, skill purchasing, manual saves, save slots, import/export, procedures,
subroutines, loops, and plugin systems. No UI redesign, storage, database, or
backend was added. System Awakening remains untouched reference material.
Skills are binary only: no levels, experience, purchasing, rarity, categories,
cooldowns, passive bonuses, or progression trees.
