import RichText from './RichText';
import {
  buildTransitionMatrix,
  formatDeltaCell,
  formatDeltaTransition,
  formatStateSet,
  formatSymbolSet,
  stateToLatex,
  symbolToLatex,
} from '../utils/formalNotation';

const Box = 'div';

/** Encabezado de columna: un símbolo de Γ en LaTeX. */
function SymbolHeader({ symbol, blank }) {
  return (
    <th className="delta-matrix__col-head">
      <RichText text={`$${symbolToLatex(symbol, blank)}$`} />
    </th>
  );
}

/** Etiqueta de fila: estado q_i y badges inicio / F / R. */
function StateRowLabel({ state, machine }) {
  const isInitial = state === machine.initial_state;
  const isAccept = machine.accept_states?.includes(state);
  const isReject = machine.reject_states?.includes(state);
  const tags = [];
  if (isInitial) tags.push('inicio');
  if (isAccept) tags.push('F');
  if (isReject) tags.push('R');

  return (
    <th scope="row" className="delta-matrix__row-head">
      <RichText text={`$${stateToLatex(state)}$`} />
      {tags.length > 0 && (
        <span className="state-tags">
          {tags.map((tag) => (
            <span key={tag} className="state-tag">
              {tag}
            </span>
          ))}
        </span>
      )}
    </th>
  );
}

/** Bloque M = (Q, Σ, Γ, δ, q₀, B, F) como en el cuaderno. */
function MachineDefinition({ machine }) {
  if (!machine) return null;
  const blank = machine.blank ?? '_';

  const lines = [
    `$M = (Q, \\Sigma, \\Gamma, \\delta, q_0, B, F)$`,
    `$Q = ${formatStateSet(machine.states)}$`,
    `$\\Sigma = ${formatSymbolSet(machine.input_alphabet, blank)}$`,
    `$\\Gamma = ${formatSymbolSet(machine.tape_alphabet, blank)}$`,
    `$q_0 = ${stateToLatex(machine.initial_state)}$`,
    `$B = ${symbolToLatex(blank, blank)}$`,
    `$F = ${formatStateSet(machine.accept_states)}$`,
  ];

  return (
    <Box className="machine-definition">
      {lines.map((line, i) => (
        <Box key={i} className="machine-definition__line">
          <RichText text={line} />
        </Box>
      ))}
    </Box>
  );
}

/** Tabla matriz δ + lista de transiciones; resalta la fila del estado actual. */
export default function TransitionTable({ machine, currentState }) {
  const matrix = buildTransitionMatrix(machine);

  if (!matrix) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>Sin transiciones.</p>;
  }

  const { states, symbols, cells, blank } = matrix;
  const transitions = machine.transitions ?? [];

  return (
    <Box className="transition-panel">
      <MachineDefinition machine={machine} />

      <Box className="table-wrap delta-matrix-wrap scroll-sync">
        <table className="delta-matrix">
          <thead>
            <tr>
              <th className="delta-matrix__corner">
                <RichText text="$\\delta$" />
              </th>
              {symbols.map((sym) => (
                <SymbolHeader key={sym} symbol={sym} blank={blank} />
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map((state) => (
              <tr
                key={state}
                className={currentState === state ? 'delta-matrix__row--active' : undefined}
              >
                <StateRowLabel state={state} machine={machine} />
                {symbols.map((sym) => {
                  const t = cells.get(`${state}\0${sym}`);
                  return (
                    <td key={sym} className="delta-matrix__cell">
                      {t ? (
                        <RichText text={formatDeltaCell(t, blank)} />
                      ) : (
                        <span className="empty-set" title="Sin transición">
                          <RichText text="$\\emptyset$" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="table-caption">
          <RichText text="Tabla de $\\delta$: filas = estados $q_i$, columnas = símbolos de $\\Gamma$" />
        </p>
      </Box>

      <details className="delta-list-details">
        <summary>
          <RichText text="Función $\\delta$ (lista de transiciones)" />
        </summary>
        <ul className="delta-list">
          {transitions.map((t, i) => (
            <li key={i}>
              <RichText text={formatDeltaTransition(t, blank)} />
            </li>
          ))}
        </ul>
      </details>
    </Box>
  );
}
