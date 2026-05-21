import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import TapeSymbol from './TapeSymbol';
import { buildDisplayTape } from '../utils/compactTape';

const MOVE_LABELS = {
  L: { short: 'L', text: 'Izquierda', arrow: '←', className: 'move-left' },
  R: { short: 'R', text: 'Derecha', arrow: '→', className: 'move-right' },
};

const CELL_STRIDE = 41;
const MIN_TAPE_CELLS = 21;

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
  const [targetCellCount, setTargetCellCount] = useState(MIN_TAPE_CELLS);
  const prevSymbolsRef = useRef({});
  const [headCenterX, setHeadCenterX] = useState(0);
  const [headReady, setHeadReady] = useState(false);
  const [flashIndices, setFlashIndices] = useState(() => new Set());
  const [stepPulse, setStepPulse] = useState(false);

  const moveInfo = lastMove ? MOVE_LABELS[lastMove] : null;

  const measureTargetCells = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const n = Math.max(MIN_TAPE_CELLS, Math.floor(w / CELL_STRIDE));
    setTargetCellCount(n);
  }, []);

  const displayTape = useMemo(
    () =>
      active
        ? buildDisplayTape(tape, headIndex, blank, {
            inputString,
            previewInput: step === 0,
            minEachSide: 10,
            minTotal: MIN_TAPE_CELLS,
            targetCount: targetCellCount,
          })
        : [],
    [tape, headIndex, blank, inputString, step, targetCellCount, active],
  );

  const updateHeadPosition = useCallback(() => {
    const row = rowRef.current;
    if (!row || headIndex == null) return;
    const cell = row.querySelector(`[data-tape-index="${headIndex}"]`);
    if (!cell) return;
    setHeadCenterX(cell.offsetLeft + cell.offsetWidth / 2);
    setHeadReady(true);
  }, [headIndex]);

  const scrollHeadIntoView = useCallback(() => {
    const container = containerRef.current;
    const cell = rowRef.current?.querySelector(`[data-tape-index="${headIndex}"]`);
    if (!container || !cell) return;
    const target = cell.offsetLeft + cell.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [headIndex]);

  useLayoutEffect(() => {
    measureTargetCells();
  }, [measureTargetCells, active]);

  useLayoutEffect(() => {
    updateHeadPosition();
    scrollHeadIntoView();
  }, [updateHeadPosition, scrollHeadIntoView, displayTape]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const ro = new ResizeObserver(() => {
      measureTargetCells();
      updateHeadPosition();
      scrollHeadIntoView();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [measureTargetCells, updateHeadPosition, scrollHeadIntoView]);

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
        <span className="tape-direction-bar__center">La vista se desplaza con el cabezal ▼</span>
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

      <div className="tape-move-info">
        {moveInfo && step > 0 ? (
          <>
            <span
              key={`${step}-${lastMove}`}
              className={`tape-move-badge ${moveInfo.className} tape-move-badge--animate`}
            >
              <span className="tape-move-badge__arrow" aria-hidden="true">
                {moveInfo.arrow}
              </span>
              <span>
                En el paso anterior el cabezal se movió hacia la{' '}
                <strong>{moveInfo.text}</strong> ({moveInfo.short})
              </span>
            </span>
            <span className="tape-move-hint">
              Deslice la cinta si lo necesita; al ejecutar pasos, la vista sigue al cabezal.
            </span>
          </>
        ) : (
          <span className="tape-move-hint">
            El cabezal (▼) está en la posición <strong>{headIndex}</strong>. Las celdas con punto (·)
            son blanco; al escribir la cadena, los símbolos sustituyen el blanco desde la posición 0.
          </span>
        )}
      </div>
    </div>
  );
}
