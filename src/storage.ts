import { validateSnapshot } from './snapshot';
import type { GameSnapshot, Story } from './types';

export const SAVE_FORMAT_VERSION = 1;
export const STORY_ID = 'empires-example';
export const STORY_REVISION = 1;
export const STORAGE_KEY = 'empires:checkpoint:' + STORY_ID;

/** Application configuration, separate from authored Story and mutable GameState. */
export interface StorySaveIdentity {
  readonly storyId: string;
  readonly storyRevision: number;
}

export const DEFAULT_SAVE_IDENTITY: StorySaveIdentity = Object.freeze({
  storyId: STORY_ID, storyRevision: STORY_REVISION,
});

/** Reject configuration errors before storage access; retain an independent immutable copy. */
export function validateSaveIdentity(value: unknown): StorySaveIdentity {
  const fail = (reason: string): never => { throw new Error('Invalid story save identity: ' + reason); };
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail('expected an object.');
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return fail('expected own configuration fields.');
  const fields = ['storyId', 'storyRevision'];
  if (Reflect.ownKeys(value).length !== fields.length) return fail('expected only storyId and storyRevision.');
  for (const field of fields) {
    const property = Object.getOwnPropertyDescriptor(value, field);
    if (property === undefined || !property.enumerable || !Object.hasOwn(property, 'value')) {
      return fail('expected own data fields storyId and storyRevision.');
    }
  }
  const identity = value as Record<string, unknown>;
  if (typeof identity.storyId !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(identity.storyId)) {
    return fail('storyId must start with a lowercase ASCII letter and contain only lowercase letters, digits, underscores, or hyphens.');
  }
  if (typeof identity.storyRevision !== 'number' || !Number.isSafeInteger(identity.storyRevision) || identity.storyRevision < 1) {
    return fail('storyRevision must be a positive safe integer.');
  }
  return Object.freeze({ storyId: identity.storyId, storyRevision: identity.storyRevision });
}

function keyFor(identity: StorySaveIdentity): string {
  // Revisions share a key so incompatible saved progress is reported, not hidden.
  return 'empires:checkpoint:' + identity.storyId;
}

export function checkpointKey(identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY): string {
  return keyFor(validateSaveIdentity(identity));
}

export interface CheckpointStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LoadedCheckpoint =
  | { readonly status: 'empty' }
  | { readonly status: 'loaded'; readonly checkpoint: GameSnapshot }
  | { readonly status: 'invalid' | 'unavailable'; readonly message: string; readonly error: unknown };

export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

function invalid(message: string, error: unknown = new Error(message)): LoadedCheckpoint {
  return { status: 'invalid', message, error };
}

/** Reading/validation never executes passage effects or writes to storage. */
export function loadCheckpoint(storage: CheckpointStorage, story: Story, identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY): LoadedCheckpoint {
  const configured = validateSaveIdentity(identity);
  let raw: string | null;
  try { raw = storage.getItem(keyFor(configured)); } catch (error) {
    return { status: 'unavailable', message: 'Browser storage is unavailable.', error };
  }
  if (raw === null) return { status: 'empty' };
  let data: unknown;
  try { data = JSON.parse(raw) as unknown; } catch (error) {
    return invalid('The saved data is not readable.', error);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return invalid('The saved data has an invalid format.');
  const envelope = data as Record<string, unknown>;
  const fields = ['formatVersion', 'storyId', 'storyRevision', 'checkpoint'];
  if (Object.keys(envelope).length !== fields.length || fields.some(key => !Object.hasOwn(envelope, key))) {
    return invalid('The saved data has an invalid format.');
  }
  if (envelope.formatVersion !== SAVE_FORMAT_VERSION) return invalid('This save uses a different save format.');
  if (envelope.storyId !== configured.storyId) return invalid('This save belongs to another story.');
  if (envelope.storyRevision !== configured.storyRevision) return invalid('This save is from an incompatible story revision.');
  try {
    return { status: 'loaded', checkpoint: validateSnapshot(envelope.checkpoint, story) };
  } catch (error) {
    return invalid('The saved checkpoint is not compatible with this story.', error);
  }
}

/** One atomic replacement write; never delete the previous record first. */
export function saveCheckpoint(storage: CheckpointStorage, story: Story, checkpoint: GameSnapshot, identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY): SaveResult {
  const configured = validateSaveIdentity(identity);
  try {
    const envelope = {
      formatVersion: SAVE_FORMAT_VERSION, storyId: configured.storyId, storyRevision: configured.storyRevision,
      checkpoint: validateSnapshot(checkpoint, story),
    };
    storage.setItem(keyFor(configured), JSON.stringify(envelope));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
