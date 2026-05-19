import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/** Convierte texto plano (Σ, δ, a^n) en fragmentos con $...$ para KaTeX. */
function prepareMathText(text) {
  if (!text || text.includes('$')) return text || '';

  return text
    .replace(/\{0,1\}/g, '$\\{0,1\\}$')
    .replace(/\{a,b\}/gi, '$\\{a,b\\}$')
    .replace(/a\^n b\^n/gi, '$a^{n}b^{n}$')
    .replace(/1\^\(n\+1\)/g, '$1^{n+1}$')
    .replace(/1\^n/g, '$1^{n}$')
    .replace(/a\^n/g, '$a^{n}$')
    .replace(/b\^n/g, '$b^{n}$')
    .replace(/n >= 1/g, '$n \\geq 1$')
    .replace(/n ≥ 1/g, '$n \\geq 1$')
    .replace(/δ\(/g, '$\\delta$(')
    .replace(/Σ/g, '$\\Sigma$')
    .replace(/Γ/g, '$\\Gamma$');
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
          const math = part.slice(1, -1);
          try {
            return (
              <span key={i} className="math-inline">
                <InlineMath math={math} />
              </span>
            );
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
