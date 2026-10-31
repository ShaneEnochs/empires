import { validateSnapshot } from './snapshot';
import type { GameSnapshot, Story } from './types';

export const SAVE_FORMAT_VERSION = 1;
export const STORY_ID = 'empires-example';
export const STORY_REVISION = 1;
export const STORAGE_KEY = 'empires:checkpoint:' + STORY_ID;

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
export function loadCheckpoint(storage: CheckpointStorage, story: Story): LoadedCheckpoint {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); } catch (error) {
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
  if (envelope.storyId !== STORY_ID) return invalid('This save belongs to another story.');
  if (envelope.storyRevision !== STORY_REVISION) return invalid('This save is from an incompatible story revision.');
  try {
    return { status: 'loaded', checkpoint: validateSnapshot(envelope.checkpoint, story) };
  } catch (error) {
    return invalid('The saved checkpoint is not compatible with this story.', error);
  }
}

/** One atomic replacement write; never delete the previous record first. */
export function saveCheckpoint(storage: CheckpointStorage, story: Story, checkpoint: GameSnapshot): SaveResult {
  try {
    const envelope = {
      formatVersion: SAVE_FORMAT_VERSION, storyId: STORY_ID, storyRevision: STORY_REVISION,
      checkpoint: validateSnapshot(checkpoint, story),
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
