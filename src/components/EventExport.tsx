import { useMemo, useState } from 'react';
import { generateMetaTrack, parseMetaLines } from '../utils/eventUtils';
import { triggerMidiDownload } from '../utils/midiExport';
import type { GameEvent, ProjectSettings } from '../types';

interface EventExportProps {
  events: GameEvent[];
  settings: ProjectSettings;
  onImport: (events: GameEvent[]) => void;
}

const EventExport = ({ events, settings, onImport }: EventExportProps) => {
  const [importText, setImportText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error'>('info');

  const metaEvents = useMemo(() => generateMetaTrack(events), [events]);
  const hasEvents = metaEvents.length > 0;

  const handleCopy = async () => {
    const lines = metaEvents.map((event) => `[${event.beat}] ${event.command}`).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setFeedbackTone('info');
      setFeedback('Copied to clipboard!');
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      setFeedbackTone('error');
      setFeedback('Clipboard unavailable. Select the text manually to copy.');
    }
  };

  const handleImport = () => {
    const parsed = parseMetaLines(importText);
    if (parsed.length === 0) {
      setFeedbackTone('error');
      setFeedback('No valid EVT lines detected. Ensure the format matches the preview.');
      return;
    }
    onImport(parsed);
    setImportText('');
    setFeedbackTone('info');
    setFeedback('Imported events from text.');
  };

  const handleDownload = () => {
    if (!triggerMidiDownload(events, settings)) {
      setFeedbackTone('error');
      setFeedback('Add at least one event before exporting to MIDI.');
      return;
    }

    setFeedbackTone('info');
    setFeedback('Generated GAME_EVENTS MIDI snippet.');
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Meta Event Preview</h2>
          <p className="panel__subtitle">
            Output formatted for a MIDI Text Meta Event on the GAME_EVENTS track.
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
