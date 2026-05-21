/** Construye la cinta visible: rellena con blancos y coloca la cadena de entrada. */
export function buildDisplayTape(tape, headIndex, blank = '_', options = {}) {
  const {
    minEachSide = 10,
    minTotal = 21,
    targetCount = null,
    inputString = '',
    previewInput = false,
  } = options;

  if (headIndex == null) return [];

  const symbolAt = new Map();
  if (tape?.length) {
    for (const c of tape) {
      symbolAt.set(c.index, c.symbol);
    }
  }

  if (previewInput && inputString) {
    for (let i = 0; i < inputString.length; i += 1) {
      symbolAt.set(i, inputString[i]);
    }
  }

  const nonBlank = [...symbolAt.entries()]
    .filter(([, sym]) => sym !== blank)
    .map(([idx]) => idx);

  let lo = headIndex - minEachSide;
  let hi = headIndex + minEachSide;

  if (nonBlank.length) {
    lo = Math.min(lo, ...nonBlank) - 2;
    hi = Math.max(hi, ...nonBlank, inputString.length - 1) + 2;
  } else if (inputString.length > 0) {
    hi = Math.max(hi, inputString.length - 1 + minEachSide);
  }

  let count = hi - lo + 1;
  const desired = Math.max(minTotal, targetCount ?? 0);
  if (count < desired) {
    const extra = desired - count;
    lo -= Math.floor(extra / 2);
    hi += Math.ceil(extra / 2);
    count = hi - lo + 1;
  }

  const cells = [];
  for (let i = lo; i <= hi; i += 1) {
    cells.push({
      index: i,
      symbol: symbolAt.has(i) ? symbolAt.get(i) : blank,
    });
  }
  return cells;
}

/** @deprecated Usar buildDisplayTape */
export function compactTapeCells(tape, headIndex, blank = '_', pad = 2, viewRadius = 14) {
  return buildDisplayTape(tape, headIndex, blank, {
    minEachSide: Math.min(pad + viewRadius, viewRadius),
    minTotal: viewRadius * 2 + 1,
  });
}
