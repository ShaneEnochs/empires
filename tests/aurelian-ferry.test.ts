import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { parsePeople, validatePeople, encounteredPeople } from '../src/people';

const source = readFileSync('content/aurelian-league.story', 'utf8');
const story = parseStory(source);
const people = validatePeople(story, parsePeople(JSON.parse(readFileSync('content/aurelian-league.people.json', 'utf8'))));

function beginConversation(firstStop: 'ferry_cafe' | 'ferry_windows' = 'ferry_windows', name = 'Alex', contact: 'contact_yes' | 'contact_no' = 'contact_yes', pronoun = 'they'): Game {
  const game = new Game(story);
  game.navigate(firstStop);
  game.navigate('ferry_context');
  game.navigate('ferry_ad');
  game.advancePage();
  game.navigate('name');
  game.submitText(name);
  game.navigate(contact);
  game.navigate('pronouns');
  game.navigate(pronoun);
  game.navigate('lucia_chat');
  return game;
}

test('early choice has two flavor routes, and both include working Pokémon', () => {
  const game = new Game(story);
  assert.equal(game.passage.title, 'Approaching Lezano');
  assert.deepEqual(game.visibleChoices.map(choice => choice.destinationId), ['ferry_cafe', 'ferry_windows']);
  for (const destination of ['ferry_cafe', 'ferry_windows']) {
    const copy = new Game(story);
    copy.navigate(destination);
    const text = copy.visibleParagraphs.map(p => p.text).join(' ');
    assert.match(text, /Minccino/);
    assert.match(text, /Machoke/);
    copy.navigate('ferry_context');
    assert.match(copy.visibleParagraphs.map(p => p.text).join(' '), /one hundred contestants were accepted/i);
    copy.navigate('ferry_ad');
    assert.equal(copy.canAdvancePage, true);
    copy.advancePage();
    copy.navigate('name');
    assert.match(copy.currentParagraphs.map(p => p.text).join(' '), /What should I call you\?/);
    assert.doesNotMatch(copy.currentParagraphs.map(p => p.text).join(' '), /Just your first name/);
  }
});

test('Lucia asks for contact permission before pronouns and accepts either answer', () => {
  for (const answer of ['contact_yes','contact_no'] as const) {
    const game = new Game(story);
    game.navigate('ferry_windows');
    game.navigate('ferry_context');
    game.navigate('ferry_ad');
    game.advancePage();
    game.navigate('name');
    game.submitText('Jordan');
    assert.equal(game.passage.id, 'contact_question');
    const text = game.visibleParagraphs.map(p => p.text).join(' ');
    assert.match(text, /Hi,/);
    assert.match(text, /okay if I added you to my contacts/);
    assert.deepEqual(game.visibleChoices.map(choice => choice.destinationId), ['contact_yes','contact_no']);
    game.navigate(answer);
    assert.equal(game.state.variables.lucia_contact, answer === 'contact_yes');
    game.navigate('pronouns');
    assert.match(game.currentParagraphs.map(p => p.text).join(' '), /I use she and her/);
    assert.deepEqual(game.visibleChoices.map(choice => choice.label), ['He / Him','She / Her','They / Them']);
  }
});

test('all pronoun sets and both phone choices lead to Lucia and stay in the ferry chapter', () => {
  for (const pronoun of ['he','she','they']) for (const contact of ['contact_yes','contact_no'] as const) {
    const game = beginConversation('ferry_cafe','Jordan',contact,pronoun);
    assert.equal(game.state.variables.trainer_name,'Jordan');
    assert.equal(game.state.variables.pronouns_subject,pronoun);
    assert.equal(game.state.variables.use_plural_verbs, pronoun === 'they');
    assert.equal(game.state.variables.lucia_contact, contact === 'contact_yes');
    assert.deepEqual(encounteredPeople(people, game.state).map(person => person.id), ['lucia']);
    assert.deepEqual(game.state.party,[]);
  }
});

test('conversations, eavesdropping and the deck lead only to the terminal harbor passage', () => {
  for (const encounter of ['group_join','eavesdrop','rail']) {
    const game=beginConversation();
    game.navigate('open_deck');
    game.navigate(encounter);
    assert.deepEqual(encounteredPeople(people,game.state).map(p=>p.id),
      encounter === 'group_join' ? ['lucia','dario','ilaria'] : ['lucia']);
    game.navigate('dock_approach');
    assert.equal(game.passage.title,'Lezano Harbor');
    assert.equal(game.passage.continueTo,undefined);
    assert.deepEqual(game.passage.choices,[]);
    assert.equal(game.passage.textInput,undefined);
    assert.equal(game.state.party.length,0);
    assert.equal(game.state.variables.ferry_encounter,
      encounter === 'group_join' ? 'conversation' : encounter === 'eavesdrop' ? 'eavesdrop' : 'quiet');
  }
  assert.equal(story.passages.some(p=>p.chapter==='Lezano'),false);
  assert.equal(story.passages.some(p=>p.id==='starters' || p.id==='arrival'),false);
});

test('Lucia topics keep their distinct callbacks at the harbor', () => {
  for (const topic of ['lucia_wildlife','lucia_rules','lucia_nerves']) {
    const game = beginConversation();
    game.navigate(topic);
    assert.notEqual(game.state.variables.lucia_topic,'none');
    game.navigate('open_deck');
    game.navigate('rail');
    game.navigate('dock_approach');
    assert.equal(game.state.party.length,0);
    const prose = game.visibleParagraphs.map(p=>p.text).join(' ');
    if(topic==='lucia_wildlife')assert.match(prose,/photograph them/);
    if(topic==='lucia_rules')assert.match(prose,/get some answers/);
    if(topic==='lucia_nerves')assert.match(prose,/sheepish smile/);
  }
});

test('the published story and People entries use Aurelia', () => {
  assert.match(source,/Aurelia/);
  assert.match(readFileSync('content/aurelian-league.people.json','utf8'),/Aurelia/);
});
