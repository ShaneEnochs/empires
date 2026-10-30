import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';

const declarations = '*var influence 4\n*var loyal false\n*var faction "guild"\n*var name "Traveler"\n';
const header = '*passage start\n*title Start\n';
const source = (condition: string, prose = 'Conditional.') =>
  `${declarations}${header}Always.\n\n*show_if ${condition}\n${prose}`;

for (const [operator, value, expected] of [
  ['==', 4, true], ['==', 3, false], ['!=', 3, true], ['!=', 4, false],
  ['>', 3, true], ['>', 4, false], ['>=', 4, true], ['>=', 5, false],
  ['<', 5, true], ['<', 4, false], ['<=', 4, true], ['<=', 3, false],
] as const) {
  test(`narrative supports influence ${operator} ${value}: ${expected}`, () => {
    const story = parseStory(source(`influence ${operator} ${value}`));
    assert.deepEqual(story.passages[0]?.paragraphs[1], {
      text: 'Conditional.', condition: { variable: 'influence', operator, value },
    });
    const game = new Game(story);
    assert.deepEqual(game.visibleParagraphs.map(p => p.text), expected ? ['Always.', 'Conditional.'] : ['Always.']);
  });
}

for (const [expression, expected] of [
  ['influence > -0.5', true], ['influence <= -1.25', false],
  ['loyal == false', true], ['loyal != false', false],
  ['faction == "guild"', true], ['faction == "Guild"', false],
  ['faction != "other"', true], ['faction != "guild"', false],
] as const) {
  test(`narrative shares primitive comparison semantics: ${expression}`, () => {
    const game = new Game(parseStory(source(expression)));
    assert.equal(game.visibleParagraphs.length, expected ? 2 : 1);
  });
}

test('unconditional and conditional paragraphs use one uniform immutable representation', () => {
  const story = parseStory(`${declarations}${header}Before.\n\n*show_if influence >= 4\nFirst line.\nSecond line.\n\nAfter.\n\n*show_if loyal == false\nFinal conditional.`);
  assert.deepEqual(story.passages[0]?.paragraphs, [
    { text: 'Before.' },
    { text: 'First line. Second line.', condition: { variable: 'influence', operator: '>=', value: 4 } },
    { text: 'After.' },
    { text: 'Final conditional.', condition: { variable: 'loyal', operator: '==', value: false } },
  ]);
  assert.equal(new Game(story).visibleParagraphs.length, 4);
});

test('a blank line ends the condition and the following ordinary paragraph is unconditional', () => {
  const story = parseStory(source('influence > 100', 'Hidden.\nAnother hidden line.\n\nVisible afterward.'));
  assert.deepEqual(new Game(story).visibleParagraphs.map(p => p.text), ['Always.', 'Visible afterward.']);
  assert.equal(story.passages[0]?.paragraphs[2]?.condition, undefined);
});

test('the first paragraph can be conditional if an unconditional paragraph follows', () => {
  const story = parseStory(`${declarations}${header}*show_if loyal == true\nHidden first.\n\nAlways.`);
  assert.deepEqual(new Game(story).visibleParagraphs.map(p => p.text), ['Always.']);
});

test('conditional paragraphs can conclude at EOF, navigation, or the next passage', () => {
  const body = source('influence >= 4');
  assert.equal(parseStory(body).passages[0]?.paragraphs.length, 2);
  const next = '\n*passage next\n*title Next\nNext prose.';
  assert.equal(parseStory(body + next).passages[1]?.paragraphs[0]?.condition, undefined);
  const game = new Game(parseStory(`${body}\n*continue next${next}`));
  assert.equal(game.visibleParagraphs.length, 2);
  game.navigate('next');
  assert.deepEqual(game.visibleParagraphs, [{ text: 'Next prose.' }]);
});

test('line endings, indentation, and Markdown-like prose retain normal paragraph behavior', () => {
  for (const newline of ['\n', '\r\n', '\r']) {
    const story = parseStory(source('influence>=4', '  First.  \n  # Literal heading\n\nLast.').replaceAll('\n', newline));
    assert.deepEqual(new Game(story).visibleParagraphs.map(p => p.text), ['Always.', 'First. # Literal heading', 'Last.']);
  }
});

