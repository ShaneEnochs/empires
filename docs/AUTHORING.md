# Local story authoring

Open the repository folder in VS Code, then run `npm ci` in its terminal.
Place drafts in a folder of your choice, for example `drafts/my adventure.story`.
They are ordinary UTF-8 text files. The project associates `.story` with the optional Empires Story language (see below).
Use Ctrl+Space and type `emp-` to discover snippets; Tab moves through placeholders.
Declarations belong before chapters, checkpoint metadata directly after the title,
and effects before prose. See [SCRIPTING.md](SCRIPTING.md) for placement and syntax.

Save your file, then use Terminal → Run Task → **Empires: Check Current Story**.
Select a `.story` editor first. The process task passes the complete active path
as one argument, including spaces on Windows. **Empires: Check Bundled Stories**
checks both regression examples. Parser errors link their actual source line in the Problems panel. Gameplay diagnostics do not invent line
numbers. Errors fail the command; warnings and informational scope limits remain
advisory. Bounded preflight is not proof that every route is safe.

Run **Empires: Start Local Preview** (or `npm run dev`) and open
`http://127.0.0.1:5173/author.html` (use the port Vite prints).
Select your `.story` file, then New Game. The shared Empires reader supports
choices followed by Continue, input forms, Character with Skills/Inventory,
Journal, checkpoints, and Try Again. Restart preview returns to a fresh startup.
Optionally select a `.people.json` file for the People tab; see the
[Notepad++ toolkit](../tools/notepadpp/README.md) for its format and file workflow.

The passage index searches IDs and titles. Selecting an entry shows its chapter
and all authored outgoing destinations, including conditional choices and input
or Continue destinations. It never moves the active game or changes checkpoints.

Edit and save in VS Code, then select the updated file again, even when its name
is unchanged. There is no file watcher or browser source editing. Selecting another
file discards the previous preview; malformed files clear the old preview and show
an error. Files stay in the browser, and progress uses memory only, disappearing
on restart, file replacement, or page close. No upload, production save access,
publication, or automatic catalog registration occurs.

To publish later, review preflight findings, add authored route/browser tests,
assign an explicit unique catalog/save identity and intentional revision, author
People definitions if needed, and submit a reviewed catalog/source change.
Draft preview does none of those steps. The normal builds include only the player
entry; `author.html` is absent from `dist/` and the Pages build checks that boundary.
Run `npm run test:author` for the separate development-server browser suite.

## Optional VS Code language extension

Build and locally install the [Empires Story extension](../tools/vscode-empires/README.md)
for syntax highlighting and parser-backed open/save errors in the Problems panel.
Cloning does not install it. `.story` files and all 20 workspace snippets now use
`empires-story`; after installation the language mode reads **Empires Story**.
Without installation, select Plain Text manually to edit. Automatic diagnostics
stop at the first parser error; the existing preflight tasks remain the deeper
analysis workflow. The local browser preview and public game are unchanged.

## Editing the public title page

Edit `content/title-page.json` as UTF-8 in Notepad++, VS Code, or another text
editor. This is the single source for the public startup text:

```json
{
  "brand": "Empires",
  "title": "Provincial Crisis",
  "description": "An envoy must respond to a flood, disputed grain supplies, and competing political interests.",
  "continueGameLabel": "Continue Game",
  "newGameLabel": "New Game"
}
```

Change `brand` for the small branding, `title` for the displayed story title,
`description` for the introduction, and the last two fields for startup button
labels. Keep all five fields as nonempty strings, quoted with double quotes;
escape embedded quotes as `\"` and do not add trailing commas. Values render as
plain text, never HTML. Invalid fields produce errors during initialization and
validation tests; malformed JSON fails the build.

Run `npm run dev` and save the JSON to see Vite update the local page. To publish,
commit the JSON edit on a feature branch in GitHub, open a pull request, and merge
after checks pass. The existing main-branch Pages workflow publishes the build.
Display names are not save identities: Provincial Crisis remains story ID
`provincial-crisis`, revision 1, with its existing checkpoint key. No migration is
needed. Local author preview retains the uploaded story's own title and isolated
memory storage.

Narrative text and headings use the locally bundled Source Serif 4 Latin variable
WOFF2 (Fontsource distribution 5.2.8, SIL Open Font License in `src/fonts/OFL.txt`).
Only one normal-style asset is shipped; declared weights are 400–600. System UI
fonts remain on controls and statistics. `font-display: swap` keeps text visible
while loading; Georgia and generic serif cover loading failures and characters
outside the Latin subset. No external font service is contacted.

## Notepad++ as the primary editor

See the [Notepad++ toolkit](../tools/notepadpp/README.md) for UDL highlighting,
optional command completion, saved-file validation with a keyboard shortcut,
a playable starter, the command cheat sheet, and local preview without VS Code.
Provincial Crisis People descriptions live in `content/provincial-crisis.people.json`.
Draft People references live in optional `.people.json` files; journal, skills, and
inventory remain in `.story`. Public title-page text stays in `content/title-page.json`.
