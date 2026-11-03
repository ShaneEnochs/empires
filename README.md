# The Aurelian League

A Pokémon interactive-fiction prototype set in Aurelia, a modern region influenced
by Roman architecture and civic institutions. Contestants earn eight Laurels through
many kinds of accomplishment; battling is not required. The three highest-ranked
contestants with eight Laurels qualify for the Triumvirate championship.

The playable opening takes place aboard a crowded ferry bound for Lezano.
An early choice introduces the crew's working Pokémon. Meet Lucia, enter your
first name, decide whether to exchange contact details, and choose your pronouns
in conversation. You can learn about the League, speak with other contestants,
listen in, or spend time on the observation deck. Chapter 1 takes place aboard the Portia. In Chapter 2, the player disembarks at Lezano, encounters the rude contestant wearing CHAMP on his jacket, and checks in with 100 credits. The hotel branch follows a luggage mix-up involving Victra; the restaurant branch involves helping a Wattrel and meeting Livia. Lucia can invite the player to walk to the Civic Forum if they exchanged numbers on the ferry. Both branches end before the four-o'clock orientation and starter selection. Charmander, Chikorita, and Piplup remain the planned starter options.
The engine's party system is implemented, but players cannot acquire Pokémon
in this chapter. Battles, evolution, levels, storage boxes, rankings, and external
Pokémon services are not implemented.

## Install, run, and play

Requires Node.js **22.12+** and npm. Use the existing checkout.

```sh
npm ci
npm run dev
```

Vite prints the local address. Select New Game, read each passage, and use Continue.
Choice menus require selecting an option before Continue. Text input accepts 1–80
Unicode code points, trims outer whitespace, and rejects controls and line breaks.

The read-only primary views are Story, Character, Party, Pokédex, and People.
Character defaults to Stats (trainer name/pronouns and configured statistics),
with selectable Skills, Inventory, and Journal subsections. Journal groups events
by chapter. The chapter bar is visible only in Story, and `*hide_title` suppresses secondary passage headings visually without removing their accessible labels. Party shows up to
six companions in joining order, as `Pip (Piplup)` or `Piplup`. It has no management
buttons. People lists characters when met and adds personal details as those
conversations occur, without revealing facts from unvisited story branches.
Tabs retain one row at narrow widths with 44px touch targets. Opening information
never advances the story, submits a draft, or saves.

## Writing stories

The full language reference is [docs/SCRIPTING.md](docs/SCRIPTING.md); architecture
and state boundaries are in [docs/ENGINE.md](docs/ENGINE.md). The practical editor
and preview guide is [docs/AUTHORING.md](docs/AUTHORING.md).

Stories are UTF-8 `.story` files. Declarations precede passages. Each passage has
an explicit ID/title, narrative paragraphs, and one concluding action category:
choices, Continue, text input, death/recovery, or a terminal ending. Effects go
between the title and prose and execute atomically in source order. There is no
automatic passage fall-through or JavaScript evaluation.

```text
*var trainer_name "Unknown"
*var nickname ""
*pokemon first_piplup "Piplup"

*passage name
*title Your Name
What name will you use?
*input_text trainer_name "Trainer name" -> partner

*passage partner
*title Your Partner
*add_pokemon first_piplup nickname
Welcome, ${trainer_name}. Piplup joins you.
```

`*pokemon id "Species"` declares an **individual**, not a species registry. Two
IDs can share a species. `*add_pokemon id [nickname_variable]` joins that individual
if absent; `*remove_pokemon id` removes it if present. Repeated additions and absent
removals are no-ops. Rejoining after removal appends at the end. Adding a seventh
member rejects the entire passage entry, including earlier variable/item effects.

Nicknames reference declared **global string variables**. Empty string means no
nickname; otherwise the normal text-input validator applies. The resolved nickname
is copied when joining; later variable changes and duplicate additions do not rename
an existing companion. Pokémon are separate from inventory items and trainer skills.

`has_pokemon id` and `lacks_pokemon id` work in `*if`, `*show_if`, and choice
conditions. Definitions, commands, and conditions are validated even in hidden or
unreachable passages. See the public [opening](content/aurelian-league.story) for
name input and all five pronoun variables plus plural verb agreement.

The engine retains variables, skills, item quantities, journal discovery, People,
conditional narrative/actions/effects, checkpoints, automatic saves, text input,
pronoun tokens, safe formatting, passage-local temps, and resumable reading pages.
[Advanced authoring](examples/advanced-authoring.story), [Center Visit](src/example.story),
and [Harbor Practice](examples/harbor-practice.story) are private regression examples,
not additional Aurelia lore or public catalog entries.

