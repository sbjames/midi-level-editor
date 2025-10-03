export type EventType =
  | 'COLOR_CHANGE'
  | 'SFX_TRIGGER'
  | 'HIT_WINDOW'
  | 'CAMERA_SHAKE'
  | 'SCRIPTED_ACTION'
  | 'TEXT_MESSAGE';

export type ParamInputType = 'text' | 'number' | 'select';

export interface EventParamDefinition {
  name: string;
  label: string;
  type: ParamInputType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string;
  min?: number;
}

export interface EventDefinition {
  label: string;
  description: string;
  params: EventParamDefinition[];
}

export interface GameEvent {
  id: string;
  beat: number;
  type: EventType;
  params: Record<string, string>;
}

export interface ValidationIssue {
  eventId: string | null;
  message: string;
  severity: 'error' | 'warning';
}

export interface EventFormState {
  beat: string;
  type: EventType;
  params: Record<string, string>;
}

export interface ProjectSettings {
  tempo: number;
  ppq: number;
  timeSignature: [number, number];
  trackName: string;
  channel: number;
}

export interface LoadedMidi {
  name: string;
  arrayBuffer: ArrayBuffer;
  size: number;
  lastModified: number;
  ticksPerBeat: number;
  tempo?: number;
  timeSignature?: [number, number];
  format: 0 | 1 | 2;
  trackCount: number;
}
