import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { parsePeople, validatePeople, encounteredPeople } from '../src/people';
import { parsePokedex, validatePokedex } from '../src/pokedex';
import { publicStorySource } from './public-story';

const story = parseStory(publicStorySource());
const people = validatePeople(story, parsePeople(JSON.parse(readFileSync('content/aurelian-league.people.json', 'utf8'))));
const pokedex = validatePokedex(story, parsePokedex(JSON.parse(readFileSync('content/aurelian-league.pokedex.json', 'utf8'))));
function finishPages(game: Game) { while (game.canAdvancePage) game.advancePage(); }
function select(game: Game, index: number) {
  finishPages(game);
  assert.equal(game.visibleChoices.length, 2, 'Expected two choices in ' + game.passage.id);
  game.navigateChoice(game.visibleChoices[index]!);
}

test('new Chapter 1 is the only public game content', () => {
  assert.match(readFileSync('src/catalog.ts', 'utf8'), /storyRevision: 10/);
  assert.equal(story.startId, 'orchard_intro');
  assert.deepEqual(story.passages.map(p => p.id), [
    'orchard_intro', 'ditch_attempt', 'bread_result', 'report_result',
    'shed_result', 'trough_response', 'capture_attempt']);
  assert.ok(story.passages.every(p => p.chapter === 'Chapter 1: A Simple Assignment'));
  assert.equal(story.passages.at(-1)!.continueTo, undefined);
  assert.equal(story.passages.at(-1)!.choices.length, 0);
  assert.equal(story.stats.length, 0);
  assert.equal(story.pokemon.length, 0);
});
test('Cassius appears in People immediately and old metadata is absent', () => {
  const game = new Game(story);
  assert.deepEqual(encounteredPeople(people, game.state).map(p => p.id), ['cassius']);
  assert.match(people[0]!.description, /senior.*field warden/i);
  assert.equal(pokedex.length, 0);
  assert.deepEqual(game.state.journal.map(e => e.id), ['met_cassius']);
});
test('all 64 binary-choice routes reach the terminal capture with correct state', () => {
  const ids = ['orchard_intro','ditch_attempt','bread_result','report_result',
    'shed_result','trough_response','capture_attempt'];
  for (let mask = 0; mask < 64; mask++) {
    const game = new Game(story);
    for (let step = 0; step < 6; step++) {
      select(game, (mask >> step) & 1);
      assert.equal(game.passage.id, ids[step + 1], 'Route ' + mask + ', step ' + step);
    }
    finishPages(game);
    const vars = game.state.variables;
    const encouraged = (mask & 1) === 0;
    const reassurance = (mask & 4) === 0;
    assert.equal(vars.cassius_relationship, 13 + (encouraged ? 1 : 0) + (reassurance ? 1 : -3));
    assert.equal(vars.cassius_encouraged, encouraged);
    assert.equal(vars.report_response, reassurance ? 'reassure' : 'honest');
    assert.equal(vars.shed_response, (mask & 8) === 0 ? 'help' : 'chase');
    assert.equal(vars.trough_question, (mask & 16) === 0 ? 'water' : 'behavior');
    assert.equal(vars.capture_plan, (mask & 32) === 0 ? 'clover' : 'carrier');
    assert.equal(game.canAdvancePage, false);
    assert.equal(game.availableChoices.length, 0);
    assert.equal(game.passage.continueTo, undefined);
    assert.match(game.currentParagraphs.at(-1)!.text, /You hope he's right/);
    assert.deepEqual(game.state.journal.map(e => e.id), ['met_cassius']);
    assert.equal(game.state.party.length, 0);
  }
});
test('saved page and relationship resume without replaying effects', () => {
  const saved = new Map<string, string>();
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => { saved.set(key, value); },
  };
  const session = new GameSession(story, storage, { storyId: 'aurelian-league', storyRevision: 10 });
  assert.equal(session.newGame(() => true), 'started');
  session.navigateChoice(session.game!.visibleChoices[0]!);
  session.advancePage();
  const oldState = session.game!.state;
  const oldPage = session.game!.currentParagraphs.map(p => p.text);
  const resumedSession = new GameSession(story, storage, { storyId: 'aurelian-league', storyRevision: 10 });
  assert.equal(resumedSession.startup.status, 'ready');
  const resumed = resumedSession.continueGame();
  assert.deepEqual(resumed.state, oldState);
  assert.deepEqual(resumed.currentParagraphs.map(p => p.text), oldPage);
  assert.equal(resumed.state.variables.cassius_relationship, 14);
  assert.equal(resumed.state.journal.filter(e => e.id === 'met_cassius').length, 1);
});
