import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { parsePeople, validatePeople, encounteredPeople } from '../src/people';

const story = parseStory(readFileSync('content/aurelian-league.story', 'utf8'));
const people = validatePeople(story, parsePeople(JSON.parse(readFileSync('content/aurelian-league.people.json', 'utf8'))));

function startFerryConversation(name = 'Alex', pronouns = 'they'): Game {
  const game = new Game(story);
  assert.equal(game.passage.id, 'ferry');
  assert.equal(game.canAdvancePage, true);
  game.advancePage();
  assert.equal(game.canAdvancePage, false);
  game.navigate('name');
  game.submitText(name);
  assert.equal(game.passage.id, 'pronouns');
  game.navigate(pronouns);
  game.navigate('lucia_chat');
  return game;
}

test('the ferry opens with two reading pages and name and pronouns arise in Lucia dialogue', () => {
  const game = new Game(story);
  assert.equal(game.currentParagraphs.length, 3);
  assert.equal(game.passage.title, 'Approaching Lezano');
  game.advancePage();
  assert.equal(game.currentParagraphs.length, 3);
  game.navigate('name');
  assert.match(game.currentParagraphs.map(p => p.text).join(' '), /first name is fine/);
  game.submitText('Jordan');
  assert.match(game.currentParagraphs.map(p => p.text).join(' '), /what about you/i);
  assert.deepEqual(game.visibleChoices.map(x => x.label), ['He / Him', 'She / Her', 'They / Them']);
});

test('all three pronoun presets survive the fuller ferry sequence', () => {
  for (const [choice, expected, plural] of [['he','he',false], ['she','she',false], ['they','they',true]] as const) {
    const game = startFerryConversation('Jordan', choice);
    assert.equal(game.state.variables.trainer_name, 'Jordan');
    assert.equal(game.state.variables.pronouns_subject, expected);
    assert.equal(game.state.variables.use_plural_verbs, plural);
    assert.deepEqual(encounteredPeople(people, game.state).map(person => person.id), ['lucia']);
  }
});

test('every optional encounter leads to Lezano with distinct journal and People results', () => {
  for (const encounter of ['group_join', 'eavesdrop', 'rail']) {
    const game = startFerryConversation();
    game.navigate('open_deck');
    game.navigate(encounter);
    const names = encounteredPeople(people, game.state).map(person => person.id);
    assert.deepEqual(names, encounter === 'group_join' ? ['lucia','dario','ilaria'] : ['lucia']);
    assert.equal(game.state.variables.ferry_encounter,
      encounter === 'group_join' ? 'conversation' : encounter === 'eavesdrop' ? 'eavesdrop' : 'quiet');
    game.navigate('dock_approach');
    const prose = game.visibleParagraphs.map(p => p.text).join(' ');
    if (encounter === 'group_join') assert.match(prose, /Dario notices you/);
    if (encounter === 'eavesdrop') assert.match(prose, /Neither seems aware/);
    if (encounter === 'rail') assert.match(prose, /Wingull from the outer deck/);
    game.navigate('arrival');
    assert.equal(game.passage.title, 'Arrival in Lezano');
    assert.equal(game.state.party.length, 0);
    game.navigate('starters');
    assert.equal(game.visibleChoices.length, 3);
  }
});

test('each optional Lucia topic leads to another meaningful ferry choice', () => {
  for (const topic of ['lucia_wildlife', 'lucia_rules', 'lucia_nerves']) {
    const game = startFerryConversation();
    game.navigate(topic);
    assert.notEqual(game.state.variables.lucia_topic, 'none');
    game.navigate('open_deck');
    assert.deepEqual(game.availableChoices.map(c => c.destinationId), ['group_join','eavesdrop','rail']);
  }
});
