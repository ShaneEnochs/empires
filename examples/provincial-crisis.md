# Provincial Crisis playtest

[Story](provincial-crisis.story) · [Integration tests](../tests/provincial-crisis.test.ts)

## Premise and scope

You are the provincial envoy at Bellwether as a rising river closes the roads.
Public grain has traveled under private seals. You must decide whether to build
a civic agreement, put rationing under armed control, or evacuate the lower town.

The adventure has **30 passages, three chapters, three endings, and two death
passages**. Authority measures official standing; public trust measures local
support. These are not moral scores. Dispatch coins, grain, evidence, a temporary
commission, and practical knowledge constrain which promises you can keep.
Naming is optional; the default envoy is Mara Vale.

This is an independent authoring example, not the story loaded by the browser.
No application loader, selection UI, scripting feature, or engine fix was added.
`src/example.story`, its IDs/checkpoints, and all save constants remain unchanged.

## Parse and test without replacing the shipped story

From the repository root, after `npm ci`:

```sh
node --import tsx --test tests/provincial-crisis.test.ts
npm test
```

The first command runs the 20 focused story tests. The second includes them
alongside the original Node suite. To parse only:

```sh
node --import tsx --input-type=module <<'JS'
import { readFileSync } from 'node:fs';
import { parseStory } from './src/story.ts';
const story = parseStory(readFileSync('examples/provincial-crisis.story', 'utf8'));
console.log(story.passages.length); // 30; the whole story has been validated.
JS
```

Read the story alongside the explicit `Game.navigate` / `Game.submitText` routes
in the tests. They exercise the same parser, conditions, entry effects, and
checkpoint APIs as the browser, without changing its entry point. The existing
19 Chromium cases continue testing the shipped story.

## Representative complete routes

Common prefix: `quayside → background → chosen_background → briefing`, where the
background is `river_background` or `clerk_background`. For optional naming, take
`choose_name` from `quayside`, call
`submitText(name)`, then choose the background. Route B uses “Éléonore O'Brien”
with outer spaces to verify normalization and later interpolation.

All paths below start **after briefing**, and each has a complete test:

- **A — direct order, clerk:** `night_council → guard_offer → ending_guard`.
  Bypasses naming and all field content.
- **B — investigate and build public confidence, surveyor:**
  `mill_yard → copied_records → levee_path → flood_survey → night_council
  → evidence_hearing → ending_compact`.
- **C — negotiate and buy local knowledge, clerk:**
  `mill_yard → sworn_testimony → levee_path → hired_pilot → night_council
  → evidence_hearing → ending_compact`.
- **D — feed people and share power, surveyor:**
  `depot_queue → bonded_offer → depot_queue → relief_kitchen → night_council
  → popular_assembly → ending_compact`. Declining the bond and returning does
  not duplicate the queue's journal event.
- **E — accept debt and provision barges, surveyor:**
  `depot_queue → bonded_offer → merchant_bond → night_council → evacuation_plan
  → grain_barges → ending_refuge`.
- **F — skip fieldwork and hire crews, surveyor:**
  `night_council → evacuation_plan → paid_ferries → ending_refuge`.
- **G — retain evidence while rescuing people, surveyor:**
  `mill_yard → copied_records → levee_path → flood_survey → night_council
  → evacuation_plan → guided_evacuation → ending_refuge`.
- **H — requisition another village's food, surveyor:**
  `cart_seizure → night_council → guard_offer → ending_guard`.
- **I — refuse military terms after requesting help, clerk:**
  `night_council → guard_offer → evacuation_plan → paid_ferries → ending_refuge`.
  The request's trust cost survives the refusal.
- **J — back armed distribution with harvest debt, clerk:**
  `depot_queue → bonded_offer → merchant_bond → night_council → guard_offer
  → ending_guard`. The guarantee becomes a preferred claim.

Expected final balances (zero grain means its property is absent):

| Route | Settlement | Authority | Trust | Coins | Grain | Other consequences |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| A | Guard rationing | 4 | -3 | 4 | 4 | Diplomacy; no evidence or current soundings |
| B | Civic compact | 5 | 4 | 2 | 2 | Attested accounts, channel knowledge, current soundings, accepted name |
| C | Civic compact | 5 | 4 | 3 | 2 | Attested accounts, diplomacy, channel knowledge, current soundings |
| D | Civic compact | 2 | 6 | 4 | 0 | Kitchen delegates represented; no criminal proof |
| E | River refuge | 4 | 2 | 1 | 5 | Harvest debt survives rescue; no current soundings |
| F | River refuge | 3 | 2 | 1 | 6 | Paid crews supply current soundings |
| G | River refuge | 4 | 3 | 2 | 6 | Accounts kept dry for a later inquiry |
| H | Guard rationing | 5 | -4 | 4 | 6 | Extra grain came from another village |
| I | River refuge | 4 | 0 | 1 | 6 | Diplomacy and newly acquired channel knowledge |
| J | Guard rationing | 5 | -4 | 1 | 7 | Merchant claim has priority under the ration order |

All end states have lost the emergency writ and commission at sunset. The tests
assert complete variables, acquired skills, item balances, Character values,
resolved name text, and journal event order, not merely the destination ID.
The documented routes plus the two recovery tests visit every passage.

### Gate and budget checks

Additional complete tests cover these variations:

- A clerk can take `mill_yard → sworn_testimony → levee_path → night_council
  → evidence_hearing → ending_compact` with only one trust. Diplomacy makes the
  shared compact destination eligible; the trust-based choice remains hidden.
