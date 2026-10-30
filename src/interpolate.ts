import type { Variables } from './types';

/** A read-only, single substitution pass; inserted strings are never evaluated. */
export function interpolate(text: string, variables: Variables): string {
  return text.replace(/\$\{([^}]*)(\}|$)/g, (placeholder, name: string, closing: string) => {
    if (closing !== '}') throw new Error(`Unclosed variable interpolation "${placeholder}".`);
    if (!Object.hasOwn(variables, name)) throw new Error(`Undeclared variable "${name}".`);
    return String(variables[name]);
  });
}
