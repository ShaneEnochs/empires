# Story authoring

Write UTF-8 text in `src/example.story`, the only supported authoring format.
The parser validates a complete story before play. It produces immutable passage
data; it does not execute JavaScript or the reference engine's language.

## Complete example

```text
*var influence 0
*skill diplomacy "Diplomacy"
*item gold_coin "Gold Coin"
*var honor 5
*var loyal false
*var character_name "Unknown"
*skill composure "Composure"
*item gate_token "Gate Token"

*chapter Prologue

*passage city_gate
*title The City Gate
*set character_name "Alexander"
*add influence 1
*grant_skill composure
*add_item gold_coin 10
*add_item gate_token 1
*journal arrived "${character_name} reached the city with influence ${influence}."

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
*grant_skill diplomacy
*add_item gold_coin 2
*journal met_messenger "You spoke to the messenger."

The messenger lowers their voice.

"The council has been waiting for you."
Your loyalty is ${loyal}.

*continue council

*chapter Chapter One

*passage council
*title The Council Chamber
*add influence -0.5
*revoke_skill composure
*remove_item gold_coin 5
*remove_item gate_token 1
*journal met_council "You entered the council with influence ${influence}."

The council members turn toward you as you enter.

Influence: ${influence}. Honor: ${honor}. Loyal: ${loyal}.

*show_if has_skill diplomacy
Your exchange with the messenger helps you choose your words.

*show_if lacks_skill diplomacy
Without diplomatic training, you face the council unaided.

*show_if has_item gold_coin
Your remaining coins offer a small reassurance.

*show_if item_count gold_coin >= 7
The messenger's extra coins remain after the entry fee.
```

The first passage starts the story. The player can go directly to `council`
(influence `0.5`, honor `5`, loyal `false`) or via `messenger` and Continue
(influence `2.5`, honor `4`, loyal `true`). The council is terminal: there are no
further actions or automatic fall-through. Refreshing starts a new game; variables,
recorded journal events, acquired skills, and inventory persist between passages, not across
page reloads.
The Journal button groups events in first-recorded chapter order; the messenger
route has an extra event. Stored text keeps its original resolved values.
Both routes acquire Composure at the gate and lose it at the council. Only the
messenger route acquires Diplomacy, changing the council's visible prose. The
Skills button lists current acquisitions by display name, in acquisition order.
Both routes start with ten coins and a gate token. The messenger grants two more
coins; council entry removes five coins and the token, leaving seven coins on the
messenger route and five on the direct route. Neither route can underflow.

## Supported syntax

