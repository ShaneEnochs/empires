import type { Choice, Passage, Story } from './types';

function object(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function fields(value: Record<string, unknown>, allowed: string[], context: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${context}: unknown field "${key}".`);
  }
}

function string(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context} must be a non-empty string.`);
  }
  return value;
}

function id(value: unknown, context: string): string {
  const result = string(value, context);
  if (!/^[a-z][a-z0-9_-]*$/.test(result)) {
    throw new Error(`${context} must match [a-z][a-z0-9_-]*.`);
  }
  return result;
}

/** Validate the entire story before any passage can be entered. */
export function parseStory(source: string): Story {
  const data = object(JSON.parse(source), 'Story');
  fields(data, ['startId', 'passages'], 'Story');
  const startId = id(data.startId, 'Story startId');
  if (!Array.isArray(data.passages) || data.passages.length === 0) {
    throw new Error('Story passages must be a non-empty array.');
  }

  const ids = new Set<string>();
  const passages = data.passages.map((value: unknown): Passage => {
    const entry = object(value, 'Passage');
    fields(entry, ['id', 'title', 'text', 'choices', 'continueTo'], 'Passage');
    const passageId = id(entry.id, 'Passage id');
    if (ids.has(passageId)) throw new Error(`Duplicate passage ID "${passageId}".`);
    ids.add(passageId);

    const title = string(entry.title, `Passage "${passageId}" title`);
    if (!Array.isArray(entry.text) || entry.text.length === 0) {
      throw new Error(`Passage "${passageId}" text must be a non-empty array.`);
    }
    const text = entry.text.map((paragraph: unknown) => string(paragraph, `Passage "${passageId}" paragraph`));
    if (!Array.isArray(entry.choices)) {
      throw new Error(`Passage "${passageId}" choices must be an array.`);
    }
    const choices = entry.choices.map((value: unknown): Choice => {
      const choice = object(value, `Passage "${passageId}" choice`);
      fields(choice, ['label', 'destinationId'], `Passage "${passageId}" choice`);
      return Object.freeze({
        label: string(choice.label, `Passage "${passageId}" choice label`),
        destinationId: id(choice.destinationId, `Passage "${passageId}" choice destinationId`),
      });
    });
    const continueTo = entry.continueTo === undefined
      ? undefined
      : id(entry.continueTo, `Passage "${passageId}" continueTo`);
    if (continueTo !== undefined && choices.length > 0) {
      throw new Error(`Passage "${passageId}" cannot have both choices and Continue.`);
    }
    return Object.freeze({
      id: passageId, title, text: Object.freeze(text), choices: Object.freeze(choices),
      ...(continueTo === undefined ? {} : { continueTo }),
    });
  });

  if (!ids.has(startId)) throw new Error(`Missing start passage "${startId}".`);
  for (const passage of passages) {
    const destinations = passage.choices.map(choice => choice.destinationId);
    if (passage.continueTo !== undefined) destinations.push(passage.continueTo);
    for (const destination of destinations) {
      if (!ids.has(destination)) {
        throw new Error(`Passage "${passage.id}" has missing destination "${destination}".`);
      }
    }
  }
  return Object.freeze({ startId, passages: Object.freeze(passages) });
}
