# Working on The Aurelian League

This repository is the Pokémon interactive-fiction game The Aurelian League.
Use the existing checkout; cloud tasks are already isolated. Do not create a Git
worktree unless requested. Work on a feature branch and prepare PRs against main;
never merge automatically or commit directly to main.

## Product and scope

Aurelia is a modern Pokémon region influenced by Roman architecture and civic
institutions. The public game is `content/aurelian-league.story`, the sole catalog
entry. Its identity is `aurelian-league`, revision 5. The current playable
chapter begins on a ferry to Lezano and ends when the vessel comes into port.
The player starts without Pokémon, makes an early flavor choice, enters a first
name, optionally exchanges contact details with Lucia, and chooses pronouns.
Only contestants, crew, and League press are aboard; Minccino and Machoke
assist the crew. Lucia wears a Lapras necklace. Do not write disembarkation or
starter selection into the public story until requested. The planned choices
for the next chapter are Charmander, Chikorita, and Piplup, all equally valid.

Eight Laurels can be earned without battling; the three highest-ranked contestants
with all eight qualify for the Triumvirate. Do not invent major characters,
challenges, mystery explanations, or the full chapter unless explicitly requested.
Do not add evolution, battles, levels/XP, moves/abilities, HP, storage boxes,
trading, sprites, Pokédex tracking, shops/crafting, random encounters, relationship
systems, character backgrounds/classes, or Laurel/ranking calculations.

## Architecture and permanent rules

Read docs/ENGINE.md, docs/SCRIPTING.md, and docs/AUTHORING.md before behavior changes.
Keep the existing TypeScript parser and small native DOM reader. No framework,
external Pokémon API/database, new runtime dependency, generalized manager,
interpreter rewrite, or unrelated abstraction is needed.

- `parseStory` returns immutable Story metadata and passage data. IDs are authored,
  stable and validated, never derived from titles/order/random values. Validate
  the entire story, including hidden/unreachable paths, before play.
- `Game` owns the single authoritative immutable `GameState`: passageId, variables,
  journal, skills, inventory, and party. Views own only transient selection/drafts.
- Every navigation/input entry executes effects once in source order against a
  private candidate. Commit state, context, and checkpoint only after success.
  Failures preserve all previous fields and the checkpoint. Conditions and rendering
  never execute effects or mutate state. Guard decisions use candidate state;
  narrative/choice eligibility uses committed state with local temps.
- Pokémon definitions are frozen `{id,species}` individuals in `Story.pokemon`.
  `GameState.party` is a frozen joining-ordered array of frozen `{id,species,nickname?}`.
  Limit six. Duplicate adds and absent removes are no-ops; remove/rejoin appends.
  Resolve a global-string nickname once on joining; never link it to the variable.
  Pokémon are never inventory items. Keep party operations atomic with all effects.
- Global values retain declared primitive types and finite numeric values. Journal
  IDs deduplicate; text resolves once on first entry. Skills retain unique acquisition
  order. Inventory uses positive safe integers, deletes zero properties, preserves
  insertion order, and uses own-property reads (including `constructor`).
- Name and nickname input uses the shared validator (1–80 Unicode code points,
  trim outer whitespace, reject controls/line breaks). Only submitText accepts the
  current authored concluding input action; navigation cannot bypass it. Accept
  text before destination checkpoint/effects and roll it back on any failure.
- Pronouns use ordinary global strings and an authored plural-verb boolean, not a
  gender subsystem. Character shows current name/pronouns with existing stats.
- Checkpoints capture the entire pre-entry state; initial entry and authored
  checkpoint entry share one path. Recovery replays effects once and does not
  recapture. Death is immutable passage metadata, not gameplay state. Try Again is
  guarded and uses the latest in-memory checkpoint, even if the last save failed.
- Continue restores exact committed post-entry state and page/temp context without
  replaying effects. Page advance saves once without passage re-entry. Temps are
  local, cannot shadow globals, receive input, or appear in stats.
- Validate snapshots/committed state against the story. Reject missing/extra fields,
  unknown IDs, wrong types, nonfinite numbers, duplicates, invalid quantities,
  party overflow/species/nicknames, inherited data and accessors without executing
  callbacks. Copy and freeze nested data. No repair or guessing defaults.
- Public saves use only `pokemon:checkpoint:aurelian-league`; never read, migrate,
  or delete former-game records. Formats 4/5 explicitly contain party state;
  checkpoint-only engine helpers use format 6. Formats 1–3 are incompatible.
  Incompatible story changes require an intentional revision bump; envelope/schema
  changes require an explicit format decision.
- Session startup inspects without constructing a new game or writing. Continue
  activates validated committed state without re-entry. New Game rechecks and
  confirms replacement, constructs successfully, then writes once before activation.
  Failure preserves old bytes/game. Automatic write failures keep committed gameplay
  and display a warning. Storage failure requires explicit unsaved-play consent.
- Keep Story, Character, Party, Journal and People exclusive inline views. Preserve
  the hidden story DOM, draft text/choices/errors and save warnings. Switching views
  changes no gameplay or storage. Focus the active heading. Use native pressed
  buttons, 44px targets, a simple responsive five-tab layout, sticky chapter/header,
  clear focus, no animation or nested panel scrolling, and safe wrapping at 320px.
- Choices are native unselected radios; Continue alone commits. Failed navigation
  preserves selection/error. Render authored formatting with safe DOM nodes; player
  input stays text and is never HTML, commands, or a recursive template.
- People metadata is immutable and validated against journal events; discovery is
  derived from current journal after recovery. No separate tracking/save data.
- Preflight stays separate from gameplay, reuses fresh Game replays, shares its
  bounded deterministic queue, reports omissions and does not claim exhaustive safety.
- Author preview is development-only, local File API input and memory-only storage.
  No uploads, public-save access, test routes or runtime fixture switches. The private
  regression build substitutes its catalog at compile time only. Never publish it.
- Preserve behavioral coverage. Center Visit, Harbor Practice, and advanced authoring
  are private Pokémon-themed engine fixtures, not public game lore. Retain parser,
  effects, checkpoint/recovery, input, inventory, skills, journal, People and browser
  regression tests. Do not weaken assertions to accommodate failures.

## Commands and tools

Node 22.12+ and npm: `npm ci`, `npm test`, `npm run check:stories`, `npm run build`,
`npm run test:e2e`, `npm run test:author`, `npm run build:pages`. Browser tests use
Chromium; install with `npx playwright install --with-deps chromium` or use the
documented installed-browser override. The production, regression and author test
servers own ports 4175, 4176 and 4177. Rebuild with the default root base after Pages
checks. `npm run dev` starts development; author.html stays out of production.

The Pokémon Story extension is separate under tools/vscode-pokemon. Run its npm ci,
test and package commands after editor/parser changes. Keep TextMate/Notepad++
highlighting, autocomplete, `pkmn-` snippets, diagnostics and docs aligned with the
same .story grammar. Never automatically publish the extension.

Pages uses `/pokemon/`, deploys only on main after checks, with write/OIDC permissions
limited to deployment. Commit source/config/lockfiles, never generated dist, VSIX,
node_modules or test reports. Preserve third-party font assets and licenses.
