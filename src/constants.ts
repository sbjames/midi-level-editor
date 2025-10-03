import type { ProjectSettings } from './types';

export const STORAGE_KEY = 'midi-level-editor/state/v1';

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  tempo: 120,
  ppq: 480,
  timeSignature: [4, 4],
  trackName: 'GAME_EVENTS',
  channel: 0,
};
