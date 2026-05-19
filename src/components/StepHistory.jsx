import RichText from './RichText';
import { formatDeltaTransition, stateToLatex } from '../utils/formalNotation';

/** Lista los pasos guardados; el más reciente arriba. */
export default function StepHistory({ history }) {
  if (!history?.length) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>Sin pasos registrados.</p>;
  }

  return (
    <div className="history scroll-sync">
      {[...history].reverse().map((item, i) => (
        <div key={i} className="history-item">
          <strong>Paso {item.step}</strong> —{' '}
          <span className="state-name">
            <RichText text={`$${stateToLatex(item.current_state)}$`} />
          </span>{' '}
          —{' '}
          {item.status}
          {item.applied_transition && (
            <span className="history-delta">
              {' '}
              | <RichText text={formatDeltaTransition(item.applied_transition)} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