| Construct | Rule |
| --- | --- |
| `*var name literal` | Declares one variable and its initial value before all chapters/passages. Names must be unique. |
| `*skill id "Display Name"` | Defines immutable skill metadata in the same initial section as variables. Skill IDs must be unique; names must be nonempty JSON strings. |
| `*item id "Display Name"` | Defines immutable item metadata interleaved with variables/skills before all chapters/passages. Unique item ID; nonempty JSON-string name. |
| `*chapter Label` | Top-level nonempty literal label for subsequent passages; each declaration needs a following passage. Default: `Prologue`. |
| `*passage id` | Begins a passage with a unique stable ID matching `[a-z][a-z0-9_-]*`. The first passage is the start. |
| `*title text` | Exactly one nonempty literal title per passage, before navigation. Place it immediately after the header. |
| `*set name literal` | Replaces a declared variable with a literal of the same type. Only after the title and before any narrative. |
| `*add name number` | Adds a numeric literal to a declared numeric variable. Same placement as `*set`. |
| `*journal event_id "Entry text"` | Records an event once by a story-wide unique ID. Interpolation uses candidate variables at that point. Same placement as `*set`. |
| `*grant_skill id` | Acquires a declared skill if absent. Same placement as `*set`. |
| `*revoke_skill id` | Removes a declared skill if present. Same placement as `*set`. |
| `*add_item id quantity` | Adds a positive safe integer literal quantity of a declared item. Same placement as `*set`. |
| `*remove_item id quantity` | Removes that quantity, failing entry if insufficient; zero deletes the property. Same placement as `*set`. |
| Narrative text | At least one unconditional paragraph per passage. Nonblank consecutive lines join with spaces; blank lines separate paragraphs. |
| `*show_if name operator literal` | At a paragraph boundary after the title/effects, conditions only the paragraph starting on the immediately following source line. |
| `*show_if has_skill id` / `*show_if lacks_skill id` | Conditions the next paragraph on possession/absence of a declared skill, with the same paragraph boundaries. |
| `*show_if has_item id` / `*show_if lacks_item id` | Conditions the next paragraph on possession/absence of a declared item. |
| `*show_if item_count id operator quantity` | Compares the owned quantity with a nonnegative safe integer literal; absent items count as zero. |
| `${name}` | In narrative only, displays the variable's post-entry value as text. |
| `*choice` | Takes no arguments; starts one or more flat choice lines. Must conclude the passage. |
| `#Label -> destination_id` | Inside a choice block, a nonempty literal label and explicit existing destination. Exactly one `->` separator. |
| `#Label -> destination_id [if name operator literal]` | Optional single typed condition, evaluated against the committed post-entry state. The block must include an unconditional choice. |
| `#Label -> destination_id [if has_skill id]` / `[if lacks_skill id]` | Optional skill condition, using the same evaluator and requiring an unconditional fallback. |
| `#Label -> destination_id [if has_item id]` / `[if lacks_item id]` / `[if item_count id >= 1]` | Optional item condition with the same evaluator/fallback rules; all six comparison operators work for counts. |
| `*continue destination_id` | One explicit Continue destination, mutually exclusive with choices. Must conclude the passage. |

A passage ends at the next `*passage`, a `*chapter` after a valid passage, or EOF. Terminal passages have neither
choices nor Continue. After navigation, only blank lines, choices inside the
current `*choice` block, or a new chapter/passage are allowed. Additional prose, titles,
effects, duplicate action blocks, or nested choices are errors.

## Chapters and journal events

`*chapter Label` is a top-level authoring declaration. Its literal label applies
to the next passage and all subsequent passages until another declaration.
Before any declaration, passages belong to `Prologue`. Labels are nonempty text
with outer whitespace trimmed; quotes and `${...}` remain literal, without
string decoding or interpolation. Reusing a label later is permitted.

A chapter declaration can finish a valid preceding passage, including one with
choices or Continue. It cannot rescue missing titles/prose, empty choices, or
pending conditional prose. Every declaration must have at least one passage
before another chapter or EOF. Variables, skills, and items must precede chapters, and prose/effects
cannot appear between a declaration and its next passage header. Chapters belong
to immutable passage definitions, not a mutable global current chapter; player
navigation order never changes them.

`*journal event_id "Entry text"` is an entry effect after the title and before
all prose. Event IDs match `[a-z][a-z0-9_-]*` and must be unique throughout the
story, including unreachable or mutually exclusive passages. They may match
passage/variable names because those are separate namespaces. Different IDs may
have identical text. Keep event IDs stable when editing text.

Entry text uses the existing double-quoted string rules, including escapes and
empty strings. Interpolation references must be declared and well formed. Text
resolves once, from candidate variables at that exact effect position. Later
`*set`/`*add` effects cannot rewrite it. Inserted strings are never interpreted as
HTML, code, or another template. Journal commands cannot be conditional or appear
inside prose, choices, or after Continue.

Each first recording appends `{ id, chapter, text }` to `GameState.journal` in
effect order. Re-entry runs ordinary variable effects but skips recorded event
IDs, retaining their original chapter and text. New games start with an empty
journal before initial effects, which may immediately record entries. All effects
are atomic: failure rolls back every candidate append, variable change, and skill change. Failed
attempts leave no hidden deduplication history.

