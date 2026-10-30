# Passage engine

## Current execution model

`parseStory` reads a complete `.story` text file and returns the same frozen
`Story`, `Passage`, and `Choice` data model used by the runtime. The small parser
recognizes passage headers, one title per passage, plain-text paragraphs, choices,
and Continue. It joins consecutive prose lines with spaces and flushes paragraphs
on blank lines. It does not produce executable instructions or evaluate prose.

IDs are authored identifiers matching `[a-z][a-z0-9_-]*`; they never depend on
titles or text. The first passage supplies `Story.startId`; all later navigation
uses explicit IDs. Moving the first header changes where play begins, while
reordering other passages leaves navigation unchanged.

The parser retains source locations while collecting passages and validates all
references after reading the file, so forward references work. All destinations,
including those in unreachable passages, must exist. Duplicate IDs, missing or
duplicate titles, empty prose or choice blocks, malformed actions, additional
content after navigation, and unsupported directives are errors. Validation
throws with source lines and passage IDs where available, or returns a complete,
deeply frozen story. No partial result is exposed to `new Game`. Source locations
are parser-local and do not add fields to passage data or gameplay state.

Text is the only authoring format; the old JSON example/parser was removed.
There is no format registry or abstract parser framework. Identifier and
destination rules each have a single validation path in `src/story.ts`.

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

Implemented behavior is text authoring, content validation, explicit navigation,
and basic browser rendering. There is no gameplay expression evaluator or runtime
command interpreter. `Game`, `GameState`, and the rendering architecture remain
unchanged by the authoring-format migration.
Ordinary TypeScript iteration used to validate/render data is not a story-language
loop or runtime control-flow feature.

Future work, only when requested: character attributes and variables, arithmetic
and conditional choices, basic skills, item quantities, chapter-organized journal
entries, character creation, Undo for recent session choices, one persistent
automatic author-defined checkpoint, Continue Game from that checkpoint, and
confirmed New Game. None of these gameplay systems is implemented here. In-story
Continue navigation is the only Continue behavior currently implemented.

Excluded: glossary, randomness, shops, skill purchasing, save slots, manual saves,
import/export, nested procedure calls, subroutines, loops, complex UI styling,
and a plugin system. Do not grow a framework for these features. The reference
repository's engine, save, undo, interpreter, and UI architecture are not used.

## Verification

`npm test` exercises text parsing, paragraphs, literal content, source errors,
stable IDs across content edits/reordering, duplicate and missing destination
rejection, title/action validation, immutable data, atomic initialization,
deterministic navigation, and state ownership. `npm run build` checks all
source/tests with strict TypeScript and builds the static browser application.
The browser should support both routes in the example using mouse or keyboard,
move focus to each new heading, and stop at the council without saving any data.

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, and `npm run build` on Node.js
22 for pull requests targeting `main` and pushes to `main`. It grants only
`contents: read`. Each command's failure fails the job. There is no deployment,
publishing, release automation, or automatic merging.
