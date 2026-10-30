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
Variables persist across passage entries in the current game. Refreshing starts
a new game from the story's initial values; there is no saved progress.

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
*var loyal false
*var character_name "Unknown"

*passage gate
*title The City Gate
*set character_name "Alexander"
*add influence 1

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

Loyal: ${loyal}.

*continue council

*passage council
*title The Council

The council awaits your answer.
```

Blank lines separate paragraphs; consecutive prose lines join with spaces. The
first passage starts the story. Choices and `*continue id` navigate to explicit
stable IDs. Every variable must be declared before the first passage. Values are
finite numbers, booleans, or double-quoted strings; `*set` preserves the declared
type, and `*add` only accepts numeric variables and numeric literals. Effects
must follow the title and precede all narrative.

Choices may have one optional `[if variable operator literal]` suffix. Operators
are `==`, `!=`, `>`, `>=`, `<`, and `<=`; equality supports matching primitive
types, while ordering requires numbers. In the example above entry raises
influence from 4 to 5, making the audience choice available. A conditional block
must include an unconditional fallback, such as meeting the messenger.

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

Character attributes/UI, arithmetic expressions, basic skills, inventory
quantities, chapter-organized journals, and character creation remain future work.
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