The Journal button toggles a read-only section without navigation or effects.
Chapter groups appear in first-recorded order; entries within a group retain
recording order. Later events in an earlier chapter join its existing group.
An open journal updates after successful navigation. Empty journals display
“No journal entries yet.” Arrays and entries are frozen, and chapter headings
and recorded text use `textContent`.

## Skills

Define skills before the first chapter or passage using `*skill id "Display Name"`.
Definitions may interleave with `*var` and `*item` declarations. IDs match
`[a-z][a-z0-9_-]*`, are case-sensitive, and must be unique even if never used.
Skill IDs occupy a separate namespace from variables, passages, and journal
events: `*var diplomacy 0` and `*skill diplomacy "Diplomacy"` may coexist.
Explicit skill commands/conditions distinguish them.

Names use the same double-quoted JSON string literals as variables, including
`\"`, `\\`, `\n`, and `\u2665` escapes. They must contain non-whitespace text after
decoding; single quotes, unquoted names, trailing content, and malformed escapes
are invalid. Duplicate display names are allowed because IDs establish identity.
Names remain literal, without `${...}` interpolation, and are rendered as text.
Definitions contain only ID and name and belong to immutable `Story.skills`.
Definitions inside passages or between chapters are errors.

Acquire and remove skills with `*grant_skill id` and `*revoke_skill id`. Both
require declared IDs and appear after the title, before the first narrative
paragraph. They may interleave with `*set`, `*add`, and `*journal`. They cannot
appear inside prose, conditional paragraphs, choice blocks, or after navigation,
and cannot be conditional. Effects execute in source order on each legitimate
entry, including initial entry and later returns.

New games start with no acquired skills before initial effects. A grant appends
an absent ID; a repeated grant does nothing. Revocation removes a present ID;
revoking an absent skill does nothing. Revoking and regranting puts the ID at the
end of acquisition order, including within the same passage. Acquired IDs live
only in the unique, frozen, JSON-serializable `GameState.skills` array. No levels,
experience, purchasing, rarity, categories, cooldowns, bonuses, or trees exist.

Use `has_skill id` or `lacks_skill id` wherever a condition is supported:

```text
*skill swordsmanship "Swordsmanship"

*passage training
*title Training
*grant_skill swordsmanship

Your training is complete.

*show_if has_skill swordsmanship
You recognize the instructor's fighting stance.

*choice
  #Demonstrate your swordsmanship -> rest [if has_skill swordsmanship]
  #Leave -> rest

*passage rest
*title Rest
*revoke_skill swordsmanship

This short exercise ends your temporary training.

*show_if lacks_skill swordsmanship
You can return to acquire the skill again.

*continue training
```

The shared condition parser/evaluator checks committed skills **after all entry
effects**. A grant or revocation immediately changes visible paragraphs and
available choices. No comparison values, levels, logical operators, parentheses,
compound conditions, or nested blocks are supported. Unknown skills are errors
even in unreachable passages or hidden conditions. Conditional choices still
need an unconditional fallback; navigation enforces the same eligibility, and
any eligible choice permits its shared destination. Continue remains ordinary
unconditional navigation.

Skills participate in atomic entry with variables and journal events. An overflow
anywhere in the effects rejects the entire candidate: no skill acquisition,
revocation, journal append, variable change, or new passage ID commits. Earlier
states and other games stay unchanged. Initial entry follows the same rule.
Reads, condition checks, and rendering never execute skill effects.

The native Skills button opens/closes an accessible section independently of
Journal, with `aria-expanded` reflecting its visibility. Names come from static
definitions and IDs from current state, in acquisition order; no UI copy of
acquired skills exists. Empty lists show “No skills acquired yet.” Open sections
update after navigation, including removal. Toggling either control changes no
gameplay state. Skill names use `textContent`, so HTML-like names remain inert.

## Items and inventory

