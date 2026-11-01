# Empires

A small, passage-based TypeScript interactive-fiction engine for the browser.
No frontend framework, backend, or runtime library dependencies.

## GitHub Pages

GitHub Pages deployment is configured for
https://shaneenochs.github.io/empires/ (the intended address; verify a successful
deployment before treating it as live). The public application opens directly
to Provincial Crisis and requires no local installation.

One-time repository setup: go to **Settings → Pages → Build and deployment →
Source → GitHub Actions**. Allow the `github-pages` environment to deploy from
`main` if environment protection rules are configured. Merge the deployment PR,
then check the **Checks** workflow's `deploy-pages` job and open its environment URL.
Verify Provincial Crisis startup, gameplay, and reload before announcing the site as live.

Pull requests run all checks, including a Pages build, but never deploy.
Only a push to `main` can deploy, after the Node tests, story checks, root build,
Chromium tests, and Pages asset checks pass. The deployment job alone receives
`pages: write` and `id-token: write`; it uploads `dist/` using official Pages
actions. Generated output remains ignored.

`npm run build:pages` uses Vite's explicit `--base=/empires/` override and verifies
that JavaScript/CSS references point to existing files under `/empires/assets/`.
Ordinary `npm run dev`, `npm run build`, and the browser tests keep the root base.
To preview the Pages build locally, run `npm run build:pages` then
`npm run preview -- --base=/empires/` and open the printed origin at `/empires/`.
Rebuild with `npm run build` before running the ordinary browser tests.

Saves remain in localStorage with separate unchanged keys:
`empires:checkpoint:empires-example` and `empires:checkpoint:provincial-crisis`,
both revision 1 with the same envelope. Saves belong to the browser profile and
website origin: localhost progress does not automatically transfer to GitHub Pages.
Different project paths on the same GitHub Pages origin share localStorage;
the story-specific keys still distinguish these two games. Clearing site data
removes progress; no cloud storage or transfer mechanism is added.

## Install and run

Requires Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Empires opens directly to **Provincial Crisis**'s
startup screen, without a one-story library. It offers **New Game**, plus
**Continue Game** when a compatible checkpoint exists. Continue Game resumes the
**last checkpoint**, not the last visited passage. New Game asks before replacing
existing progress, including unusable saves. Storage failure retains the existing
explicit Play without saving consent flow.

New Game is available only on startup. To start over during gameplay, reload or
reopen the application and choose New Game there. There is no in-game restart.
Authored choices require selecting a radio option followed by **Continue**;
ordinary Continue passages and text forms remain single actions. **Try Again**
recovers from authored death using the existing checkpoint.

Character displays Envoy, Authority, Public trust, and Settlement, followed by
Skills and Inventory in acquisition order. Journal groups recorded events by
chapter; People shows only journal-linked encounters. Checkpoints save automatically
in this browser. Ordinary progress, draft names, and uncommitted selections after
the last checkpoint are discarded on reload.

## Playable story and internal fixture

| Story | Availability | Save ID | Revision |
| --- | --- | --- | --- |
| Provincial Crisis | Sole public story: 30 passages, three endings, and two authored checkpoints. | `provincial-crisis` | 1 |
| The City Gate | Internal authoring example/regression fixture in `src/example.story`; absent from public navigation. | `empires-example` | 1 |

Provincial Crisis keeps its exact `empires:checkpoint:provincial-crisis` key,
revision 1, and existing save format. Old City Gate records are never read,
rewritten, or deleted by the public application. Its authored source, default
storage exports, and isolated parser/Game/session/recovery tests remain intact.
The static catalog remains ready for future stories: a single entry opens startup
directly; multiple entries use the existing library and pre-game Back to Stories.

```sh
npm test          # parsing, validation, state effects, interpolation, navigation
npm run build    # strict TypeScript check, then browser build in dist/
npm run preview  # serve the production build locally
```

GitHub Actions runs `npm ci`, `npm test`, `npm run check:stories`, `npm run build`, and `npm run test:e2e`
on Node.js 22 for pull requests to `main` and pushes to `main`. It installs
Playwright Chromium and its system dependencies, has a 10-minute job limit, and
uploads browser diagnostics on failure. Repository contents remain read-only;
pull requests do not deploy or merge. Successful pushes to main can deploy Pages
as described above.

## Browser integration tests

The committed `e2e/` suite uses Playwright Test with Chromium. `npm test` remains
the separate Node suite; `npm run build` type-checks both suites and the config.

```sh
npm ci
npx playwright install chromium
npm run build
npm run test:e2e
```

