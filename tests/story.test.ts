import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseStory } from '../src/story';

const end = '*passage end\n*title End\nYou arrive.';
const opening = '*passage opening\n*title Opening\nA road.\n\nA destination.\n*choice\n  #Walk -> end';
const source = `${opening}\n\n${end}`;

function invalid(input: string, expected: RegExp): void {
  assert.throws(() => parseStory(input), expected);
}

test('parses multiple passages, choices, Continue, and terminal content from the example', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  assert.equal(story.startId, 'gate');
  assert.deepEqual(story.passages.map(p => p.id), ['gate', 'messenger', 'council']);
  assert.equal(story.passages[0]?.text.length, 2);
  assert.deepEqual(story.passages[0]?.choices, [
    { label: 'Speak to the messenger', destinationId: 'messenger' },
    { label: 'Go straight to the council', destinationId: 'council' },
  ]);
  assert.equal(story.passages[1]?.continueTo, 'council');
  assert.deepEqual(story.passages[2]?.choices, []);
  assert.equal(story.passages[2]?.continueTo, undefined);
});

test('joins consecutive prose lines with spaces and separates paragraphs on blank lines', () => {
  const story = parseStory('*passage intro\n*title Arrival\n\n  First line.\nSecond line.  \n \t\nThird line.\nFourth line.');
  assert.deepEqual(story.passages[0]?.text, ['First line. Second line.', 'Third line. Fourth line.']);
});

test('accepts common line endings, surrounding blank lines, and a UTF-8 BOM', () => {
  for (const newline of ['\n', '\r\n', '\r']) {
    const story = parseStory(`\uFEFF\n\n${source}\n\n`.replaceAll('\n', newline));
    assert.equal(story.startId, 'opening');
    assert.equal(story.passages[0]?.choices[0]?.destinationId, 'end');
  }
});

test('the first passage is the starting passage; IDs do not encode order', () => {
  assert.equal(parseStory(source).startId, 'opening');
  assert.equal(parseStory(`${end}\n\n${opening}`).startId, 'end');
});

test('IDs and destinations survive prose edits, title changes, reordering, and insertion', () => {
  const original = parseStory(source);
  const edited = parseStory(`${end}\n\n*passage extra\n*title Extra\nElsewhere.\n\n${opening.replace('Opening', 'Renamed').replace('A road.', 'Rewritten.')}`);
  assert.equal(edited.passages.find(p => p.id === 'opening')?.id, original.passages[0]?.id);
  assert.deepEqual(edited.passages.find(p => p.id === 'opening')?.choices, original.passages[0]?.choices);
});

test('rejects duplicate IDs even when titles differ, identifying the second definition', () => {
  invalid(`${end}\n*passage end\n*title Another ending\nMore prose.`, /Line 4, passage "end": Duplicate passage ID/);
});

test('reports the exact source line for an undefined choice destination', () => {
  invalid(opening, /Line 7, passage "opening": Missing destination "end"/);
});

test('rejects a missing Continue destination with its source location', () => {
  invalid(`${end}\n*continue missing`, /Line 4, passage "end": Missing destination "missing"/);
});

test('validates destinations in passages unreachable from the start', () => {
  invalid(`${end}\n\n${opening.replace('-> end', '-> missing')}`, /passage "opening": Missing destination "missing"/);
});

test('requires a passage and rejects content or directives before its header', () => {
  for (const input of ['', ' \n\t', 'Orphan prose', '*title Orphan', '*choice', '*continue end']) {
    invalid(input, /Line 1: .*passage/);
  }
});

test('does not accept the old JSON authoring format', () => {
  invalid('{"startId":"end","passages":[]}', /Expected \*passage/);
});

for (const invalidId of ['', 'two words', 'Uppercase', '1number', 'café', 'bad.id']) {
  test(`rejects an invalid passage identifier: ${JSON.stringify(invalidId)}`, () => {
    invalid(`*passage ${invalidId}\n*title End\nText.`, /Line 1: Passage ID must match/);
  });
}

test('validates IDs on every passage, not just the first one', () => {
  invalid(`${end}\n*passage bad id\n*title Other\nText.`, /Line 4: Passage ID must match/);
});

test('accepts stable IDs containing underscores, hyphens, and digits', () => {
  const story = parseStory('*passage chapter_1-gate\n*title Start\nText.');
  assert.equal(story.startId, 'chapter_1-gate');
});

test('requires exactly one nonempty title per passage', () => {
  invalid('*passage intro\nText.', /Line 1, passage "intro": .*exactly one \*title/);
  invalid('*passage intro\n*title  \nText.', /Line 2, passage "intro": \*title requires non-empty/);
  invalid(`${end}\n*title Again`, /Line 4, passage "end": Duplicate \*title/);
});

