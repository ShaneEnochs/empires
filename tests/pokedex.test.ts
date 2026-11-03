import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePokedex, validatePokedex, discoveredPokemon } from '../src/pokedex';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { checkpointKey } from '../src/storage';

const publicStory = parseStory(readFileSync('content/aurelian-league.story', 'utf8'));
const publicDex = validatePokedex(publicStory, JSON.parse(readFileSync('content/aurelian-league.pokedex.json', 'utf8')));
const definition = { id: 'piplup', name: 'Piplup', description: 'A traveling companion.', discoveryEvents: ['seen'], acquisitionEvents: ['acquired'] };
const source = `*pokemon partner "Piplup"
*item token "Token"
*passage start
*title Start
Piplup is mentioned. A Lapras necklace is mentioned too.
*choice
#Meet -> meet
#Fail -> fail
*passage meet
*title Encounter
*journal seen "You encountered Piplup."
The Pokémon is here.
*choice
#Repeat -> meet
#Join -> join
*passage join
*title Partner
*add_pokemon partner
*journal acquired "Piplup joined your party."
Your partner joins.
*continue camp
*passage camp
*title Camp
*checkpoint
You pause together.
*continue leave
*passage leave
*title Apart
*remove_pokemon partner
Your partner is no longer traveling with you.
*continue end
*passage end
*title Recovery
The private recovery example ends here.
*death
*passage fail
*title Failure
*journal failed "An encounter must not commit."
*remove_item token 1
This transition fails.`;
const story = parseStory(source);
const dex = validatePokedex(story, [definition]);
class Memory {
  raw: string | null = null; writes = 0;
  getItem() { return this.raw; }
  setItem(_key: string, value: string) { this.raw = value; this.writes++; }
}

test('metadata is copied, frozen, incremental and uses stable species IDs', () => {
  const raw = [{ ...definition, discoveryEvents: ['seen'] }];
  const parsed = parsePokedex(raw);
  raw[0]!.discoveryEvents.push('later');
  assert.deepEqual(parsed[0]!.discoveryEvents, ['seen']);
  for (const value of [parsed, parsed[0], parsed[0]!.discoveryEvents, parsed[0]!.acquisitionEvents]) assert.ok(Object.isFrozen(value));
  assert.deepEqual(parsePokedex([]), []);
});
for (const raw of [null, {}, [null], [[]], [{ ...definition, id: 'Piplup' }], [definition, definition],
  [{ ...definition, name: '' }], [{ ...definition, description: ' ' }], [{ ...definition, discoveryEvents: ['seen', 'seen'] }],
  [{ ...definition, discoveryEvents: 'seen' }], [{ ...definition, acquisitionEvents: [1] }],
  [{ ...definition, discoveryEvents: [], acquisitionEvents: [] }], [{ ...definition, discoveryEvents: ['invalid id'] }],
]) test('rejects malformed metadata ' + JSON.stringify(raw), () => assert.throws(() => parsePokedex(raw)));
test('all discovery and acquisition event references must exist in the selected story', () => {
  assert.throws(() => validatePokedex(story, [{ ...definition, discoveryEvents: ['unknown'] }]), /unknown journal event/);
  assert.throws(() => validatePokedex(story, [{ ...definition, acquisitionEvents: ['unknown'] }]), /unknown journal event/);
});
test('prose mentions do not discover species; repeated encounters deduplicate and acquisition upgrades the same entry', () => {
  const game = new Game(story);
  assert.deepEqual(discoveredPokemon(dex, game.state), []);
  game.navigate('meet'); game.navigate('meet');
  assert.equal(game.state.journal.length, 1);
  assert.deepEqual(discoveredPokemon(dex, game.state).map(entry => [entry.id, entry.status]), [['piplup', 'Encountered']]);
  game.navigate('join');
  assert.equal(game.state.party.length, 1);
  assert.deepEqual(discoveredPokemon(dex, game.state).map(entry => [entry.id, entry.status]), [['piplup', 'Acquired']]);
});
test('discovery follows first encounter order and reads the recorded chapter without changing state', () => {
  const extra = { id: 'other', name: 'Other Pokémon', description: 'Another authored entry.', discoveryEvents: ['acquired'] };
  const entries = validatePokedex(story, [extra, definition]);
  const game = new Game(story); game.navigate('meet'); game.navigate('join');
  const before = game.state;
  assert.deepEqual(discoveredPokemon(entries, before).map(entry => entry.id), ['piplup', 'other']);
  assert.equal(discoveredPokemon(entries, before)[0]!.chapter, 'Prologue');
  assert.equal(game.state, before);
});
test('acquired discoveries survive removal, saves/reloads, and checkpoints that contain the events', () => {
  const memory = new Memory(); const session = new GameSession(story, memory);
  session.newGame(() => true); session.navigate('meet'); session.navigate('join'); session.navigate('camp');
  session.navigate('leave'); assert.equal(session.game!.state.party.length, 0);
  const expected = discoveredPokemon(dex, session.game!.state), raw = memory.raw, writes = memory.writes;
  const reopened = new GameSession(story, memory); reopened.continueGame();
  assert.deepEqual(discoveredPokemon(dex, reopened.game!.state), expected);
  assert.equal(memory.raw, raw); assert.equal(memory.writes, writes);
  reopened.navigate('end'); reopened.retryAfterDeath();
  assert.equal(reopened.game!.state.party.length, 1);
  assert.deepEqual(discoveredPokemon(dex, reopened.game!.state), expected);
});
test('recovering an earlier checkpoint derives exactly its journal, just like People', () => {
  const game = new Game(story); game.navigate('meet');
  assert.equal(discoveredPokemon(dex, game.state).length, 1);
  game.restoreCheckpoint(); assert.deepEqual(discoveredPokemon(dex, game.state), []);
});
test('a failed entry cannot record a discovery', () => {
  const failedDex = validatePokedex(story, [{ ...definition, discoveryEvents: ['failed'], acquisitionEvents: [] }]);
  const game = new Game(story), before = game.state;
  assert.throws(() => game.navigate('fail'), /insufficient inventory/);
  assert.equal(game.state, before); assert.deepEqual(discoveredPokemon(failedDex, game.state), []);
});
test('pre-install sightings never populate the public Pokédex', () => {
  for(const first of ['ferry_cafe','ferry_windows'] as const){
    const game = new Game(publicStory);
    game.navigate(first);
    assert.deepEqual(discoveredPokemon(publicDex, game.state), []);
    game.navigate('ferry_context'); game.navigate('ferry_ad'); game.advancePage();
    game.navigate('name');
    assert.deepEqual(discoveredPokemon(publicDex, game.state), []);
    assert.equal(game.state.variables.dex_installed, false);
    assert.ok(game.state.journal.some(e => e.id.startsWith('saw_')));
  }
  assert.ok(!publicDex.some(entry => ['Lapras', 'Floatzel', 'Magikarp'].includes(entry.name)));
});
test('existing revision-5 ferry saves remain valid and are never backfilled during Continue', () => {
  const identity = { storyId: 'aurelian-league', storyRevision: 5 };
  const memory = new Memory(); const session = new GameSession(publicStory, memory, identity);
  session.newGame(() => true); session.navigate('ferry_windows');
  const old = JSON.parse(memory.raw!); old.currentState.journal = [];
  memory.raw = JSON.stringify(old);
  const raw = memory.raw, writes = memory.writes;
  const reopened = new GameSession(publicStory, memory, identity);
  assert.equal(reopened.startup.status, 'ready');
  assert.deepEqual(discoveredPokemon(publicDex, reopened.continueGame().state), []);
  assert.equal(memory.raw, raw); assert.equal(memory.writes, writes);
  assert.equal(checkpointKey(identity), 'pokemon:checkpoint:aurelian-league');
});

