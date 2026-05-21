import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import MachineSelector from '../components/MachineSelector';
import MachineExamples from '../components/MachineExamples';
import InputString from '../components/InputString';
import TapeView from '../components/TapeView';
import StatusPanel from '../components/StatusPanel';
import ControlPanel from '../components/ControlPanel';
import TransitionTable from '../components/TransitionTable';
import StepHistory from '../components/StepHistory';
import SectionBlock from '../components/SectionBlock';
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
  const [isStepping, setIsStepping] = useState(false);
  const runRef = useRef(null);
  const simulationIdRef = useRef(null);
  const syncSeqRef = useRef(0);

  simulationIdRef.current = simulationId;

  useEffect(() => {
    api
      .listMachines()
      .then((list) => {
        setMachines(list.filter((m) => m.id !== 'infinite_loop'));
        if (list.length) setMachineId(list[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!machineId) return;
    api
      .getMachine(machineId)
      .then(setMachineDetail)
      .catch((e) => setError(e.message));
  }, [machineId]);

  const alphabetSymbols = machineDetail?.input_alphabet ?? [];
  const canStep = simulationId && snapshot?.status === 'RUNNING';
  const lastMove = snapshot?.applied_transition?.move;

  const applySnapshot = useCallback((snap, appendHistory = true) => {
    setSnapshot(snap);
    if (appendHistory && snap.step > 0) {
      setHistory((h) => [...h.slice(-499), snap]);
    }
  }, []);

  const stopAutoRun = useCallback(() => {
    if (runRef.current) {
      runRef.current.paused = true;
      clearTimeout(runRef.current.timer);
    }
    setIsRunning(false);
  }, []);

  /** Sincroniza la simulación con la máquina y cadena actuales (paso 0). */
  const syncSimulation = useCallback(async () => {
    if (!machineId) return;

    const seq = ++syncSeqRef.current;
    stopAutoRun();
    setHistory([]);

    const oldId = simulationIdRef.current;
    if (oldId) {
      api.deleteSimulation(oldId).catch(() => {});
    }

    try {
      const snap = await api.createSimulation({ machine_id: machineId, input });
      if (seq !== syncSeqRef.current) return;
      setSimulationId(snap.simulation_id);
      applySnapshot(snap, false);
      setError(null);
    } catch (e) {
      if (seq === syncSeqRef.current) {
        setError(e.message);
        setSnapshot(null);
        setSimulationId(null);
      }
    }
  }, [machineId, input, stopAutoRun, applySnapshot]);

  useEffect(() => {
    if (!machineId) return;

    const timer = setTimeout(() => {
      syncSimulation();
    }, 450);

    return () => {
      clearTimeout(timer);
      syncSeqRef.current += 1;
    };
  }, [machineId, input, syncSimulation]);

  const handleStep = async () => {
    if (!simulationId) return;
    setError(null);
    setIsStepping(true);
    try {
      const snap = await api.step(simulationId);
      applySnapshot(snap);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsStepping(false);
    }
  };

  const runLoop = useCallback(async () => {
    if (!simulationId) return;
    setIsRunning(true);

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

  const handlePause = () => {
    if (runRef.current) {
      runRef.current.paused = true;
      clearTimeout(runRef.current.timer);
    }
    setIsRunning(false);
  };

  const handleRun = () => {
    if (!simulationId || isRunning) return;
    runLoop();
  };

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

      {error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <SectionBlock
        id="section-config"
        title="1. Configuración"
        description="Elija la máquina y escriba la cadena: la cinta y el estado se actualizan solos al cambiar la entrada."
      >
        <div className="row row--config">
          <MachineSelector
            machines={machines}
            value={machineId}
            onChange={setMachineId}
            disabled={isRunning}
          />
          <InputString
            value={input}
            onChange={setInput}
            onSubmit={syncSimulation}
            disabled={isRunning}
            alphabetSymbols={alphabetSymbols}
          />
        </div>
        {machineDetail?.description && (
          <p className="machine-description">
            <span className="inline-label">Descripción del problema: </span>
            <RichText text={machineDetail.description} />
          </p>
        )}
        <MachineExamples
          examples={machineDetail?.examples ?? machines.find((m) => m.id === machineId)?.examples}
          onSelect={setInput}
          disabled={isRunning}
        />
      </SectionBlock>

      <SectionBlock
        id="section-simulation"
        title="2. Simulación en vivo"
        description="Aquí ve la cinta (símbolos de Γ y cabezal), el estado de la máquina y la tabla δ con las reglas. La fila naranja es el estado actual."
        className="section-simulation"
      >
        <div className="sim-workspace">
          <div className="sim-paired">
            <h3 className="sim-paired__heading">Estado de la máquina</h3>
            <h3 id="delta-panel-title" className="sim-paired__heading">
              Tabla de transiciones (<span className="math-greek">δ</span>)
            </h3>
            <div className="sim-paired__left">
              <StatusPanel
                snapshot={snapshot}
                isRunning={isRunning}
                isStepping={isStepping}
                blank={machineDetail?.blank ?? '_'}
              />
              <div className="sim-tape-block">
                <h3 className="sim-tape-block__title">
                  Cinta (<span className="math-greek">Γ</span>) y cabezal de lectura/escritura
                </h3>
                <TapeView
                  tape={snapshot?.tape}
                  headIndex={snapshot?.head_index ?? 0}
                  lastMove={lastMove}
                  step={snapshot?.step ?? 0}
                  blank={machineDetail?.blank ?? '_'}
                  inputString={input}
                  active={!!machineDetail}
                />
              </div>
              <div className="sim-controls-block">
                <h3 className="sim-controls-block__title">Controles de ejecución</h3>
                <ControlPanel
                  onRestart={syncSimulation}
                  onStep={handleStep}
                  onRun={handleRun}
                  onPause={handlePause}
                  isRunning={isRunning}
                  canStep={canStep}
                  hasSimulation={!!simulationId}
                  speed={speed}
                  onSpeedChange={setSpeed}
                />
              </div>
            </div>
            <aside className="sim-workspace__delta panel-inner" aria-labelledby="delta-panel-title">
              <TransitionTable machine={machineDetail} currentState={snapshot?.current_state} />
            </aside>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        id="section-history"
        title="3. Historial de pasos"
        description="Lista de cada paso ejecutado: estado alcanzado y transición δ aplicada (del más reciente al más antiguo)."
        className="section-history"
      >
        <StepHistory history={history} blank={machineDetail?.blank ?? '_'} />
      </SectionBlock>
    </div>
  );
}
