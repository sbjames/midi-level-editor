import { EVENT_CATALOG } from '../eventCatalog';
import type { GameEvent } from '../types';
import { formatBeat, sortEvents } from '../utils/eventUtils';

interface EventListProps {
  events: GameEvent[];
  onEdit: (event: GameEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventList = ({ events, onEdit, onDelete }: EventListProps) => {
  if (events.length === 0) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h2>Event Timeline</h2>
        </header>
        <p className="empty-state">No events yet. Use the form to add your first trigger.</p>
      </section>
    );
  }

  const sorted = sortEvents(events);

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Event Timeline</h2>
        <p className="panel__subtitle">Ordered by beat to reflect the final GAME_EVENTS track.</p>
      </header>
      <table className="event-table">
        <thead>
          <tr>
            <th>Beat</th>
            <th>Type</th>
            <th>Parameters</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((event) => {
            const definition = EVENT_CATALOG[event.type];
            return (
              <tr key={event.id}>
                <td className="event-table__beat">{formatBeat(event.beat)}</td>
                <td>
                  <div className="event-type">
                    <strong>{definition.label}</strong>
                    <span>{event.type}</span>
                  </div>
                </td>
                <td>
                  <dl className="event-params">
                    {definition.params.map((param) => (
                      <div key={param.name}>
                        <dt>{param.label}</dt>
                        <dd>{event.params[param.name] || <span className="muted">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </td>
                <td className="event-table__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => onEdit(event)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => onDelete(event.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default EventList;
