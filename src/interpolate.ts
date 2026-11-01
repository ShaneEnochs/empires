import type { Variables } from './types';

const pronounVariables = {
  they: 'pronouns_subject',
  them: 'pronouns_object',
  their: 'pronouns_possessive',
  theirs: 'pronouns_possessive_pronoun',
  themself: 'pronouns_reflexive',
} as const;

/** One read-only substitution pass; inserted values are never evaluated again. */
export function interpolate(text: string, variables: Variables): string {
  return text.replace(/\$\{([^}]*)(\}|$)|\{(they|them|their|theirs|themself|They|Them|Their|Theirs|Themself)\}/g,
    (placeholder, name: string | undefined, closing: string | undefined, token: string | undefined) => {
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
      return String(variables[name!]);
    });
}
