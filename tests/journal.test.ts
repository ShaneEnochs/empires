import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';

const passage = (id: string) => `*passage ${id}\n*title ${id}\nText.`;
const withJournal = (command: string) => `*var count 1\n*passage start\n*title Start\n${command}\nText.`;

test('every passage defaults to immutable Prologue chapter metadata', () => {
  const story = parseStory(`${passage('first')}\n${passage('second')}`);
  assert.deepEqual(story.passages.map(p => p.chapter), ['Prologue', 'Prologue']);
  assert.equal(Reflect.set(story.passages[0]!, 'chapter', 'Changed'), false);
});

test('chapters apply to following passages and repeated labels are permitted', () => {
  const story = parseStory(`${passage('first')}\n*chapter Chapter One\n${passage('second')}\n${passage('third')}\n*chapter Prologue\n${passage('fourth')}`);
  assert.deepEqual(story.passages.map(p => [p.id, p.chapter]), [
    ['first', 'Prologue'], ['second', 'Chapter One'], ['third', 'Chapter One'], ['fourth', 'Prologue'],
  ]);
});

test('chapter labels are literal nonempty text, without interpolation or HTML evaluation', () => {
  const label = '<b>${unknown}</b>  Chapter One';
  assert.equal(parseStory(`*chapter ${label}\n${passage('start')}`).passages[0]?.chapter, label);
});

for (const input of ['*chapter', '*chapter  \t', '*chapter One', '*chapter One\n\n', '*chapter One\n*chapter Two\n*passage start\n*title Start\nText.']) {
  test(`rejects empty or passage-less chapter declarations: ${JSON.stringify(input)}`, () => {
    assert.throws(() => parseStory(input), /Line 1: (\*chapter requires a nonempty label|Each \*chapter must be followed by at least one passage)/);
  });
}

test('a trailing chapter declaration is rejected after an otherwise complete story', () => {
  assert.throws(() => parseStory(`${passage('first')}\n*chapter Next`), /Line 4: Each \*chapter must be followed/);
});

test('variables must precede every chapter declaration and the first passage', () => {
  assert.equal(parseStory(`*var count 0\n*chapter One\n${passage('start')}`).initialVariables.count, 0);
  for (const input of [
    `*chapter One\n*var count 0\n${passage('start')}`,
    `${passage('first')}\n*chapter Next\n*var count 0\n${passage('second')}`,
  ]) {
    assert.throws(() => parseStory(input), /\*var declarations must precede the first passage and all chapter declarations/);
  }
});

for (const incomplete of [
  '*passage first',
  '*passage first\n*title First',
  `${passage('first')}\n*choice`,
  '*var count 0\n*passage first\n*title First\n*show_if count == 0',
  '*var count 0\n*passage first\n*title First\n*show_if count == 0\nOnly conditional.',
]) {
  test(`chapter cannot finish an incomplete preceding passage: ${JSON.stringify(incomplete)}`, () => {
    assert.throws(() => parseStory(`${incomplete}\n*chapter Next\n${passage('second')}`), /passage "first":/);
  });
}

test('content between a chapter and its next passage is rejected', () => {
  for (const content of ['Orphan prose.', '*title Orphan', '*journal orphan "Text"']) {
    assert.throws(() => parseStory(`*chapter Next\n${content}\n${passage('start')}`));
  }
});

test('a chapter can close a valid terminal, choice, or Continue passage without duplicating it', () => {
  for (const action of ['', '\n*choice\n#Next -> second', '\n*continue second']) {
    const story = parseStory(`${passage('first')}${action}\n*chapter Next\n${passage('second')}`);
    assert.deepEqual(story.passages.map(p => p.id), ['first', 'second']);
    assert.equal(story.passages[1]?.chapter, 'Next');
  }
});

test('parses journal effects with stable IDs, raw templates and existing JSON string escapes', () => {
  const story = parseStory(withJournal(String.raw`*journal event_1 "Count: ${'${count}'}. \"Quoted\" \\ \n \u2665"`));
  assert.deepEqual(story.passages[0]?.effects, [
    { kind: 'journal', id: 'event_1', text: 'Count: ${count}. "Quoted" \\ \n ♥' },
  ]);
  assert.equal(Reflect.set(story.passages[0]!.effects[0]!, 'text', 'Changed'), false);
});

for (const command of [
  '*journal', '*journal event', '*journal 1event "Text"', '*journal Event "Text"', '*journal bad.id "Text"',
  '*journal event 1', '*journal event true', '*journal event null', '*journal event []', '*journal event {}',
  '*journal event Text', "*journal event 'Text'", '*journal event "unclosed', '*journal event "ok" trailing',
  '*journal event "bad\\x"', '*journal event "${missing}"', '*journal event "${count"', '*journal event "${count + 1}"',
]) {
  test(`rejects malformed journal commands and interpolation: ${command}`, () => {
    assert.throws(() => parseStory(withJournal(command)), /Line 4, passage "start":/);
  });
}

