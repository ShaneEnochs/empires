import type { Condition, GameState } from './types';

/** Check validated conditions against committed state without executing effects. */
export function evaluateCondition(condition: Condition, state: GameState): boolean {
  if ('skillId' in condition) {
    const acquired = state.skills.includes(condition.skillId);
    return condition.operator === 'has_skill' ? acquired : !acquired;
  }
  const { variables } = state;
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