test('choice and narrative conditions share the same condition data and string literal rules', () => {
  const value = 'guild [if x] -> ] "quoted"\\path';
  const literal = JSON.stringify(value);
  const body = source(`faction == ${literal}`).replace('*var faction "guild"', `*var faction ${literal}`)
    + `\n*choice\n#Optional -> end [if faction == ${literal}]\n#Fallback -> end\n*passage end\n*title End\nDone.`;
  const story = parseStory(body);
  assert.deepEqual(story.passages[0]?.paragraphs[1]?.condition, story.passages[0]?.choices[0]?.condition);
  const game = new Game(story);
  assert.equal(game.visibleParagraphs.length, 2);
  assert.equal(game.availableChoices.length, 2);
});

for (const expression of [
  '', ' ', 'missing == 4', 'Influence == 4', 'influence', '>= 4', 'influence >=',
  'influence = 4', 'influence === 4', 'influence !== 4', 'influence <> 4',
  'influence >= other', 'influence + 1 >= 4', 'influence >= (4)', '(influence >= 4)',
  'influence >= 4 && loyal == false', 'influence >= 4 || loyal == false',
  'influence >= 4 influence < 10', '[if influence >= 4]', 'influence >= 4]',
  'influence == "4"', 'loyal == 0', 'loyal > false', 'faction < "guild"',
  'influence == NaN', 'influence == Infinity', 'influence >= 1e309',
  'influence == []', 'influence == {}', 'influence == null',
  "faction == 'guild'", 'faction == "unclosed',
]) {
  test(`rejects invalid narrative conditions with source context: ${JSON.stringify(expression)}`, () => {
    assert.throws(() => parseStory(source(expression)), /Line 9, passage "start":/);
  });
}

for (const following of ['', '\n', '\nLater.', '*choice', '*continue start', '*set influence 5', '*add influence 1', '*title Later', '*show_if loyal == false', '*passage other', '*if loyal == false', '*else']) {
  test(`*show_if must immediately precede prose, not ${JSON.stringify(following)}`, () => {
    const body = `${declarations}${header}Always.\n\n*show_if influence >= 4${following === '' ? '' : `\n${following}`}`;
    assert.throws(() => parseStory(body), /passage "start": \*show_if requires a narrative paragraph on the immediately following source line/);
  });
}

test('rejects show_if before the title or first passage', () => {
  assert.throws(() => parseStory(`${declarations}*show_if influence >= 4\nProse.\n${header}Always.`), /at a paragraph boundary after the title and effects, before navigation/);
  assert.throws(() => parseStory(`${declarations}*passage start\n*show_if influence >= 4\nProse.\n*title Start`), /passage "start": \*show_if must be at a paragraph boundary/);
});

test('rejects show_if between lines of any existing paragraph or inside/after navigation', () => {
  for (const body of [
    `${declarations}${header}First.\n*show_if influence >= 4\nSecond.`,
    source('influence >= 4', 'Conditional.\n*show_if loyal == false\nSecond conditional.'),
    `${declarations}${header}Always.\n*choice\n#Again -> start\n*show_if influence >= 4\nProse.`,
    `${declarations}${header}Always.\n*continue start\n*show_if influence >= 4\nProse.`,
  ]) {
    assert.throws(() => parseStory(body), /passage "start": \*show_if must be at a paragraph boundary/);
  }
});

test('entry effects cannot appear after conditional prose, including after a blank line', () => {
  for (const separator of ['\n', '\n\n']) {
    assert.throws(() => parseStory(source('influence >= 4', `Text.${separator}*add influence 1`)), /Effects must appear after \*title and before the first narrative paragraph/);
  }
});

test('rejects passages with only conditional prose even if every condition initially passes', () => {
  for (const condition of ['influence >= 4', 'loyal == true']) {
    assert.throws(() => parseStory(`${declarations}${header}*show_if ${condition}\nOnly conditional.`), /Line 5, passage "start": Passage requires at least one unconditional narrative paragraph/);
  }
});

