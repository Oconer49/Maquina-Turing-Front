import RichText from './RichText';

/** Ejemplos de cadena por máquina; al pulsar carga la entrada y arranca la simulación. */
export default function MachineExamples({ examples, onSelect, disabled, compact = false }) {
  if (!examples?.length) return null;

  return (
    <div className={`machine-examples ${compact ? 'machine-examples--compact' : ''}`}>
      <p className="machine-examples__title">Ejemplos (pulse para cargar)</p>
      <ul className="machine-examples__list">
        {examples.map((ex, i) => (
          <li key={`${ex.input}-${i}`}>
            <button
              type="button"
              className="machine-examples__btn"
              onClick={() => onSelect(ex.input)}
              disabled={disabled}
              title={ex.label}
            >
              <code className="machine-examples__input">
                {ex.input === '' ? <span className="math-greek">ε</span> : ex.input}
              </code>
              {!compact && (
                <span className="machine-examples__label">
                  <RichText text={ex.label} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
