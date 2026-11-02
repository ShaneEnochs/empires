import source from '../../examples/harbor-practice.story?raw';
import { harborPracticePeople } from '../../examples/people';
import { titlePage } from './title-page';
export const storyCatalog = Object.freeze([Object.freeze({
 id: 'harbor-practice', title: titlePage.title, description: titlePage.description, source,
 identity: Object.freeze({storyId:'harbor-practice',storyRevision:1}), people:harborPracticePeople,
})]);
