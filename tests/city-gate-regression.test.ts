import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { interpolate } from '../src/interpolate';
import { characterStats } from '../src/panels';
import { parseStory } from '../src/story';
import { STORAGE_KEY } from '../src/storage';

// The retired public demo stays an isolated authoring and engine fixture.
const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));

for (const messenger of [false, true]) {
  test('retired City Gate route keeps its full outcome and conditional prose: ' + (messenger ? 'messenger' : 'direct'), () => {
    const game = new Game(story);
    const checkpoint = game.checkpoint;
    if (messenger) game.navigate('messenger');
    game.navigate('council');
    const influence = messenger ? 2.5 : 0.5;
    assert.deepEqual(game.state.variables, { influence, honor: messenger ? 4 : 5, loyal: messenger, character_name: 'Alexander' });
    assert.deepEqual(game.state.skills, messenger ? ['diplomacy'] : []);
    assert.deepEqual(game.state.inventory, { gold_coin: messenger ? 7 : 5 });
    assert.deepEqual(game.state.journal.map(entry => entry.id), messenger
      ? ['arrived_city', 'met_messenger', 'met_council'] : ['arrived_city', 'met_council']);
    assert.equal(game.state.journal[0]!.text, 'Alexander reached the city with influence 1.');
    assert.equal(game.state.journal.at(-1)!.text, 'You reached the council with influence ' + influence + '.');
    assert.deepEqual(characterStats(story, game.state), [
      { label: 'Name', value: 'Alexander' }, { label: 'Influence', value: String(influence) },
      { label: 'Honor', value: messenger ? '4' : '5' }, { label: 'Loyal', value: messenger ? 'Yes' : 'No' },
    ]);
    const prose = game.visibleParagraphs.map(paragraph => interpolate(paragraph.text, game.state.variables)).join('\n');
    assert.equal(prose.includes('Your diplomatic training helps you choose your words.'), messenger);
    assert.equal(prose.includes('Without diplomatic training, you face the council unaided.'), !messenger);
    assert.equal(prose.includes("The messenger's extra coins remain after the entry fee."), messenger);
    assert.equal(game.availableChoices.length, 0);
    assert.equal(game.passage.continueTo, undefined);
    assert.equal(game.checkpoint, checkpoint);
  });
}

for (const named of [false, true]) {
  test('retired City Gate save and repeated death recovery retain complete pre-entry state: ' + (named ? 'named' : 'initial'), () => {
    const records = new Map<string, string>();
    let writes = 0;
    const storage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => { records.set(key, value); writes++; },
    };
    const session = new GameSession(story, storage);
    assert.equal(session.newGame(() => false), 'started');
    if (named) {
      session.navigate('choose_name');
      session.submitText('  Éléonore 王 <b>Hero</b>  ');
    }
    const expected = session.game!.state;
    const checkpoint = session.game!.checkpoint;
    const saved = records.get(STORAGE_KEY)!;
    const count = writes;
    for (let cycle = 0; cycle < 3; cycle++) {
      session.navigate('watchtower');
      session.navigate('fatal_fall');
      assert.equal(session.game!.passage.death, true);
      session.retryAfterDeath();
      assert.deepEqual(session.game!.state, expected);
      assert.equal(session.game!.checkpoint, checkpoint);
      assert.equal(records.get(STORAGE_KEY), saved);
      assert.equal(writes, count);
    }
    const reopened = new GameSession(story, storage);
    assert.deepEqual(reopened.startup, { status: 'ready' });
    assert.deepEqual(reopened.continueGame().state, expected);
    assert.equal(writes, count);
    assert.equal(records.get(STORAGE_KEY), saved);
    const envelope = JSON.parse(saved);
    assert.equal(envelope.formatVersion, 1);
    assert.equal(envelope.storyId, 'empires-example');
    assert.equal(envelope.storyRevision, 1);
  });
}
