import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync('dist/index.html', 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
assert.ok(assets.some(path => path.endsWith('.js')), 'Missing JavaScript asset');
assert.ok(assets.some(path => path.endsWith('.css')), 'Missing CSS asset');
for (const path of assets) {
  assert.ok(path.startsWith('/empires/assets/'), 'Incorrect Pages asset path: ' + path);
  assert.ok(existsSync(resolve('dist', path.slice('/empires/'.length))), 'Missing built asset: ' + path);
}
console.log('Pages JavaScript and CSS paths verified under /empires/.');

assert.equal(existsSync('dist/author.html'), false, 'Author preview must not be published');
for (const asset of assets.filter(path => path.endsWith('.js'))) {
  const bundle = readFileSync(resolve('dist', asset.slice('/empires/'.length)), 'utf8');
  assert.ok(!bundle.includes('Local story preview'), 'Author code must not be bundled in Pages');
}
