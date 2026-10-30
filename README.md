# Empires

A small, passage-based interactive-fiction engine written in TypeScript for the
browser. No frontend framework, backend, or runtime library dependencies.

## Install and run

Requires Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. The example offers two routes through three
passages: **gate → messenger → council**, or **gate → council**. The messenger's
Continue button explicitly targets `council`; the council is terminal. Refreshing
starts the example again. No progress is saved.

```sh
npm test          # Node's test runner: parsing, validation, navigation
npm run build    # strict TypeScript check, then browser build in dist/
npm run preview  # serve that production build locally
```

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on Node.js 22 for
pull requests targeting `main` and pushes to `main`. Its only granted permission
is reading repository contents; it does not deploy, publish, or merge anything.

## Write a story

Edit [src/example.story](src/example.story). Stories use plain text with five
constructs: `*passage id`, `*title text`, `*choice`, `#Label -> destination_id`,
and `*continue destination_id`. Blank lines separate paragraphs; consecutive
prose lines join with spaces. Content is displayed literally, without evaluating
markup or code. The first passage is the start; navigation always uses explicit
IDs, never the next passage in the file.

The parser rejects duplicate IDs, missing destinations, missing or duplicate
titles, malformed actions, and unsupported directives before play begins, with
source lines and passage IDs in errors. Validated story definitions are
immutable. One centrally owned `GameState` tracks play; rendering cannot change
it. There are no entry effects or executable scripting commands.

See the complete [authoring guide](docs/SCRIPTING.md), [engine design and proposed
snapshot contract](docs/ENGINE.md), and [contributor rules](AGENTS.md). Vite handles
TypeScript development/builds; tests use Node and tsx. JSON is no longer a story
authoring format.

## Planned future work (not implemented)

Character attributes and variables, arithmetic and conditional choices, basic
skills, inventory quantities, chapter-organized journal entries, character
creation, session-only Undo, and one persistent automatic author-defined
checkpoint. Undo and checkpoint saving must reuse the same pre-passage snapshot
boundary documented in `docs/ENGINE.md`. Continue Game will resume that checkpoint;
the current in-story Continue button only follows its explicit destination.
New Game will require confirmation before discarding progress. None of these
future gameplay systems is implemented; `GameSnapshot` is a type-only proposal.

Excluded unless requirements explicitly change: random mechanics, glossary,
shops, skill purchasing, manual saving, save slots, import/export, procedures,
subroutines, loops, and a plugin system. This stage adds no visual redesign,
cloud storage, database, or backend. System Awakening is reference only; no
engine code or architecture was imported.
