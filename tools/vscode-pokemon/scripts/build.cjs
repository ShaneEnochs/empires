const { buildSync } = require('esbuild');
const path = require('node:path');
buildSync({ entryPoints: [path.resolve(__dirname, '../../../src/story-source.ts')], outfile: path.resolve(__dirname, '../dist/parser.cjs'), bundle: true, platform: 'node', format: 'cjs', target: 'node18' });
