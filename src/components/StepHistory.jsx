import RichText from './RichText';
import { formatDeltaTransition, stateToLatex } from '../utils/formalNotation';

const STATUS_SHORT = {
  RUNNING: 'En curso',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  STEP_LIMIT: 'Límite',
};

/** Lista los pasos guardados; el más reciente arriba. */
export default function StepHistory({ history, blank = '_' }) {
  if (!history?.length) {
    return (
      <div className="history-panel history-panel--empty">
        <p className="history-empty">
          Aún no hay pasos registrados. Pulse <strong>Un paso</strong> o{' '}
          <strong>Ejecutar automático</strong> para ver el historial aquí.
        </p>
      </div>
    );
  }

  const items = [...history].reverse();

  return (
    <div className="history-panel">
      <p className="history-panel__meta">
        <strong>{history.length}</strong> paso{history.length !== 1 ? 's' : ''} · el más reciente arriba
      </p>
      <div className="history-list">
        {items.map((item, i) => (
          <article
            key={`${item.step}-${i}`}
            className={`history-step${i === 0 ? ' history-step--latest' : ''}`}
          >
            <div className="history-step__head">
              <span className="history-step__badge">Paso {item.step}</span>
              <span className="history-step__state">
                <RichText text={`$${stateToLatex(item.current_state)}$`} />
              </span>
              <span className={`history-step__status history-step__status--${item.status}`}>
                {STATUS_SHORT[item.status] || item.status}
              </span>
            </div>
            {item.applied_transition && (
              <div className="history-step__delta">
                <span className="history-step__delta-label">δ aplicada</span>
                <RichText text={formatDeltaTransition(item.applied_transition, blank)} />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