test('preserves the requirement for at least one narrative paragraph', () => {
  invalid('*passage empty\n*title Empty\n\n', /passage "empty": .*narrative paragraph/);
});

for (const choice of ['# -> end', '#Go ->', '#Go end', 'Go -> end', '#Go => end', '#Go -> end -> other']) {
  test(`rejects a malformed choice: ${choice}`, () => {
    invalid(`*passage intro\n*title Intro\nText.\n*choice\n${choice}\n${end}`, /Line 5, passage "intro": Expected #Nonempty choice label/);
  });
}

test('rejects invalid destination identifiers for choices and Continue', () => {
  for (const destination of ['bad id', 'Uppercase', '1number', 'end extra']) {
    invalid(`*passage intro\n*title Intro\nText.\n*choice\n#Go -> ${destination}`, /Choice destination must match/);
    invalid(`*passage intro\n*title Intro\nText.\n*continue ${destination}`, /Continue destination must match/);
  }
  invalid(`${end}\n*continue`, /Continue destination must match/);
});

test('requires a nonempty choice block at EOF and before the next passage', () => {
  const empty = '*passage intro\n*title Intro\nText.\n*choice\n\n';
  invalid(empty, /Line 4, passage "intro": \*choice requires at least one choice/);
  invalid(`${empty}${end}`, /Line 4, passage "intro": \*choice requires at least one choice/);
});

test('rejects arguments on *choice', () => {
  invalid(`${end}\n*choice extra`, /\*choice takes no arguments/);
});

test('rejects combining choices and Continue in either order', () => {
  invalid(`${opening}\n*continue end\n${end}`, /Choices and Continue must conclude/);
  invalid(`${end}\n*continue end\n*choice\n#Go -> end`, /Choices and Continue must conclude/);
});

test('rejects prose or further directives after choices and Continue', () => {
  invalid(`${opening}\nMore prose.\n${end}`, /Line 8, passage "opening": Expected #Nonempty choice label/);
  invalid(`${opening}\n*title Late\n${end}`, /must conclude the passage/);
  invalid(`${opening}\n*choice\n#Go -> end\n${end}`, /must conclude the passage/);
  invalid(`${end}\n*continue end\nMore prose.`, /Line 5, passage "end": Continue must conclude/);
  invalid(`${end}\n*continue end\n#Go -> end`, /Continue must conclude/);
  invalid(`${end}\n*continue end\n*continue end`, /must conclude the passage/);
});

for (const directive of ['*random', '*if flag', '*comment hidden', '*call setup', '*while true', '*choice_nested', '*passagex wrong']) {
  test(`rejects an unsupported directive: ${directive}`, () => {
    invalid(`${end}\n${directive}`, /Line 4, passage "end": Unsupported directive/);
  });
}

test('rejects a *set command after narrative, even though *set is now supported', () => {
  invalid(`${end}\n*set gold 1`, /Line 4, passage "end": Effects must appear after \*title and before the first narrative paragraph/);
});

test('blank lines and indentation in a flat choice list do not change its meaning', () => {
  const story = parseStory(`*passage intro\n*title Intro\nText.\n*choice\n\n  #First -> end\n\n\t#Second->end\n\n${end}`);
  assert.deepEqual(story.passages[0]?.choices.map(c => c.label), ['First', 'Second']);
});

test('preserves literal HTML, Markdown, JavaScript, expressions, titles, and choice labels', () => {
  const literal = '<script>alert(1)</script> **bold** [link](url) ${gold} {window.alert(1)}';
  const story = parseStory(`*var gold 0\n*passage intro\n*title ${literal}\n${literal}\n\n# A literal Markdown heading\n*choice\n#${literal} -> end\n${end}`);
  assert.equal(story.passages[0]?.title, literal);
  assert.deepEqual(story.passages[0]?.text, [literal, '# A literal Markdown heading']);
  assert.equal(story.passages[0]?.choices[0]?.label, literal);
});

test('validated story definitions cannot be changed by callers', () => {
  const story = parseStory(source);
  const passage = story.passages[0]!;
  assert.equal(Reflect.set(story, 'startId', 'end'), false);
  assert.throws(() => Array.prototype.push.call(story.passages, passage), TypeError);
  assert.equal(Reflect.set(passage, 'id', 'renamed'), false);
  assert.equal(Reflect.set(passage.text, 0, 'Changed'), false);
  assert.throws(() => Array.prototype.push.call(passage.choices, { label: 'Other', destinationId: 'end' }), TypeError);
  assert.equal(Reflect.set(passage.choices[0]!, 'destinationId', 'missing'), false);
  assert.equal(story.startId, 'opening');
  assert.equal(passage.choices[0]?.destinationId, 'end');
});
