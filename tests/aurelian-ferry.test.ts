import { publicStorySource } from './public-story';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { parsePeople, validatePeople, encounteredPeople } from '../src/people';

const source = publicStorySource();
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
  assert.equal(game.passage.title, 'Approaching Lezano Aboard the Portia');
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
    assert.match(copy.currentParagraphs.map(p => p.text).join(' '), /What's your name\?/);
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
    assert.match(game.currentParagraphs.map(p => p.text).join(' '), /I use she \/ her/);
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
      encounter === 'group_join' ? ['lucia', 'cassius', 'octavia'] : ['lucia']);
    game.navigate('dock_approach');
    assert.equal(game.passage.title, 'Lezano Harbor');
    assert.deepEqual(game.visibleChoices.map(choice => choice.destinationId), ['lezano_arrival', 'lezano_arrival']);
    assert.deepEqual(game.visibleChoices.map(choice => choice.assignment?.value), ['confront', 'ignore']);
    assert.equal(game.state.party.length, 0);
    assert.equal(game.state.variables.ferry_encounter,
      encounter === 'group_join' ? 'conversation' : encounter === 'eavesdrop' ? 'eavesdrop' : 'quiet');
  }
  assert.ok(story.passages.some(p => p.chapter === 'Chapter 2: Arrival'));
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
    assert.doesNotMatch(game.visibleParagraphs.map(p => p.text).join(' '), /Lucia|Cassius|Octavia/);
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
  assert.equal(explanation?.title,'Choosing a Partner');
  assert.equal(story.passages.filter(p=>p.title==='Choosing a Partner').length,1);
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

function advanceAll(game: Game): void {
  let pages = 0;
  while (game.canAdvancePage) {
    game.advancePage();
    assert.ok(++pages <= 10, 'A passage must have a bounded number of pages');
  }
}

function go(game: Game, destination: string): void {
  advanceAll(game);
  game.navigate(destination);
}

function select(game: Game, index: number): void {
  advanceAll(game);
  const choice = game.visibleChoices[index];
  assert.ok(choice, 'Choice ' + index + ' is available in ' + game.passage.id);
  game.navigateChoice(choice);
}

function arriveAt(venue: 'hotel_route' | 'food_route', contact: 'contact_yes' | 'contact_no' = 'contact_yes'): Game {
  const game = beginConversation('ferry_windows', 'Ari', contact);
  for (const id of ['open_deck', 'rail', 'dock_approach']) go(game, id);
  select(game, 0);
  go(game, 'lezano_checkin');
  assert.deepEqual(game.state.inventory, { league_bracelet: 1 });
  assert.equal(game.state.variables.credits, 100);
  advanceAll(game);
  go(game, 'harbor_lookup');
  go(game, 'harbor_destination');
  go(game, venue);
  return game;
}

