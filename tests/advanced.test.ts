import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { parseStory } from '../src/story';
import { interpolate } from '../src/interpolate';
import { formattedParts } from '../src/format';
import { analyzeStory } from '../src/preflight';
import { loadCheckpoint } from '../src/storage';
const source = readFileSync('examples/advanced-authoring.story','utf8');
const story = parseStory(source);
function memory() { return { raw: null as string | null, writes: 0, fail: false, getItem() { return this.raw; }, setItem(_k: string, v: string) { this.writes++; if(this.fail) throw Error('Full'); this.raw=v; } }; }
function started() { const storage=memory(); const session=new GameSession(story,storage); session.newGame(()=>true);session.navigate('he');session.navigate('audience');return {storage,session}; }

test('capitalization is Unicode-aware, typed, read-only and single pass',()=>{
  const variables={name:'𐐨élise ß',n:3,b:true,input:'[b]${name} @{b x|y} {they}'};
  assert.equal(interpolate('$!{name} $!!{name} $!{n} $!!{b} ${input}',variables),'𐐀élise ß 𐐀ÉLISE SS 3 TRUE [b]${name} @{b x|y} {they}');
  assert.equal(variables.name,'𐐨élise ß');
  for(const value of ['$!!!{name}','$!name','$!{missing}','$!!{name']) assert.throws(()=>interpolate(value,variables));
});

test('inline branches resolve only selected authored text',()=>{
  assert.equal(interpolate('@{plural are ${n}|is ${missing}}',{plural:true,n:2}),'are 2');
  assert.equal(interpolate('@{plural are|is} ready.',{plural:false}),'is ready.');
  assert.equal(interpolate('{ordinary} @{plural ${input}|no}',{plural:true,input:'@{plural evil|bad}'}),'{ordinary} @{plural evil|bad}');
  for(const value of ['@{plural yes}','@{plural yes|no','@{plural a|b|c}','@{plural @{plural a|b}|c}']) assert.throws(()=>interpolate(value,{plural:true}));
});

test('nested conditional effects choose branches once in candidate order; narrative uses committed state',()=>{
  const game=new Game(parseStory('*var n 0\n*var yes true\n*passage a\n*title A\n*temp local false\n*if yes and not (n > 0)\n  *set yes false\n  *set local true\n  *if local\n    *add n 2\n*elseif n == 0\n  *add n 100\n*else\n  *add n 200\nAlways.\n\n*if yes or n == 2 and local\n  Visible.\n*else\n  Hidden.'));
  assert.equal(game.state.variables.n,2);assert.equal(game.variables.local,true);
  assert.deepEqual(game.visibleParagraphs.map(p=>p.text),['Always.','Visible.']);
});

test('pages, temp values, journal and rewards resume exactly; disabled choices and premature actions reject',()=>{
  const {storage,session}=started();const checkpoint=session.game!.checkpoint;const state=session.game!.state;
  assert.equal(session.game!.resumeContext!.temps.can_enter,true);assert.equal(state.inventory.letter,1);
  assert.throws(()=>session.navigate('road'));session.advancePage();
  const writes=storage.writes;const reopened=new GameSession(story,storage);assert.equal(storage.writes,writes);
  const game=reopened.continueGame();assert.deepEqual(game.state,state);assert.deepEqual(game.checkpoint,checkpoint);
  assert.equal(game.resumeContext!.page,1);assert.equal(game.variables.can_enter,true);
  assert.equal(JSON.parse(storage.raw!).formatVersion,3);reopened.advancePage();
  assert.equal(game.visibleChoices.length,4);assert.equal(game.availableChoices.length,3);
  assert.throws(()=>reopened.navigate('purchase'));reopened.navigate('fatal');
  const dead=new GameSession(story,storage);dead.continueGame();dead.retryAfterDeath();
  assert.deepEqual(dead.game!.state,state);assert.deepEqual(dead.game!.checkpoint,checkpoint);assert.equal(dead.game!.resumeContext!.page,0);
  dead.advancePage();dead.advancePage();dead.navigate('explanation');
  assert.equal(dead.game!.variables.can_enter,undefined);assert.equal(dead.game!.variables.remembered,true);
});

test('empty conditional pages skip; repeated entry resets temps; failures preserve context',()=>{
  const parsed=parseStory('*var flag false\n*passage a\n*title A\n*temp n 0\n*add n 1\nFirst.\n*page_break\n*if flag\n  Hidden.\n*page_break\nLast.\n*continue a');
  const game=new Game(parsed);assert.equal(game.variables.n,1);game.advancePage();assert.equal(game.resumeContext!.page,2);
  game.navigate('a');assert.equal(game.variables.n,1);assert.equal(game.resumeContext!.page,0);
  const bad=parseStory('*var n 1e308\n*passage a\n*title A\nStart.\n*continue b\n*passage b\n*title B\n*temp t 0\n*add t 1\n*add n 1e308\nFail.');
  const before=new Game(bad);assert.throws(()=>before.navigate('b'));assert.equal(before.passage.id,'a');assert.equal(before.variables.t,undefined);
});

