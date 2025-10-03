import { DEFAULT_PROJECT_SETTINGS } from '../constants';
import type { ProjectSettings as ProjectSettingsModel } from '../types';

interface ProjectSettingsProps {
  settings: ProjectSettingsModel;
  onChange: (next: ProjectSettingsModel) => void;
}

const clampChannel = (value: number) => Math.max(0, Math.min(15, Math.round(value)));

const ProjectSettingsPanel = ({ settings, onChange }: ProjectSettingsProps) => {
  const update = (partial: Partial<ProjectSettingsModel>) => {
    onChange({ ...settings, ...partial });
  };

  const handleTimeSignatureChange = (index: 0 | 1, value: number) => {
    const next: ProjectSettingsModel['timeSignature'] = [...settings.timeSignature];
    next[index] = Math.max(1, Math.round(value) || 1);
    onChange({ ...settings, timeSignature: next });
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Project Settings</h2>
          <p className="panel__subtitle">Configure the MIDI context that the events belong to.</p>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onChange({ ...DEFAULT_PROJECT_SETTINGS })}
        >
          Reset Defaults
        </button>
      </header>

      <div className="form-grid">
        <label className="form-field">
          <span>Tempo (BPM)</span>
          <input
            type="number"
            min={1}
            max={400}
            step="0.1"
            value={settings.tempo}
            onChange={(event) => update({ tempo: Number(event.target.value) })}
          />
          <small>Used to position beats when exporting the MIDI file.</small>
        </label>

        <label className="form-field">
          <span>Pulses Per Quarter (PPQ)</span>
          <input
            type="number"
            min={24}
            step={1}
            value={settings.ppq}
            onChange={(event) => update({ ppq: Math.round(Number(event.target.value)) })}
          />
          <small>Resolution for tick conversion. 480 is a common choice.</small>
        </label>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Time Signature</span>
          <div className="time-signature-inputs">
            <input
              type="number"
              min={1}
              step={1}
              value={settings.timeSignature[0]}
            onChange={(event) => handleTimeSignatureChange(0, Number(event.target.value))}
            />
            <span className="time-signature-separator">/</span>
            <input
              type="number"
              min={1}
              step={1}
              value={settings.timeSignature[1]}
            onChange={(event) => handleTimeSignatureChange(1, Number(event.target.value))}
            />
          </div>
          <small>The denominator will be coerced to the nearest power of two when saved.</small>
        </label>

        <label className="form-field">
          <span>Track Name</span>
          <input
            type="text"
            value={settings.trackName}
            onChange={(event) => update({ trackName: event.target.value })}
          />
          <small>This becomes the MIDI track name meta event. Default is GAME_EVENTS.</small>
        </label>

        <label className="form-field">
          <span>MIDI Channel</span>
          <input
            type="number"
            min={0}
            max={15}
            step={1}
            value={settings.channel}
            onChange={(event) => update({ channel: clampChannel(Number(event.target.value)) })}
          />
          <small>Channel reserved for the gameplay track (0-15). The track itself stays silent.</small>
        </label>
      </div>
    </section>
  );
};

export default ProjectSettingsPanel;
