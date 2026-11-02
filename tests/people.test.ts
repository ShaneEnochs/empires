import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { encounteredPeople, validatePeople, parsePeople } from '../src/people';
import { centerVisitPeople, harborPracticePeople } from '../examples/people';
import { parseStory } from '../src/story';

const city = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
const crisis = parseStory(readFileSync(new URL('../examples/harbor-practice.story', import.meta.url), 'utf8'));

test('both People catalogs validate against their own story and are deeply immutable', () => {
  for (const [story, definitions] of [[city, centerVisitPeople], [crisis, harborPracticePeople]] as const) {
    const validated = validatePeople(story, definitions);
    assert.deepEqual(validated, definitions);
    assert.notEqual(validated, definitions);
    assert.ok(Object.isFrozen(definitions));
    for (const person of validated) {
      assert.ok(Object.isFrozen(person));
      assert.ok(Object.isFrozen(person.discoveryEvents));
      assert.equal(Reflect.set(person, 'name', 'Changed'), false);
      assert.equal(Reflect.set(person.discoveryEvents, '0', 'unknown'), false);
    }
  }
  assert.throws(() => validatePeople(city, harborPracticePeople), /unknown journal event/);
  assert.throws(() => validatePeople(crisis, centerVisitPeople), /unknown journal event/);
});

test('invalid, duplicate, empty, and unknown-event People definitions fail before presentation', () => {
  const person = centerVisitPeople[0]!;
  for (const invalid of [
    { ...person, id: 'Invalid ID' }, { ...person, name: ' ' }, { ...person, description: '' },
    { ...person, discoveryEvents: [] }, { ...person, discoveryEvents: ['missing_event'] },
    { ...person, discoveryEvents: ['met_messenger', 'missing_event'] },
  ]) assert.throws(() => validatePeople(city, [invalid]), /People reference/);
  assert.throws(() => validatePeople(city, [person, person]), /duplicate People reference/);
});

test('reading People uses only recorded IDs, preserves committed state, and follows recovery', () => {
  const game = new Game(city);
  assert.deepEqual(encounteredPeople(centerVisitPeople, game.state), []);
  const state = game.state;
  const checkpoint = game.checkpoint;
  for (let read = 0; read < 3; read++) encounteredPeople(centerVisitPeople, game.state);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
  game.navigate('messenger');
  assert.deepEqual(encounteredPeople(centerVisitPeople, game.state).map(person => person.id), ['messenger']);
  game.navigate('center');
  assert.deepEqual(encounteredPeople(centerVisitPeople, game.state).map(person => person.id), ['messenger', 'center_clerk']);
  game.restoreCheckpoint();
  assert.deepEqual(encounteredPeople(centerVisitPeople, game.state), []);
  assert.equal(game.checkpoint, checkpoint);
});

for (const [background, encounter] of [['river_background', 'copied_records'], ['clerk_background', 'sworn_testimony']]) {
  test('either recorded mill-clerk encounter reveals one reference: ' + encounter, () => {
    const game = new Game(crisis);
    game.navigate('background');
    game.navigate(background!);
    game.navigate('briefing');
    game.navigate('mill_yard');
    assert.equal(encounteredPeople(harborPracticePeople, game.state).some(person => person.id === 'mill_clerk'), false);
    game.navigate(encounter!);
    const before = game.state;
    assert.equal(encounteredPeople(harborPracticePeople, game.state).filter(person => person.id === 'mill_clerk').length, 1);
    assert.equal(game.state, before);
  });
}

test('People JSON rejects malformed shapes and freezes safe presentation records', () => {
  const person = centerVisitPeople[0]!;
  for (const value of [null, {}, 'people', [null], [7], [{ ...person, name: 5 }],
    [{ ...person, discoveryEvents: 'met_messenger' }], [{ ...person, discoveryEvents: [null] }]]) {
    assert.throws(() => parsePeople(value), /People/);
  }
  const parsed = parsePeople([{ ...person, description: '<b>Plain text</b>' }]);
  assert.equal(parsed[0]!.description, '<b>Plain text</b>');
  assert.ok(Object.isFrozen(parsed[0]!.discoveryEvents));
});