test('event IDs are unique throughout the story, including unreachable passages and other chapters', () => {
  assert.throws(() => parseStory(withJournal('*journal event "First"\n*journal event "Second"')), /Duplicate journal event ID "event"/);
  const text = `${withJournal('*journal event "First"')}\n*chapter Other\n*passage unreachable\n*title Other\n*journal event "Different text"\nText.`;
  assert.throws(() => parseStory(text), /passage "unreachable": Duplicate journal event ID "event"/);
});

test('distinct events may share text, and IDs may match a passage or variable name', () => {
  const story = parseStory(withJournal('*journal count "Same"\n*journal start "Same"\n*journal constructor "Same"'));
  assert.deepEqual(new Game(story).state.journal.map(e => e.id), ['count', 'start', 'constructor']);
});

test('empty strings remain valid journal literals', () => {
  assert.equal(new Game(parseStory(withJournal('*journal empty ""'))).state.journal[0]?.text, '');
});

test('journal commands obey entry-effect placement and cannot be conditional', () => {
  const journal = '*journal event "Text"';
  for (const text of [
    `${journal}\n${passage('start')}`,
    `*passage start\n${journal}\n*title Start\nText.`,
    `${passage('start')}\n${journal}`,
    `${passage('start')}\n*choice\n#Again -> start\n${journal}`,
    `${passage('start')}\n*continue start\n${journal}`,
    `*var count 0\n*passage start\n*title Start\n*show_if count == 0\n${journal}\nText.`,
    `*var count 0\n*passage start\n*title Start\nAlways.\n\n*show_if count == 0\nConditional.\n\n${journal}`,
  ]) {
    assert.throws(() => parseStory(text));
  }
});

test('invalid late journal text prevents game initialization', () => {
  let game: Game | undefined;
  assert.throws(() => {
    game = new Game(parseStory(`${passage('start')}\n*passage unreachable\n*title Other\n*journal event "\${unknown}"\nText.`));
  }, /Undeclared variable "unknown"/);
  assert.equal(game, undefined);
});

test('new games start from an empty journal, then initial entry records effects normally', () => {
  const empty = new Game(parseStory(passage('start')));
  assert.deepEqual(empty.state.journal, []);
  const recorded = new Game(parseStory(withJournal('*journal event "Count: ${count}."')));
  assert.deepEqual(recorded.state.journal, [{ id: 'event', chapter: 'Prologue', text: 'Count: 1.' }]);
});

test('journal interpolation uses candidate variables at each point in effect source order', () => {
  const story = parseStory(withJournal('*add count 1\n*journal first "Count ${count}"\n*set count 20\n*journal second "Count ${count}"\n*add count 1'));
  const game = new Game(story);
  assert.deepEqual(game.state.journal, [
    { id: 'first', chapter: 'Prologue', text: 'Count 2' },
    { id: 'second', chapter: 'Prologue', text: 'Count 20' },
  ]);
  assert.equal(game.state.variables.count, 21);
  assert.equal(story.passages[0]?.effects[1]?.kind, 'journal');
});

const route = `*var count 0
*chapter First
*passage start
*title Start
Start.
*continue later
*chapter Second
*passage later
*title Later
*add count 1
*journal later_event "Later count \${count}"
Later.
*continue earlier
*chapter First
*passage earlier
*title Earlier
*add count 1
*journal earlier_event "Earlier count \${count}"
Earlier.
*continue later`;

test('chapters are static passage metadata and events keep their first-recorded text/order on re-entry', () => {
  const game = new Game(parseStory(route));
  game.navigate('later');
  game.navigate('earlier');
  const before = game.state;
  game.navigate('later');
  assert.equal(game.state.variables.count, 3);
  assert.deepEqual(game.state.journal, [
    { id: 'later_event', chapter: 'Second', text: 'Later count 1' },
    { id: 'earlier_event', chapter: 'First', text: 'Earlier count 2' },
  ]);
  assert.notEqual(game.state.journal, before.journal);
  assert.deepEqual(before.journal, game.state.journal);
});

test('previous journal states stay unchanged while new entries append to independent arrays', () => {
  const game = new Game(parseStory(route));
  const initial = game.state;
  game.navigate('later');
  const firstEvent = game.state;
  game.navigate('earlier');
  assert.deepEqual(initial.journal, []);
  assert.equal(firstEvent.journal.length, 1);
  assert.equal(game.state.journal.length, 2);
  assert.notEqual(firstEvent.journal, game.state.journal);
  assert.equal(firstEvent.journal[0], game.state.journal[0]); // Sharing frozen entries is safe.
  assert.throws(() => Array.prototype.push.call(game.state.journal, { id: 'fake', chapter: 'Fake', text: 'Fake' }), TypeError);
  assert.equal(Reflect.set(game.state.journal[0]!, 'text', 'Changed'), false);
  assert.equal(Reflect.set(game.state.journal[0]!, 'chapter', 'Changed'), false);
});

