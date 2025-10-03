import { useEffect, useMemo, useState } from 'react';
import EventExport from './components/EventExport';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import ProjectSettingsPanel from './components/ProjectSettings';
import ValidationSummary from './components/ValidationSummary';
import { DEFAULT_PROJECT_SETTINGS } from './constants';
import { EVENT_CATALOG, EVENT_TYPES } from './eventCatalog';
import {
  createInitialFormState,
  sortEvents,
  toFormState,
  toGameEvent,
  validateEvents,
} from './utils/eventUtils';
import { loadPersistedState, normalizeProjectSettings, persistState } from './utils/storage';
import type {
  EventFormState,
  GameEvent,
  LoadedMidi,
  ProjectSettings as ProjectSettingsType,
} from './types';
import './App.css';

const App = () => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [formState, setFormState] = useState<EventFormState>(createInitialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectSettings, setProjectSettings] = useState<ProjectSettingsType>(() => ({
    ...DEFAULT_PROJECT_SETTINGS,
  }));
  const [baseMidi, setBaseMidi] = useState<LoadedMidi | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setEvents(persisted.events);
      setProjectSettings(normalizeProjectSettings(persisted.settings));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    persistState(events, projectSettings);
  }, [events, projectSettings, isHydrated]);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const validationIssues = useMemo(() => validateEvents(sortedEvents), [sortedEvents]);

  const handleSubmit = () => {
    const nextEvent = toGameEvent(formState, editingId ?? undefined);
    const updatedEvents = editingId
      ? events.map((event) => (event.id === editingId ? nextEvent : event))
      : [...events, nextEvent];
    setEvents(updatedEvents);
    setFormState(createInitialFormState());
    setEditingId(null);
  };

  const handleEdit = (event: GameEvent) => {
    setFormState(toFormState(event));
    setEditingId(event.id);
  };

  const handleDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
    if (editingId === eventId) {
      setFormState(createInitialFormState());
      setEditingId(null);
    }
  };

  const handleImport = (imported: GameEvent[]) => {
    setEvents(imported);
    setFormState(createInitialFormState());
    setEditingId(null);
  };

  const handleReset = () => {
    setFormState(createInitialFormState());
    setEditingId(null);
  };

  const handleBaseMidiLoad = (midi: LoadedMidi) => {
    setBaseMidi(midi);
    setProjectSettings((current) =>
      normalizeProjectSettings({
        ...current,
        tempo: midi.tempo ?? current.tempo,
        ppq: midi.ticksPerBeat,
        timeSignature: midi.timeSignature ?? current.timeSignature,
      }),
    );
  };

  const handleBaseMidiClear = () => {
    setBaseMidi(null);
  };

  return (
    <div className="layout">
      <header className="app-header">
        <h1>MIDI Game Event Authoring</h1>
        <p>
          Craft the <code>GAME_EVENTS</code> MIDI track with time-aligned triggers for your rhythm
          game.
        </p>
      </header>

      <main className="content-grid">
        <EventForm
          formState={formState}
          onChange={setFormState}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isEditing={editingId !== null}
        />

        <div className="sidebar">
          <ProjectSettingsPanel
            settings={projectSettings}
            onChange={(next) => setProjectSettings(normalizeProjectSettings(next))}
          />
          <ValidationSummary issues={validationIssues} />
          <EventExport
            events={sortedEvents}
            settings={projectSettings}
            baseMidi={baseMidi}
            onImport={handleImport}
            onBaseMidiLoad={handleBaseMidiLoad}
            onClearBaseMidi={handleBaseMidiClear}
          />
        </div>
      </main>

      <EventList events={sortedEvents} onEdit={handleEdit} onDelete={handleDelete} />

      <footer className="app-footer">
        <p>
          Event types available:{' '}
          {EVENT_TYPES.map((type) => EVENT_CATALOG[type].label).join(', ')}. Extend this list by
          updating the event catalog and runtime parser.
        </p>
      </footer>
    </div>
  );
};

export default App;