test('a post-install opt-in lookup is the only public discovery path', () => {
  const reach = () => {
    const game = new Game(publicStory);
    game.navigate('ferry_cafe'); game.navigate('ferry_context'); game.navigate('ferry_ad'); game.advancePage();
    game.navigate('name'); game.submitText('Ari');
    for(const id of ['contact_no','pronouns','he','lucia_chat','open_deck','rail','dock_approach']) game.navigate(id);
    game.navigateChoice(game.visibleChoices[1]!);
    assert.equal(discoveredPokemon(publicDex,game.state).length,0);
    game.navigate('lezano_checkin');
    assert.equal(game.state.variables.dex_installed,true);
    assert.ok(game.state.journal.some(e=>e.id==='installed_pokedex_app'));
    game.navigate('harbor_lookup');
    return game;
  };
  const skipped = reach(); skipped.navigate('harbor_destination');
  assert.deepEqual(discoveredPokemon(publicDex,skipped.state),[]);
  const wattrel = reach(); wattrel.navigate('harbor_scan_wattrel');
  assert.deepEqual(discoveredPokemon(publicDex,wattrel.state).map(p=>p.id),['wattrel']);
  assert.equal(discoveredPokemon(publicDex,wattrel.state)[0]!.chapter, 'Chapter 2: Orientation');
  const machoke = reach(); machoke.navigate('harbor_scan_machoke');
  assert.deepEqual(discoveredPokemon(publicDex,machoke.state).map(p=>p.id),['machoke']);
  wattrel.navigate('harbor_destination'); wattrel.navigate('food_route');
  wattrel.navigateChoice(wattrel.visibleChoices[2]!);
  assert.equal(discoveredPokemon(publicDex,wattrel.state).filter(p=>p.id==='wattrel').length,1);
  assert.ok(wattrel.state.journal.some(e=>e.id==='delayed_restaurant_help'));
  assert.equal(machoke.state.journal.some(e=>e.id==='scanned_wattrel_emergency'),false);
});
