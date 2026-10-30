import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Game } from '../src/game';
import { interpolate } from '../src/interpolate';
import { parseStory } from '../src/story';

const definitions = '*skill swordsmanship "Swordsmanship"\n*skill diplomacy "Diplomacy"\n';
const passage = '*passage start\n*title Start\nText.';
const withEffects = (effects: string) => `${definitions}*passage start\n*title Start\n${effects}\nText.`;
const conditional = (condition: string, effects = '') => `${definitions}*var count 0\n*passage start\n*title Start\n${effects}\nAlways.\n\n*show_if ${condition}\nConditional prose.\n*choice\n#Conditional -> target [if ${condition}]\n#Fallback -> fallback\n*passage target\n*title Target\n*grant_skill diplomacy\n*journal entered_target "Target"\nDone.\n*passage fallback\n*title Fallback\nDone.`;

test('skill definitions are immutable metadata and may interleave with variable declarations', () => {
  const story = parseStory(`*var diplomacy 0\n*skill diplomacy "Diplomacy"\n*var honor 5\n*skill swordsmanship "Swordsmanship"\n*chapter Prologue\n${passage}`);
  assert.deepEqual(story.skills, [{ id: 'diplomacy', name: 'Diplomacy' }, { id: 'swordsmanship', name: 'Swordsmanship' }]);
  assert.deepEqual(story.initialVariables, { diplomacy: 0, honor: 5 });
  assert.throws(() => Array.prototype.pop.call(story.skills), TypeError);
  assert.equal(Reflect.set(story.skills[0]!, 'name', 'Changed'), false);
  assert.equal(Reflect.set(story.skills[0]!, 'id', 'changed'), false);
});

test('existing stories require no skill definitions and start with an empty acquired list', () => {
  const story = parseStory(passage);
  assert.deepEqual(story.skills, []);
  assert.deepEqual(new Game(story).state.skills, []);
});

test('display names use existing JSON escapes and remain literal rather than interpolated', () => {
  const name = 'A "quoted" skill\\path\n♥ ${unknown} <b>Skill</b>';
  const story = parseStory(`*skill special ${JSON.stringify(name)}\n${passage}`);
  assert.equal(story.skills[0]?.name, name);
});

test('duplicate IDs are rejected even when unused or given different display names', () => {
  assert.throws(() => parseStory(`*skill swordsmanship "First"\n*skill swordsmanship "Second"\n${passage}`), /Line 2: Duplicate skill ID "swordsmanship"/);
});

test('duplicate display names are permitted and acquisition identity remains the ID', () => {
  const game = new Game(parseStory(`*skill first "Same"\n*skill second "Same"\n*passage start\n*title Start\n*grant_skill first\n*grant_skill second\nText.`));
  assert.deepEqual(game.state.skills, ['first', 'second']);
});

test('skill IDs follow the existing grammar and remain stable when names or declaration order change', () => {
  const original = parseStory(`*skill field-medicine_2 "Medicine"\n*skill a "Other"\n${passage}`);
  const revised = parseStory(`*skill a "Renamed"\n*skill field-medicine_2 "Field Medicine"\n${passage}`);
  assert.deepEqual(original.skills.map(s => s.id), ['field-medicine_2', 'a']);
  assert.equal(original.skills[0]?.id, revised.skills[1]?.id);
});

for (const declaration of [
  '*skill', '*skill swordsmanship', '*skill 1skill "Name"', '*skill Upper "Name"', '*skill bad.id "Name"',
  '*skill skill 1', '*skill skill true', '*skill skill null', '*skill skill []', '*skill skill {}',
  '*skill skill Name', "*skill skill 'Name'", '*skill skill "unclosed', '*skill skill "ok" trailing',
  '*skill skill ""', '*skill skill "  "', '*skill skill "\\n\\t"', '*skill skill "bad\\x"',
]) {
  test(`rejects malformed skill declarations: ${declaration}`, () => {
    assert.throws(() => parseStory(`${declaration}\n${passage}`), /Line 1:/);
  });
}

test('definitions are rejected after any chapter/passage, including between chapter sections', () => {
  for (const body of [
    `*chapter First\n*skill skill "Name"\n${passage}`,
    '*passage start\n*title Start\n*skill skill "Name"\nText.',
    `${passage}\n*skill skill "Name"`,
    `${passage}\n*chapter Second\n*skill skill "Name"\n*passage end\n*title End\nDone.`,
  ]) {
    assert.throws(() => parseStory(body), /\*skill declarations must precede the first passage and all chapter declarations/);
  }
});