## Authoring tools and preview

- [Notepad++ toolkit](tools/notepadpp/README.md): import `Pokemon-udl.xml` and optionally
  `Pokemon.xml` for highlighting/autocomplete; use the saved-file validator.
- [Pokémon Story VS Code extension](tools/vscode-pokemon/README.md): build/package
  locally, then install its VSIX. Workspace `pkmn-` snippets and validation tasks
  work alongside parser-backed diagnostics. `.story` remains the file extension.
- Run `npm run dev`, then use its `/author.html` page to select a local `.story`
  and optional `.people.json`. Files stay in the browser. Preview uses temporary
  memory saves; Restart preview clears them. Re-select files after editing.

The author preview and private browser regression catalog are excluded from the
published build. No editor uploads, accounts, APIs, or new runtime dependencies exist.

## Saves and recovery

The sole public story has `storyId: aurelian-league`, `storyRevision: 8`, and key
`pokemon:checkpoint:aurelian-league`. This fresh namespace never reads, migrates,
or deletes the former game's browser records.

Party-aware progress uses **format 4**, or **format 5** with validated page/temp
context. Formats 1–3 have incompatible state schemas and are rejected. The engine's
checkpoint-only helper uses format 6; the application always writes committed
progress, never checkpoint-only saves.

Continue restores the last committed passage, reading page, temporary values,
variables, party, inventory, skills, and journal **without reapplying entry effects**.
A separate complete pre-entry checkpoint supports Try Again after authored death.
Both boundaries validate party IDs/species, nicknames, uniqueness, and the six-member
limit. Malformed or incompatible progress remains intact until an explicitly
confirmed New Game replaces it. Startup inspection and Continue never write.

Saves are browser/origin-local, not synchronized between devices. Draft text and
unconfirmed choices are not saved. Automatic write failures preserve the in-memory
game and show a warning. Inaccessible storage requires explicit Play without saving
consent. There is no Undo, manual rewind, save-slot manager, or migration UI.

## Validation

```sh
npm test
npm run check:stories
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run test:author
npm run build:pages
npm ci --prefix tools/vscode-pokemon
npm test --prefix tools/vscode-pokemon
npm run package --prefix tools/vscode-pokemon
```

In this cloud environment, installed Chromium can be used with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` before each browser command.
Restricted command sandboxes may require approved execution outside the sandbox for
CLI IPC, server ports, and Chromium. Keep TLS verification and the platform proxy.

Production browser tests exercise the actual public build on port 4175. The same
command compiles a separate private regression catalog via `vite.regression.config.ts`
and runs the retained recovery/inventory/People/UI suites on port 4176. This catalog
is selected only at build time; there is no test-only app route or runtime switch.
Author tests own development port 4177. Keep these ports free. Rebuild with
`npm run build` after Pages validation before ordinary production browser tests.
Preflight is bounded; a clean report is not proof that every possible route is safe.

## GitHub Pages

Intended deployment: **https://shaneenochs.github.io/pokemon/**.
`npm run build:pages` builds with `/pokemon/` and checks JavaScript/CSS asset paths,
asset existence, and exclusion of authoring code. A successful build does not prove
a live deployment. Set GitHub Pages source to **GitHub Actions** in repository settings.

Pull requests run required checks without deploying. Pushes to `main` deploy only
after player and editor-tool checks pass; Pages/OIDC write permissions are confined to the deployment job.
The separately packaged editor extension is never bundled with the player. Verify
the Actions deployment and the actual site after merging; this task does not merge
or publish automatically.

## Discoverable Pokédex

The Pokédex starts empty and lists only explicitly encountered/acquired species.
`content/aurelian-league.pokedex.json` maps stable species IDs, names/descriptions,
and `discoveryEvents` / optional `acquisitionEvents` to existing `*journal` IDs.
Add entries incrementally; no external database or artwork is used. The ferry
unlocks Minccino, Machoke, and Wingull through its actual sighting scenes. Lucia's
Lapras necklace and Floatzel anecdotes do not count as encounters.

For future companions, author `*add_pokemon individual_id` and a corresponding
`*journal acquired_species "..."` together, then reference that event in the
entry's acquisitionEvents. This records Acquired status atomically and keeps it
after party removal. Repeated sightings yield one entry per species.

See the [complete metadata and encounter guide](docs/AUTHORING.md#adding-discoverable-pokédex-species)
for JSON examples, validation, event timing, and optional author-preview metadata.
Discovery derives solely from the journal; no save-schema or format change is
needed. Public revision 8 remains compatible. Existing saves without the new
events are not silently backfilled. Checkpoint recovery derives the Pokédex from
the restored journal, just as People does.
