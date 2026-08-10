import { AlertTriangle } from "lucide-react";

export default function AiRequestErrorDialog({ message, onClose }) {
  if (!message) return null;
  const outputLimit = /límite de salida|Máximo de salida/i.test(message);
  const timeout = /no terminó la respuesta después de \d+ minutos/i.test(message);
  return <div className="studio-modal" role="alertdialog" aria-modal="true" aria-labelledby="ai-request-error-title" aria-describedby="ai-request-error-message"><div className="studio-modal__card studio-status-dialog is-error"><p className="studio-kicker"><AlertTriangle size={15} /> Atención</p><h2 id="ai-request-error-title">{outputLimit ? "La respuesta necesita más espacio" : timeout ? "La generación tardó más de lo permitido" : "No se pudo completar la solicitud"}</h2><p id="ai-request-error-message">{message}</p>{outputLimit && <div className="studio-provider-info"><strong>Debes ampliar la salida</strong><p>La entrada controla cuánto texto recibe el modelo. La salida controla cuánto puede responder. En este caso, deja la entrada como está.</p></div>}{timeout && <div className="studio-provider-info"><strong>Qué puedes hacer ahora</strong><p>Si la solicitud es grande, reduce primero “Máximo de entrada” o “Máximo de salida”. Si el modelo sí está trabajando y solo necesita más tiempo, aumenta “Tiempo máximo de generación” en Configuración → IA y vuelve a intentarlo.</p></div>}<div className="studio-row"><button type="button" className="studio-button" autoFocus onClick={onClose}>Entendido</button></div></div></div>;
}