test('skill IDs and variable IDs remain separate, with explicit skill syntax', () => {
  const story = parseStory('*var diplomacy 4\n*skill diplomacy "Diplomacy"\n*passage start\n*title Start\nAlways.\n\n*show_if diplomacy == 4\nVariable prose.\n\n*show_if lacks_skill diplomacy\nSkill prose.');
  const game = new Game(story);
  assert.deepEqual(game.visibleParagraphs.map(p => p.text), ['Always.', 'Variable prose.', 'Skill prose.']);
  assert.deepEqual(game.state.skills, []);
  assert.equal(game.state.variables.diplomacy, 4);
});

test('existing comparison variables may be named has_skill or lacks_skill', () => {
  const story = parseStory('*var has_skill 1\n*var lacks_skill false\n*passage start\n*title Start\nAlways.\n\n*show_if has_skill == 1\nFirst.\n\n*show_if lacks_skill == false\nSecond.');
  assert.equal(new Game(story).visibleParagraphs.length, 3);
});

test('keyword-named variable comparisons preserve optional whitespace around every operator', () => {
  for (const name of ['has_skill', 'lacks_skill']) {
    for (const [operator, eligible] of [['==', true], ['!=', false], ['>=', true], ['<=', true], ['>', false], ['<', false]] as const) {
      for (const [before, after] of [['', ''], [' ', ''], ['', ' '], [' ', ' ']]) {
        const condition = `${name}${before}${operator}${after}2`;
        const game = new Game(parseStory(`*var ${name} 2\n${passage}\n\n*show_if ${condition}\nCompared.\n*choice\n#Conditional -> start [if ${condition}]\n#Fallback -> start`));
        assert.equal(game.visibleParagraphs.length, eligible ? 2 : 1, condition);
        assert.equal(game.availableChoices.length, eligible ? 2 : 1, condition);
        assert.deepEqual(game.passage.choices[0]?.condition, { variable: name, operator, value: 2 });
      }
    }
  }
});

for (const command of [
  '*grant_skill', '*revoke_skill', '*grant_skill missing', '*revoke_skill missing',
  '*grant_skill 1skill', '*revoke_skill Upper', '*grant_skill "diplomacy"',
  '*grant_skill diplomacy extra', '*revoke_skill diplomacy [if count == 0]',
]) {
  test(`rejects invalid grant/revoke syntax or unknown skills: ${command}`, () => {
    assert.throws(() => parseStory(withEffects(command)), /Line 5, passage "start":/);
  });
}

test('grant and revoke are rejected before the title, in prose/choices, and after navigation', () => {
  for (const command of ['*grant_skill diplomacy', '*revoke_skill diplomacy']) {
    for (const body of [
      `${command}\n${passage}`,
      `*passage start\n${command}\n*title Start\nText.`,
      `${passage}\n${command}`,
      `${passage}\n*choice\n#Again -> start\n${command}`,
      `${passage}\n*continue start\n${command}`,
      `*passage start\n*title Start\n*show_if has_skill diplomacy\n${command}\nText.`,
      `${passage}\n\n*show_if lacks_skill diplomacy\nMore.\n\n${command}`,
    ]) {
      assert.throws(() => parseStory(definitions + body), /Effects must appear|immediately following source line/);
    }
  }
});

for (const condition of [
  'has_skill', 'lacks_skill', 'has_skill unknown', 'lacks_skill unknown',
  'has_skill "diplomacy"', 'has_skill 1skill', 'lacks_skill Upper',
  'has_skill diplomacy == true', 'has_skill diplomacy >= 1', 'has_skill diplomacy 1',
  'has_skill diplomacy && lacks_skill swordsmanship', '(has_skill diplomacy)',
  'has_skill (diplomacy)', '!has_skill diplomacy', 'lacks_skill diplomacy extra',
]) {
  test(`rejects malformed skill conditions in both contexts: ${condition}`, () => {
    assert.throws(() => parseStory(conditional(condition)), /passage "start":/);
    const choiceOnly = `${definitions}${passage}\n*choice\n#Optional -> start [if ${condition}]\n#Fallback -> start`;
    assert.throws(() => parseStory(choiceOnly), /passage "start":/);
  });
}

test('unknown skill references are rejected even in unreachable passages and unavailable choices', () => {
  for (const body of [
    '*grant_skill unknown\nText.',
    '*revoke_skill unknown\nText.',
    'Always.\n\n*show_if has_skill unknown\nHidden.',
    'Text.\n*choice\n#Hidden -> start [if has_skill unknown]\n#Fallback -> start',
  ]) {
    assert.throws(() => parseStory(`${definitions}${passage}\n*passage unreachable\n*title Other\n${body}`), /passage "unreachable": Unknown skill "unknown"/);
  }
});

test('new skill conditions retain the unconditional-choice fallback requirement', () => {
  for (const condition of ['has_skill diplomacy', 'lacks_skill diplomacy']) {
    assert.throws(() => parseStory(conditional(condition).replace('#Fallback -> fallback\n', '')), /requires at least one unconditional choice/);
  }
});

