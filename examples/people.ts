import { parsePeople } from '../src/people';
import data from '../content/harbor-practice.people.json' with { type: 'json' };
const definitions = parsePeople;
export const centerVisitPeople = definitions([
  {
    id: 'messenger', name: 'The messenger',
    description: 'A messenger at the Pokémon Center who asks you to listen to the center and gives you two supply tokens.',
    discoveryEvents: ['met_messenger'],
  },
  {
    id: 'center_clerk', name: 'The center clerk',
    description: 'The clerk who collects your gate token and the five-coin entry fee at the center hall.',
    discoveryEvents: ['met_center'],
  },
]);

export const harborPracticePeople = parsePeople(data);
