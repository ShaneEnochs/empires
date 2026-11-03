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

test('all encounters lead to the two-option gangway choice', () => {
  for (const encounter of ['group_join', 'eavesdrop', 'rail']) {
    const game = beginConversation();
    game.navigate('open_deck');
    game.navigate(encounter);
    assert.deepEqual(encounteredPeople(people, game.state).map(p => p.id),
      encounter === 'group_join' ? ['lucia', 'dario', 'ilaria'] : ['lucia']);
    game.navigate('dock_approach');
    assert.equal(game.passage.title, 'Lezano Harbor');
    assert.deepEqual(game.visibleChoices.map(choice => choice.destinationId), ['lezano_arrival', 'lezano_arrival']);
    assert.deepEqual(game.visibleChoices.map(choice => choice.assignment?.value), ['confront', 'ignore']);
    assert.equal(game.state.party.length, 0);
    assert.equal(game.state.variables.ferry_encounter,
      encounter === 'group_join' ? 'conversation' : encounter === 'eavesdrop' ? 'eavesdrop' : 'quiet');
  }
  assert.ok(story.passages.some(p => p.chapter === 'Lezano'));
  assert.equal(story.passages.some(p => p.id === 'starters'), false);
});

test('Lucia topics remain recorded without cluttering the dock with prior acquaintances', () => {
  for (const topic of ['lucia_wildlife', 'lucia_rules']) {
    const game = beginConversation();
    game.navigate(topic);
    assert.notEqual(game.state.variables.lucia_topic, 'none');
    game.navigate('open_deck');
    game.navigate('rail');
    game.navigate('dock_approach');
    assert.equal(game.state.party.length, 0);
    assert.doesNotMatch(game.visibleParagraphs.map(p => p.text).join(' '), /Lucia|Dario|Ilaria/);
  }
});

test('the published story and People entries use Aurelia', () => {
  assert.match(source,/Aurelia/);
  assert.match(readFileSync('content/aurelian-league.people.json','utf8'),/Aurelia/);
});

test('each public choice menu contains two or three options', () => {
  for (const passage of story.passages) {
    if (passage.choices.length > 0) {
      assert.ok(passage.choices.length >= 2 && passage.choices.length <= 3,
        `Passage "${passage.id}" has ${passage.choices.length} options`);
    }
  }
  const conversation = story.passages.find(p => p.id === 'lucia_chat');
  assert.deepEqual(conversation?.choices.map(choice => choice.destinationId),
    ['lucia_wildlife','lucia_rules','open_deck']);
  assert.match(conversation!.paragraphs.map(p=>p.text).join(' '),/I hope my starter likes me/);
});

test('the League advertisement and Lucia explanation have distinct passage titles', () => {
  const advertisement = story.passages.find(p => p.id === 'ferry_ad');
  const explanation = story.passages.find(p => p.id === 'lucia_rules');
  assert.equal(advertisement?.title,'A Glimpse of the League');
  assert.equal(explanation?.title,'Eight Laurels');
  assert.equal(story.passages.filter(p=>p.title==='Eight Laurels').length,1);
});

test('CHAMP responses are conditional in one shared arrival passage', () => {
  for (const [index, answer] of ['confront', 'ignore'].entries()) {
    const game = beginConversation();
    game.navigate('open_deck');
    game.navigate('rail');
    game.navigate('dock_approach');
    assert.match(game.visibleParagraphs.map(p => p.text).join(' '), /CHAMP/);
    assert.equal(game.state.variables.rival_response, 'none');
    assert.equal(game.state.variables.credits, 0);
    assert.throws(() => game.navigate('lezano_arrival'), /select a specific choice/);
    game.navigateChoice(game.visibleChoices[index]!);
    assert.equal(game.passage.id, 'lezano_arrival');
    assert.equal(game.state.variables.rival_response, answer);
    const arrival = game.visibleParagraphs.map(p => p.text).join(' ');
    assert.match(arrival, /Once your feet are finally on solid ground/);
    if (answer === 'confront') {
      assert.match(arrival, /Kinda rude there/);
      assert.doesNotMatch(arrival, /You decide he isn't worth the trouble/);
    } else {
      assert.match(arrival, /You decide he isn't worth the trouble/);
      assert.doesNotMatch(arrival, /Kinda rude there/);
    }
  }
});

test('check-in grants 100 credits and the welcome items, with two final routes', () => {
  for (const destination of ['hotel_route', 'food_route']) {
    const game = beginConversation();
    game.navigate('open_deck');
    game.navigate('rail');
    game.navigate('dock_approach');
    game.navigateChoice(game.visibleChoices[0]!);
    assert.equal(game.state.variables.credits, 0);
    assert.deepEqual(game.state.inventory, {});
    game.navigate('lezano_checkin');
    assert.equal(game.state.variables.credits, 100);
    assert.deepEqual(game.state.inventory, { league_badge: 1, city_map: 1, hotel_assignment: 1 });
    assert.equal(game.passage.chapter, 'Lezano');
    const prose = game.visibleParagraphs.map(p => p.text).join(' ');
    assert.match(prose, /four o'clock this afternoon/);
    assert.match(prose, /Civic Forum/);
    assert.match(prose, /delivered directly to your room/);
    assert.match(prose, /serves as your debit card/);
    assert.match(prose, /All the shops here accept credits exclusively/);
    assert.deepEqual(game.visibleChoices.map(choice => choice.destinationId), ['hotel_route', 'food_route']);
    game.navigate(destination);
    assert.equal(game.passage.choices.length, 0);
    assert.equal(game.passage.continueTo, undefined);
    assert.equal(game.state.party.length, 0);
  }
});