On Linux, `npx playwright install --with-deps chromium` also installs required
system libraries and may need administrator privileges. CI uses that command.
Install browsers again after upgrading Playwright.

Tests automatically start/stop the production preview at
`http://127.0.0.1:4175`. Keep that port free; an existing server is never reused.
Rebuild after application changes so tests exercise the latest production bundle.
Each test gets a fresh browser context and isolated storage. Core workflows run
at desktop size; a focused selection also runs at 320, 375, 768, and 1280px.
Coverage includes startup, checkpoint Continue, confirmed/canceled New Game,
invalid saved data, original routes, conditional prose, all panels, names/input,
death/retry, persistent bytes/write counts, responsive controls, and keyboard focus.
The browser suite drives Provincial Crisis directly, covering startup, legacy
City Gate save isolation, naming, all three endings, both checkpoint recoveries,
failed automatic saves, and responsive controls. City Gate's retired routes and
save/recovery behavior retain isolated Node regression coverage. Browser tests
use accessible controls without app hooks or
test-only routes. There are no screenshot baselines, sleeps, or automatic retries.

Failures retain screenshots and traces in `test-results/` plus an HTML report in
`playwright-report/`. View the report with `npx playwright show-report`; open a
trace from it for the action timeline and DOM snapshots. Both directories are
ignored by Git. GitHub Actions retains failure diagnostics for seven days.
For one workflow, use `npm run test:e2e -- e2e/recovery.spec.ts`.

If a restricted environment blocks browser downloads but already has Chromium,
an optional runner-only override is available:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

The normal local setup and CI use Playwright's bundled Chromium. This override
affects only the test runner, never the app.

## Authoring preflight

```sh
npm run check:stories                       # both bundled .story files
npm run check:stories -- path/to/your.story  # only the supplied file(s)
```

Preflight first uses the normal parser, then reports diagnostics grouped by file
and passage, with codes, recommended actions, and concrete routes for reproduced
entry failures. It reads files and creates private fresh Games; it never touches
browser saves or an active game. No story/library configuration is needed for a
separate file.

| Severity | Meaning | Response |
| --- | --- | --- |
| Error | Syntax/reference failure or an eligible executed route whose entry failed. | Replay the route; fix syntax, resource budgets, or eligibility. The command exits nonzero. |
| Warning | Structurally unreachable content or a potentially repeatable numeric/item effect on a graph cycle. | Check intended navigation and repeated rewards/expenses. Warnings are advisory. |
| Information | Aggregated return results, representative input, skipped returns, route limits, or analysis scope. | Review the coverage and playtest what the tool did not cover. |

Structural reachability includes all authored conditional choices. An unreachable
passage has no authored path from the start, but an authored path does not prove
its gameplay conditions can be met. A cycle can be intentional: journal events
already deduplicate, while numeric/item effects repeat on ordinary entry.

Gameplay exploration replays eligible simple paths through Game, using
`"Preflight Reader"` for text input. It also probes each eligible first return
under the same 2,000-prefix budget. After a successful return, each eligible exit
to an unvisited passage can be tested as a separate one-transition prefix that
stops there. A route may contain only one repeated entry: further returns and
longer continuations after the immediate exit remain untested.

