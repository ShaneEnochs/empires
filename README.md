# Empires

A small, passage-based interactive-fiction foundation written in TypeScript for
the browser. No frontend framework, interpreter, or backend is involved.

## Run it

Requires Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. The example offers two routes through three
passages: **gate → messenger → council**, or **gate → council**. The messenger's
Continue button explicitly targets `council`; the council is a terminal passage.
Refreshing the page starts the example again. No progress is saved.

```sh
npm test          # Node's test runner: parsing, IDs, validation, navigation
npm run build    # strict TypeScript check, then browser build in dist/
npm run preview  # serve that production build locally
```

## What is built

- A validated JSON story format with stable, authored passage IDs.
- Rejection of duplicate IDs, missing destinations, and unsupported fields.
- A runtime that owns one immutable `GameState` and enters one explicit destination
  per player action. Rendering never changes gameplay state.
- Plain-text paragraphs, choice buttons, Continue, and a tiny original story.
- Core interfaces, including a **proposed, type-only** `GameSnapshot` contract.

See [engine design](docs/ENGINE.md), [story format](docs/SCRIPTING.md), and
[contributor rules](AGENTS.md). Vite handles TypeScript development/builds; tests
use Node and tsx. There are no runtime library dependencies.

## Next stage (not implemented)

Add variables and conditions with a small, explicitly defined grammar; simple
skills and item quantities; a journal; and character creation. Later add
session-only Undo and one automatic, author-defined checkpoint. Both must reuse
the same pre-passage snapshot boundary described in `docs/ENGINE.md`. Continue
eventually resumes that checkpoint from a title screen; the current in-story
Continue button simply follows its authored destination. New Game will require
confirmation before discarding progress. Build these in focused stages with
tests; this foundation has no storage, history, expression evaluator, or gameplay
effects.

Excluded: glossary, randomness, shops, skill purchasing, save slots, manual saving,
import/export, nested calls, subroutines, loops, complex UI styling, and a plugin
system. System Awakening was consulted only for the desired experience and story
syntax; no engine code or architecture was imported.
