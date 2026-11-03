import { assembleStorySources, publicStoryFiles } from './story-source';
// Eager raw imports: all chapters are available before parsing; no runtime loading.
const sources = import.meta.glob<string>('../content/aurelian-league/*.story', {
  query: '?raw', import: 'default', eager: true,
});
export const aurelianSources = Object.freeze(publicStoryFiles.map(path => {
  const text = sources['../' + path];
  if (text === undefined) throw new Error('Missing public story source: ' + path);
  return Object.freeze({ path, text });
}));
export const aurelianLeagueSource = assembleStorySources(aurelianSources);
