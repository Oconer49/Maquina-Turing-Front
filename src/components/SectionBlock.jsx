import RichText from './RichText';

/** Bloque de pantalla con título y descripción para el usuario. */
export default function SectionBlock({ id, title, description, children, className = '' }) {
  return (
    <section
      className={`labeled-section panel ${className}`.trim()}
      aria-labelledby={id}
    >
      <header className="section-header">
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {description && (
          <p className="section-desc">
            <RichText text={description} />
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