test('validates interpolation even in hidden conditional paragraphs before any game initializes', () => {
  let game: Game | undefined;
  assert.throws(() => { game = new Game(parseStory(source('influence > 100', '${missing}'))); }, /Line 10, passage "start": Undeclared variable "missing"/);
  assert.equal(game, undefined);
});

test('visibility and interpolation read post-entry values without repeating effects or changing definitions', () => {
  const story = parseStory(source('influence >= 5', 'Influence: ${influence}.').replace('*title Start\n', '*title Start\n*add influence 1\n'));
  const game = new Game(story);
  const before = game.state;
  const authored = game.passage.paragraphs;
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables)), ['Always.', 'Influence: 5.']);
    assert.equal(game.state, before);
    assert.equal(game.passage.paragraphs, authored);
  }
  assert.equal(story.initialVariables.influence, 4);
  assert.equal(authored[1]?.text, 'Influence: ${influence}.');
});

test('re-entry updates narrative visibility and choice eligibility from the same committed state', () => {
  const text = source('influence >= 5').replace('*title Start\n', '*title Start\n*add influence 0.5\n')
    + '\n*choice\n#Reward -> reward [if influence >= 5]\n#Train -> train\n*passage train\n*title Train\nTraining.\n*continue start\n*passage reward\n*title Reward\nDone.';
  const game = new Game(parseStory(text));
  const before = game.state;
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['Always.']);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Train']);
  assert.throws(() => game.navigate('reward'), /has no action/);
  assert.equal(game.state, before);
  game.navigate('train');
  game.navigate('start');
  assert.equal(game.state.variables.influence, 5);
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['Always.', 'Conditional.']);
  assert.deepEqual(game.availableChoices.map(c => c.label), ['Reward', 'Train']);
  game.navigate('reward');
  assert.deepEqual(game.visibleParagraphs, [{ text: 'Done.' }]);
});

test('failed transitions cannot alter narrative visibility or partially apply effects', () => {
  const text = `*var huge 1e308\n${source('influence >= 5')}`
    + '\n*continue risk\n*passage risk\n*title Risk\n*add influence 1\n*add huge 1e308\nAlways.\n\n*show_if influence >= 5\nHidden risk.';
  const game = new Game(parseStory(text));
  const before = game.state;
  const visible = game.visibleParagraphs;
  assert.throws(() => game.navigate('risk'), /non-finite/);
  assert.equal(game.state, before);
  assert.deepEqual(game.visibleParagraphs, visible);
});

test('interpolated HTML-like strings remain literal and are substituted only once', () => {
  const html = '<img src=x onerror="throw 1">${missing}<script>throw 1</script>';
  const text = source('influence >= 4', '${name}').replace('*var name "Traveler"', `*var name ${JSON.stringify(html)}`);
  const game = new Game(parseStory(text));
  const before = game.state;
  assert.equal(interpolate(game.visibleParagraphs[1]!.text, game.state.variables), html);
  assert.equal(game.passage.paragraphs[1]?.text, '${name}');
  assert.equal(game.state, before);
});

test('paragraph records, conditions and visible arrays cannot be mutated by consumers', () => {
  const story = parseStory(source('influence >= 4'));
  const game = new Game(story);
  const authored = game.passage.paragraphs;
  const visible = game.visibleParagraphs;
  assert.equal(Reflect.set(authored[1]!, 'text', 'Changed'), false);
  assert.equal(Reflect.set(authored[1]!.condition!, 'value', 100), false);
  assert.equal(Reflect.set(visible, 0, { text: 'Changed' }), false);
  assert.throws(() => Array.prototype.pop.call(authored), TypeError);
  assert.throws(() => Array.prototype.pop.call(visible), TypeError);
  assert.deepEqual(JSON.parse(JSON.stringify(authored)), authored);
  assert.equal(game.visibleParagraphs.length, 2);
});

test('checkpoint and death roadmap commands remain unsupported', () => {
  for (const command of ['*checkpoint', '*death', '*undo', '*return_to_checkpoint']) {
    assert.throws(() => parseStory(`${declarations}${header}${command}\nAlways.`), /Unsupported directive/);
  }
});
