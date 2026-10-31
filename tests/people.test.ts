import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { cityGatePeople, provincialCrisisPeople, encounteredPeople, validatePeople } from '../src/people';
import { parseStory } from '../src/story';

const city = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
const crisis = parseStory(readFileSync(new URL('../examples/provincial-crisis.story', import.meta.url), 'utf8'));

test('both People catalogs validate against their own story and are deeply immutable', () => {
  for (const [story, definitions] of [[city, cityGatePeople], [crisis, provincialCrisisPeople]] as const) {
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
  assert.throws(() => validatePeople(city, provincialCrisisPeople), /unknown journal event/);
  assert.throws(() => validatePeople(crisis, cityGatePeople), /unknown journal event/);
});

test('invalid, duplicate, empty, and unknown-event People definitions fail before presentation', () => {
  const person = cityGatePeople[0]!;
  for (const invalid of [
    { ...person, id: 'Invalid ID' }, { ...person, name: ' ' }, { ...person, description: '' },
    { ...person, discoveryEvents: [] }, { ...person, discoveryEvents: ['missing_event'] },
    { ...person, discoveryEvents: ['met_messenger', 'missing_event'] },
  ]) assert.throws(() => validatePeople(city, [invalid]), /People reference/);
  assert.throws(() => validatePeople(city, [person, person]), /duplicate People reference/);
});

test('reading People uses only recorded IDs, preserves committed state, and follows recovery', () => {
  const game = new Game(city);
  assert.deepEqual(encounteredPeople(cityGatePeople, game.state), []);
  const state = game.state;
  const checkpoint = game.checkpoint;
  for (let read = 0; read < 3; read++) encounteredPeople(cityGatePeople, game.state);
  assert.equal(game.state, state);
  assert.equal(game.checkpoint, checkpoint);
  game.navigate('messenger');
  assert.deepEqual(encounteredPeople(cityGatePeople, game.state).map(person => person.id), ['messenger']);
  game.navigate('council');
  assert.deepEqual(encounteredPeople(cityGatePeople, game.state).map(person => person.id), ['messenger', 'council_clerk']);
  game.restoreCheckpoint();
  assert.deepEqual(encounteredPeople(cityGatePeople, game.state), []);
  assert.equal(game.checkpoint, checkpoint);
});

for (const [background, encounter] of [['river_background', 'copied_records'], ['clerk_background', 'sworn_testimony']]) {
  test('either recorded mill-clerk encounter reveals one reference: ' + encounter, () => {
    const game = new Game(crisis);
    game.navigate('background');
    game.navigate(background!);
    game.navigate('briefing');
    game.navigate('mill_yard');
    assert.equal(encounteredPeople(provincialCrisisPeople, game.state).some(person => person.id === 'mill_clerk'), false);
    game.navigate(encounter!);
    const before = game.state;
    assert.equal(encounteredPeople(provincialCrisisPeople, game.state).filter(person => person.id === 'mill_clerk').length, 1);
    assert.equal(game.state, before);
  });
}
