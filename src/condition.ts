import type { Condition, GameState } from './types';

/** Check validated conditions against committed state without executing effects. */
export function evaluateCondition(condition: Condition, state: GameState): boolean {
  if ('skillId' in condition) {
    const acquired = state.skills.includes(condition.skillId);
    return condition.operator === 'has_skill' ? acquired : !acquired;
  }
  if ('itemId' in condition && !('value' in condition)) {
    const owned = Object.hasOwn(state.inventory, condition.itemId) && state.inventory[condition.itemId]! > 0;
    return condition.operator === 'has_item' ? owned : !owned;
  }
  if ('variable' in condition && !Object.hasOwn(state.variables, condition.variable)) return false;
  const actual = 'itemId' in condition
    ? (Object.hasOwn(state.inventory, condition.itemId) ? state.inventory[condition.itemId]! : 0)
    : state.variables[condition.variable];
  switch (condition.operator) {
    case '==': return actual === condition.value;
    case '!=': return actual !== condition.value;
    case '>': return typeof actual === 'number' && actual > condition.value;
    case '>=': return typeof actual === 'number' && actual >= condition.value;
    case '<': return typeof actual === 'number' && actual < condition.value;
    case '<=': return typeof actual === 'number' && actual <= condition.value;
  }
}
