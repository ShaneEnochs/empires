import { parseCondition } from './expressions';
import { evaluateCondition } from './condition';
import type { Variables } from './types';

const pronounVariables = {
  they: 'pronouns_subject',
  them: 'pronouns_object',
  their: 'pronouns_possessive',
  theirs: 'pronouns_possessive_pronoun',
  themself: 'pronouns_reflexive',
} as const;

/** One read-only substitution pass; inserted values are never evaluated again. */
export function substitute(text: string, variables: Variables): string {
  for (const match of text.matchAll(/\$!+/g)) {
    if (match[0].length > 3 || text[match.index + match[0].length] !== '{') throw Error('Invalid capitalization interpolation.');
  }
  return text.replace(/\$(!!|!)?\{([^}]*)(\}|$)|\{(they|them|their|theirs|themself|They|Them|Their|Theirs|Themself)\}/g,
    (placeholder, capitalization: string | undefined, name: string | undefined, closing: string | undefined, token: string | undefined) => {
      if (token !== undefined) {
        const variable = pronounVariables[token.toLowerCase() as keyof typeof pronounVariables];
        if (!Object.hasOwn(variables, variable) || typeof variables[variable] !== 'string') {
          throw new Error(`Pronoun token "${placeholder}" requires declared string variable "${variable}".`);
        }
        const value = variables[variable] as string;
        return token[0] === token[0]!.toUpperCase() ? value.charAt(0).toUpperCase() + value.slice(1) : value;
      }
      if (closing !== '}') throw new Error(`Unclosed variable interpolation "${placeholder}".`);
      if (!Object.hasOwn(variables, name!)) throw new Error(`Undeclared variable "${name}".`);
      const value = String(variables[name!]);
      const characters = Array.from(value);
      return capitalization === '!!' ? value.toUpperCase() : capitalization === '!' ? (characters.shift()?.toUpperCase() ?? '') + characters.join('') : value;
    });
}

/** Inline branches contain authored text; player substitutions happen only afterward. */
export function selectInline(text: string, variables: Variables, validate = false, validateBranch?: (text: string) => void): string {
  let result = ''; let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('@{', cursor);
    if (start < 0) return result + text.slice(cursor);
    result += text.slice(cursor, start);
    let depth = 1; let end = start + 2;
    for (; end < text.length && depth; end++) { if (text[end] === '{') depth++; if (text[end] === '}') depth--; }
    if (depth) throw new Error('Unclosed inline conditional.');
    const body = text.slice(start + 2, end - 1);
    if (body.includes('@{')) throw new Error('Nested inline conditionals are not supported.');
    const match = /^([a-z][a-z0-9_-]*)\s+([^|]*)\|([^|]*)$/.exec(body);
    if (!match) throw new Error('Expected @{boolean true text|false text}.');
    const condition = parseCondition(match[1]!, variables, [], [], 1, 'inline');
    if (typeof variables[match[1]!] !== 'boolean') throw new Error('Inline condition requires a boolean variable.');
    if (validate) { substitute(match[2]!, variables); substitute(match[3]!, variables); validateBranch?.(match[2]!); validateBranch?.(match[3]!); }
    result += evaluateCondition(condition, { passageId: '', variables, skills: [], party: [], inventory: {}, journal: [] }) ? match[2]! : match[3]!;
    cursor = end;
  }
  return result;
}
export function interpolate(text: string, variables: Variables): string {
  return substitute(selectInline(text, variables), variables);
}
