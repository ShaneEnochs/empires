import { Game } from './game';
import { DEFAULT_SAVE_IDENTITY, loadCheckpoint, saveProgress, validateSaveIdentity } from './storage';
import type { CheckpointStorage, StorySaveIdentity } from './storage';
import type { Story } from './types';

type Notice = { readonly message: string; readonly error?: unknown };
type StartResult = 'started' | 'cancelled' | 'failed';
type Startup =
  | { readonly status: 'empty' | 'ready' }
  | { readonly status: 'invalid' | 'unavailable'; readonly message: string; readonly error: unknown };

/** Browser-independent application actions; Game remains the only gameplay owner. */
export class GameSession {
  readonly startup: Startup;
  private preparedGame?: Game;
  private currentGame?: Game;
  private currentNotice?: Notice;
  private unsavedAvailable = false;
  private savingEnabled = true;
  private readonly identity: StorySaveIdentity;

  constructor(private readonly story: Story, private readonly storage: CheckpointStorage, identity: StorySaveIdentity = DEFAULT_SAVE_IDENTITY) {
    this.identity = validateSaveIdentity(identity);
    const saved = loadCheckpoint(storage, story, this.identity);
    if (saved.status === 'loaded') {
      try {
        this.preparedGame = new Game(story, { checkpoint: saved.checkpoint, ...(saved.currentState === undefined ? {} : { committedState: saved.currentState }) });
        this.startup = { status: 'ready' };
      } catch (error) {
        this.startup = { status: 'invalid', message: 'The saved checkpoint cannot be entered in this story.', error };
      }
    } else {
      this.startup = saved;
      this.unsavedAvailable = saved.status === 'unavailable';
    }
  }

  get game(): Game | undefined { return this.currentGame; }
  get notice(): Notice | undefined { return this.currentNotice; }
  get canPlayWithoutSaving(): boolean { return this.unsavedAvailable; }

  continueGame(): Game {
    if (this.preparedGame === undefined) throw new Error('There is no usable saved game to continue.');
    this.currentGame = this.preparedGame;
    this.preparedGame = undefined;
    return this.currentGame;
  }

  newGame(confirmReplacement: () => boolean): StartResult {
    // Recheck presence on this explicit action, including records created after startup.
    const saved = loadCheckpoint(this.storage, this.story, this.identity);
    if (saved.status === 'unavailable') {
      this.unsavedAvailable = true;
      return this.failure('Saved progress could not be checked. A new saved game was not started.', saved.error);
    }
    if (saved.status !== 'empty' && !confirmReplacement()) return 'cancelled';
    const candidate = this.prepareNewGame();
    if (candidate === undefined) return 'failed';
    const result = saveProgress(this.storage, this.story, candidate.state, candidate.checkpoint, this.identity);
    if (!result.ok) {
      this.unsavedAvailable = true;
      return this.failure('The new game was not started because it could not be saved. Any previous progress was kept.', result.error);
    }
    this.currentGame = candidate;
    this.preparedGame = undefined;
    this.savingEnabled = true;
    this.currentNotice = undefined;
    this.unsavedAvailable = false;
    return 'started';
  }

  playWithoutSaving(confirm: () => boolean): StartResult {
    if (!confirm()) return 'cancelled';
    const candidate = this.prepareNewGame();
    if (candidate === undefined) return 'failed';
    this.currentGame = candidate;
    this.preparedGame = undefined;
    this.savingEnabled = false;
    this.unsavedAvailable = false;
    this.currentNotice = { message: 'Playing without saving. Progress in this game will be lost when this page closes. Existing saved progress is unchanged.' };
    return 'started';
  }

  navigate(destinationId: string): void {
    this.act(game => game.navigate(destinationId));
  }

  submitText(value: unknown): void {
    this.act(game => game.submitText(value));
  }

  retryAfterDeath(): void {
    if (this.currentGame === undefined) throw new Error('Start or continue a game first.');
    this.act(game => game.retryAfterDeath());
  }

  private prepareNewGame(): Game | undefined {
    try { return new Game(this.story); } catch (error) {
      this.failure('A new game could not be started. Any previous progress was kept.', error);
      return undefined;
    }
  }

  private failure(message: string, error: unknown): 'failed' {
    this.currentNotice = {
      message: message + (this.savingEnabled ? '' : ' Saving remains disabled for this game. Progress will be lost when this page closes.'),
      error,
    };
    return 'failed';
  }

  private act(action: (game: Game) => void): void {
    const game = this.currentGame;
    if (game === undefined) throw new Error('Start or continue a game first.');
    action(game); // A rejected action throws before any persistence attempt.
    if (this.savingEnabled) {
      const result = saveProgress(this.storage, this.story, game.state, game.checkpoint, this.identity);
      this.currentNotice = result.ok ? undefined : {
        message: 'Recent progress could not be saved. Closing this page may lose progress since the last successful save.',
        error: result.error,
      };
    }
  }
}
