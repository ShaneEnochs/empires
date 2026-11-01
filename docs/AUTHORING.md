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
People stays empty: its definitions are separate catalog metadata and cannot be
inferred from arbitrary story prose.

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