test('destinations are validated even when the player lacks the required skill', () => {
  assert.throws(() => parseStory(conditional('has_skill diplomacy').replace('Conditional -> target', 'Conditional -> missing')), /Missing destination "missing"/);
});

test('initial entry grants skills in acquisition order with no duplicates', () => {
  const story = parseStory(withEffects('*grant_skill diplomacy\n*grant_skill swordsmanship\n*grant_skill diplomacy'));
  const game = new Game(story);
  assert.deepEqual(game.state.skills, ['diplomacy', 'swordsmanship']);
  assert.deepEqual(story.passages[0]?.effects, [
    { kind: 'grant_skill', skillId: 'diplomacy' }, { kind: 'grant_skill', skillId: 'swordsmanship' }, { kind: 'grant_skill', skillId: 'diplomacy' },
  ]);
});

test('revoking an absent skill is harmless; revoke and regrant append at the end', () => {
  const game = new Game(parseStory(withEffects('*revoke_skill diplomacy\n*grant_skill diplomacy\n*grant_skill swordsmanship\n*revoke_skill diplomacy\n*grant_skill diplomacy\n*grant_skill diplomacy')));
  assert.deepEqual(game.state.skills, ['swordsmanship', 'diplomacy']);
});

for (const [condition, effects, eligible] of [
  ['has_skill diplomacy', '', false], ['lacks_skill diplomacy', '', true],
  ['has_skill diplomacy', '*grant_skill diplomacy', true], ['lacks_skill diplomacy', '*grant_skill diplomacy', false],
  ['has_skill diplomacy', '*grant_skill diplomacy\n*revoke_skill diplomacy', false],
  ['lacks_skill diplomacy', '*grant_skill diplomacy\n*revoke_skill diplomacy', true],
] as const) {
  test(`skill conditions use final committed entry skills: ${condition}, ${effects || 'none'}`, () => {
    const game = new Game(parseStory(conditional(condition, effects)));
    assert.deepEqual(game.visibleParagraphs.map(p => p.text), eligible ? ['Always.', 'Conditional prose.'] : ['Always.']);
    assert.deepEqual(game.availableChoices.map(c => c.label), eligible ? ['Conditional', 'Fallback'] : ['Fallback']);
    const before = game.state;
    for (let i = 0; i < 3; i++) {
      game.availableChoices; game.visibleParagraphs;
      assert.equal(game.state, before);
    }
  });
}

test('unavailable skill navigation is rejected before destination effects can alter any state', () => {
  const game = new Game(parseStory(conditional('has_skill swordsmanship')));
  const before = game.state;
  assert.throws(() => game.navigate('target'), /has no action/);
  assert.equal(game.state, before);
  assert.deepEqual(game.state.skills, []);
  assert.deepEqual(game.state.journal, []);
  game.navigate('fallback');
  assert.equal(game.state.passageId, 'fallback');
});

test('shared destinations permit any eligible skill condition or unconditional choice', () => {
  const source = conditional('has_skill swordsmanship').replace('#Fallback -> fallback', '#Absent -> target [if lacks_skill diplomacy]\n#Fallback -> fallback');
  const eligible = new Game(parseStory(source));
  eligible.navigate('target');
  assert.deepEqual(eligible.state.skills, ['diplomacy']);
  const blocked = new Game(parseStory(source.replace('lacks_skill diplomacy', 'has_skill diplomacy')));
  assert.throws(() => blocked.navigate('target'), /has no action/);
  const unconditional = new Game(parseStory(source.replace('#Fallback -> fallback', '#Fallback -> target')));
  unconditional.navigate('target');
  assert.equal(unconditional.state.passageId, 'target');
});

const cycle = `${definitions}*var count 0
*passage start
*title Start
*add count 1
*grant_skill diplomacy
*grant_skill swordsmanship
Count: \${count}.
*continue revoke
*passage revoke
*title Revoke
*revoke_skill diplomacy
Revoked.
*continue start`;

test('legitimate re-entry executes effects again while repeated reads/renders do not', () => {
  const game = new Game(parseStory(cycle));
  const before = game.state;
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(game.state.skills, ['diplomacy', 'swordsmanship']);
    assert.deepEqual(game.visibleParagraphs.map(p => interpolate(p.text, game.state.variables)), ['Count: 1.']);
    assert.deepEqual(game.availableChoices, []);
    assert.equal(game.state, before);
  }
  game.navigate('revoke');
  assert.deepEqual(game.state.skills, ['swordsmanship']);
  game.navigate('start');
  assert.equal(game.state.variables.count, 2);
  assert.deepEqual(game.state.skills, ['swordsmanship', 'diplomacy']);
  assert.deepEqual(before.skills, ['diplomacy', 'swordsmanship']);
});

