import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { validateTextInput } from '../src/input';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';
import type { GameState } from '../src/types';

const nameTemplate = '$' + '{name}';
const declarations = '*var name "Unknown"\n*var other "Keep"\n*var count 0\n';
const header = '*passage choose_name\n*title Your Name\nWhat is your name?';
const command = '*input_text name "Preferred name" -> introduction';
const introduction = '*passage introduction\n*title Introduction\nWelcome, ' + nameTemplate + '.';
const source = (effects = '', ending = '') => declarations + header + '\n' + command
  + '\n*passage introduction\n*title Introduction\n' + effects + '\nWelcome, ' + nameTemplate + '.\n' + ending;

test('parses one immutable, JSON-serializable text input action', () => {
  const story = parseStory(source());
  assert.deepEqual(story.passages[0]?.textInput, { variable: 'name', label: 'Preferred name', destinationId: 'introduction' });
  assert.deepEqual(story.passages[0]?.choices, []);
  assert.equal(story.passages[0]?.continueTo, undefined);
  assert.ok(Object.isFrozen(story.passages[0]?.textInput));
  assert.equal(Reflect.set(story.passages[0]!.textInput!, 'destinationId', 'other'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(story)), story);
});

test('input labels decode JSON escapes, allow arrows/brackets, and never interpolate', () => {
  const label = 'Your "name"\\alias\n♥ -> [if x] $' + '{unknown}';
  const story = parseStory(declarations + header + '\n*input_text name ' + JSON.stringify(label)
    + ' -> introduction\n' + introduction);
  assert.equal(story.passages[0]?.textInput?.label, label);
});

test('supports declared string IDs including constructor; inherited names remain undeclared', () => {
  const story = parseStory('*var constructor "Unknown"\n' + header
    + '\n*input_text constructor "Name" -> introduction\n*passage introduction\n*title Introduction\nDone.');
  const game = new Game(story);
  game.submitText('Eleanor');
  assert.equal(game.state.variables.constructor, 'Eleanor');
  assert.throws(() => parseStory(source().replace(command, '*input_text constructor "Name" -> introduction')),
    /Undeclared variable "constructor"/);
});

test('input may follow entry effects and complete conditional prose but is never conditional itself', () => {
  const text = declarations + '*passage choose_name\n*title Name\n*add count 1\nAlways.\n\n'
    + '*show_if count == 1\nConditional prose.\n' + command + '\n*chapter Next\n' + introduction;
  const game = new Game(parseStory(text));
  assert.equal(game.visibleParagraphs.length, 2);
  assert.equal(game.state.variables.name, 'Unknown');
  game.submitText('Eleanor');
  assert.equal(game.passage.chapter, 'Next');
});

for (const invalid of [
  '*input_text', '*input_text name', '*input_text name "Name"',
  '*input_text name Name -> introduction', "*input_text name 'Name' -> introduction",
  '*input_text name "" -> introduction', '*input_text name "  " -> introduction',
  '*input_text name "\\n\\t" -> introduction', '*input_text name "bad\\x" -> introduction',
  '*input_text name "unclosed -> introduction', '*input_text name "Name" introduction',
  '*input_text name "Name" ->', '*input_text name "Name" -> Upper',
  '*input_text name "Name" -> 1target', '*input_text name "Name" -> two words',
  '*input_text name "Name" -> introduction -> introduction',
  '*input_text name "Name" -> introduction [if count == 0]',
  '*input_text Name "Name" -> introduction', '*input_text 1name "Name" -> introduction',
  '*input_text missing "Name" -> introduction', '*input_text count "Name" -> introduction',
  '*input_text other name "Names" -> introduction',
]) {
  test('rejects invalid input directives with source context: ' + invalid, () => {
    assert.throws(() => parseStory(declarations + header + '\n' + invalid + '\n' + introduction),
      /Line 7, passage "choose_name":/);
  });
}

test('input rejects boolean variables, missing destinations, and unreachable invalid references', () => {
  assert.throws(() => parseStory('*var flag false\n' + header
    + '\n*input_text flag "Name" -> introduction\n' + introduction), /requires a declared string variable/);
  assert.throws(() => parseStory(source().replace(command, '*input_text name "Name" -> missing')),
    /Line 7, passage "choose_name": Missing destination "missing"/);
  for (const invalid of [
    '*input_text missing "Name" -> introduction', '*input_text count "Name" -> introduction',
    '*input_text name "" -> introduction', '*input_text name "Name" -> missing',
  ]) {
    assert.throws(() => parseStory(declarations + introduction + '\n' + header + '\n' + invalid),
      /passage "choose_name":/);
  }
});

