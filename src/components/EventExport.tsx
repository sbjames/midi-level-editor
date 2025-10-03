import { useMemo, useState } from 'react';
import BaseMidiLoader from './BaseMidiLoader';
import { generateMetaTrack, parseMetaLines } from '../utils/eventUtils';
import { triggerMidiDownload } from '../utils/midiExport';
import type { GameEvent, LoadedMidi, ProjectSettings } from '../types';

interface EventExportProps {
  events: GameEvent[];
  settings: ProjectSettings;
  baseMidi: LoadedMidi | null;
  onImport: (events: GameEvent[]) => void;
  onBaseMidiLoad: (midi: LoadedMidi) => void;
  onClearBaseMidi: () => void;
}

const EventExport = ({
  events,
  settings,
  baseMidi,
  onImport,
  onBaseMidiLoad,
  onClearBaseMidi,
}: EventExportProps) => {
  const [importText, setImportText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error'>('info');

  const metaEvents = useMemo(() => generateMetaTrack(events), [events]);
  const hasEvents = metaEvents.length > 0;

  const handleFeedback = (tone: 'info' | 'error', message: string) => {
    setFeedbackTone(tone);
    setFeedback(message);
  };

  const handleBaseMidiLoad = (midi: LoadedMidi) => {
    onBaseMidiLoad(midi);
    handleFeedback('info', `Loaded ${midi.name}.`);
  };

  const handleBaseMidiError = (message: string) => {
    handleFeedback('error', message);
  };

  const handleBaseMidiClear = () => {
    onClearBaseMidi();
    handleFeedback('info', 'Removed base MIDI file.');
  };

  const handleCopy = async () => {
    const lines = metaEvents.map((event) => `[${event.beat}] ${event.command}`).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      handleFeedback('info', 'Copied to clipboard!');
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      handleFeedback('error', 'Clipboard unavailable. Select the text manually to copy.');
    }
  };

  const handleImport = () => {
    const parsed = parseMetaLines(importText);
    if (parsed.length === 0) {
      handleFeedback('error', 'No valid EVT lines detected. Ensure the format matches the preview.');
      return;
    }
    onImport(parsed);
    setImportText('');
    handleFeedback('info', 'Imported events from text.');
  };

  const handleDownload = () => {
    if (!baseMidi) {
      handleFeedback('error', 'Select a base MIDI file before exporting.');
      return;
    }

    if (!triggerMidiDownload(events, settings, baseMidi)) {
      handleFeedback('error', 'Add at least one event before exporting to MIDI.');
      return;
    }

    handleFeedback('info', 'Merged GAME_EVENTS events into the MIDI file.');
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Meta Event Preview</h2>
          <p className="panel__subtitle">
            Review the text meta events that will be written onto channel 15 in your base MIDI.
          </p>
        </div>
        <div className="panel__actions">
          <button type="button" className="button button--ghost" onClick={handleDownload}>
            Download MIDI
          </button>
          <button type="button" className="button button--primary" onClick={handleCopy}>
            Copy Preview
          </button>
        </div>
      </header>

      <BaseMidiLoader
        baseMidi={baseMidi}
        onLoad={handleBaseMidiLoad}
        onClear={handleBaseMidiClear}
        onError={handleBaseMidiError}
      />

      <dl className="meta-summary">
        <div>
          <dt>Tempo</dt>
          <dd>{settings.tempo.toFixed(2)} BPM</dd>
        </div>
        <div>
          <dt>Time Signature</dt>
          <dd>
            {settings.timeSignature[0]}/{settings.timeSignature[1]}
          </dd>
        </div>
        <div>
          <dt>PPQ</dt>
          <dd>{settings.ppq}</dd>
        </div>
      </dl>

      <pre className="meta-preview">
        {hasEvents
          ? metaEvents.map((event) => `[${event.beat}] ${event.command}`).join('\n')
          : 'No events to preview yet.'}
      </pre>

      <details className="importer">
        <summary>Import from EVT lines</summary>
        <p>Paste lines using the same syntax as the preview to populate the editor.</p>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="[0] EVT:COLOR_CHANGE|palette=neon,fade_ms=150"
          rows={4}
        />
        <div className="importer__actions">
          <button type="button" className="button button--ghost" onClick={() => setImportText('')}>
            Clear
          </button>
          <button type="button" className="button button--primary" onClick={handleImport}>
            Import
          </button>
        </div>
        {feedback ? (
          <p className={`importer__feedback importer__feedback--${feedbackTone}`}>
            {feedback}
          </p>
        ) : null}
      </details>
    </section>
  );
};

export default EventExport;
