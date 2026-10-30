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
*var influence 0
*var loyal false
*var character_name "Unknown"

*passage gate
*title The City Gate
*set character_name "Alexander"
*add influence 1

Welcome, ${character_name}. Your influence is ${influence}.

*choice
  #Meet the messenger -> messenger

*passage messenger
*title A Quiet Warning
*set loyal true

Loyal: ${loyal}.
```

Blank lines separate paragraphs; consecutive prose lines join with spaces. The
first passage starts the story. Choices and `*continue id` navigate to explicit
stable IDs. Every variable must be declared before the first passage. Values are
finite numbers, booleans, or double-quoted strings; `*set` preserves the declared
type, and `*add` only accepts numeric variables and numeric literals. Effects
must follow the title and precede all narrative.

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

Character attributes/UI, expressions and conditional choices, basic skills,
inventory quantities, chapter-organized journals, character creation, session-only
Undo, and one persistent automatic author-defined checkpoint. Undo and checkpoint
saving must share the documented pre-passage `GameSnapshot` contract; it remains
a type-only proposal. Continue Game will resume that checkpoint, and New Game will
require confirmation. Current Continue only follows an in-story destination.

Excluded unless requirements explicitly change: random mechanics, glossary,
shops, skill purchasing, manual saves, save slots, import/export, procedures,
subroutines, loops, and plugin systems. No UI redesign, storage, database, or
backend was added. System Awakening remains untouched reference material.
