# Story authoring

Write UTF-8 text in `src/example.story`, the only supported authoring format.
The parser validates a complete story before play. It produces immutable passage
data; it does not execute JavaScript or the reference engine's language.

## Complete example

```text
*var influence 0
*var honor 5
*var loyal false
*var character_name "Unknown"

*passage city_gate
*title The City Gate
*set character_name "Alexander"
*add influence 1

At dawn, you arrive outside the city walls.

The guards stand beneath the raised portcullis.
A messenger waits beside the entrance.
Your name is ${character_name}. Your influence is ${influence}.

*choice
  #Speak to the messenger -> messenger
  #Enter the city -> council

*passage messenger
*title A Quiet Warning
*add influence 2
*add honor -1
*set loyal true

The messenger lowers their voice.

"The council has been waiting for you."
Your loyalty is ${loyal}.

*continue council

*passage council
*title The Council Chamber
*add influence -0.5

The council members turn toward you as you enter.

Influence: ${influence}. Honor: ${honor}. Loyal: ${loyal}.
```

The first passage starts the story. The player can go directly to `council`
(influence `0.5`, honor `5`, loyal `false`) or via `messenger` and Continue
(influence `2.5`, honor `4`, loyal `true`). The council is terminal: there are no
further actions or automatic fall-through. Refreshing starts a new game; variables
persist between passages in the current game, not across page reloads.

## Supported syntax

| Construct | Rule |
| --- | --- |
| `*var name literal` | Declares one variable and its initial value before the first passage. Names must be unique. |
| `*passage id` | Begins a passage with a unique stable ID matching `[a-z][a-z0-9_-]*`. The first passage is the start. |
| `*title text` | Exactly one nonempty literal title per passage, before navigation. Place it immediately after the header. |
| `*set name literal` | Replaces a declared variable with a literal of the same type. Only after the title and before any narrative. |
| `*add name number` | Adds a numeric literal to a declared numeric variable. Same placement as `*set`. |
| Narrative text | At least one paragraph per passage. Nonblank consecutive lines join with spaces; blank lines separate paragraphs. |
| `${name}` | In narrative only, displays the variable's post-entry value as text. |
| `*choice` | Takes no arguments; starts one or more flat choice lines. Must conclude the passage. |
| `#Label -> destination_id` | Inside a choice block, a nonempty literal label and explicit existing destination. Exactly one `->` separator. |
| `#Label -> destination_id [if name operator literal]` | Optional single typed condition, evaluated against the committed post-entry state. The block must include an unconditional choice. |
| `*continue destination_id` | One explicit Continue destination, mutually exclusive with choices. Must conclude the passage. |

A passage ends at the next `*passage` or EOF. Terminal passages have neither
choices nor Continue. After navigation, only blank lines, choices inside the
current `*choice` block, or a new passage are allowed. Additional prose, titles,
effects, duplicate action blocks, or nested choices are errors.

## Variables and literal values

Declare every variable before the first passage; declarations cannot appear
inside passages. Names are case-sensitive and follow the same lowercase ASCII
identifier grammar as passage IDs. `influence`, `chapter_1`, and `honor-total` are
valid; `Influence`, `1honor`, and names containing spaces are not. A variable name
and a passage ID may be identical: they are separate kinds of identifier.

Supported literals:

- **Numbers:** finite JSON-style numbers, including `0`, `-1`, `0.25`, `-0.5`,
  and `1e3`. Use a leading digit for decimals. No leading `+`, leading zeroes
  such as `01`, hexadecimal, `NaN`, or infinities. Arithmetic uses normal
  JavaScript floating-point precision; numeric overflow fails passage entry.
- **Booleans:** exactly `true` or `false`.
- **Strings:** double-quoted text, including the empty string `""`. Standard JSON
  string escapes work: `\"`, `\\`, `\n`, and `\u2665`, for example. Single quotes,
  unquoted names, raw multiline strings, and trailing content are invalid.

Arrays, objects, `null`, and custom values are unsupported. `*set` cannot change
an established type: assigning `0.5` to an initially integer variable works;
assigning `"0.5"` or `true` to it does not. `*add` requires both a numeric variable
and a numeric literal. `*set count other_count`, `*add count 1 + 2`, and
`*set count ${other_count}` are errors. No arithmetic expressions, variable
operands, interpolation in assignments, or general evaluator are implemented.
A quoted string such as `"${other_count}"` is just a literal string.

## Conditional choices

A choice can have one condition **after its destination**:

```text
*var influence 4
*var honor 11
*var loyal false
*var faction "guild"

*passage audience
*title Audience
*add influence 1

The king awaits your answer.

*choice
  #Request a title -> receive_title [if influence >= 5]
  #Challenge the knight -> duel [if honor > 10]
  #Declare loyalty -> oath [if loyal == false]
  #Speak to the merchant -> merchant [if faction == "guild"]
  #Leave -> departure
```

This excerpt assumes each destination is defined elsewhere in the same file.
The title request is available because entry raises influence from 4 to 5 before
conditions are checked. The unconditional Leave action is the required fallback.

Each condition is exactly one declared variable, one operator, and one literal:

| Operators | Operand types |
| --- | --- |
| `==`, `!=` | Matching numbers, booleans, or strings; strict equality without coercion. |
| `>`, `>=`, `<`, `<=` | Numbers only. |

Conditions use the same names and literals as declarations/effects, including
negative/decimal numbers and escaped double-quoted strings. Whitespace around the
operator is optional. The suffix starts with lowercase `[if` and ends with `]`;
string values may themselves contain brackets, arrows, or operator-like text.
Conditions belong after the destination, never in the label. `[if ...]`-looking
syntax in a choice label is rejected, not silently displayed as prose.

