import { validateContext } from './context';
import type { ResumeContext } from './types';
import { validateCommittedState, validateSnapshot } from './snapshot';
import type { GameSnapshot, GameState, Story } from './types';

/** Party-aware committed saves use format 4; page/temp context uses format 5.
 * Checkpoint-only engine fixtures use format 6. Old schemas 1–3 are incompatible. */
export const SAVE_FORMAT_VERSION = 4;
export const CONTEXT_SAVE_FORMAT_VERSION = 5;
export const CHECKPOINT_SAVE_FORMAT_VERSION = 6;
export const STORY_ID = 'aurelian-league';
export const STORY_REVISION = 1;
export const STORAGE_KEY = 'pokemon:checkpoint:' + STORY_ID;

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
  return 'pokemon:checkpoint:' + identity.storyId;
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
  | { readonly status: 'loaded'; readonly checkpoint: GameSnapshot; readonly currentState?: GameState; readonly context?: ResumeContext }
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
  const fields = ['formatVersion', 'storyId', 'storyRevision', 'checkpoint',
    ...((envelope.formatVersion === SAVE_FORMAT_VERSION || envelope.formatVersion === CONTEXT_SAVE_FORMAT_VERSION) ? ['currentState'] : []), ...(envelope.formatVersion === CONTEXT_SAVE_FORMAT_VERSION ? ['context'] : [])];
  if (Object.keys(envelope).length !== fields.length || fields.some(key => !Object.hasOwn(envelope, key))) {
    return invalid('The saved data has an invalid format.');
  }
  if (envelope.formatVersion !== CHECKPOINT_SAVE_FORMAT_VERSION && envelope.formatVersion !== SAVE_FORMAT_VERSION && envelope.formatVersion !== CONTEXT_SAVE_FORMAT_VERSION) return invalid('This save uses a different save format.');
  if (envelope.storyId !== configured.storyId) return invalid('This save belongs to another story.');
  if (envelope.storyRevision !== configured.storyRevision) return invalid('This save is from an incompatible story revision.');
  try {
    const checkpoint = validateSnapshot(envelope.checkpoint, story);
    if (envelope.formatVersion === CHECKPOINT_SAVE_FORMAT_VERSION) return { status: 'loaded', checkpoint };
    const target = story.passages.find(passage => passage.id === checkpoint.state.passageId)!;
    if (target.id !== story.startId && !target.checkpoint) throw new Error('Recovery target must be the start or an authored checkpoint.');
    const currentState = validateCommittedState(envelope.currentState, story);
    const passage = story.passages.find(p => p.id === currentState.passageId)!;
    if (envelope.formatVersion !== CONTEXT_SAVE_FORMAT_VERSION && (passage.temps || passage.paragraphs.some(p => p.page))) throw Error('Legacy progress lacks required passage context.');
    return { status: 'loaded', checkpoint, currentState, ...(envelope.formatVersion === CONTEXT_SAVE_FORMAT_VERSION ? { context: validateContext(envelope.context, passage, currentState) } : {}) };
  } catch (error) {
    return invalid('The saved checkpoint is not compatible with this story.', error);
  }
}

/** Explicit checkpoint-only writer for engine callers and recovery fixtures. */
export function saveCheckpoint(storage: CheckpointStorage, story: Story, checkpoint: GameSnapshot, identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY): SaveResult {
  const configured = validateSaveIdentity(identity);
  try {
    const envelope = {
      formatVersion: CHECKPOINT_SAVE_FORMAT_VERSION, storyId: configured.storyId, storyRevision: configured.storyRevision,
      checkpoint: validateSnapshot(checkpoint, story),
    };
    storage.setItem(keyFor(configured), JSON.stringify(envelope));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

/** Current post-entry progress and its independent recovery boundary, in one write. */
export function saveProgress(storage: CheckpointStorage, story: Story, currentState: GameState,
  checkpoint: GameSnapshot, identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY, context?: ResumeContext): SaveResult {
  const configured = validateSaveIdentity(identity);
  try {
    const passage = story.passages.find(p => p.id === currentState.passageId);
    if (!context && passage && (passage.temps || passage.paragraphs.some(p => p.page))) throw Error('Progress requires passage context.');
    const envelope = { ...(context ? { context: validateContext(context, story.passages.find(p => p.id === currentState.passageId)!, currentState) } : {}), formatVersion: context ? CONTEXT_SAVE_FORMAT_VERSION : SAVE_FORMAT_VERSION, storyId: configured.storyId,
      storyRevision: configured.storyRevision, checkpoint: validateSnapshot(checkpoint, story),
      currentState: validateCommittedState(currentState, story) };
    const target = story.passages.find(passage => passage.id === envelope.checkpoint.state.passageId)!;
    if (target.id !== story.startId && !target.checkpoint) throw new Error('Invalid recovery target.');
    storage.setItem(keyFor(configured), JSON.stringify(envelope));
    return { ok: true };
  } catch (error) { return { ok: false, error }; }
}
