import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import TapeSymbol from './TapeSymbol';

const MOVE_LABELS = {
  L: { short: 'L', text: 'Izquierda', arrow: '←', className: 'move-left' },
  R: { short: 'R', text: 'Derecha', arrow: '→', className: 'move-right' },
};

const RANGE_PAD = 2;

/** Cinta con celdas en blanco que llenan el ancho; la cadena sustituye blancos en 0…n-1. */
export default function TapeView({
  tape,
  headIndex = 0,
  lastMove,
  step = 0,
  blank = '_',
  inputString = '',
  active = true,
}) {
  const containerRef = useRef(null);
  const rowRef = useRef(null);
  const tapeMapRef = useRef(new Map());
  const [range, setRange] = useState(() => ({ lo: 0, hi: 10 }));
  const prevSymbolsRef = useRef({});
  const [headCenterX, setHeadCenterX] = useState(0);
  const [headReady, setHeadReady] = useState(false);
  const [flashIndices, setFlashIndices] = useState(() => new Set());
  const [stepPulse, setStepPulse] = useState(false);

  const moveInfo = lastMove ? MOVE_LABELS[lastMove] : null;

  useEffect(() => {
    if (!active) return;

    const map = tapeMapRef.current;
    map.clear();

    if (step === 0 && inputString) {
      for (let i = 0; i < inputString.length; i += 1) {
        map.set(i, inputString[i]);
      }
    }

    if (tape?.length) {
      for (const c of tape) map.set(c.index, c.symbol);
    }

    const keys = [...map.keys()];
    const lo = Math.min(headIndex, ...(keys.length ? keys : [0])) - RANGE_PAD;
    const hi = Math.max(headIndex, ...(keys.length ? keys : [Math.max(0, inputString.length - 1)])) + RANGE_PAD;
    setRange({ lo, hi });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tape, step === 0 ? inputString : '', headIndex]);

  useEffect(() => {
    if (!active) return;
    const map = tapeMapRef.current;
    if (tape?.length) {
      for (const c of tape) map.set(c.index, c.symbol);
    }
    setRange((prev) => {
      const lo = Math.min(prev.lo, headIndex - RANGE_PAD);
      const hi = Math.max(prev.hi, headIndex + RANGE_PAD);
      return lo === prev.lo && hi === prev.hi ? prev : { lo, hi };
    });
  }, [active, tape, headIndex]);

  const displayTape = useMemo(() => {
    if (!active) return [];
    const map = tapeMapRef.current;
    const cells = [];
    for (let i = range.lo; i <= range.hi; i += 1) {
      cells.push({ index: i, symbol: map.has(i) ? map.get(i) : blank });
    }
    return cells;
  }, [active, range.lo, range.hi, blank]);

  const updateHeadPosition = useCallback(() => {
    const row = rowRef.current;
    if (!row || headIndex == null) return;
    const cell = row.querySelector(`[data-tape-index="${headIndex}"]`);
    if (!cell) return;
    setHeadCenterX(cell.offsetLeft + cell.offsetWidth / 2);
    setHeadReady(true);
  }, [headIndex]);

  // Mantiene el cabezal visible sin forzarlo al centro (evita efecto "cabezal fijo").
  const scrollHeadIntoView = useCallback(() => {
    const container = containerRef.current;
    const cell = rowRef.current?.querySelector(`[data-tape-index="${headIndex}"]`);
    if (!container || !cell) return;
    const padding = 48;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;
    const cellLeft = cell.offsetLeft;
    const cellRight = cellLeft + cell.offsetWidth;

    if (cellLeft < viewLeft + padding) {
      container.scrollTo({ left: Math.max(0, cellLeft - padding), behavior: 'smooth' });
      return;
    }
    if (cellRight > viewRight - padding) {
      container.scrollTo({ left: Math.max(0, cellRight - container.clientWidth + padding), behavior: 'smooth' });
    }
  }, [headIndex]);

  useLayoutEffect(() => {
    updateHeadPosition();
    scrollHeadIntoView();
  }, [updateHeadPosition, scrollHeadIntoView, displayTape]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const ro = new ResizeObserver(() => {
      updateHeadPosition();
      scrollHeadIntoView();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateHeadPosition, scrollHeadIntoView]);

  useEffect(() => {
    if (!displayTape?.length || step === 0) return;

    const nextFlash = new Set();
    for (const cell of displayTape) {
      const prev = prevSymbolsRef.current[cell.index];
      if (prev !== undefined && prev !== cell.symbol) {
        nextFlash.add(cell.index);
      }
      prevSymbolsRef.current[cell.index] = cell.symbol;
    }

    if (nextFlash.size > 0) {
      setFlashIndices(nextFlash);
      const t = setTimeout(() => setFlashIndices(new Set()), 500);
      return () => clearTimeout(t);
    }
  }, [displayTape, step]);

  useEffect(() => {
    if (step === 0) return;
    setStepPulse(true);
    const t = setTimeout(() => setStepPulse(false), 400);
    return () => clearTimeout(t);
  }, [step]);

  if (!active || !displayTape.length) {
    return (
      <div className="tape-section">
        <p className="tape-empty">Seleccione una máquina para ver la cinta.</p>
      </div>
    );
  }

  return (
    <div className="tape-section">
      <div className="tape-direction-bar" aria-hidden="true">
        <span className="tape-direction-bar__end tape-direction-bar__end--left">
          ← L (izquierda)
        </span>
        <span className="tape-direction-bar__center">El cabezal (▼) se mueve sobre la cinta</span>
        <span className="tape-direction-bar__end tape-direction-bar__end--right">
          R (derecha) →
        </span>
      </div>

      <div
        ref={containerRef}
        className={`tape-container ${stepPulse ? 'tape-container--pulse' : ''}`}
        role="region"
        aria-label="Cinta de la máquina de Turing"
      >
        <div className="tape-row-wrap">
          <div
            className={`tape-head-float ${headReady ? 'tape-head-float--visible' : ''} ${
              lastMove === 'L' ? 'tape-head-float--from-left' : lastMove === 'R' ? 'tape-head-float--from-right' : ''
            }`}
            style={{ transform: `translateX(${headCenterX}px) translateX(-50%)` }}
            aria-hidden="true"
          >
            <span className="tape-head-marker__label">Cabezal</span>
            <span className="tape-head-float__arrow">▼</span>
          </div>

          <div ref={rowRef} className="tape-row">
            {displayTape.map((cell) => {
              const isHead = cell.index === headIndex;
              const isFlash = flashIndices.has(cell.index);
              const isBlank = cell.symbol === blank;
              return (
                <div
                  key={cell.index}
                  data-tape-index={cell.index}
                  className={[
                    'tape-cell',
                    isHead ? 'tape-cell--head' : '',
                    isFlash ? 'tape-cell--flash' : '',
                    isBlank ? 'tape-cell--blank' : 'tape-cell--filled',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isHead ? 'true' : undefined}
                >
                  <span className="index" title="Posición en la cinta">
                    {cell.index}
                  </span>
                  <span className="symbol">
                    <TapeSymbol symbol={cell.symbol} isBlank={isBlank} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {moveInfo && step > 0 && (
        <div className="tape-move-info">
          <span
            key={`${step}-${lastMove}`}
            className={`tape-move-badge ${moveInfo.className} tape-move-badge--animate`}
          >
            <span className="tape-move-badge__arrow" aria-hidden="true">
              {moveInfo.arrow}
            </span>
            <span>
              En el paso anterior el cabezal se movió hacia la <strong>{moveInfo.text}</strong> (
              {moveInfo.short})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