test('input cannot precede a passage, title, or narrative, or follow choices/Continue', () => {
  for (const body of [
    command + '\n' + header,
    '*passage choose_name\n' + command + '\n*title Name\nText.',
    '*passage choose_name\n*title Name\n' + command,
    '*passage choose_name\n*title Name\n*add count 1\n' + command,
    header + '\n*choice\n#Go -> introduction\n' + command,
    header + '\n*continue introduction\n' + command,
    header + '\n\n*show_if count == 0\n' + command,
  ]) {
    assert.throws(() => parseStory(declarations + body + '\n' + introduction), /Line \d+(, passage "choose_name")?:/);
  }
});

for (const following of [
  command, '*choice\n#Go -> introduction', '*continue introduction',
  'More narrative.', '#Go -> introduction', '*title Another',
  '*set name "Changed"', '*add count 1', '*journal later "Later"',
  '*grant_skill diplomacy', '*revoke_skill diplomacy', '*add_item token 1', '*remove_item token 1',
  '*show_if count == 0\nMore.',
]) {
  test('input concludes the passage and rejects: ' + following, () => {
    assert.throws(() => parseStory(source().replace(command, command + '\n\n' + following)),
      /passage "choose_name":/);
  });
}

for (const [value, expected] of [
  ['Alexander', 'Alexander'], ['Mary Jane', 'Mary Jane'], ["O'Brien", "O'Brien"],
  ['Mary-Jane', 'Mary-Jane'], [' Alexandra ', 'Alexandra'], ['  Mary  JANE  ', 'Mary  JANE'],
  ['\u00a0Éléonore\u00a0', 'Éléonore'], ['李小龍', '李小龍'], ['عائشة', 'عائشة'],
  ['👩‍🚀', '👩‍🚀'], ['A', 'A'], ['A'.repeat(80), 'A'.repeat(80)],
  ['😀'.repeat(80), '😀'.repeat(80)], ['  ' + '😀'.repeat(80) + '  ', '😀'.repeat(80)],
  ['e\u0301', 'e\u0301'], ['*set count 100', '*set count 100'],
] as const) {
  test('normalizes valid player text without interpretation: ' + JSON.stringify(value), () => {
    assert.equal(validateTextInput(value), expected);
    const game = new Game(parseStory(source()));
    game.submitText(value);
    assert.equal(game.state.variables.name, expected);
    assert.equal(game.state.variables.other, 'Keep');
    assert.equal(game.state.variables.count, 0);
    assert.equal(game.state.passageId, 'introduction');
    assert.deepEqual(JSON.parse(JSON.stringify(game.state)), game.state);
  });
}

for (const [label, value] of [
  ['undefined', undefined], ['null', null], ['number', 42], ['boolean', true],
  ['object', {}], ['array', ['Name']], ['boxed string', new String('Name')], ['symbol', Symbol('Name')],
] as const) {
  test('rejects non-string input without coercion: ' + label, () => {
    assert.throws(() => validateTextInput(value), /must be a string/);
    const game = new Game(parseStory(source()));
    const before = game.state;
    assert.throws(() => game.submitText(value), /must be a string/);
    assert.equal(game.state, before);
  });
}

for (const value of ['', '   ', '\u00a0\ufeff', 'A'.repeat(81), '😀'.repeat(81), 'e\u0301'.repeat(41)]) {
  test('rejects empty/overlong text while preserving the complete state: ' + JSON.stringify(value), () => {
    const game = new Game(parseStory(source()));
    const before = game.state;
    assert.throws(() => validateTextInput(value), /1 and 80 characters/);
    assert.throws(() => game.submitText(value), /1 and 80 characters/);
    assert.equal(game.state, before);
  });
}

test('rejects all C0/C1 controls and Unicode line separators, including before trimming', () => {
  const game = new Game(parseStory(source()));
  const before = game.state;
  const controls = [
    ...Array.from({ length: 32 }, (_, i) => i), ...Array.from({ length: 33 }, (_, i) => 0x7f + i),
    0x2028, 0x2029,
  ];
  for (const point of controls) {
    const control = String.fromCodePoint(point);
    for (const value of ['A' + control + 'B', control + 'Name', 'Name' + control]) {
      assert.throws(() => validateTextInput(value), /line breaks or control characters/);
      assert.throws(() => game.submitText(value), /line breaks or control characters/);
      assert.equal(game.state, before);
    }
  }
});

test('ordinary navigation cannot bypass input or select another destination', () => {
  const game = new Game(parseStory(source()));
  const before = game.state;
  for (const destination of ['introduction', 'choose_name', 'missing']) {
    assert.throws(() => game.navigate(destination), /has no action/);
    assert.equal(game.state, before);
  }
  assert.deepEqual(game.availableChoices, []);
  assert.equal(game.passage.continueTo, undefined);
});

