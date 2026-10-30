import { interpolate } from './interpolate';
import type { Choice, Passage, PassageEffect, Story, VariableValue } from './types';

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

/** Parse and validate the entire story before any passage can be entered. */
export function parseStory(source: string): Story {
  const passages: Passage[] = [];
  const ids = new Set<string>();
  const initialVariables: Record<string, VariableValue> = {};
  const references: { destinationId: string; passageId: string; line: number }[] = [];
  let current: {
    id: string; line: number; title?: string; text: string[];
    choices: Choice[]; effects: PassageEffect[]; continueTo?: string;
  } | undefined;
  let paragraph: string[] = [];
  let action: 'choice' | 'continue' | undefined;
  let actionLine = 1;

  function flushParagraph(): void {
    if (current && paragraph.length > 0) current.text.push(paragraph.join(' '));
    paragraph = [];
  }

  function finishPassage(): void {
    if (!current) return;
    flushParagraph();
    if (current.title === undefined) {
      throw syntaxError('Passage requires exactly one *title.', current.line, current.id);
    }
    if (current.text.length === 0) {
      throw syntaxError('Passage requires at least one narrative paragraph.', current.line, current.id);
    }
    if (action === 'choice' && current.choices.length === 0) {
      throw syntaxError('*choice requires at least one choice.', actionLine, current.id);
    }
    passages.push(Object.freeze({
      id: current.id, title: current.title, text: Object.freeze(current.text),
      effects: Object.freeze(current.effects),
      choices: Object.freeze(current.choices),
      ...(current.continueTo === undefined ? {} : { continueTo: current.continueTo }),
    }));
  }

  const lines = source.split(/\r\n|\n|\r/);
  for (const [index, raw] of lines.entries()) {
    const line = index + 1;
    const text = raw.trim();
    if (text === '') {
      flushParagraph();
      continue;
    }

    if (text.startsWith('*')) {
      const directive = text.split(/\s/, 1)[0]!;
      const argument = text.slice(directive.length).trim();
      if (directive === '*var' || directive === '*set' || directive === '*add') {
        if (directive === '*var' && current) {
          throw syntaxError('*var declarations must precede the first passage.', line, current.id);
        }
        if (directive !== '*var' && (!current || current.title === undefined || current.text.length > 0 || paragraph.length > 0 || action !== undefined)) {
          throw syntaxError('Effects must appear after *title and before the first narrative paragraph.', line, current?.id);
        }
        const parts = /^(\S+)\s+(.+)$/.exec(argument);
        if (!parts) throw syntaxError(`${directive} requires a variable name and literal value.`, line, current?.id);
        const variable = id(parts[1]!, 'Variable name', line, current?.id);
        const value = literal(parts[2]!, line, current?.id);
        if (directive === '*var') {
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
        current = { id: passageId, line, text: [], choices: [], effects: [] };
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
      const parts = text.startsWith('#') ? text.slice(1).split('->') : [];
      const label = parts[0]?.trim();
      const destination = parts[1]?.trim();
      if (parts.length !== 2 || !label || !destination) {
        throw syntaxError('Expected #Nonempty choice label -> destination_id.', line, current.id);
      }
      const destinationId = id(destination, 'Choice destination', line, current.id);
      current.choices.push(Object.freeze({ label, destinationId }));
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
  finishPassage();

  const first = passages[0];
  if (!first) throw syntaxError('Story requires at least one *passage.', 1);
  for (const reference of references) {
    if (!ids.has(reference.destinationId)) {
      throw syntaxError(`Missing destination "${reference.destinationId}".`, reference.line, reference.passageId);
    }
  }
  return Object.freeze({ startId: first.id, initialVariables: Object.freeze(initialVariables), passages: Object.freeze(passages) });
}
