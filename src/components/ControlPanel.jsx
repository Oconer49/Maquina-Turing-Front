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
}) {
  return (
    <div className="controls-panel">
      <p className="controls-panel__hint">
        Use <strong>Un paso</strong> o <strong>Ejecutar automático</strong> para avanzar.{' '}
        <strong>Reiniciar</strong> vuelve al paso 0 con la cadena actual (también se actualiza sola al
        editar la entrada).
      </p>
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
          <label htmlFor="speed">Velocidad entre pasos (milisegundos)</label>
          <input
            id="speed"
            type="range"
            min={50}
            max={1500}
            step={50}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={!hasSimulation}
          />
          <span>{speed} ms</span>
        </div>
      </div>
    </div>
  );
}
