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
identity `aurelian-league`, revision 4, key `pokemon:checkpoint:aurelian-league`.
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
