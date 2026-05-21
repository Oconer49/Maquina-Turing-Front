import RichText from './RichText';

/** Cinco ejemplos de cadena por máquina; al pulsar carga la entrada. */
export default function MachineExamples({ examples, onSelect, disabled }) {  if (!examples?.length) return null;

  return (
    <div className="machine-examples">
      <p className="machine-examples__title">Ejemplos de uso (pulse para probar)</p>
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
              <span className="machine-examples__label">
                <RichText text={ex.label} />
              </span>            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