test('independent game instances cannot share mutable journal progress', () => {
  const story = parseStory(route);
  const first = new Game(story);
  const second = new Game(story);
  first.navigate('later');
  assert.equal(first.state.journal.length, 1);
  assert.deepEqual(second.state.journal, []);
  assert.notEqual(first.state.journal, second.state.journal);
  second.navigate('later');
  assert.deepEqual(first.state, second.state);
  assert.notEqual(first.state.journal[0], second.state.journal[0]);
});

test('reading journal, choices, paragraphs and interpolation never records new entries', () => {
  const game = new Game(parseStory(withJournal('*journal event "Count ${count}"')));
  const before = game.state;
  for (let i = 0; i < 3; i++) {
    assert.equal(game.state.journal[0]?.text, 'Count 1');
    assert.deepEqual(game.availableChoices, []);
    assert.deepEqual(game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables)), ['Text.']);
    assert.equal(game.state, before);
  }
});

const failedRoute = (effects: string) => `*var huge 1e308\n*var count 0\n*passage start\n*title Start\n*journal initial "Initial"\nStart.\n*choice\n#Risk -> risk\n#Prepare -> prepare\n*passage risk\n*title Risk\n${effects}\nRisk.\n*passage prepare\n*title Prepare\n*set huge 0\nPrepared.\n*continue start`;

for (const effects of [
  '*journal risk "Risk count ${count}"\n*add huge 1e308',
  '*add count 1\n*journal risk "Risk count ${count}"\n*journal another "Another"\n*add huge 1e308',
  '*add huge 1e308\n*journal risk "Risk count ${count}"',
]) {
  test(`journal effects roll back with the entire failed transition: ${effects}`, () => {
    const game = new Game(parseStory(failedRoute(effects)));
    const before = game.state;
    assert.throws(() => game.navigate('risk'), /non-finite/);
    assert.equal(game.state, before);
    assert.deepEqual(game.state.journal, [{ id: 'initial', chapter: 'Prologue', text: 'Initial' }]);
    assert.equal(game.state.variables.count, 0);
  });
}

test('a failed transition can be retried successfully after a legitimate state change', () => {
  const effects = '*add count 1\n*journal risk "Risk count ${count}"\n*add huge 1e308';
  const game = new Game(parseStory(failedRoute(effects)));
  assert.throws(() => game.navigate('risk'), /non-finite/);
  game.navigate('prepare');
  game.navigate('start');
  assert.equal(game.state.journal.length, 1);
  game.navigate('risk');
  assert.deepEqual(game.state.journal.map(e => e.text), ['Initial', 'Risk count 1']);
  assert.equal(game.state.variables.huge, 1e308);
});

test('rejected navigation, including unavailable choices, leaves the journal unchanged', () => {
  const source = `${withJournal('*journal initial "Initial"')}\n*choice\n#Risk -> other [if count > 100]\n#Stay -> start\n*passage other\n*title Other\n*journal other "Other"\nText.`;
  const game = new Game(parseStory(source));
  const before = game.state;
  assert.throws(() => game.navigate('missing'), /has no action/);
  assert.throws(() => game.navigate('other'), /has no action/);
  assert.equal(game.state, before);
});

test('failed initial journal effects expose no partially initialized game', () => {
  const story = parseStory('*var huge 1e308\n*passage start\n*title Start\n*journal first "First"\n*journal second "Second"\n*add huge 1e308\nText.');
  let game: Game | undefined;
  assert.throws(() => { game = new Game(story); }, /non-finite/);
  assert.equal(game, undefined);
});

test('journal interpolation is single-pass and preserves HTML-like text as data', () => {
  const html = '<img src=x onerror="throw 1">${missing}<script>throw 1</script>';
  const source = `*var name ${JSON.stringify(html)}\n*passage start\n*title Start\n*journal event "Welcome \${name}"\nText.`;
  const game = new Game(parseStory(source));
  assert.equal(game.state.journal[0]?.text, `Welcome ${html}`);
  assert.deepEqual(JSON.parse(JSON.stringify(game.state)), game.state);
});

test('the example retains both routes with different chapter-organized event histories', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  const messenger = new Game(story);
  messenger.navigate('messenger');
  messenger.navigate('council');
  assert.deepEqual(messenger.state.journal.map(e => [e.id, e.chapter]), [
    ['arrived_city', 'Prologue'], ['met_messenger', 'Prologue'], ['met_council', 'Chapter One'],
  ]);
  assert.equal(messenger.state.journal[2]?.text, 'You reached the council with influence 2.5.');
  const direct = new Game(story);
  direct.navigate('council');
  assert.deepEqual(direct.state.journal.map(e => e.id), ['arrived_city', 'met_council']);
  assert.equal(direct.state.journal[1]?.text, 'You reached the council with influence 0.5.');
});