Declare each item with `*item id "Display Name"` in the initial metadata section,
interleaved with variables and skills before every chapter/passage. Item IDs use
`[a-z][a-z0-9_-]*`, stay stable when names change, and must be unique, even if
unused. Item, variable, skill, passage, and journal IDs have separate namespaces.
Duplicate display names are allowed. Names use the existing double-quoted JSON
string rules and escapes, must be nonempty after trimming, and stay literal
without interpolation. Immutable `Story.items` stores only `{ id, name }`.
Definitions inside passages or between chapters are invalid.

`*add_item id quantity` adds to the current owned quantity; `*remove_item id quantity`
subtracts it. Both operands are required. Quantities use decimal integer digits
without signs or leading zeros, from `1` through `9007199254740991` inclusive.
Reject zero, negatives, fractions, decimal points, exponent notation, hexadecimal,
`NaN`, `Infinity`, unsafe integers, quoted numbers, variables, or expressions.
For example, `*add_item gold_coin 10` works; `*add_item gold_coin influence`,
`*add_item gold_coin 1e3`, and `*remove_item gold_coin 0` do not.

Item effects must be after the title and before the first narrative line, just
like other entry effects. They may interleave with variables, skills, and journal
commands. They cannot appear in prose, conditional paragraphs, choices, or after
navigation, and cannot be conditional. They run once on initial entry and each
legitimate return; reads, rendering, and inventory inspection never rerun them.

New games begin with empty inventory before initial effects. Only owned item IDs
and positive safe integer quantities live in the frozen `GameState.inventory`
record; names stay in story metadata. Adding an owned item increases its existing
quantity. Removing the final quantity deletes its property. Quantity updates retain
display order; removal followed by reacquisition puts the item at the end.
Inherited object properties never count as items, including `constructor`.

Insufficient removal and addition beyond `Number.MAX_SAFE_INTEGER` fail entry with
a passage/item error; quantities are never clamped. Every intermediate operation
must be valid even if a later effect would repair it. The private candidate has
its own inventory record: failure discards all inventory, variable, journal, skill,
and passage-ID changes, including on initial entry or repeated attempts. Earlier
states and other games remain unchanged. Inventory is JSON-serializable and will
be preserved by the future single checkpoint without a separate recovery system.

All existing condition locations support `has_item id`, `lacks_item id`, and
`item_count id operator quantity`. Counts use the same six operators as variables:
`==`, `!=`, `>`, `>=`, `<`, and `<=`. Operands are **nonnegative** safe integer
decimal literals, so zero is valid here. Absent items count as zero. Possession
means at least one; absence means zero. Item counts never read ordinary variables.
Unknown items are errors, including in hidden or unreachable content.

```text
*item gold_coin "Gold Coin"
*item gate_token "Gate Token"

*passage gate
*title The Gate
*add_item gold_coin 10
*add_item gate_token 1

The guard gives you a token.

*show_if has_item gate_token
The token identifies you as a visitor.

*choice
  #Enter the council -> council [if item_count gold_coin >= 5]
  #Wait outside -> gate

*passage council
*title The Council
*remove_item gold_coin 5
*remove_item gate_token 1

The clerk collects your token and five coins.

*show_if lacks_item gate_token
Your token has been handed in.
```

The shared evaluator reads committed state after all entry effects. Acquiring or
removing items immediately changes available choices and visible paragraphs.
Conditional choices still require an unconditional fallback, and navigation uses
the same eligibility rules, including shared destinations. No compounds, logical
operators, parentheses, variable operands, expressions, or conditional effects
are added. Existing variable/skill conditions and Continue remain unchanged.

The Inventory button toggles a native labeled section beside Journal and Skills,
with `aria-controls`, `aria-expanded`, and keyboard access. It derives names from
`Story.items` and quantities/order from `GameState.inventory`, listing only owned
items as `Name × quantity`. Empty inventory shows “No items in inventory.” Open
sections update after navigation, including items removed at zero. Toggling any
control never changes gameplay state or navigates; item names use `textContent`,
so HTML-like strings remain inert. There is no UI inventory copy or sorting layer.

