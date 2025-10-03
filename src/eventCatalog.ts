import type { EventDefinition, EventType } from './types';

export const EVENT_CATALOG: Record<EventType, EventDefinition> = {
  COLOR_CHANGE: {
    label: 'Color Change',
    description:
      'Swap the active palette or color scheme with an optional fade transition.',
    params: [
      {
        name: 'palette',
        label: 'Palette ID',
        type: 'text',
        required: true,
        placeholder: 'neon',
        helperText: 'Identifier that the runtime maps to a color palette.',
      },
      {
        name: 'fade_ms',
        label: 'Fade (ms)',
        type: 'number',
        placeholder: '150',
        helperText: 'Optional fade duration in milliseconds.',
        min: 0,
      },
    ],
  },
  SFX_TRIGGER: {
    label: 'SFX Trigger',
    description: 'Play a one-shot sound effect that is synchronized with the beat.',
    params: [
      {
        name: 'clip_id',
        label: 'Clip ID',
        type: 'text',
        required: true,
        placeholder: 'impact_big',
      },
      {
        name: 'volume',
        label: 'Volume (0-1)',
        type: 'number',
        placeholder: '0.8',
        helperText: 'Optional linear volume multiplier between 0 and 1.',
        min: 0,
      },
    ],
  },
  HIT_WINDOW: {
    label: 'Hit Window',
    description: 'Define when the player can hit a lane and for how long.',
    params: [
      {
        name: 'lane',
        label: 'Lane',
        type: 'text',
        required: true,
        placeholder: 'A',
        helperText: 'Lane identifier referenced by your chart logic.',
      },
      {
        name: 'duration_ms',
        label: 'Duration (ms)',
        type: 'number',
        required: true,
        placeholder: '250',
        helperText: 'Length of the window in milliseconds.',
        min: 0,
      },
    ],
  },
  CAMERA_SHAKE: {
    label: 'Camera Shake',
    description: 'Add a punchy shake to the camera.',
    params: [
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'number',
        required: true,
        placeholder: '0.6',
        helperText: 'Normalized intensity value between 0 and 1.',
        min: 0,
      },
      {
        name: 'duration_ms',
        label: 'Duration (ms)',
        type: 'number',
        required: true,
        placeholder: '120',
        min: 0,
      },
    ],
  },
  SCRIPTED_ACTION: {
    label: 'Scripted Action',
    description: 'Kick off a custom scripted action defined by the engine.',
    params: [
      {
        name: 'action_id',
        label: 'Action ID',
        type: 'text',
        required: true,
        placeholder: 'spawn_boss',
      },
    ],
  },
  TEXT_MESSAGE: {
    label: 'Text Message',
    description: 'Display an on-screen text prompt synchronized with the music.',
    params: [
      {
        name: 'message',
        label: 'Message',
        type: 'text',
        required: true,
        placeholder: 'Ready?',
        helperText: 'Short text that the runtime surfaces to the player.',
      },
      {
        name: 'style',
        label: 'Style ID',
        type: 'text',
        placeholder: 'callout',
        helperText: 'Optional style or layout token for the HUD.',
      },
    ],
  },
};

export const EVENT_TYPES: EventType[] = Object.keys(EVENT_CATALOG) as EventType[];

export const DEFAULT_EVENT_TYPE: EventType = 'COLOR_CHANGE';