test('registration activates the bracelet, provides credits, and explains its functions across three pages', () => {
  const game = beginConversation();
  for (const id of ['open_deck', 'rail', 'dock_approach']) go(game, id);
  select(game, 0);
  assert.equal(game.state.variables.dex_installed, false);
  go(game, 'lezano_checkin');
  assert.equal(game.state.variables.dex_installed, true);
  assert.equal(game.state.variables.credits, 100);
  assert.deepEqual(game.state.inventory, { league_bracelet: 1 });
  assert.equal(game.passage.chapter, 'Chapter 2: Arrival');
  const pages = [game.currentParagraphs.map(p => p.text).join(' ')];
  while (game.canAdvancePage) {
    game.advancePage();
    pages.push(game.currentParagraphs.map(p => p.text).join(' '));
  }
  assert.equal(pages.length, 3);
  assert.match(pages.join(' '), /four o'clock this afternoon/);
  assert.match(pages.join(' '), /one hundred credits/);
  assert.match(pages.join(' '), /Pokédex/);
  assert.match(pages.join(' '), /has to be willing to join/);
  assert.equal(game.passage.continueTo, 'harbor_lookup');
  go(game, 'harbor_lookup');
  assert.deepEqual(game.visibleChoices.map(c => c.destinationId), [
    'harbor_scan_machoke', 'harbor_scan_wattrel', 'harbor_destination',
  ]);
  go(game, 'harbor_destination');
  assert.deepEqual(game.visibleChoices.map(c => c.destinationId), ['hotel_route', 'food_route']);
});

test('only the opening and harbor have visible titles and both chapters are linked', () => {
  const visible = story.passages.filter(p => !p.hideTitle).map(p => [p.id, p.title]);
  assert.deepEqual(visible, [
    ['ferry', 'Approaching Lezano Aboard the Portia'],
    ['dock_approach', 'Lezano Harbor'],
    ['lezano_arrival', 'Lezano Harbor'],
    ['lezano_checkin', 'Lezano Harbor'],
  ]);
  assert.equal(story.passages.find(p => p.id === 'ferry')?.chapter, 'Chapter 1: The Crossing');
  for (const id of ['dock_approach', 'lezano_arrival', 'lezano_checkin', 'hotel_route', 'food_route', 'orientation_invitation']) {
    assert.equal(story.passages.find(p => p.id === id)?.chapter, 'Chapter 2: Arrival');
  }
});

test('all harbor lookup options preserve deliberate Pokédex discovery', () => {
  for (let index = 0; index < 3; index++) {
    const game = beginConversation();
    for (const id of ['open_deck', 'rail', 'dock_approach']) go(game, id);
    select(game, 1);
    go(game, 'lezano_checkin');
    go(game, 'harbor_lookup');
    select(game, index);
    const expected = index === 0 ? 'scanned_machoke_harbor' : 'scanned_wattrel_harbor';
    if (index !== 2) {
      assert.ok(game.state.journal.some(event => event.id === expected));
      go(game, 'harbor_destination');
    } else assert.equal(game.passage.id, 'harbor_destination');
    assert.deepEqual(game.visibleChoices.map(c => c.destinationId), ['hotel_route', 'food_route']);
  }
});

test('every hotel decision can complete: lobby, clues, annex verification, contact, Wingull, orientation', () => {
  const visited = new Set<string>();
  let runs = 0;
  function note(game: Game) { visited.add(game.passage.id); }
  for (const contact of ['contact_yes', 'contact_no'] as const)
  for (const flavor of [0, 1])
  for (const initial of ['help', 'scan_help', 'scan_leave', 'leave'] as const)
  for (const clue of (initial === 'help' || initial === 'scan_help' ? [0,1] : [0]))
  for (const accompany of (initial === 'help' || initial === 'scan_help' ? [0,1] : [0]))
  for (const search of (accompany === 0 && (initial === 'help' || initial === 'scan_help') ? [0,1] : [0]))
  for (const proof of (accompany === 0 && (initial === 'help' || initial === 'scan_help') ? [0,1] : [0]))
  for (const exchange of (initial === 'help' || initial === 'scan_help' ? [0,1] : [0]))
  for (const wingull of [0, 1, 2]) {
    const game = arriveAt('hotel_route', contact);
    note(game);
    select(game, flavor); note(game);
    go(game, 'hotel_checkin'); note(game);
    if (initial === 'help') select(game, 0);
    else if (initial === 'leave') select(game, 2);
    else {
      select(game, 1); note(game);
      select(game, initial === 'scan_help' ? 0 : 1);
    }
    note(game);
    if (initial === 'help' || initial === 'scan_help') {
      assert.equal(game.passage.id, 'hotel_investigate');
      select(game, clue); note(game);
      go(game, 'hotel_followup'); note(game);
      select(game, accompany); note(game);
      if (accompany === 0) {
        assert.equal(game.passage.id, 'hotel_annex');
        select(game, search); note(game);
        go(game, 'hotel_annex_case'); note(game);
        select(game, proof); note(game);
        go(game, 'hotel_annex_recovered'); note(game);
        assert.equal(game.state.variables.victra_case, 'recovered');
        assert.ok(game.state.journal.some(e => e.id === 'victra_suitcase'));
        assert.equal(game.state.journal.some(e => e.id === 'victra_directions'), false);
      } else {
        assert.equal(game.state.variables.victra_case, 'pending');
        assert.ok(game.state.journal.some(e => e.id === 'victra_directions'));
        assert.equal(game.state.journal.some(e => e.id === 'victra_suitcase'), false);
      }
      go(game, 'hotel_victra_contact_offer'); note(game);
      select(game, exchange); note(game);
      assert.equal(game.state.journal.some(e => e.id === 'victra_contact_shared'), exchange === 0);
      assert.ok(encounteredPeople(people, game.state).some(p => p.id === 'victra'));
    } else {
      assert.equal(game.passage.id, 'hotel_staff');
      assert.equal(game.state.journal.some(e => e.id === 'met_victra'), false);
    }
    go(game, 'hotel_resolution'); note(game);
    assert.equal(game.state.variables.victra_case,
      initial === 'help' || initial === 'scan_help' ? (accompany === 0 ? 'recovered' : 'pending') : 'unknown');
    go(game, 'hotel_wingull'); note(game);
    select(game, wingull); note(game);
    if (wingull === 0) {
      assert.ok(game.state.journal.some(e => e.id === 'scanned_wingull_hotel'));
      go(game, 'orientation_invitation');
    } else if (wingull === 1) {
      assert.ok(game.state.journal.some(e => e.id === 'offered_wingull_water'));
      assert.equal(game.state.journal.some(e => e.id === 'scanned_wingull_hotel'), false);
      go(game, 'orientation_invitation');
    } else assert.equal(game.passage.id, 'orientation_invitation');
    note(game);
    assert.equal(game.state.variables.credits, 100);
    assert.equal(game.state.party.length, 0);
    const endpoints = game.visibleChoices.map(c => c.destinationId);
    assert.deepEqual(endpoints, contact === 'contact_yes'
      ? ['orientation_with_lucia', 'orientation_alone', 'orientation_scenic']
      : ['orientation_alone', 'orientation_scenic']);
    select(game, runs % endpoints.length);
    note(game);
    assert.equal(game.passage.choices.length, 0);
    assert.equal(game.passage.continueTo, undefined);
    runs++;
  }
  for (const id of [
    'hotel_route','hotel_wait_reassure','hotel_wait_quiet','hotel_checkin','hotel_investigate',
    'hotel_minccino','hotel_manifest','hotel_carts','hotel_followup','hotel_annex',
    'hotel_annex_number','hotel_annex_description','hotel_annex_case','hotel_annex_tag',
    'hotel_annex_mark','hotel_annex_recovered','hotel_victra_directions',
    'hotel_victra_contact_offer','hotel_victra_contact_yes','hotel_victra_contact_no',
    'hotel_staff','hotel_resolution','hotel_wingull','hotel_scan_wingull','hotel_wingull_water',
    'orientation_invitation','orientation_with_lucia','orientation_alone','orientation_scenic',
  ]) {
    assert.ok(visited.has(id), 'Unvisited hotel branch: ' + id);
  }
  assert.ok(runs >= 100, 'Exhaustive hotel coverage must sample at least 100 routes');
});

test('all restaurant decisions resolve with the right credit, Livia, and Pokédex outcomes', () => {
  let runs = 0;
  for (const contact of ['contact_yes','contact_no'] as const)
  for (const initial of [0,1,2])
  for (const followup of [0,1])
  for (const lookup of [0,1]) {
    const game = arriveAt('food_route', contact);
    select(game, initial);
    assert.equal(game.state.variables.livia_impression, initial === 2 ? 'distracted' : 'helpful');
    assert.equal(game.state.journal.some(e => e.id === 'scanned_wattrel_emergency'), initial === 2);
    select(game, followup);
    assert.equal(game.state.variables.credits, 100, 'Lunch is not charged before the rescue');
    assert.ok(game.state.journal.some(e => e.id === 'helped_wattrel'));
    assert.equal(game.state.journal.some(e => e.id === 'livia_disappointed'), initial === 2);
    assert.ok(encounteredPeople(people, game.state).some(p => p.id === 'livia'));
    go(game, 'food_lunch');
    assert.equal(game.state.variables.credits, 88);
    select(game, lookup);
    assert.equal(game.state.journal.some(e => e.id === 'scanned_wattrel_rest'), lookup === 0);
    if (lookup === 0) go(game, 'orientation_invitation');
    assert.equal(game.passage.id, 'orientation_invitation');
    select(game, runs % game.visibleChoices.length);
    assert.equal(game.passage.choices.length, 0);
    assert.equal(game.passage.continueTo, undefined);
    runs++;
  }
  assert.equal(runs, 24);
});
