import TapeSymbol from './TapeSymbol';

/** Dibuja la cinta: recorre celdas y marca la cabeza con ▼. */
export default function TapeView({ tape, headIndex }) {
  if (!tape?.length) {
    return (
      <div className="tape-container">
        <p style={{ color: 'var(--muted)', margin: 0 }}>Inicie una simulación para ver la cinta.</p>
      </div>
    );
  }

  return (
    <div className="tape-container">
      <div className="tape-row">
        {tape.map((cell) => {
          const isHead = cell.index === headIndex;
          return (
            <div key={cell.index} className={`tape-cell ${isHead ? 'head' : ''}`}>
              {isHead && <span className="arrow">▼</span>}
              <span className="index">{cell.index}</span>
              <span className="symbol">
                <TapeSymbol symbol={cell.symbol} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
