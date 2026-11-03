import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { encounteredPeople, learnedPersonFacts, validatePeople, parsePeople } from '../src/people';
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

test('People facts validate event references, reject malformed records, and are deeply frozen', () => {
  const example = centerVisitPeople[0]!;
  const withFacts = parsePeople([{
    ...example,
    facts: [
      { text: 'A fact learned later.', discoveryEvents: ['met_messenger'] },
    ],
  }]);
  const validated = validatePeople(city, withFacts);
  const facts = validated[0]!.facts!;
  assert.equal(facts.length, 1);
  assert.ok(Object.isFrozen(facts));
  assert.ok(Object.isFrozen(facts[0]));
  assert.ok(Object.isFrozen(facts[0]!.discoveryEvents));
  assert.equal(Reflect.set(facts[0]!, 'text', 'tampered'), false);
  assert.equal(Reflect.set(facts[0]!.discoveryEvents, '0', 'tampered'), false);
  for (const bad of [
    [], null, ['a'], [{}],
    [{ text: '', discoveryEvents: ['met_messenger'] }],
    [{ text: 'Known', discoveryEvents: [] }],
    [{ text: 'Known', discoveryEvents: ['met_messenger', 'met_messenger'] }],
    [{ text: 'Known', discoveryEvents: ['Bad ID'] }],
    [
      { text: 'Duplicate', discoveryEvents: ['met_messenger'] },
      { text: 'Duplicate', discoveryEvents: ['met_messenger'] },
    ],
  ]) {
    assert.throws(() => parsePeople([{ ...example, facts: bad }]), /People reference/);
  }
  const invalidEvents = parsePeople([{
    ...example,
    facts: [{ text: 'Unknown lore', discoveryEvents: ['unknown_fact_event'] }],
  }]);
  assert.throws(() => validatePeople(city, invalidEvents), /unknown journal event/);
});

test('Lucia appears on introduction and learns facts only from visited scenes', () => {
  const publicStory = parseStory(readFileSync('content/aurelian-league.story', 'utf8'));
  const publicPeople = validatePeople(publicStory, parsePeople(
    JSON.parse(readFileSync('content/aurelian-league.people.json', 'utf8'))));
  const lucia = publicPeople.find(person => person.id === 'lucia')!;
  const game = new Game(publicStory);
  const recorded = () => learnedPersonFacts(lucia, game.state);
  game.navigate('ferry_windows');
  game.navigate('ferry_context');
  game.navigate('ferry_ad');
  game.advancePage();
  assert.deepEqual(encounteredPeople(publicPeople, game.state), []);
  game.navigate('name');
  assert.deepEqual(encounteredPeople(publicPeople, game.state).map(person => person.name), ['Lucia']);
  assert.equal(recorded().length, 1);
  assert.match(recorded()[0]!, /journalist/);
  assert.doesNotMatch(recorded().join(' '), /Floatzel|brother|wetlands|rank/);

  game.submitText('Ari');
  game.navigate('contact_no');
  game.navigate('pronouns');
  assert.equal(recorded().length, 2);
  assert.match(recorded().join(' '), /she\/her/);
  assert.doesNotMatch(recorded().join(' '), /exchanged phone numbers/);
  game.navigate('they');
  game.navigate('lucia_chat');
  assert.equal(recorded().length, 5);
  assert.match(recorded().join(' '), /Floatzel/);
  assert.doesNotMatch(recorded().join(' '), /wetlands|brother|ranks/);

  const committed = game.state;
  const savedFacts = recorded();
  assert.deepEqual(recorded(), savedFacts);
  assert.equal(game.state, committed);
  game.navigate('lucia_wildlife');
  assert.equal(recorded().length, 7);
  assert.match(recorded().join(' '), /brother|wetlands/);
  assert.doesNotMatch(recorded().join(' '), /ranks/);
  game.restoreCheckpoint();
  assert.deepEqual(encounteredPeople(publicPeople, game.state), []);
  assert.deepEqual(recorded(), []);

  const other = new Game(publicStory);
  for (const destination of ['ferry_cafe','ferry_context','ferry_ad']) other.navigate(destination);
  other.advancePage();
  other.navigate('name');
  other.submitText('Ari');
  other.navigate('contact_yes');
  other.navigate('pronouns');
  other.navigate('he');
  other.navigate('lucia_chat');
  other.navigate('lucia_rules');
  const alternativeFacts = learnedPersonFacts(lucia, other.state).join(' ');
  assert.match(alternativeFacts, /exchanged phone numbers/);
  assert.match(alternativeFacts, /ranks/);
  assert.doesNotMatch(alternativeFacts, /wetlands|brother/);
  assert.equal(encounteredPeople(publicPeople, other.state).filter(person => person.id === 'lucia').length, 1);
});

test('Victra and Livia facts follow the actual multi-stage subplot outcomes', () => {
  const pub = parseStory(readFileSync('content/aurelian-league.story', 'utf8'));
  const people = validatePeople(pub,parsePeople(JSON.parse(readFileSync('content/aurelian-league.people.json','utf8'))));
  assert.deepEqual(people.map(p=>p.name),['Lucia','Cassius','Octavia','Victra','Livia']);
  function arrive(destination: 'hotel_route'|'food_route') {
    const game=new Game(pub);
    for(const id of ['ferry_windows','ferry_context','ferry_ad']) game.navigate(id);
    game.advancePage();game.navigate('name');game.submitText('Ari');
    for(const id of ['contact_yes','pronouns','they','lucia_chat','open_deck','rail','dock_approach']) game.navigate(id);
    game.navigateChoice(game.visibleChoices[0]!);
    game.navigate('lezano_checkin');game.navigate('harbor_lookup');game.navigate('harbor_destination');
    game.navigate(destination);
    return game;
  }
  const victra=people.find(p=>p.id==='victra')!,livia=people.find(p=>p.id==='livia')!;
  for(const final of [0,1]){
    const game=arrive('hotel_route');
    game.navigateChoice(game.visibleChoices[0]!); // offer help
    assert.equal(encounteredPeople(people,game.state).some(p=>p.id==='victra'),true);
    game.navigateChoice(game.visibleChoices[final]!); // delivery list or tags
    game.navigate('hotel_followup');
    game.navigateChoice(game.visibleChoices[final]!); // accompany or delegate
    assert.equal(game.state.variables.victra_case,final===0?'recovered':'pending');
    assert.equal(learnedPersonFacts(victra,game.state).length,1);
    assert.equal(game.state.journal.some(e=>e.id==='victra_suitcase'),final===0);
    assert.equal(game.state.journal.some(e=>e.id==='victra_directions'),final===1);
  }
  const skipped=arrive('hotel_route');
  skipped.navigateChoice(skipped.visibleChoices[2]!);
  skipped.navigate('hotel_resolution');
  assert.equal(skipped.state.variables.victra_case,'unknown');
  assert.equal(encounteredPeople(people,skipped.state).some(p=>p.id==='victra'),false);

  for(const action of [0,1,2]){
    const game=arrive('food_route');
    game.navigateChoice(game.visibleChoices[action]!);
    assert.equal(game.state.variables.livia_impression,action===2?'distracted':'helpful');
    game.navigateChoice(game.visibleChoices[0]!);
    assert.equal(game.state.variables.credits,88);
    assert.equal(encounteredPeople(people,game.state).some(p=>p.id==='livia'),true);
    const facts=learnedPersonFacts(livia,game.state).join(' ');
    assert.match(facts,action===2?/disappointed/:/appreciated/);
    assert.equal(game.state.journal.some(e=>e.id==='livia_disappointed'),action===2);
  }
});
