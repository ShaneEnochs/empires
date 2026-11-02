import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseStory } from '../src/story';
import { Game } from '../src/game';
import { GameSession } from '../src/session';
import { validateSnapshot } from '../src/snapshot';
import { loadCheckpoint, saveProgress } from '../src/storage';
import { analyzeStory } from '../src/preflight';
const definitions = '*var nickname "Pip"\n'+Array.from({length:7},(_,i)=>`*pokemon p${i} "Piplup"`).join('\n');
const source = `${definitions}
*var count 0
*skill care "Care"
*item ball "Poké Ball"
*passage start
*title Start
Begin.
*choice
#Join -> join
#Fill -> full
#Fail -> fail
*passage join
*title Join
*checkpoint
*add_pokemon p0 nickname
*set nickname "Later"
*add_pokemon p0 nickname
*add_pokemon p1
One partner, then another individual of the same species.
*if has_pokemon p0 and lacks_pokemon p2
  Your partners are here.

*choice
#Remove -> remove
#Recover -> death
*passage remove
*title Remove
*remove_pokemon p0
*remove_pokemon p0
*add_pokemon p0
Removed and reacquired.
*continue death
*passage death
*title Recovery Test
*remove_pokemon p1
End of this private recovery fixture.
*death
*passage full
*title Full
${Array.from({length:6},(_,i)=>`*add_pokemon p${i}`).join('\n')}
Six partners.
*continue seventh
*passage seventh
*title Seventh
*set count 4
*grant_skill care
*add_item ball 1
*journal rejected "Must roll back."
*remove_pokemon p6
*add_pokemon p6
Over capacity.
*passage fail
*title Fail
*checkpoint
*add_pokemon p0
*remove_item ball 1
Not enough inventory.
`;
const story = parseStory(source);
class Memory {
 raw: string|null = null; writes=0;
 getItem(){return this.raw;}
 setItem(_key:string,value:string){this.raw=value;this.writes++;}
}
test('definitions and party are deeply frozen, ordered and identify individuals independently of species',()=>{
 assert.equal(story.pokemon.length,7);assert.ok(Object.isFrozen(story.pokemon));assert.ok(Object.isFrozen(story.pokemon[0]));
 const game=new Game(story);assert.equal(game.state.party.length,0);game.navigate('join');
 assert.deepEqual(game.state.party,[{id:'p0',species:'Piplup',nickname:'Pip'},{id:'p1',species:'Piplup'}]);
 assert.equal(game.state.variables.nickname,'Later');assert.ok(Object.isFrozen(game.state.party));assert.ok(Object.isFrozen(game.state.party[0]));
 assert.equal(game.visibleParagraphs.length,2);
 game.navigate('remove');assert.deepEqual(game.state.party.map(p=>p.id),['p1','p0']);assert.equal(game.state.party[1]!.nickname,undefined);
});
test('six is allowed; seventh rolls back every candidate field and checkpoint',()=>{
 const game=new Game(story);game.navigate('full');const before=game.state,checkpoint=game.checkpoint;
 for(let i=0;i<2;i++){assert.throws(()=>game.navigate('seventh'),/party is full/);assert.equal(game.state,before);assert.equal(game.checkpoint,checkpoint);}
 assert.equal(game.state.party.length,6);assert.deepEqual(game.state.skills,[]);assert.deepEqual(game.state.inventory,{});assert.deepEqual(game.state.journal,[]);
});
test('a later unrelated effect failure also rolls back earlier party changes and checkpoint replacement',()=>{
 const game=new Game(story),before=game.state,checkpoint=game.checkpoint;
 assert.throws(()=>game.navigate('fail'),/insufficient inventory/);assert.equal(game.state,before);assert.equal(game.checkpoint,checkpoint);
});
test('membership conditions use source-order candidate effects and enforce navigation',()=>{
 const s=parseStory(`*pokemon companion "Eevee"
*passage start
*title Start
*add_pokemon companion
*if has_pokemon companion
  *remove_pokemon companion
Ready.

*show_if lacks_pokemon companion
Absent.

*choice
#Unavailable -> end [if has_pokemon companion]
#Wait -> start
*passage end
*title End
Finished.`);
 const game=new Game(s);assert.equal(game.state.party.length,0);assert.equal(game.visibleParagraphs.length,2);assert.equal(game.availableChoices.length,1);assert.throws(()=>game.navigate('end'),/no action/);
});
test('Continue preserves exact party without entry effects; recovery replays complete pre-entry party',()=>{
 const memory=new Memory(),session=new GameSession(story,memory);session.newGame(()=>true);session.navigate('join');
 const expected=session.game!.state,checkpoint=session.game!.checkpoint,raw=memory.raw,writes=memory.writes;
 const reopened=new GameSession(story,memory);assert.equal(reopened.startup.status,'ready');assert.deepEqual(reopened.continueGame().state,expected);assert.equal(memory.writes,writes);assert.equal(memory.raw,raw);
 reopened.navigate('death');assert.equal(reopened.game!.state.party.length,1);reopened.retryAfterDeath();assert.deepEqual(reopened.game!.state,expected);assert.deepEqual(reopened.game!.checkpoint,checkpoint);
 reopened.navigate('death');reopened.retryAfterDeath();assert.deepEqual(reopened.game!.state.party,expected.party);
});
for(const invalid of [
 '*pokemon bad ""','*pokemon Bad "Piplup"','*pokemon p0 "Another"',
 '*pokemon bad 4','*pokemon bad "Piplup" trailing',
])test('rejects invalid definition: '+invalid,()=>assert.throws(()=>parseStory(definitions+'\n'+invalid+'\n*passage start\n*title Start\nReady.')));
for(const invalid of [
 '*add_pokemon missing','*remove_pokemon missing','*add_pokemon p0 missing','*add_pokemon p0 count',
 '*add_pokemon p0 nickname extra','*remove_pokemon p0 nickname','*pokemon later "Eevee"',
 '*add_pokemon','*add_pokemon p0 local',
])test('rejects invalid party command: '+invalid,()=>assert.throws(()=>parseStory(definitions+'\n*var count 0\n*passage start\n*title Start\n*temp local "Draft"\n'+invalid+'\nReady.')));
for(const condition of ['has_pokemon missing','lacks_pokemon bad_id','has_pokemon p0 == true'])test('validates party conditions even in hidden passages: '+condition,()=>assert.throws(()=>parseStory(definitions+'\n*passage start\n*title Start\nReady.\n*show_if '+condition+'\nHidden.')));
const malformed: Record<string,(state:any)=>void>={
 missing:s=>{delete s.party;},nonarray:s=>{s.party={};},null:s=>{s.party=null;},unknown:s=>{s.party=[{id:'absent',species:'Piplup'}];},
 species:s=>{s.party[0].species='Eevee';},duplicate:s=>{s.party.push(s.party[0]);},extra:s=>{s.party[0].hp=10;},
 missingSpecies:s=>{delete s.party[0].species;},nicknameType:s=>{s.party[0].nickname=1;},emptyNickname:s=>{s.party[0].nickname='';},
 untrimmed:s=>{s.party[0].nickname=' Pip ';},controls:s=>{s.party[0].nickname='P\nip';},overlong:s=>{s.party[0].nickname='a'.repeat(81);},
 overflow:s=>{s.party=Array.from({length:7},(_,i)=>({id:`p${i}`,species:'Piplup'}));},
 sparse:s=>{s.party=new Array(2);},arrayProperty:s=>{s.party.extra=1;},
 inherited:s=>{s.party[0]=Object.create(s.party[0]);},
 accessor:s=>{Object.defineProperty(s.party[0],'nickname',{enumerable:true,get(){throw Error('Accessor executed');}});},
};
for(const [name,mutate] of Object.entries(malformed))test('rejects malformed saved party: '+name,()=>{
 const game=new Game(story);game.navigate('join');const snapshot=JSON.parse(JSON.stringify({state:game.state}));mutate(snapshot.state);
 assert.throws(()=>validateSnapshot(snapshot,story));
 if(!['accessor','inherited','arrayProperty','sparse'].includes(name)){
  const memory=new Memory();assert.ok(saveProgress(memory,story,game.state,game.checkpoint).ok);
  const raw=JSON.parse(memory.raw!);raw.currentState=snapshot.state;memory.raw=JSON.stringify(raw);assert.equal(loadCheckpoint(memory,story).status,'invalid');
 }
});
test('preflight reports a full-party transition failure through the real engine',()=>assert.ok(analyzeStory(story).diagnostics.some(d=>d.severity==='error'&&/party is full/.test(d.message))));
test('obsolete schema versions are rejected without changing saved bytes',()=>{
 for(const version of [1,2,3]){const memory=new Memory();memory.raw=JSON.stringify({formatVersion:version,storyId:'aurelian-league',storyRevision:1,checkpoint:new Game(story).checkpoint});const raw=memory.raw;assert.equal(loadCheckpoint(memory,story).status,'invalid');assert.equal(memory.raw,raw);assert.equal(memory.writes,0);}
});
test('all starter and pronoun paths commit one partner, keep trainer identity and restore without duplication',()=>{
 const publicStory=parseStory(readFileSync('content/aurelian-league.story','utf8'));
 for(const pronoun of ['he','she','they'])for(const species of ['charmander','chikorita','piplup'])for(const nickname of [undefined,'  Pip 周  ']){
  const storage=new Memory(),session=new GameSession(publicStory,storage);session.newGame(()=>true);
  session.advancePage();session.advancePage();session.navigate('name');session.submitText('  Ari  ');session.navigate(pronoun);
  session.navigate('lucia_chat');session.navigate('open_deck');session.navigate('rail');session.navigate('dock_approach');
  session.navigate('arrival');session.navigate('starters');
  for(const examine of ['charmander','chikorita','piplup']){session.navigate('examine_'+examine);session.navigate('starters');assert.deepEqual(session.game!.state.party,[]);}
  session.navigate('examine_'+species);session.navigate('choose_'+species);
  if(nickname){session.navigate('nickname');session.submitText(nickname);}else session.navigate('join');
  const state=session.game!.state;assert.equal(state.party.length,1);assert.equal(state.party[0]!.id,'starter_'+species);assert.equal(state.party[0]!.nickname,nickname?.trim());assert.equal(state.variables.trainer_name,'Ari');assert.equal(state.variables.pronouns_subject,pronoun);assert.equal(state.variables.use_plural_verbs,pronoun==='they');
  const reopen=new GameSession(publicStory,storage);assert.deepEqual(reopen.continueGame().state,state);reopen.game!.restoreCheckpoint();assert.deepEqual(reopen.game!.state,state);
 }
});
test('page saves and a checkpoint already containing Pokémon preserve order/nicknames through reload and recovery',()=>{
 const paged=parseStory(`${definitions}
*passage start
*title Start
*add_pokemon p0 nickname
Your first partner joins.
*continue camp
*passage camp
*title Camp
*checkpoint
*temp inspected false
*add_pokemon p1
*set nickname "Changed"
*set inspected true
You pause with both companions.
*page_break
The next page has no new entry effects.
*continue death
*passage death
*title Recovery
*remove_pokemon p0
*remove_pokemon p1
The recovery fixture ends here.
*death`);
 const memory=new Memory(),session=new GameSession(paged,memory);session.newGame(()=>true);session.navigate('camp');
 assert.deepEqual(session.game!.checkpoint.state.party,[{id:'p0',species:'Piplup',nickname:'Pip'}]);
 const expected=session.game!.state;session.advancePage();assert.equal(JSON.parse(memory.raw!).formatVersion,5);
 const reopened=new GameSession(paged,memory);reopened.continueGame();assert.deepEqual(reopened.game!.state,expected);assert.equal(reopened.game!.resumeContext!.page,1);assert.equal(reopened.game!.resumeContext!.temps.inspected,true);
 reopened.navigate('death');assert.equal(reopened.game!.state.party.length,0);reopened.retryAfterDeath();assert.deepEqual(reopened.game!.state,expected);assert.equal(reopened.game!.resumeContext!.page,0);
});