Every block containing a conditional choice needs **at least one unconditional
choice**, even if a condition starts true. A second conditional choice is not a
fallback. All destinations must exist, including those of false conditions.
Continue and terminal passages are unaffected, and conditional Continue is
unsupported.

Authored choices remain in immutable story data. The game exposes only currently
eligible ones to the renderer, so unavailable choices are hidden entirely.
Eligibility uses committed values after entry effects, never initial declaration
values or DOM state. Evaluating choices or rerendering never applies effects.
A later legitimate re-entry applies its effects once and recomputes eligibility.
The runtime also enforces conditions when navigating; bypassing a hidden button
cannot change state. If choices share a destination, any eligible one permits it.

Unsupported: variable-to-variable comparisons, arithmetic, parentheses, logical
operators, multiple conditions, conditional narrative, nested `*if`, and `*else`.
For example, `[if influence >= other]`, `[if influence + 1 >= 5]`, and
`[if influence >= 5 && loyal == true]` are errors. Type mismatches such as
`[if loyal == 0]`, ordered strings such as `[if faction > "guild"]`, non-finite
numbers, missing operands/brackets, extra suffixes, and invalid operators are also
rejected with passage/source-line errors before gameplay can start.

## Entry effects

Effects run once, in source order, on entry. For example:

```text
*var count 0

*passage arrival
*title Arrival
*add count 2
*set count 10
*add count -0.25

Count: ${count}.
```

This displays `Count: 9.75.`. Effects must be after `*title` and before the first
narrative line, even if blank lines separate the sections. They cannot appear
between paragraphs, inside choice blocks, or after Continue. Initial entry uses
the same rules as navigation. A legitimate later return to a passage applies its
effects once again; merely reading or rerendering it does not.

Every entry is atomic. An overflow in any addition rejects the whole transition,
even if a later effect would repair the value. Previous state and all its values
remain intact. A failed initial entry does not start a game. No effect reads the
browser UI or performs external actions.

## Interpolation and literal content

Narrative `${name}` placeholders use the current values after all entry effects.
Booleans display as `true`/`false`, numbers as their normal string form, and strings
as their contents without quotes. Placeholders must fit on one source line and
contain exactly a declared name, without spaces or expressions. Unknown names,
`${count + 1}`, and unclosed `${count` are validation errors, including in
unreachable passages. Immutable source text keeps its placeholders.

Interpolation is a single read-only substitution pass. If a variable contains
`<em>${other}</em>`, that entire string is displayed as literal text; it does not
execute HTML or recursively interpolate `other`. Titles, choice labels, and
quoted literals never interpolate; `${unknown}` there remains literal text.
All display content uses `textContent`, so HTML and JavaScript are never executed.
Markdown and other inline syntax stay literal as well.

## Whitespace and stable IDs

Source lines lose leading/trailing whitespace; internal spacing is retained.
Consecutive narrative lines join with one space between lines. Indentation does
not imply nesting; all choices are peers. Whitespace around `->` is optional,
and labels cannot contain another `->`. A condition's quoted string may contain
`->` without creating another choice. Blank lines around passages are harmless.
LF, CRLF, CR, and a leading UTF-8 BOM are accepted.

Directives are case-sensitive. Lines beginning with `*` are reserved for supported
directives; unknown ones are errors. Outside choice blocks, `#` is literal prose,
so Markdown headings appear as text. There is no comment syntax: `*comment` is
unsupported and `#` never hides narrative. Inline directive-looking text is not
executed.

Keep stable passage IDs when editing prose, changing titles, or moving passages.
Moving the first passage changes where play begins; moving other passages does
not affect navigation. Changing an ID changes passage identity, so update every
reference. Future checkpoint compatibility will rely on these IDs. Forward
passage references are valid, and all destinations are checked before play.

## Common errors

| Invalid input | Fix |
| --- | --- |
| Duplicate `*passage city_gate` | Give each passage a unique stable ID. |
| `*passage City Gate` | Use `city_gate`, matching the identifier grammar. |
| Missing `*title` or two titles | Supply exactly one nonempty title. |
| A title with no narrative | Add at least one nonblank paragraph. |
| `*var count 0` inside a passage | Move declarations to the beginning of the file. |
| `*set missing 1` or `${missing}` in narrative | Declare that variable first. |
| `*set count "two"` for a number | Keep the declared type. |
| `*add loyal 1` for a boolean | Only add numeric literals to numeric variables. |
| Effects after narrative or navigation | Move them between the title and first paragraph. |
| `#Go to council` inside a choice block | Use `#Go to council -> council`. |
| `# -> council` or an empty `*choice` | Provide at least one nonempty label with an explicit destination. |
| An action to `unknown_hall` | Define that passage or correct the destination. |
| Continue after choices | Use either choices or Continue in that passage. |
| `[if influence >= other]` | Compare with a literal, not another variable. |
| A conditional block with no unconditional option | Add a fallback choice. |
| A condition before `->` or malformed brackets | Put exactly one valid `[if name operator literal]` suffix after the destination. |
| `*if`, `*comment`, or nested `*choice` | These commands are unsupported. |

Errors include one-based source lines and passage IDs when available. Missing
titles point to their passage headers; missing destinations point to their
referring actions. No partially validated story can initialize a game.

## Future functionality, not current syntax

Character attributes/UI, conditional narrative, arithmetic expressions,
basic skills, inventory quantities, chapter journals, character creation, recent
session Undo, one automatic persistent author-defined checkpoint, Continue Game,
and confirmed New Game require future requests. There are no placeholder
commands or storage implementations for these features.

Random mechanics, glossary, shops, skill purchasing, manual saves, save slots,
import/export, procedures, subroutines, loops, and plugin systems remain excluded
unless a future task explicitly changes the requirements.
