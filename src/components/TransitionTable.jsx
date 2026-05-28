import RichText from './RichText';
import {
  buildTransitionMatrix,
  formatDeltaCell,
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

/** Matriz δ: filas = estados, columnas = símbolos de Γ. */
export default function TransitionTable({ machine, currentState }) {
  const matrix = buildTransitionMatrix(machine);

  if (!matrix) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>Sin transiciones.</p>;
  }

  const { states, symbols, cells, blank } = matrix;

  return (
    <Box className="transition-panel">
      <Box className="table-wrap delta-matrix-wrap">
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
                        <span
                          className="empty-set"
                          title="Sin transición definida para este estado y símbolo"
                          aria-label="Sin transición"
                        >
                          <span className="empty-set-symbol" aria-hidden="true">
                            ∅
                          </span>
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
          <RichText text="Filas = estados $q_i$ · Columnas = símbolos $\\Gamma$ · " />
          <span className="empty-set-symbol empty-set-symbol--caption">∅</span>
          <RichText text=" = celda sin regla" />
        </p>
        {machine?.id === 'binary_palindrome' && (
          <p className="table-caption table-caption--hint">
            <strong>Palíndromo:</strong> q0 inicio · q1, q2, … ir al final de la cinta · q3a, q3b, …
            comparar extremos · q4 volver a la izquierda · q<sub>accept</sub> / q<sub>reject</sub> finales.
          </p>
        )}
      </Box>
    </Box>
  );
}
