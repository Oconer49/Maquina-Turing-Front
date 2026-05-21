import katex from 'katex';
import 'katex/dist/katex.min.css';

const MATH_COMMANDS = new Set([
  'Sigma',
  'Gamma',
  'Delta',
  'delta',
  'varepsilon',
  'sqcup',
  'emptyset',
  'rightarrow',
  'geq',
  'text',
]);

/** Corrige $Sigma$ → $\\Sigma$ y doble escape \\Sigma → \\Sigma. */
function normalizeDollarSegment(inner) {
  let m = inner.trim();
  if (/^[A-Za-z]+$/.test(m) && MATH_COMMANDS.has(m)) {
    return `\\${m}`;
  }
  if (/^\\{2,}([A-Za-z]+)/.test(m)) {
    m = m.replace(/^\\{2,}/, '\\');
  }
  return m;
}

/** Convierte texto plano (Σ, δ, ε) en segmentos $...$ para KaTeX. */
function prepareMathText(text) {
  if (!text) return '';

  let t = text.replace(/\$([^$]+)\$/g, (_, inner) => `$${normalizeDollarSegment(inner)}$`);

  if (!t.includes('$')) {
    t = t
      .replace(/\{0,1\}/g, '$\\{0,1\\}$')
      .replace(/\{a,b\}/gi, '$\\{a,b\\}$')
      .replace(/a\^n\s*b\^n/gi, '$a^{n}b^{n}$')
      .replace(/1\^\(n\+1\)/g, '$1^{n+1}$')
      .replace(/1\^n/g, '$1^{n}$')
      .replace(/a\^n/g, '$a^{n}$')
      .replace(/b\^n/g, '$b^{n}$')
      .replace(/n >= 1/g, '$n \\geq 1$')
      .replace(/n ≥ 1/g, '$n \\geq 1$')
      .replace(/δ\(/g, '$\\delta$(')
      .replace(/δ/g, '$\\delta$')
      .replace(/Σ/g, '$\\Sigma$')
      .replace(/Γ/g, '$\\Gamma$')
      .replace(/ε/g, '$\\varepsilon$');
  }

  return t;
}

function renderMath(math) {
  return katex.renderToString(math, {
    displayMode: false,
    throwOnError: false,
    strict: 'ignore',
  });
}

/** Renderiza texto mezclado: partes normales + fórmulas inline con KaTeX. */
export default function RichText({ text, className = '' }) {
  if (!text) return null;

  const prepared = prepareMathText(text);
  const parts = prepared.split(/(\$[^$]+\$)/g).filter((p) => p.length > 0);

  return (
    <span className={`rich-text ${className}`.trim()}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = normalizeDollarSegment(part.slice(1, -1));
          return (
            <span
              key={i}
              className="math-inline"
              dangerouslySetInnerHTML={{ __html: renderMath(math) }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
