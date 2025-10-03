import { DEFAULT_EVENT_TYPE, EVENT_CATALOG } from '../eventCatalog';
import type {
  EventDefinition,
  EventFormState,
  EventParamDefinition,
  EventType,
  GameEvent,
  ValidationIssue,
} from '../types';

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export const formatBeat = (beat: number): string => numberFormatter.format(beat);

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const getDefinition = (type: EventType): EventDefinition => EVENT_CATALOG[type];

export const buildEmptyParams = (type: EventType): Record<string, string> => {
  const definition = getDefinition(type);
  return definition.params.reduce<Record<string, string>>((acc, param) => {
    acc[param.name] = param.defaultValue ?? '';
    return acc;
  }, {});
};

export const toFormState = (event: GameEvent): EventFormState => ({
  beat: event.beat.toString(),
  type: event.type,
  params: { ...event.params },
});

export const toGameEvent = (form: EventFormState, id = createId()): GameEvent => ({
  id,
  beat: Number(form.beat),
  type: form.type,
  params: { ...form.params },
});

const isEmpty = (value: string | undefined) => value === undefined || value === '';

const parseNumber = (value: string) => Number(value);

const validateParam = (
  param: EventParamDefinition,
  value: string,
  event: GameEvent,
): ValidationIssue | null => {
  if (param.required && isEmpty(value)) {
    return {
      eventId: event.id,
      message: `${param.label} is required for ${EVENT_CATALOG[event.type].label}.`,
      severity: 'error',
    };
  }

  if (param.type === 'number' && !isEmpty(value)) {
    const parsed = parseNumber(value);
    if (Number.isNaN(parsed)) {
      return {
        eventId: event.id,
        message: `${param.label} must be a number.`,
        severity: 'error',
      };
    }
    if (typeof param.min === 'number' && parsed < param.min) {
      return {
        eventId: event.id,
        message: `${param.label} must be ≥ ${param.min}.`,
        severity: 'error',
      };
    }
  }

  return null;
};

export const validateEvents = (events: GameEvent[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (events.length === 0) {
    issues.push({
      eventId: null,
      severity: 'warning',
      message: 'No events defined yet. Add events to build the GAME_EVENTS track.',
    });
    return issues;
  }

  events.forEach((event) => {
    if (Number.isNaN(event.beat) || !Number.isFinite(event.beat)) {
      issues.push({
        eventId: event.id,
        severity: 'error',
        message: 'Beat value must be a valid number.',
      });
    } else if (event.beat < 0) {
      issues.push({
        eventId: event.id,
        severity: 'warning',
        message: 'Negative beat detected. Confirm this intentional offset.',
      });
    }

    const definition = getDefinition(event.type);
    definition.params.forEach((param) => {
      const issue = validateParam(param, event.params[param.name], event);
      if (issue) {
        issues.push(issue);
      }
    });
  });

  return issues;
};

export const sortEvents = (events: GameEvent[]) =>
  [...events].sort((a, b) => a.beat - b.beat || a.type.localeCompare(b.type));

export const encodeEvent = (event: GameEvent): string => {
  const definition = getDefinition(event.type);
  const paramString = definition.params
    .map((param) => {
      const value = event.params[param.name];
      if (isEmpty(value)) {
        return null;
      }
      return `${param.name}=${value}`;
    })
    .filter(Boolean)
    .join(',');

  const payload = paramString ? `|${paramString}` : '';
  return `EVT:${event.type}${payload}`;
};

export const generateMetaTrack = (events: GameEvent[]) =>
  sortEvents(events).map((event) => ({
    id: event.id,
    beat: formatBeat(event.beat),
    command: encodeEvent(event),
  }));

export const parseMetaLines = (input: string): GameEvent[] => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const events: GameEvent[] = [];

  lines.forEach((line, index) => {
    const beatMatch = line.match(/^\[(?<beat>[^\]]+)\]\s*(?<rest>.*)$/);
    const beatValue = beatMatch?.groups?.beat ?? `${index}`;
    const rest = beatMatch?.groups?.rest ?? line;

    if (!rest.startsWith('EVT:')) {
      return;
    }

    const [typePart, paramsPart] = rest.replace('EVT:', '').split('|');
    const type = typePart as EventType;
    if (!EVENT_CATALOG[type]) {
      return;
    }

    const params: Record<string, string> = buildEmptyParams(type);
    if (paramsPart) {
      paramsPart.split(',').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key) {
          params[key] = value ?? '';
        }
      });
    }

    events.push({
      id: createId(),
      beat: Number(beatValue),
      type,
      params,
    });
  });

  return sortEvents(events);
};

export const createInitialFormState = (): EventFormState => ({
  beat: '0',
  type: DEFAULT_EVENT_TYPE,
  params: buildEmptyParams(DEFAULT_EVENT_TYPE),
});