test('submitText rejects choices, Continue, and terminal passages without changing state', () => {
  for (const suffix of ['', '\n*continue start', '\n*choice\n#Again -> start']) {
    const game = new Game(parseStory('*passage start\n*title Start\nText.' + suffix));
    const before = game.state;
    assert.throws(() => game.submitText('Eleanor'), /does not offer text input/);
    assert.equal(game.state, before);
  }
});

const effects = '*add count 1\n*journal introduced "The hero is named ' + nameTemplate + '."';
const conditions = '\n*show_if name == "Eleanor"\nRecognized.\n*choice\n'
  + '#Recognized -> recognized [if name == "Eleanor"]\n#Fallback -> fallback\n'
  + '*passage recognized\n*title Recognized\nKnown.\n*passage fallback\n*title Fallback\nUnknown.';

test('destination journal, prose, conditions, and choices receive the normalized submitted value', () => {
  const game = new Game(parseStory(source(effects, conditions)));
  const previous = game.state;
  game.submitText(' Eleanor ');
  assert.equal(game.state.variables.count, 1);
  assert.deepEqual(game.state.journal.map(e => e.text), ['The hero is named Eleanor.']);
  assert.deepEqual(game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables)), ['Welcome, Eleanor.', 'Recognized.']);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Recognized', 'Fallback']);
  assert.equal(previous.variables.name, 'Unknown');
  assert.equal(previous.passageId, 'choose_name');
  assert.equal(Reflect.set(previous.variables, 'name', 'Changed'), false);
  assert.equal(Reflect.set(game.state.variables, 'name', 'Changed'), false);
  const other = new Game(parseStory(source(effects, conditions)));
  other.submitText('Someone else');
  assert.deepEqual(other.availableChoices.map(c => c.label), ['Fallback']);
  assert.throws(() => other.navigate('recognized'), /has no action/);
});

test('input is plain data even when it looks like HTML, interpolation, or code', () => {
  const value = '<img src=x onerror=alert(1)> $' + '{count} *add count 100';
  const game = new Game(parseStory(source(effects)));
  game.submitText(value);
  assert.equal(game.state.variables.name, value);
  assert.equal(game.state.variables.count, 1);
  assert.equal(game.state.journal[0]?.text, 'The hero is named ' + value + '.');
  assert.equal(interpolate(game.passage.paragraphs[0]!.text, game.state.variables), 'Welcome, ' + value + '.');
});

test('entry effects may replace submitted text in source order like any other string variable', () => {
  const game = new Game(parseStory(source(effects + '\n*set name "Narrator"')));
  game.submitText('Eleanor');
  assert.equal(game.state.journal[0]?.text, 'The hero is named Eleanor.');
  assert.equal(game.state.variables.name, 'Narrator');
});

test('reading input and rerendering prose never submit text or rerun entry effects', () => {
  const game = new Game(parseStory(source(effects)));
  const before = game.state;
  for (let i = 0; i < 3; i++) {
    game.passage.textInput; game.availableChoices;
    game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables));
    assert.equal(game.state, before);
  }
  game.submitText('Eleanor');
  const entered = game.state;
  for (let i = 0; i < 3; i++) {
    game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables));
    assert.equal(game.state, entered);
    assert.equal(game.state.variables.count, 1);
  }
});

test('later visits use ordinary entry rules and returning to an input passage permits a new submission', () => {
  const ending = '*continue bridge\n*passage bridge\n*title Bridge\nText.\n*choice\n'
    + '#Visit introduction -> introduction\n#Rename -> choose_name';
  const game = new Game(parseStory(source(effects, ending)));
  game.submitText('Eleanor');
  game.navigate('bridge'); game.navigate('introduction');
  assert.equal(game.state.variables.count, 2);
  assert.equal(game.state.variables.name, 'Eleanor');
  assert.equal(game.state.journal.length, 1);
  game.navigate('bridge'); game.navigate('choose_name');
  assert.equal(game.state.variables.name, 'Eleanor');
  game.submitText('Alexandra');
  assert.equal(game.state.variables.count, 3);
  assert.equal(game.state.variables.name, 'Alexandra');
  assert.equal(game.state.journal[0]?.text, 'The hero is named Eleanor.');
});

test('a self-destination input is an explicit entry and applies its effects once per submission', () => {
  const game = new Game(parseStory(declarations + '*passage start\n*title Start\n*add count 1\nText.\n*input_text name "Name" -> start'));
  game.submitText('Eleanor');
  assert.equal(game.state.variables.count, 2);
  assert.equal(game.state.variables.name, 'Eleanor');
  assert.throws(() => game.navigate('start'), /has no action/);
});

test('independent games accept independent inputs and equal inputs produce equal states', () => {
  const story = parseStory(source(effects));
  const first = new Game(story);
  const second = new Game(story);
  const third = new Game(story);
  first.submitText(' Eleanor ');
  assert.equal(second.state.variables.name, 'Unknown');
  second.submitText('Alexandra');
  third.submitText('Eleanor');
  assert.equal(first.state.variables.name, 'Eleanor');
  assert.equal(second.state.variables.name, 'Alexandra');
  assert.deepEqual(first.state, third.state);
  assert.notEqual(first.state.variables, third.state.variables);
  assert.equal(story.initialVariables.name, 'Unknown');
});