Only names and quantities exist: no descriptions, custom properties, shops,
buying/selling systems, equipment, crafting, rarity, durability, weight, capacity,
categories, or passive effects.

## Variables and literal values

Declare every variable before all chapters and passages; declarations cannot appear
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

A variable condition is exactly one declared variable, one operator, and one literal:

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
operators, multiple conditions, nested `*if`, and `*else`.
For example, `[if influence >= other]`, `[if influence + 1 >= 5]`, and
`[if influence >= 5 && loyal == true]` are errors. Type mismatches such as
`[if loyal == 0]`, ordered strings such as `[if faction > "guild"]`, non-finite
numbers, missing operands/brackets, extra suffixes, and invalid operators are also
rejected with passage/source-line errors before gameplay can start.

## Conditional narrative

`*show_if` uses exactly the same condition grammar and comparison semantics as
choices, without the `[if ...]` brackets. It applies exclusively to the next
paragraph:

```text
*var influence 4
*var loyal false

*passage court
*title The Court
*add influence 1

The king studies your arrival.

*show_if influence >= 5
The king recognizes your achievements.
He welcomes you into his court.

Everyone awaits your answer.

*show_if loyal == true
The guards recognize your oath.
```

Entry raises influence to 5, so both lines in the king's welcome form one visible
paragraph. The guards' paragraph is hidden. The surrounding ordinary paragraphs
are unconditional. Strings work too, for example `*show_if faction == "merchant"`
when `faction` has been declared. All six operators use the same typed rules,
finite literals, and parser/evaluator as choice conditions.
The skill forms `*show_if has_skill id` and `*show_if lacks_skill id` use that
same parser/evaluator and all the paragraph boundary rules below.
The item forms `has_item id`, `lacks_item id`, and `item_count id operator quantity`
also work after `*show_if` with these same boundaries.

Boundary rules:

- Put `*show_if` after the passage title and all entry effects, before choices
  or Continue. If prose precedes it, a blank line must separate that paragraph
  from the directive; it cannot split consecutive lines of existing prose.
- The next physical source line must begin nonblank narrative prose. A blank
  line, EOF, another `*show_if`, or any other directive there is an error.
- Consecutive prose lines join with spaces and share the condition. A blank
  line ends that paragraph and resets visibility to unconditional for subsequent
  ordinary prose. Another `*show_if` requires a separate paragraph boundary.
- Navigation, the next passage, or EOF can also conclude the final paragraph
  normally. There is no closing command, nested block, `*else`, or `*endif`.
- Conditions cannot wrap `*set`, `*add`, choices, Continue, or other commands.
  Effects after narrative remain invalid. `*show_if` is also invalid before a
  title, inside a choice block, or after Continue.
- Every passage needs at least one unconditional narrative paragraph, even if
  all conditions initially pass. No fallback text is generated automatically.

`game.passage.paragraphs` stores immutable `{ text, condition? }` records.
`game.visibleParagraphs` filters them using committed post-entry variables, skills, and inventory, just
as `game.availableChoices` filters actions. The browser uses this runtime view;
hidden paragraphs create no elements or spacing. Visibility does not alter state,
rerun effects, or change navigation. Legitimate re-entry applies its effects once
and then derives visibility from the resulting state.

Visible conditional prose supports `${name}` interpolation with that same state.
Placeholders remain in authored records, substitution is single-pass, and display
uses `textContent`. HTML-like inserted strings stay literal. All interpolation
references and conditions are validated before play, including hidden paragraphs;
a false condition cannot conceal an invalid variable reference.

Malformed conditions, undeclared variables, incompatible types, misplaced
directives, empty conditional paragraphs, and passages with no unconditional
prose produce source-line/passage errors. There are no logical operators,
arithmetic expressions, variable-to-variable comparisons, or conditional effects.

## Entry effects

Effects run once, in source order, on entry. For example:

