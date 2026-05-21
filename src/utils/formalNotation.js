/** Convierte q0, q_accept → notación LaTeX q_0, q_{accept}. */
export function stateToLatex(state) {
  if (!state) return '';
  const m = String(state).match(/^q_?(.+)$/i);
  if (!m) return `\\text{${String(state).replace(/_/g, '\\_')}}`;
  const body = m[1];
  if (/^\d+$/.test(body)) return `q_{${body}}`;
  if (/^[0-9]+[a-z]*$/i.test(body)) return `q_{${body}}`;
  return `q_{\\text{${body.replace(/_/g, '\\_')}}}`;
}

/** Convierte un símbolo de cinta a LaTeX (· para blanco, igual que en la cinta). */
export function symbolToLatex(symbol, blank = '_') {
  if (symbol === blank || symbol === '_') return '\\text{·}';
  if (symbol === '0' || symbol === '1') return symbol;
  if (/^[a-z]$/i.test(symbol)) return symbol;
  return `\\text{${String(symbol).replace(/_/g, '\\_')}}`;
}

/** Arma la cadena δ(q,a) = (q',b,R) para historial y panel (sin flechas). */
export function formatDeltaTransition(t, blank = '_') {
  const from = t.from ?? t.from_state;
  const read = symbolToLatex(t.read, blank);
  const write = symbolToLatex(t.write, blank);
  return `$\\delta(${stateToLatex(from)}, ${read}) = (${stateToLatex(t.to)}, ${write}, ${t.move})$`;
}

/** Formato compacto (q',b,R) para una celda de la tabla δ. */
export function formatDeltaCell(t, blank = '_') {
  const write = symbolToLatex(t.write, blank);
  return `$(${stateToLatex(t.to)}, ${write}, ${t.move})$`;
}

/** Indexa transiciones por (estado, símbolo) para armar la matriz. */
export function buildTransitionMatrix(machine) {
  if (!machine?.transitions?.length) return null;

  const blank = machine.blank ?? '_';
  const states = machine.states ?? [];
  const symbols = machine.tape_alphabet ?? [];

  const cells = new Map();
  for (const t of machine.transitions) {
    const from = t.from ?? t.from_state;
    cells.set(`${from}\0${t.read}`, t);
  }

  return { states, symbols, cells, blank };
}

/** Lista de estados como conjunto LaTeX {q_0, q_1, ...}. */
export function formatStateSet(states) {
  if (!states?.length) return '\\emptyset';
  return `\\{${states.map(stateToLatex).join(', ')}\\}`;
}

/** Lista de símbolos como conjunto LaTeX {0, 1, ⊔}. */
export function formatSymbolSet(symbols, blank = '_') {
  if (!symbols?.length) return '\\emptyset';
  return `\\{${symbols.map((s) => symbolToLatex(s, blank)).join(', ')}\\}`;
}
