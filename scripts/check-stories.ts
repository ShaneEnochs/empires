import { readFileSync } from 'node:fs';
import { analyzeStory } from '../src/preflight';
import type { PreflightDiagnostic } from '../src/preflight';
import { parseStory } from '../src/story';
import type { Story } from '../src/types';

const files = process.argv.slice(2);
if (files.length === 0) files.push('src/example.story', 'examples/provincial-crisis.story');
const totals = { error: 0, warning: 0, information: 0 };
for (const file of files) {
  console.log('\n' + file);
  if (!file.endsWith('.story')) {
    console.log('  ERROR FILE_ERROR: Expected a .story filename. Action: Provide a UTF-8 .story file.');
    totals.error++;
    continue;
  }
  let source: string;
  try { source = readFileSync(file, 'utf8'); } catch (error) {
    console.log('  ERROR FILE_ERROR: ' + (error instanceof Error ? error.message : String(error)));
    console.log('    Action: Check the filename and file permissions.');
    totals.error++;
    continue;
  }
  let story: Story;
  try { story = parseStory(source); } catch (error) {
    console.log('  ERROR PARSE_ERROR: ' + (error instanceof Error ? error.message : String(error)));
    console.log('    Action: Fix the reported syntax or reference, then rerun preflight.');
    totals.error++;
    continue;
  }
  const report = analyzeStory(story);
  const counts = { error: 0, warning: 0, information: 0 };
  const groups = new Map<string, PreflightDiagnostic[]>();
  for (const diagnostic of report.diagnostics) {
    counts[diagnostic.severity]++;
    totals[diagnostic.severity]++;
    const key = diagnostic.passageId ?? '(story)';
    const entries = groups.get(key) ?? [];
    entries.push(diagnostic);
    groups.set(key, entries);
  }
  for (const [passage, diagnostics] of groups) {
    console.log('  ' + passage);
    for (const diagnostic of diagnostics) {
      console.log('    ' + diagnostic.severity.toUpperCase() + ' ' + diagnostic.code + ': ' + diagnostic.message);
      console.log('      Action: ' + diagnostic.action);
      if (diagnostic.route !== undefined) {
        console.log('      Route: ' + diagnostic.route.map(step =>
          (step.input === undefined ? '' : '[input_text ' + JSON.stringify(step.input) + '] -> ') + step.passageId).join(' -> '));
      }
    }
  }
  console.log('  ' + counts.error + ' errors, ' + counts.warning + ' warnings, ' + counts.information
    + ' information; ' + report.exploredRoutes + ' route prefixes replayed.');
}
console.log('\nTotal: ' + totals.error + ' errors, ' + totals.warning + ' warnings, ' + totals.information + ' information.');
process.exitCode = totals.error > 0 ? 1 : 0;
