# Empires in Notepad++ (Windows)

Install Node.js 22.12 or newer and Notepad++. Download/clone the repository to a
writable folder, open a terminal there, and run `npm ci` once. VS Code is optional.

## Highlighting and command completion

1. In Notepad++, use **Language → User Defined Language → Define your language →
   Import** and select `tools/notepadpp/Empires-udl.xml`. Restart Notepad++.
2. Open or save a UTF-8 `.story` file; choose **Language → Empires** if needed.
   Directives, condition words, numbers, quoted strings, choice/arrow operators,
   and `[if ...]` regions use distinct neutral colors. Prose keeps a readable
   foreground. UDL has no parser or symbol table: it cannot distinguish arbitrary
   destination IDs from prose, check JSON escapes/types, validate placement, or
   offer diagnostics. Arrows mark destination references; preflight checks IDs.
   Quotation/condition highlighting is lexical, not a guarantee of validity.
3. Optional: copy `Empires.xml` (keep that exact case/name) into Notepad++'s
   `autoCompletion` directory, usually `C:\Program Files\Notepad++\autoCompletion`.
   Writing there may require administrator approval; a portable installation uses
   its own `autoCompletion` folder and can be kept in a writable user directory.
   Do not replace another language's file. Restart Notepad++ and enable word/function
   auto-completion in **Settings → Preferences → Auto-Completion**. Use Ctrl+Space
   after typing `*` or a directive prefix. Entries are sorted and include the `*`.
   Version-specific UDL completion behavior may vary; this is a command list, not
   VS Code-style snippets or argument completion.

## Validate the saved current file

Save with Ctrl+S first: validation reads disk, not unsaved editor text.
Choose **Run → Run…** (F5) and enter, substituting your repository path:

```text
cmd /k ""C:\My Projects\empires\tools\notepadpp\validate-story.cmd" "$(FULL_CURRENT_PATH)""
```

Use **Save…**, name it “Empires: Validate current story”, and choose an available
keyboard shortcut in the dialog. Later edit it through **Settings → Shortcut
Mapper → Run commands**. `/k` keeps the console open so errors, warnings, and
information remain visible. The launcher returns the CLI's exit code (0 for no
errors, 1 for errors; missing argument is 2). It resolves its repository root
from its own location, accepts an absolute quoted path with spaces, and never
writes the story. Keep the launcher in the repository. Node must be on PATH and
`npm ci` must have installed the existing dependencies. No global validator or
Notepad++ plugin is needed.

Tests parse the XML, compare commands with SCRIPTING.md, inspect CMD quoting and
exit-code forwarding, and invoke the same CLI with spaced paths. A real Windows
Notepad++ installation and CMD execution were not available in the Linux test
environment; import, autocomplete UI, and the Run/shortcut steps require a local
Windows smoke check. These are installation instructions, not a claim of an
interactive Windows test.

## Start a draft and preview without VS Code

Copy `starter.story` to a draft folder, retaining `.story`, and open it in
Notepad++. Copy `starter.people.json` alongside it if you want the optional
ferryman reference. The sample demonstrates variables/statistics, chapters,
passages, choices, conditions, skills, inventory, journal discovery, and checkpoints.
The names need not match; select the two files explicitly in preview.

From the repository terminal run `npm run dev`. Open the printed local URL with
`/author.html`, select your saved `.story`, and optionally select its `.people.json`.
Either selection order works when the references match. Use New Game and play
normally. After editing, save and reselect the file, even if its path is unchanged.
Replacing a file discards temporary progress. Unknown event references disable
preview until corrected metadata is selected (or **Clear People file** is used).
**Restart preview** starts fresh with current valid files; clearing People also
starts fresh. Without metadata the People tab is empty. Files use only the browser
File API, are not uploaded, and preview never uses public localStorage.

| What to write | Where |
| --- | --- |
| Chapters, passages, prose, variables, statistics | `.story`: `*chapter`, `*passage`, `*title`, `*var`, `*stat` |
| Choices, destinations, conditions | `.story`: `*choice`, `#Label -> id [if ...]`, `*show_if`, `*continue`, `*input_text` |
| Journal discoveries | `.story`: `*journal event_id "Text"` |
| Skills and acquisition/removal | `.story`: `*skill`, `*grant_skill`, `*revoke_skill` |
| Inventory and quantities | `.story`: `*item`, `*add_item`, `*remove_item` |
| People names/descriptions/discovery links | Optional `.people.json` array |
| Public startup branding, title, description, buttons | `content/title-page.json` |

People JSON example:

```json
[
  {
    "id": "ferryman",
    "name": "The ferryman",
    "description": "A ferryman who knows the river.",
    "discoveryEvents": ["met_ferryman"]
  }
]
```

Use nonempty text and unique lowercase IDs; discoveryEvents must contain existing
`*journal` IDs in the selected story. Any one recorded event reveals the person;
recovery derives visibility from the restored journal. Descriptions render as plain
text. Provincial Crisis's public People file is
`content/provincial-crisis.people.json`; edit it without TypeScript, preserving IDs
and discovery links unless intentionally changing presentation. People never enters
GameState or save records.

## Command cheat sheet

Declare `*var name literal`, `*stat name "Label"`, `*skill id "Name"`, and
`*item id "Name"` before chapters/passages. Start sections with `*chapter Label`,
`*passage id`, and `*title Title`. Put optional `*checkpoint` immediately after the
title; then entry effects: `*set`, `*add`, `*journal`, `*grant_skill`,
`*revoke_skill`, `*add_item`, `*remove_item`. Follow with prose, `${variable}`,
and optional `*show_if` paragraphs. End with `*choice` and `#... -> id` lines,
`*continue id`, `*input_text variable "Label" -> id`, or `*death`. A terminal ending
has no action. Conditions use comparisons or `has_skill`, `lacks_skill`,
`has_item`, `lacks_item`, `item_count`. Always provide an unconditional choice.
See [SCRIPTING.md](../../docs/SCRIPTING.md) for exact types, placement, operators,
and checkpoint semantics. Do not add comments or invent commands.

Local drafts remain local until deliberately committed and integrated through a
reviewed publishing change. Preview never changes the production catalog or story
identity, writes source files, or deploys anything. Do not overwrite Provincial
Crisis or reuse its save ID just to preview a draft. Public Pages excludes the
author preview. Existing VS Code snippets, tasks, and optional extension continue
to work; choose whichever editor you prefer.

## Pronoun substitution

See the [pronoun template](../../docs/SCRIPTING.md#pronoun-tokens-stage-12b) for
he/him, she/her, they/them, and custom choices using ordinary `*var`/`*set`.
`{they}`, `{them}`, `{their}`, `{theirs}`, `{themself}` and initial-capital forms
work in prose and journal entries, backed by declared string variables. Gender
and honorifics remain independent; no verbs are conjugated automatically. Use
`*show_if` paragraphs when forms differ. Journals keep the text resolved at recording.
UDL highlights these exact tokens as keywords in prose where lexical rules permit;
quoted journal strings keep string coloring. UDL cannot validate required variables
or substitute values: save and run preflight for diagnostics. The completion list
still contains directives only; no new command was added.
