import RichText from './RichText';
import { formatDeltaTransition, stateToLatex } from '../utils/formalNotation';

const STATUS_LABELS = {
  RUNNING: 'Ejecutando',
  ACCEPTED: 'Cadena aceptada',
  REJECTED: 'Cadena rechazada',
  STEP_LIMIT: 'Límite de pasos alcanzado',
};

const Box = 'div';

/** Muestra estado actual, paso, resultado y última transición δ. */
export default function StatusPanel({ snapshot }) {
  if (!snapshot) return null;
  const { current_state, step, status, applied_transition, result_message } = snapshot;
  const isFinal = status !== 'RUNNING';

  return (
    <Box className="status-panel">
      <Box className="status-bar">
        <span>
          <span className="label">Estado: </span>
          <strong className="state-name">
            <RichText text={`$${stateToLatex(current_state)}$`} />
          </strong>
        </span>
        <span>
          <span className="label">Paso: </span>
          <strong>{step}</strong>
        </span>
        <span>
          <span className="label">Resultado: </span>
          <strong className={`status-${status}`}>{STATUS_LABELS[status] || status}</strong>
        </span>
        {applied_transition && (
          <span className="delta-line">
            <span className="label">Última </span>
            <RichText text={formatDeltaTransition(applied_transition)} />
          </span>
        )}
      </Box>
      {isFinal && result_message && (
        <Box className={`result-message status-${status}`}>
          <RichText text={result_message} />
        </Box>
      )}
    </Box>
  );
}