The budget includes initial entry, ordinary paths, return probes, immediate
exits, and failed attempts. Reports distinguish attempted return prefixes from
successful return entries; an immediate exit may still fail. Replaying a return
inside a follow-up prefix does not count as a second distinct probe. Information
messages aggregate results and explain omitted work. Normal checkpoint capture
occurs inside each private Game, but checkpoint restoration, death recovery, and
other text values remain outside coverage. **No-error output is not proof that
every route is safe.** Keep the existing route/recovery tests and manual playtests.
See [engine details and diagnostic codes](docs/ENGINE.md#authoring-preflight) and
[author guidance](docs/SCRIPTING.md#preflight-and-playtesting).

Current bundled-story findings:

| Story | Errors | Warnings | Information | Replayed prefixes | Return probes |
| --- | --- | --- | --- | --- | --- |
| The City Gate | 0 | 0 | 2 | 14 | 0 |
| Provincial Crisis | 0 | 0 | 4 | 1,098 | 4 successful |

Neither story reached the default limit. Both report representative-name and
scope limitations. Provincial Crisis's four queue-return probes succeed without
duplicating journal events; eight immediate exits are also exercised. Four
further returns to the already visited merchant offer are outside the one-repeat
bound. No new defect was found. Neither story source nor revision was changed.

## Reading interface

Empires uses the same centered, 46rem maximum reading surface on phone and desktop.
A single row of four equal-width, flat tabs sits at the top of gameplay:
**Story, Character, Journal, People**. Labels use approximately 0.9rem type, with
a small adjustment at 320px. The active tab has one bottom-border indicator; tab
text never underlines during hover, selection, active press, or keyboard focus. An opaque
CSS sticky wrapper keeps these 44px controls and the compact chapter bar visible
while scrolling in every view. The chapter comes from the current passage and
updates after successful navigation. Its centered 0.9rem label has reduced vertical
padding. Passage titles remain in reading content, centered and approximately 10%
larger than startup headings; longer titles wrap. Narrative stays left-aligned.
Branding remains on library/startup screens, which show no invented chapter.
Serif prose and restrained selectable choice rows keep reading prominent.
System sans-serif controls and statistics use one muted neutral palette. Native
controls have visible keyboard focus; focus targets clear the sticky header.
There are no themes,
animations, transitions, drawers, sidebars, or nested scrolling containers.

One view is active at a time. Information replaces the story inline; select Story
or Return to Story to resume the exact same passage. The story DOM remains hidden
and intact, retaining unfinished input, validation messages, and selected choices.
Viewing information never enters passages or touches saves. Heading focus follows
view selection; successful gameplay navigation and Try Again return to Story and
focus the passage heading. Validation focuses the retained input. Critical save
warnings remain available across views. New Game is confined to startup.

Character contains **Character Statistics**, **Skills**, and **Inventory**.
Statistics preserve author order and formatting; acquired skills and item names/
quantities preserve acquisition order and existing empty messages. Journal remains
its own chapter-grouped view. People lists only recorded encounters, using frozen
per-story definitions in `src/people.ts` associated through `src/catalog.ts`.
Each reference has a stable ID, name/role, description supported by the story, and
one or more discovery journal event IDs. Selection validates those event IDs against
the parsed story before reading saves. References with no recorded event stay
hidden, and recovery derives visibility again from the restored journal.
People mentioned only in prose, such as the ferryman, are omitted without adding
story tracking. An empty reference displays “No people recorded yet.”

Authored choices require **select an option, then press Continue**. No option starts
selected, and Continue is disabled until one is selected. Selecting a different option
replaces the previous selection; selecting alone never navigates, executes effects,
captures a checkpoint, or touches storage. Only Continue calls the existing session
navigation method. A failed action retains the selection and accessible error;
successful navigation begins a fresh unselected passage. Selection survives visits
to information views but is discarded on reload and never saved.

Use Tab to enter the native radio group, Space to select, arrow keys to change
selection, then Tab to Continue and Enter/Space to advance. The whole row is selectable;
the checked radio and restrained highlight expose selection without color alone.
Continue passages, text-input forms (including Enter submission), and Try Again
remain single actions. Terminal endings have no Continue. New Game keeps its confirmation.

Story content, saves, identities, revisions, and recovery semantics are unchanged.

## Write a story

Study the internal [src/example.story](src/example.story) authoring example; read the full
[authoring guide](docs/SCRIPTING.md) for supported syntax.

For a separate 30-passage adventure, see
[Provincial Crisis](examples/provincial-crisis.story) and its
[playtest routes, balances, and authoring findings](examples/provincial-crisis.md).
Its 20 playthrough tests and shared-storage identity tests run with `npm test`.
Provincial Crisis is the public story. The City Gate remains an internal example
and regression fixture; both authored sources still run through preflight and Node tests.

The small static catalog lives in `src/catalog.ts`. To bundle another story,
add a Vite `?raw` import and one entry containing an explicit unique catalog `id`,
`title`, `description`, `source`, immutable `people` definitions, and
`identity: { storyId, storyRevision }`. Adding a second entry restores the library
without adding routes or changing the renderer.
The catalog freezes its entries/identities and checks unique catalog IDs and
unique save IDs at initialization. Catalog IDs identify application entries;
`identity.storyId` selects persistent progress, and `storyRevision` declares save
compatibility. Neither is inferred from the title, source, or filename.
Reuse an established save ID only for the same story; use a distinct ID for a new
independent game. Add route and browser tests for the new entry. This is a bundled
list, with no downloads, discovery, uploads, or external content system.

Authors use one small plain-text format:

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
shows “No skills acquired yet.” when empty. Reading Character changes no gameplay state.

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
Reading Character changes no gameplay state; its sections update after navigation
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

Character is a native inline information view alongside Journal and People.
Its Character Statistics section precedes Skills and Inventory.
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
Enter submits without reloading. Character, Journal, and People remain available.

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

`src/storage.ts` uses one namespaced localStorage key per configured story.
The internal City Gate fixture retains `DEFAULT_SAVE_IDENTITY`:
`storyId: 'empires-example'`, `storyRevision: 1`, and the unchanged key
`empires:checkpoint:empires-example`. Provincial Crisis uses ID `provincial-crisis`,
revision 1, and key `empires:checkpoint:provincial-crisis`. Existing City Gate
revision-1 saves remain compatible with the internal fixture and stay untouched by the public app.
`SAVE_FORMAT_VERSION = 1` remains an independent application-wide constant.
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

For another story, pass explicit application configuration to the same session API:

```ts
import { GameSession } from './src/session';
import { checkpointKey, validateSaveIdentity } from './src/storage';

const identity = validateSaveIdentity({ storyId: 'provincial-crisis', storyRevision: 1 });
const session = new GameSession(parsedStory, storage, identity);
checkpointKey(identity); // empires:checkpoint:provincial-crisis
```

Here `parsedStory` is the corresponding parsed Story and `storage` implements
`getItem` and `setItem`. `StorySaveIdentity` has only readonly `storyId` and
`storyRevision` fields. Validation returns a frozen independent copy; GameSession
also captures its own copy before reading storage. IDs match `^[a-z][a-z0-9_-]*$`:
a lowercase ASCII letter followed by lowercase letters, digits, underscores, or
hyphens. Revisions are positive safe integers. Invalid configurations throw before
storage access; IDs are never inferred, trimmed, or normalized.

Assign a unique stable ID to each independent story. Reusing an ID deliberately
targets the same save record; no registry can determine whether two configured
stories are actually the same work. Keys contain the ID, **not the revision**:
a revision change finds the old record and reports incompatibility. A session
only accesses its configured key. Low-level `loadCheckpoint(storage, story, identity)`
and `saveCheckpoint(storage, story, checkpoint, identity)` accept the same config.
Omitting it retains the shipped defaults, including the legacy `STORY_ID`,
`STORY_REVISION`, and `STORAGE_KEY` exports. The browser passes each selected
catalog entry's identity explicitly.

Maintain stable IDs. **Bump the configured story revision when changing a story incompatibly**,
including variable declarations/types, passage/item/skill/journal identities or
journal chapters, and entry effects that change saved-state behavior. Bump
`SAVE_FORMAT_VERSION` for incompatible envelope changes. There are no migrations
or version histories. Matching versions still require complete snapshot validation.

Selecting a story parses that source, reads/validates its envelope and snapshot, and verifies
saved entry through `new Game(story, { checkpoint })`. Continue activates that
prepared Game without another entry or write. No fresh game starts automatically.
Unusable saves remain untouched, Continue is omitted, and a readable reason is
shown. Technical details are available in the browser console.

New Game confirms before replacing the selected story's existing record, including a corrupt one.
It constructs a fresh Game, writes its initial pre-entry checkpoint once using
one `setItem`, then activates it. Cancel, construction failure, or replacement
failure preserves the old game/save. New Game is available only before gameplay; reload to return to startup.

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
will be lost on closing. Saves are local to this browser profile and origin;
clearing site data removes them. There is no cloud backup or cross-device sync.

## Death and Try Again

End a passage's authored narrative with a standalone `*death` line. It takes no
arguments, must follow the title and prose, and cannot share a passage with
choices, Continue, text input, or `*checkpoint`. Nothing may follow it before
the next passage/chapter. At least one unconditional paragraph is required;
end any conditional paragraph with a blank line before the death action.
The starting passage cannot be death, since it creates the initial checkpoint.

Death is immutable passage metadata, not an `isDead` gameplay variable. Ordinary
entry effects still run atomically before its prose displays. The player can read
that prose and inspect Character, Journal, and People before choosing Try Again;
Save warnings remain available; New Game is available on startup after reload.

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
styles. Stage 8C adds permanent browser integration tests. Stage 8D adds an
independent story/playtest example using the existing language. Stage 9A adds
explicit story save identities and isolated persistence. Stage 9B adds the static
two-story library and shared startup/gameplay presentation. Stage 9C adds separate
authoring preflight diagnostics and its CLI. Stage 9D adds bounded first returns
and immediate-exit checks without changing gameplay.

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

## Local authoring toolkit

See [the practical authoring guide](docs/AUTHORING.md) for VS Code `emp-` snippets,
preflight tasks, the local `/author.html` file preview, and its searchable passage
reference. The preview uses the same reader with memory-only progress; it never
uploads, publishes, registers drafts, or touches public saves. Re-select saved
files after external edits. Run `npm run test:author` for its separate browser tests.
