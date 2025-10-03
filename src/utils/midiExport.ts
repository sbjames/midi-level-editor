import { Midi } from '@tonejs/midi';
import type { GameEvent, ProjectSettings } from '../types';
import { encodeEvent, sortEvents } from './eventUtils';

const clampTicks = (ticks: number) => Math.max(0, Math.round(ticks));

const buildHeaderJSON = (midi: Midi, events: GameEvent[], settings: ProjectSettings) => {
  const headerJSON = midi.header.toJSON();
  const sortedEvents = sortEvents(events);

  headerJSON.name = settings.trackName;
  headerJSON.ppq = settings.ppq;
  headerJSON.tempos = [
    {
      bpm: settings.tempo,
      ticks: 0,
    },
  ];
  headerJSON.timeSignatures = [
    {
      ticks: 0,
      timeSignature: settings.timeSignature,
    },
  ];
  headerJSON.meta = sortedEvents.map((event) => ({
    text: encodeEvent(event),
    ticks: clampTicks(event.beat * settings.ppq),
    type: 'text' as const,
  }));

  return headerJSON;
};

export const createMidiFromEvents = (events: GameEvent[], settings: ProjectSettings): Midi => {
  const midi = new Midi();
  midi.header.fromJSON(buildHeaderJSON(midi, events, settings));

  const track = midi.addTrack();
  track.name = settings.trackName;
  track.channel = settings.channel;

  return midi;
};

export const createMidiBlob = (events: GameEvent[], settings: ProjectSettings) => {
  if (events.length === 0) {
    return null;
  }

  const midi = createMidiFromEvents(events, settings);
  const bytes = midi.toArray();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'audio/midi' });
};

export const triggerMidiDownload = (
  events: GameEvent[],
  settings: ProjectSettings,
  filename = 'game_events.mid',
) => {
  const blob = createMidiBlob(events, settings);
  if (!blob) {
    return false;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
};
