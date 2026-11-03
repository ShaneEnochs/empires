# Local Pokémon story authoring

Use UTF-8 `.story` files. Read the full [language reference](SCRIPTING.md) and
[engine boundaries](ENGINE.md). Declarations come first; effects follow a passage's
title/checkpoint and precede prose. The public story is
[content/aurelian-league.story](../content/aurelian-league.story). The examples are
private regression fixtures, not extra canon or public stories.

## Editing and validation

Run `npm ci` and `npm run dev` from the repository root. Notepad++ users can import
[Pokemon-udl.xml](../tools/notepadpp/Pokemon-udl.xml) and optionally
[Pokemon.xml](../tools/notepadpp/Pokemon.xml); the toolkit README documents saved-file
validation and optional People JSON. VS Code users can build and locally install
[Pokémon Story](../tools/vscode-pokemon/README.md). `.story` uses language ID
`pokemon-story`; Ctrl+Space and `pkmn-` discover 38 workspace snippets. The extension
uses the same parser for open/save diagnostics; highlighting alone is not validation.

VS Code tasks **Aurelian League: Check Current Story**, **Check Bundled Stories**,
and **Start Local Preview** use process arguments, preserving filenames with spaces.
Alternatively run `npm run check:stories -- "path/to/my story.story"`. Without an
argument, it checks the public opening and three regression examples. Parser and
reproduced runtime errors fail; warnings/scope limits remain advisory. Preflight
is bounded and never proves every possible route safe.

## Private browser preview

Use the local Vite server's `/author.html` page. Select your saved `.story`, optionally
a `.people.json`, then New Game. The shared reader supports all five views, party,
input, choices, pages and recovery. Files remain in the browser and saves use private
memory, never public localStorage. Restart preview resets progress. Re-select files
after edits, even with the same name. The passage index searches IDs/titles and
shows authored destinations without navigating the game. No upload, source editing,
automatic registration or publishing occurs. Normal builds exclude author.html.

## Trainer creation and companions

Use a global `trainer_name` string with `*input_text`; use choices and ordinary sets
for the five pronoun strings plus a plural-verb boolean. The public opening shows
all three presets. Character displays values selected with `*stat`; there is no
independent gender/background/class subsystem.

Declare individuals with `*pokemon starter_piplup "Piplup"`. Join with
`*add_pokemon starter_piplup starter_nickname`, where starter_nickname is a declared
global string populated by `*input_text`. Empty means species-name display. The
nickname is copied when joining and does not track later variable changes. Party
holds six; duplicate adds/absent removals are no-ops. `*remove_pokemon id`,
`has_pokemon id` and `lacks_pokemon id` support authored membership changes/guards.
A seventh companion fails atomically. Party never uses inventory items.

## Public configuration and saves

Edit `content/title-page.json` for plain-text brand/title/description/button labels.
Keep all five fields nonempty strings. The catalog contains only The Aurelian League,
identity `aurelian-league`, revision 5, key `pokemon:checkpoint:aurelian-league`.
Display text is not a save identity. The old game's keys are never read or deleted.
Party-aware saves use format 4, or 5 with reading context; schemas 1–3 are incompatible.
Continue resumes committed state/page without re-entering. Checkpoints preserve the
pre-entry boundary for Try Again. Unsubmitted drafts/choices never save. Progress
is browser-local; it does not synchronize across devices. Preview remains temporary.

Run Node, story, build and both browser suites before a publishing PR. Include
intentional revision changes for incompatible declarations/effects. The advanced
example exercises safe formatting, capitalization, pronouns, nested conditions,
temps, disabled choices, pages and recovery. Test longer loops and input variations
separately. Pages deploys only main after checks with `/pokemon/`; neither editor
preview nor the private browser-regression catalog is published.

## Adding discoverable Pokédex species

The five primary views are Story, Character, Party, Pokédex, and People. Character
has selectable Stats (default), Skills, Inventory, and Journal subsections. Journal
keeps its original chapter grouping. The chapter bar is visible only in Story;
all information views are read-only and preserve draft text and selected choices.
Primary navigation stays in one row at 320px with at least 44px touch targets.
Every passage still needs a nonempty `*title`; the internal `*passage` ID is not a
replacement for its player-facing heading.

Add species incrementally to `content/aurelian-league.pokedex.json`. The catalog
loads this file; drafts can select an optional `.pokedex.json` in author preview.
Clear/replace metadata or Restart preview to begin a fresh private playtest.

```json
[
  {
    "id": "piplup",
    "name": "Piplup",
    "description": "A new traveling companion.",
    "discoveryEvents": ["saw_piplup"],
    "acquisitionEvents": ["partnered_piplup"]
  }
]
```

`id` is a unique stable species identifier (`[a-z][a-z0-9_-]*`), separate from
individual party IDs. Names/descriptions are nonempty literal text. Each entry
requires `discoveryEvents` (possibly empty); `acquisitionEvents` is optional. At
least one event across the two lists is required, and every reference must be an
actual `*journal` event in the selected story. Metadata is validated before play.
Unknown/duplicate species IDs, malformed fields, duplicate list references and
unknown event IDs are errors. There is no complete database or undiscovered-entry UI.

Use explicit journal events at the point an encounter has actually happened:

```text
*journal saw_piplup "You encountered Piplup."
```

Different scenes need distinct journal IDs, which may all unlock the same species.
Never infer an encounter from a name in prose, a picture, a necklace, or somebody's
account of another Pokémon. The ferry records Minccino and Machoke in its café or
window scenes, and Wingull in its sightings. The Wingull sighting on the second
page of `ferry_ad` is recorded when continuing into `name`, after reading that page;
it is not unlocked on entry to the advertisement. Lucia's Lapras necklace and her
mention of her family's Floatzel do not unlock entries.

For acquisition, put the party effect and its explicit journal event together,
before narrative, in the same passage (and same conditional guard when needed):

```text
*add_pokemon starter_piplup starter_nickname
*journal partnered_piplup "Piplup joined your party."
```

Map `partnered_piplup` in `acquisitionEvents`. Acquisition alone can unlock a species
(use `discoveryEvents: []` if appropriate). Failed entry commits neither party nor
event. Duplicate events/species never create duplicate entries. Acquired status
persists after a party member leaves because it reads the journal, not current
party membership. There is no automatic acquisition record for an unannotated
`*add_pokemon`; authors pair the existing commands explicitly.

Entries show only discovered species in first-encounter order, with Encountered
or Acquired status, the first recorded chapter, and the authored description.
Status upgrades when an acquisition event exists. Discovery state is **only** the
existing journal; there is no second collection, timestamp, database, or save field.
Continue restores it without entry effects. Try Again derives entries from the
restored checkpoint journal, retaining events already there and discarding later
ones, exactly like People discovery. Nothing outside authoritative state survives
recovery as hidden progress.

The save key, formats 4/5/6, and public story revision 5 stay unchanged. These
additive event IDs/metadata do not invalidate existing revision-5 records. Older
records without these events remain undiscovered until a later legitimate event;
startup/Continue never backfill them or write a save. Do not change existing IDs,
chapters, variable declarations, or other effects to force a migration.
