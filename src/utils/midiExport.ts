import type { MidiEvent, MidiTrackNameEvent } from 'midi-file';
import { parseMidi, writeMidi } from 'midi-file';
import { GAME_EVENT_CHANNEL } from '../constants';
import type { GameEvent, LoadedMidi, ProjectSettings } from '../types';
import { encodeEvent, sortEvents } from './eventUtils';

const clampTicks = (ticks: number) => Math.max(0, Math.round(ticks));

const isTrackNameEvent = (event: MidiEvent): event is MidiTrackNameEvent =>
  'meta' in event && event.meta === true && event.type === 'trackName';

const buildGameEventTrack = (
  events: GameEvent[],
  ticksPerBeat: number,
  channel: number,
  trackName: string,
): MidiEvent[] => {
  const trackEvents: MidiEvent[] = [
    {
      deltaTime: 0,
      meta: true,
      type: 'trackName',
      text: trackName,
    },
    {
      deltaTime: 0,
      meta: true,
      type: 'channelPrefix',
      channel,
    },
  ];

  let lastTick = 0;

  events.forEach((event) => {
    const ticks = clampTicks(event.beat * ticksPerBeat);
    const delta = Math.max(0, ticks - lastTick);
    trackEvents.push({
      deltaTime: delta,
      meta: true,
      type: 'text',
      text: encodeEvent(event),
    });
    lastTick = ticks;
  });

  trackEvents.push({
    deltaTime: 0,
    meta: true,
    type: 'endOfTrack',
  });

  return trackEvents;
};

const removeExistingGameEventTracks = (tracks: MidiEvent[][], trackName: string) =>
  tracks.filter((track) => !track.some((event) => isTrackNameEvent(event) && event.text === trackName));

export const createMidiBlob = (
  events: GameEvent[],
  settings: ProjectSettings,
  baseMidi: LoadedMidi | null,
) => {
  if (!baseMidi || events.length === 0) {
    return null;
  }

  const midiData = parseMidi(new Uint8Array(baseMidi.arrayBuffer));
  const ticksPerBeatRaw = midiData.header.ticksPerBeat;
  const ticksPerBeat =
    typeof ticksPerBeatRaw === 'number' && ticksPerBeatRaw > 0 ? ticksPerBeatRaw : settings.ppq;

  const sortedEvents = sortEvents(events);
  const normalizedChannel = Math.max(
    0,
    Math.min(15, Math.round(Number.isFinite(settings.channel) ? settings.channel : GAME_EVENT_CHANNEL)),
  );
  const trackEvents = buildGameEventTrack(sortedEvents, ticksPerBeat, normalizedChannel, settings.trackName);

  const tracks = removeExistingGameEventTracks(midiData.tracks, settings.trackName);
  tracks.push(trackEvents);

  midiData.tracks = tracks;
  midiData.header.numTracks = tracks.length;
  midiData.header.ticksPerBeat = ticksPerBeat;

  const output = writeMidi(midiData, { running: true });
  const bytes = Uint8Array.from(output);
  return new Blob([bytes], { type: 'audio/midi' });
};

export const triggerMidiDownload = (
  events: GameEvent[],
  settings: ProjectSettings,
  baseMidi: LoadedMidi | null,
  filename = 'game_events.mid',
) => {
  const blob = createMidiBlob(events, settings, baseMidi);
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
