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
  const [syncedInput, setSyncedInput] = useState('');
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
  const alphabetSymbols = machineDetail?.input_alphabet ?? [];
  const canStep = simulationId && snapshot?.status === 'RUNNING';
  const lastMove = snapshot?.applied_transition?.move;
  const showPanels = Boolean(machineDetail);
  const previewTape = showPanels && input !== syncedInput;
  const isFinal = snapshot && FINISHED.has(snapshot.status);
  const resultTitle =
    snapshot?.status === 'ACCEPTED'
      ? 'Por qué se aceptó'
      : snapshot?.status === 'REJECTED'
        ? 'Por qué se rechazó'
        : 'Explicación';

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
    setInput('');
    setSyncedInput('');
    api
      .getMachine(machineId)
      .then(setMachineDetail)
      .catch((e) => setError(e.message));
  }, [machineId]);

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

      if (machineId === 'binary_palindrome') {
        const detail = await api.getMachine(machineId, input);
        if (seq === syncSeqRef.current) setMachineDetail(detail);
      }

      setSimulationId(snap.simulation_id);
      setSyncedInput(input);
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
    }, 200);

    return () => clearTimeout(timer);
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

      <SectionBlock
        id="section-simulator"
        title="Simulador"
        description="Elija la máquina y escriba la cadena: la simulación, la cinta y la tabla δ se actualizan automáticamente."
      >
        <div className="sim-layout">
          <aside className="sim-layout__setup panel-inner">
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
              error={error}
            />

            {snapshot && (
              <div className="sim-layout__status">
                <StatusPanel
                  snapshot={snapshot}
                  isRunning={isRunning}
                  isStepping={isStepping}
                  blank={machineDetail?.blank ?? '_'}
                  layout="stacked"
                  showResultMessage={false}
                />
              </div>
            )}

            {machineDetail?.description && (
              <p className="machine-description">
                <span className="inline-label">Problema: </span>
                <RichText text={machineDetail.description} />
              </p>
            )}

            <MachineExamples
              compact
              examples={machineDetail?.examples ?? machines.find((m) => m.id === machineId)?.examples}
              onSelect={setInput}
              disabled={isRunning}
            />
          </aside>

          <div className="sim-layout__run">
            {showPanels ? (
              <div className="sim-layout__viz">
                <section className="sim-layout__tape panel-inner" aria-label="Cinta y cabezal">
                  <h3 className="sim-layout__panel-title">
                    Cinta (<span className="math-greek">Γ</span>) y cabezal
                  </h3>
                  {isFinal && snapshot.result_message && !previewTape && (
                    <div className={`result-message result-message--above-tape status-${snapshot.status}`}>
                      <span className="result-message__title">{resultTitle}</span>
                      <div className="result-message__body">
                        <RichText text={snapshot.result_message} />
                      </div>
                    </div>
                  )}
                  <TapeView
                    tape={previewTape ? undefined : snapshot?.tape}
                    headIndex={previewTape ? 0 : (snapshot?.head_index ?? 0)}
                    lastMove={previewTape ? undefined : lastMove}
                    step={previewTape ? 0 : (snapshot?.step ?? 0)}
                    blank={machineDetail?.blank ?? '_'}
                    inputString={input}
                    active={showPanels}
                  />
                  {snapshot && (
                    <ControlPanel
                      compact
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
                  )}
                </section>

                <section
                  className="sim-layout__delta panel-inner"
                  aria-labelledby="delta-panel-title"
                >
                  <h3 id="delta-panel-title" className="sim-layout__panel-title">
                    Tabla de transiciones (<span className="math-greek">δ</span>)
                  </h3>
                  <TransitionTable machine={machineDetail} currentState={snapshot?.current_state} />
                </section>
              </div>
            ) : (
              <div className="sim-layout__placeholder panel-inner">
                <p className="sim-layout__placeholder-text">Seleccione una máquina para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      </SectionBlock>

      {snapshot && (
        <SectionBlock
          id="section-history"
          title="Historial de pasos"
          description="Cada paso ejecutado: estado y transición δ aplicada."
          className="section-history"
        >
          <StepHistory history={history} blank={machineDetail?.blank ?? '_'} />
        </SectionBlock>
      )}
    </div>
  );
}
