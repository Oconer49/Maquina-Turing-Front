import RichText from './RichText';
import { formatDeltaTransition, stateToLatex } from '../utils/formalNotation';

const STATUS_LABELS = {
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  STEP_LIMIT: 'Límite de pasos',
};

function resultLabel(status, isActive) {
  if (status === 'RUNNING') {
    return isActive ? 'En ejecución' : 'En pausa';
  }
  return STATUS_LABELS[status] || status;
}

const Box = 'div';

/** Estado de la simulación: Q, paso, resultado y última regla δ aplicada. */
export default function StatusPanel({ snapshot, isRunning = false, isStepping = false, blank = '_' }) {
  if (!snapshot) return null;
  const { current_state, step, status, applied_transition, result_message } = snapshot;
  const isFinal = status !== 'RUNNING';
  const isActive = isRunning || isStepping;
  const resultTitle =
    status === 'ACCEPTED'
      ? 'Por qué se aceptó'
      : status === 'REJECTED'
        ? 'Por qué se rechazó'
        : 'Explicación';

  return (
    <Box className="status-panel">
      <div className="status-grid">
        <div className="status-card">
          <span className="status-card__label">
            <RichText text="Estado actual ($Q$)" />
          </span>
          <div className="status-card__value state-name">
            <RichText text={`$${stateToLatex(current_state)}$`} />
          </div>
        </div>
        <div className={`status-card status-card--step${step > 0 ? ' status-card--step-active' : ''}`}>
          <span className="status-card__label">Paso</span>
          <div className="status-card__value status-card__value--step">{step}</div>
        </div>
        <div className="status-card">
          <span className="status-card__label">Resultado</span>
          <div
            className={`status-card__value status-${status}${
              status === 'RUNNING' && !isActive ? ' status-paused' : ''
            }`}
          >
            {resultLabel(status, isActive)}
          </div>
        </div>
      </div>

      {applied_transition && (
        <div className="status-delta">
          <span className="status-delta__label">
            Última transición <span className="math-greek">δ</span> aplicada
          </span>
          <div className="status-delta__value">
            <RichText text={formatDeltaTransition(applied_transition, blank)} />
          </div>
        </div>
      )}

      {isFinal && result_message && (
        <Box className={`result-message status-${status}`}>
          <span className="result-message__title">{resultTitle}</span>
          <div className="result-message__body">
            <RichText text={result_message} />
          </div>
        </Box>
      )}
    </Box>
  );
}
