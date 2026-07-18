import { useId, useRef } from "react";
import { CircleHelp } from "lucide-react";
import { INVESTMENT_HELP } from "./investmentHelpContent";

export default function TechnicalHelp({ concept, label = "¿Qué significa?" }) {
  const detailsRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const content = INVESTMENT_HELP[concept];
  if (!content) return null;

  const close = () => detailsRef.current?.close();

  return (
    <span className="technical-help">
      <button
        ref={triggerRef}
        type="button"
        className="technical-help__trigger"
        onClick={() => detailsRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={label}
        title={label}
      >
        <CircleHelp size={17} aria-hidden="true" />
      </button>
      <dialog
        ref={detailsRef}
        className="technical-help__dialog"
        aria-labelledby={titleId}
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="technical-help__content">
          <div className="technical-help__header">
            <h2 id={titleId}>{label}</h2>
            <button type="button" className="technical-help__icon-close" onClick={close} aria-label="Cerrar explicación">×</button>
          </div>
          <p>{content.simple}</p>
          <dl>
            <div><dt>Nombre técnico</dt><dd>{content.technical}</dd></div>
            <div><dt>Cómo se calcula</dt><dd>{content.formula}</dd></div>
            <div><dt>Qué incluye</dt><dd>{content.includes}</dd></div>
            <div><dt>Qué no incluye</dt><dd>{content.excludes}</dd></div>
            <div><dt>Ten presente</dt><dd>{content.warning}</dd></div>
          </dl>
        </div>
      </dialog>
    </span>
  );
}
