import { AlphabetChips } from './TapeSymbol';

/** Campo de texto para la cadena de entrada y chips del alfabeto Σ. */
export default function InputString({ value, onChange, onSubmit, disabled, alphabetSymbols, error }) {
  return (
    <div className="field field--input-string">
      {error && (
        <div className="error-banner error-banner--input" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      <label htmlFor="input" className="input-label field-label-math">
        <span className="input-label-text">Cadena de entrada</span>
        {alphabetSymbols?.length > 0 && (
          <span className="input-alphabet">
            <span className="math-greek">Σ</span> =
            <AlphabetChips symbols={alphabetSymbols} />
          </span>
        )}
      </label>
      <input
        id="input"
        type="text"
        className="input-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        disabled={disabled}
      />
    </div>
  );
}
