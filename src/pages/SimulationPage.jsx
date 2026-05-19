import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import MachineSelector from '../components/MachineSelector';
import InputString from '../components/InputString';
import TapeView from '../components/TapeView';
import StatusPanel from '../components/StatusPanel';
import ControlPanel from '../components/ControlPanel';
import TransitionTable from '../components/TransitionTable';
import StepHistory from '../components/StepHistory';
import RichText from '../components/RichText';

/** Estados en los que la simulación ya no avanza. */
const FINISHED = new Set(['ACCEPTED', 'REJECTED', 'STEP_LIMIT']);

/** Pantalla principal: orquesta máquina, cinta, controles y tabla δ. */
export default function SimulationPage() {
  const [machines, setMachines] = useState([]);
  const [machineId, setMachineId] = useState('');
  const [machineDetail, setMachineDetail] = useState(null);
  const [input, setInput] = useState('');
  const [simulationId, setSimulationId] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(400);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const runRef = useRef(null);

  // Carga el listado de máquinas preset al montar.
  useEffect(() => {
    api
      .listMachines()
      .then((list) => {
        setMachines(list.filter((m) => m.id !== 'infinite_loop'));
        if (list.length) setMachineId(list[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Recarga la definición completa cuando cambia la máquina seleccionada.
  useEffect(() => {
    if (!machineId) return;
    api
      .getMachine(machineId)
      .then(setMachineDetail)
      .catch((e) => setError(e.message));
  }, [machineId]);

  const alphabetSymbols = machineDetail?.input_alphabet ?? [];
  const canStep = simulationId && snapshot?.status === 'RUNNING';

  /** Actualiza cinta/estado y opcionalmente guarda el paso en el historial. */
  const applySnapshot = useCallback((snap, appendHistory = true) => {
    setSnapshot(snap);
    if (appendHistory && snap.step > 0) {
      setHistory((h) => [...h.slice(-499), snap]);
    }
  }, []);

  /** Crea una simulación nueva en el backend con la cadena actual. */
  const handleStart = async () => {
    setError(null);
    setHistory([]);
    try {
      const snap = await api.createSimulation({ machine_id: machineId, input });
      setSimulationId(snap.simulation_id);
      applySnapshot(snap, false);
    } catch (e) {
      setError(e.message);
    }
  };

  /** Ejecuta un solo paso de la MT vía API. */
  const handleStep = async () => {
    if (!simulationId) return;
    setError(null);
    try {
      const snap = await api.step(simulationId);
      applySnapshot(snap);
    } catch (e) {
      setError(e.message);
    }
  };

  /** Vuelve al estado inicial de la misma simulación. */
  const handleReset = async () => {
    if (!simulationId) {
      setSnapshot(null);
      setHistory([]);
      return;
    }
    setError(null);
    try {
      const snap = await api.reset(simulationId);
      setHistory([]);
      applySnapshot(snap, false);
      setIsRunning(false);
      setIsPaused(false);
    } catch (e) {
      setError(e.message);
    }
  };

  /** Bucle de animación: repite /step con delay hasta aceptar, rechazar o pausar. */
  const runLoop = useCallback(async () => {
    if (!simulationId) return;
    setIsRunning(true);
    setIsPaused(false);

    const tick = async () => {
      try {
        const snap = await api.step(simulationId);
        applySnapshot(snap);
        if (FINISHED.has(snap.status)) {
          setIsRunning(false);
          return;
        }
        if (!runRef.current?.paused) {
          runRef.current.timer = setTimeout(tick, speed);
        }
      } catch (e) {
        setError(e.message);
        setIsRunning(false);
      }
    };

    runRef.current = { paused: false, timer: null };
    tick();
  }, [simulationId, speed, applySnapshot]);

  /** Detiene el temporizador del bucle de ejecución automática. */
  const handlePause = () => {
    if (runRef.current) {
      runRef.current.paused = true;
      clearTimeout(runRef.current.timer);
    }
    setIsPaused(true);
    setIsRunning(false);
  };

  /** Inicia o reanuda la ejecución automática paso a paso. */
  const handleRun = () => {
    if (isPaused) {
      setIsPaused(false);
      setIsRunning(true);
      runLoop();
    } else {
      runLoop();
    }
  };

  // Limpia el timeout al desmontar para no dejar timers colgados.
  useEffect(() => {
    return () => {
      if (runRef.current?.timer) clearTimeout(runRef.current.timer);
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Simulador de Máquinas de Turing</h1>
        <p className="app-header__course">
          Gramática y lenguajes — Brahyan Uribe Osorio / Santiago Gonzalez Bedoya
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="row">
          <MachineSelector
            machines={machines}
            value={machineId}
            onChange={setMachineId}
            disabled={isRunning}
          />
          <InputString
            value={input}
            onChange={setInput}
            onSubmit={handleStart}
            disabled={isRunning}
                alphabetSymbols={alphabetSymbols}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            disabled={isRunning || !machineId}
          >
            Crear simulación
          </button>
        </div>
            {machineDetail?.description && (
              <p className="machine-description">
                <RichText text={machineDetail.description} />
              </p>
            )}
      </div>

      <StatusPanel snapshot={snapshot} />
      <TapeView tape={snapshot?.tape} headIndex={snapshot?.head_index} />

      <ControlPanel
        onStart={handleStart}
        onStep={handleStep}
        onRun={handleRun}
        onPause={handlePause}
        onReset={handleReset}
        isRunning={isRunning}
        isPaused={isPaused}
        canStep={canStep}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      <div className="grid-2">
        <div className="panel">
              <h3 style={{ marginTop: 0 }}>
                <RichText text="Tabla de transiciones $\\delta$" />
              </h3>
          <TransitionTable machine={machineDetail} currentState={snapshot?.current_state} />
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Historial de pasos</h3>
          <StepHistory history={history} />
        </div>
      </div>
    </div>
  );
}
