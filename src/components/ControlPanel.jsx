/** Controles para avanzar paso a paso, ejecutar automático y reiniciar. */
export default function ControlPanel({
  onRestart,
  onStep,
  onRun,
  onPause,
  isRunning,
  canStep,
  hasSimulation,
  speed,
  onSpeedChange,
  compact = false,
}) {
  return (
    <div className={`controls-panel ${compact ? 'controls-panel--compact' : ''}`}>
      {!compact && (
        <p className="controls-panel__hint">
          Use <strong>Un paso</strong> o <strong>Ejecutar automático</strong> para avanzar.{' '}
          <strong>Reiniciar</strong> vuelve al paso 0 con la máquina y cadena actuales (también se
          actualiza al editar la entrada).
        </p>
      )}
      <div className="controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRestart}
          disabled={isRunning}
          title="Nueva simulación desde el paso 0 con la máquina y cadena actuales"
        >
          Reiniciar simulación
        </button>
        <button
          type="button"
          className="btn btn-step"
          onClick={onStep}
          disabled={!canStep}
          title="Aplica una sola transición (función δ)"
        >
          Un paso
        </button>
        <div className="controls-run-group">
          <button
            type="button"
            className={`btn ${isRunning ? 'btn-pause' : 'btn-run'}`}
            onClick={isRunning ? onPause : onRun}
            disabled={!canStep && !isRunning}
            title={
              isRunning
                ? 'Detiene la ejecución automática'
                : 'Avanza paso a paso hasta aceptar o rechazar'
            }
          >
            {isRunning ? 'Pausar' : 'Ejecutar automático'}
          </button>
          <div className="speed-control">
            <label htmlFor="speed">Velocidad</label>
            <input
              id="speed"
              type="range"
              min={50}
              max={1500}
              step={50}
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              disabled={!hasSimulation}
              aria-valuetext={`${speed} ms`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
