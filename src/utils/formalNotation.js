/** Nombres antiguos del generador → notación de clase (q1, q3a, …). */
export function normalizeStateId(state) {
  if (!state) return state;
  const s = String(state);
  const scan = s.match(/^q_scan_(\d+)$/i);
  if (scan) return `q${Number(scan[1]) + 1}`;
  const match = s.match(/^q_match_(\d+)$/i);
  if (match) return `q3${String.fromCharCode(97 + Number(match[1]))}`;
  return s;
}

/** Orden de filas en la tabla δ: q0, q1…, q3a…, q4, aceptación/rechazo. */
export function sortStatesForDisplay(states) {
  const key = (state) => {
    const id = normalizeStateId(state);
    if (id === 'q0') return [0, 0, ''];
    if (id === 'q4') return [40, 0, ''];
    if (id === 'q_accept') return [90, 0, ''];
    if (id === 'q_reject') return [91, 0, ''];
    const m3 = id.match(/^q3([a-z]+)$/i);
    if (m3) return [35, m3[1].charCodeAt(0), m3[1]];
    const m = id.match(/^q(\d+)$/i);
    if (m) {
      const num = Number(m[1]);
      if (num >= 5) return [30 + num - 4, 0, ''];
      return [num, 0, ''];
    }
    return [50, 0, id];
  };
  return [...states].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < 3; i += 1) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });
}

/** Convierte q0, q_accept → notación LaTeX q_0, q_{accept}. */
export function stateToLatex(state) {
  if (!state) return '';
  const m = String(normalizeStateId(state)).match(/^q_?(.+)$/i);
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
  const states = sortStatesForDisplay(machine.states ?? []);
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
