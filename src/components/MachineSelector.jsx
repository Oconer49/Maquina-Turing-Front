/** Desplegable para elegir la máquina preset a simular. */
export default function MachineSelector({ machines, value, onChange, disabled }) {
  return (
    <div className="field">
      <label htmlFor="machine">Máquina</label>
      <select
        id="machine"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Seleccione una máquina…</option>
        {machines.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