for(const [label,mutate] of Object.entries({page:(d:any)=>{d.context.page=99;},temp:(d:any)=>{d.context.temps.can_enter='yes';},extra:(d:any)=>{d.context.temps.extra=true;},missing:(d:any)=>{delete d.context;}}))test('invalid context is untouched: '+label,()=>{
 const {storage,session}=started();session.advancePage();const d=JSON.parse(storage.raw!);mutate(d);storage.raw=JSON.stringify(d);const raw=storage.raw;const writes=storage.writes;
 assert.equal(loadCheckpoint(storage,story).status,'invalid');assert.equal(new GameSession(story,storage).startup.status,'invalid');assert.equal(storage.raw,raw);assert.equal(storage.writes,writes);
});

for(const body of ['*if true\nUnindented.','*else\n  Text.','*if unknown\n  Text.','*temp name 1\n*temp name 2\nText.','Text.\n*temp late true','Text.\n*page_break','Text.\n*page_break\n*page_break\nMore.','Text.\n*if flag\n  *set flag false','[b]Unclosed.','[i]Wrong[/b]','@{flag yes|no','*comment'])test('advanced parser rejects malformed content: '+body,()=>{
 assert.throws(()=>parseStory('*var flag true\n*passage a\n*title A\n'+body),/Line/);
});

test('safe formatting validates tags and preflight sees only enabled routes',()=>{
 assert.doesNotThrow(()=>formattedParts('[b]Bold [i]both[/i][/b]'));
 const report=analyzeStory(story);assert.equal(report.diagnostics.filter(d=>d.severity==='error').length,0);
 assert.equal(report.diagnostics.some(d=>d.code==='ENTRY_FAILURE' && d.passageId==='purchase'),false);
});

test('comments preserve paragraph and choice boundaries; complete if/else narrative is usable',()=>{
 const parsed=parseStory('*comment declarations\n*var flag true\n*passage a\n*title A\n*if flag\n  First\n  *comment a note\n  continued.\n*else\n  Other.\n*choice\n*comment menu\n#End -> b\n*passage b\n*title B\nEnd.');
 assert.deepEqual(new Game(parsed).visibleParagraphs.map(p=>p.text),['First continued.']);
});

test('compound precedence is not then and then or, with strict typing',()=>{
 for(const [condition,expected] of [['a or b and c',true],['(a or b) and c',false],['not (a or b) or not c',true]] as const){
  const game=new Game(parseStory('*var a true\n*var b false\n*var c false\n*passage x\n*title X\nAlways.\n\n*show_if '+condition+'\nSelected.'));
  assert.equal(game.visibleParagraphs.length,expected?2:1);
 }
 for(const condition of ['a == 1','not missing','(a and b','a xor b']) assert.throws(()=>parseStory('*var a true\n*var b false\n*passage x\n*title X\nAlways.\n\n*show_if '+condition+'\nText.'));
});

test('formatting cannot cross inline alternatives; temp declarations cannot precede checkpoint',()=>{
 for(const body of ['@{flag [b]yes|no[/b]}','*temp t 0\n*checkpoint\nText.','*if flag\n  One.\n   Misindented.']) assert.throws(()=>parseStory('*var flag true\n*passage a\n*title A\n'+body));
});

test('selectable conditions become enabled and hidden guards remain distinct',()=>{
 const rich=new Game(parseStory(source.replace('*var gold 5','*var gold 20')));rich.navigate('he');rich.navigate('audience');while(rich.canAdvancePage)rich.advancePage();
 assert.equal(rich.availableChoices.some(c=>c.destinationId==='purchase'),true);rich.navigate('purchase');assert.equal(rich.state.inventory.letter,undefined);
 const stranger=new Game(parseStory(source.replace('*var reputation 20','*var reputation 0')));stranger.navigate('he');stranger.navigate('audience');while(stranger.canAdvancePage)stranger.advancePage();
 assert.equal(stranger.visibleChoices.some(c=>c.destinationId==='explanation'),false);assert.equal(stranger.visibleChoices.some(c=>c.destinationId==='purchase'),true);assert.throws(()=>stranger.navigate('purchase'));
});

test('failed page save preserves prior bytes and recovered pages; unsaved page actions never write',()=>{
 const {storage,session}=started();const raw=storage.raw;storage.fail=true;session.advancePage();assert.equal(storage.raw,raw);assert.equal(session.game!.resumeContext!.page,1);assert.match(session.notice!.message,/could not be saved/);
 assert.equal(new GameSession(story,storage).continueGame().resumeContext!.page,0);
 session.playWithoutSaving(()=>true);session.navigate('he');session.navigate('audience');const writes=storage.writes;session.advancePage();assert.equal(storage.writes,writes);assert.equal(storage.raw,raw);
});
