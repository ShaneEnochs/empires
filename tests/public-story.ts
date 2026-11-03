import { readFileSync } from 'node:fs';
import { assembleStorySources, publicStoryFiles } from '../src/story-source';
export const publicSources = () => publicStoryFiles.map(path => ({path, text:readFileSync(path,'utf8')}));
export const publicStorySource = () => assembleStorySources(publicSources());
