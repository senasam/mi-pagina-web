import { AlertTriangle } from "lucide-react";

export default function AiRequestErrorDialog({ message, onClose }) {
  if (!message) return null;
  const outputLimit = /límite de salida|Máximo de salida/i.test(message);
  return <div className="studio-modal" role="alertdialog" aria-modal="true" aria-labelledby="ai-request-error-title" aria-describedby="ai-request-error-message"><div className="studio-modal__card studio-status-dialog is-error"><p className="studio-kicker"><AlertTriangle size={15} /> Atención</p><h2 id="ai-request-error-title">{outputLimit ? "La respuesta necesita más espacio" : "No se pudo completar la solicitud"}</h2><p id="ai-request-error-message">{message}</p>{outputLimit && <div className="studio-provider-info"><strong>Debes ampliar la salida</strong><p>La entrada controla cuánto texto recibe el modelo. La salida controla cuánto puede responder. En este caso, deja la entrada como está.</p></div>}<div className="studio-row"><button type="button" className="studio-button" autoFocus onClick={onClose}>Entendido</button></div></div></div>;
}