test('separate games and previously committed acquired arrays are independent and immutable', () => {
  const story = parseStory(cycle);
  const first = new Game(story);
  const second = new Game(story);
  const before = first.state;
  first.navigate('revoke');
  assert.deepEqual(second.state.skills, ['diplomacy', 'swordsmanship']);
  assert.deepEqual(before.skills, second.state.skills);
  assert.notEqual(first.state.skills, before.skills);
  assert.notEqual(second.state.skills, before.skills);
  assert.throws(() => Array.prototype.push.call(first.state.skills, 'unknown'), TypeError);
  assert.equal(Reflect.set(first.state.skills, 0, 'unknown'), false);
  assert.equal(Reflect.set(first.state, 'skills', []), false);
  assert.deepEqual(JSON.parse(JSON.stringify(first.state)), first.state);
});

const failure = (effects: string) => `${definitions}*var huge 1e308\n*var count 0\n*passage start\n*title Start\n*grant_skill diplomacy\nStart.\n*choice\n#Risk -> risk\n#Prepare -> prepare\n*passage risk\n*title Risk\n${effects}\nRisk.\n*passage prepare\n*title Prepare\n*set huge 0\nPrepared.\n*continue start`;

for (const effects of [
  '*grant_skill swordsmanship\n*journal attempt "Attempt"\n*add huge 1e308',
  '*revoke_skill diplomacy\n*add count 1\n*journal attempt "Attempt"\n*add huge 1e308',
  '*journal attempt "Attempt"\n*grant_skill swordsmanship\n*add count 1\n*add huge 1e308',
  '*add huge 1e308\n*grant_skill swordsmanship\n*journal attempt "Attempt"',
]) {
  test(`mixed effects roll back completely: ${effects}`, () => {
    const game = new Game(parseStory(failure(effects)));
    const before = game.state;
    assert.throws(() => game.navigate('risk'), /non-finite/);
    assert.equal(game.state, before);
    assert.deepEqual(game.state.skills, ['diplomacy']);
    assert.deepEqual(game.state.journal, []);
    assert.equal(game.state.variables.count, 0);
  });
}

test('valid navigation and successful retry remain possible after failed skill entry', () => {
  const game = new Game(parseStory(failure('*grant_skill swordsmanship\n*journal attempt "Attempt"\n*add huge 1e308')));
  assert.throws(() => game.navigate('risk'), /non-finite/);
  game.navigate('prepare'); game.navigate('start'); game.navigate('risk');
  assert.deepEqual(game.state.skills, ['diplomacy', 'swordsmanship']);
  assert.deepEqual(game.state.journal.map(e => e.id), ['attempt']);
});

test('failed initial entry exposes no partially initialized skill collection', () => {
  const story = parseStory(`*var huge 1e308\n${withEffects('*grant_skill diplomacy\n*journal attempt "Attempt"\n*add huge 1e308')}`);
  let game: Game | undefined;
  assert.throws(() => { game = new Game(story); }, /non-finite/);
  assert.equal(game, undefined);
});

test('skill conditions and effects are frozen data', () => {
  const story = parseStory(conditional('has_skill diplomacy', '*grant_skill diplomacy'));
  assert.equal(Reflect.set(story.passages[0]!.effects[0]!, 'skillId', 'swordsmanship'), false);
  assert.equal(Reflect.set(story.passages[0]!.paragraphs[1]!.condition!, 'skillId', 'swordsmanship'), false);
  assert.equal(Reflect.set(story.passages[0]!.choices[0]!.condition!, 'operator', 'lacks_skill'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(story)), story);
});

test('the original example routes retain journal/chapter behavior and differ in acquired diplomacy', () => {
  const story = parseStory(readFileSync(new URL('../src/example.story', import.meta.url), 'utf8'));
  const messenger = new Game(story);
  assert.deepEqual(messenger.state.skills, ['composure']);
  messenger.navigate('messenger');
  assert.deepEqual(messenger.state.skills, ['composure', 'diplomacy']);
  messenger.navigate('council');
  assert.deepEqual(messenger.state.skills, ['diplomacy']);
  assert.ok(messenger.visibleParagraphs.some(p => p.text.includes('helps you choose your words')));
  assert.deepEqual(messenger.state.journal.map(e => e.id), ['arrived_city', 'met_messenger', 'met_council']);
  const direct = new Game(story);
  direct.navigate('council');
  assert.deepEqual(direct.state.skills, []);
  assert.ok(direct.visibleParagraphs.some(p => p.text.includes('Without diplomatic training')));
  assert.deepEqual(direct.state.journal.map(e => e.id), ['arrived_city', 'met_council']);
});
