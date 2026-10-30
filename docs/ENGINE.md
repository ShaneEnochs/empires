# Engine foundation

## Current execution model

`parseStory` validates a complete JSON story and returns frozen data. IDs are
authored identifiers; they never depend on file order, titles, or text. All choice
and Continue destinations, including those in unreachable passages, must exist
before a game starts. The parser rejects unknown fields and malformed data rather
than trying to interpret it.

`Game` privately owns one `GameState`. It starts at `Story.startId`. An action
calls `navigate(destinationId)`, which verifies that the current passage offers
that destination, verifies the passage exists, and replaces the state. Rejected
navigation leaves state untouched. There is no fall-through to the next passage,
automatic traversal, instruction pointer, call stack, or background execution.
Entering a passage currently means selecting its content; there are no entry
effects to execute yet. The same story and action sequence produce the same
state.

The browser reads the selected passage and replaces the displayed heading,
paragraphs, and actions. It uses `textContent`, native buttons, and heading focus
after navigation. Rendering never executes a passage or mutates `GameState`.
Continue is one ordinary explicit navigation action. No actions means the
passage is terminal. Prose has no executable semantics.

## Core interfaces

The definitions live in `src/types.ts`:

```ts
interface GameState {
  readonly passageId: string;
}

interface Passage {
  readonly id: string;
  readonly title: string;
  readonly text: readonly string[];
  readonly choices: readonly Choice[];
  readonly continueTo?: string;
}

interface Choice {
  readonly label: string;
  readonly destinationId: string;
}

interface Story {
  readonly startId: string;
  readonly passages: readonly Passage[];
}

interface GameSnapshot {
  readonly state: GameState;
}
```

`GameState` contains only the active passage ID today. Future gameplay fields
belong here, not in DOM elements, passage definitions, or separate mutable stores.
The current state object is frozen and exposed as read-only. Validated story
data is also frozen; state and content have separate responsibilities.

## Proposed snapshot boundary (not implemented)

`GameSnapshot` is a type only. There is no snapshot creation, history, restoration,
serialization, storage, or checkpoint marker in this stage.

When entry effects are introduced, use this single entry sequence:

1. Validate the explicit destination and the active action.
2. Prepare a candidate `GameState` with `passageId` set to the destination and all
   other gameplay fields copied from the current state.
3. Deep-copy that candidate into a `GameSnapshot` **before** applying any
   destination entry effects. The snapshot's ID identifies the passage to enter,
   and its gameplay values are the inputs to that passage.
4. Apply the destination's deterministic effects once, commit the resulting
   `GameState`, then render it. A failed entry must not partially commit state.

Initial entry uses the same boundary with initial gameplay values. Future Undo
will retain passage-entry snapshots in memory, and the one automatic checkpoint
will retain one author-selected entry snapshot. Restoring either installs its
pre-entry state, executes the identified passage once, then renders. Never replay
effects over a post-entry snapshot, and never execute effects just to rerender.
Future snapshots must own deep copies of nested gameplay data; TypeScript
`readonly` alone is insufficient for that. Storage schema/version policy is
deliberately deferred until persistence is implemented.

## Scope boundaries

This stage implements content validation, explicit navigation, and basic browser
rendering only. There is no general expression evaluator or command interpreter.
Ordinary TypeScript iteration used to validate/render data is not a story-language
loop or runtime control-flow feature.

Future work: variables and conditions, simple skills, item quantities, journal,
character creation, session-only Undo, one automatic author-defined checkpoint,
title-screen Continue from that checkpoint, and confirmed New Game. None of
these gameplay systems is implemented here. In-story Continue navigation is the
only Continue behavior currently implemented.

Excluded: glossary, randomness, shops, skill purchasing, save slots, manual saves,
import/export, nested procedure calls, subroutines, loops, complex UI styling,
and a plugin system. Do not grow a framework for these features. The reference
repository's engine, save, undo, interpreter, and UI architecture are not used.

## Verification

`npm test` exercises parsing, stable IDs across content edits/reordering,
duplicate and missing destination rejection, action validation, deterministic
navigation, and state ownership. `npm run build` checks all source/tests with
strict TypeScript and builds the static browser application. The browser should
support both routes in the example using mouse or keyboard, move focus to each
new heading, and stop at the council without saving any data.
