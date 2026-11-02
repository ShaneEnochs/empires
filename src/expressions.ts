import type { Condition, ComparisonOperator, Variables, VariableValue, SkillDefinition, ItemDefinition, PokemonDefinition } from './types';
export function syntaxError(message: string, line: number, passageId?: string): Error {
  return new Error(`Line ${line}${passageId ? `, passage "${passageId}"` : ''}: ${message}`);
}

export function id(value: string, context: string, line: number, passageId?: string): string {
  if (!/^[a-z][a-z0-9_-]*$/.test(value)) {
    throw syntaxError(`${context} must match [a-z][a-z0-9_-]*; received "${value}".`, line, passageId);
  }
  return value;
}

export function literal(value: string, line: number, passageId?: string): VariableValue {
  if (value === 'true' || value === 'false') return value === 'true';
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
    throw syntaxError('Numeric literals must be finite.', line, passageId);
  }
  if (value.startsWith('"')) {
    try { return JSON.parse(value) as string; } catch { /* Report the source location below. */ }
  }
  throw syntaxError('Expected a finite number, true, false, or a double-quoted string literal.', line, passageId);
}

export function knownSkill(value: string, skills: readonly SkillDefinition[], line: number, passageId?: string): string {
  const skillId = id(value, 'Skill ID', line, passageId);
  if (!skills.some(skill => skill.id === skillId)) throw syntaxError(`Unknown skill "${skillId}".`, line, passageId);
  return skillId;
}

export function knownItem(value: string, items: readonly ItemDefinition[], line: number, passageId?: string): string {
  const itemId = id(value, 'Item ID', line, passageId);
  if (!items.some(item => item.id === itemId)) throw syntaxError(`Unknown item "${itemId}".`, line, passageId);
  return itemId;
}

export function quantityLiteral(source: string, allowZero: boolean, line: number, passageId?: string): number {
  const quantity = /^(?:0|[1-9]\d*)$/.test(source) ? Number(source) : NaN;
  if (!Number.isSafeInteger(quantity) || quantity < (allowZero ? 0 : 1)) {
    throw syntaxError(`Item quantities must be ${allowZero ? 'nonnegative' : 'positive'} safe integer literals in decimal digits.`, line, passageId);
  }
  return quantity;
}

export function knownPokemon(value: string, pokemon: readonly PokemonDefinition[], line: number, passageId?: string): string {
  const pokemonId = id(value, 'Pokémon ID', line, passageId);
  if (!pokemon.some(member => member.id === pokemonId)) throw syntaxError(`Unknown Pokémon "${pokemonId}".`, line, passageId);
  return pokemonId;
}

function parseAtom(source: string, variables: Variables, skills: readonly SkillDefinition[], items: readonly ItemDefinition[], line: number, passageId: string, pokemon: readonly PokemonDefinition[] = []): Condition {
  const count = /^item_count\s+(\S+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/.exec(source);
  if (count) {
    const itemId = knownItem(count[1]!, items, line, passageId);
    const value = quantityLiteral(count[3]!.trim(), true, line, passageId);
    return Object.freeze({ operator: count[2] as ComparisonOperator, itemId, value });
  }
  const parts = /^(\S+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/.exec(source);
  if (!parts) {
    const member = /^(has_pokemon|lacks_pokemon)\s+(\S+)$/.exec(source);
    if (member) return Object.freeze({ operator: member[1] as 'has_pokemon' | 'lacks_pokemon', pokemonId: knownPokemon(member[2]!, pokemon, line, passageId) });
    const skill = /^(has_skill|lacks_skill)\s+(\S+)$/.exec(source);
    if (skill) {
      const skillId = knownSkill(skill[2]!, skills, line, passageId);
      return Object.freeze({ operator: skill[1] as 'has_skill' | 'lacks_skill', skillId });
    }
    const item = /^(has_item|lacks_item)\s+(\S+)$/.exec(source);
    if (item) {
      const itemId = knownItem(item[2]!, items, line, passageId);
      return Object.freeze({ operator: item[1] as 'has_item' | 'lacks_item', itemId });
    }
    throw syntaxError('Expected a variable comparison, has_skill/lacks_skill id, has_item/lacks_item id, or item_count id comparison.', line, passageId);
  }
  const variable = id(parts[1]!, 'Condition variable', line, passageId);
  if (!Object.hasOwn(variables, variable)) throw syntaxError(`Undeclared variable "${variable}".`, line, passageId);
  const operator = parts[2] as ComparisonOperator;
  const value = literal(parts[3]!.trim(), line, passageId);
  if (typeof variables[variable] !== typeof value) {
    throw syntaxError('Condition operands must have compatible types.', line, passageId);
  }
  if (operator === '==' || operator === '!=') return Object.freeze({ variable, operator, value });
  if (typeof value !== 'number') throw syntaxError('Ordering comparisons require numbers.', line, passageId);
  return Object.freeze({ variable, operator, value });
}


export function parseCondition(source: string, variables: Variables, skills: readonly SkillDefinition[], items: readonly ItemDefinition[], line: number, passageId: string, pokemon: readonly PokemonDefinition[] = []): Condition {
  const tokens = source.match(/"(?:[^"\\]|\\.)*"|>=|<=|==|!=|[()]|[^\s()]+/g) ?? [];
  let position = 0;
  function expression(level: number): Condition {
    if (level < 2) {
      let left = expression(level + 1);
      const operator = level === 0 ? 'or' : 'and';
      while (tokens[position] === operator) { position++; left = Object.freeze({ operator, left, right: expression(level + 1) }); }
      return left;
    }
    if (tokens[position] === 'not') { position++; return Object.freeze({ operator: 'not', operand: expression(2) }); }
    if (tokens[position] === '(') {
      position++; const result = expression(0);
      if (tokens[position++] !== ')') throw syntaxError('Missing closing condition parenthesis.', line, passageId);
      return result;
    }
    const start = position;
    while (position < tokens.length && !['and','or',')','('].includes(tokens[position]!)) position++;
    const atom = tokens.slice(start, position).join(' ');
    if (Object.hasOwn(variables, atom) && typeof variables[atom] === 'boolean') return Object.freeze({ variable: atom, operator: '==', value: true });
    return parseAtom(atom, variables, skills, items, line, passageId, pokemon);
  }
  const result = expression(0);
  if (position !== tokens.length) throw syntaxError('Unexpected condition token: ' + tokens[position], line, passageId);
  return result;
}
