const SYMBOLS = {
  _: { glyph: '⊔', title: 'Blanco (B)', className: 'sym-blank' },
  '0': { glyph: '0', title: 'Cero', className: 'sym-bit' },
  '1': { glyph: '1', title: 'Uno', className: 'sym-bit' },
  a: { glyph: 'a', title: 'a', className: 'sym-letter' },
  b: { glyph: 'b', title: 'b', className: 'sym-letter' },
  X: { glyph: 'X', title: 'Marca X', className: 'sym-mark' },
  Y: { glyph: 'Y', title: 'Marca Y', className: 'sym-mark' },
};

/** Muestra un símbolo de cinta con estilo (⊔, 0, 1, a, marcas X/Y). */
export default function TapeSymbol({ symbol, size = 'md' }) {
  const meta = SYMBOLS[symbol] ?? {
    glyph: symbol,
    title: symbol,
    className: 'sym-other',
  };

  return (
    <span
      className={`tape-symbol ${meta.className} tape-symbol--${size}`}
      title={meta.title}
      aria-label={meta.title}
    >
      {meta.glyph}
    </span>
  );
}

/** Fila de símbolos permitidos junto al input (alfabeto Σ). */
export function AlphabetChips({ symbols }) {
  if (!symbols?.length) return null;
  return (
    <span className="alphabet-chips">
      {symbols.map((s) => (
        <span key={s} className="alphabet-chip">
          <TapeSymbol symbol={s} size="sm" />
        </span>
      ))}
    </span>
  );
}
