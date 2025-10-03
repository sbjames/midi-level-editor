import { useRef } from 'react';
import {
  parseMidi,
  type MidiEvent,
  type MidiSetTempoEvent,
  type MidiTimeSignatureEvent,
} from 'midi-file';
import type { LoadedMidi } from '../types';

interface BaseMidiLoaderProps {
  baseMidi: LoadedMidi | null;
  onLoad: (midi: LoadedMidi) => void;
  onClear: () => void;
  onError: (message: string) => void;
}

const DEFAULT_PPQ_FALLBACK = 480;

const formatSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const findFirstEvent = <T extends MidiEvent>(
  tracks: MidiEvent[][],
  predicate: (event: MidiEvent) => event is T,
): T | null => {
  for (const track of tracks) {
    for (const event of track) {
      if (predicate(event)) {
        return event;
      }
    }
  }
  return null;
};

const isTempoEvent = (event: MidiEvent): event is MidiSetTempoEvent =>
  'meta' in event && event.meta === true && event.type === 'setTempo';

const isTimeSignatureEvent = (event: MidiEvent): event is MidiTimeSignatureEvent =>
  'meta' in event && event.meta === true && event.type === 'timeSignature';

const toBpm = (microsecondsPerBeat: number) => 60000000 / microsecondsPerBeat;

const BaseMidiLoader = ({ baseMidi, onLoad, onClear, onError }: BaseMidiLoaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const midiData = parseMidi(new Uint8Array(arrayBuffer));

      const tempoEvent = findFirstEvent(midiData.tracks, isTempoEvent);
      const timeSignatureEvent = findFirstEvent(midiData.tracks, isTimeSignatureEvent);

      const ticksPerBeatRaw = midiData.header.ticksPerBeat;
      const ticksPerBeat =
        typeof ticksPerBeatRaw === 'number' && ticksPerBeatRaw > 0
          ? ticksPerBeatRaw
          : DEFAULT_PPQ_FALLBACK;

      const loaded: LoadedMidi = {
        name: file.name,
        arrayBuffer,
        size: file.size,
        lastModified: file.lastModified,
        ticksPerBeat,
        tempo: tempoEvent ? toBpm(tempoEvent.microsecondsPerBeat) : undefined,
        timeSignature: timeSignatureEvent
          ? [timeSignatureEvent.numerator, timeSignatureEvent.denominator]
          : undefined,
        format: midiData.header.format,
        trackCount: midiData.tracks.length,
      };

      onLoad(loaded);
    } catch (error) {
      console.error('Failed to load MIDI file:', error);
      onError('Unable to read the selected MIDI file.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <section className="midi-loader">
      <header className="midi-loader__header">
        <div>
          <h3>Base MIDI</h3>
          <p>Merge events into an existing file before exporting on channel 15.</p>
        </div>
        <div className="midi-loader__actions">
          <button type="button" className="button button--ghost" onClick={handleBrowseClick}>
            {baseMidi ? 'Replace MIDI' : 'Select MIDI'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileChange}
            hidden
          />
          {baseMidi ? (
            <button type="button" className="button button--ghost" onClick={onClear}>
              Remove
            </button>
          ) : null}
        </div>
      </header>

      {baseMidi ? (
        <dl className="midi-loader__summary">
          <div>
            <dt>File</dt>
            <dd>{baseMidi.name}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>Type {baseMidi.format}</dd>
          </div>
          <div>
            <dt>Tracks</dt>
            <dd>{baseMidi.trackCount}</dd>
          </div>
          <div>
            <dt>PPQ</dt>
            <dd>{baseMidi.ticksPerBeat}</dd>
          </div>
          {baseMidi.tempo ? (
            <div>
              <dt>Tempo</dt>
              <dd>{baseMidi.tempo.toFixed(2)} BPM</dd>
            </div>
          ) : null}
          {baseMidi.timeSignature ? (
            <div>
              <dt>Time Signature</dt>
              <dd>
                {baseMidi.timeSignature[0]}/{baseMidi.timeSignature[1]}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Size</dt>
            <dd>{formatSize(baseMidi.size)}</dd>
          </div>
        </dl>
      ) : (
        <p className="midi-loader__placeholder">No base MIDI selected yet.</p>
      )}
    </section>
  );
};

export default BaseMidiLoader;