- A surveyor cannot select protected testimony. Paid accounts plus fresh
  watermarks instead provide sufficient trust for the same compact destination.
- On route E, one remaining coin cannot hire ferry crews. Taking
  `guided_evacuation` also cannot reach `ending_refuge` without current soundings;
  `grain_barges → ending_refuge` remains safe.
- After kitchen relief, `night_council → evacuation_plan → grain_barges
  → ending_refuge` spends the smallest six-sack reserve exactly: four for crews,
  two for camp, leaving no grain property and five trust.

Briefing issues six sacks; fieldwork can spend at most two before council. The
reserve boat adds two at council, so at least six remain on every legitimate
arrival. Consequently the unconditional barge option can always pay both its
four-sack price and the camp's two-sack allocation. Paid accounts, pilot fees,
ferry fares, and merchant advances are guarded by quantity choices. No route
requires silently clamping resources or entering an unavoidable failed effect.

The journal starts with `arrival`, the chosen background, and `mandate_briefed`.
Field events follow, then `council_open`, then the chosen hearing/transport and
ending events. Chapters remain static. The returned depot visit retains one
original `depot_queue` record under The River; old records are never rewritten.

## Checkpoints and recovery

- **`briefing`**, before fieldwork: its pre-entry snapshot contains the accepted
  name, background skill, four coins, and writ. Entry adds one authority and six
  sacks and records the mandate. It does not ask for the name again on retry.
- **`night_council`**, before the final decision: the snapshot includes the actual
  field costs, evidence, flags, skills, and journal. Entry adds two sacks, removes
  the writ, revokes the commission, and records the council. Recovery replays
  those effects once from the snapshot, rather than adding two more sacks.

Day hazard: from briefing take `mill_yard → copied_records → levee_path
→ sluice_death`. Try Again returns to briefing, refunding the copying fee and
removing the acquired evidence/death record. The test repeats this three times,
then completes the requisition/guard route.

Night hazard: follow B as far as `night_council`, then take
`evacuation_plan → night_breach`. Try Again retains the name, evidence, spent
coins, and original journal, and restores the eight-sack council reserve. After
three cycles, the test completes the civic compact instead. Both hazards are
explicitly warned about and have safe alternatives.

Fresh `Game` restoration and `GameSession` JSON round trips test these boundaries.
Session tests use a new injected **memory-only** storage object each time.
They verify no writes on retry/Continue, complete ordered state reconstruction,
and successful onward play. These isolated-memory playtests now pass the actual
Provincial Crisis identity explicitly. Stage 9A adds `tests/story-identity.test.ts`, which uses
`{ storyId: 'provincial-crisis', storyRevision: 1 }` and tests both real stories
against one shared fake storage. It verifies independent keys, full restoration,
revision rejection, failed-write isolation, and death/retry without save writes.
Run all routes and identity tests with `npm test`; no browser storage is used.
Never connect this fixture to the shipped app's save slot. Explicit configuration
supports its separate key. Stage 9B makes this existing story playable from the
browser library, using that same explicit identity and the existing renderer.
`e2e/library.spec.ts` covers naming, independent saves, the civic ending, both
checkpoint recoveries, and a failed automatic save. Run `npm run build` and
`npm run test:e2e` to exercise that production browser flow.

## Authoring findings and priorities

No parser or runtime defect blocked this story. Complete tests pass without any
engine changes. These distinctions matter:

- **Authored-story traps:** a repeatable resource-granting hub would farm supplies;
  returning to the expiring-writ checkpoint normally would try to consume its
  writ twice. Quantitative effects therefore sit on forward-only boundaries.
  Only the journal-only queue has a return visit. Similarly, recording a chosen
  name before optional input would preserve the old name in history; the arrival
  record is anonymous and named records begin after input.
  Route review also caught a guard option that kitchen-relief characters could
  never qualify for after the authority cost. The final assembly offers compact
  or evacuation instead; mutually exclusive field outcomes have no unreachable
  ending prose. These are authoring corrections, not missing engine features.
- **Convenient but nonessential:** a choice supports one condition. Evidence plus
  diplomacy/trust, and channel knowledge plus fresh soundings, therefore use
  separate hearing/preparation passages. Shared destinations provide alternative
  eligibility without a general expression language. These scenes make the
  negotiation and safety checks visible rather than hiding them in a formula.
- **A genuinely unsupported mechanic:** an arbitrary “one sack per N refugees”
  calculation or variable-driven transfer cannot be expressed directly with
  literal item operands. Finite preauthored tiers are possible; this story uses
  explicit fixed cohorts and allocations. Dynamic logistics would need a
  separately specified feature, not an invented command in this example.
- **Deployment:** Stages 9A–9B provide explicit save identity and a static browser
  library. This story uses its own `provincial-crisis` ID, never `empires-example`.

Recommended future work, ranked by practical importance:

Explicit save identity and static browser selection are now implemented in
Stages 9A–9B. Remaining authoring priorities:

1. **Author preflight diagnostics for re-entry and resource budgets.** A parse
   proves syntax/references, not that every authored resource promise is payable.
   The explicit routes here currently provide that assurance.
2. **Evaluate small compound-condition ergonomics against real author use.**
   They could reduce passage count, but the current staged decisions work;
   avoid jumping to a general expression evaluator.
3. **Consider computed quantities only for an actual logistics requirement.**
   They are not necessary for this adventure and would enlarge validation scope.

These remaining authoring improvements are findings for later planning, not
implemented features.
