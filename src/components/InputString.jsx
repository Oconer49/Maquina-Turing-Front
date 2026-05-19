import { AlphabetChips } from './TapeSymbol';
import RichText from './RichText';

/** Campo de texto para la cadena de entrada y chips del alfabeto Σ. */
export default function InputString({ value, onChange, onSubmit, disabled, alphabetSymbols }) {
  return (
    <div className="field">
      <label htmlFor="input" className="input-label">
        <span>Cadena de entrada</span>
        {alphabetSymbols?.length > 0 && (
          <span className="input-alphabet">
            <RichText text="$\\Sigma$ =" />
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
        placeholder="Ej: 10101"
      />
    </div>
  );
}
