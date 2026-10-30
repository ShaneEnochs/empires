# Story authoring

Write UTF-8 plain text in `src/example.story`. This is the only supported
story-authoring format. The parser builds immutable passage data for the existing
runtime; it does not execute code or the reference engine's scripting language.

## Complete example

```text
*passage city_gate
*title The City Gate

At dawn, you arrive outside the city walls.

The guards stand beneath the raised portcullis.
A messenger waits beside the entrance.

*choice
  #Speak to the messenger -> messenger
  #Enter the city -> council

*passage messenger
*title A Quiet Warning

The messenger lowers their voice.

"The council has been waiting for you."

*continue council

*passage council
*title The Council Chamber

The council members turn toward you as you enter.

An empty chair stands at the head of the table.
```

This story starts at `city_gate`. The player can go directly to `council`, or
visit `messenger` and press Continue to reach `council`. The council is terminal:
no choices or Continue button are displayed. There is no automatic fall-through.

## Supported syntax

| Construct | Rule |
| --- | --- |
| `*passage id` | Begins a passage; IDs are unique and match `[a-z][a-z0-9_-]*`. The first passage is the starting passage. |
| `*title text` | Exactly one nonempty display title per passage, before navigation. Conventionally placed just after the header. |
| Narrative text | At least one paragraph per passage. Consecutive nonblank source lines join with single spaces between lines. Blank lines separate paragraphs. |
| `*choice` | Takes no arguments; introduces one or more flat choice lines. Must conclude the passage. |
| `#Label -> destination_id` | Inside a choice block, defines a nonempty label and a valid existing destination. Exactly one `->` separator is required. |
| `*continue destination_id` | One explicit Continue destination; cannot coexist with `*choice`. Must conclude the passage. |

A passage ends at the next `*passage` or the end of the file. Terminal passages
have neither `*choice` nor `*continue`. After a navigation directive only blank
lines, choice lines (within `*choice`), or the next passage may follow. Additional
prose, titles, directives, duplicate navigation blocks, and mixing choices with
Continue are errors. Choices cannot contain nested choice blocks or commands.

Leading and trailing whitespace is removed from source lines. Indentation is
optional and has no nesting semantics; all choices are peers. Whitespace around
`->` is optional. A label cannot contain another `->`. Paragraphs retain internal
spacing within each source line. Blank lines before the first passage and at the
end are harmless. LF, CRLF, and CR line endings and a leading UTF-8 BOM are accepted.

Directives are case-sensitive. Lines beginning with `*` are reserved for the
supported directives; unknown ones are errors. Outside a choice block, `#` is
literal narrative text, so Markdown headings are displayed as text. There is no
comment syntax: `*comment` is unsupported, and `#` does not hide prose. Inline
HTML, Markdown, JavaScript, and expressions are never interpreted. Titles and
choice labels are also literal text, rendered with `textContent`. For example,
`<em>Welcome</em>` and `${gold}` appear exactly as written.

## Stable identifiers and validation

Use an ID such as `city_gate` or `chapter_1-council` and keep it when editing
prose, changing a title, or moving a passage. IDs are never derived from titles,
array positions, or random values. Moving the first passage changes the starting
location; reordering other passages does not affect navigation.

Changing an ID changes passage identity. Update every reference when an ID must
change; future checkpoint compatibility will rely on these stable identifiers.
Checkpoint saving is not implemented yet.

The entire story is validated before a game starts, including destinations in
unreachable passages. Forward references are supported. Parsing either returns
one complete immutable `Story` or throws; invalid late passages cannot partially
initialize a game. Errors include a one-based source line and a passage ID when
available. A missing title points to the passage header; a missing destination
points to the referring action.

## Common errors

| Invalid input | Fix |
| --- | --- |
| `*passage City Gate` | Use a unique ID such as `city_gate`, with lowercase letters, digits, underscores, or hyphens; begin with a letter. |
| A second `*passage city_gate` | Give it a different stable ID; duplicate IDs are rejected even with different titles. |
| Missing `*title` or two titles | Supply exactly one nonempty title. |
| A title with no narrative | Add at least one nonblank paragraph. |
| `#Go to council` inside `*choice` | Add the explicit arrow and destination: `#Go to council -> council`. |
| `# -> council` | Give the choice a nonempty label. |
| `*choice` with no following choices | Add at least one choice line. |
| An action referring to `unknown_hall` | Define that passage or correct the destination ID. |
| Prose after `*continue council` | Move it before Continue, or into a new destination passage. |
| `*continue` after a choice block | Use choices or Continue, never both in one passage. |
| `*if`, `*set`, `*comment`, or nested `*choice` | These are unsupported; do not use them as commands. |

## Planned functionality, not supported syntax

Character attributes and variables, arithmetic and conditional choices, basic
skills, inventory quantities, chapter-organized journal entries, character
creation, session-only Undo, one persistent automatic author-defined checkpoint,
Continue Game, and confirmed New Game require future specifications and explicit
implementation tasks. There are no placeholder commands for these features.

Random mechanics, glossary systems, shops, skill purchasing, manual saving, save
slots, import/export, procedures, subroutines, loops, and plugin systems remain
excluded unless a future task explicitly changes the requirements.
