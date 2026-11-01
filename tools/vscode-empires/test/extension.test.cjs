const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { problem, register } = require('../src/diagnostics.cjs');
const valid = '*passage start\n*title Start\nHello.';
test('language, snippets and tasks retain their registration', () => {
  const manifest = require('../package.json');
  assert.deepEqual(manifest.contributes.languages[0].extensions, ['.story']);
  assert.equal(manifest.contributes.languages[0].id, 'empires-story');
  const snippets = JSON.parse(fs.readFileSync(path.join(__dirname,'../../../.vscode/empires.code-snippets'),'utf8'));
  assert.equal(Object.keys(snippets).length, 20);
  for (const entry of Object.values(snippets)) { assert.equal(entry.scope, 'empires-story,plaintext'); assert.ok(entry.prefix.startsWith('emp-')); }
  assert.equal(require('../../../.vscode/tasks.json').tasks.length, 3);
});
test('parser errors preserve their message, passage and zero-based source line', () => {
  assert.equal(problem(valid, 3), undefined);
  for (const [source, line] of [
    [valid+'\n*unknown', 3],
    ['*var score 0\n'+valid+'\n*continue missing', 4],
    ['*var score 0\n*passage start\n*title Start\n*set other 1\nHello.',3],
    ['*var score 0\n'+valid+'\n*choice\n#Go -> start [if score && true]\n#Stay -> start',5],
  ]) {
    const result=problem(source, source.split('\n').length);
    assert.equal(result.line,line); assert.match(result.message,/Line \d+, passage "start":/);
  }
  assert.equal(problem('*passage bad',0).line, undefined);
});
test('open/save validation isolates files and correction/close clear diagnostics', () => {
  const values = new Map(), handlers = {};
  const doc = (uri,text) => ({ uri, languageId:'empires-story', getText:()=>text, lineCount:text.split('\n').length,
    lineAt:n=>({text:text.split('\n')[n],firstNonWhitespaceCharacterIndex:0}) });
  const a=doc('a',valid+'\n*unknown'), b=doc('b',valid+'\n*unknown');
  const collection={set:(key,value)=>values.set(key,value),delete:key=>values.delete(key),dispose(){}};
  const api={languages:{createDiagnosticCollection:()=>collection},window:{createOutputChannel:()=>({appendLine(){},dispose(){}})},
    Range:class {constructor(...args){this.args=args;}},Diagnostic:class{constructor(range,message,severity){Object.assign(this,{range,message,severity});}},DiagnosticSeverity:{Error:0},
    workspace:{textDocuments:[a,b],...Object.fromEntries(['Open','Save','Close'].map(name=>['onDid'+name+'TextDocument',fn=>{handlers[name]=fn;return{dispose(){}};}]))}};
  register(api,{subscriptions:[]}); assert.equal(values.size,2);
  assert.deepEqual(values.get('a')[0].range.args,[3,0,3,8]);
  handlers.Save(doc('a',valid));assert.equal(values.has('a'),false);assert.equal(values.has('b'),true);
  handlers.Close(b);assert.equal(values.size,0);
  handlers.Open(a);assert.equal(values.size,1);
});
test('real TextMate tokenization covers directives, choices, conditions, strings and interpolation', async () => {
  const { Registry, parseRawGrammar }=require('vscode-textmate');
  const onig=require('vscode-oniguruma');
  const wasm=fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset,wasm.byteOffset+wasm.byteLength));
  const grammarSource=fs.readFileSync(path.join(__dirname,'../syntaxes/empires.tmLanguage.json'),'utf8');
  const registry=new Registry({onigLib:Promise.resolve({createOnigScanner:p=>new onig.OnigScanner(p),createOnigString:s=>new onig.OnigString(s)}),loadGrammar:async()=>parseRawGrammar(grammarSource,'grammar.json')});
  const grammar=await registry.loadGrammar('source.empires-story');
  const tokens=text=>grammar.tokenizeLine(text).tokens;
  for(const directive of 'var stat skill item chapter passage title choice continue input_text checkpoint journal set add grant_skill revoke_skill add_item remove_item death show_if'.split(' ')) {
    assert.ok(tokens('*'+directive+' value').some(token=>token.scopes.includes('keyword.control.directive.empires')),directive);
  }
  assert.ok(!tokens('*unknown value').some(token=>token.scopes.includes('keyword.control.directive.empires')));
  for(const scope of ['string.unquoted.choice.empires','entity.name.label.empires','keyword.control.condition.empires','keyword.operator.comparison.empires','constant.numeric.empires'])
    assert.ok(tokens('#Go -> destination [if score >= 2]').some(token=>token.scopes.includes(scope)),scope);
  for(const scope of ['string.quoted.double.empires','variable.other.interpolated.empires'])
    assert.ok(tokens('*journal event "Hello ${name}"').some(token=>token.scopes.includes(scope)),scope);
  assert.deepEqual(tokens('Ordinary narrative.')[0].scopes,['source.empires-story']);
});
