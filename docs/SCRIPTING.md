# Minimal passage format

Stories are JSON, not executable scripts. Edit `src/example.story.json` for the
demo. There is no parser for the reference repository's command syntax.

```json
{
  "startId": "arrival",
  "passages": [
    {
      "id": "arrival",
      "title": "Arrival",
      "text": ["You reach the city gate."],
      "choices": [
        { "label": "Enter the city", "destinationId": "hall" }
      ]
    },
    {
      "id": "hall",
      "title": "The Hall",
      "text": ["A messenger opens the council doors."],
      "choices": [],
      "continueTo": "council"
    },
    {
      "id": "council",
      "title": "The Council",
      "text": ["The council waits for you."],
      "choices": []
    }
  ]
}
```

## Rules

| Field | Meaning |
| --- | --- |
| `startId` | Required existing passage ID where a new game begins. |
| `passages` | Required non-empty array of passage definitions. Order is for authors only. |
| `id` | Required unique, case-sensitive stable ID matching `[a-z][a-z0-9_-]*`. |
| `title` | Required non-empty display heading; not an identifier. |
| `text` | Required non-empty array of non-empty plain-text paragraphs, displayed in order. |
| `choices` | Required array of `{ "label", "destinationId" }` objects; may be empty. Labels are non-empty. |
| `continueTo` | Optional existing destination ID; requires an empty `choices` array. Displays one Continue button. |

`startId`, `destinationId`, and `continueTo` use the same ID grammar. Whitespace is
not stripped from IDs. All references must resolve, even in unreachable passages.
Unknown fields are errors at story, passage, and choice level. JSON must be valid
JSON: no comments or trailing commas. All destinations are validated before the
first passage is shown.

Use an ID such as `gate` or `council_arrival` and keep it when editing prose,
renaming a title, or moving a passage. Never generate an ID from a title, array
index, timestamp, or random value. Changing an ID means changing passage identity;
every reference to it must be updated. Keep that in mind for future checkpoint
compatibility, which this stage does not implement.

Choices and Continue are alternatives; a passage cannot have both. Each player
action enters exactly one destination. With no choices and no `continueTo`, a
passage ends the current route. Continue never means "the next array element."
Text is literal: HTML, Markdown, reference tags, and command-like text are not
evaluated or interpreted. Use paragraph strings for paragraph breaks.

## Later authoring scope

Future specifications will define variables and conditions, simple skills and
item quantities, journal entries, character creation, session-only Undo, and one
automatic author-defined checkpoint. Title-screen Continue will resume that
checkpoint, and New Game will require confirmation. Do not add placeholder
commands or fields for these now; current validation deliberately rejects them.

There will be no glossary, randomness, shops, skill purchasing, save slots, manual
saving, import/export, nested calls, subroutines, loops, complex styling, or plugin
system. No executable code belongs in story data.
