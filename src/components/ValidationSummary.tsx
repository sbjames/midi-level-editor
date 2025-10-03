import type { ValidationIssue } from '../types';

interface ValidationSummaryProps {
  issues: ValidationIssue[];
}

const ValidationSummary = ({ issues }: ValidationSummaryProps) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Validation</h2>
        <p className="panel__subtitle">Checks to keep the GAME_EVENTS track healthy.</p>
      </header>
      <ul className="validation-list">
        {issues.map((issue, index) => (
          <li key={`${issue.eventId ?? 'global'}-${index}`} className={`validation-list__item validation-list__item--${issue.severity}`}>
            <strong>{issue.severity === 'error' ? 'Error' : 'Warning'}:</strong> {issue.message}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ValidationSummary;
