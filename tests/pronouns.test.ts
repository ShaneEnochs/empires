import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';
import { GameSession } from '../src/session';
import { readFileSync } from 'node:fs';
const names = ['pronouns_subject', 'pronouns_object', 'pronouns_possessive', 'pronouns_possessive_pronoun', 'pronouns_reflexive'];
const tokens = ['they', 'them', 'their', 'theirs', 'themself'];
const text = tokens.map(token => `{${token}} {${token[0]!.toUpperCase() + token.slice(1)}}`).join(' / ');
const values = (set: string[]) => Object.fromEntries(names.map((name, i) => [name, set[i]!]));

for (const set of [['he','him','his','his','himself'], ['she','her','her','hers','herself'],
  ['they','them','their','theirs','themself'], ['xe','xem','xyr','xyrs','xemself']]) {
  test('all five tokens and capitalized forms resolve ' + set[0], () => {
    assert.equal(interpolate(text, values(set)), set.map(value => value + ' ' + value[0]!.toUpperCase() + value.slice(1)).join(' / '));
  });
}
for (const [index, token] of tokens.entries()) {
  for (const invalid of [undefined, 4, true]) test(`token ${token} rejects ${invalid}`, () => {
    const variables: Record<string, string | number | boolean> = invalid === undefined ? {} : { [names[index]!]: invalid };
    assert.throws(() => interpolate(`{${token}}`, variables), new RegExp(names[index]!));
    for (const content of [`{${token}}`, `*journal event "{${token}}"\nProse.`]) {
      const declaration = invalid === undefined ? '' : `*var ${names[index]} ${invalid}\n`;
      assert.throws(() => parseStory(declaration + '*passage start\n*title Start\n' + content), new RegExp(names[index]!));
    }
  });
}

test('ordinary interpolation, literal braces and inserted token-looking values remain single-pass text', () => {
  const variables = { ...values(['he','him','his','his','himself']), name: '{they} ${other}', other: 'Other', they: 'ordinary', pronouns_object: '${name} <b>custom</b>' };
  assert.equal(interpolate('${name} {they} {them} ${they} {unknown} {THEY} {} {lord}', variables),
    '{they} ${other} he ${name} <b>custom</b> ordinary {unknown} {THEY} {} {lord}');
  assert.equal(interpolate('{literal braces', {}), '{literal braces');
  assert.throws(() => interpolate('${missing}', variables), /Undeclared variable/);
  assert.throws(() => interpolate('${name', variables), /Unclosed/);
});

test('journal resolves at recording; progress and resume preserve text without replaying effects', () => {
  const declarations = names.map((name, i) => `*var ${name} "${['they','them','their','theirs','themself'][i]}"`).join('\n');
  const story = parseStory(declarations + '\n*var count 0\n*passage start\n*title Start\nBegin.\n*continue chosen\n'
    + '*passage chosen\n*title Chosen\n*set pronouns_subject "she"\n*add count 1\n*journal chosen "{They} kept {their} promise."\n{They} wait.\n*continue end\n'
    + '*passage end\n*title End\n*set pronouns_subject "xe"\nEnd.');
  let raw: string | null = null; let writes = 0;
  const storage = { getItem: () => raw, setItem: (_key: string, text: string) => { raw = text; writes++; } };
  const session = new GameSession(story, storage); session.newGame(() => true); session.navigate('chosen');
  const state = session.game!.state;
  assert.equal(state.journal[0]!.text, 'She kept their promise.');
  const resumed = new GameSession(story, storage); assert.deepEqual(resumed.continueGame().state, state);
  assert.equal(writes, 2); assert.equal(resumed.game!.state.variables.count, 1);
  resumed.navigate('end');
  assert.equal(resumed.game!.state.journal[0]!.text, 'She kept their promise.');
  assert.equal(interpolate('{They}', resumed.game!.state.variables), 'Xe');
});

test('documented creation template parses and all presets reach the story', () => {
  const docs = readFileSync('docs/SCRIPTING.md', 'utf8');
  const template = docs.split('<!-- pronoun-template -->')[1]!.split('```text\n')[1]!.split('```')[0]!;
  const story = parseStory(template);
  for (const destination of ['he', 'she', 'they']) {
    const storage = { getItem: () => null, setItem: () => {} };
    const session = new GameSession(story, storage); session.newGame(() => true); session.navigate(destination); session.navigate('arrival');
    assert.equal(session.game!.state.variables.pronouns_subject, destination);
  }
});

test('editor highlighting recognizes exact pronoun tokens without inventing directives', () => {
  const grammar = JSON.parse(readFileSync('tools/vscode-empires/syntaxes/empires.tmLanguage.json', 'utf8'));
  const pattern = new RegExp(grammar.repository.interpolation.match, 'g');
  const expected = tokens.flatMap(token => [`{${token}}`, `{${token[0]!.toUpperCase() + token.slice(1)}}`]);
  assert.deepEqual(text.match(pattern), expected);
  const udl = readFileSync('tools/notepadpp/Empires-udl.xml', 'utf8');
  assert.deepEqual(udl.match(/<Keywords name="Keywords3">([^<]+)</)![1]!.split(' ').sort(), expected.sort());
  assert.equal('{lord} {THEY}'.match(pattern), null);
});
