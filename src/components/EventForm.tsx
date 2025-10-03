import { useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { EVENT_CATALOG, EVENT_TYPES } from '../eventCatalog';
import type { EventFormState, EventParamDefinition } from '../types';
import { buildEmptyParams } from '../utils/eventUtils';

interface EventFormProps {
  formState: EventFormState;
  onChange: (next: EventFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  isEditing: boolean;
}

const renderInput = (
  param: EventParamDefinition,
  value: string,
  onValueChange: (value: string) => void,
) => {
  const baseProps = {
    id: param.name,
    name: param.name,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onValueChange(event.target.value),
    placeholder: param.placeholder,
  };

  if (param.type === 'number') {
    return <input type="number" step="any" min={param.min} {...baseProps} />;
  }

  if (param.type === 'select') {
    return (
      <select {...baseProps}>
        <option value="">Select…</option>
        {param.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return <input type="text" {...baseProps} />;
};

const EventForm = ({ formState, onChange, onSubmit, onReset, isEditing }: EventFormProps) => {
  useEffect(() => {
    if (!EVENT_CATALOG[formState.type]) {
      onChange({
        beat: formState.beat,
        type: EVENT_TYPES[0],
        params: buildEmptyParams(EVENT_TYPES[0]),
      });
    }
  }, [formState.type, formState.beat, onChange]);

  const definition = EVENT_CATALOG[formState.type];

  const handleParamChange = (name: string, value: string) => {
    onChange({
      ...formState,
      params: { ...formState.params, [name]: value },
    });
  };

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <header className="panel__header">
        <div>
          <h2>{isEditing ? 'Edit Game Event' : 'Create Game Event'}</h2>
          <p className="panel__subtitle">Configure a MIDI meta event for the GAME_EVENTS track.</p>
        </div>
        <div className="panel__actions">
          <button type="button" className="button button--ghost" onClick={onReset}>
            Reset
          </button>
          <button type="submit" className="button button--primary">
            {isEditing ? 'Update Event' : 'Add Event'}
          </button>
        </div>
      </header>

      <div className="form-grid">
        <label className="form-field">
          <span>Timestamp (beats)</span>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formState.beat}
            onChange={(event) =>
              onChange({ ...formState, beat: event.target.value })
            }
          />
          <small>Beat position measured against the MIDI tempo map.</small>
        </label>

        <label className="form-field">
          <span>Event Type</span>
          <select
            value={formState.type}
            onChange={(event) =>
              onChange({
                beat: formState.beat,
                type: event.target.value as typeof formState.type,
                params: buildEmptyParams(event.target.value as typeof formState.type),
              })
            }
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVENT_CATALOG[type].label}
              </option>
            ))}
          </select>
          <small>{definition.description}</small>
        </label>
      </div>

      <div className="form-parameters">
        {definition.params.map((param) => (
          <label key={param.name} className="form-field">
            <span>
              {param.label}
              {param.required ? <em title="Required">*</em> : null}
            </span>
            {renderInput(param, formState.params[param.name] ?? '', (value) =>
              handleParamChange(param.name, value),
            )}
            {param.helperText ? <small>{param.helperText}</small> : null}
          </label>
        ))}
      </div>
    </form>
  );
};

export default EventForm;
