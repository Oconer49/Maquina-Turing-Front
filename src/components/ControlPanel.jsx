/** Botones Iniciar / Paso / Ejecutar / Pausar / Reiniciar y slider de velocidad. */
export default function ControlPanel({
  onStart,
  onStep,
  onRun,
  onPause,
  onReset,
  isRunning,
  isPaused,
  canStep,
  speed,
  onSpeedChange,
}) {
  return (
    <div className="panel">
      <div className="controls">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Iniciar
        </button>
        <button type="button" className="btn btn-secondary" onClick={onStep} disabled={!canStep}>
          Paso
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={isPaused ? onRun : onPause}
          disabled={!canStep && !isRunning}
        >
          {isPaused ? 'Continuar' : isRunning ? 'Pausar' : 'Ejecutar'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Reiniciar
        </button>
        <div className="speed-control">
          <label htmlFor="speed">Velocidad (ms)</label>
          <input
            id="speed"
            type="range"
            min={50}
            max={1500}
            step={50}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span>{speed}</span>
        </div>
      </div>
    </div>
  );
}
