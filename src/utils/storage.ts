import { DEFAULT_PROJECT_SETTINGS, STORAGE_KEY } from '../constants';
import { DEFAULT_EVENT_TYPE, EVENT_CATALOG } from '../eventCatalog';
import type { EventType, GameEvent, ProjectSettings } from '../types';
import { buildEmptyParams, createId, sortEvents } from './eventUtils';

interface PersistedStateV1 {
  version: 1;
  events: GameEvent[];
  settings: ProjectSettings;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeEventType = (type: unknown): EventType => {
  if (typeof type === 'string' && type in EVENT_CATALOG) {
    return type as EventType;
  }
  return DEFAULT_EVENT_TYPE;
};

const sanitizeEvent = (value: unknown): GameEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const type = sanitizeEventType(value.type);
  const beat = Number(value.beat);
  if (!Number.isFinite(beat)) {
    return null;
  }

  const params = buildEmptyParams(type);
  const paramSource: Record<string, unknown> = isRecord(value.params)
    ? (value.params as Record<string, unknown>)
    : {};

  Object.keys(params).forEach((key) => {
    const raw = paramSource[key];
    if (typeof raw === 'string' || typeof raw === 'number') {
      params[key] = String(raw);
    }
  });

  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId(),
    beat,
    type,
    params,
  };
};

const coercePowerOfTwo = (input: number, fallback: number) => {
  if (!Number.isFinite(input) || input <= 0) {
    return fallback;
  }

  const exponent = Math.round(Math.log2(input));
  const candidate = Math.pow(2, exponent);
  if (!Number.isFinite(candidate) || candidate <= 0) {
    return fallback;
  }

  return candidate;
};

export const normalizeProjectSettings = (value: unknown): ProjectSettings => {
  if (!isRecord(value)) {
    return { ...DEFAULT_PROJECT_SETTINGS };
  }

  const tempo = Number(value.tempo);
  const ppq = Number(value.ppq);
  const timeSignatureValue = Array.isArray(value.timeSignature) ? value.timeSignature : [];
  const numerator = Number(timeSignatureValue[0]);
  const denominator = Number(timeSignatureValue[1]);

  const [defaultNumerator, defaultDenominator] = DEFAULT_PROJECT_SETTINGS.timeSignature;

  return {
    tempo: Number.isFinite(tempo) && tempo > 0 ? tempo : DEFAULT_PROJECT_SETTINGS.tempo,
    ppq: Number.isFinite(ppq) && ppq > 0 ? Math.round(ppq) : DEFAULT_PROJECT_SETTINGS.ppq,
    timeSignature: [
      Number.isFinite(numerator) && numerator > 0 ? Math.round(numerator) : defaultNumerator,
      coercePowerOfTwo(denominator, defaultDenominator),
    ],
    trackName:
      typeof value.trackName === 'string' && value.trackName.trim().length > 0
        ? value.trackName.trim()
        : DEFAULT_PROJECT_SETTINGS.trackName,
    channel: Number.isFinite(Number(value.channel))
      ? Math.max(0, Math.min(15, Math.round(Number(value.channel))))
      : DEFAULT_PROJECT_SETTINGS.channel,
  };
};

const sanitizeEvents = (value: unknown): GameEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortEvents(
    value
      .map((item) => sanitizeEvent(item))
      .filter((event): event is GameEvent => event !== null),
  );
};

const toPersistedState = (events: GameEvent[], settings: ProjectSettings): PersistedStateV1 => ({
  version: 1,
  events,
  settings,
});

export const loadPersistedState = (): { events: GameEvent[]; settings: ProjectSettings } | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedStateV1;
    if (parsed.version !== 1) {
      return null;
    }

    return {
      events: sanitizeEvents(parsed.events),
      settings: normalizeProjectSettings(parsed.settings),
    };
  } catch (error) {
    console.warn('Failed to load persisted editor state:', error);
    return null;
  }
};

export const persistState = (events: GameEvent[], settings: ProjectSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = JSON.stringify(toPersistedState(events, settings));
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Unable to persist editor state:', error);
  }
};
