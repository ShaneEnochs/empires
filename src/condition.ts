import type { ChoiceCondition, Variables } from './types';

/** Compare validated data with committed variables without executing effects. */
export function evaluateCondition(condition: ChoiceCondition, variables: Variables): boolean {
  if (!Object.hasOwn(variables, condition.variable)) return false;
  const actual = variables[condition.variable];
  switch (condition.operator) {
    case '==': return actual === condition.value;
    case '!=': return actual !== condition.value;
    case '>': return typeof actual === 'number' && actual > condition.value;
    case '>=': return typeof actual === 'number' && actual >= condition.value;
    case '<': return typeof actual === 'number' && actual < condition.value;
    case '<=': return typeof actual === 'number' && actual <= condition.value;
  }
}
