import { useEffect, useId, useRef, useState } from 'react';
import RichText from './RichText';

/** Selector de máquina con nombres renderizados como la descripción (KaTeX). */
export default function MachineSelector({ machines, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const selected = machines.find((m) => m.id === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="field machine-select" ref={rootRef}>
      <label id={`${listId}-label`}>Máquina a simular</label>
      <button
        type="button"
        id="machine"
        className="machine-select__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className="machine-select__value">
          {selected ? (
            <RichText text={selected.name} />
          ) : (
            <span className="machine-select__placeholder">Seleccione una máquina…</span>
          )}
        </span>
        <span className="machine-select__chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul className="machine-select__list" role="listbox" aria-labelledby={`${listId}-label`}>
          {machines.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                role="option"
                aria-selected={m.id === value}
                className={m.id === value ? 'machine-select__option is-selected' : 'machine-select__option'}
                onClick={() => pick(m.id)}
              >
                <RichText text={m.name} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
