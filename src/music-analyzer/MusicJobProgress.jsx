import { Ban, LoaderCircle } from "lucide-react";
import { normalizePercentage } from "../platform/local-agent/contracts.js";
import { stateLabel } from "./formatters.js";

export default function MusicJobProgress({ job, busy, onCancel }) {
  const percentage = normalizePercentage(job.percentage);
  return <section className="music-panel music-progress" aria-live="polite">
    <div className="music-section-heading"><div><p className="eyebrow">Paso 4 · {stateLabel(job.state)}</p><h2>{job.message}</h2></div><strong>{Math.round(percentage)}%</strong></div>
    <progress max="100" value={percentage} />
    {job.phasePercentage != null && <div className="music-phase"><span>Avance de la fase</span><progress max="100" value={normalizePercentage(job.phasePercentage)} /></div>}
    {!(["completed", "cancelled", "failed"].includes(job.state)) && <button type="button" className="button button--danger" onClick={onCancel} disabled={busy || job.state === "cancelling"}>{job.state === "cancelling" ? <LoaderCircle className="spin" size={16} /> : <Ban size={16} />} Cancelar</button>}
  </section>;
}