```text
*var count 0

*passage arrival
*title Arrival
*add count 2
*journal first_gain "Count first rose to ${count}."
*set count 10
*add count -0.25

Count: ${count}.
```

This displays `Count: 9.75.`, while the journal retains `Count first rose to 2.`.
Effects must be after `*title` and before the first
narrative line, even if blank lines separate the sections. They cannot appear
between paragraphs, inside choice blocks, or after Continue. Initial entry uses
the same rules as navigation. A legitimate later return to a passage applies its
effects once again; merely reading or rerendering it does not.

Every entry is atomic. An overflow in any addition rejects the whole transition,
even if a later effect would repair the value. Previous state and all its values
remain intact, including inventory, acquired skills, and journal entries. A failed initial
entry does not start a game. No effect reads the
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
execute HTML or recursively interpolate `other`. Titles, choice labels,
chapter labels, skill/item display names, and variable/condition literals never interpolate; `${unknown}`
there remains literal text. Journal templates resolve once when first recorded.
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
| Empty chapter or no following passage | Supply a nonempty label and at least one passage per declaration. |
| Variables, skills, or items after `*chapter` | Move all definitions before chapter metadata. |
| Duplicate item ID or empty item name | Use a unique item ID and a non-whitespace double-quoted name. |
| `*add_item unknown 1` or `has_item unknown` | Declare that item in the initial metadata section. |
| `*remove_item gold_coin 0` or `*add_item gold_coin 1.5` | Use an explicit positive safe integer in decimal digits. |
| `item_count gold_coin >= influence` | Compare item counts with nonnegative safe integer literals. |
| Duplicate skill ID or empty skill name | Use a unique skill ID and a non-whitespace double-quoted name. |
| `*grant_skill unknown` or `has_skill unknown` | Define that skill in the initial metadata section. |
| `has_skill diplomacy >= 1` | Skills are binary; use only `has_skill diplomacy` or `lacks_skill diplomacy`. |
| Duplicate journal event ID | Use one unique ID per authored journal effect; runtime re-entry deduplicates it. |
| `*journal event Text` | Supply a double-quoted string and declared interpolation references. |
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
| A blank line or command immediately after `*show_if` | Start prose on the very next source line. |
| `*show_if` between prose lines | End the previous paragraph with a blank line first. |
| A passage containing only conditional prose | Add at least one unconditional narrative paragraph. |
| `*if`, `*comment`, or nested `*choice` | These commands are unsupported. |

Errors include one-based source lines and passage IDs when available. Missing
titles point to their passage headers; missing destinations point to their
referring actions. No partially validated story can initialize a game.

## Future functionality, not current syntax

Character attributes/UI, arithmetic expressions, and character creation remain
future work. Chapters, the journal, binary skills, and inventory quantities are
implemented; journal, acquired skills, and inventory must be
included in the future single checkpoint. Definitions stay in static `Story` metadata.

The saving/death roadmap is documentation only: one persistent automatic
checkpoint, future author-controlled `*checkpoint` and `*death`, Try Again on
death passages, Continue Game on reopening, and confirmed New Game. The first new
game must establish an initial checkpoint. Authored checkpoints replace it;
death must not save dead state over it. Try Again restores complete pre-passage
state and enters that passage with effects applied exactly once, including current
variables/journal/skills/inventory and future character-creation data. Continue Game resumes
the latest checkpoint; New Game confirms before overwriting progress.

There will be no traditional Undo, choice-history stack, manual rewind, Return to
Checkpoint control, manual saves, or save slots. These future directives and
actions are **not supported syntax or UI yet**; no persistence, death handling,
checkpoint capture/restoration, title-screen changes, or Try Again is implemented.
See `docs/ENGINE.md` for the checkpoint boundary. Current `*continue id` remains
ordinary navigation.

Random mechanics, glossary, shops, skill purchasing, manual saves, save slots,
import/export, procedures, subroutines, loops, and plugin systems remain excluded
unless a future task explicitly changes the requirements.