const risk = (failure: string) => [
  '*var name "Unknown"', '*var count 0', '*var huge 1e308',
  '*skill diplomacy "Diplomacy"', '*skill composure "Composure"', '*item token "Token"',
  '*passage choose_name', '*title Name', '*grant_skill diplomacy', '*add_item token 1',
  '*journal before "Before."', 'What is your name?', command,
  '*passage introduction', '*title Introduction', '*add count 1', '*revoke_skill diplomacy',
  '*grant_skill composure', '*journal introduced "The hero is named ' + nameTemplate + '."',
  failure, 'Welcome, ' + nameTemplate + '.',
].join('\n');

for (const [failure, error] of [
  ['*add_item token 1\n*remove_item token 3', /insufficient inventory/],
  ['*add_item token 2\n*remove_item token 1\n*add huge 1e308', /non-finite/],
  ['*remove_item token 1\n*add_item token 9007199254740991\n*add_item token 1', /safe integer/],
] as const) {
  test('failed destination entry rolls back submitted text and every mixed effect: ' + failure, () => {
    const game = new Game(parseStory(risk(failure)));
    const before = game.state;
    const serialized = JSON.stringify(before);
    for (const value of ['Eleanor', 'Alexandra', 'Retry']) {
      assert.throws(() => game.submitText(value), error);
      assert.equal(game.state, before);
      assert.equal(JSON.stringify(game.state), serialized);
    }
    assert.deepEqual(before.skills, ['diplomacy']);
    assert.deepEqual(before.inventory, { token: 1 });
    assert.equal(before.variables.name, 'Unknown');
    assert.equal(before.journal.length, 1);
    assert.equal(game.passage.id, 'choose_name');
  });
}

test('the same game accepts a corrected valid submission after validation failure', () => {
  const game = new Game(parseStory(source(effects)));
  assert.throws(() => game.submitText('   '), /1 and 80/);
  game.submitText('Eleanor');
  assert.equal(game.state.passageId, 'introduction');
  assert.equal(game.state.variables.count, 1);
  assert.equal(game.state.journal.length, 1);
});

test('retry after a transient entry failure commits effects exactly once', t => {
  const game = new Game(parseStory(risk('*add_item token 1')));
  const internal = game as unknown as { enterPassage(input: GameState): GameState };
  const enter = internal.enterPassage.bind(game);
  let failOnce = true;
  // Inject a transient failure after preparing real effects, before the public action commits.
  t.mock.method(internal, 'enterPassage', (input: GameState) => {
    const candidate = enter(input);
    if (failOnce) { failOnce = false; throw new Error('Simulated entry interruption.'); }
    return candidate;
  });
  const before = game.state;
  assert.throws(() => game.submitText('First attempt'), /Simulated entry interruption/);
  assert.equal(game.state, before);
  game.submitText('Eleanor');
  assert.equal(game.state.variables.name, 'Eleanor');
  assert.equal(game.state.variables.count, 1);
  assert.deepEqual(game.state.skills, ['composure']);
  assert.deepEqual(game.state.inventory, { token: 2 });
  assert.deepEqual(game.state.journal.map(e => e.text), ['Before.', 'The hero is named Eleanor.']);
});

test('the optional example creates names/backgrounds using existing variables and effects', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  for (const background of ['noble_origin', 'soldier_origin']) {
    const game = new Game(story);
    game.navigate('choose_name');
    assert.equal(game.state.variables.character_name, 'Alexander');
    assert.throws(() => game.navigate('choose_background'), /has no action/);
    game.submitText(' Eleanor ');
    assert.equal(game.state.variables.character_name, 'Eleanor');
    assert.equal(game.state.journal[1]?.text, 'You introduced yourself as Eleanor.');
    game.navigate(background);
    game.navigate('council');
    assert.equal(game.state.variables.character_name, 'Eleanor');
    assert.equal(game.state.variables.influence, background === 'noble_origin' ? 2.5 : 0.5);
    assert.equal(game.state.variables.honor, background === 'soldier_origin' ? 7 : 5);
    assert.equal(game.state.variables.loyal, background === 'soldier_origin');
    assert.deepEqual(game.state.skills, background === 'noble_origin' ? ['diplomacy'] : []);
    assert.deepEqual(game.state.inventory, { gold_coin: 5 });
    assert.deepEqual(game.state.journal.map(e => e.id), ['arrived_city', 'chose_name', background, 'met_council']);
    assert.equal(game.state.journal[0]?.text, 'Alexander reached the city with influence 1.');
  }
});
