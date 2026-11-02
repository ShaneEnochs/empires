import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
// Compile the unchanged reader against a private regression catalog. No runtime
// switch, public test route, or fixture story is included in the published build.
export default defineConfig({
 resolve: { alias: [
   { find: /^\.\/catalog$/, replacement: fileURLToPath(new URL('./e2e/fixtures/catalog.ts', import.meta.url)) },
   { find: /^\.\/title-page$/, replacement: fileURLToPath(new URL('./e2e/fixtures/title-page.ts', import.meta.url)) },
 ] },
 build: { outDir: 'regression-dist' },
});
