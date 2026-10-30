import { interpolate } from './interpolate';
import type { Choice, Condition, NarrativeParagraph, Passage, PassageEffect, SkillDefinition, Story, Variables, VariableValue } from './types';

function syntaxError(message: string, line: number, passageId?: string): Error {
  return new Error(`Line ${line}${passageId ? `, passage "${passageId}"` : ''}: ${message}`);
}

function id(value: string, context: string, line: number, passageId?: string): string {
  if (!/^[a-z][a-z0-9_-]*$/.test(value)) {
    throw syntaxError(`${context} must match [a-z][a-z0-9_-]*; received "${value}".`, line, passageId);
  }
  return value;
}

function literal(value: string, line: number, passageId?: string): VariableValue {
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

function knownSkill(value: string, skills: readonly SkillDefinition[], line: number, passageId?: string): string {
  const skillId = id(value, 'Skill ID', line, passageId);
  if (!skills.some(skill => skill.id === skillId)) throw syntaxError(`Unknown skill "${skillId}".`, line, passageId);
  return skillId;
}

function parseCondition(source: string, variables: Variables, skills: readonly SkillDefinition[], line: number, passageId: string): Condition {
  const parts = /^(\S+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/.exec(source);
  if (!parts) {
    const skill = /^(has_skill|lacks_skill)\s+(\S+)$/.exec(source);
    if (skill) {
      const skillId = knownSkill(skill[2]!, skills, line, passageId);
      return Object.freeze({ operator: skill[1] as 'has_skill' | 'lacks_skill', skillId });
    }
    throw syntaxError('Expected variable operator literal (==, !=, >, >=, <, <=), has_skill id, or lacks_skill id.', line, passageId);
  }
  const variable = id(parts[1]!, 'Condition variable', line, passageId);
  if (!Object.hasOwn(variables, variable)) throw syntaxError(`Undeclared variable "${variable}".`, line, passageId);
  const operator = parts[2] as Exclude<Condition['operator'], 'has_skill' | 'lacks_skill'>;
  const value = literal(parts[3]!.trim(), line, passageId);
  if (typeof variables[variable] !== typeof value) {
    throw syntaxError('Condition operands must have compatible types.', line, passageId);
  }
  if (operator === '==' || operator === '!=') return Object.freeze({ variable, operator, value });
  if (typeof value !== 'number') throw syntaxError('Ordering comparisons require numbers.', line, passageId);
  return Object.freeze({ variable, operator, value });
}

/** Parse and validate the entire story before any passage can be entered. */
export function parseStory(source: string): Story {
  const passages: Passage[] = [];
  const ids = new Set<string>();
  const journalIds = new Set<string>();
  let chapter = 'Prologue';
  let pendingChapterLine: number | undefined;
  const initialVariables: Record<string, VariableValue> = {};
  const skills: SkillDefinition[] = [];
  const references: { destinationId: string; passageId: string; line: number }[] = [];
  let current: {
    id: string; chapter: string; line: number; title?: string; paragraphs: NarrativeParagraph[];
    choices: Choice[]; effects: PassageEffect[]; continueTo?: string;
  } | undefined;
  let paragraph: string[] = [];
  let paragraphCondition: Condition | undefined;
  let showIfLine = 1;
  let action: 'choice' | 'continue' | undefined;
  let actionLine = 1;

  function flushParagraph(): void {
    if (current && paragraph.length > 0) {
      current.paragraphs.push(Object.freeze({
        text: paragraph.join(' '),
        ...(paragraphCondition === undefined ? {} : { condition: paragraphCondition }),
      }));
    }
    paragraph = [];
    paragraphCondition = undefined;
  }

  function finishPassage(): void {
    if (!current) return;
    if (paragraphCondition !== undefined && paragraph.length === 0) {
      throw syntaxError('*show_if requires a narrative paragraph on the immediately following source line.', showIfLine, current.id);
    }
    flushParagraph();
    if (current.title === undefined) {
      throw syntaxError('Passage requires exactly one *title.', current.line, current.id);
    }
    if (current.paragraphs.length === 0) {
      throw syntaxError('Passage requires at least one narrative paragraph.', current.line, current.id);
    }
    if (!current.paragraphs.some(paragraph => paragraph.condition === undefined)) {
      throw syntaxError('Passage requires at least one unconditional narrative paragraph.', current.line, current.id);
    }
    if (action === 'choice' && current.choices.length === 0) {
      throw syntaxError('*choice requires at least one choice.', actionLine, current.id);
    }
    if (current.choices.some(choice => choice.condition !== undefined)
      && !current.choices.some(choice => choice.condition === undefined)) {
      throw syntaxError('A conditional choice block requires at least one unconditional choice.', actionLine, current.id);
    }
    passages.push(Object.freeze({
      id: current.id, chapter: current.chapter, title: current.title, paragraphs: Object.freeze(current.paragraphs),
      effects: Object.freeze(current.effects),
      choices: Object.freeze(current.choices),
      ...(current.continueTo === undefined ? {} : { continueTo: current.continueTo }),
    }));
  }

  const lines = source.split(/\r\n|\n|\r/);
  for (const [index, raw] of lines.entries()) {
    const line = index + 1;
    const text = raw.trim();
    if (paragraphCondition !== undefined && paragraph.length === 0 && (text === '' || text.startsWith('*'))) {
      throw syntaxError('*show_if requires a narrative paragraph on the immediately following source line.', line, current?.id);
    }
    if (text === '') {
      flushParagraph();
      continue;
    }

    if (text.startsWith('*')) {
      const directive = text.split(/\s/, 1)[0]!;
      const argument = text.slice(directive.length).trim();
      if (directive === '*chapter') {
        if (pendingChapterLine !== undefined) {
          throw syntaxError('Each *chapter must be followed by at least one passage.', pendingChapterLine);
        }
        if (argument === '') throw syntaxError('*chapter requires a nonempty label.', line);
        finishPassage();
        current = undefined;
        action = undefined;
        chapter = argument;
        pendingChapterLine = line;
        continue;
      }
      if (directive === '*show_if') {
        if (!current || current.title === undefined || action !== undefined || paragraph.length > 0) {
          throw syntaxError('*show_if must be at a paragraph boundary after the title and effects, before navigation.', line, current?.id);
        }
        paragraphCondition = parseCondition(argument, initialVariables, skills, line, current.id);
        showIfLine = line;
        continue;
      }
      if (directive === '*grant_skill' || directive === '*revoke_skill') {
        if (!current || current.title === undefined || current.paragraphs.length > 0 || paragraph.length > 0 || action !== undefined) {
          throw syntaxError('Effects must appear after *title and before the first narrative paragraph.', line, current?.id);
        }
        const skillId = knownSkill(argument, skills, line, current.id);
        current.effects.push(Object.freeze({ kind: directive === '*grant_skill' ? 'grant_skill' : 'revoke_skill', skillId }));
        continue;
      }
      if (directive === '*var' || directive === '*skill' || directive === '*set' || directive === '*add' || directive === '*journal') {
        const declaration = directive === '*var' || directive === '*skill';
        if (declaration && (current || passages.length > 0 || pendingChapterLine !== undefined)) {
          throw syntaxError(`${directive} declarations must precede the first passage and all chapter declarations.`, line, current?.id);
        }
        if (!declaration && (!current || current.title === undefined || current.paragraphs.length > 0 || paragraph.length > 0 || action !== undefined)) {
          throw syntaxError('Effects must appear after *title and before the first narrative paragraph.', line, current?.id);
        }
        const parts = /^(\S+)\s+(.+)$/.exec(argument);
        if (!parts) throw syntaxError(`${directive} requires an identifier and literal value.`, line, current?.id);
        const variable = id(parts[1]!, directive === '*journal' ? 'Journal event ID' : directive === '*skill' ? 'Skill ID' : 'Variable name', line, current?.id);
        const value = literal(parts[2]!, line, current?.id);
        if (directive === '*skill') {
          if (typeof value !== 'string' || value.trim() === '') throw syntaxError('*skill requires a nonempty double-quoted display name.', line);
          if (skills.some(skill => skill.id === variable)) throw syntaxError(`Duplicate skill ID "${variable}".`, line);
          skills.push(Object.freeze({ id: variable, name: value }));
        } else if (directive === '*journal') {
          if (typeof value !== 'string') throw syntaxError('*journal requires a double-quoted string literal.', line, current?.id);
          if (journalIds.has(variable)) throw syntaxError(`Duplicate journal event ID "${variable}".`, line, current?.id);
          try { interpolate(value, initialVariables); } catch (error) {
            throw syntaxError((error as Error).message, line, current?.id);
          }
          journalIds.add(variable);
          current!.effects.push(Object.freeze({ kind: 'journal', id: variable, text: value }));
        } else if (directive === '*var') {
          if (Object.hasOwn(initialVariables, variable)) throw syntaxError(`Duplicate variable "${variable}".`, line);
          initialVariables[variable] = value;
        } else {
          if (!Object.hasOwn(initialVariables, variable)) throw syntaxError(`Undeclared variable "${variable}".`, line, current?.id);
          if (directive === '*add') {
            if (typeof initialVariables[variable] !== 'number' || typeof value !== 'number') {
              throw syntaxError('*add requires a numeric variable and numeric literal.', line, current?.id);
            }
            current!.effects.push(Object.freeze({ kind: 'add', variable, value }));
          } else {
            if (typeof initialVariables[variable] !== typeof value) {
              throw syntaxError(`*set must preserve the declared type of "${variable}".`, line, current?.id);
            }
            current!.effects.push(Object.freeze({ kind: 'set', variable, value }));
          }
        }
        continue;
      }
      if (directive === '*passage') {
        finishPassage();
        const passageId = id(argument, 'Passage ID', line);
        if (ids.has(passageId)) throw syntaxError(`Duplicate passage ID "${passageId}".`, line, passageId);
        ids.add(passageId);
        current = { id: passageId, chapter, line, paragraphs: [], choices: [], effects: [] };
        pendingChapterLine = undefined;
        action = undefined;
        continue;
      }
      if (!['*title', '*choice', '*continue'].includes(directive)) {
        throw syntaxError(`Unsupported directive "${directive}".`, line, current?.id);
      }
      if (!current) throw syntaxError('Expected *passage before any content.', line);
      if (action !== undefined) {
        throw syntaxError('Choices and Continue must conclude the passage; no further directives are allowed.', line, current.id);
      }
      flushParagraph();
      if (directive === '*title') {
        if (current.title !== undefined) throw syntaxError('Duplicate *title.', line, current.id);
        if (argument === '') throw syntaxError('*title requires non-empty text.', line, current.id);
        current.title = argument;
      } else if (directive === '*choice') {
        if (argument !== '') throw syntaxError('*choice takes no arguments.', line, current.id);
        action = 'choice';
        actionLine = line;
      } else {
        current.continueTo = id(argument, 'Continue destination', line, current.id);
        references.push({ destinationId: current.continueTo, passageId: current.id, line });
        action = 'continue';
      }
      continue;
    }

    if (!current) throw syntaxError('Expected *passage before any content.', line);
    if (action === 'choice') {
      const arrow = text.indexOf('->');
      const label = text.startsWith('#') && arrow !== -1 ? text.slice(1, arrow).trim() : '';
      const destination = arrow !== -1 ? text.slice(arrow + 2).trim() : '';
      const bracket = destination.indexOf('[');
      const target = (bracket === -1 ? destination : destination.slice(0, bracket)).trim();
      if (!label || !target || target.includes('->')) {
        throw syntaxError('Expected #Nonempty choice label -> destination_id.', line, current.id);
      }
      if (/\[if\b/i.test(label)) throw syntaxError('Choice conditions must follow the destination.', line, current.id);
      const destinationId = id(target, 'Choice destination', line, current.id);
      let condition: Condition | undefined;
      if (bracket !== -1) {
        const wrapper = /^\[if\s+(.+)\]$/.exec(destination.slice(bracket));
        if (!wrapper) throw syntaxError('Expected a single [if condition] suffix.', line, current.id);
        condition = parseCondition(wrapper[1]!, initialVariables, skills, line, current.id);
      }
      current.choices.push(Object.freeze({ label, destinationId, ...(condition === undefined ? {} : { condition }) }));
      references.push({ destinationId, passageId: current.id, line });
    } else if (action === 'continue') {
      throw syntaxError('Continue must conclude the passage; no further prose or choices are allowed.', line, current.id);
    } else {
      try { interpolate(text, initialVariables); } catch (error) {
        throw syntaxError((error as Error).message, line, current.id);
      }
      paragraph.push(text);
    }
  }
  if (pendingChapterLine !== undefined) throw syntaxError('Each *chapter must be followed by at least one passage.', pendingChapterLine);
  finishPassage();

  const first = passages[0];
  if (!first) throw syntaxError('Story requires at least one *passage.', 1);
  for (const reference of references) {
    if (!ids.has(reference.destinationId)) {
      throw syntaxError(`Missing destination "${reference.destinationId}".`, reference.line, reference.passageId);
    }
  }
  return Object.freeze({ startId: first.id, initialVariables: Object.freeze(initialVariables), skills: Object.freeze(skills), passages: Object.freeze(passages) });
}
